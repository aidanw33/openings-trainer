import type { Opening } from './types.ts';

/*
 * Vienna Game repertoire for White.
 *
 * Same format as caroKann.ts: each line is a mini-PGN, and a {comment} right
 * after a move explains it. Comments on White moves are the "why" you see after
 * playing them; comments on Black moves explain what Black is aiming for.
 * Lines that share moves only need the comment written once, because the
 * trainer merges positions across lines (transpositions included).
 *
 * The choices were checked with Stockfish (`npm run engine-check`). Where the
 * engine prefers a different but equal move, the repertoire keeps the line that
 * is easier to understand and play.
 *
 * The trap lines deliberately include Black mistakes so you learn to punish
 * them. Those Black moves are marked [book], so `npm run engine-check -- --opponent`
 * lists them as kept by choice instead of flagging them.
 */

export const vienna: Opening = {
  id: 'vienna',
  name: 'Vienna Game',
  side: 'white',
  summary:
    '1.e4 e5 2.Nc3 develops a knight that guards e4 and d5 but leaves the f-pawn free, so f4 can follow as a King\'s Gambit with a piece already out. Against 2...Nf6 you play the sharp Vienna Gambit 3.f4. Against 2...Nc6 or 2...Bc5 you develop with 3.Bc4 and d3 first, and push f4 when your pieces are ready.',
  chapters: [
    {
      id: 'gambit',
      name: 'Vienna Gambit: 2...Nf6 3.f4 d5',
      ideas: [
        'After 3...d5 4.fxe5 Nxe4 the e5-pawn is your trump. It takes f6 away from Black\'s pieces and gives you kingside space. Keep it protected with Nf3, d4 or Bf4.',
        'Qe2 is a key resource: it hits the e4-knight a second time, so Nxe4 dxe4 Qxe4 becomes a threat. When Black trades with ...Nxc3, recapture with the d-pawn to open the d-file and the c1-bishop, then castle long.',
        'With the king on c1 or b1, your plan is h4 and a kingside advance, with rooks on d1 and f1. The half-open f-file is yours.',
        'Black\'s counterplay comes from ...c5 and ...Nc6, or a ...f6 break against e5. The tempting 4...d4? loses material to 5.exf6.',
      ],
      lines: [
        {
          id: 'vie-gambit-be7',
          name: 'Main line: 5...Be7 6.Qe2 Nxc3 7.dxc3',
          pgn: `1.e4 {Take the centre and open lines for the queen and the f1-bishop.}
            e5 {Black claims an equal share of the centre.}
            2.Nc3 {The Vienna Game. The knight defends e4 and covers d5, and unlike 2.Nf3 it does not block the f-pawn, so f4 is still possible.}
            Nf6 {The most popular reply: Black develops and attacks e4, ready to meet f4 with ...d5.}
            3.f4 {The Vienna Gambit: a King's Gambit with Nc3 already played. Against 3...exf4, the e5 push hits the f6-knight.}
            d5 {Black's best answer: open the centre at once.}
            4.fxe5 {Take on e5. The pawn attacks the f6-knight, and the knight's best square is e4.}
            Nxe4 {The knight jumps into the centre, where it hits c3.}
            5.Nf3 {Develop and protect e5. The knight on f3 also covers h4, so ...Qh4+ is never a worry.}
            Be7 {A solid set-up: Black develops and gets ready to castle.}
            6.Qe2 {Hit the e4-knight a second time. If Black ignores it, Nxe4 dxe4 Qxe4 wins a pawn.}
            Nxc3 {The usual reply: trade off the attacked knight.}
            7.dxc3 {Recapture with the d-pawn. It opens the d-file and the c1-bishop, so you can develop quickly and castle long.}
            c5 {Black gains queenside space and prepares ...Nc6.}
            8.Bf4 {Develop the last minor piece. The bishop protects e5 and clears c1 for castling long.}
            Nc6 {Black develops and adds a second attacker on e5.}
            9.O-O-O {Castle long. The king is safe behind the c-pawns, and the rook goes straight to d1 against the d5-pawn. Next comes h4 and Kb1, with a kingside advance while e5 cramps Black.}`,
        },
        {
          id: 'vie-gambit-nc6',
          name: '5...Nc6 6.Bb5: the e6 pawn sacrifice',
          pgn: `1.e4 e5 2.Nc3 Nf6 3.f4 d5 4.fxe5 Nxe4 5.Nf3
            Nc6 {Black develops and attacks e5 with the knight.}
            6.Bb5 {Pin the c6-knight. It is the piece attacking e5, so the pin keeps your pawn safe, and Bxc6 can damage Black's pawns.}
            Nxc3 {Black trades off your c3-knight.}
            7.dxc3 {Recapture with the d-pawn again: the d-file and the c1-bishop open up.}
            Be7 {Natural development.}
            8.Nd4 {Hit the pinned knight a second time. Nxc6 or Bxc6 now threatens to wreck Black's pawns.}
            Bd7 {Black breaks the pin and defends c6.}
            9.e6 {A thematic pawn sacrifice. After ...fxe6 Black's pawns are split, the e6-pawn is weak and the f-file opens for you.}
            fxe6 {Black takes the pawn.}
            10.Bxc6 {Now take on c6. Black is left with doubled, isolated c-pawns as well as the weak e6-pawn.}
            bxc6 {Black recaptures.}
            11.O-O {Castle and put the rook on the open f-file. You are a pawn down, but Black's pawns on c7, c6 and e6 are targets and Black's king is still in the centre.}`,
        },
        {
          id: 'vie-gambit-bg4',
          name: '5...Bg4 6.Qe2',
          pgn: `1.e4 e5 2.Nc3 Nf6 3.f4 d5 4.fxe5 Nxe4 5.Nf3
            Bg4 {Black pins the f3-knight, the piece that protects e5.}
            6.Qe2 {The same idea as against 5...Be7: hit the e4-knight a second time. Nxe4 dxe4 Qxe4 would win a pawn.}
            Nxc3 {Black trades off the attacked knight.}
            7.dxc3 {Recapture with the d-pawn, ready for Bf4 and O-O-O.}
            Nc6 {Black develops and eyes e5.}
            8.Bf4 {Protect e5 and clear the way to castle long.}
            Qd7 {Black connects the rooks and prepares ...O-O-O.}
            9.O-O-O {Castle long. The rook on d1 eyes the d5-pawn, and h3 next asks the g4-bishop to decide: ...Bxf3 gives you the bishop pair.}`,
        },
        {
          id: 'vie-gambit-bc5',
          name: '5...Bc5 6.d4 Bb4 7.Bd2',
          pgn: `1.e4 e5 2.Nc3 Nf6 3.f4 d5 4.fxe5 Nxe4 5.Nf3
            Bc5 {An active square, aiming at g1, but the bishop can be hit by d4.}
            6.d4 {Gain time on the bishop and build a big centre with d4 and e5.}
            Bb4 {Black pins the c3-knight to your king, so the e4-knight is safe for now.}
            7.Bd2 {Break the pin. Now Nxe4 is a real threat again.}
            c5 {Black strikes at d4.}
            8.Bd3 {Develop and add another attacker on the e4-knight.}
            Nxd2 {Black trades the knight for your dark-squared bishop.}
            9.Qxd2 {Recapture with the queen, which still protects c3 and can swing to f4.}
            cxd4 {Black removes your d4-pawn.}
            10.Nxd4 {Recapture with the knight. It is strong on d4, and e5 is still a thorn in Black's side.}
            O-O {Black castles.}
            11.Qf4 {Step off the b4-bishop's diagonal, so the c3-knight is no longer pinned, and aim the queen at Black's kingside. Castle short next.}`,
        },
        {
          id: 'vie-gambit-d4',
          name: 'Trap: 4...d4?',
          pgn: `1.e4 e5 2.Nc3 Nf6 3.f4 d5 4.fxe5
            d4 {[book] It looks natural to hit the c3-knight, but this loses material.}
            5.exf6 {Take the knight first. Black wins back a piece with ...dxc3, but you come out a pawn up with a big lead in development.}
            dxc3 {Black takes back a piece.}
            6.bxc3 {Recapture with the b-pawn. Your d-pawn stays free to go to d4, and the b-file opens for a rook.}
            Qxf6 {Black regains a pawn. Material is still a pawn in your favour.}
            7.Nf3 {Develop and keep ...Qh4+ out.}
            Be7 {Black develops.}
            8.d4 {Take the centre and open the c1-bishop.}
            Qg6 {Black attacks e4 and g2.}
            9.Be2 {Develop and get ready to castle. If Black takes on e4, castling gives you the f-file and a big lead in development.}
            Qxe4 {Black wins back the pawn, but the queen has used up a lot of time.}
            10.O-O {Castle. Black's king is still in the centre, and moves like Bd3 or Re1 will gain more time against the queen.}`,
        },
      ],
    },
    {
      id: 'accepted',
      name: 'Gambit accepted (3...exf4) and 3...d6',
      ideas: [
        'After 3...exf4 push 4.e5 at once. The f6-knight has no good square: ...Ng8 is the best retreat, while ...Ng4? and ...Nh5? simply drop it to your queen on the open d1-h5 diagonal.',
        'Then Nf3 (which also stops ...Qh4+), d4 and Qe2 build a big centre. You win the f4-pawn back with Bxf4 and castle long.',
        'In the 4...Ng8 line, watch c7: after Qxe5 and Bxf4, an early ...O-O? drops the c7-pawn to Qxc7.',
        'Against 3...d6 develop with Nf3 and d4. You get a classical centre with pawns on e4 and f4, and Black is a little passive.',
      ],
      lines: [
        {
          id: 'vie-acc-ng8',
          name: '3...exf4 4.e5 Ng8',
          pgn: `1.e4 e5 2.Nc3 Nf6 3.f4
            exf4 {Black accepts the gambit.}
            4.e5 {Kick the knight straight away. It has no good square: ...Ng8 undevelops it, and ...Ng4 or ...Nh5 lose it to your queen.}
            Ng8 {The safest retreat, though the knight is back home.}
            5.Nf3 {Develop, protect e5 and stop ...Qh4+.}
            d6 {Black attacks e5 to free the position.}
            6.d4 {Support e5 and open the c1-bishop, which will win back the f4-pawn.}
            dxe5 {Black takes.}
            7.Qe2 {Keep the queens on. The queen hits e5, and whichever way you recapture there, the e-file opens towards Black's king.}
            Be7 {Black blocks the e-file and prepares to castle.}
            8.Qxe5 {Win back a pawn. The queen is very active on e5, hitting c7, g7 and the f4-pawn.}
            Nf6 {Black develops and gets ready to castle.}
            9.Bxf4 {Win back the gambit pawn. Material is level and your pieces are more active.}
            c6 {Black moves the c-pawn off the attacked square. Castling at once would drop it: 9...O-O? 10.Qxc7.}
            10.O-O-O {Castle long and put the rook on the d-file. Bd3 and Rhe1 follow, and your pieces are more active than Black's.}`,
        },
        {
          id: 'vie-acc-ng4',
          name: 'Trap: 4...Ng4?',
          pgn: `1.e4 e5 2.Nc3 Nf6 3.f4 exf4 4.e5
            Ng4 {[book] It looks active, but the knight is loose on g4.}
            5.Qxg4 {The d1-g4 diagonal is open and nothing defends g4, so you simply win a piece.}`,
        },
        {
          id: 'vie-acc-nh5',
          name: 'Trap: 4...Nh5?',
          pgn: `1.e4 e5 2.Nc3 Nf6 3.f4 exf4 4.e5
            Nh5 {[book] The knight tries to protect the f4-pawn, but h5 is on the same open diagonal.}
            5.Qxh5 {The queen goes straight down the d1-h5 diagonal and wins the knight.}`,
        },
        {
          id: 'vie-acc-d6',
          name: '3...d6 4.Nf3 Nc6 5.d4',
          pgn: `1.e4 e5 2.Nc3 Nf6 3.f4
            d6 {A solid reply: Black defends e5 and keeps the position closed.}
            4.Nf3 {Develop and add pressure on e5. If Black ever takes on f4, d4 gives you a big centre.}
            Nc6 {Black defends e5 again.}
            5.d4 {Open the centre while you are better developed.}
            exd4 {Black gives up the centre.}
            6.Nxd4 {Recapture and centralise the knight. Your e- and f-pawns give you more space.}
            Nxd4 {Black trades knights.}
            7.Qxd4 {The queen is strong in the centre and hard to chase away.}
            Be7 {Black develops and prepares to castle.}
            8.Be3 {Develop, protect the queen and prepare to castle long.}
            O-O {Black castles.}
            9.O-O-O {Castle long. Your pawns on e4 and f4 give you space, and e5 or g4-g5 can start a kingside attack.}`,
        },
      ],
    },
    {
      id: 'bc4',
      name: '2...Nc6 (and 2...Bc5) 3.Bc4',
      ideas: [
        'Against 2...Nc6 the gambit is riskier, so develop first with 3.Bc4. The bishop aims at f7, and after d3 the f4 push gives you a King\'s Gambit with your pieces already out.',
        'When Black puts a bishop on c5, Na4 trades it off. That bishop is Black\'s best piece here because it eyes g1 and makes castling short uncomfortable.',
        'Watch for ...Ng4 ideas against f2. Before ...d6, a knight on g4 is just loose to Qxg4. After ...d6, answer ...Ng4 with Ng5, hitting f7, and then f5 cuts the knight off from its defender.',
        'If Black plays ...Na5 to win the c4-bishop, let it happen. dxc4 gives you control of d5 and an open d-file.',
      ],
      lines: [
        {
          id: 'vie-bc4-na4',
          name: '3...Nf6 4.d3 Bc5 5.f4 d6 6.Nf3 Bg4 7.Na4',
          pgn: `1.e4 e5 2.Nc3
            Nc6 {Black develops and keeps ...Nf6, ...Bc5 and ...g6 in reserve.}
            3.Bc4 {Develop the bishop to its most active square, aiming at f7. It also covers d5.}
            Nf6 {Black develops and attacks e4.}
            4.d3 {Protect e4 solidly and open the c1-bishop. The f4 push comes next.}
            Bc5 {The most active square for Black's bishop: it eyes f2 and g1.}
            5.f4 {The Vienna's thematic push. It challenges e5 and opens the f-file.}
            d6 {Black keeps e5 solid and opens the c8-bishop.}
            6.Nf3 {Develop, add pressure on e5 and keep ...Qh4+ out.}
            Bg4 {Black pins the f3-knight.}
            7.Na4 {The key move: hunt down the c5-bishop, Black's best piece. Without it, you can castle short safely.}
            Bb6 {Black keeps the bishop for one more move.}
            8.Nxb6 {Take it. You win the bishop pair.}
            axb6 {Black recaptures and opens the a-file for the rook.}
            9.c3 {Take the d4 square away from Black's knight and prepare a later d4.}
            O-O {Black castles.}
            10.O-O {Castle short now that the c5-bishop is gone. You have the bishop pair and the f-file, and h3 next asks the g4-bishop whether to take on f3.}`,
        },
        {
          id: 'vie-bc4-ng4',
          name: '6...Ng4 7.Ng5 O-O 8.f5',
          pgn: `1.e4 e5 2.Nc3 Nc6 3.Bc4 Nf6 4.d3 Bc5 5.f4 d6 6.Nf3
            Ng4 {Black aims the knight and bishop at f2, hoping for ...Nf2 or ...Bf2+.}
            7.Ng5 {Counter-attack on f7 at once: Bxf7+ and Nxf7 are both threats.}
            O-O {Black defends f7 by castling.}
            8.f5 {The pawn shuts in the c8-bishop, so the g4-knight has lost its only defender and Qxg4 is a threat.}
            Bf2+ {Black throws in a check to get the pieces moving.}
            9.Kf1 {Step aside. Black's checks soon run out, and the f2-bishop and g4-knight are both short of squares.}
            Ne3+ {Another check, forking your queen and bishop.}
            10.Bxe3 {Take the knight. Black wins the piece back, but the bishop ends up stranded on e3.}
            Bxe3 {Black recaptures.}
            11.h4 {Don't grab on f7 yet: Nxf7 Rxf7 Bxf7+ Kxf7 frees Black's game. Instead h4 supports the g5-knight, and Qg4 or Qf3 follow with a strong kingside attack.}`,
        },
        {
          id: 'vie-bc4-early-ng4',
          name: 'Trap: 5...Ng4?',
          pgn: `1.e4 e5 2.Nc3 Nc6 3.Bc4 Nf6 4.d3 Bc5 5.f4
            Ng4 {[book] Black eyes f2, but the knight is loose: the c8-bishop is still blocked by the d7-pawn, so nothing defends g4.}
            6.Qxg4 {The d1-g4 diagonal is open, so you win the knight for nothing.}`,
        },
        {
          id: 'vie-bc4-bb4',
          name: '4...Bb4 5.Bg5',
          pgn: `1.e4 e5 2.Nc3 Nc6 3.Bc4 Nf6 4.d3
            Bb4 {Black pins the c3-knight to your king.}
            5.Bg5 {Develop with a pin of your own: the f6-knight is pinned to Black's queen.}
            h6 {Black asks the bishop what it wants.}
            6.Bxf6 {Take the knight before Black can break the pin with ...g5.}
            Bxc3+ {Black first takes on c3 with check.}
            7.bxc3 {Recapture. The doubled c-pawns are fine: they control d4, and the b-file opens for your rook.}
            Qxf6 {Black recaptures. Both sides have traded a bishop for a knight.}
            8.Ne2 {Develop the knight to e2, so the f-pawn can still go to f4.}
            d6 {Black keeps e5 solid.}
            9.O-O {Castle. Next comes f4, opening the f-file towards Black's queen and king.}`,
        },
        {
          id: 'vie-bc4-na5',
          name: '4...Na5 5.Nge2',
          pgn: `1.e4 e5 2.Nc3 Nc6 3.Bc4 Nf6 4.d3
            Na5 {Black goes after your c4-bishop.}
            5.Nge2 {Develop and keep the f-pawn free. Let Black take the bishop.}
            Nxc4 {Black wins the bishop pair.}
            6.dxc4 {Recapture towards the centre. The c4-pawn controls d5, and the d-file is open for your queen and rooks.}
            d6 {Black keeps e5 solid.}
            7.O-O {Castle. Next comes f4 to open the f-file, and your knights can aim for d5 and f5.}`,
        },
        {
          id: 'vie-bc4-bc5-order',
          name: '2...Bc5 3.Bc4: same plan, same positions',
          pgn: `1.e4 e5 2.Nc3
            Bc5 {Black develops the bishop first.}
            3.Bc4 {[book] The same set-up as against 2...Nc6. Stockfish slightly prefers 3.Nf3, but 3.Bc4 keeps everything in one system. If Black plays ...Nc6 next, Qg4 hits g7 just like in the Qg4 chapter.}
            Nf6 {Black develops and attacks e4.}
            4.d3 {Protect e4 and prepare f4.}
            d6 {Black supports e5.}
            5.f4 {The thematic push. After ...Nc6 and Nf3 you reach the main 2...Nc6 line, where Na4 hunts the c5-bishop.}
            Nc6 {Black develops: the position now matches the 2...Nc6 line.}
            6.Nf3`,
        },
      ],
    },
    {
      id: 'qg4',
      name: '2...Nc6 3.Bc4 Bc5 4.Qg4',
      ideas: [
        'When Black copies you with 3...Bc5, 4.Qg4 attacks g7. Every defence costs Black something.',
        'The natural 4...Nf6? loses a pawn to Qxg7, and after 5...Rg8?? Qxf7 is mate, because the c4-bishop protects f7.',
        'After 4...Qf6 5.Nd5 Qxf2+ 6.Kd1, your king looks exposed but it is Black\'s queen that is in danger. Nh3, d3 and Rf1 chase it while Nxc7 is in the air.',
        'Against 4...g6, drop back to g3 and develop with Nge2 and d3. Black\'s dark squares around the king are weakened.',
      ],
      lines: [
        {
          id: 'vie-qg4-qd4',
          name: '4...Qf6 5.Nd5 Qxf2+: 7...Qd4?',
          pgn: `1.e4 e5 2.Nc3 Nc6 3.Bc4
            Bc5 {Black copies your bishop move.}
            4.Qg4 {Hit g7. Black has to defend it, and each defence has a drawback.}
            Qf6 {Black defends g7 and eyes f2.}
            5.Nd5 {Attack the queen and threaten Nxc7+, forking king and rook.}
            Qxf2+ {Black grabs f2 with check. It looks dangerous, but the queen is now short of squares.}
            6.Kd1 {The only legal move. Your king is safe enough here, and Qxg7 and Nxc7+ are both threats.}
            Kf8 {Black defends g7 with the king.}
            7.Nh3 {Attack the queen. It has very few squares, and Rf1 is coming.}
            Qd4 {[book] The natural retreat, but now the queen gets hunted.}
            8.d3 {Take c4 away from the queen and open the c1-bishop. Next comes c3 to chase it again, and both Black's queen and king are short of squares.}`,
        },
        {
          id: 'vie-qg4-h5',
          name: '7...h5! 8.Qg5',
          pgn: `1.e4 e5 2.Nc3 Nc6 3.Bc4 Bc5 4.Qg4 Qf6 5.Nd5 Qxf2+ 6.Kd1 Kf8 7.Nh3
            h5 {Black's best defence: the h-pawn hits your queen and gains time.}
            8.Qg5 {Stay active. The queen attacks h5 and keeps watching g7 and d8.}
            Qd4 {The queen retreats to the centre.}
            9.d3 {Take c4 away from the queen and open the c1-bishop.}
            Be7 {Black hits your queen.}
            10.Qg3 {Keep the queen on the g-file. You are better: Rf1, c3 and Ng5 are coming, and Black's king is stuck on f8.}`,
        },
        {
          id: 'vie-qg4-mate',
          name: 'Trap: 4...Nf6? and ...Rg8??',
          pgn: `1.e4 e5 2.Nc3 Nc6 3.Bc4 Bc5 4.Qg4
            Nf6 {[book] Natural development, but it leaves g7 hanging.}
            5.Qxg7 {Take on g7 and attack the h8-rook.}
            Rg8 {[book] It looks natural to chase the queen, but it is a blunder.}
            6.Qxf7# {Checkmate. The c4-bishop protects the queen on f7.}`,
        },
        {
          id: 'vie-qg4-rf8',
          name: 'Trap: 4...Nf6? (best defence)',
          pgn: `1.e4 e5 2.Nc3 Nc6 3.Bc4 Bc5 4.Qg4 Nf6 5.Qxg7
            Rf8 {The right way to save the rook: on f8 it keeps f7 protected, so there is no mate.}
            6.d3 {Develop calmly. You are a clean pawn up, and Black's king has lost its kingside shelter.}`,
        },
        {
          id: 'vie-qg4-g6',
          name: '4...g6 5.Qg3',
          pgn: `1.e4 e5 2.Nc3 Nc6 3.Bc4 Bc5 4.Qg4
            g6 {Black defends g7 with a pawn, but weakens the dark squares f6 and h6.}
            5.Qg3 {Drop back. The queen hits e5 and stays on the kingside, where Black's dark squares are weak.}
            d6 {Black protects e5.}
            6.Nge2 {Develop the knight to e2, so the f-pawn can still go to f4.}
            Nf6 {Black develops.}
            7.d3 {Protect e4 and open the c1-bishop. Next comes Bg5 or Be3, and then f4.}`,
        },
      ],
    },
  ],
};
