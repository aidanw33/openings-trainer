import { useMemo } from 'react';
import { capturedPieces } from '../lib/material.ts';
import { Chess } from 'chess.js';
import type { Mode } from '../state.ts';
import { PieceArt } from './Pieces.tsx';

export function PlayerBar({ fen, color, mine, mode, history }: { history: string[]; fen: string; color: 'w' | 'b'; mine: boolean; mode: Mode }) {
  const board = new Chess(fen).board().flat().filter(p => p !== null);
  const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const material = (c: string) => board.filter(p => p.color === c).reduce((n,p) => n + values[p.type], 0);
  const other = color === 'w' ? 'b' : 'w';
  const diff = material(color) - material(other);
  const captured = useMemo(() => capturedPieces(history, color), [history, color]);
  return <div className={`player-bar ${fen.split(' ')[1] === color ? 'to-move' : ''}`}>
    <div className="player-avatar"><PieceArt type={color+'K'} /></div>
    <div className="player-info"><b>{mode === 'explore' ? (mine ? 'You · exploring' : 'Opponent · exploring') : mine ? 'You' : mode === 'play' ? 'Stockfish' : 'Trainer'}</b><span className="muted small">{color === 'w' ? 'White' : 'Black'}<span className="captured" aria-label={`Captured pieces: ${captured.join(', ') || 'none'}`}>{captured.map((p,i) => <span key={i}><PieceArt type={other+p.toUpperCase()} /></span>)}</span>{diff > 0 && <strong className="material">+{diff}</strong>}</span></div>
    <span className="turn-dot" title="Side to move" />
  </div>;
}
