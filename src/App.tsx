import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard, type Arrow } from 'react-chessboard';
import { caroKann } from './data/caroKann.ts';
import { buildRepertoire, type ParsedLine, type ParsedMove } from './lib/repertoire.ts';
import {
  formatScore,
  getAnalysisEngine,
  getTaskEngine,
  numberedLine,
  pvToSan,
  type EngineLine,
} from './lib/engine.ts';
import { loadProgress, mastery, pickNextLine, recordRun, saveProgress, type Progress } from './lib/progress.ts';

const rep = buildRepertoire(caroKann);
const START_FEN = new Chess().fen();
const MY_COLOR = rep.opening.side === 'white' ? 'w' : 'b';
const COMPUTER_DELAY = 650;

type Mode = 'drill' | 'explore' | 'play';
type Feedback =
  | { kind: 'idle' }
  | { kind: 'wrong'; tried: string; attempts: number }
  | { kind: 'correct'; move: ParsedMove }
  | { kind: 'done'; mistakes: number };

const SETTINGS_KEY = 'openings-trainer:settings:v1';
interface Settings {
  chapters: string[];
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
function loadSettings(): Settings {
  const all = rep.opening.chapters.map((c) => c.id);
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null') as Settings | null;
    if (s && Array.isArray(s.chapters))
      return {
        chapters: s.chapters.filter((c) => all.includes(c)),
        guided: !!s.guided,
        engine: !!s.engine,
        level: typeof s.level === 'number' ? s.level : 2,
      };
  } catch {
    /* ignore */
  }
  return { chapters: all, guided: false, engine: false, level: 2 };
}

function moveLabel(moves: ParsedMove[], i: number) {
  const n = Math.floor(i / 2) + 1;
  return moves[i].color === 'w' ? `${n}.${moves[i].san}` : `${n}...${moves[i].san}`;
}

export default function App() {
  const [mode, setMode] = useState<Mode>('drill');
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [progress, setProgress] = useState<Progress>(loadProgress);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);
  useEffect(() => saveProgress(progress), [progress]);

  const eligible = useMemo(
    () => rep.lines.filter((l) => settings.chapters.includes(l.chapterId)),
    [settings.chapters],
  );

  // ----- Drill state -----
  const [line, setLine] = useState<ParsedLine | undefined>(() => pickNextLine(eligible, progress));
  const [ply, setPly] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'idle' });
  const [hintShown, setHintShown] = useState(false);
  const [showWhiteIdea, setShowWhiteIdea] = useState(false);
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
    setShowWhiteIdea(false);
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
    if (mode !== 'drill' || !expected || expected.color === MY_COLOR) return;
    const t = setTimeout(() => {
      setPly((p) => p + 1);
      setShowWhiteIdea(false);
    }, COMPUTER_DELAY);
    return () => clearTimeout(t);
  }, [mode, expected]);

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
  const myTurn = mode === 'drill' && !!expected && expected.color === MY_COLOR && viewPly === null;

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

  // ----- Play-on vs engine -----
  const [play, setPlay] = useState<{ startFen: string; moves: PlayMove[]; origin: string } | null>(null);
  const playFen = play ? (play.moves.length ? play.moves[play.moves.length - 1].fen : play.startFen) : START_FEN;
  const playGame = useMemo(() => new Chess(playFen), [playFen]);
  const playOver = playGame.isGameOver();
  const [engineThinking, setEngineThinking] = useState(false);

  const startPlay = (fen: string, origin: string) => {
    setPlay({ startFen: fen, moves: [], origin });
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
      while (moves.length && turnOf(moves) !== MY_COLOR) moves.pop();
      return { ...p, moves };
    });

  // The engine answers when it is its turn.
  useEffect(() => {
    if (mode !== 'play' || !play || playOver || playFen.split(' ')[1] === MY_COLOR) return;
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
      : mode === 'play'
        ? playFen
        : viewing
        ? viewPly === 0
          ? START_FEN
          : line!.moves[viewPly - 1].fenAfter
        : drillFen;

  const lastMove = (() => {
    if (mode === 'explore') return null;
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
  if (mode === 'explore') {
    for (const e of exploreMoves) {
      arrows.push({
        startSquare: e.from,
        endSquare: e.to,
        color: (exploreNode.fen.split(' ')[1] === MY_COLOR) ? 'rgba(40,160,80,0.8)' : 'rgba(60,110,200,0.6)',
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
    arrows.push({ startSquare: u.slice(0, 2), endSquare: u.slice(2, 4), color: 'rgba(230,120,20,0.8)' });
  }

  const tryMove = (from: string, to: string): boolean => {
    setSelected(null);
    if (mode === 'drill') return tryDrillMove(from, to);
    if (mode === 'play') return playerCanMove ? applyPlayMove(from, to) : false;
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
  const playerCanMove = mode === 'play' && !playOver && turnColor === MY_COLOR;
  const canMovePieces = mode === 'explore' || myTurn || playerCanMove;

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
  const whiteMoveJustPlayed = mode === 'drill' && line && ply > 0 && line.moves[ply - 1].color !== MY_COLOR ? line.moves[ply - 1] : null;
  const chapter = line ? rep.chapterOf.get(line.id) : undefined;

  const toggleChapter = (id: string) =>
    setSettings((s) => ({
      ...s,
      chapters: s.chapters.includes(id) ? s.chapters.filter((c) => c !== id) : [...s.chapters, id],
    }));

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
            <p>{rep.opening.name} · you play {rep.opening.side === 'black' ? 'Black' : 'White'}</p>
          </div>
        </div>
        <div className="tabs" role="tablist">
          <button className={mode === 'drill' ? 'active' : ''} onClick={() => setMode('drill')}>
            Drill
          </button>
          <button className={mode === 'explore' ? 'active' : ''} onClick={() => setMode('explore')}>
            Explore
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
        <div className="score">
          {totalKnown}/{rep.lines.length} lines mastered
        </div>
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
                    checked={settings.chapters.includes(ch.id)}
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
          {settings.engine && <EvalBar lines={liveLines} orientation={rep.opening.side} />}
          <div className="board-wrap">
            <Chessboard
              options={{
                position: boardFen,
                boardOrientation: rep.opening.side,
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
              <button className="primary" onClick={() => setMode(line ? 'drill' : 'explore')}>
                Back to {line ? 'drill' : 'explore'}
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
              <button className="primary" onClick={() => startPlay(exploreNode.fen, 'Explore position')}>
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
                  feedback={feedback}
                  myTurn={myTurn}
                  lineDone={lineDone}
                  viewing={viewPly !== null}
                  onNext={nextLine}
                  onRetry={() => startLine(line)}
                  onBackToLive={() => setViewPly(null)}
                  onPlayOn={() => startPlay(drillFen, line.name)}
                  verdict={verdict}
                />

                {whiteMoveJustPlayed && !lineDone && viewPly === null && (
                  <div className="card white-move">
                    <div className="card-head">
                      <span>
                        White played <b>{moveLabel(line.moves, ply - 1)}</b>
                      </span>
                      {whiteMoveJustPlayed.comment && !showWhiteIdea && (
                        <button className="link" onClick={() => setShowWhiteIdea(true)}>
                          What is White up to?
                        </button>
                      )}
                    </div>
                    {showWhiteIdea && whiteMoveJustPlayed.comment && <p>{whiteMoveJustPlayed.comment}</p>}
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
          ) : mode === 'play' && play ? (
            <>
              <PlayPanel
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
  if (myTurn) return <div className="status info">Your move (Black).</div>;
  return <div className="status muted-status">White is thinking…</div>;
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
  path: string[];
  moves: { san: string; comment?: string; lineIds: Set<string> }[];
  turn: 'w' | 'b';
  last: { san: string; comment?: string; color: 'w' | 'b' } | null;
  onGo: (san: string) => void;
}) {
  const { moves, turn, last } = props;
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
        <h2>{turn === MY_COLOR ? 'Your repertoire move' : 'White’s options'}</h2>
      </div>
      {last?.comment && (
        <div className={`card ${last.color === MY_COLOR ? 'why' : 'white-move'}`}>
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
        Green arrows are your repertoire moves; blue arrows are White’s tries. Click a move or play it on the board.
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
  play: { startFen: string; moves: PlayMove[]; origin: string };
  game: Chess;
  thinking: boolean;
  level: number;
  onLevel: (l: number) => void;
}) {
  const { play, game, thinking } = props;
  let status: string;
  let cls = 'info';
  if (game.isCheckmate()) {
    const youWon = game.turn() !== MY_COLOR;
    status = youWon ? 'Checkmate — you win!' : 'Checkmate — the engine wins.';
    cls = youWon ? 'good' : 'bad';
  } else if (game.isDraw()) {
    status = 'Draw.';
    cls = 'warn';
  } else if (game.turn() === MY_COLOR) {
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
