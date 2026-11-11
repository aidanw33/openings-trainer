import { defaultPieces } from 'react-chessboard';

/** Reuse the app's original react-chessboard artwork everywhere. */
export function PieceArt({ type }: { type: string }) {
  const Piece = defaultPieces[type];
  return Piece ? <Piece /> : null;
}
