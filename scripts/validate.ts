// Checks every repertoire line is legal and consistent. Run: npm run validate
import { buildRepertoire } from '../src/lib/repertoire.ts';
import { caroKann } from '../src/data/caroKann.ts';

const rep = buildRepertoire(caroKann);
let missing = 0;
for (const line of rep.lines) {
  const uncommented = line.moves.filter((m) => m.color === 'b' && !m.comment).map((m) => m.san);
  if (uncommented.length) {
    missing += uncommented.length;
    console.log(`note: ${line.id} has Black moves without explanation: ${uncommented.join(' ')}`);
  }
  console.log(`${line.id}: ${Math.ceil(line.moves.length / 2)} moves`);
}
console.log(`\n${rep.lines.length} lines, ${rep.nodes.size} positions, ${missing} unexplained Black moves`);
if (rep.errors.length) {
  console.error('\nERRORS:\n' + rep.errors.join('\n'));
  process.exit(1);
}
