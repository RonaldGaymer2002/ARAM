/**
 * Vercel monorepo build entrypoint.
 * 1. Builds the target app with Turborepo
 * 2. Exposes .next at the repo root for Vercel's Next.js builder
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { prepareVercelOutput } from './prepare-vercel-lib.mjs';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const app = process.argv[2] ?? process.env.VERCEL_APP ?? 'web';

console.log(`\n=== Vercel build starting for apps/${app} ===\n`);

execSync(`npx turbo run build --filter=${app}...`, {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

console.log(`\n=== Turborepo build finished, preparing Vercel output ===\n`);

await prepareVercelOutput(app);

console.log('\n=== Vercel build complete ===\n');
