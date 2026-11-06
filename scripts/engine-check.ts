// Runs every repertoire move through Stockfish and flags moves that lose evaluation.
// Usage: npm run engine-check [-- --depth 18 --white]
//   --depth N   search depth (default 16)
//   --white     also report questionable White moves (by default only your side's moves are checked)
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createRequire } from 'node:module';
import { cpus } from 'node:os';
import { buildRepertoire } from '../src/lib/repertoire.ts';
import { caroKann } from '../src/data/caroKann.ts';

const require = createRequire(import.meta.url);
const enginePath: string = require('stockfish').findEngine('single');

const args = process.argv.slice(2);
const depth = Number(args[args.indexOf('--depth') + 1]) || 16;
const checkWhite = args.includes('--white');

class Engine {
  proc: ChildProcessWithoutNullStreams;
  buf = '';
  waiters: ((line: string) => boolean)[] = [];
  constructor() {
    this.proc = spawn(process.execPath, [enginePath], { stdio: 'pipe' });
    this.proc.stdout.on('data', (d) => {
      this.buf += d.toString();
      const lines = this.buf.split('\n');
      this.buf = lines.pop()!;
      for (const l of lines) this.waiters = this.waiters.filter((w) => !w(l.trim()));
    });
  }
  send(cmd: string) {
    this.proc.stdin.write(cmd + '\n');
  }
  wait(pred: (l: string) => boolean): Promise<string> {
    return new Promise((res) => this.waiters.push((l) => (pred(l) ? (res(l), true) : false)));
  }
  async init() {
    this.send('uci');
    await this.wait((l) => l === 'uciok');
    this.send('setoption name Hash value 64');
    this.send('isready');
    await this.wait((l) => l === 'readyok');
  }
  /** Score in centipawns from the side to move's point of view. */
  async evaluate(fen: string, searchmove?: string): Promise<{ cp: number; pv: string[] }> {
    let last = { cp: 0, pv: [] as string[] };
    const done = this.wait((l) => {
      if (l.startsWith('info') && l.includes(' pv ')) {
        const m = / score (cp|mate) (-?\d+)/.exec(l);
        if (m) {
          const v = Number(m[2]);
          last = {
            cp: m[1] === 'cp' ? v : Math.sign(v) * (100000 - Math.abs(v)),
            pv: l.split(' pv ')[1].split(' '),
          };
        }
      }
      return l.startsWith('bestmove');
    });
    this.send(`position fen ${fen}`);
    this.send(`go depth ${depth}${searchmove ? ` searchmoves ${searchmove}` : ''}`);
    await done;
    return last;
  }
  quit() {
    this.send('quit');
  }
}

const fmt = (cp: number) => (Math.abs(cp) > 50000 ? (cp > 0 ? '#' : '-#') : (cp / 100).toFixed(2));

const rep = buildRepertoire(caroKann);
if (rep.errors.length) {
  console.error(rep.errors.join('\n'));
  process.exit(1);
}
const mySide = rep.opening.side === 'white' ? 'w' : 'b';

interface Job {
  fen: string;
  san: string;
  uci: string;
  color: 'w' | 'b';
  lines: string[];
  label: string;
  book: boolean;
}
const jobs: Job[] = [];
for (const node of rep.nodes.values()) {
  const color = node.fen.split(' ')[1] as 'w' | 'b';
  if (color !== mySide && !checkWhite) continue;
  const moveNo = node.fen.split(' ')[5];
  for (const e of node.moves.values()) {
    jobs.push({
      fen: node.fen,
      san: e.san,
      uci: e.from + e.to,
      color,
      lines: [...e.lineIds],
      label: `${moveNo}${color === 'w' ? '.' : '...'}${e.san}`,
      book: !!e.book,
    });
  }
}

interface Result extends Job {
  best: number;
  played: number;
  bestPv: string[];
}
const results: Result[] = [];
const workers = Math.max(1, Math.min(cpus().length, 6));
console.log(`Checking ${jobs.length} moves at depth ${depth} with ${workers} engines…`);
let next = 0;
await Promise.all(
  Array.from({ length: workers }, async () => {
    const eng = new Engine();
    await eng.init();
    while (next < jobs.length) {
      const job = jobs[next++];
      const best = await eng.evaluate(job.fen);
      const played = best.pv[0] === job.uci ? best : await eng.evaluate(job.fen, job.uci);
      results.push({ ...job, best: best.cp, played: played.cp, bestPv: best.pv });
      process.stdout.write('.');
    }
    eng.quit();
  }),
);
console.log('\n');

// Policy: the repertoire prefers established, human-practical lines. The engine is
// only an error check. A loss of a pawn or more is almost always a real mistake;
// smaller differences are listed for review and are usually fine to keep.
const withLoss = results.map((r) => ({ ...r, loss: r.best - r.played }));
const mine = (r: Result) => r.color === mySide;
const errors = withLoss.filter((r) => !r.book && r.loss >= (mine(r) ? 100 : 200)).sort((a, b) => b.loss - a.loss);
const review = withLoss
  .filter((r) => !r.book && r.loss >= (mine(r) ? 40 : 100) && !errors.includes(r))
  .sort((a, b) => b.loss - a.loss);
const kept = withLoss.filter((r) => r.book && r.loss >= 40);

const show = (tag: string, r: (typeof withLoss)[number]) =>
  console.log(
    `${tag} ${r.label.padEnd(12)} -${(r.loss / 100).toFixed(2)}  (played ${fmt(r.played)}, engine prefers ${r.bestPv[0]} ${fmt(r.best)})  [${r.lines.join(', ')}]`,
  );
if (errors.length) console.log('Likely mistakes (fix these):');
errors.forEach((r) => show('  BAD   ', r));
if (review.length) console.log('\nEngine prefers something else (fine to keep if it is established theory):');
review.forEach((r) => show('  REVIEW', r));
if (kept.length) console.log('\nMarked [book], kept by choice:');
kept.forEach((r) => show('  BOOK  ', r));
console.log(`\n${errors.length} likely mistakes, ${review.length} to review, ${kept.length} kept by choice, of ${results.length} moves (scores from the mover's point of view).`);

// Where each line ends up: small per-move losses can add up.
console.log('\nFinal position of each line (from your side\'s point of view):');
const endEngine = new Engine();
await endEngine.init();
for (const line of rep.lines) {
  const fen = line.moves[line.moves.length - 1].fenAfter;
  const r = await endEngine.evaluate(fen);
  const mine2 = (fen.split(' ')[1] === mySide ? 1 : -1) * r.cp;
  const tag = mine2 <= -80 ? 'WORSE ' : mine2 >= 80 ? 'BETTER' : '      ';
  console.log(`  ${tag} ${fmt(mine2).padStart(6)}  ${line.id}`);
}
endEngine.quit();
process.exitCode = errors.filter(mine).length ? 1 : 0;
