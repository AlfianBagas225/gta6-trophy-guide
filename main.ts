// Leonida Roadmap Planner — the hand-in program.
//
// I wrote this guide as a plain folder of static files, so handing it in
// is just copying: app/ and screenshots/ go to the output directory
// whole, and dossier.json is written there by the vendored make.fun
// library, which is the only part of this step I did not write myself.
// Run it with MAKEFUN_OUTPUT_DIR set to a scratch folder to check it,
// or with no variable at all to write to /output as the grader does.
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));

function outputDir() {
  return process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
}

function copyIfPresent(source, target) {
  if (existsSync(source)) cpSync(source, target, { recursive: true });
}

function handIn() {
  const out = outputDir();
  mkdirSync(out, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(out, 'app'), { recursive: true });
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  copyIfPresent(join(repoRoot, 'screenshots'), join(out, 'screenshots'));
  const dossier = buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(out, 'dossier.json'), dossier);
}

handIn();
