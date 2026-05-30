/**
 * Exposes apps/<app>/.next at the monorepo root for Vercel's Next.js builder.
 * Uses a symlink on Linux/macOS (Vercel) and falls back to copy elsewhere.
 */
import { access, cp, rm, symlink, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function linkOrCopyDir(from, to, label) {
  if (!(await exists(from))) {
    throw new Error(`Missing ${label}: ${from}`);
  }

  await rm(to, { recursive: true, force: true });

  try {
    const linkType = process.platform === 'win32' ? 'junction' : 'dir';
    await symlink(from, to, linkType);
    console.log(`✓ Linked ${label}: ${from} → ${to}`);
    return;
  } catch (error) {
    console.warn(`Symlink failed for ${label}, falling back to copy:`, error.message);
  }

  await cp(from, to, { recursive: true });
  console.log(`✓ Copied ${label}: ${from} → ${to}`);
}

async function copyFile(from, to, label) {
  if (!(await exists(from))) {
    return;
  }

  await cp(from, to);
  console.log(`✓ ${label}: ${from} → ${to}`);
}

export async function prepareVercelOutput(app = 'web') {
  const appDir = join(root, 'apps', app);

  console.log(`Preparing Vercel output for apps/${app}...`);

  await linkOrCopyDir(
    join(appDir, '.next'),
    join(root, '.next'),
    'Next.js build output'
  );

  const routesManifest = join(root, '.next', 'routes-manifest.json');
  if (!(await exists(routesManifest))) {
    throw new Error(
      `Invalid Next.js output: missing ${routesManifest}. ` +
        'Ensure the app build completed successfully.'
    );
  }

  await readFile(routesManifest, 'utf8');
  console.log('✓ Verified routes-manifest.json');

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

  await copyFile(
    join(appDir, 'package.json'),
    join(root, '.vercel-next-package.json'),
    'app package.json snapshot'
  );

  const publicDir = join(appDir, 'public');
  if (await exists(publicDir)) {
    await linkOrCopyDir(publicDir, join(root, 'public'), 'public assets');
  }

  console.log('Vercel output ready at repository root.');
}

const isDirectRun = process.argv[1]?.endsWith('prepare-vercel.mjs');

if (isDirectRun) {
  const app = process.argv[2] ?? process.env.VERCEL_APP ?? 'web';
  prepareVercelOutput(app).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
