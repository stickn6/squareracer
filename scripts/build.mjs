/* Bundles src/ into ONE self-contained HTML file: dist/square-scramble.html.
   That file opens straight from disk (double-click), can be emailed, or pasted into claude.ai as an artifact.
   Usage: npm run build            (readable output)
          npm run build -- --minify (smaller output) */
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const minify = process.argv.includes('--minify');
const out = path.join(root, 'dist', 'square-scramble.html');

const js = await build({
  entryPoints: [path.join(root, 'src/main.js')],
  bundle: true, format: 'iife', target: 'es2017', minify, write: false, legalComments: 'none'
});
const css = await readFile(path.join(root, 'src/style.css'), 'utf8');
let html = await readFile(path.join(root, 'index.html'), 'utf8');

/* swap the dev <link>/<script type=module> blocks (between build:* markers) for inline copies */
function inline(tag, body) {
  const re = new RegExp(`<!-- build:${tag} -->[\\s\\S]*?<!-- /build:${tag} -->`);
  if (!re.test(html)) throw new Error(`index.html is missing the build:${tag} markers`);
  html = html.replace(re, () => body);
}
inline('css', `<style>\n${css}</style>`);
/* "</script" inside the bundle would end the tag early */
inline('js', `<script>\n${js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>`);

await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, html);
console.log(`built ${path.relative(root, out)} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB${minify ? ', minified' : ''})`);
