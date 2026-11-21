// Leonida Roadmap Planner — entry program (Node 22, standard library only).
// Hands the guide in: copies this repository's app/ and screenshots/ into
// the output directory and writes /output/dossier.json with the kit's
// vendored make.fun library, byte for byte the scorer's own copy. Leave
// vendor/makefun-frontend.ts untouched.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Screenshots are added after the build, so a missing screenshots/ folder
// is fine here — the dossier step will refuse until they exist.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const shotsDir = join(outputDir, 'screenshots');

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(shotsDir, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), shotsDir, { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest
// refuse an entry the scorer would refuse (over 4 screenshots or one over
// 256 KiB; over 993 files and directories in app/ or 48 MiB of app files).
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log('Wrote dossier.json (' + dossier.length + ' bytes) to ' + outputDir);
