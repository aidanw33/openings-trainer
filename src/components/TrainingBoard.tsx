import { useEffect, useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard, type ChessboardOptions } from 'react-chessboard';
import { PieceArt } from './Pieces.tsx';

export interface BoardBadge { square: string; label: string; tone: 'good' | 'bad' | 'warn'; symbol: string; grade?: string }
export function TrainingBoard({ fen, orientation, options, onMove, badge, contextKey }: {
  fen: string; orientation: 'white' | 'black'; options: ChessboardOptions;
  onMove: (from: string, to: string, promotion?: string) => boolean;
  badge: BoardBadge | null; contextKey: string;
}) {
  const [promotion, setPromotion] = useState<{ from: string; to: string; color: string } | null>(null);
  const [marks, setMarks] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { setMarks([]); setPromotion(null); }, [fen, contextKey]);
  useEffect(() => { if (promotion) dialog.current?.showModal(); else dialog.current?.close(); }, [promotion]);
  const move = (from: string, to: string) => {
    if (!options.allowDragging) return false;
    const chess = new Chess(fen);
    const legal = chess.moves({ square: from as Square, verbose: true }).filter(m => m.to === to);
    if (legal.some(m => m.promotion)) { setPromotion({ from, to, color: chess.turn() }); return false; }
    return onMove(from, to);
  };
  // Intercept click-to-move destinations as well as drops for promotion.
  const clickFrom = useRef<string | null>(null);
  useEffect(() => { clickFrom.current = null; }, [fen, contextKey]);
  const squareStyles = { ...options.squareStyles };
  for (const sq of marks) squareStyles[sq] = { ...squareStyles[sq], boxShadow: 'inset 0 0 0 5px #c87967' };
  const file = badge ? badge.square.charCodeAt(0) - 97 : 0;
  const rank = badge ? Number(badge.square[1]) - 1 : 0;
  return <div className="training-board">
    <Chessboard options={{ ...options, position: fen, boardOrientation: orientation, squareStyles,
      darkSquareNotationStyle: { color: 'var(--light-sq)', fontSize: 12, fontWeight: 750 },
      lightSquareNotationStyle: { color: 'var(--dark-sq)', fontSize: 12, fontWeight: 750 },
      draggingPieceStyle: { filter: 'drop-shadow(0 12px 5px #0006)', transform: 'scale(1.08)' },
      allowDragOffBoard: false, animationDurationInMs: 220,
      onSquareRightClick: ({ square }) => setMarks(m => m.includes(square) ? m.filter(s => s !== square) : [...m, square]),
      onPieceDrop: ({ sourceSquare, targetSquare }) => { clickFrom.current = null; return targetSquare ? move(sourceSquare, targetSquare) : false; },
      onSquareClick: (args) => {
        if (!options.allowDragging) return;
        const from = clickFrom.current;
        if (from && new Chess(fen).moves({ square: from as Square, verbose: true }).some(m => m.to === args.square && m.promotion)) {
          move(from, args.square); clickFrom.current = null; return;
        }
        clickFrom.current = args.piece?.pieceType[0] === fen.split(' ')[1] ? args.square : null;
        options.onSquareClick?.(args);
      },
    }} />
    {badge && <span className={`move-badge ${badge.tone}`} title={badge.label} aria-label={badge.label} style={{ left: `${((orientation === 'white' ? file : 7-file)+.74)*12.5}%`, top: `${((orientation === 'white' ? 7-rank : rank)+.02)*12.5}%` }}>{badge.symbol}{badge.grade && <small className="square-grade">{badge.grade}</small>}</span>}
    <dialog className="promotion-dialog" ref={dialog} onCancel={() => setPromotion(null)}>
      <h2>Choose your promotion</h2><p className="muted small">Select a piece to complete the move.</p>
      <div className="promotion-options">{['Q','R','B','N'].map((p,i) => <button key={p} autoFocus={i === 0} aria-label={['Queen','Rook','Bishop','Knight'][i]} onClick={() => { if (promotion) onMove(promotion.from, promotion.to, p.toLowerCase()); setPromotion(null); }}><PieceArt type={(promotion?.color ?? 'w')+p} /></button>)}</div>
      <button className="link" onClick={() => setPromotion(null)}>Cancel</button>
    </dialog>
  </div>;
}
