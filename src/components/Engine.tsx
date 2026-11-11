import { Chess } from 'chess.js';
import { formatScore, numberedLine, pvToSan, type EngineLine } from '../lib/engine.ts';

/** What the engine thinks of a non-repertoire move you tried in a drill. */
export type MoveVerdict =
  | { id: number; tried: string; status: 'pending' }
  | { id: number; tried: string; status: 'done'; loss: number; reply: string }
  | { id: number; tried: string; status: 'error' };

export type Severity = 'ok' | 'meh' | 'bad';

/** How bad a move is, from the centipawns it loses compared with the repertoire move. */
export function severity(loss: number): Severity {
  if (loss <= 30) return 'ok';
  if (loss <= 100) return 'meh';
  return 'bad';
}

/** One plain sentence about the engine's view of a move you tried. */
export function verdictText(verdict: MoveVerdict): string {
  if (verdict.status === 'pending') return 'Stockfish is checking it…';
  if (verdict.status === 'error') return 'Stockfish couldn’t check this move.';
  const pawns = (Math.max(0, verdict.loss) / 100).toFixed(1);
  if (verdict.loss > 5000) return 'Stockfish says it loses by force.';
  switch (severity(verdict.loss)) {
    case 'ok':
      return 'Stockfish rates it about as highly as your repertoire move, so it’s fine, just not what you prepared.';
    case 'meh':
      return `Stockfish rates it a little worse than your repertoire move (about ${pawns} pawns).`;
    default:
      return `Stockfish rates it as a mistake: it costs about ${pawns} pawns.`;
  }
}

/** White's winning chances as a 0–100 share of the bar. */
function whiteShare(l?: EngineLine) {
  if (!l) return 50;
  if (l.mate !== undefined) return l.mate > 0 ? 100 : 0;
  return 50 + 50 * (2 / (1 + Math.exp(-0.004 * l.cp)) - 1);
}

export function EvalBar({ lines, orientation }: { lines: EngineLine[]; orientation: 'white' | 'black' }) {
  const top = lines[0];
  const white = whiteShare(top);
  const whiteOnTop = orientation === 'black';
  return (
    <div
      className={`evalbar ${whiteOnTop ? 'white-top' : ''}`}
      title="Engine evaluation from White's point of view"
      aria-label={top ? `Evaluation ${formatScore(top)}` : 'Evaluating'}
    >
      <div className="evalbar-white" style={{ height: `${white}%` }} />
      <span className={`evalbar-label ${white >= 50 ? 'on-white' : 'on-black'}`}>{top ? formatScore(top) : ''}</span>
    </div>
  );
}

export function EnginePanel({ fen, lines, hidden }: { fen: string; lines: EngineLine[]; hidden: boolean }) {
  const game = new Chess(fen);
  return (
    <div className="card engine">
      <div className="card-head">
        <b>Stockfish</b>
        {lines[0] && !hidden && <span className="muted small">depth {lines[0].depth}</span>}
      </div>
      {game.isGameOver() ? (
        <p className="muted small">The game is over.</p>
      ) : hidden ? (
        <p className="muted small">Engine lines stay hidden until you’ve played your move.</p>
      ) : lines.length === 0 ? (
        <p className="muted small">Thinking…</p>
      ) : (
        <ol className="engine-lines">
          {lines.map((l) => (
            <li key={l.multipv}>
              <span className="score">{formatScore(l)}</span>
              <span>{numberedLine(fen, pvToSan(fen, l.pv, 8))}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
