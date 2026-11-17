/* Local dev server: serves the repo root so index.html loads src/ as native ES modules.
   Edit a file and reload the page; there is no build step in dev. */
import { context } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 8000;
const ctx = await context({});
const { port: p } = await ctx.serve({ servedir: root, port });
console.log(`Square Scramble dev server: http://localhost:${p}/`);
