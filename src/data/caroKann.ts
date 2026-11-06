import type { Opening } from './types.ts';

/*
 * Caro-Kann repertoire for Black.
 *
 * Each line is written as a mini-PGN: moves with optional move numbers, and a
 * {comment} right after a move explains that move. Comments on Black moves are
 * the "why" you see after playing them; comments on White moves explain what
 * White is aiming for. Lines that share moves only need the comment written
 * once — the trainer merges positions across lines (transpositions included).
 */

export const caroKann: Opening = {
  id: 'caro-kann',
  name: 'Caro-Kann Defence',
  side: 'black',
  summary:
    '1.e4 c6 prepares ...d5 with the c-pawn supporting it. Black gets a French-like centre but, unlike the French, the light-squared bishop gets out to f5 or g4 before ...e6 shuts it in. The trade-off is time: ...c6 and ...c5 later can cost a tempo, so Black aims for a rock-solid structure and counterplay with ...c5 or ...e5 breaks.',
  chapters: [
    {
      id: 'advance',
      name: 'Advance Variation (3.e5)',
      ideas: [
        'White grabs space with e5 and cramps the f6 square. Black answers with ...Bf5 FIRST, then ...e6, so the bishop is outside the pawn chain.',
        'The key break is ...c5 hitting the base of the chain at d4. Sometimes it costs a tempo (...c6 then ...c5) but the attack on d4 is worth it.',
        'Knights belong on c6 and e7 (often rerouting Ne7-c8-b6 or Ne7-f5/g6). The f5-bishop may drop back to g6 if harassed by g4/h4.',
        'Watch for ...f6 later to attack e5 from the other side, and for White\'s kingside pawn storms (g4, h4) — meet h4 with ...h5 or ...h6 to keep a square for the bishop.',
      ],
      lines: [
        {
          id: 'adv-short',
          name: 'Short System: 4.Nf3 e6 5.Be2 c5 6.O-O',
          pgn: `1.e4 {White grabs the centre and opens lines for the queen and bishop.}
            c6 {Prepares ...d5 with c6 backing it up, so after exd5 Black can recapture with the c-pawn and keep a pawn in the centre.}
            2.d4 {White builds the ideal pawn centre.}
            d5 {The point of 1...c6: challenge e4 immediately. White must decide whether to advance, exchange or defend.}
            3.e5 {The Advance Variation: White gains space and takes f6 away from Black's knight.}
            Bf5 {The Caro-Kann's big trump. Get the light-squared bishop OUT before playing ...e6, which would otherwise lock it behind the pawns.}
            4.Nf3 {The Short System: quiet development, castle, then try to exploit the space advantage.}
            e6 {Now that the bishop is out, ...e6 is safe. It supports d5 and opens the f8-bishop.}
            5.Be2 {Modest but solid. The bishop is ready to support kingside play or a later c4.}
            c5 {The thematic strike at the base of White's chain (d4). Black spends a second tempo on the c-pawn but it is the right fight.}
            6.O-O {White simply castles and lets Black resolve the tension.}
            Nc6 {Adds a second attacker to d4. Now White must keep defending it or release the tension.}
            7.c3 {Supports d4 with a pawn.}
            cxd4 {Opens the c-file for Black's rook and fixes White's structure. After cxd4 White has no c-pawn to support d4 any more.}
            8.cxd4 {Recapturing keeps the centre but leaves d4 as a target on the half-open c-file.}
            Nge7 {The knight heads for c8-b6 or f5 — it cannot go to f6 because of e5.}
            9.Nc3 {Develops and controls b5 and e4.}
            Nc8 {A key manoeuvre: the knight reroutes to b6 where it eyes c4 and supports ...Nb4/...Rc8 play on the queenside.}
            10.Be3 {Protects d4 a third time.}
            Nb6 {From b6 the knight controls c4 and d5, and frees c8 for the rook. Black's pieces now pile on the queenside where White's space is irrelevant.}
            11.Rc1 {White contests the c-file.}
            Be7 {Finish development; the king will castle short where White has no easy attack.}
            12.a3 {Taking b4 away from Black's knight.}
            O-O {Black is fully developed with a safe king and clear plans: ...Rc8, ...Na5-c4, or ...f6 to hit e5. A typical comfortable Advance middlegame.}`,
        },
        {
          id: 'adv-short-be3',
          name: 'Short System: 6.Be3 Nd7',
          pgn: `1.e4 c6 2.d4 d5 3.e5 Bf5 4.Nf3 e6 5.Be2 c5
            6.Be3 {White protects d4 with the bishop and keeps the option of dxc5 followed by Bd4.}
            Nd7 {Covers c5 and e5. If White ever takes on c5 the knight recaptures or supports ...Bxc5; it also prepares ...Ne7.}
            7.O-O {White castles; the c-file tension remains.}
            Ne7 {The g8-knight goes to e7 heading for d5, f5 or c6.}
            8.c4 {White tries to open the position while Black's king is still in the centre.}
            dxc4 {Accepting the challenge. The c4-pawn was attacking d5 and Black frees the d5 square for the knight.}
            9.Na3 {White will regain the pawn on c4.}
            Nd5 {A beautiful square: the knight blocks the d-file and hits the e3-bishop.}
            10.Nxc4 {White recovers the pawn.}
            Nxe3 {Grabbing the bishop pair. White's dark-squared bishop was its best defender of d4 and the dark squares.}
            11.fxe3 {White recaptures toward the centre, but e3 is now a backward-looking pawn and the e5-pawn has less support.}
            Be7 {Develop and castle. Black has the two bishops and targets in e5 and e3 — a pleasant position.}`,
        },
        {
          id: 'adv-bayonet',
          name: 'Bayonet: 4.Nc3 e6 5.g4 Bg6 6.Nge2',
          pgn: `1.e4 c6 2.d4 d5 3.e5 Bf5
            4.Nc3 {The sharpest approach. White prepares g4 to chase the bishop and grab kingside space.}
            e6 {Natural development: supports d5, opens the f8-bishop and prepares ...c5. If White chases the bishop with g4, it drops back to g6.}
            5.g4 {The bayonet attack: chase the bishop away while gaining space.}
            Bg6 {The bishop drops back but stays on the h7-b1 diagonal, ready to come to h7 if h4-h5 follows.}
            6.Nge2 {White wants Nf4 to hit the g6-bishop and supports d4.}
            c5 {Hit the centre while White has advanced kingside pawns. When White over-extends on one wing, strike in the centre.}
            7.h4 {Threatening h5, trapping the bishop.}
            h5 {Stop h5 dead. This also fixes White's g4-pawn as a target.}
            8.Nf4 {Hitting g6 and h5.}
            Bh7 {Keep the bishop alive on the long diagonal. It will be very strong if the position opens.}
            9.Nxh5 {White wins back the h-pawn but the knight on h5 is offside.}
            cxd4 {Open the centre while White's knight is far away on h5.}
            10.Qxd4 {Recaptures, but the queen in the centre is a target.}
            Nc6 {Develop with tempo on the queen. Black's lead in development and the strong h7-bishop against White's loose kingside give dynamic counterplay.}`,
        },
        {
          id: 'adv-h4-c4',
          name: '4.h4 h5 5.c4',
          pgn: `1.e4 c6 2.d4 d5 3.e5 Bf5
            4.h4 {White threatens g4 and h5 to trap or harass the bishop.}
            h5 {Stops g4 ideas cold: after g4 Black can take hxg4. The cost is a weakened g5 square, but the bishop is safe.}
            5.c4 {White attacks d5 to open lines while Black's pieces are undeveloped.}
            e6 {Hold d5 and open the f8-bishop.}
            6.Nc3 {More pressure on d5.}
            Ne7 {The knight supports d5 and heads for f5 or g6 later.}
            7.Nge2 {White plans Ng3 to hit the f5-bishop and h5-pawn.}
            dxc4 {Release the tension at the right moment: White has to spend time regaining the pawn.}
            8.Ng3 {Attacks the bishop.}
            Bg6 {The bishop retreats safely; h5 is covered.}
            9.Bxc4 {White regains the pawn.}
            Nd5 {The blockade square in front of the isolated d-pawn. A knight on d5 can never be chased by a pawn, and Black's position is very solid.}`,
        },
        {
          id: 'adv-h4-bd3',
          name: '4.h4 h5 5.Bd3',
          pgn: `1.e4 c6 2.d4 d5 3.e5 Bf5 4.h4 h5
            5.Bd3 {White offers to trade Black's good bishop.}
            Bxd3 {Take it. Black's light-squared bishop has done its job — after the trade Black's remaining pawns on light squares are not a problem.}
            6.Qxd3 {Recapture; the queen is now on the b1-h7 diagonal.}
            e6 {Solidify d5 and open the bishop.}
            7.Bg5 {White develops and takes the d8-h4 diagonal, stopping ...Be7 and eyeing the h5-pawn behind it.}
            Qa5+ {A useful check: it forces White to block, then Black heads for a6 to trade queens.}
            8.c3 {Block on c3.}
            Qa6 {Offer the queen trade. Without queens White's space and kingside play matter much less, and Black's structure is excellent.}
            9.Qxa6 {White accepts.}
            Nxa6 {The knight on a6 heads for c7 and then b5 or e8; Black follows up with ...c5.}
            10.Nd2 {White develops.}
            c5 {The thematic break against d4. Black has a comfortable endgame.}`,
        },
        {
          id: 'adv-bd3',
          name: '4.Bd3 trade of bishops',
          pgn: `1.e4 c6 2.d4 d5 3.e5 Bf5
            4.Bd3 {Offers a trade of the light-squared bishops, removing Black's good piece.}
            Bxd3 {Accept: after the trade White has lost time with the bishop.}
            5.Qxd3 {Queen recaptures.}
            e6 {Solid setup.}
            6.Nf3 {Natural development.}
            Qb6 {Pressure on d4 and b2. Typical in the Advance: the queen on b6 stares at d4 along with ...c5 and ...Nc6.}
            7.O-O {White castles; b2 is poisoned-ish because of Qb5+/Nc3 tricks.}
            c5 {Strike at d4.}
            8.c3 {Supports d4.}
            Nc6 {Third attacker on d4.}
            9.dxc5 {White gives up the centre to gain tempo on the queen.}
            Bxc5 {Recapture with development. The bishop on c5 aims at f2.}
            10.b4 {Gaining space with tempo.}
            Be7 {The bishop retreats safely; Black will castle and play ...Rc8 and ...f6 against White's e5-pawn.}`,
        },
        {
          id: 'adv-c3',
          name: '4.c3 e6 5.Be2 c5',
          pgn: `1.e4 c6 2.d4 d5 3.e5 Bf5
            4.c3 {Supporting d4 in advance.}
            e6 {Standard.}
            5.Be2 {Solid development.}
            c5 {Even with c3 in place, ...c5 is the right break.}
            6.Nf3 {Transposing to the Short System.}
            Nc6 {Pile on d4.}
            7.O-O {Castling — we are back in the Short System.}
            cxd4 8.cxd4 Nge7 9.Nc3 Nc8 10.Be3 Nb6`,
        },
        {
          id: 'adv-nf3-transpo',
          name: '2.Nf3 d5 3.e5 Bf5 4.d4',
          pgn: `1.e4 c6
            2.Nf3 {A flexible move order.}
            d5 {Stick to the plan: challenge e4.}
            3.e5 {Advance without d4 yet.}
            Bf5 {Same idea: bishop out first.}
            4.d4 {Transposes to the Advance Short System.}
            e6 5.Be2 c5 6.O-O Nc6`,
        },
      ],
    },
    {
      id: 'classical',
      name: 'Classical (3.Nc3 dxe4 4.Nxe4 Bf5)',
      ideas: [
        'Black gives up the centre (3...dxe4) to develop the bishop to f5 with tempo on the e4-knight.',
        'After Ng3 the bishop retreats to g6. If White pushes h4-h5, answer with ...h6 and ...Bh7 so the bishop keeps the diagonal.',
        'Black trades the light-squared bishops with ...Bxd3, then plays ...e6, ...Ngf6, ...Be7 and castles — usually short, sometimes long.',
        'Freeing breaks: ...c5 and ...e5. A queen on d5 or a6, or the ...Qa5+ / ...Qc7 manoeuvre, are typical. Black is very solid and the endgames are good for Black.',
        'Trap to remember: never play ...Nd7?? when Nd6 is mate (e.g. Qe2 and a knight on e4 against the king on e8).',
      ],
      lines: [
        {
          id: 'cl-main-bd2',
          name: 'Main line: 6.h4 h6 ... 11.Bd2',
          pgn: `1.e4 c6 2.d4 d5
            3.Nc3 {White defends e4 with a piece rather than advancing or exchanging.}
            dxe4 {Black gives up the centre to open a path for the bishop. The point is that ...Bf5 will come with tempo on the e4-knight.}
            4.Nxe4 {Recapture; the knight is centralized but can be hit.}
            Bf5 {Develops with tempo on the knight and gets the bishop outside the pawn chain before ...e6.}
            5.Ng3 {The knight attacks the bishop.}
            Bg6 {Keep the bishop on the h7-b1 diagonal.}
            6.h4 {White threatens h5, trapping the bishop.}
            h6 {Gives the bishop the h7 retreat square. It also means a later h5 will fix a pawn on a light square White can never easily attack again.}
            7.Nf3 {Develops and prepares Ne5 ideas to hit the g6-bishop.}
            Nd7 {Controls e5 so Ne5 is not possible, and prepares ...Ngf6.}
            8.h5 {Gaining space; now the bishop must go to h7.}
            Bh7 {The bishop stays on the diagonal.}
            9.Bd3 {White offers the trade of light-squared bishops.}
            Bxd3 {Take it. With the bishops off, Black's pawns on light squares are fine and White's advanced h5-pawn can become a weakness in the endgame.}
            10.Qxd3 {The queen eyes the kingside.}
            e6 {Solid. Now the f8-bishop is free and d5/f5 are controlled.}
            11.Bd2 {White prepares long castling.}
            Ngf6 {Natural development; the knight guards h7 and d5.}
            12.O-O-O {White castles long; the h5-pawn cramps Black's kingside.}
            Be7 {Develop and prepare to castle.}
            13.Kb1 {Prophylaxis: the king steps off the c-file and the a2-g8 diagonal.}
            O-O {Short castling is safe here: White's h5-pawn is far advanced and g4-g5 is not easy to arrange.}
            14.Ne4 {Trying to exchange one of Black's defenders.}
            Nxe4 {Simplify. Black is cramped, so trades help.}
            15.Qxe4 {Queen recaptures centrally.}
            Nf6 {Hits the queen and covers d5 and h5.}
            16.Qe2 {Queen retreats.}
            Qd5 {Centralizes the queen with ideas of ...Qe4 to trade queens, or ...c5. Black has a very solid position and a good endgame if queens come off.}`,
        },
        {
          id: 'cl-main-bf4-qa5',
          name: 'Main line: 11.Bf4 Qa5+',
          pgn: `1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Bf5 5.Ng3 Bg6 6.h4 h6 7.Nf3 Nd7 8.h5 Bh7 9.Bd3 Bxd3 10.Qxd3 e6
            11.Bf4 {The modern choice: the bishop hits c7 and b8 and prepares O-O-O.}
            Qa5+ {A useful check that forces White to commit before Black decides where the queen belongs.}
            12.Bd2 {Blocking with the bishop keeps c3 free for a pawn later.}
            Qc7 {The queen now sits opposite the d2-bishop and controls e5; Black can castle long.}
            13.O-O-O {White castles long.}
            Ngf6 {Develop and guard h7.}
            14.Ne4 {Offering a knight trade.}
            O-O-O {Black castles long too — the king is safer away from the h5 pawn and White's kingside play.}
            15.g3 {Preparing Bf4 to hit the queen.}
            Nxe4 {Trade to reduce White's attacking potential.}
            16.Qxe4 {Recapture.}
            Bd6 {Develop with the plan ...Rhe8 and ...c5 or ...e5. A balanced middlegame where Black has no weaknesses.}`,
        },
        {
          id: 'cl-7h5',
          name: '7.h5 move order',
          pgn: `1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Bf5 5.Ng3 Bg6 6.h4 h6
            7.h5 {Pushing immediately.}
            Bh7 {Forced but fine — the bishop stays on its diagonal.}
            8.Nf3 {Development.}
            Nd7 {Stop Ne5 just like the main line.}
            9.Bd3 {Transposes to the main line.}
            Bxd3 10.Qxd3 e6 11.Bd2 Ngf6`,
        },
        {
          id: 'cl-n1e2',
          name: '6.N1e2 Nf6 7.Nf4 e5!',
          pgn: `1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Bf5 5.Ng3 Bg6
            6.N1e2 {White's plan is Nf4 to hit the g6-bishop and maybe h4-h5.}
            Nf6 {Develop; the knight on f6 covers the h5 square and e4.}
            7.Nf4 {Attacking the bishop.}
            e5 {A powerful central strike. White's d4 is pinned in effect: dxe5 opens the d-file for a queen trade.}
            8.dxe5 {White takes the pawn.}
            Qxd1+ {Trade queens: Black is happy in an endgame.}
            9.Kxd1 {White loses castling rights.}
            Ng4 {Attack e5 and f2 at the same time.}
            10.Nxg6 {White removes the bishop.}
            hxg6 {Recapture toward the centre; the h-file is now half-open for the rook against h2.}
            11.Ne4 {Defending f2 and centralizing.}
            Nxe5 {Black regains the pawn with an excellent endgame: White's king is stuck in the centre and Black's h-file pressure is real.}`,
        },
        {
          id: 'cl-nh3',
          name: '6.Nh3 e6 7.Nf4 Bd6',
          pgn: `1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Bf5 5.Ng3 Bg6
            6.Nh3 {Another route to f4 to harass the bishop.}
            e6 {Solid; prepares ...Bd6 to challenge the f4-knight.}
            7.Nf4 {Hits the bishop.}
            Bd6 {Challenge the knight directly. If Nxg6 then hxg6 opens the h-file.}
            8.c3 {Supports d4 and keeps the structure.}
            Ne7 {The knight goes to e7 so that after Nxg6 Black can recapture with the knight; it also covers d5 and f5.}
            9.h4 {Threatening h5.}
            h6 {Give the bishop h7.}
            10.h5 {Gaining space.}
            Bh7 {The bishop stays put.}
            11.Bd3 {Offering the trade.}
            Bxd3 {Trade the bishops.}
            12.Nxd3 {The knight recaptures.}
            Nd7 {Develop and prepare ...Qc7 and long or short castling. Black is solid and the h5-pawn may become weak.}`,
        },
        {
          id: 'cl-bc4',
          name: '6.Bc4 e6 7.N1e2',
          pgn: `1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Bf5 5.Ng3 Bg6
            6.Bc4 {The bishop aims at e6 and f7.}
            e6 {Blunt the bishop.}
            7.N1e2 {Heading for f4.}
            Nf6 {Develop; ...Bd6 is next.}
            8.Nf4 {Hits g6.}
            Bd6 {Challenge the knight; Nxg6 hxg6 gives Black the h-file.}
            9.Nxg6 {White takes.}
            hxg6 {Recapture toward the centre and open the h-file against h2.}
            10.O-O {White castles.}
            Nbd7 {Develop, with ...Qc7, ...O-O-O and play on the h-file. Black is comfortable.}`,
        },
        {
          id: 'cl-nc5',
          name: '5.Nc5 b6',
          pgn: `1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Bf5
            5.Nc5 {The knight hits b7 and prepares Nxb7 or Nb3.}
            b6 {Kick the knight away; it has no great square.}
            6.Nb3 {The knight retreats.}
            e6 {Solid development.}
            7.Nf3 {Natural.}
            Nd7 {Covering e5 and preparing ...Ngf6.}
            8.Bd3 {Offering the bishop trade.}
            Bxd3 {Trade.}
            9.Qxd3 {Recapture.}
            Ngf6 {Develop.}
            10.O-O {White castles.}
            Be7 {Develop and prepare castling.}
            11.Re1 {White eyes the e-file.}
            O-O {Black is safe and solid with ...c5 to come.}`,
        },
        {
          id: 'cl-bd3-gambit',
          name: '5.Bd3 gambit (and the Nd6# trap)',
          pgn: `1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Bf5
            5.Bd3 {A gambit: White offers the d4-pawn for quick development.}
            Qxd4 {Black can take — the pawn is genuinely free if Black is careful.}
            6.Nf3 {Development with tempo on the queen.}
            Qd8 {Retreat home where the queen is safe and covers d6.}
            7.Qe2 {Setting the trap: if 7...Nd7?? then 8.Nd6 is mate! The e-file is closed by your own pieces.}
            e6 {Opens e7 for the king and f8-bishop, avoiding all Nd6 tricks.}
            8.O-O {White castles.}
            Be7 {Develop and cover d6/f6.}
            9.Rd1 {Pressure on the d-file.}
            Qc7 {Get the queen off the d-file opposite the rook.}
            10.Ng3 {Hitting the f5-bishop.}
            Bxd3 {Trade off White's attacking bishop.}
            11.Rxd3 {Recapture.}
            Nf6 {Develop and castle next. Black is a clean pawn up.}`,
        },
        {
          id: 'cl-nd2',
          name: '3.Nd2 move order',
          pgn: `1.e4 c6 2.d4 d5
            3.Nd2 {Avoids pinning ideas on c3 and keeps c3 for a pawn; usually transposes.}
            dxe4 {Same idea as against 3.Nc3.}
            4.Nxe4 Bf5 5.Ng3 Bg6 6.h4 h6 7.Nf3 Nd7 8.h5 Bh7 9.Bd3 Bxd3 10.Qxd3 e6`,
        },
      ],
    },
    {
      id: 'exchange',
      name: 'Exchange Variation (3.exd5 cxd5 4.Bd3)',
      ideas: [
        'The structure is symmetrical, but it is a Carlsbad structure in reverse: Black can run the minority attack with ...b5-b4.',
        'Black\'s light-squared bishop belongs on g4 or f5, outside the pawn chain, before ...e6.',
        'If White plays Qb3 to hit b7, defend with ...Qd7 or ...Qc8 — never just give the pawn.',
        'Trade dark-squared bishops with ...Bd6 when White plays Bf4. Then ...Rab8, ...b5-b4 creates a weakness on c3.',
      ],
      lines: [
        {
          id: 'ex-qb3',
          name: '6.Bf4 Bg4 7.Qb3 Qd7',
          pgn: `1.e4 c6 2.d4 d5
            3.exd5 {White releases the tension and heads for a symmetrical structure.}
            cxd5 {Recapture with the c-pawn — the whole point of 1...c6.}
            4.Bd3 {Stopping ...Bf5.}
            Nc6 {Pressure on d4.}
            5.c3 {Supports d4; this is the Carlsbad structure in reverse.}
            Nf6 {Natural development.}
            6.Bf4 {The bishop gets outside White's pawn chain.}
            Bg4 {Develop the bishop actively before ...e6, pinning the knight once it comes to f3.}
            7.Qb3 {Attacks b7, exploiting the bishop leaving c8.}
            Qd7 {Defend b7 and connect. Do not grab with ...Qb6 or play passive moves — this is the main line.}
            8.Nd2 {Preparing Ngf3.}
            e6 {Opens the bishop and supports d5.}
            9.Ngf3 {Development.}
            Bxf3 {Remove the knight before it lands on e5. Black's light-squared bishop has no great future once ...e6 is played, and with the f3-knight gone White's grip on e5 is weaker.}
            10.Nxf3 {Recapture.}
            Bd6 {Offer to trade dark-squared bishops; White's f4-bishop was the best minor piece.}
            11.Bxd6 {White trades.}
            Qxd6 {Recapture with the queen.}
            12.O-O {White castles.}
            O-O {Black castles.}
            13.Rae1 {White eyes e5.}
            Rab8 {The minority attack is coming: ...b5-b4 to create a weak pawn on c3. Black has an easy plan.}`,
        },
        {
          id: 'ex-nf3',
          name: '5.c3 Nf6 6.Nf3 Bg4',
          pgn: `1.e4 c6 2.d4 d5 3.exd5 cxd5 4.Bd3 Nc6 5.c3 Nf6
            6.Nf3 {Development first.}
            Bg4 {Pin the knight and get the bishop out.}
            7.O-O {White castles.}
            e6 {Solid; prepares ...Bd6.}
            8.Bf4 {Fighting for the dark squares.}
            Bd6 {Challenge the bishop.}
            9.Bxd6 {White trades.}
            Qxd6 {Recapture.}
            10.Nbd2 {Development.}
            O-O {Castle.}
            11.Re1 {White eyes e5.}
            Rab8 {Minority attack plan: ...b5-b4.}`,
        },
        {
          id: 'ex-c3-bf4',
          name: '4.c3 Nc6 5.Bf4',
          pgn: `1.e4 c6 2.d4 d5 3.exd5 cxd5
            4.c3 {Supports d4 before developing the bishop.}
            Nc6 {Development.}
            5.Bf4 {The bishop gets out.}
            Bf5 {Black mirrors: the bishop is outside the pawn chain.}
            6.Nd2 {Development.}
            e6 {Solid.}
            7.Ngf3 {Development.}
            Nf6 {Development.}
            8.Bb5 {Pinning the c6-knight.}
            Nd7 {Unpin and head for b6 or f6 later; also prepares ...Be7. Black is very solid.}`,
        },
      ],
    },
    {
      id: 'panov',
      name: 'Panov-Botvinnik (3.exd5 cxd5 4.c4)',
      ideas: [
        'White usually ends up with an isolated queen\'s pawn (IQP) on d4. It gives White activity but is a long-term weakness.',
        'Black blockades on d5 with a knight, trades pieces, and targets d4. Every trade helps Black.',
        'If White plays c5 to gain queenside space, break with ...b6 or ...e5.',
        'If White trades on d5 with a knight capture (Nxd5) or plays bxc3, the IQP can turn into "hanging pawns" on c3/d4 — target them with ...b6, ...Bb7, ...Rc8.',
      ],
      lines: [
        {
          id: 'pan-bd3',
          name: '5.Nc3 e6 6.Nf3 Be7 7.cxd5 Nxd5 8.Bd3',
          pgn: `1.e4 c6 2.d4 d5 3.exd5 cxd5
            4.c4 {The Panov: White attacks d5 and is willing to accept an isolated d-pawn for active play.}
            Nf6 {Develop and defend d5.}
            5.Nc3 {More pressure on d5.}
            e6 {Solid: supports d5 and frees the f8-bishop. Black accepts an IQP position where Black blockades.}
            6.Nf3 {Development.}
            Be7 {Develop and prepare castling.}
            7.cxd5 {White releases the tension.}
            Nxd5 {Recapture with the knight onto the blockade square in front of the isolated d4-pawn.}
            8.Bd3 {The bishop aims at Black's king.}
            Nc6 {Pressure on d4.}
            9.O-O {White castles.}
            O-O {Black castles.}
            10.Re1 {White eyes e6 and the e-file.}
            Bf6 {More pressure on d4 and the bishop defends the kingside.}
            11.Be4 {Pressure on d5 and the long diagonal.}
            Nce7 {Reinforce the d5 knight. Black aims for ...Bd7, ...Rc8 and pressure on d4.}`,
        },
        {
          id: 'pan-bc4',
          name: '8.Bc4 and hanging pawns',
          pgn: `1.e4 c6 2.d4 d5 3.exd5 cxd5 4.c4 Nf6 5.Nc3 e6 6.Nf3 Be7 7.cxd5 Nxd5
            8.Bc4 {The bishop hits d5 directly.}
            O-O {Castle first.}
            9.O-O {White castles.}
            Nc6 {Pressure on d4.}
            10.Re1 {Preparing Bd3 or Qd3 ideas.}
            Nxc3 {Trade the knights; White gets hanging pawns.}
            11.bxc3 {White recaptures; now c3 and d4 are "hanging pawns".}
            b6 {Plan: ...Bb7, ...Rc8 and ...Na5 to target c4 and c3. Hanging pawns are strong when they can advance, so keep them blockaded.}`,
        },
        {
          id: 'pan-bg5',
          name: '6.Bg5 Be7',
          pgn: `1.e4 c6 2.d4 d5 3.exd5 cxd5 4.c4 Nf6 5.Nc3 e6
            6.Bg5 {Pinning the knight.}
            Be7 {Break the pin.}
            7.Nf3 {Development.}
            O-O {Castle.}
            8.Rc1 {White eyes the c-file.}
            Nc6 {Development and pressure on d4.}
            9.c5 {White gains queenside space.}
            Ne4 {A strong central knight trades off White's g5-bishop.}
            10.Bxe7 {White trades bishops.}
            Qxe7 {Recapture.}
            11.Be2 {Development.}
            e5 {Break in the centre against White's queenside space grab.}`,
        },
        {
          id: 'pan-c5',
          name: '7.c5 O-O 8.Bd3 b6',
          pgn: `1.e4 c6 2.d4 d5 3.exd5 cxd5 4.c4 Nf6 5.Nc3 e6 6.Nf3 Be7
            7.c5 {Grabs queenside space.}
            O-O {Castle.}
            8.Bd3 {Development.}
            b6 {Undermine the c5-pawn.}
            9.b4 {Supports c5.}
            a5 {Undermine the b4 pawn. Black opens the queenside with ...axb4 and ...bxc5.}`,
        },
      ],
    },
    {
      id: 'two-knights',
      name: 'Two Knights (2.Nc3 d5 3.Nf3)',
      ideas: [
        'White develops both knights before committing the d-pawn. Black pins with ...Bg4 and is happy to give the bishop for the f3-knight.',
        'After ...Bxf3 Qxf3 Black plays ...e6 and ...Nf6: a French-type structure where Black\'s "bad" bishop problem is solved because it was traded.',
        'White\'s queen on f3 looks active but has no targets. Black finishes development with ...Nd7, ...Be7/...Bb4 and castles.',
        'Against a d3 setup the centre stays closed, so Black develops calmly and can later take space with ...e5 or ...d4.',
      ],
      lines: [
        {
          id: 'tk-d4',
          name: '4.h3 Bxf3 5.Qxf3 e6 6.d4',
          pgn: `1.e4 c6
            2.Nc3 {Defends e4 with a piece before deciding on the d-pawn.}
            d5 {Challenge e4 anyway — the Caro-Kann plan does not change.}
            3.Nf3 {The Two Knights: White wants quick development and keeps options like e5 or exd5.}
            Bg4 {Pin the knight. Black wants to trade this bishop for the knight, which weakens White's control of d4 and e5.}
            4.h3 {Asking the bishop to decide.}
            Bxf3 {Take the knight. In this closed position Black does not mind giving the bishop pair, and White's queen gets pulled to f3.}
            5.Qxf3 {Recapture with the queen.}
            e6 {Now ...e6 is ideal: the light-squared bishop is already traded, so the pawns on light squares are not a problem.}
            6.d4 {White builds the classical centre.}
            Nf6 {Develop and attack e4, which is now only defended by the knight.}
            7.Bd3 {Defends e4.}
            dxe4 {Release the tension; Black wants to simplify toward a solid middlegame.}
            8.Nxe4 {Recapture.}
            Nxe4 {Trade off White's active knight.}
            9.Qxe4 {The queen recaptures.}
            Nd7 {The knight heads for f6 to kick the queen, covering e5 on the way.}
            10.O-O {White castles.}
            Nf6 {Develop with tempo on the queen.}
            11.Qe2 {The queen steps back.}
            Be7 {Develop and get ready to castle.}
            12.c3 {Solidifies d4.}
            O-O {Black is completely solid. Plans: ...c5 to challenge d4, or ...Qd5/...Qc7 and ...Rad8 pressure on the d-file.}`,
        },
        {
          id: 'tk-d3',
          name: '4.h3 Bxf3 5.Qxf3 e6 6.d3',
          pgn: `1.e4 c6 2.Nc3 d5 3.Nf3 Bg4 4.h3 Bxf3 5.Qxf3 e6
            6.d3 {A quieter setup: White keeps the e4-pawn and plans g3/Bg2.}
            Nd7 {Flexible: the knight supports ...e5 and avoids the pin Bg5 against f6.}
            7.g3 {Preparing the fianchetto.}
            Ngf6 {Develop; now the knight hits e4.}
            8.Bg2 {The bishop on the long diagonal backs up e4.}
            Bb4 {Develop actively: pinning the c3-knight adds pressure to e4.}
            9.O-O {White castles.}
            O-O {Black castles with a comfortable game. Typical plans: ...Qb6 hitting b2, or ...dxe4 followed by ...e5 to claim central space.}`,
        },
        {
          id: 'tk-nf3-order',
          name: '2.Nf3 d5 3.Nc3 Bg4',
          pgn: `1.e4 c6
            2.Nf3 {A flexible move order.}
            d5 3.Nc3 {Transposes to the Two Knights.}
            Bg4 4.h3 Bxf3 5.Qxf3 e6 6.d4 Nf6`,
        },
      ],
    },
    {
      id: 'fantasy',
      name: 'Fantasy (3.f3)',
      ideas: [
        'White supports e4 with the f-pawn, aiming for a big centre. The cost: f3 weakens the e3 square, the g1-a7 diagonal and the dark squares.',
        'Black plays ...e6 (or ...dxe4 with ...e5) and hits the centre quickly, before White can castle and consolidate.',
        'Typical tools: ...Bb4 to pin and trade on c3, ...Qb6 against b2/d4, and the ...e5 or ...c5 break.',
      ],
      lines: [
        {
          id: 'fan-nc3',
          name: '3...e6 4.Nc3 Bb4',
          pgn: `1.e4 c6 2.d4 d5
            3.f3 {The Fantasy Variation: supports e4 with a pawn so White can keep a big centre.}
            e6 {Solid and flexible: opens the f8-bishop toward b4, and the f3-pawn means White can't use the f3 square for the knight.}
            4.Nc3 {Development, supporting e4.}
            Bb4 {Pin the knight that defends e4; Black threatens ...dxe4.}
            5.a3 {Asking the bishop.}
            Bxc3+ {Trade, doubling White's c-pawns.}
            6.bxc3 {Recapture; White's structure is damaged.}
            dxe4 {Open the centre now.}
            7.fxe4 {Recapture; White has a big but loose centre and a weak e3/g1-a7 diagonal.}
            e5 {Hit the centre immediately — White's king is still in the middle.}
            8.Nf3 {Development, defending d4.}
            exd4 {Release the tension to open lines toward White's king.}
            9.cxd4 {Recapture.}
            Nf6 {Develop and attack e4.}
            10.Bd3 {Defends e4.}
            c5 {Undermine d4 — White's centre starts to crumble and the d-file opens for Black's queen and rooks.}`,
        },
        {
          id: 'fan-nd2',
          name: '3...e6 4.Nd2 c5',
          pgn: `1.e4 c6 2.d4 d5 3.f3 e6
            4.Nd2 {Supporting e4 with the knight.}
            c5 {The standard counter: strike at d4 while White is underdeveloped.}
            5.exd5 {White releases the tension.}
            exd5 {Recapture: Black may end up with an isolated pawn, but gets very active pieces.}
            6.Bb5+ {Development with check.}
            Nc6 {Block and develop.}
            7.Ne2 {The knight can't go to f3, which is a downside of 3.f3.}
            Bd6 {Develop actively, aiming at h2.}
            8.dxc5 {White gives Black an isolated d-pawn.}
            Bxc5 {Recapture with the bishop aimed at g1 — exactly the diagonal that 3.f3 weakened.}
            9.Nb3 {Hitting the bishop.}
            Bb6 {The bishop stays on the a7-g1 diagonal.}
            10.Bd3 {White repositions the bishop — note that White cannot castle while Black's bishop controls g1.}
            Nge7 {Develop and castle next. Black's activity and the pressure on the a7-g1 diagonal compensate for the isolated d-pawn.}`,
        },
      ],
    },
    {
      id: 'sidelines',
      name: 'Sidelines (2.d3, 2.c4)',
      ideas: [
        'Against the King\'s Indian Attack (2.d3) Black takes the centre with ...d5 and ...e5 and develops naturally. White usually goes for a kingside attack, so Black should play on the queenside with ...a5-a4.',
        'Against 2.c4 (the Accelerated Panov) Black reaches an open position with ...d5 and ...Nxd5 and develops quickly.',
      ],
      lines: [
        {
          id: 'side-kia',
          name: "King's Indian Attack: 2.d3",
          pgn: `1.e4 c6
            2.d3 {The King's Indian Attack setup: White plans Nd2, Ngf3, g3, Bg2 and O-O.}
            d5 {Take the centre.}
            3.Nd2 {Supporting e4.}
            e5 {Black grabs the full centre since White is not challenging it.}
            4.Ngf3 {Attacks e5.}
            Bd6 {Defends e5 and develops.}
            5.g3 {Fianchetto.}
            Nf6 {Development.}
            6.Bg2 {The bishop on the long diagonal.}
            O-O {Castle.}
            7.O-O {White castles.}
            Re8 {Support e5, so that ...Nbd7 can come without the e5-pawn hanging.}
            8.Re1 {White prepares exd5 or c3.}
            Nbd7 {Develop; the knight can go to f8 to defend the king.}
            9.c3 {Preparing d4.}
            a5 {Queenside play: ...a4 gains space and stops b4.}`,
        },
        {
          id: 'side-c4',
          name: 'Accelerated Panov: 2.c4',
          pgn: `1.e4 c6
            2.c4 {White plays c4 before d4.}
            d5 {Challenge the centre.}
            3.exd5 {White exchanges.}
            cxd5 {Recapture.}
            4.cxd5 {White wins a pawn — for now.}
            Nf6 {Develop and regain the pawn.}
            5.Nc3 {Defends d5.}
            Nxd5 {Regain the pawn.}
            6.Nf3 {Development.}
            Nc6 {Development.}
            7.Bb5 {Pinning the knight.}
            e6 {Solid; prepares ...Be7.}
            8.O-O {White castles.}
            Be7 {Develop.}
            9.d4 {White gets an isolated d-pawn.}
            O-O {Black is fully safe and can blockade d5.}`,
        },
      ],
    },
  ],
};
