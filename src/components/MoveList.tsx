import type { ReactNode } from 'react';

/**
 * Two-column move list for a game from the initial position. `current` is the ply the
 * board shows (its move is highlighted); clicking a move jumps to the position after it.
 */
export function MoveList(props: {
  sans: string[];
  current: number;
  onJump: (ply: number) => void;
  moveClass?: (i: number) => string;
  moveTitle?: (i: number) => string | undefined;
  empty?: ReactNode;
}) {
  const { sans, current } = props;
  if (!sans.length) return <div className="movelist muted small">{props.empty}</div>;
  const rows: { n: number; w?: number; b?: number }[] = [];
  sans.forEach((_, i) => {
    if (i % 2 === 0) rows.push({ n: i / 2 + 1, w: i });
    else rows[rows.length - 1].b = i;
  });
  const cell = (i?: number) =>
    i === undefined ? (
      <span />
    ) : (
      <button
        className={`mv ${current === i + 1 ? 'current' : ''} ${props.moveClass?.(i) ?? ''}`}
        onClick={() => props.onJump(i + 1)}
        title={props.moveTitle?.(i)}
        aria-current={current === i + 1 ? 'step' : undefined}
      >
        {sans[i]}
      </button>
    );
  return (
    <div className="movelist">
      {rows.map((r) => (
        <div key={r.n} className="mvrow">
          <span className="mvnum">{r.n}.</span>
          {cell(r.w)}
          {cell(r.b)}
        </div>
      ))}
    </div>
  );
}
