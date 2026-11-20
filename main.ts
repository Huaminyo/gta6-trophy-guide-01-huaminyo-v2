// The Leonida Field Manual — take 4 (gta6-trophy-guide-01, round 3).
//
// Entrypoint: this program runs on Node 22 with the standard library
// only, inside a container with no network, a read-only copy of this
// repository beside it and a writable output directory. It hands the
// guide in by copying the app's own files — app/ and screenshots/ —
// into the output directory, then writing dossier.json there with the
// vendored make.fun library (vendor/makefun-frontend.ts, the kit's
// copy, kept byte for byte). Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The guide itself is plain static files: app/index.html plus ES
// modules, one stylesheet and local JSON data. It loads nothing over
// the network at run time, and every trophy's guide cites the sources
// it was built from.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps for this bounty, as the kit's gate states them:
// the dossier text budget, plus the hard limits on screenshots and
// on the app's file count and total size.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

// Copy a tree only when the source is there, so a guide whose shots
// are not taken yet still hands in its app/ instead of failing.
function copyTreeIfPresent(source, target) {
  if (!existsSync(source)) return false;
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
  return true;
}

// Count the regular files under a directory, for the handover note.
function countFiles(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) total += countFiles(path);
    else if (statSync(path).isFile()) total += 1;
  }
  return total;
}

function handIn() {
  mkdirSync(outDir, { recursive: true });
  copyTreeIfPresent(join(repoRoot, 'app'), join(outDir, 'app'));
  const shotsCopied = copyTreeIfPresent(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
  const dossier = buildDossier(outDir, dossierCaps);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  const appFiles = countFiles(join(outDir, 'app'));
  const shotFiles = shotsCopied ? countFiles(join(outDir, 'screenshots')) : 0;
  console.log(
    `Leonida Field Manual handed in: ${appFiles} app files, ${shotFiles} screenshots, dossier ${dossier.length} bytes.`,
  );
}

handIn();
