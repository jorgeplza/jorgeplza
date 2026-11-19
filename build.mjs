/* Draws El Ávila as it looks right now from Caracas and writes the two README images into out/.
   node build.mjs        the current hour
   node build.mjs 18.5   a given hour, to try one out */
import { mkdirSync, writeFileSync } from 'node:fs';
import { avila } from './gen/avila.mjs';

const now = new Date();
/* Caracas is UTC-4 all year */
const hour = process.argv[2] != null ? +process.argv[2] : ((now.getUTCHours() + now.getUTCMinutes() / 60 - 4) % 24 + 24) % 24;
mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
for (const theme of ['light', 'dark']) writeFileSync(new URL(`./out/avila-${theme}.svg`, import.meta.url), avila({ hour, theme, date: now }));
console.log(`drawn for ${hour.toFixed(2)}h in Caracas`);
