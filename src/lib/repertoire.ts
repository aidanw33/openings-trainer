import { Chess } from 'chess.js';
import type { Chapter, Line, Opening } from '../data/types.ts';

export interface ParsedMove {
  san: string;
  color: 'w' | 'b';
  from: string;
  to: string;
  /** Position key before the move. */
  before: string;
  /** Full FEN after the move. */
  fenAfter: string;
  comment?: string;
  /** Marked [book] in the source: a deliberate practical/theory choice the engine may not agree with. */
  book?: boolean;
}

export interface ParsedLine extends Line {
  chapterId: string;
  moves: ParsedMove[];
}

export interface MoveEdge {
  san: string;
  from: string;
  to: string;
  comment?: string;
  book?: boolean;
  next: string;
  lineIds: Set<string>;
}

export interface PositionNode {
  key: string;
  fen: string;
  moves: Map<string, MoveEdge>;
}

export interface Repertoire {
  opening: Opening;
  lines: ParsedLine[];
  lineById: Map<string, ParsedLine>;
  chapterOf: Map<string, Chapter>;
  nodes: Map<string, PositionNode>;
  rootKey: string;
  errors: string[];
}

/** Position identity ignoring the move counters, so transpositions merge. */
export function positionKey(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
}

function tokenize(pgn: string): { move: string; comment?: string; book?: boolean }[] {
  const out: { move: string; comment?: string; book?: boolean }[] = [];
  const re = /\{([^}]*)\}|([^\s{}]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(pgn))) {
    if (m[1] !== undefined) {
      const last = out[out.length - 1];
      if (!last) throw new Error('Comment before any move');
      let text = m[1].replace(/\s+/g, ' ').trim();
      if (text.startsWith('[book]')) {
        last.book = true;
        text = text.slice(6).trim();
      }
      last.comment = last.comment ? `${last.comment} ${text}` : text;
    } else {
      // Strip move numbers and annotation glyphs (!, ?, !?, ?!).
      const tok = m[2].replace(/^\d+\.+/, '').replace(/[!?]+$/, '');
      if (tok) out.push({ move: tok });
    }
  }
  return out;
}

export function parseLine(line: Line, chapterId: string): ParsedLine {
  const chess = new Chess();
  const moves: ParsedMove[] = [];
  for (const { move, comment, book } of tokenize(line.pgn)) {
    const before = positionKey(chess.fen());
    let result;
    try {
      result = chess.move(move);
    } catch {
      throw new Error(`${line.id}: illegal move "${move}" after ${moves.map((x) => x.san).join(' ') || 'start'}`);
    }
    moves.push({
      san: result.san,
      color: result.color,
      from: result.from,
      to: result.to,
      before,
      fenAfter: chess.fen(),
      comment: comment || undefined,
      book,
    });
  }
  return { ...line, chapterId, moves };
}

export function buildRepertoire(opening: Opening): Repertoire {
  const errors: string[] = [];
  const lines: ParsedLine[] = [];
  const chapterOf = new Map<string, Chapter>();
  for (const ch of opening.chapters) {
    for (const l of ch.lines) {
      chapterOf.set(l.id, ch);
      try {
        lines.push(parseLine(l, ch.id));
      } catch (e) {
        errors.push((e as Error).message);
      }
    }
  }

  const start = new Chess().fen();
  const rootKey = positionKey(start);
  const nodes = new Map<string, PositionNode>();
  const getNode = (key: string, fen: string) => {
    let n = nodes.get(key);
    if (!n) {
      n = { key, fen, moves: new Map() };
      nodes.set(key, n);
    }
    return n;
  };
  getNode(rootKey, start);

  const mySide = opening.side === 'white' ? 'w' : 'b';
  for (const line of lines) {
    let fen = start;
    for (const mv of line.moves) {
      const node = getNode(mv.before, fen);
      const nextKey = positionKey(mv.fenAfter);
      getNode(nextKey, mv.fenAfter);
      let edge = node.moves.get(mv.san);
      if (!edge) {
        if (mv.color === mySide && node.moves.size > 0) {
          const other = [...node.moves.keys()].join(', ');
          errors.push(`${line.id}: repertoire plays ${mv.san} but another line plays ${other} in the same position`);
        }
        edge = { san: mv.san, from: mv.from, to: mv.to, next: nextKey, lineIds: new Set() };
        node.moves.set(mv.san, edge);
      }
      edge.lineIds.add(line.id);
      if (mv.book) edge.book = true;
      if (mv.comment) {
        if (!edge.comment || mv.comment.length > edge.comment.length) edge.comment = mv.comment;
      }
      fen = mv.fenAfter;
    }
  }

  // Fill comments into each line from merged edges so transposed lines get the notes too.
  for (const line of lines) {
    for (const mv of line.moves) {
      const edge = nodes.get(mv.before)?.moves.get(mv.san);
      if (edge?.comment) mv.comment = edge.comment;
    }
  }

  const lineById = new Map(lines.map((l) => [l.id, l]));
  if (lineById.size !== lines.length) errors.push('Duplicate line ids');
  return { opening, lines, lineById, chapterOf, nodes, rootKey, errors };
}
