import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard, type Arrow } from 'react-chessboard';
import { openings } from './data/openings.ts';
import { buildRepertoire, positionKey, type ParsedLine, type ParsedMove, type Repertoire } from './lib/repertoire.ts';
import {
  formatScore,
  getAnalysisEngine,
  getTaskEngine,
  numberedLine,
  pvToSan,
  type EngineLine,
} from './lib/engine.ts';
import { loadProgress, mastery, pickNextLine, recordRun, saveProgress, type Progress } from './lib/progress.ts';

const REPERTOIRES = new Map(openings.map((o) => [o.id, buildRepertoire(o)]));
const START_FEN = new Chess().fen();
const COMPUTER_DELAY = 650;

type Color = 'w' | 'b';
const colorName = (c: Color) => (c === 'w' ? 'White' : 'Black');

type Mode = 'drill' | 'explore' | 'free' | 'play';
const MODE_NAMES: Record<Mode, string> = { drill: 'drill', explore: 'explore', free: 'free play', play: 'play' };
type Feedback =
  | { kind: 'idle' }
  | { kind: 'wrong'; tried: string; attempts: number }
  | { kind: 'correct'; move: ParsedMove }
  | { kind: 'done'; mistakes: number };

const SETTINGS_KEY = 'openings-trainer:settings:v1';
/** Before there was a choice of openings, settings.chapters was a plain list for this one. */
const LEGACY_OPENING_ID = 'caro-kann';
interface Settings {
  opening: string;
  /** Chapters ticked for drills, per opening id. An opening with no entry has every chapter ticked. */
  chapters: Record<string, string[]>;
  guided: boolean;
  engine: boolean;
  level: number;
}
const LEVELS = [
  { skill: 0, label: 'Beginner' },
  { skill: 5, label: 'Casual' },
  { skill: 10, label: 'Club' },
  { skill: 15, label: 'Strong' },
  { skill: 20, label: 'Maximum' },
];

/** What the engine thinks of a non-repertoire move you tried. */
type MoveVerdict =
  | { id: number; tried: string; status: 'pending' }
  | { id: number; tried: string; status: 'done'; loss: number; triedScore: string; reply: string }
  | { id: number; tried: string; status: 'error' };

interface PlayMove {
  san: string;
  from: string;
  to: string;
  fen: string;
}
/** A free-play game: every move played, and how far into it the board is showing. */
interface FreeGame {
  moves: PlayMove[];
  cursor: number;
}
type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

function loadSettings(): Settings {
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

/** The chapters ticked for this opening, dropping ids that no longer exist. */
function tickedChapters(rep: Repertoire, settings: Settings): string[] {
  const all = rep.opening.chapters.map((c) => c.id);
  const saved = settings.chapters[rep.opening.id];
  return saved ? saved.filter((c) => all.includes(c)) : all;
}

function moveLabel(moves: ParsedMove[], i: number) {
  const n = Math.floor(i / 2) + 1;
  return moves[i].color === 'w' ? `${n}.${moves[i].san}` : `${n}...${moves[i].san}`;
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);
  // The mode and the free-play game live here so they survive switching openings:
  // the same game is then checked against the other repertoire.
  const [mode, setMode] = useState<Mode>('drill');
  const [free, setFree] = useState<FreeGame>({ moves: [], cursor: 0 });
  const rep = REPERTOIRES.get(settings.opening)!;
  const switchOpening = (id: string) => {
    setSettings((s) => ({ ...s, opening: id }));
    // A play-on game belongs to the old opening's trainer, which is about to reset.
    setMode((m) => (m === 'play' ? 'drill' : m));
  };
  // Keyed by opening so the drill and explore state start fresh on the new repertoire.
  return (
    <Trainer
      key={rep.opening.id}
      rep={rep}
      settings={settings}
      setSettings={setSettings}
      onSwitchOpening={switchOpening}
      mode={mode}
      setMode={setMode}
      free={free}
      setFree={setFree}
    />
  );
}

function Trainer({
  rep,
  settings,
  setSettings,
  onSwitchOpening,
  mode,
  setMode,
  free,
  setFree,
}: {
  rep: Repertoire;
  settings: Settings;
  setSettings: Setter<Settings>;
  onSwitchOpening: (id: string) => void;
  mode: Mode;
  setMode: Setter<Mode>;
  free: FreeGame;
  setFree: Setter<FreeGame>;
}) {
  const myColor: Color = rep.opening.side === 'white' ? 'w' : 'b';
  const opponent = colorName(myColor === 'w' ? 'b' : 'w');
  const [progress, setProgress] = useState<Progress>(loadProgress);
  useEffect(() => saveProgress(progress), [progress]);

  const chapters = tickedChapters(rep, settings);
  const chaptersKey = chapters.join(',');
  const eligible = useMemo(
    () => rep.lines.filter((l) => chapters.includes(l.chapterId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rep, chaptersKey],
  );

  // ----- Drill state -----
  const [line, setLine] = useState<ParsedLine | undefined>(() => pickNextLine(eligible, progress));
  const [ply, setPly] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'idle' });
  const [hintShown, setHintShown] = useState(false);
  const [showOpponentIdea, setShowOpponentIdea] = useState(false);
  const [viewPly, setViewPly] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const missedThisMove = useRef(false);
  const [verdict, setVerdict] = useState<MoveVerdict | null>(null);
  const verdictId = useRef(0);

  const startLine = useCallback((l: ParsedLine | undefined) => {
    setLine(l);
    setPly(0);
    setMistakes(0);
    setFeedback({ kind: 'idle' });
    setHintShown(false);
    setShowOpponentIdea(false);
    setViewPly(null);
    setSelected(null);
    missedThisMove.current = false;
    verdictId.current++;
    setVerdict(null);
    setMode('drill');
  }, []);

  const nextLine = useCallback(() => {
    startLine(pickNextLine(eligible, progress, line?.id));
  }, [eligible, progress, line, startLine]);

  // Computer plays the opponent's moves.
  const expected = line?.moves[ply];
  const lineDone = !!line && ply >= line.moves.length;
  useEffect(() => {
    if (mode !== 'drill' || !expected || expected.color === myColor) return;
    const t = setTimeout(() => {
      setPly((p) => p + 1);
      setShowOpponentIdea(false);
    }, COMPUTER_DELAY);
    return () => clearTimeout(t);
  }, [mode, expected, myColor]);

  // Record completion once.
  const recorded = useRef<string | null>(null);
  useEffect(() => {
    if (!line || !lineDone) return;
    const tag = `${line.id}:${line.moves.length}`;
    if (recorded.current === tag) return;
    recorded.current = tag;
    setProgress((p) => recordRun(p, line.id, mistakes));
    setFeedback({ kind: 'done', mistakes });
  }, [line, lineDone, mistakes]);
  useEffect(() => {
    if (ply === 0) recorded.current = null;
  }, [ply, line]);

  const drillFen = line && ply > 0 ? line.moves[ply - 1].fenAfter : START_FEN;
  const myTurn = mode === 'drill' && !!expected && expected.color === myColor && viewPly === null;

  const tryDrillMove = (from: string, to: string): boolean => {
    if (!myTurn || !expected || !line) return false;
    const chess = new Chess(drillFen);
    let san: string;
    let uci: string;
    try {
      const m = chess.move({ from, to, promotion: 'q' });
      san = m.san;
      uci = m.from + m.to + (m.promotion ?? '');
    } catch {
      return false;
    }
    if (san === expected.san) {
      verdictId.current++;
      setVerdict(null);
      setFeedback({ kind: 'correct', move: expected });
      setPly((p) => p + 1);
      setHintShown(false);
      missedThisMove.current = false;
      return true;
    }
    if (!missedThisMove.current) {
      missedThisMove.current = true;
      setMistakes((m) => m + 1);
    }
    setFeedback((f) => ({ kind: 'wrong', tried: san, attempts: f.kind === 'wrong' ? f.attempts + 1 : 1 }));
    checkMoveWithEngine(drillFen, uci, san, expected.from + expected.to);
    return false;
  };

  /** Ask Stockfish whether a non-repertoire move is actually bad, or just different. */
  const checkMoveWithEngine = (fen: string, triedUci: string, tried: string, repUci: string) => {
    const id = ++verdictId.current;
    setVerdict({ id, tried, status: 'pending' });
    const eng = getTaskEngine();
    eng.cancelAll();
    Promise.all([
      eng.analyse(fen, { depth: 15, searchmoves: [triedUci] }),
      eng.analyse(fen, { depth: 15, searchmoves: [repUci] }),
    ]).then(([a, b]) => {
      if (id !== verdictId.current) return;
      const la = a?.lines[0];
      const lb = b?.lines[0];
      if (!la || !lb) {
        setVerdict({ id, tried, status: 'error' });
        return;
      }
      const sign = fen.split(' ')[1] === 'w' ? 1 : -1;
      setVerdict({
        id,
        tried,
        status: 'done',
        loss: (lb.cp - la.cp) * sign,
        triedScore: formatScore(la),
        reply: numberedLine(fen, pvToSan(fen, la.pv, 5)),
      });
    });
  };

  const revealHint = () => {
    if (!missedThisMove.current) {
      missedThisMove.current = true;
      setMistakes((m) => m + 1);
    }
    setHintShown(true);
  };

  // ----- Explore state -----
  const [explorePath, setExplorePath] = useState<string[]>([rep.rootKey]);
  const exploreKey = explorePath[explorePath.length - 1];
  const exploreNode = rep.nodes.get(exploreKey)!;
  const exploreMoves = [...exploreNode.moves.values()];
  const [exploreLast, setExploreLast] = useState<{ san: string; comment?: string; color: 'w' | 'b' } | null>(null);

  const exploreGo = (san: string) => {
    const edge = exploreNode.moves.get(san);
    if (!edge) return;
    const color = exploreNode.fen.split(' ')[1] as 'w' | 'b';
    setExploreLast({ san, comment: edge.comment, color });
    setExplorePath((p) => [...p, edge.next]);
  };
  const exploreBack = () => {
    setExplorePath((p) => (p.length > 1 ? p.slice(0, -1) : p));
    setExploreLast(null);
  };

  // ----- Free play: you move both sides and the repertoire guides you -----
  const [flipped, setFlipped] = useState(false);
  const freeFen = free.cursor ? free.moves[free.cursor - 1].fen : START_FEN;
  const freeNode = rep.nodes.get(positionKey(freeFen));

  /** Play a move in free play. Moving from an earlier position replaces the moves after it. */
  const applyFreeMove = (move: string | { from: string; to: string; promotion: string }): boolean => {
    const c = new Chess(freeFen);
    try {
      const m = c.move(move);
      const next = { san: m.san, from: m.from, to: m.to, fen: c.fen() };
      setFree((f) => ({ moves: [...f.moves.slice(0, f.cursor), next], cursor: f.cursor + 1 }));
      return true;
    } catch {
      return false;
    }
  };
  const jumpFree = (ply: number) => {
    setSelected(null);
    setFree((f) => ({ ...f, cursor: Math.max(0, Math.min(f.moves.length, ply)) }));
  };

  // Arrow keys step through the free-play game.
  useEffect(() => {
    if (mode !== 'free') return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      setSelected(null);
      setFree((f) => ({
        ...f,
        cursor: e.key === 'ArrowLeft' ? Math.max(0, f.cursor - 1) : Math.min(f.moves.length, f.cursor + 1),
      }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode]);

  // ----- Play-on vs engine -----
  const [play, setPlay] = useState<{ startFen: string; moves: PlayMove[]; origin: string; returnTo: Mode } | null>(
    null,
  );
  const playFen = play ? (play.moves.length ? play.moves[play.moves.length - 1].fen : play.startFen) : START_FEN;
  const playGame = useMemo(() => new Chess(playFen), [playFen]);
  const playOver = playGame.isGameOver();
  const [engineThinking, setEngineThinking] = useState(false);

  const startPlay = (fen: string, origin: string, returnTo: Mode) => {
    setPlay({ startFen: fen, moves: [], origin, returnTo });
    setSelected(null);
    setMode('play');
  };

  const applyPlayMove = (from: string, to: string, promotion = 'q'): boolean => {
    const c = new Chess(playFen);
    try {
      const m = c.move({ from, to, promotion });
      setPlay((p) => (p ? { ...p, moves: [...p.moves, { san: m.san, from: m.from, to: m.to, fen: c.fen() }] } : p));
      return true;
    } catch {
      return false;
    }
  };

  const undoPlay = () =>
    setPlay((p) => {
      if (!p || !p.moves.length) return p;
      const moves = p.moves.slice(0, -1);
      const turnOf = (ms: PlayMove[]) => (ms.length ? ms[ms.length - 1].fen : p.startFen).split(' ')[1];
      while (moves.length && turnOf(moves) !== myColor) moves.pop();
      return { ...p, moves };
    });

  // The engine answers when it is its turn.
  useEffect(() => {
    if (mode !== 'play' || !play || playOver || playFen.split(' ')[1] === myColor) return;
    let live = true;
    setEngineThinking(true);
    const level = LEVELS[settings.level] ?? LEVELS[2];
    getTaskEngine()
      .analyse(playFen, { movetime: 400 + level.skill * 40, skill: level.skill }, true)
      .then((r) => {
        if (!live) return;
        setEngineThinking(false);
        if (r?.bestmove) applyPlayMove(r.bestmove.slice(0, 2), r.bestmove.slice(2, 4), r.bestmove[4] || 'q');
      });
    return () => {
      live = false;
      setEngineThinking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, playFen, playOver, settings.level]);

  // ----- Board wiring -----
  const viewing = mode === 'drill' && viewPly !== null && line;
  const boardFen =
    mode === 'explore'
      ? exploreNode.fen
      : mode === 'free'
        ? freeFen
        : mode === 'play'
        ? playFen
        : viewing
        ? viewPly === 0
          ? START_FEN
          : line!.moves[viewPly - 1].fenAfter
        : drillFen;

  const lastMove = (() => {
    if (mode === 'explore') return null;
    if (mode === 'free') return free.moves[free.cursor - 1] ?? null;
    if (mode === 'play') return play?.moves[play.moves.length - 1] ?? null;
    const idx = (viewPly ?? ply) - 1;
    return line && idx >= 0 ? line.moves[idx] : null;
  })();

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    squareStyles[lastMove.from] = { background: 'var(--last-move)' };
    squareStyles[lastMove.to] = { background: 'var(--last-move)' };
  }
  if (selected) squareStyles[selected] = { background: 'var(--selected)' };
  if (selected) {
    const c = new Chess(boardFen);
    for (const m of c.moves({ square: selected as Square, verbose: true })) {
      squareStyles[m.to] = {
        ...squareStyles[m.to],
        backgroundImage: 'radial-gradient(circle, var(--dot) 22%, transparent 24%)',
      };
    }
  }

  const arrows: Arrow[] = [];
  if (mode === 'drill' && myTurn && expected && (hintShown || settings.guided)) {
    arrows.push({ startSquare: expected.from, endSquare: expected.to, color: 'rgba(40,160,80,0.85)' });
  }
  if (mode === 'drill' && feedback.kind === 'wrong' && feedback.attempts >= 2 && expected && myTurn && !hintShown) {
    // After two misses, show which piece moves.
    squareStyles[expected.from] = { ...squareStyles[expected.from], boxShadow: 'inset 0 0 0 4px rgba(40,160,80,0.9)' };
  }
  // Explore and free play show the repertoire's moves from the current position.
  const treeNode = mode === 'explore' ? exploreNode : mode === 'free' ? freeNode : undefined;
  if (treeNode) {
    const mine = treeNode.fen.split(' ')[1] === myColor;
    for (const e of treeNode.moves.values()) {
      arrows.push({
        startSquare: e.from,
        endSquare: e.to,
        color: mine ? 'rgba(40,160,80,0.8)' : 'rgba(60,110,200,0.6)',
      });
    }
  }

  // ----- Live engine analysis -----
  const [analysis, setAnalysis] = useState<{ fen: string; lines: EngineLine[] } | null>(null);
  useEffect(() => {
    if (!settings.engine) {
      setAnalysis(null);
      return;
    }
    const eng = getAnalysisEngine();
    setAnalysis({ fen: boardFen, lines: [] });
    if (new Chess(boardFen).isGameOver()) {
      eng.cancelAll();
      return;
    }
    eng.analyse(boardFen, { depth: 18, multipv: 3, onInfo: (lines) => setAnalysis({ fen: boardFen, lines }) }, true);
  }, [boardFen, settings.engine]);
  useEffect(() => {
    if (!settings.engine) getAnalysisEngine().cancelAll();
  }, [settings.engine]);

  // Don't let the engine give away the answer while you're being tested.
  const engineSpoiler = mode === 'drill' && myTurn;
  const liveLines = analysis && analysis.fen === boardFen ? analysis.lines : [];
  if (settings.engine && !engineSpoiler && liveLines[0]?.pv[0]) {
    const u = liveLines[0].pv[0];
    const [startSquare, endSquare] = [u.slice(0, 2), u.slice(2, 4)];
    // The board keys arrows by their squares, so skip the engine arrow when a
    // repertoire arrow already covers the same move (the engine panel still shows it).
    if (!arrows.some((a) => a.startSquare === startSquare && a.endSquare === endSquare)) {
      arrows.push({ startSquare, endSquare, color: 'rgba(230,120,20,0.8)' });
    }
  }

  const tryMove = (from: string, to: string): boolean => {
    setSelected(null);
    if (mode === 'drill') return tryDrillMove(from, to);
    if (mode === 'play') return playerCanMove ? applyPlayMove(from, to) : false;
    if (mode === 'free') return applyFreeMove({ from, to, promotion: 'q' });
    const c = new Chess(exploreNode.fen);
    try {
      const san = c.move({ from, to, promotion: 'q' }).san;
      if (exploreNode.moves.has(san)) {
        exploreGo(san);
        return true;
      }
    } catch {
      /* illegal */
    }
    return false;
  };

  const turnColor = boardFen.split(' ')[1];
  const playerCanMove = mode === 'play' && !playOver && turnColor === myColor;
  const canMovePieces = mode === 'explore' || mode === 'free' || myTurn || playerCanMove;
  const otherSide = rep.opening.side === 'white' ? 'black' : 'white';
  const orientation = mode === 'free' && flipped ? otherSide : rep.opening.side;

  const onSquareClick = ({ square, piece }: { square: string; piece: { pieceType: string } | null }) => {
    if (!canMovePieces) return;
    const ownPiece = piece && piece.pieceType[0] === turnColor;
    if (selected && selected !== square) {
      const ok = tryMove(selected, square);
      if (ok || !ownPiece) {
        setSelected(null);
        return;
      }
    }
    setSelected(ownPiece && selected !== square ? square : null);
  };

  // ----- Panels -----
  const opponentMoveJustPlayed =
    mode === 'drill' && line && ply > 0 && line.moves[ply - 1].color !== myColor ? line.moves[ply - 1] : null;
  const chapter = line ? rep.chapterOf.get(line.id) : undefined;

  const toggleChapter = (id: string) =>
    setSettings((s) => {
      const current = tickedChapters(rep, s);
      const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
      return { ...s, chapters: { ...s.chapters, [rep.opening.id]: next } };
    });

  const [openChapters, setOpenChapters] = useState<Set<string>>(() => new Set(line ? [line.chapterId] : []));
  const toggleOpen = (id: string) =>
    setOpenChapters((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const totalKnown = rep.lines.filter((l) => mastery(progress[l.id]) === 'known').length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">♞</span>
          <div>
            <h1>Openings Trainer</h1>
            <p>
              {totalKnown}/{rep.lines.length} lines mastered
            </p>
          </div>
        </div>
        <select
          className="opening-picker"
          aria-label="Opening"
          value={rep.opening.id}
          onChange={(e) => onSwitchOpening(e.target.value)}
        >
          {openings.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} · you play {o.side === 'white' ? 'White' : 'Black'}
            </option>
          ))}
        </select>
        <div className="tabs" role="tablist">
          <button className={mode === 'drill' ? 'active' : ''} onClick={() => setMode('drill')}>
            Drill
          </button>
          <button className={mode === 'explore' ? 'active' : ''} onClick={() => setMode('explore')}>
            Explore
          </button>
          <button className={mode === 'free' ? 'active' : ''} onClick={() => setMode('free')}>
            Free play
          </button>
          {play && (
            <button className={mode === 'play' ? 'active' : ''} onClick={() => setMode('play')}>
              Play
            </button>
          )}
        </div>
        <label className="engine-toggle">
          <input
            type="checkbox"
            checked={settings.engine}
            onChange={(e) => setSettings((s) => ({ ...s, engine: e.target.checked }))}
          />
          Engine analysis
        </label>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <h2>Variations</h2>
          <p className="muted small">Ticked chapters are included when you press “Next line”.</p>
          {rep.opening.chapters.map((ch) => {
            const chLines = rep.lines.filter((l) => l.chapterId === ch.id);
            const known = chLines.filter((l) => mastery(progress[l.id]) === 'known').length;
            return (
              <div key={ch.id} className="chapter">
                <div className="chapter-head">
                  <input
                    type="checkbox"
                    checked={chapters.includes(ch.id)}
                    onChange={() => toggleChapter(ch.id)}
                    aria-label={`Include ${ch.name} in drills`}
                  />
                  <button className="chapter-name" onClick={() => toggleOpen(ch.id)}>
                    <span>{ch.name}</span>
                    <span className="muted small">
                      {known}/{chLines.length} {openChapters.has(ch.id) ? '▾' : '▸'}
                    </span>
                  </button>
                </div>
                {openChapters.has(ch.id) && (
                  <ul className="lines">
                    {chLines.map((l) => (
                      <li key={l.id}>
                        <button className={line?.id === l.id && mode === 'drill' ? 'current' : ''} onClick={() => startLine(l)}>
                          <span className={`dot ${mastery(progress[l.id])}`} title={mastery(progress[l.id])} />
                          {l.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          <label className="setting">
            <input
              type="checkbox"
              checked={settings.guided}
              onChange={(e) => setSettings((s) => ({ ...s, guided: e.target.checked }))}
            />
            Guided mode (show an arrow for every move)
          </label>
          <div className="legend small muted">
            <span><span className="dot new" /> new</span>
            <span><span className="dot shaky" /> mistakes last time</span>
            <span><span className="dot learning" /> learning</span>
            <span><span className="dot known" /> mastered (3 clean in a row)</span>
          </div>
        </aside>

        <section className="board-col">
          <div className="board-row">
          {settings.engine && <EvalBar lines={liveLines} orientation={orientation} />}
          <div className="board-wrap">
            <Chessboard
              options={{
                position: boardFen,
                boardOrientation: orientation,
                squareStyles,
                arrows,
                allowDrawingArrows: true,
                clearArrowsOnPositionChange: true,
                animationDurationInMs: 200,
                canDragPiece: ({ piece }) => canMovePieces && piece.pieceType[0] === turnColor,
                onPieceDrop: ({ sourceSquare, targetSquare }) => (targetSquare ? tryMove(sourceSquare, targetSquare) : false),
                onSquareClick,
                lightSquareStyle: { backgroundColor: 'var(--light-sq)' },
                darkSquareStyle: { backgroundColor: 'var(--dark-sq)' },
              }}
            />
          </div>
          </div>
          {mode === 'play' ? (
            <div className="controls">
              <button onClick={undoPlay} disabled={!play?.moves.length || engineThinking}>
                ↶ Undo
              </button>
              <button onClick={() => play && setPlay({ ...play, moves: [] })} disabled={!play?.moves.length}>
                Restart
              </button>
              <button className="primary" onClick={() => setMode(play?.returnTo ?? 'drill')}>
                Back to {MODE_NAMES[play?.returnTo ?? 'drill']}
              </button>
            </div>
          ) : mode === 'free' ? (
            <div className="controls">
              <button onClick={() => jumpFree(0)} disabled={free.cursor === 0} title="Start position">
                ⏮
              </button>
              <button onClick={() => jumpFree(free.cursor - 1)} disabled={free.cursor === 0} title="Back (←)">
                ◀
              </button>
              <button
                onClick={() => jumpFree(free.cursor + 1)}
                disabled={free.cursor >= free.moves.length}
                title="Forward (→)"
              >
                ▶
              </button>
              <button onClick={() => setFlipped((f) => !f)} title="Flip the board">
                ⇅ Flip
              </button>
              <button className="primary" onClick={() => startPlay(freeFen, 'Free play position', 'free')}>
                Play from here vs engine
              </button>
            </div>
          ) : mode === 'drill' ? (
            <div className="controls">
              <button onClick={revealHint} disabled={!myTurn || hintShown}>
                Hint
              </button>
              <button onClick={() => startLine(line)}>Restart line</button>
              <button className="primary" onClick={nextLine}>
                Next line →
              </button>
            </div>
          ) : (
            <div className="controls">
              <button onClick={() => { setExplorePath([rep.rootKey]); setExploreLast(null); }}>⏮ Start</button>
              <button onClick={exploreBack} disabled={explorePath.length <= 1}>
                ◀ Back
              </button>
              <button className="primary" onClick={() => startPlay(exploreNode.fen, 'Explore position', 'explore')}>
                Play from here vs engine
              </button>
            </div>
          )}
        </section>

        <section className="panel">
          {mode === 'drill' ? (
            line ? (
              <>
                <div className="line-title">
                  <span className="muted small">{chapter?.name}</span>
                  <h2>{line.name}</h2>
                </div>

                <StatusBox
                  me={colorName(myColor)}
                  opponent={opponent}
                  feedback={feedback}
                  myTurn={myTurn}
                  lineDone={lineDone}
                  viewing={viewPly !== null}
                  onNext={nextLine}
                  onRetry={() => startLine(line)}
                  onBackToLive={() => setViewPly(null)}
                  onPlayOn={() => startPlay(drillFen, line.name, 'drill')}
                  verdict={verdict}
                />

                {opponentMoveJustPlayed && !lineDone && viewPly === null && (
                  <div className="card opponent-move">
                    <div className="card-head">
                      <span>
                        {opponent} played <b>{moveLabel(line.moves, ply - 1)}</b>
                      </span>
                      {opponentMoveJustPlayed.comment && !showOpponentIdea && (
                        <button className="link" onClick={() => setShowOpponentIdea(true)}>
                          What is {opponent} up to?
                        </button>
                      )}
                    </div>
                    {showOpponentIdea && opponentMoveJustPlayed.comment && <p>{opponentMoveJustPlayed.comment}</p>}
                  </div>
                )}

                {feedback.kind === 'correct' && viewPly === null && (
                  <div className="card why">
                    <div className="card-head">
                      <span>
                        ✓ <b>{feedback.move.san}</b> — why this move
                      </span>
                    </div>
                    <p>{feedback.move.comment ?? 'Repertoire move.'}</p>
                  </div>
                )}

                <MoveList
                  line={line}
                  ply={ply}
                  viewPly={viewPly}
                  lineDone={lineDone}
                  onSelect={(p) => setViewPly(p === ply ? null : p)}
                />

                {viewPly !== null && viewPly > 0 && (
                  <div className="card review">
                    <div className="card-head">
                      <span>
                        <b>{moveLabel(line.moves, viewPly - 1)}</b>
                      </span>
                    </div>
                    <p>{line.moves[viewPly - 1].comment ?? 'No note for this move.'}</p>
                  </div>
                )}

                {settings.engine && (
                  <EnginePanel fen={boardFen} lines={liveLines} hidden={engineSpoiler} />
                )}

                {chapter && (
                  <details className="card ideas" open={lineDone}>
                    <summary>Key ideas: {chapter.name}</summary>
                    <ul>
                      {chapter.ideas.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            ) : (
              <p className="muted">Tick at least one chapter on the left to start drilling.</p>
            )
          ) : mode === 'free' ? (
            <>
              <FreePanel
                rep={rep}
                myColor={myColor}
                opponent={opponent}
                moves={free.moves}
                cursor={free.cursor}
                onGo={(san) => applyFreeMove(san)}
                onJump={jumpFree}
              />
              {settings.engine && <EnginePanel fen={boardFen} lines={liveLines} hidden={false} />}
            </>
          ) : mode === 'play' && play ? (
            <>
              <PlayPanel
                myColor={myColor}
                play={play}
                game={playGame}
                thinking={engineThinking}
                level={settings.level}
                onLevel={(level) => setSettings((s) => ({ ...s, level }))}
              />
              {settings.engine && <EnginePanel fen={boardFen} lines={liveLines} hidden={false} />}
            </>
          ) : (
            <>
              <ExplorePanel
                rep={rep}
                myColor={myColor}
                opponent={opponent}
                path={explorePath}
                moves={exploreMoves}
                turn={exploreNode.fen.split(' ')[1] as 'w' | 'b'}
                last={exploreLast}
                onGo={exploreGo}
              />
              {settings.engine && <EnginePanel fen={boardFen} lines={liveLines} hidden={false} />}
            </>
          )}
        </section>
      </main>
      <footer className="foot muted small">
        {rep.lines.length} lines · {rep.nodes.size} positions · Progress is saved in this browser.
      </footer>
    </div>
  );
}

function StatusBox(props: {
  me: string;
  opponent: string;
  feedback: Feedback;
  myTurn: boolean;
  lineDone: boolean;
  viewing: boolean;
  onNext: () => void;
  onRetry: () => void;
  onBackToLive: () => void;
  onPlayOn: () => void;
  verdict: MoveVerdict | null;
}) {
  const { feedback, myTurn, lineDone, viewing, verdict } = props;
  if (viewing)
    return (
      <div className="status info">
        Reviewing an earlier position.{' '}
        <button className="link" onClick={props.onBackToLive}>
          Back to the game
        </button>
      </div>
    );
  if (lineDone && feedback.kind === 'done')
    return (
      <div className={`status ${feedback.mistakes === 0 ? 'good' : 'warn'}`}>
        <b>Line complete</b> —{' '}
        {feedback.mistakes === 0 ? 'no mistakes. Nice!' : `${feedback.mistakes} mistake${feedback.mistakes > 1 ? 's' : ''}.`}{' '}
        Click any move below to review its explanation.
        <div className="status-actions">
          {feedback.mistakes > 0 && <button onClick={props.onRetry}>Try again</button>}
          <button onClick={props.onPlayOn}>Play on vs engine</button>
          <button className="primary" onClick={props.onNext}>
            Next line →
          </button>
        </div>
      </div>
    );
  if (feedback.kind === 'wrong' && myTurn)
    return (
      <div className="status bad">
        <b>{feedback.tried}</b> isn’t the repertoire move here. Try again
        {feedback.attempts >= 2 ? ' — the highlighted piece is the one to move.' : '.'}
        {verdict && verdict.tried === feedback.tried && <VerdictNote verdict={verdict} />}
      </div>
    );
  if (myTurn) return <div className="status info">Your move ({props.me}).</div>;
  return <div className="status muted-status">{props.opponent} is thinking…</div>;
}

function MoveList(props: {
  line: ParsedLine;
  ply: number;
  viewPly: number | null;
  lineDone: boolean;
  onSelect: (ply: number) => void;
}) {
  const { line, ply, viewPly } = props;
  const rows: { n: number; w?: number; b?: number }[] = [];
  for (let i = 0; i < ply; i++) {
    const n = Math.floor(i / 2) + 1;
    if (!rows.length || rows[rows.length - 1].n !== n) rows.push({ n });
    const r = rows[rows.length - 1];
    if (line.moves[i].color === 'w') r.w = i;
    else r.b = i;
  }
  const cell = (i?: number) =>
    i === undefined ? (
      <span />
    ) : (
      <button
        className={`mv ${viewPly === i + 1 ? 'viewing' : ''} ${line.moves[i].comment ? 'has-note' : ''}`}
        onClick={() => props.onSelect(i + 1)}
        title={line.moves[i].comment}
      >
        {line.moves[i].san}
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
      {!props.lineDone && <div className="muted small progress-note">Move {Math.floor(ply / 2) + 1} of {Math.ceil(line.moves.length / 2)}</div>}
    </div>
  );
}

function ExplorePanel(props: {
  rep: Repertoire;
  myColor: Color;
  opponent: string;
  path: string[];
  moves: { san: string; comment?: string; lineIds: Set<string> }[];
  turn: Color;
  last: { san: string; comment?: string; color: Color } | null;
  onGo: (san: string) => void;
}) {
  const { rep, myColor, opponent, moves, turn, last } = props;
  const lineNames = (ids: Set<string>) =>
    [...ids]
      .map((id) => rep.lineById.get(id)?.name)
      .filter(Boolean)
      .slice(0, 3)
      .join(' · ');
  return (
    <>
      <div className="line-title">
        <span className="muted small">Explore the repertoire tree</span>
        <h2>{turn === myColor ? 'Your repertoire move' : `${opponent}’s options`}</h2>
      </div>
      {last?.comment && (
        <div className={`card ${last.color === myColor ? 'why' : 'opponent-move'}`}>
          <div className="card-head">
            <span>
              <b>{last.san}</b>
            </span>
          </div>
          <p>{last.comment}</p>
        </div>
      )}
      {moves.length === 0 ? (
        <p className="muted">End of the prepared line. Go back to explore other branches.</p>
      ) : (
        <ul className="explore-moves">
          {moves.map((m) => (
            <li key={m.san}>
              <button onClick={() => props.onGo(m.san)}>
                <b>{m.san}</b>
                <span className="muted small">
                  {m.lineIds.size} line{m.lineIds.size > 1 ? 's' : ''} · {lineNames(m.lineIds)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="muted small">
        Green arrows are your repertoire moves; blue arrows are {opponent}’s tries. Click a move or play it on the board.
      </p>
    </>
  );
}

/** "3.f4" or "3...d5" for the move at this ply of a game from the start position. */
function plyLabel(ply: number, san: string) {
  const n = Math.floor(ply / 2) + 1;
  return ply % 2 === 0 ? `${n}.${san}` : `${n}...${san}`;
}

function lineNames(rep: Repertoire, ids: Set<string>) {
  const names = [...ids].map((id) => rep.lineById.get(id)?.name).filter(Boolean);
  const more = names.length > 3 ? ` +${names.length - 3} more` : '';
  return names.slice(0, 3).join(' · ') + more;
}

function FreePanel(props: {
  rep: Repertoire;
  myColor: Color;
  opponent: string;
  moves: PlayMove[];
  cursor: number;
  onGo: (san: string) => void;
  onJump: (ply: number) => void;
}) {
  const { rep, myColor, opponent, moves, cursor } = props;
  const fenAt = (ply: number) => (ply === 0 ? START_FEN : moves[ply - 1].fen);
  const nodeAt = (ply: number) => rep.nodes.get(positionKey(fenAt(ply)));
  const turnAt = (ply: number) => fenAt(ply).split(' ')[1] as Color;
  const isBookMove = (ply: number) => !!nodeAt(ply)?.moves.has(moves[ply].san);

  const node = nodeAt(cursor);
  const options = node ? [...node.moves.values()] : [];
  const myTurn = turnAt(cursor) === myColor;
  const lastPly = cursor - 1;
  const lastEdge = lastPly >= 0 ? nodeAt(lastPly)?.moves.get(moves[lastPly].san) : undefined;

  // Out of book: find the last repertoire position before this one (the start always is one).
  let leftBook: { ply: number; text: string } | null = null;
  if (!node) {
    let ply = cursor - 1;
    while (ply > 0 && !nodeAt(ply)) ply--;
    const from = nodeAt(ply)!;
    const played = plyLabel(ply, moves[ply].san);
    const prepared = [...from.moves.keys()].map((san) => plyLabel(ply, san)).join(', ');
    const text = !from.moves.size
      ? `Your prepared lines end before ${played}, so from here you're on your own.`
      : turnAt(ply) === myColor
        ? `You played ${played}, but your repertoire plays ${prepared}.`
        : `${opponent} played ${played}, which your repertoire doesn't cover. It prepares ${prepared}.`;
    leftBook = { ply, text };
  }

  const heading = !node
    ? 'Out of your repertoire'
    : !options.length
      ? 'End of your prepared lines'
      : myTurn
        ? 'Your repertoire move'
        : `${opponent}’s options`;

  const rows: { n: number; w?: number; b?: number }[] = [];
  moves.forEach((_, i) => {
    const n = Math.floor(i / 2) + 1;
    if (i % 2 === 0) rows.push({ n, w: i });
    else if (rows.length) rows[rows.length - 1].b = i;
  });
  const cell = (i?: number) =>
    i === undefined ? (
      <span />
    ) : (
      <button
        className={`mv ${cursor === i + 1 ? 'current' : ''} ${isBookMove(i) ? '' : 'off-book'}`}
        onClick={() => props.onJump(i + 1)}
        title={isBookMove(i) ? 'Repertoire move' : 'Not in your repertoire'}
      >
        {moves[i].san}
      </button>
    );

  return (
    <>
      <div className="line-title">
        <span className="muted small">Free play · you move both sides</span>
        <h2>{heading}</h2>
      </div>

      {lastEdge?.comment && (
        <div className={`card ${turnAt(lastPly) === myColor ? 'why' : 'opponent-move'}`}>
          <div className="card-head">
            <span>
              <b>{plyLabel(lastPly, moves[lastPly].san)}</b>
            </span>
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
              <button onClick={() => props.onGo(m.san)}>
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
          Keep playing to practise the middlegame, turn on Engine analysis, or go back and try another branch.
        </p>
      )}

      <div className="movelist">
        {moves.length === 0 ? (
          <span className="muted small">Make a move on the board for either side, or pick a move above.</span>
        ) : (
          rows.map((r) => (
            <div key={r.n} className="mvrow">
              <span className="mvnum">{r.n}.</span>
              {cell(r.w)}
              {cell(r.b)}
            </div>
          ))
        )}
      </div>

      <p className="muted small">
        Green arrows are your repertoire moves; blue arrows are {opponent}’s tries. Grey italic moves are not in your
        repertoire. Use ← and → to step through the game.
      </p>
    </>
  );
}

function VerdictNote({ verdict }: { verdict: MoveVerdict }) {
  if (verdict.status === 'pending') return <div className="verdict muted-verdict">Engine is checking {verdict.tried}…</div>;
  if (verdict.status === 'error') return <div className="verdict muted-verdict">The engine couldn’t check this move.</div>;
  const { loss, tried, triedScore, reply } = verdict;
  const pawns = (Math.max(0, loss) / 100).toFixed(1);
  let text: string;
  let cls = 'ok';
  if (loss > 5000) {
    text = `${tried} loses by force.`;
    cls = 'bad';
  } else if (loss <= 30) {
    text = `Engine: ${tried} is fine too (${triedScore}) — it just isn’t your repertoire move.`;
  } else if (loss <= 100) {
    text = `Engine: ${tried} is a bit worse than the repertoire move, by about ${pawns} pawns (${triedScore}).`;
    cls = 'meh';
  } else {
    text = `Engine: ${tried} is a mistake — it costs about ${pawns} pawns (${triedScore}).`;
    cls = 'bad';
  }
  return (
    <div className={`verdict ${cls}`}>
      {text}
      {cls !== 'ok' && reply && <div className="small">Likely continuation: {reply}</div>}
    </div>
  );
}

/** White's winning chances as a 0–100 share of the bar. */
function whiteShare(l?: EngineLine) {
  if (!l) return 50;
  if (l.mate !== undefined) return l.mate > 0 ? 100 : 0;
  return 50 + 50 * (2 / (1 + Math.exp(-0.004 * l.cp)) - 1);
}

function EvalBar({ lines, orientation }: { lines: EngineLine[]; orientation: 'white' | 'black' }) {
  const top = lines[0];
  const white = whiteShare(top);
  const whiteOnTop = orientation === 'black';
  return (
    <div className={`evalbar ${whiteOnTop ? 'white-top' : ''}`} title="Engine evaluation (White's point of view)">
      <div className="evalbar-white" style={{ height: `${white}%` }} />
      <span className={`evalbar-label ${white >= 50 ? 'on-white' : 'on-black'}`}>{top ? formatScore(top) : '…'}</span>
    </div>
  );
}

function EnginePanel({ fen, lines, hidden }: { fen: string; lines: EngineLine[]; hidden: boolean }) {
  const game = new Chess(fen);
  return (
    <div className="card engine">
      <div className="card-head">
        <span>
          <b>Stockfish</b>{' '}
          {lines[0] && !hidden && <span className="muted small">depth {lines[0].depth}</span>}
        </span>
      </div>
      {game.isGameOver() ? (
        <p className="muted small">Game over.</p>
      ) : hidden ? (
        <p className="muted small">Engine lines are hidden until you’ve played your move.</p>
      ) : lines.length === 0 ? (
        <p className="muted small">Thinking…</p>
      ) : (
        <ol className="engine-lines">
          {lines.map((l) => (
            <li key={l.multipv}>
              <span className="score">{formatScore(l)}</span>
              <span>{numberedLine(fen, pvToSan(fen, l.pv, 8))}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function PlayPanel(props: {
  myColor: Color;
  play: { startFen: string; moves: PlayMove[]; origin: string };
  game: Chess;
  thinking: boolean;
  level: number;
  onLevel: (l: number) => void;
}) {
  const { myColor, play, game, thinking } = props;
  let status: string;
  let cls = 'info';
  if (game.isCheckmate()) {
    const youWon = game.turn() !== myColor;
    status = youWon ? 'Checkmate — you win!' : 'Checkmate — the engine wins.';
    cls = youWon ? 'good' : 'bad';
  } else if (game.isDraw()) {
    status = 'Draw.';
    cls = 'warn';
  } else if (game.turn() === myColor) {
    status = game.inCheck() ? 'Your move — you are in check.' : 'Your move.';
  } else {
    status = thinking ? 'Engine is thinking…' : 'Engine to move.';
    cls = 'muted-status';
  }
  const startParts = play.startFen.split(' ');
  const firstNo = Number(startParts[5]);
  const startsWhite = startParts[1] === 'w';
  return (
    <>
      <div className="line-title">
        <span className="muted small">Play on vs engine · from: {play.origin}</span>
        <h2>Practise the middlegame</h2>
      </div>
      <div className={`status ${cls}`}>{status}</div>
      <label className="level">
        Engine strength{' '}
        <select value={props.level} onChange={(e) => props.onLevel(Number(e.target.value))}>
          {LEVELS.map((l, i) => (
            <option key={l.label} value={i}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <div className="movelist play-moves">
        {play.moves.length === 0 ? (
          <span className="muted small">Moves will appear here.</span>
        ) : (
          <p>
            {play.moves.map((m, i) => {
              const whiteMove = (i % 2 === 0) === startsWhite;
              const n = firstNo + Math.floor((i + (startsWhite ? 0 : 1)) / 2);
              const prefix = whiteMove ? `${n}. ` : i === 0 ? `${n}... ` : '';
              return (
                <span key={i} className="pm">
                  {prefix}
                  {m.san}{' '}
                </span>
              );
            })}
          </p>
        )}
      </div>
      <p className="muted small">
        Try to carry out the plans from the line’s key ideas. Use Undo to take a move back, and turn on Engine analysis to
        see how you’re doing.
      </p>
    </>
  );
}
