/* Shared by the three README images: the maths from the portfolio kit, type set as outlines, the pixel name. */
import { readFileSync } from 'node:fs';

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
export const hash = (x, y) => { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296 };
export const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v) };
export const fbm = (x, y) => vnoise(x, y) * .55 + vnoise(x * 2.1 + 7, y * 2.1 + 3) * .3 + vnoise(x * 4.3 + 1, y * 4.3 + 9) * .15;
export const n2 = v => { const s = (Math.round(v * 100) / 100).toString(); return s.startsWith('0.') ? s.slice(1) : s.startsWith('-0.') ? '-' + s.slice(2) : s };
export const hex = (r, g, b) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');

/* the page the image sits on, and the ink from the portfolio */
export const THEME = {
  light: { bg: [255, 255, 255], ink: '#0D1017', ink2: '#566070', ink3: '#8A93A1', hair: 'rgba(13,16,23,.1)' },
  dark: { bg: [13, 17, 23], ink: '#ECEDF2', ink2: '#9498AB', ink3: '#61657A', hair: 'rgba(236,237,242,.11)' } };

/* ---------- type as outlines ---------- */
const FONTS = JSON.parse(readFileSync(new URL('../data/fonts.json', import.meta.url)));
export function measure(str, font, size, ls = 0) { const F = FONTS[font], s = size / F.upm; let w = 0, prev = '';
  for (const ch of str) { const g = F.glyphs[ch] || F.glyphs['?']; w += ((F.kern[prev + ch] || 0) + g.a) * s + ls * size; prev = ch } return w - (str.length ? ls * size : 0) }
/* one run of text at x (left edge) and y (baseline). returns the path data and the width */
export function run(str, font, size, x, y, ls = 0) { const F = FONTS[font], s = size / F.upm; let pen = x, prev = '', d = '';
  for (const ch of str) { const g = F.glyphs[ch] || F.glyphs['?']; pen += (F.kern[prev + ch] || 0) * s; const a = g.d;
    for (let i = 0; i < a.length;) { const c = a[i++]; d += c; const n = c === 'M' || c === 'L' ? 2 : c === 'Q' ? 4 : c === 'C' ? 6 : 0;
      for (let k = 0; k < n; k += 2) d += (k ? ' ' : '') + n2(pen + a[i + k] * s) + ' ' + n2(y - a[i + k + 1] * s); i += n }
    pen += g.a * s + ls * size; prev = ch }
  return { d, w: pen - x - (str.length ? ls * size : 0) } }
export const text = (str, font, size, x, y, fill, o = {}) => { const w = o.anchor ? measure(str, font, size, o.ls || 0) : 0, x0 = o.anchor === 'end' ? x - w : o.anchor === 'middle' ? x - w / 2 : x;
  return `<path fill="${fill}"${o.attr ? ' ' + o.attr : ''} d="${run(str, font, size, x0, y, o.ls || 0).d}"/>` };

/* ---------- his name in cells, as on the site: 9 rows, 2 above the x-height, 5 for it, 2 below the baseline ---------- */
const NGLY = {
  j: ['..#', '...', '..#', '..#', '..#', '..#', '..#', '..#', '##.'],
  o: ['....', '....', '.##.', '#..#', '#..#', '#..#', '.##.', '....', '....'],
  r: ['....', '....', '#.##', '##..', '#...', '#...', '#...', '....', '....'],
  g: ['....', '....', '.###', '#..#', '#..#', '#..#', '.###', '...#', '.##.'],
  e: ['....', '....', '.##.', '#..#', '####', '#...', '.###', '....', '....'],
  p: ['....', '....', '###.', '#..#', '#..#', '#..#', '###.', '#...', '#...'],
  l: ['#.', '#.', '#.', '#.', '#.', '#.', '.#', '..', '..'],
  a: ['....', '....', '.##.', '...#', '.###', '#..#', '.###', '....', '....'],
  z: ['....', '....', '####', '...#', '.##.', '#...', '####', '....', '....'] };
export const nameCols = (() => { let x = 0; for (const ch of 'jorge plaza') x += ch === ' ' ? 3 : NGLY[ch][0].length + 1; return x - 1 })();
export const nameWidth = u => nameCols * u - u * .12;
/* x is the left edge, y the baseline. every cell carries --x so the light can pass through it */
export function pixelName(u, x, y, fill) { const g = u * .12; let r = '', x0 = 0;
  for (const ch of 'jorge plaza') { if (ch === ' ') { x0 += 3; continue } const G = NGLY[ch];
    G.forEach((row, yy) => [...row].forEach((v, xx) => { if (v === '#') r += `<rect class="nc" x="${n2(x + (x0 + xx) * u)}" y="${n2(y - 7 * u + yy * u + g / 2)}" width="${n2(u - g)}" height="${n2(u - g)}" rx="${n2(u * .18)}" style="--d:${x0 + xx + yy * .55}"/>` })); x0 += G[0].length + 1 }
  return `<g fill="${fill}">${r}</g>` }
/* the light that passes through the name now and then, in the five country colours in turn */
export const HUES = ['#F2A900', '#F0384A', '#7C5CFF', '#1F7BFF', '#0BAA7A'];
export const nameCSS = ink => { const k = HUES.map((h, i) => { const a = i * 20; return `${a}%{fill:${ink};transform:scale(1)}${a + 1.6}%{fill:${h};transform:scale(1.28)}${a + 4.5}%{fill:${ink};transform:scale(1)}` }).join('');
  return `.nc{transform-box:fill-box;transform-origin:50% 50%;animation:nc 30s linear infinite;animation-delay:calc(var(--d)*28ms + 1.2s)}@keyframes nc{${k}100%{fill:${ink};transform:scale(1)}}` };

/* ---------- a paragraph: words wrap to maxW. tokens are {t, font, fill} or {name:true} ---------- */
export function paragraph(tokens, o) { const { x, y, maxW, size, lh, ls = 0 } = o, np = size * 2.5 / 21, sp = f => measure(' ', f, size);
  const words = [];
  for (const tk of tokens) { if (tk.name) { words.push({ name: true, w: nameWidth(np), glue: false }); continue }
    tk.t.split(/( )/).forEach(p => { if (p === ' ') { if (words.length) words[words.length - 1].space = sp(tk.font) } else if (p) words.push({ t: p, font: tk.font, fill: tk.fill, w: measure(p, tk.font, size, ls), glue: /^[.,;:]/.test(p) }) }) }
  const lines = [[]]; let cx = 0;
  for (let i = 0; i < words.length; i++) { const w = words[i]; let need = w.w, j = i + 1; while (j < words.length && words[j].glue) need += words[j++].w;
    if (cx && cx + need > maxW) { lines.push([]); cx = 0 } w.x = cx; lines[lines.length - 1].push(w); cx += w.w + (w.space || 0) }
  const by = new Map(); let extra = '';
  lines.forEach((ln, li) => ln.forEach(w => { const yy = y + li * lh; if (w.name) { extra += pixelName(np, x + w.x, yy, o.nameFill); return }
    const k = w.fill; by.set(k, (by.get(k) || '') + run(w.t, w.font, size, x + w.x, yy, ls).d) }));
  return { svg: [...by].map(([f, d]) => `<path fill="${f}" d="${d}"/>`).join('') + extra, lines, h: lines.length * lh, words } }

export const REDUCED = '@media (prefers-reduced-motion:reduce){*{animation:none!important}}';
