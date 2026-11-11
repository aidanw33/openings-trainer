import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard, type Arrow } from 'react-chessboard';
import { openings } from './data/openings.ts';
import { positionKey, type ParsedLine, type Repertoire } from './lib/repertoire.ts';
import { getAnalysisEngine, getTaskEngine, numberedLine, pvToSan, type EngineLine } from './lib/engine.ts';
import { loadProgress, mastery, pickNextLine, recordRun, resetLines, saveProgress, type Progress } from './lib/progress.ts';
import { type Color } from './lib/notation.ts';
import {
  LEVELS,
  MODE_NAMES,
  REPERTOIRES,
  START_FEN,
  loadSettings,
  saveSettings,
  tickedChapters,
  type ExploreGame,
  type Mode,
  type PlayMove,
  type Setter,
  type Settings,
} from './state.ts';
import { EnginePanel, EvalBar, type MoveVerdict } from './components/Engine.tsx';
import { DrillPanel, type Feedback } from './components/DrillPanel.tsx';
import { ExplorePanel } from './components/ExplorePanel.tsx';
import { PlayPanel, type PlayGame } from './components/PlayPanel.tsx';
import { Sidebar } from './components/Sidebar.tsx';

const COMPUTER_DELAY = 650;
const GREEN = 'rgba(40,160,80,0.85)';
const BLUE = 'rgba(60,110,200,0.6)';
const ORANGE = 'rgba(230,120,20,0.8)';

/** True when a key press should not be taken as a board shortcut (typing in a field, using a menu). */
function isFormTarget(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement | null)?.tagName;
  return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey;
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  useEffect(() => saveSettings(settings), [settings]);
  // The mode and the Explore game live here so they survive switching openings:
  // the same game is then checked against the other repertoire.
  const [mode, setMode] = useState<Mode>('drill');
  const [game, setGame] = useState<ExploreGame>({ moves: [], cursor: 0 });
  const rep = REPERTOIRES.get(settings.opening)!;
  const switchOpening = (id: string) => {
    setSettings((s) => ({ ...s, opening: id }));
    // A play-on game belongs to the old opening's trainer, which is about to reset.
    setMode((m) => (m === 'play' ? 'drill' : m));
  };
  // Keyed by opening so the drill state starts fresh on the new repertoire.
  return (
    <Trainer
      key={rep.opening.id}
      rep={rep}
      settings={settings}
      setSettings={setSettings}
      onSwitchOpening={switchOpening}
      mode={mode}
      setMode={setMode}
      game={game}
      setGame={setGame}
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
  game,
  setGame,
}: {
  rep: Repertoire;
  settings: Settings;
  setSettings: Setter<Settings>;
  onSwitchOpening: (id: string) => void;
  mode: Mode;
  setMode: Setter<Mode>;
  game: ExploreGame;
  setGame: Setter<ExploreGame>;
}) {
  const myColor: Color = rep.opening.side === 'white' ? 'w' : 'b';
  const [progress, setProgress] = useState<Progress>(loadProgress);
  useEffect(() => saveProgress(progress), [progress]);

  const ticked = tickedChapters(rep, settings);
  const tickedKey = ticked.join(',');
  const eligible = useMemo(
    () => rep.lines.filter((l) => ticked.includes(l.chapterId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rep, tickedKey],
  );
  const setTicked = (ids: string[]) =>
    setSettings((s) => ({ ...s, chapters: { ...s.chapters, [rep.opening.id]: ids } }));

  // ----- Drill -----
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
  /** Squares of the wrong move just tried, flashed red on the board for a moment. */
  const [wrongMove, setWrongMove] = useState<{ from: string; to: string } | null>(null);
  useEffect(() => {
    if (!wrongMove) return;
    const t = setTimeout(() => setWrongMove(null), 700);
    return () => clearTimeout(t);
  }, [wrongMove]);
  const verdictId = useRef(0);
  const [openChapters, setOpenChapters] = useState<Set<string>>(() => new Set(line ? [line.chapterId] : []));

  const startLine = useCallback(
    (l: ParsedLine | undefined) => {
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
      if (l) setOpenChapters((s) => (s.has(l.chapterId) ? s : new Set(s).add(l.chapterId)));
    },
    [setMode],
  );

  const nextLine = useCallback(() => {
    startLine(pickNextLine(eligible, progress, line?.id));
  }, [eligible, progress, line, startLine]);

  // The computer plays the opponent's moves.
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
      setVerdict({ id, tried, status: 'done', loss: (lb.cp - la.cp) * sign, reply: numberedLine(fen, pvToSan(fen, la.pv, 5)) });
    });
  };

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
      setFeedback({ kind: 'correct', move: expected, ply });
      setPly((p) => p + 1);
      setHintShown(false);
      missedThisMove.current = false;
      return true;
    }
    if (!missedThisMove.current) {
      missedThisMove.current = true;
      setMistakes((m) => m + 1);
    }
    setHintShown(false);
    setWrongMove({ from, to });
    setFeedback((f) => ({ kind: 'wrong', tried: san, attempts: f.kind === 'wrong' ? f.attempts + 1 : 1 }));
    checkMoveWithEngine(drillFen, uci, san, expected.from + expected.to);
    return false;
  };

  const revealHint = () => {
    if (!missedThisMove.current) {
      missedThisMove.current = true;
      setMistakes((m) => m + 1);
    }
    setHintShown(true);
  };

  /** Review an earlier drill position; reaching the live position returns to the game. */
  const reviewPly = (p: number) => {
    setSelected(null);
    setViewPly(p >= ply ? null : Math.max(0, p));
  };

  // ← and → review the moves played so far in a drill.
  useEffect(() => {
    if (mode !== 'drill' || !line) return;
    const onKey = (e: KeyboardEvent) => {
      if (isFormTarget(e) || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      e.preventDefault();
      setSelected(null);
      setViewPly((v) => {
        const cur = v ?? ply;
        const next = e.key === 'ArrowLeft' ? Math.max(0, cur - 1) : cur + 1;
        return next >= ply ? null : next;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, line, ply]);

  // ----- Explore: move either side while the repertoire guides you -----
  const [flipped, setFlipped] = useState(false);
  const exploreFen = game.cursor ? game.moves[game.cursor - 1].fen : START_FEN;
  const exploreNode = rep.nodes.get(positionKey(exploreFen));

  /**
   * Play a move on the Explore board. Replaying the next move of the game just steps
   * forward; any other move replaces the moves after this point.
   */
  const applyExploreMove = (move: string | { from: string; to: string; promotion: string }): boolean => {
    const c = new Chess(exploreFen);
    try {
      const m = c.move(move);
      const next = { san: m.san, from: m.from, to: m.to, fen: c.fen() };
      setGame((g) =>
        g.moves[g.cursor]?.san === next.san
          ? { ...g, cursor: g.cursor + 1 }
          : { moves: [...g.moves.slice(0, g.cursor), next], cursor: g.cursor + 1 },
      );
      return true;
    } catch {
      return false;
    }
  };
  const jumpExplore = (p: number) => {
    setSelected(null);
    setGame((g) => ({ ...g, cursor: Math.max(0, Math.min(g.moves.length, p)) }));
  };
  const loadLineInExplore = (l: ParsedLine) => {
    setSelected(null);
    setGame({
      moves: l.moves.map((m) => ({ san: m.san, from: m.from, to: m.to, fen: m.fenAfter })),
      cursor: 0,
      lineId: l.id,
    });
  };

  // ← and → step through the Explore game.
  useEffect(() => {
    if (mode !== 'explore') return;
    const onKey = (e: KeyboardEvent) => {
      if (isFormTarget(e) || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      e.preventDefault();
      setSelected(null);
      setGame((g) => ({
        ...g,
        cursor: e.key === 'ArrowLeft' ? Math.max(0, g.cursor - 1) : Math.min(g.moves.length, g.cursor + 1),
      }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, setGame]);

  // ----- Play on against the engine -----
  const [play, setPlay] = useState<(PlayGame & { returnTo: Mode }) | null>(null);
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
      const next: PlayMove = { san: m.san, from: m.from, to: m.to, fen: c.fen() };
      setPlay((p) => (p ? { ...p, moves: [...p.moves, next] } : p));
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
  const boardFen =
    mode === 'explore'
      ? exploreFen
      : mode === 'play'
        ? playFen
        : viewPly !== null && line
          ? viewPly === 0
            ? START_FEN
            : line.moves[viewPly - 1].fenAfter
          : drillFen;

  const lastMove =
    mode === 'explore'
      ? (game.moves[game.cursor - 1] ?? null)
      : mode === 'play'
        ? (play?.moves[play.moves.length - 1] ?? null)
        : line && (viewPly ?? ply) > 0
          ? line.moves[(viewPly ?? ply) - 1]
          : null;

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    squareStyles[lastMove.from] = { background: 'var(--last-move)' };
    squareStyles[lastMove.to] = { background: 'var(--last-move)' };
  }
  if (wrongMove && mode === 'drill') {
    squareStyles[wrongMove.from] = { ...squareStyles[wrongMove.from], background: 'var(--wrong-sq)' };
    squareStyles[wrongMove.to] = { ...squareStyles[wrongMove.to], background: 'var(--wrong-sq)' };
  }
  if (selected) {
    squareStyles[selected] = { background: 'var(--selected)' };
    for (const m of new Chess(boardFen).moves({ square: selected as Square, verbose: true })) {
      squareStyles[m.to] = {
        ...squareStyles[m.to],
        backgroundImage: 'radial-gradient(circle, var(--dot) 22%, transparent 24%)',
      };
    }
  }

  const arrows: Arrow[] = [];
  if (mode === 'drill' && myTurn && expected && (hintShown || settings.guided)) {
    arrows.push({ startSquare: expected.from, endSquare: expected.to, color: GREEN });
  }
  if (mode === 'drill' && feedback.kind === 'wrong' && feedback.attempts >= 2 && expected && myTurn && !hintShown) {
    // After two misses, show which piece moves.
    squareStyles[expected.from] = { ...squareStyles[expected.from], boxShadow: 'inset 0 0 0 4px rgba(40,160,80,0.9)' };
  }
  if (mode === 'explore' && exploreNode) {
    const mine = exploreNode.fen.split(' ')[1] === myColor;
    for (const e of exploreNode.moves.values()) {
      arrows.push({ startSquare: e.from, endSquare: e.to, color: mine ? GREEN : BLUE });
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
      arrows.push({ startSquare, endSquare, color: ORANGE });
    }
  }
  const enginePanel = settings.engine ? <EnginePanel fen={boardFen} lines={liveLines} hidden={engineSpoiler} /> : null;

  const turnColor = boardFen.split(' ')[1];
  const playerCanMove = mode === 'play' && !playOver && turnColor === myColor;
  const canMovePieces = mode === 'explore' || myTurn || playerCanMove;
  const otherSide = rep.opening.side === 'white' ? 'black' : 'white';
  const orientation = mode === 'explore' && flipped ? otherSide : rep.opening.side;

  const tryMove = (from: string, to: string): boolean => {
    setSelected(null);
    if (mode === 'drill') return tryDrillMove(from, to);
    if (mode === 'play') return playerCanMove ? applyPlayMove(from, to) : false;
    return applyExploreMove({ from, to, promotion: 'q' });
  };

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
  const chapter = line ? rep.chapterOf.get(line.id) : undefined;
  const totalKnown = rep.lines.filter((l) => mastery(progress[l.id]) === 'known').length;
  const toggleOpen = (id: string) =>
    setOpenChapters((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const resetProgress = () => {
    if (!window.confirm(`Reset your progress for the ${rep.opening.name}? This can’t be undone.`)) return;
    setProgress((p) => resetLines(p, rep.lines.map((l) => l.id)));
  };
  const hasProgress = rep.lines.some((l) => progress[l.id]);

  const tabs: { id: Mode; label: string }[] = [
    { id: 'drill', label: 'Drill' },
    { id: 'explore', label: 'Explore' },
    ...(play ? [{ id: 'play' as Mode, label: 'Play' }] : []),
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            ♞
          </span>
          <div>
            <h1>Openings Trainer</h1>
            <p>
              {totalKnown} of {rep.lines.length} lines mastered
            </p>
          </div>
        </div>
        <select
          className="opening-picker"
          aria-label="Opening to train"
          value={rep.opening.id}
          onChange={(e) => onSwitchOpening(e.target.value)}
        >
          {openings.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} · you play {o.side === 'white' ? 'White' : 'Black'}
            </option>
          ))}
        </select>
        <div className="tabs" role="tablist" aria-label="Mode">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={mode === t.id}
              className={mode === t.id ? 'active' : ''}
              onClick={() => setMode(t.id)}
            >
              {t.label}
            </button>
          ))}
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
        <Sidebar
          rep={rep}
          mode={mode}
          myColor={myColor}
          progress={progress}
          ticked={ticked}
          onTicked={setTicked}
          open={openChapters}
          onToggleOpen={toggleOpen}
          currentLineId={mode === 'explore' ? game.lineId : line?.id}
          maskCurrent={mode === 'drill' && !lineDone}
          onLine={(l) => (mode === 'explore' ? loadLineInExplore(l) : startLine(l))}
          guided={settings.guided}
          onGuided={(guided) => setSettings((s) => ({ ...s, guided }))}
        />

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
                  onPieceDrop: ({ sourceSquare, targetSquare }) =>
                    targetSquare ? tryMove(sourceSquare, targetSquare) : false,
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
          ) : mode === 'explore' ? (
            <div className="controls">
              <div className="button-group" role="group" aria-label="Step through the game">
                <button onClick={() => jumpExplore(0)} disabled={game.cursor === 0} aria-label="Start" title="Start">
                  ⏮
                </button>
                <button
                  onClick={() => jumpExplore(game.cursor - 1)}
                  disabled={game.cursor === 0}
                  aria-label="Back one move"
                  title="Back (←)"
                >
                  ◀
                </button>
                <button
                  onClick={() => jumpExplore(game.cursor + 1)}
                  disabled={game.cursor >= game.moves.length}
                  aria-label="Forward one move"
                  title="Forward (→)"
                >
                  ▶
                </button>
                <button
                  onClick={() => jumpExplore(game.moves.length)}
                  disabled={game.cursor >= game.moves.length}
                  aria-label="Last move"
                  title="Last move"
                >
                  ⏭
                </button>
              </div>
              <button onClick={() => setFlipped((f) => !f)} title="View the board from the other side">
                ⇅ Flip
              </button>
              <button className="primary" onClick={() => startPlay(exploreFen, 'Explore position', 'explore')}>
                Play from here vs engine
              </button>
            </div>
          ) : (
            <div className="controls">
              <button onClick={revealHint} disabled={!myTurn || hintShown} title="Show the move (counts as a mistake)">
                Hint
              </button>
              <button onClick={() => startLine(line)} disabled={!line}>
                Restart line
              </button>
              <button className="primary" onClick={nextLine} disabled={!eligible.length}>
                Next line →
              </button>
            </div>
          )}
        </section>

        <section className="panel" aria-live="polite">
          {mode === 'drill' ? (
            line ? (
              <DrillPanel
                line={line}
                chapter={chapter}
                myColor={myColor}
                ply={ply}
                lineDone={lineDone}
                viewPly={viewPly}
                myTurn={myTurn}
                feedback={feedback}
                stats={progress[line.id]}
                firstVisit={!Object.keys(progress).length}
                verdict={verdict}
                hintShown={hintShown}
                showOpponentIdea={showOpponentIdea}
                onShowOpponentIdea={() => setShowOpponentIdea(true)}
                onSelectPly={reviewPly}
                onBackToLive={() => setViewPly(null)}
                onNext={nextLine}
                onRetry={() => startLine(line)}
                onPlayOn={() => startPlay(drillFen, line.name, 'drill')}
                engine={enginePanel}
              />
            ) : (
              <div className="empty-state">
                <h2>Nothing to drill</h2>
                <p className="muted">Tick at least one chapter under Variations, then press Next line.</p>
              </div>
            )
          ) : mode === 'play' && play ? (
            <PlayPanel
              myColor={myColor}
              play={play}
              game={playGame}
              thinking={engineThinking}
              level={settings.level}
              onLevel={(level) => setSettings((s) => ({ ...s, level }))}
              engine={enginePanel}
            />
          ) : (
            <ExplorePanel
              rep={rep}
              myColor={myColor}
              game={game}
              onGo={(san) => applyExploreMove(san)}
              onJump={jumpExplore}
              engine={enginePanel}
            />
          )}
        </section>
      </main>

      <footer className="foot muted small">
        {rep.lines.length} lines · {rep.nodes.size} positions · Progress is saved in this browser
        {hasProgress && (
          <>
            {' · '}
            <button className="link muted-link" onClick={resetProgress}>
              Reset progress
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
