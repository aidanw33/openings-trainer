import { Chess, type Color, type PieceSymbol } from 'chess.js';
/** Count captures across actual moves, so promoted pawns aren't mistaken for captures. */
export function capturedPieces(fens: string[], by: Color): PieceSymbol[] {
  const captured: PieceSymbol[] = [];
  for (let i = 1; i < fens.length; i++) {
    const before = new Chess(fens[i - 1]);
    if (before.turn() !== by) continue;
    const other = by === 'w' ? 'b' : 'w';
    const old = before.board().flat().filter(p => p?.color === other);
    const next = new Chess(fens[i]).board().flat().filter(p => p?.color === other);
    for (const type of ['p','n','b','r','q'] as PieceSymbol[]) {
      const loss = old.filter(p => p?.type === type).length - next.filter(p => p?.type === type).length;
      for (let n = 0; n < loss; n++) captured.push(type);
    }
  }
  return captured.sort((a,b) => 'qrbnp'.indexOf(a) - 'qrbnp'.indexOf(b));
}
