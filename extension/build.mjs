import { execSync } from 'node:child_process';
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const dist = join(dir, 'dist');
const icons = join(dist, 'icons');

mkdirSync(icons, { recursive: true });

// Background service worker
execSync(`npx esbuild ${join(dir, 'src/background.mjs')} --bundle --outfile=${join(dist, 'background.js')} --format=iife --target=chrome120,firefox121`);

// Popup script
execSync(`npx esbuild ${join(dir, 'src/popup.mjs')} --bundle --outfile=${join(dist, 'popup.js')} --format=iife --target=chrome120,firefox121`);

// Copy static assets
cpSync(join(dir, 'src/popup.html'), join(dist, 'popup.html'));
cpSync(join(dir, 'src/popup.css'), join(dist, 'popup.css'));
cpSync(join(dir, 'manifest.json'), join(dist, 'manifest.json'));

// Icons — use existing favicon PNGs
const publicDir = join(dir, '..', 'public');
cpSync(join(publicDir, 'favicon-96x96.png'), join(icons, 'icon-16.png'));
cpSync(join(publicDir, 'favicon-96x96.png'), join(icons, 'icon-48.png'));
cpSync(join(publicDir, 'favicon-96x96.png'), join(icons, 'icon-128.png'));

console.log('Extension built to extension/dist/');
