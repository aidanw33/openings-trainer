import type { ParsedLine } from './repertoire.ts';

export interface LineStats {
  attempts: number;
  cleanRuns: number;
  /** Consecutive runs without a mistake. */
  streak: number;
  lastMistakes: number;
  lastPlayed: number;
}

export type Progress = Record<string, LineStats>;

const KEY = 'openings-trainer:progress:v1';

export function loadProgress(): Progress {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Progress;
  } catch {
    return {};
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable: progress is just not kept */
  }
}

export function recordRun(p: Progress, lineId: string, mistakes: number): Progress {
  const prev = p[lineId] ?? { attempts: 0, cleanRuns: 0, streak: 0, lastMistakes: 0, lastPlayed: 0 };
  const clean = mistakes === 0;
  return {
    ...p,
    [lineId]: {
      attempts: prev.attempts + 1,
      cleanRuns: prev.cleanRuns + (clean ? 1 : 0),
      streak: clean ? prev.streak + 1 : 0,
      lastMistakes: mistakes,
      lastPlayed: Date.now(),
    },
  };
}

export type Mastery = 'new' | 'learning' | 'shaky' | 'known';

export function mastery(s: LineStats | undefined): Mastery {
  if (!s) return 'new';
  if (s.lastMistakes > 0) return 'shaky';
  if (s.streak >= 3) return 'known';
  return 'learning';
}

/** Pick the line most in need of practice: unseen first, then recently failed, then least solid. */
export function pickNextLine(lines: ParsedLine[], p: Progress, avoidId?: string): ParsedLine | undefined {
  const pool = lines.length > 1 ? lines.filter((l) => l.id !== avoidId) : lines;
  if (!pool.length) return undefined;
  const score = (l: ParsedLine) => {
    const s = p[l.id];
    if (!s) return 100;
    let v = 0;
    if (s.lastMistakes > 0) v += 60 + 5 * s.lastMistakes;
    v += Math.max(0, 30 - 10 * s.streak);
    const days = (Date.now() - s.lastPlayed) / 86_400_000;
    v += Math.min(20, days * 4);
    return v;
  };
  const scored = pool.map((l) => ({ l, v: score(l) + Math.random() * 15 }));
  scored.sort((a, b) => b.v - a.v);
  return scored[0].l;
}
