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

## Repertoire coverage

| Chapter | Lines |
| --- | --- |
| Advance (3.e5 Bf5): Short System, 6.Be3, Bayonet 4.Nc3/g4, 4.h4 (5.c4 and 5.Bd3), 4.Bd3, 4.c3, 2.Nf3 move order | 8 |
| Classical (3.Nc3/3.Nd2 dxe4 4.Nxe4 Bf5): 6.h4 main lines with 11.Bd2 and 11.Bf4, 7.h5, 6.N1e2, 6.Nh3, 6.Bc4, 5.Nc5, 5.Bd3 gambit | 9 |
| Exchange (4.Bd3): 7.Qb3 main line, 6.Nf3, 4.c3 | 3 |
| Panov-Botvinnik (4.c4): 8.Bd3 IQP, 8.Bc4 hanging pawns, 6.Bg5, 7.c5 | 4 |
| Two Knights (2.Nc3 d5 3.Nf3 Bg4): 6.d4, 6.d3, 2.Nf3 move order | 3 |
| Fantasy (3.f3): 4.Nc3 Bb4, 4.Nd2 c5 | 2 |
| Sidelines: King's Indian Attack 2.d3, 2.c4 | 2 |

The lines are hand-written study material, not engine output. Check anything critical with an engine.

## Adding or editing lines

Lines live in `src/data/caroKann.ts` as mini-PGN, with a `{comment}` after a move to explain it:

```
1.e4 c6 2.d4 d5 3.e5 {White gains space.} Bf5 {Get the bishop out before ...e6.}
```

Lines that share moves only need a comment once, because positions are merged across lines, transpositions included. After editing, run:

```bash
npm run validate
```

This checks every move is legal and that Black always has a single repertoire move in each position.
