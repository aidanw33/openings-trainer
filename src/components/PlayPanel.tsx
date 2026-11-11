import type { ReactNode } from 'react';
import type { Chess } from 'chess.js';
import type { Color } from '../lib/notation.ts';
import { MoveList } from './MoveList.tsx';
import { LEVELS, type PlayMove } from '../state.ts';

export interface PlayGame {
  startFen: string;
  initialHistory: string[];
  moves: PlayMove[];
  origin: string;
}

export function PlayPanel(props: {
  cursor: number;
  onJump: (n: number) => void;
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
      {props.cursor < play.moves.length && <div className="status info">Reviewing move {props.cursor}. <button className="link" onClick={() => props.onJump(play.moves.length)}>Return to live game</button></div>}
      <MoveList sans={play.moves.map(m => m.san)} startFen={play.startFen} current={props.cursor} onJump={props.onJump} empty="Your game against the engine will appear here." />
      {props.engine}
      <p className="muted small help">
        Try to carry out the plans from the line’s key ideas. Undo takes back your last move, and Engine analysis shows how
        you’re doing.
      </p>
    </>
  );
}
