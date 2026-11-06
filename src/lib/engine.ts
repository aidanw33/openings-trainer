// Thin wrapper around the Stockfish web worker (UCI over postMessage).
import { Chess } from 'chess.js';

export interface EngineLine {
  multipv: number;
  depth: number;
  /** Score from White's point of view, in centipawns. Mates are mapped to ±(100000 - plies). */
  cp: number;
  mate?: number;
  /** Principal variation in UCI notation. */
  pv: string[];
}

export interface AnalyseOptions {
  depth?: number;
  movetime?: number;
  multipv?: number;
  searchmoves?: string[];
  /** 0–20; 20 is full strength. */
  skill?: number;
  onInfo?: (lines: EngineLine[]) => void;
}

export interface AnalyseResult {
  lines: EngineLine[];
  bestmove: string | null;
}

interface Job {
  fen: string;
  opts: AnalyseOptions;
  resolve: (r: AnalyseResult | null) => void;
  cancelled: boolean;
}

const ENGINE_URL = `${import.meta.env.BASE_URL}engine/stockfish.js`;

/**
 * One Stockfish worker. Jobs run one at a time; starting a new job with `latestOnly`
 * cancels whatever is running or queued (it resolves with null).
 */
export class Engine {
  private worker: Worker;
  private ready: Promise<void>;
  private current: Job | null = null;
  private queue: Job[] = [];
  private lines = new Map<number, EngineLine>();
  private listeners: ((l: string) => void)[] = [];
  failed = false;

  constructor() {
    this.worker = new Worker(ENGINE_URL);
    this.worker.onmessage = (e) => this.onLine(String(e.data));
    this.worker.onerror = () => {
      this.failed = true;
    };
    this.ready = new Promise((res) => {
      const l = (line: string) => {
        if (line === 'readyok') {
          this.listeners = this.listeners.filter((x) => x !== l);
          res();
        }
      };
      this.listeners.push(l);
    });
    this.send('uci');
    this.send('setoption name Hash value 32');
    this.send('isready');
  }

  private send(cmd: string) {
    this.worker.postMessage(cmd);
  }

  private onLine(line: string) {
    for (const l of [...this.listeners]) l(line);
    const job = this.current;
    if (!job) return;
    if (line.startsWith('info') && line.includes(' pv ')) {
      const depth = Number(/ depth (\d+)/.exec(line)?.[1] ?? 0);
      const multipv = Number(/ multipv (\d+)/.exec(line)?.[1] ?? 1);
      const sc = / score (cp|mate) (-?\d+)/.exec(line);
      if (!sc || / (upperbound|lowerbound)/.test(line)) return;
      const v = Number(sc[2]);
      const whiteToMove = job.fen.split(' ')[1] === 'w';
      const sign = whiteToMove ? 1 : -1;
      const cp = sc[1] === 'cp' ? v : Math.sign(v || 1) * (100000 - Math.abs(v));
      this.lines.set(multipv, {
        multipv,
        depth,
        cp: cp * sign,
        mate: sc[1] === 'mate' ? v * sign : undefined,
        pv: line.split(' pv ')[1].trim().split(' '),
      });
      if (!job.cancelled && job.opts.onInfo) job.opts.onInfo(this.sortedLines());
    } else if (line.startsWith('bestmove')) {
      const best = line.split(' ')[1];
      const result = { lines: this.sortedLines(), bestmove: best && best !== '(none)' ? best : null };
      this.current = null;
      job.resolve(job.cancelled ? null : result);
      this.pump();
    }
  }

  private sortedLines() {
    return [...this.lines.values()].sort((a, b) => a.multipv - b.multipv);
  }

  private async pump() {
    if (this.current) return;
    let job: Job | undefined;
    while ((job = this.queue.shift())) {
      if (!job.cancelled) break;
      job.resolve(null);
    }
    if (!job) return;
    this.current = job;
    this.lines = new Map();
    await this.ready;
    const { opts } = job;
    this.send(`setoption name Skill Level value ${opts.skill ?? 20}`);
    this.send(`setoption name MultiPV value ${opts.multipv ?? 1}`);
    this.send(`position fen ${job.fen}`);
    let go = 'go';
    if (opts.depth) go += ` depth ${opts.depth}`;
    if (opts.movetime) go += ` movetime ${opts.movetime}`;
    if (!opts.depth && !opts.movetime) go += ' depth 16';
    if (opts.searchmoves?.length) go += ` searchmoves ${opts.searchmoves.join(' ')}`;
    this.send(go);
  }

  /** Queue an analysis. With latestOnly, any running/queued job is cancelled first. */
  analyse(fen: string, opts: AnalyseOptions = {}, latestOnly = false): Promise<AnalyseResult | null> {
    if (latestOnly) this.cancelAll();
    return new Promise((resolve) => {
      this.queue.push({ fen, opts, resolve, cancelled: false });
      this.pump();
    });
  }

  cancelAll() {
    for (const j of this.queue) j.cancelled = true;
    if (this.current) {
      this.current.cancelled = true;
      this.send('stop');
    }
  }

  terminate() {
    this.worker.terminate();
  }
}

/** Format a White-POV score for display. */
export function formatScore(l: Pick<EngineLine, 'cp' | 'mate'>): string {
  if (l.mate !== undefined) return `${l.mate > 0 ? '' : '-'}M${Math.abs(l.mate)}`;
  const v = l.cp / 100;
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}`;
}

/** Convert a UCI PV to SAN moves from a FEN. Stops at the first illegal move. */
export function pvToSan(fen: string, pv: string[], max = 8): string[] {
  const c = new Chess(fen);
  const out: string[] = [];
  for (const u of pv.slice(0, max)) {
    try {
      out.push(c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || 'q' }).san);
    } catch {
      break;
    }
  }
  return out;
}

/** Format SAN moves with move numbers, starting from the given FEN's side/move number. */
export function numberedLine(fen: string, sans: string[]): string {
  const parts = fen.split(' ');
  let n = Number(parts[5]);
  let white = parts[1] === 'w';
  return sans
    .map((s, i) => {
      const prefix = white ? `${n}.` : i === 0 ? `${n}...` : '';
      if (!white) n++;
      white = !white;
      return `${prefix}${s}`;
    })
    .join(' ');
}

let analysisEngine: Engine | null = null;
let taskEngine: Engine | null = null;
/** Engine for the live evaluation bar (always latest position only). */
export function getAnalysisEngine() {
  return (analysisEngine ??= new Engine());
}
/** Engine for move checks and playing moves, so they don't interrupt the eval bar. */
export function getTaskEngine() {
  return (taskEngine ??= new Engine());
}
