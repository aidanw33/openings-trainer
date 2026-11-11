import { openings } from '../data/openings.ts';
import type { Mode, Settings, Setter } from '../state.ts';
export function WorkspaceHeader({ mode, onMode, onSettings, settings, setSettings, totalKnown, total, onOpening }: {
  mode: Mode; onMode: (mode: Mode) => void; onSettings: () => void; settings: Settings;
  setSettings: Setter<Settings>; totalKnown: number; total: number; onOpening: (id: string) => void;
}) {
  return <>
    <nav className="nav-rail" aria-label="Training navigation">
      <span className="rail-mark" aria-hidden="true">♞</span>
      {(['drill', 'explore', 'play'] as const).map((m,i) => <button key={m} aria-label={m[0].toUpperCase()+m.slice(1)} aria-current={mode === m ? 'page' : undefined} className={mode === m ? 'active' : ''} onClick={() => onMode(m)}><span aria-hidden="true">{['◎','⌘','♟'][i]}</span>{m[0].toUpperCase()+m.slice(1)}</button>)}
      <button onClick={onSettings}><span aria-hidden="true">⚙</span>Settings</button>
    </nav>
    <header className="topbar">
      <div className="brand"><div><h1>Openings Trainer</h1><p>{totalKnown} of {total} lines mastered</p></div></div>
      <select className="opening-picker" aria-label="Opening to train" value={settings.opening} onChange={e => onOpening(e.target.value)}>
        {openings.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
      <label className="engine-toggle"><input type="checkbox" checked={settings.engine} onChange={e => setSettings(s => ({ ...s, engine: e.target.checked }))} />Engine analysis</label>
      <button className="sound-toggle" aria-label={settings.muted ? 'Unmute sounds' : 'Mute sounds'} title={settings.muted ? 'Unmute sounds' : 'Mute sounds'} onClick={() => setSettings(s => ({ ...s, muted: !s.muted }))}>{settings.muted ? '♪ Off' : '♪ On'}</button>
    </header>
  </>;
}
