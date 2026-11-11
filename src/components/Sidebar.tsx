import type { ParsedLine, Repertoire } from '../lib/repertoire.ts';
import { mastery, MASTERY_LABELS, type Mastery, type Progress } from '../lib/progress.ts';
import { maskMoves, type Color } from '../lib/notation.ts';
import type { Mode } from '../state.ts';

export function Sidebar(props: {
  rep: Repertoire;
  mode: Mode;
  myColor: Color;
  progress: Progress;
  ticked: string[];
  onTicked: (chapterIds: string[]) => void;
  open: Set<string>;
  onToggleOpen: (chapterId: string) => void;
  currentLineId?: string;
  /** Hide your moves in the current line's name, while you are drilling it. */
  maskCurrent: boolean;
  onLine: (line: ParsedLine) => void;
  guided: boolean;
  onGuided: (on: boolean) => void;
}) {
  const { rep, ticked, open, progress } = props;
  const allIds = rep.opening.chapters.map((c) => c.id);
  const toggle = (id: string) =>
    props.onTicked(ticked.includes(id) ? ticked.filter((c) => c !== id) : [...ticked, id]);

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <h2>Variations</h2>
        <span className="small">
          <button className="link" onClick={() => props.onTicked(allIds)} disabled={ticked.length === allIds.length}>
            All
          </button>
          {' · '}
          <button className="link" onClick={() => props.onTicked([])} disabled={ticked.length === 0}>
            None
          </button>
        </span>
      </div>
      <p className="muted small">
        {props.mode === 'explore'
          ? 'Click a line to load it on the board, then step through it with ▶ or →.'
          : 'Ticked chapters are drilled when you press Next line. Click a line to drill it now.'}
      </p>

      {rep.opening.chapters.map((ch) => {
        const lines = rep.lines.filter((l) => l.chapterId === ch.id);
        const known = lines.filter((l) => mastery(progress[l.id]) === 'known').length;
        const isOpen = open.has(ch.id);
        return (
          <div key={ch.id} className="chapter">
            <div className="chapter-head">
              <input
                type="checkbox"
                checked={ticked.includes(ch.id)}
                onChange={() => toggle(ch.id)}
                aria-label={`Include ${ch.name} in drills`}
              />
              <button className="chapter-name" onClick={() => props.onToggleOpen(ch.id)} aria-expanded={isOpen}>
                <span className={`chevron ${isOpen ? 'open' : ''}`} aria-hidden="true" />
                <span className="chapter-title">{ch.name}</span>
                <span className="count" title={`${known} of ${lines.length} lines mastered`}>
                  {known}/{lines.length}
                </span>
              </button>
            </div>
            {isOpen && (
              <ul className="lines">
                {lines.map((l) => {
                  const m: Mastery = mastery(progress[l.id]);
                  const current = props.currentLineId === l.id;
                  return (
                    <li key={l.id}>
                      <button
                        className={current ? 'current' : ''}
                        onClick={() => props.onLine(l)}
                        aria-current={current ? 'true' : undefined}
                      >
                        <span className={`dot ${m}`} title={MASTERY_LABELS[m]} />
                        {current && props.maskCurrent ? maskMoves(l.name, props.myColor) : l.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}

      <label className="setting">
        <input type="checkbox" checked={props.guided} onChange={(e) => props.onGuided(e.target.checked)} />
        Guided drills: show an arrow for every move
      </label>
      <div className="legend small muted">
        {(['new', 'shaky', 'learning', 'known'] as Mastery[]).map((m) => (
          <span key={m}>
            <span className={`dot ${m}`} /> {MASTERY_LABELS[m]}
          </span>
        ))}
      </div>
    </aside>
  );
}
