/**
 * Vercel runs from the monorepo root but Next.js builds into apps/<app>/.next.
 * This script copies the built app artifacts to the repo root so Vercel can deploy them.
 */
import { access, cp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = process.argv[2] ?? process.env.VERCEL_APP ?? 'web';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const appDir = join(root, 'apps', APP);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(from, to, label) {
  if (!(await exists(from))) {
    throw new Error(`Missing ${label}: ${from}`);
  }

  await rm(to, { recursive: true, force: true });
  await cp(from, to, { recursive: true });
  console.log(`✓ ${label}: ${from} → ${to}`);
}

async function copyFile(from, to, label) {
  if (!(await exists(from))) {
    return;
  }

  await cp(from, to);
  console.log(`✓ ${label}: ${from} → ${to}`);
}

async function main() {
  console.log(`Preparing Vercel output for apps/${APP}...`);

  await copyDir(join(appDir, '.next'), join(root, '.next'), 'Next.js build output');

  await copyFile(
    join(appDir, 'next.config.mjs'),
    join(root, 'next.config.mjs'),
    'next.config.mjs'
  );

  await copyFile(
    join(appDir, 'next.config.js'),
    join(root, 'next.config.js'),
    'next.config.js'
  );

  const publicDir = join(appDir, 'public');
  if (await exists(publicDir)) {
    await copyDir(publicDir, join(root, 'public'), 'public assets');
  }

  console.log('Vercel output ready at repository root.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
