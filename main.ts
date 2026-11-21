// Leonida Roadmap Planner — the entry program (Node 22, standard library only).
// It hands the guide in: app/ (the static guide) and screenshots/ (its 3 or 4
// renders) are copied from beside this file into the output directory, and
// dossier.json is written there with the vendored make.fun library, which is
// the summary the judge reads. vendor/makefun-frontend.ts stays untouched:
// the scorer rebuilds the dossier with its own identical copy and compares
// the two byte for byte, so any change to the library would fail the entry.
//
// The screenshots do not exist yet while the guide is being built, so an
// early run stops at the dossier step — that is expected, not a bug in the
// guide. Take the screenshots first, then run this program.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// shots.json names the four renders and the view each one shows; the first
// entry is the cover. It is a note for the maker, read here only to report it.
const shotsPath = join(here, 'shots.json');
if (existsSync(shotsPath)) {
  const shots = JSON.parse(readFileSync(shotsPath, 'utf8'));
  console.log('shots: ' + shots.map((s) => s.file).join(', '));
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the others
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files and directories in app/ or 48 MiB of app
// files, counted beside /output's own 1000-entry cap).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

console.log('wrote ' + join(out, 'dossier.json'));
