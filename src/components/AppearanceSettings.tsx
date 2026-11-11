import type { Settings, Setter } from '../state.ts';

export function AppearanceSettings({ settings: s, onChange }: { settings: Settings; onChange: Setter<Settings> }) {
  const update = (patch: Partial<Settings>) => onChange((old) => ({ ...old, ...patch }));
  return <div className="panel-body settings-panel">
    <div><span className="eyebrow">MAKE IT YOURS</span><h2>Your board, your rhythm.</h2></div>
    <label>Appearance<select value={s.theme} onChange={e => update({ theme: e.target.value as Settings['theme'] })}><option value="dark">Dark</option><option value="light">Light</option></select></label>
    <label>Board theme<select value={s.boardTheme} onChange={e => update({ boardTheme: e.target.value as Settings['boardTheme'] })}><option value="sage">Sage</option><option value="walnut">Walnut</option><option value="slate">Slate</option></select></label>
    <label className="setting"><input type="checkbox" checked={s.muted} onChange={e => update({ muted: e.target.checked })} />Mute sounds</label>
    <label className="setting"><input type="checkbox" checked={s.guided} onChange={e => update({ guided: e.target.checked })} />Guided drills</label>
    <p className="muted small">Classic pieces and original synthesized sounds. Your preferences and progress are saved on this device.</p>
    <div className="card"><b>Board shortcuts</b><p className="small">Click or drag to move. Right-drag to draw an arrow; right-click to mark a square. H: hint · R: retry · N: next line. ← / →: review · Home / End: first / last position.</p></div>
  </div>;
}
