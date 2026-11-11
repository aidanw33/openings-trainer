import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadSettings, saveSettings, REPERTOIRES } from '../src/state.ts';
import { positionKey } from '../src/lib/repertoire.ts';
import { capturedPieces } from '../src/lib/material.ts';
import { MoveList } from '../src/components/MoveList.tsx';
import { recordRun } from '../src/lib/progress.ts';

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v) } });
const key = 'openings-trainer:settings:v1';
storage.set(key, JSON.stringify({ chapters: ['advance'], guided: true, engine: true, level: 4, futurePreference: 'keep' }));
const migrated = loadSettings();
assert.deepEqual(migrated.chapters, { 'caro-kann': ['advance'] });
assert.equal(migrated.theme, 'dark');
assert.equal(migrated.guided, true);
assert.equal(migrated.engine, true);
assert.equal(migrated.level, 4);
saveSettings(migrated);
assert.equal(JSON.parse(storage.get(key)!).futurePreference, 'keep');
saveSettings({ ...migrated, theme: 'light', boardTheme: 'slate', muted: true, chapters: { 'caro-kann': [], vienna: ['vie-gambit'] } });
assert.deepEqual(loadSettings().chapters, { 'caro-kann': [], vienna: ['vie-gambit'] });
assert.equal(loadSettings().muted, true);
assert.equal(loadSettings().theme, 'light');
const chess = new Chess();
const fens = [chess.fen()];
for (const san of ['a4','h5','a5','h4','a6','h3','axb7','hxg2','bxa8=N']) { chess.move(san); fens.push(chess.fen()); }
assert.deepEqual(capturedPieces(fens, 'w'), ['r','p']);
assert.deepEqual(capturedPieces(fens, 'b'), ['p']);
const ep = new Chess(); const epFens = [ep.fen()];
for (const san of ['e4','a6','e5','d5','exd6']) { ep.move(san); epFens.push(ep.fen()); }
assert.deepEqual(capturedPieces(epFens, 'w'), ['p']);
const blackStart = new Chess(); blackStart.move('e4');
const markup = renderToStaticMarkup(<MoveList startFen={blackStart.fen()} sans={['e5','Nc3']} current={2} onJump={() => {}} />);
assert.match(markup, /1\./); assert.match(markup, /2\./); assert.match(markup, /♘c3/); assert.match(markup, /aria-current="step"/);
let progress = { untouched: { attempts: 1, cleanRuns: 1, streak: 1, lastMistakes: 0, lastPlayed: 1 } };
for (let i = 0; i < 3; i++) progress = recordRun(progress, 'test-line', 0) as typeof progress;
assert.equal(progress.untouched.lastPlayed, 1);
assert.equal((progress as Record<string, {streak:number}>)['test-line'].streak, 3);
console.log('UI regressions passed: legacy settings, per-opening selections, preference persistence, capture/promotion/en-passant accounting, Black-start notation, mastery preservation.');

const direct = new Chess(); const transposed = new Chess();
for (const san of ['e4','c6','d4','d5','e5','Bf5','Nf3']) direct.move(san);
for (const san of ['e4','c6','Nf3','d5','e5','Bf5','d4']) transposed.move(san);
assert.equal(positionKey(direct.fen()), positionKey(transposed.fen()));
assert.ok(REPERTOIRES.get('caro-kann')!.nodes.has(positionKey(transposed.fen())));
console.log('Transposed Caro-Kann positions resolve to the same repertoire node.');
