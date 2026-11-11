import { Chess } from 'chess.js';
import { openings } from './data/openings.ts';
import { buildRepertoire, type Repertoire } from './lib/repertoire.ts';

export const REPERTOIRES = new Map(openings.map((o) => [o.id, buildRepertoire(o)]));
export const START_FEN = new Chess().fen();

export type Mode = 'drill' | 'explore' | 'play';
export const MODE_NAMES: Record<Mode, string> = { drill: 'drill', explore: 'explore', play: 'play' };

export type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

export interface PlayMove {
  san: string;
  from: string;
  to: string;
  fen: string;
}

/** The Explore board's game: every move played, and how far into it the board is showing. */
export interface ExploreGame {
  moves: PlayMove[];
  cursor: number;
  /** The sidebar line loaded into the board, if any. */
  lineId?: string;
}

export const LEVELS = [
  { skill: 0, label: 'Beginner' },
  { skill: 5, label: 'Casual' },
  { skill: 10, label: 'Club' },
  { skill: 15, label: 'Strong' },
  { skill: 20, label: 'Maximum' },
];

const SETTINGS_KEY = 'openings-trainer:settings:v1';
/** Before there was a choice of openings, settings.chapters was a plain list for this one. */
const LEGACY_OPENING_ID = 'caro-kann';

export interface Settings {
  opening: string;
  /** Chapters ticked for drills, per opening id. An opening with no entry has every chapter ticked. */
  chapters: Record<string, string[]>;
  guided: boolean;
  engine: boolean;
  level: number;
}

export function loadSettings(): Settings {
  const defaults: Settings = { opening: openings[0].id, chapters: {}, guided: false, engine: false, level: 2 };
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    if (!s || typeof s !== 'object') return defaults;
    const chapters: Record<string, string[]> = Array.isArray(s.chapters)
      ? { [LEGACY_OPENING_ID]: s.chapters }
      : s.chapters && typeof s.chapters === 'object'
        ? s.chapters
        : {};
    return {
      opening: REPERTOIRES.has(s.opening) ? s.opening : defaults.opening,
      chapters,
      guided: !!s.guided,
      engine: !!s.engine,
      level: typeof s.level === 'number' ? s.level : 2,
    };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable: settings are just not kept */
  }
}

/** The chapters ticked for this opening, dropping ids that no longer exist. */
export function tickedChapters(rep: Repertoire, settings: Settings): string[] {
  const all = rep.opening.chapters.map((c) => c.id);
  const saved = settings.chapters[rep.opening.id];
  return saved ? saved.filter((c) => all.includes(c)) : all;
}
