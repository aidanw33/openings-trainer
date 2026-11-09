// Checks every repertoire line is legal and consistent. Run: npm run validate
import { buildRepertoire } from '../src/lib/repertoire.ts';
import { openings } from '../src/data/openings.ts';

const errors: string[] = [];
const seenLineIds = new Map<string, string>();
const seenOpeningIds = new Set<string>();

for (const opening of openings) {
  if (seenOpeningIds.has(opening.id)) errors.push(`Duplicate opening id ${opening.id}`);
  seenOpeningIds.add(opening.id);
  const chapterIds = opening.chapters.map((c) => c.id);
  for (const id of chapterIds.filter((c, i) => chapterIds.indexOf(c) !== i)) {
    errors.push(`${opening.id}: duplicate chapter id ${id}`);
  }

  const rep = buildRepertoire(opening);
  const mySide = opening.side === 'white' ? 'w' : 'b';
  console.log(`== ${opening.name} (you play ${opening.side})`);
  let missing = 0;
  for (const line of rep.lines) {
    // Progress is stored by line id, so ids must be unique across every opening.
    const owner = seenLineIds.get(line.id);
    if (owner) errors.push(`${opening.id}: line id ${line.id} is already used in ${owner}`);
    seenLineIds.set(line.id, opening.id);

    const last = line.moves[line.moves.length - 1];
    if (last && last.color !== mySide) {
      console.log(`note: ${line.id} ends on the opponent's move ${last.san}`);
    }
    const uncommented = line.moves.filter((m) => m.color === mySide && !m.comment).map((m) => m.san);
    if (uncommented.length) {
      missing += uncommented.length;
      console.log(`note: ${line.id} has repertoire moves without explanation: ${uncommented.join(' ')}`);
    }
    console.log(`${line.id}: ${Math.ceil(line.moves.length / 2)} moves`);
  }
  console.log(`${rep.lines.length} lines, ${rep.nodes.size} positions, ${missing} unexplained repertoire moves\n`);
  errors.push(...rep.errors.map((e) => `${opening.id}: ${e}`));
}

if (errors.length) {
  console.error('ERRORS:\n' + errors.join('\n'));
  process.exit(1);
}
