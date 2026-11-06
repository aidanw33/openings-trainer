// Copies the lite single-threaded Stockfish build into public/engine so the browser can load it.
// Runs automatically after `npm install` and before `npm run dev` / `npm run build`.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const bin = join(dirname(require.resolve('stockfish/package.json')), 'bin');
const out = join(root, 'public', 'engine');
mkdirSync(out, { recursive: true });
for (const [src, dst] of [
  ['stockfish-19-lite-single.js', 'stockfish.js'],
  ['stockfish-19-lite-single.wasm', 'stockfish.wasm'],
]) {
  const from = join(bin, src);
  if (!existsSync(from)) throw new Error(`Missing ${from} — is the stockfish package installed?`);
  copyFileSync(from, join(out, dst));
}
