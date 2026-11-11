import type { Mode } from '../state.ts';
export function BoardControls(p: {
  mode: Mode; myTurn: boolean; hintShown: boolean; lineDone: boolean; hasLine: boolean; hasEligible: boolean;
  onHint: () => void; onRetry: () => void; onNext: () => void;
  cursor: number; length: number; onJump: (n: number) => void; onFlip: () => void; onPlay: () => void;
  canUndo: boolean; canRestart: boolean; onUndo: () => void; onRestart: () => void; onBack: () => void; returnTo: Mode;
}) {
  return <div className="controls">
    {p.mode === 'play' ? <>
      <button onClick={p.onUndo} disabled={!p.canUndo}>↶ Undo</button>
      <button onClick={p.onRestart} disabled={!p.canRestart}>Restart</button>
      <button className="primary" onClick={p.onBack}>Back to {p.returnTo}</button>
    </> : p.mode === 'explore' ? <>
      <div className="button-group" role="group" aria-label="Step through the game">
        <button onClick={() => p.onJump(0)} disabled={!p.cursor} aria-label="Start" title="Start (Home)">⏮</button>
        <button onClick={() => p.onJump(p.cursor - 1)} disabled={!p.cursor} aria-label="Back one move" title="Back (←)">◀</button>
        <button onClick={() => p.onJump(p.cursor + 1)} disabled={p.cursor === p.length} aria-label="Forward one move" title="Forward (→)">▶</button>
        <button onClick={() => p.onJump(p.length)} disabled={p.cursor === p.length} aria-label="Last move" title="Last move (End)">⏭</button>
      </div>
      <button onClick={p.onFlip} title="View the board from the other side">⇅ Flip</button>
      <button className="primary" onClick={p.onPlay}>Play vs engine</button>
    </> : <>
      <button onClick={p.onRetry} disabled={!p.hasLine} title="Retry line (R)">Retry</button>
      <button onClick={p.onNext} disabled={!p.hasEligible} className={p.lineDone || !p.hasLine ? 'primary' : ''} title="Next line (N)">{p.lineDone || !p.hasLine ? 'Next line →' : 'Skip line'}</button>
      {!p.lineDone && <button onClick={p.onHint} disabled={!p.myTurn || p.hintShown} className="primary" title="Hint (H) · counts as a mistake">Hint</button>}
    </>}
  </div>;
}
