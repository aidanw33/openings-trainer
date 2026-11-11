import type { ReactNode } from 'react';
import type { Chapter } from '../data/types.ts';
import type { ParsedLine, ParsedMove } from '../lib/repertoire.ts';
import type { LineStats } from '../lib/progress.ts';
import { colorName, maskMoves, otherColor, plyLabel, type Color } from '../lib/notation.ts';
import { severity, verdictText, type MoveVerdict } from './Engine.tsx';
import { MoveList } from './MoveList.tsx';

export type Feedback =
  | { kind: 'idle' }
  | { kind: 'wrong'; tried: string; attempts: number }
  | { kind: 'correct'; move: ParsedMove; ply: number }
  | { kind: 'done'; mistakes: number };

export function DrillPanel(props: {
  line: ParsedLine;
  chapter?: Chapter;
  myColor: Color;
  ply: number;
  lineDone: boolean;
  viewPly: number | null;
  myTurn: boolean;
  feedback: Feedback;
  /** This line's saved results, used to show progress towards mastery. */
  stats?: LineStats;
  /** Nothing has been drilled yet in this browser: show a short how-to. */
  firstVisit: boolean;
  verdict: MoveVerdict | null;
  hintShown: boolean;
  showOpponentIdea: boolean;
  onShowOpponentIdea: () => void;
  onSelectPly: (ply: number) => void;
  onBackToLive: () => void;
  onNext: () => void;
  onRetry: () => void;
  onPlayOn: () => void;
  engine: ReactNode;
}) {
  const { line, chapter, myColor, ply, lineDone, viewPly, feedback } = props;
  const total = Math.ceil(line.moves.length / 2);
  const reveal = lineDone;
  const lineName = reveal ? line.name : maskMoves(line.name, myColor);
  const chapterName = chapter ? (reveal ? chapter.name : maskMoves(chapter.name, myColor)) : '';
  const shown = viewPly ?? ply;

  return (
    <>
      <div className="line-title">
        <div className="line-title-top muted small">
          <span>{chapterName}</span>
          <span className="nowrap">{lineDone ? `${total} moves` : `Move ${Math.floor(ply / 2) + 1} of ${total}`}</span>
        </div>
        <h2 title={reveal ? undefined : 'Your moves are hidden until you finish the line'}>{lineName}</h2>
      </div>

      <DrillStatus {...props} />

      {props.firstVisit && ply <= 1 && (
        <div className="card tip">
          <b>How drills work</b>
          <p>
            The computer plays {colorName(otherColor(myColor))}. Find your repertoire move and play it on the board, by
            dragging the piece or clicking it and then its square. A wrong move just bounces back, and Hint shows the
            answer.
          </p>
        </div>
      )}

      {feedback.kind === 'correct' && viewPly === null && (
        <div className="card why">
          <div className="card-head">
            <b>✓ {plyLabel(feedback.ply, feedback.move.san)}</b>
            <span className="muted small">why it’s played</span>
          </div>
          <p>{feedback.move.comment ?? 'Repertoire move.'}</p>
        </div>
      )}

      <MoveList
        sans={line.moves.slice(0, ply).map((m) => m.san)}
        current={shown}
        onJump={props.onSelectPly}
        moveClass={(i) => (line.moves[i].comment ? 'has-note' : '')}
        moveTitle={(i) => line.moves[i].comment}
        empty="Moves appear here as you play."
      />

      {viewPly !== null && viewPly > 0 && (
        <div className="card review">
          <div className="card-head">
            <b>{plyLabel(viewPly - 1, line.moves[viewPly - 1].san)}</b>
          </div>
          <p>{line.moves[viewPly - 1].comment ?? 'No note for this move.'}</p>
        </div>
      )}

      {props.engine}

      {chapter && (
        <details className="card ideas" open={lineDone}>
          <summary>Key ideas: {chapterName}</summary>
          <ul>
            {chapter.ideas.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function DrillStatus(props: Parameters<typeof DrillPanel>[0]) {
  const { line, myColor, ply, lineDone, viewPly, feedback, verdict } = props;
  const opponent = colorName(otherColor(myColor));

  const done = lineDone && feedback.kind === 'done' ? feedback : null;
  const doneActions = done && (
    <div className="status-actions">
      {done.mistakes > 0 && <button onClick={props.onRetry}>Try again</button>}
      <button onClick={props.onPlayOn}>Play on vs engine</button>
      <button className="primary" onClick={props.onNext} autoFocus>
        Next line →
      </button>
    </div>
  );
  const streak = props.stats?.streak ?? 0;
  const masteryNote =
    done && done.mistakes === 0
      ? streak >= 3
        ? ' This line is mastered.'
        : ` Clean runs in a row: ${streak} of 3 to master it.`
      : done
        ? ' A line is mastered after 3 clean runs in a row.'
        : '';

  if (viewPly !== null) {
    return (
      <div className="status info">
        {viewPly === 0
          ? 'Showing the starting position.'
          : `Showing the position after ${plyLabel(viewPly - 1, line.moves[viewPly - 1].san)}.`}{' '}
        <button className="link" onClick={props.onBackToLive}>
          {lineDone ? 'Back to the final position' : 'Back to the game'}
        </button>
        {doneActions}
      </div>
    );
  }

  if (done) {
    const m = done.mistakes;
    return (
      <div className={`status ${m === 0 ? 'good' : 'warn'}`}>
        <b>Line complete.</b> {m === 0 ? 'No mistakes, nice work!' : `${m} mistake${m > 1 ? 's' : ''} this time.`}
        {masteryNote} Click any move, or use ← and →, to read the explanations again.
        {doneActions}
      </div>
    );
  }

  if (!props.myTurn) return <div className="status muted-status">{opponent} is thinking…</div>;

  if (props.hintShown) {
    return <div className="status info">Hint: play the move shown by the green arrow.</div>;
  }

  if (feedback.kind === 'wrong') {
    const v = verdict && verdict.tried === feedback.tried ? verdict : null;
    const sev = v?.status === 'done' ? severity(v.loss) : null;
    return (
      <div className={`status ${sev === 'bad' ? 'bad' : 'warn'}`}>
        <b>{plyLabel(ply, feedback.tried)}</b> isn’t your repertoire move. Try again
        {feedback.attempts >= 2 ? ': the highlighted piece is the one to move.' : '.'}
        {v && (
          <div className="verdict">
            {verdictText(v)}
            {v.status === 'done' && sev !== 'ok' && v.reply && (
              <div className="small">Likely continuation: {v.reply}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  const last = ply > 0 ? line.moves[ply - 1] : null;
  const opponentJustMoved = last && last.color !== myColor;
  return (
    <div className="status info">
      {opponentJustMoved ? (
        <>
          {opponent} played <b>{plyLabel(ply - 1, last.san)}</b>. Your move.
          {last.comment && !props.showOpponentIdea && (
            <>
              {' '}
              <button className="link" onClick={props.onShowOpponentIdea}>
                What is {opponent} up to?
              </button>
            </>
          )}
          {last.comment && props.showOpponentIdea && <p className="status-detail">{last.comment}</p>}
        </>
      ) : ply === 0 ? (
        <>Your move: play White’s first move.</>
      ) : (
        <>Your move.</>
      )}
    </div>
  );
}
