import type { ReactNode } from 'react';
import type { Chess } from 'chess.js';
import type { Color } from '../lib/notation.ts';
import { LEVELS, type PlayMove } from '../state.ts';

export interface PlayGame {
  startFen: string;
  moves: PlayMove[];
  origin: string;
}

export function PlayPanel(props: {
  myColor: Color;
  play: PlayGame;
  game: Chess;
  thinking: boolean;
  level: number;
  onLevel: (l: number) => void;
  engine: ReactNode;
}) {
  const { myColor, play, game, thinking } = props;
  let status: string;
  let cls = 'info';
  if (game.isCheckmate()) {
    const youWon = game.turn() !== myColor;
    status = youWon ? 'Checkmate. You win!' : 'Checkmate. The engine wins this one.';
    cls = youWon ? 'good' : 'bad';
  } else if (game.isDraw()) {
    status = 'The game is drawn.';
    cls = 'warn';
  } else if (game.turn() === myColor) {
    status = game.inCheck() ? 'Your move. You are in check.' : 'Your move.';
  } else {
    status = thinking ? 'Stockfish is thinking…' : 'Stockfish to move.';
    cls = 'muted-status';
  }
  const startParts = play.startFen.split(' ');
  const firstNo = Number(startParts[5]);
  const startsWhite = startParts[1] === 'w';
  return (
    <>
      <div className="line-title">
        <div className="line-title-top muted small">
          <span>From: {play.origin}</span>
        </div>
        <h2>Play on against Stockfish</h2>
      </div>
      <div className={`status ${cls}`}>{status}</div>
      <label className="level">
        Engine strength
        <select value={props.level} onChange={(e) => props.onLevel(Number(e.target.value))}>
          {LEVELS.map((l, i) => (
            <option key={l.label} value={i}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <div className="movelist play-moves">
        {play.moves.length === 0 ? (
          <span className="muted small">Your game against the engine will appear here.</span>
        ) : (
          <p>
            {play.moves.map((m, i) => {
              const whiteMove = (i % 2 === 0) === startsWhite;
              const n = firstNo + Math.floor((i + (startsWhite ? 0 : 1)) / 2);
              const prefix = whiteMove ? `${n}. ` : i === 0 ? `${n}... ` : '';
              return (
                <span key={i} className="pm">
                  {prefix}
                  {m.san}{' '}
                </span>
              );
            })}
          </p>
        )}
      </div>
      {props.engine}
      <p className="muted small help">
        Try to carry out the plans from the line’s key ideas. Undo takes back your last move, and Engine analysis shows how
        you’re doing.
      </p>
    </>
  );
}
