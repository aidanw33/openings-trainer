# Openings Trainer

A local, in-browser trainer for learning chess openings.
It covers two repertoires, and you switch between them with the picker in the top bar:

- **Caro-Kann Defence**, played as Black.
- **Vienna Game**, played as White.

The computer plays the other side and picks from many different variations.
You have to find your repertoire move.
After each correct move you see **why** it's played: the ideas, plans and motifs behind it.
You can also ask what your opponent is aiming for.

## Run it

Requires Node 20.19+ (or 22.12+).

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## How it works

- **Drill**: the trainer picks the line that most needs practice.
  It starts with lines you haven't seen, then lines you made mistakes in, then lines you haven't played for a while.
  Your own moves are hidden in the line's title (shown as a blank) until you finish it, so the name doesn't give the answers away.
  A wrong move is rejected and counted, and Stockfish says whether it was fine, a little worse or a real mistake.
  After two misses the piece to move is highlighted, and **Hint** shows the full move.
  Use ← and → or click a move to review earlier positions and their explanations.
- **Explore**: move the pieces for both sides, any legal move, or click one of the suggested moves.
  After every move the panel shows what the current opening's repertoire recommends from that position, with the explanation and the lines it belongs to.
  Transpositions are recognised, and when the game leaves the repertoire the panel says where and what was prepared instead.
  Click a line in the Variations tab to load it onto the board and step through it.
  Use the arrow buttons or the ← and → keys to step through the game, and Flip to view it from the other side.
  Switching openings keeps the game, so you can check the same moves against the other repertoire.
- **Variations tab**: tick chapters to include them in drills (All and None tick or untick every chapter), or click a single line to practise it.
  Each opening remembers its own ticked chapters.
  The dots show mastery.
  A line counts as mastered after three clean runs in a row.
- **Guided drills** show an arrow for every move, which helps on a first pass through new lines.
- Progress and settings are saved in your browser's localStorage.
  **Reset progress** in the footer clears the progress for the current opening.

## Board and workspace

The board sits between a navigation rail and one tabbed panel for the lesson, variations, and settings.
On phones the board is full width, the panel follows below it, and the action bar stays at the bottom.
Dark is the default appearance, with a saved Light option in Settings.
Choose Sage, Walnut, or Slate boards in Settings.
The original react-chessboard pieces are retained on the board, in player bars, and in the promotion picker.
The react-chessboard package is MIT-licensed; this update adds no third-party artwork.
The synthesized Web Audio cues are original, with distinct sounds for moves, captures, check, castling, correct and incorrect answers, and completion.
Use the music-note toggle or Settings to mute sounds; the choice persists across visits.
Player bars identify each side, show captured pieces, and show positive material advantages using pawn = 1, knight/bishop = 3, rook = 5, and queen = 9.
Click a piece for legal-move dots, or drag it with a lifted shadow.
Right-drag to draw arrows and right-click to mark squares; annotations clear when the position changes.
Promoting a pawn opens a keyboard-accessible picker for queen, rook, bishop, or knight, and Escape cancels it.

Drills show a line progress bar, a session streak of correct moves, and progress toward three clean runs for mastery.
Wrong moves and hints reset the session streak.
The coach bubble explains the move, including the final move of a completed line.
A green destination badge marks the repertoire move and a red cross marks a rejected alternative.
Stockfish additionally grades alternatives as Best, Good, Inaccuracy, Mistake, or Blunder against its unrestricted depth-15 search, while the explanation retains the comparison against the repertoire move.
These grades are approximate engine feedback, not a claim of exhaustive analysis.
Use H for Hint, R for Retry, and N for the next line; shortcuts are also shown in tooltips.

Explore and Play use clickable two-column figurine move lists.
Left/Right and Home/End review positions in all modes.
In Play, return to the live position before making another move.
Click an engine variation to preview it on the main board, use its arrow buttons or keyboard navigation to step through it, and Close or Escape to return without modifying the game.
Engine lines remain hidden on your live drill turn.
The evaluation bar reserves its own space and does not resize the board when toggled.
Existing progress and per-opening chapter choices keep their original localStorage keys, and older settings gain appearance defaults without deleting saved values.

To run focused UI regression checks without a browser:

```bash
node --import tsx scripts/ui-regressions.tsx
```

## Engine (Stockfish)

The app runs Stockfish 19 (the lite, single-threaded WebAssembly build) in your browser.
`npm install` copies it into `public/engine/`.
That folder is git-ignored, so the repo stays small.

- **Was my move bad, or just different?** When you play a move that isn't in your repertoire, the engine checks it.
  It reports "fine too, just not your repertoire move", "a bit worse", "a mistake" or "loses by force", and shows the likely continuation.
- **Engine analysis toggle** (top bar): shows an evaluation bar, a best-move arrow and the engine's top 3 lines.
  During a drill the arrow and lines stay hidden until you've played your move, so the engine doesn't give away the answer.
- **Play on vs engine**: at the end of a line, or from any position in Explore, you can keep playing against Stockfish at five strength levels, with undo.

### Engine policy: human lines first

The repertoires are meant for playing humans, so they prefer established, practical lines over the engine's top choice.
The engine is used as an error check:

```bash
npm run engine-check                        # every opening, depth 16
npm run engine-check -- --opening vienna    # one opening
npm run engine-check -- --depth 20          # a deeper run
npm run engine-check -- --opponent          # also check the opponent's moves
```

- **Likely mistakes**: a move that loses a pawn or more.
  These are almost always real errors and should be fixed.
- **Review**: the engine prefers something else by 0.4 to 1 pawn.
  Fine to keep if it's established theory.
- **Kept by choice**: moves marked with `[book]` at the start of their comment, such as a gambit, a well-known human line, or an opponent's blunder in a trap line.
  They are never flagged.
- **Final position of each line**: catches lines where small losses add up.

Stockfish is GPLv3-licensed.
That doesn't matter for personal use, but if you distribute the app with the engine bundled, the project needs to be GPL-compatible.

## Repertoire coverage

### Caro-Kann Defence (Black)

| Chapter | Lines |
| --- | --- |
| Advance (3.e5 Bf5): Short System, 6.Be3, Bayonet 4.Nc3/g4, 4.h4 (5.c4 and 5.Bd3), 4.Bd3, 4.c3, 2.Nf3 move order | 8 |
| Classical (3.Nc3/3.Nd2 dxe4 4.Nxe4 Bf5): 6.h4 main lines with 11.Bd2 and 11.Bf4, 7.h5, 6.N1e2, 6.Nh3, 6.Bc4, 5.Nc5, 5.Bd3 gambit | 9 |
| Exchange (4.Bd3): 7.Qb3 main line, 6.Nf3, 4.c3 | 3 |
| Panov-Botvinnik (4.c4): 8.Bd3 IQP, 8.Bc4 hanging pawns, 6.Bg5, 7.c5 | 4 |
| Two Knights (2.Nc3 d5 3.Nf3 Bg4): 6.d4, 6.d3, 2.Nf3 move order | 3 |
| Fantasy (3.f3): 4.Nc3 Bb4 5.a3 (punishing 7.fxe4), 5.e5, 4.Nd2 c5 | 3 |
| Sidelines: King's Indian Attack 2.d3, 2.c4 | 2 |

### Vienna Game (White)

| Chapter | Lines |
| --- | --- |
| Vienna Gambit (2...Nf6 3.f4 d5 4.fxe5 Nxe4 5.Nf3): 5...Be7 6.Qe2, 5...Nc6 6.Bb5, 5...Bg4 6.Qe2, 5...Bc5 6.d4, and the 4...d4? trap | 5 |
| Gambit accepted and 3...d6: 3...exf4 4.e5 Ng8, the 4...Ng4? and 4...Nh5? traps, 3...d6 4.Nf3 | 4 |
| 2...Nc6 (and 2...Bc5) 3.Bc4: 4.d3 Bc5 5.f4 with 7.Na4, the 6...Ng4 7.Ng5 trick and the 5...Ng4? trap, 4...Bb4, 4...Na5, 2...Bc5 move order | 6 |
| 3...Bc5 4.Qg4: 4...Qf6 5.Nd5 (with 7...Qd4? and 7...h5!), 4...Nf6? with the Qxf7# trap, 4...g6 | 5 |

The lines are hand-written from standard opening theory (not copied from a specific book) and checked with Stockfish for outright mistakes.
The Vienna does not cover 2...d6 or 2...Bb4 yet.

## Adding or editing lines

Each opening lives in its own file in `src/data/` (`caroKann.ts`, `vienna.ts`) and is listed in `src/data/openings.ts`.
Lines are written as mini-PGN, with a `{comment}` after a move to explain it:

```
1.e4 c6 2.d4 d5 3.e5 {White gains space.} Bf5 {Get the bishop out before ...e6.}
```

Lines that share moves only need a comment once, because positions are merged across lines, transpositions included.
Line ids must be unique across all openings, because progress is stored by line id.
After editing, run:

```bash
npm run validate
```

This checks that every move is legal, that you always have a single repertoire move in each position, and that line ids are unique.
Then run `npm run engine-check` to catch blunders.
Start a comment with `[book]` to keep a move the engine dislikes on purpose.
