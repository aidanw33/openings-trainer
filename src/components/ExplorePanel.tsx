import type { ReactNode } from 'react';
import { positionKey, type Repertoire } from '../lib/repertoire.ts';
import { colorName, otherColor, plyLabel, type Color } from '../lib/notation.ts';
import { START_FEN, type ExploreGame } from '../state.ts';
import { MoveList } from './MoveList.tsx';

function lineNames(rep: Repertoire, ids: Set<string>) {
  const names = [...ids].map((id) => rep.lineById.get(id)?.name).filter(Boolean);
  const more = names.length > 3 ? ` +${names.length - 3} more` : '';
  return names.slice(0, 3).join(' · ') + more;
}

/**
 * Explore: move pieces for either side, or click one of the repertoire's moves. The panel
 * explains the last move, lists what the repertoire prepares from here, and says where the
 * game left the repertoire. Positions are looked up by FEN, so transpositions are found too.
 */
export function ExplorePanel(props: {
  rep: Repertoire;
  myColor: Color;
  game: ExploreGame;
  onGo: (san: string) => void;
  onJump: (ply: number) => void;
  engine: ReactNode;
}) {
  const { rep, myColor, game } = props;
  const { moves, cursor } = game;
  const opponent = colorName(otherColor(myColor));
  const fenAt = (ply: number) => (ply === 0 ? START_FEN : moves[ply - 1].fen);
  const nodeAt = (ply: number) => rep.nodes.get(positionKey(fenAt(ply)));
  const turnAt = (ply: number) => fenAt(ply).split(' ')[1] as Color;
  const isBookMove = (ply: number) => !!nodeAt(ply)?.moves.has(moves[ply].san);

  const node = nodeAt(cursor);
  const options = node ? [...node.moves.values()] : [];
  const myTurn = turnAt(cursor) === myColor;
  const lastPly = cursor - 1;
  const lastEdge = lastPly >= 0 ? nodeAt(lastPly)?.moves.get(moves[lastPly].san) : undefined;
  const loadedLine = game.lineId ? rep.lineById.get(game.lineId) : undefined;

  // Out of book: find the last repertoire position before this one (the start always is one).
  let leftBook: { ply: number; text: string } | null = null;
  if (!node) {
    let ply = cursor - 1;
    while (ply > 0 && !nodeAt(ply)) ply--;
    const from = nodeAt(ply)!;
    const played = plyLabel(ply, moves[ply].san);
    const prepared = [...from.moves.keys()].map((san) => plyLabel(ply, san)).join(' or ');
    const text = !from.moves.size
      ? `Your prepared lines end before ${played}, so from here you’re on your own.`
      : turnAt(ply) === myColor
        ? `You played ${played}, but your repertoire plays ${prepared}.`
        : `${opponent} played ${played}, which your repertoire doesn’t cover. It prepares ${prepared}.`;
    leftBook = { ply, text };
  }

  const heading = !node
    ? 'Out of your repertoire'
    : !options.length
      ? 'End of your prepared lines'
      : myTurn
        ? 'Your repertoire move'
        : `${opponent}’s options`;

  return (
    <>
      <div className="line-title">
        <div className="line-title-top muted small">
          <span>{loadedLine ? `Line: ${loadedLine.name}` : 'Play either side, or pick a move below'}</span>
          {moves.length > 0 && (
            <span className="nowrap">
              {cursor === 0
                ? `Start · ${Math.ceil(moves.length / 2)} moves`
                : `Move ${Math.floor((cursor - 1) / 2) + 1} of ${Math.ceil(moves.length / 2)}`}
            </span>
          )}
        </div>
        <h2>{heading}</h2>
      </div>

      {lastEdge?.comment && (
        <div className={`card ${turnAt(lastPly) === myColor ? 'why' : 'opponent-move'}`}>
          <div className="card-head">
            <b>{plyLabel(lastPly, moves[lastPly].san)}</b>
          </div>
          <p>{lastEdge.comment}</p>
        </div>
      )}

      {leftBook && (
        <div className="status warn">
          {leftBook.text}{' '}
          <button className="link" onClick={() => props.onJump(leftBook.ply)}>
            Go back to that position
          </button>
        </div>
      )}

      {options.length > 0 && (
        <ul className="explore-moves">
          {options.map((m) => (
            <li key={m.san}>
              <button className={myTurn ? 'mine' : 'theirs'} onClick={() => props.onGo(m.san)}>
                <b>{plyLabel(cursor, m.san)}</b>
                {myTurn && m.comment && <span className="small">{m.comment}</span>}
                <span className="muted small">
                  {m.lineIds.size} line{m.lineIds.size > 1 ? 's' : ''} · {lineNames(rep, m.lineIds)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {node && !options.length && (
        <p className="muted small">
          Keep playing to practise the middlegame, play on against the engine, or go back and try another branch.
        </p>
      )}

      <MoveList
        sans={moves.map((m) => m.san)}
        current={cursor}
        onJump={props.onJump}
        moveClass={(i) => `${isBookMove(i) ? '' : 'off-book'} ${i >= cursor ? 'ahead' : ''}`}
        moveTitle={(i) => (isBookMove(i) ? 'Repertoire move' : 'Not in your repertoire')}
        empty="Make a move on the board for either side, or pick one of the moves above."
      />

      {props.engine}

      <p className="muted small help">
        <span className="swatch mine" /> your repertoire moves <span className="swatch theirs" /> {opponent}’s replies you
        have prepared for. Moves in grey italics are outside your repertoire. Use ← and → to step through the game.
      </p>
    </>
  );
}
