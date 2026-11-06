# Openings Trainer

A local, in-browser trainer for learning chess openings. It currently covers the **Caro-Kann Defence from Black's side**.

The computer plays White and picks from many different variations. You have to find Black's repertoire move. After each correct move you see **why** it's played: the ideas, plans and motifs behind it. You can also ask what White is aiming for.

## Run it

Requires Node 20+.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## How it works

- **Drill**: the trainer picks the line that most needs practice. It starts with lines you haven't seen, then lines you made mistakes in, then lines you haven't played for a while. A wrong move is rejected and counted. After two misses the piece to move is highlighted, and **Hint** shows the full move. When a line ends you can click any move to re-read its explanation.
- **Explore**: browse the whole repertoire tree. Green arrows show your moves and blue arrows show White's alternatives.
- **Variations sidebar**: tick chapters to include them in drills, or click a single line to practise it. The dots show mastery. A line counts as mastered after three clean runs in a row.
- **Guided mode** shows an arrow for every move, which helps on a first pass through new lines.
- Progress is saved in your browser's localStorage.

## Engine (Stockfish)

The app runs Stockfish 19 (the lite, single-threaded WebAssembly build) in your browser. `npm install` copies it into `public/engine/`. That folder is git-ignored, so the repo stays small.

- **Was my move bad, or just different?** When you play a move that isn't in your repertoire, the engine checks it. It reports "fine too, just not your repertoire move", "a bit worse", "a mistake" or "loses by force", and shows the likely continuation.
- **Engine analysis toggle** (top bar): shows an evaluation bar, a best-move arrow and the engine's top 3 lines. During a drill the arrow and lines stay hidden until you've played your move, so the engine doesn't give away the answer.
- **Play on vs engine**: at the end of a line, or from any position in Explore, you can keep playing against Stockfish at five strength levels, with undo.

### Engine policy: human lines first

The repertoire is meant for playing humans, so it prefers established, practical lines over the engine's top choice. The engine is used as an error check:

```bash
npm run engine-check            # depth 16; add -- --depth 20 for a deeper run
```

- **Likely mistakes**: a move that loses a pawn or more. These are almost always real errors and should be fixed.
- **Review**: the engine prefers something else by 0.4–1 pawn. Fine to keep if it's established theory.
- **Kept by choice**: moves marked with `[book]` at the start of their comment, such as a gambit or a well-known human line. They are never flagged.
- **Final position of each line**: catches lines where small losses add up.

Stockfish is GPLv3-licensed. That doesn't matter for personal use, but if you distribute the app with the engine bundled, the project needs to be GPL-compatible.

## Repertoire coverage

| Chapter | Lines |
| --- | --- |
| Advance (3.e5 Bf5): Short System, 6.Be3, Bayonet 4.Nc3/g4, 4.h4 (5.c4 and 5.Bd3), 4.Bd3, 4.c3, 2.Nf3 move order | 8 |
| Classical (3.Nc3/3.Nd2 dxe4 4.Nxe4 Bf5): 6.h4 main lines with 11.Bd2 and 11.Bf4, 7.h5, 6.N1e2, 6.Nh3, 6.Bc4, 5.Nc5, 5.Bd3 gambit | 9 |
| Exchange (4.Bd3): 7.Qb3 main line, 6.Nf3, 4.c3 | 3 |
| Panov-Botvinnik (4.c4): 8.Bd3 IQP, 8.Bc4 hanging pawns, 6.Bg5, 7.c5 | 4 |
| Two Knights (2.Nc3 d5 3.Nf3 Bg4): 6.d4, 6.d3, 2.Nf3 move order | 3 |
| Fantasy (3.f3): 4.Nc3 Bb4 5.a3 (punishing 7.fxe4), 5.e5, 4.Nd2 c5 | 3 |
| Sidelines: King's Indian Attack 2.d3, 2.c4 | 2 |

The lines are hand-written from standard Caro-Kann theory (not copied from a specific book) and checked with Stockfish for outright mistakes.

## Adding or editing lines

Lines live in `src/data/caroKann.ts` as mini-PGN, with a `{comment}` after a move to explain it:

```
1.e4 c6 2.d4 d5 3.e5 {White gains space.} Bf5 {Get the bishop out before ...e6.}
```

Lines that share moves only need a comment once, because positions are merged across lines, transpositions included. After editing, run:

```bash
npm run validate
```

This checks every move is legal and that Black always has a single repertoire move in each position. Then run `npm run engine-check` to catch blunders. Start a comment with `[book]` to keep a move the engine dislikes on purpose.
