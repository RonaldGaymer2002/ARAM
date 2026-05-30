#!/usr/bin/env node
import { prepareVercelOutput } from './prepare-vercel-lib.mjs';

const app = process.argv[2] ?? process.env.VERCEL_APP ?? 'web';

prepareVercelOutput(app).catch((error) => {
  console.error(error);
  process.exit(1);
});
