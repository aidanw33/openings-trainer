export type Color = 'w' | 'b';

export const colorName = (c: Color) => (c === 'w' ? 'White' : 'Black');
export const otherColor = (c: Color): Color => (c === 'w' ? 'b' : 'w');

/** "3.f4" or "3...d5" for the move at this ply of a game that starts from the initial position. */
export function plyLabel(ply: number, san: string) {
  const n = Math.floor(ply / 2) + 1;
  return ply % 2 === 0 ? `${n}.${san}` : `${n}...${san}`;
}

/** Stands in for a hidden move: reads as a blank to fill in, unlike "?" which marks a mistake. */
const BLANK = '___';

const SAN = /^(?:O-O(?:-O)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?)[+#]?$/;

/**
 * Replace one side's moves in a line or chapter name with a blank, so a drill title like
 * "Short System: 4.Nf3 e6 5.Be2 c5" does not give away the moves you are meant to find.
 * Move colours come from move numbers ("4." White, "4..." or "..." Black); a bare move
 * directly after another move belongs to the other side. A bare move after ordinary words
 * ("the Nd6# trap") has no known colour and is left alone.
 */
export function maskMoves(name: string, hide: Color): string {
  let last: Color | null = null;
  return name
    .split(' ')
    .map((word) => {
      const [, lead, core, trail] = /^(\(*)(.*?)([),:;]*)$/.exec(word)!;
      let prefix = '';
      let move = core;
      let color: Color | null = null;
      const numbered = /^(\d+)(\.\.\.|\.)(.*)$/.exec(core);
      if (numbered) {
        prefix = numbered[1] + numbered[2];
        move = numbered[3];
        color = numbered[2] === '.' ? 'w' : 'b';
      } else if (core.startsWith('...')) {
        prefix = '...';
        move = core.slice(3);
        color = 'b';
      }
      if (!SAN.test(move.replace(/[!?]+$/, ''))) {
        last = null;
        return word;
      }
      if (!color) {
        if (!last) return word;
        color = otherColor(last);
      }
      last = color;
      return color === hide ? `${lead}${prefix}${BLANK}${trail}` : word;
    })
    .join(' ');
}
