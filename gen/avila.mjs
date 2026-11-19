/* Direction 1, live Ávila. The Venezuela scene from Cima, ported to a static SVG of cells.
   hour is Caracas time (0 to 24). The sky, the sun or moon, the lights and the clouds all follow it.
   The page theme only decides whether a cell is ink on white or light on dark. */
import { clamp, lerp, sstep, hash, vnoise, fbm, n2, hex, THEME, paragraph, nameCSS, REDUCED } from './lib.mjs';

const W = 840, CW = 5, CH = 8, cols = W / CW, srw = 38, rws = srw + 6, base = Math.round(srw * .86), mh = srw * .64, SH = rws * CH;
/* el ávila from the south: the rise to the hotel, the saddle of la silla, pico oriental, then naiguatá */
const smooth = (P, x) => { let i = 0; while (i < P.length - 2 && x > P[i + 1][0]) i++; const a = P[i], b = P[i + 1], u = clamp((x - a[0]) / (b[0] - a[0]), 0, 1); return lerp(a[1], b[1], u * u * (3 - 2 * u)) };
const PVE = [[0, .3], [.09, .4], [.18, .46], [.27, .56], [.335, .68], [.4, .56], [.47, .6], [.54, .78], [.59, .63], [.65, .84], [.72, .7], [.8, .92], [.87, .7], [.94, .52], [1, .4]];
const ridge = x => smooth(PVE, x) + (fbm(x * 11, 3.3) - .5) * .1 + (vnoise(x * 46, 9.1) - .5) * .03;
const qx = x => Math.round(cols / 2 + (x - .5) * W / CW);
const TOP = new Float32Array(cols), LS = new Float32Array(cols), FB = new Float32Array(rws);
for (let q = 0; q < cols; q++) { TOP[q] = base - ridge(.5 + (q - cols / 2) * CW / W) * mh; LS[q] = base - (1 + .36 * mh * fbm(q * .045, 5.3)) }
for (let r = 0; r < rws; r++) FB[r] = Math.pow(1 - clamp((r - base - 2) / (rws - 3.5 - base), 0, 1), 1.45);

/* the sky through the day: three stops from high up down to the valley, the colour that hugs the ridge and how strong it is,
   which side is warm (1 west, 0 east), the land by day */
const KEYS = [
  [0, 10, 14, 50, 16, 20, 68, 30, 28, 98, 96, 84, 190, .5, .5],
  [4.9, 10, 14, 50, 16, 20, 68, 30, 28, 98, 96, 84, 190, .5, .2],
  [5.7, 20, 30, 92, 64, 50, 146, 196, 88, 134, 255, 150, 92, 1.15, 0],
  [6.4, 60, 118, 236, 128, 160, 246, 250, 184, 176, 255, 184, 88, 1.3, 0],
  [7.8, 52, 128, 255, 62, 136, 255, 84, 152, 255, 255, 176, 76, .95, 0],
  [12.3, 44, 120, 255, 52, 128, 255, 70, 142, 255, 255, 190, 110, .55, .5],
  [16.4, 52, 128, 255, 60, 134, 255, 96, 150, 250, 255, 166, 60, 1.1, 1],
  [17.6, 40, 74, 200, 112, 86, 204, 236, 112, 140, 255, 160, 60, 1.3, 1],
  [18.4, 18, 28, 86, 72, 46, 152, 216, 76, 126, 255, 150, 72, 1.3, 1],
  [19.2, 12, 18, 62, 30, 26, 100, 96, 46, 132, 190, 84, 120, .9, 1],
  [20.2, 10, 14, 50, 16, 20, 68, 30, 28, 98, 96, 84, 190, .5, .8],
  [24, 10, 14, 50, 16, 20, 68, 30, 28, 98, 96, 84, 190, .5, .5]];
function sky(h) { let i = 0; while (i < KEYS.length - 2 && h > KEYS[i + 1][0]) i++; const a = KEYS[i], b = KEYS[i + 1], u = sstep(a[0], b[0], h); return a.map((v, k) => lerp(v, b[k], u)) }
/* 0 by day, 1 by night */
export const night = h => 1 - sstep(5.3, 6.5, h) + sstep(17.7, 19.1, h);
export const phaseWord = h => h < 5 ? 'night' : h < 6.6 ? 'dawn' : h < 11.5 ? 'morning' : h < 13.5 ? 'midday' : h < 17.3 ? 'afternoon' : h < 19.2 ? 'dusk' : 'night';
/* 0 new, .5 full */
export const moonPhase = date => { const d = (date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5; return ((d / 29.530588853) % 1 + 1) % 1 };

/* the cells: five sizes and a dot, as in the kit's atlas */
const GL = [0, 1, 2, 3, 4].map(k => { const s = .34 + .165 * k, w = CW * .82 * s, h = CH * .64 * s, r = Math.min(w, h) * .3; return { w, h, r } });
GL.push({ w: 1.5, h: 1.5, r: .74 });
const DOT = 5, SZ = v => v > .46 ? 3 : v > .36 ? 2 : v > .27 ? 1 : v > .19 ? 0 : DOT;
const LIGHTS = [[255, 170, 76], [255, 226, 184], [255, 120, 46], [160, 222, 255], [255, 88, 88]];

export function avila({ hour = 18.4, theme = 'light', date = new Date(), cloud = .5 }) {
  const T = THEME[theme], lightPage = theme === 'light', bg = T.bg, S = sky(hour), N = clamp(night(hour), 0, 1), day = 1 - N, nt = N > .5;
  const dusk = Math.max(Math.exp(-(((hour - 18.5) / 1.1) ** 2)), Math.exp(-(((hour - 5.9) / .9) ** 2)));
  const grid = new Map();
  /* one cell. cls marks the ones that move; over=false keeps whichever is stronger */
  const put = (q, r, g, R, G, B, I, cls = '', over = true, orb = false) => { if (q < 0 || r < 0 || q >= cols || r >= rws || I <= .02) return; const k = r * cols + q, o = grid.get(k); if (!over && o && o.I >= I) return; grid.set(k, { q, r, g, R, G, B, I: Math.min(1, I), cls, orb }) };
  /* the sun crosses from the east (right) to the west, the moon after it */
  const arc = f => ({ x: lerp(.9, .1, f) * W, y: lerp((base - 5) * CH, 5.5 * CH, Math.sin(Math.PI * f)) });
  const sunF = (hour - 6.1) / 12.2, sun = sunF > -.04 && sunF < 1.04 ? arc(clamp(sunF, 0, 1)) : null;
  const moonF = (((hour - 18.9) % 24 + 24) % 24) / 11, mp = moonPhase(date), moon = N > .4 && moonF < 1 && Math.abs(mp - 0) > .04 && Math.abs(mp - 1) > .04 ? arc(moonF) : null;
  if (moon) moon.y = lerp(moon.y, 9 * CH, .35);
  const SR = 17, MR = 17, orbG = d => d < .78 ? 4 : d < .93 ? 3 : 2, mk = Math.cos(2 * Math.PI * mp);
  const inMoon = (px, py) => { const dx = (px - moon.x) / MR, dy = (py - moon.y) / MR, d = dx * dx + dy * dy; if (d > 1) return 0; const e = mk * Math.sqrt(1 - dy * dy); return (mp < .5 ? dx >= e : dx <= -e) ? 2 + Math.sqrt(d) : 1 };

  for (let q = 0; q < cols; q++) {
    const top = TOP[q], ft = Math.round(top), sl = TOP[Math.min(cols - 1, q + 1)] - TOP[Math.max(0, q - 1)];
    const wx = lerp(q / (cols - 1), 1 - q / (cols - 1), S[14]), warm = .28 + .72 * Math.pow(wx, 1.25), side = sstep(-1, 7, q) * sstep(-1, 7, cols - 1 - q);
    for (let r = 0; r < rws; r++) {
      const px = (q + .5) * CW, py = (r + .5) * CH;
      if (r < ft) { /* sky */
        const up = top - r, v = clamp(r / base, 0, 1), h = hash(q * 5 + 1, r * 3 + 7), edge = side * sstep(-1, 3.5, r);
        const g2 = Math.min(1, Math.exp(-up / 6) * (.4 + .6 * warm) * S[13]), u = v * 2, i = Math.min(1, u | 0), f = u - i, a = 1 + i * 3;
        let R = lerp(lerp(S[a], S[a + 3], f), S[10], g2), G = lerp(lerp(S[a + 1], S[a + 4], f), S[11], g2), B = lerp(lerp(S[a + 2], S[a + 5], f), S[12], g2);
        if (sun) { const d = Math.hypot(px - sun.x, py - sun.y); if (d < SR) { lightPage ? put(q, r, orbG(d / SR), 244, 158, 0, 1, '', true, true) : put(q, r, orbG(d / SR), 255, 208, 104, 1, '', true, true); continue }
          const hl = Math.exp(-((d - SR) / 26)) * .7 * day; R = lerp(R, 255, hl); G = lerp(G, 186, hl); B = lerp(B, 70, hl) }
        const mo = moon ? inMoon(px, py) : 0;
        if (lightPage) { /* ink: thin and blue by day, thick and indigo by night. stars and the moon are bare page */
          if (mo >= 2) continue;
          R = lerp(R, 78, .6 * N); G = lerp(G, 80, .6 * N); B = lerp(B, 176, .6 * N);
          const n = .9 + .1 * vnoise(q * .07, r * .4);
          let I = lerp(.17 + .36 * Math.pow(1 - v, 1.15) + .28 * g2, .4 - .1 * v + .2 * g2 + .08 * dusk, N) * n * edge;
          if (nt && h > .972 && up > 3) { put(q, r, DOT, R, G, B, .5 * edge, 'tw' + (Math.floor(h * 4099) % 5)); continue }
          put(q, r, SZ(I), R, G, B, I < .06 ? 0 : I);
        } else { /* light: a blue field by day. by night only the glow behind the ridge, and stars */
          if (mo >= 2) { put(q, r, orbG(mo - 2), 240, 234, 214, .95, '', true, true); continue } if (mo === 1) continue;
          const gl = Math.max(sstep(0, .92, r / base) * (.25 + .75 * dusk), Math.exp(-up / 8) * .95 * (.45 + .55 * dusk));
          if (nt && h > .986 && gl < .5) { put(q, r, h > .996 ? 1 : h > .991 ? 0 : DOT, 235, 240, 255, (h > .996 ? .95 : .7) * edge * (N * 2 - 1), 'tw' + (Math.floor(h * 4099) % 5)); continue }
          const dI = .3 + .3 * Math.pow(1 - v, 1.15) + .3 * g2, nI = gl < .34 && ((q & 1) || (r & 1)) ? 0 : (.05 + .9 * gl * gl * (.5 + .5 * warm));
          const I = lerp(dI, nI, N) * edge, gs = lerp(dI, gl * .6, N);
          put(q, r, SZ(Math.max(gs, I * .9)), R, G, B, I < .04 ? 0 : I) }
        continue }
      const fb = FB[r]; if (fb <= 0) continue;
      const lr = LS[q]; let done = false;
      if (r >= lr) { /* the city: lights climb the lower slopes, thicken in the valley, thin out into the page */
        const cl = fbm(q * .04 + 3, r * .12 + 1), dn = clamp((r - lr) / 5, 0, 1) * (.16 + 1.1 * cl * cl) * (r > base ? 1 : .6) * (.06 + .94 * fb) * side, hh = hash(q * 3 + 1, r * 5 + 2);
        if (hh < dn) { const h2 = hash(q * 7 + 5, r * 11 + 3), h3 = hash(q * 13 + 2, r * 17 + 9), k = h2 < .58 ? 0 : h2 < .8 ? 1 : h2 < .92 ? 2 : h2 < .965 ? 3 : 4, fi = Math.sqrt(fb), g = h3 < .36 ? DOT : h3 < .72 ? 0 : h3 < .92 ? 1 : 2;
          if (nt) { const c = LIGHTS[k], m = lightPage ? .9 : 1; put(q, r, g, c[0] * m, c[1] * (lightPage ? .82 : 1), c[2] * (lightPage ? .7 : 1), (.42 + .58 * h3) * fi * (.4 + .6 * N), h3 > .6 ? 'fl' + (Math.floor(h2 * 977) % 4) : '') }
          else { const c = h2 < .52 ? (lightPage ? [22, 98, 88] : [70, 200, 176]) : h2 < .8 ? [255, 166, 60] : [52, 128, 255]; put(q, r, g, c[0], c[1], c[2], (.26 + .4 * h3) * fi) }
          done = true } }
      if (done || r > base + 1) continue;
      const dd = (r - top) / Math.max(1, base - top), nz = fbm(q * .12, r * .3 + 3);
      if (r === ft) { /* the crest catches the light */
        if (lightPage) put(q, r, 4, lerp(22, 14, N), lerp(98, 18, N), lerp(88, 52, N), .7 * side);
        else put(q, r, sl < -.8 || sl > .8 ? 3 : 2, lerp(120, lerp(150, 255, warm), N), lerp(236, lerp(150, 172, warm), N), lerp(206, lerp(214, 118, warm), N), (lerp(.6, .3 + .34 * warm * (.4 + .6 * dusk), N)) * side);
        continue }
      /* the body of the mountain: ink that thins out towards the valley, or a dim mass under the night */
      const rv = Math.abs(Math.sin(q * .33 + fbm(q * .05, r * .07) * 6.5)), sh = clamp(.5 + sl * .42 + (nz - .5) * 1.5 + (rv - .5) * .3, 0, 1);
      if (lightPage) { const I = lerp(.4 + .3 * sh, .62 + .3 * sh, N) * (1 - lerp(.4, .22, N) * sstep(.5, 1, dd)) * side; put(q, r, I > .7 ? 4 : SZ(I), lerp(22, 14, N), lerp(98, 18, N), lerp(88, 52, N), I) }
      else { const dI = (.36 + .26 * sh) * (1 - .3 * sstep(.5, 1, dd)), nI = (.13 + .17 * nz) * (1 - .4 * dd) * (rv < .16 ? .55 : 1);
        put(q, r, N > .5 ? (rv < .16 ? DOT : nz > .58 ? 1 : 0) : SZ(dI * 1.1), lerp(40, lerp(64, 34, dd), N), lerp(176, lerp(60, 44, dd), N), lerp(146, lerp(140, 92, dd), N), lerp(dI, nI, N) * side) } } }

  /* the cable car up to the hotel, and the hotel with its red light */
  const qh = qx(.335), hy = Math.floor(TOP[qh]), x0 = qh - Math.round(W * .055 / CW), y0 = base - 1, n = Math.max(1, y0 - (hy - 1)), wire = lightPage ? [30, 40, 60] : nt ? [255, 214, 150] : [200, 230, 224];
  for (let k = 0; k <= n; k += 2) put(Math.round(lerp(x0, qh, k / n)), y0 - k, DOT, ...wire, .55);
  /* the road through the valley: headlights one way, tail lights the other */
  const road = []; for (let q = 0; q < cols; q++) { const r = base + 4 + Math.round(Math.sin(q * .021 + 1) * 2), w = sstep(-1, 7, q) * sstep(-1, 7, cols - 1 - q); road.push({ q, r, w: w * FB[r], w2: w * FB[r + 1] }) }

  /* ---------- to SVG. cells of one colour and size share a path; a cell is a small rect with a round stroke ---------- */
  const mix = c => { const k = Math.min(1, c.I * 1.6); return lightPage ? [0, 1, 2].map(i => lerp(bg[i], [c.R, c.G, c.B][i], k)) : [0, 1, 2].map(i => Math.min(255, bg[i] + [c.R, c.G, c.B][i] * k * .96)) };
  const qz = v => clamp(Math.round(v / 6) * 6, 0, 255), cell = (q, r, g) => { const G = GL[g], iw = G.w - 2 * G.r, ih = G.h - 2 * G.r; return `M${n2((q + .5) * CW - iw / 2)} ${n2((r + .5) * CH - ih / 2)}h${n2(iw)}v${n2(ih)}h${n2(-iw)}z` };
  const bucket = new Map(), skyB = new Map(), anim = new Map();
  for (const c of grid.values()) { const m = mix(c).map(qz), col = hex(...m), isSky = c.r < Math.round(TOP[c.q]) && !c.orb;
    const M = c.cls ? anim : isSky ? skyB : bucket, k = (c.cls ? c.cls + '|' : '') + c.g + '|' + col; M.set(k, (M.get(k) || '') + cell(c.q, c.r, c.g)) }
  const paths = M => { const by = [[], [], [], [], [], []]; for (const [k, d] of M) { const p = k.split('|'), cls = p.length === 3 ? p.shift() : ''; by[+p[0]].push(`<path${cls ? ` class="${cls}"` : ''} color="${p[1]}" d="${d}"/>`) }
    return by.map((a, g) => a.length ? `<g stroke-width="${n2(GL[g].r * 2)}">${a.join('')}</g>` : '').join('') };

  /* clouds: a mask over the sky that hides whole cells, or leaves a smaller one showing at the edges. it drifts west a cell at a time */
  const cth = lerp(.66, .47, cloud), cf = (q, r) => { const f = (qq) => fbm(qq * .024, r * .075 + 2.7), t = q / cols; return lerp(f(q), f(q - cols), sstep(.6, 1, t)) };
  let cm = '';
  for (let r = 1; r < base; r++) for (let q = 0; q < cols; q++) { const pf = Math.sin(Math.PI * clamp((r - 1) / (base * .78), 0, 1)), cg = sstep(cth - .07, cth + .035, cf(q, r)) * (.25 + .75 * pf); if (cg < .2) continue;
    const x = q * CW, y = r * CH, hole = cg > .8 ? null : GL[cg > .6 ? 0 : cg > .4 ? 1 : 2];
    cm += `M${x} ${y}h${CW}v${CH}h${-CW}z` + (hole ? `M${n2(x + CW / 2 - hole.w / 2 - .3)} ${n2(y + CH / 2 - hole.h / 2 - .3)}v${n2(hole.h + .6)}h${n2(hole.w + .6)}v${n2(-hole.h - .6)}z` : '') }
  const drift = cols * 3.2;

  /* the things that move */
  const carN = n, car = `<g class="car"><path color="${lightPage ? '#141A28' : nt ? '#FFF4D6' : '#EAF6F2'}" stroke-width="${n2(GL[2].r * 2)}" d="${cell(x0, y0, 2)}"/></g>`;
  const mastC = lightPage ? '#1E283C' : '#BED6E4', mast = `<rect x="${n2((qh + .5) * CW - .5)}" y="${(hy - 2) * CH}" width="1" height="${2 * CH - 1}" fill="${mastC}"/><g class="bk"><path color="${lightPage ? '#F03C3C' : '#FF4646'}" stroke-width="${n2(GL[1].r * 2)}" d="${cell(qh, hy - 3, 1)}"/></g>`;
  let cars = '';
  { const A = 15, Bn = 19, ha = Array.from({ length: A }, () => ''), tb = Array.from({ length: Bn }, () => '');
    for (const p of road) { if (p.w > .25) ha[p.q % A] += cell(p.q, p.r, 1); if (p.w2 > .25) tb[p.q % Bn] += cell(p.q, p.r + 1, 0) }
    const hc = lightPage ? (nt ? '#C98A1E' : '#1E283C') : '#FFF6DC', tc = lightPage ? '#F03C3C' : '#FF463C';
    cars = `<g stroke-width="${n2(GL[1].r * 2)}">` + ha.map((d, k) => d ? `<path class="hl" style="animation-delay:${n2(k / 8 - 15 / 8)}s" color="${hc}" d="${d}"/>` : '').join('') + '</g>' +
      `<g stroke-width="${n2(GL[0].r * 2)}">` + tb.map((d, k) => d ? `<path class="tl" style="animation-delay:${n2(-k / 6.5)}s" color="${tc}" d="${d}"/>` : '').join('') + '</g>' }

  /* the sentence under the scene */
  const P = paragraph([{ t: 'hi, my name is ', font: 'sans400', fill: T.ink2 }, { name: true }, { t: '. i build products, obsess over design, and love learning new things. i’m from ', font: 'sans400', fill: T.ink2 }, { t: 'caracas, venezuela', font: 'sans500', fill: T.ink },
    { t: `, where it’s ${phaseWord(hour)} right now.`, font: 'sans400', fill: T.ink2 }], { x: 4, y: SH + 34, maxW: W - 8, size: 21, lh: 30, ls: -.012, nameFill: T.ink });
  const H = Math.ceil(SH + 34 + P.h - 30 + 14);
  const css = `.c{fill:currentColor;stroke:currentColor;stroke-linejoin:round}` +
    `.tw0,.tw1,.tw2,.tw3,.tw4{animation:tw 3.4s ease-in-out infinite}.tw1{animation-duration:2.6s;animation-delay:-.7s}.tw2{animation-duration:4.4s;animation-delay:-2.1s}.tw3{animation-duration:3s;animation-delay:-1.4s}.tw4{animation-duration:5.2s;animation-delay:-3s}@keyframes tw{0%,100%{opacity:1}50%{opacity:.22}}` +
    `.fl0,.fl1,.fl2,.fl3{animation:fl 2.9s ease-in-out infinite}.fl1{animation-duration:1.9s;animation-delay:-.6s}.fl2{animation-duration:4.1s;animation-delay:-1.7s}.fl3{animation-duration:2.3s;animation-delay:-.2s}@keyframes fl{0%,100%{opacity:1}50%{opacity:.4}}` +
    `.bk{animation:bk 2.6s steps(1) infinite}@keyframes bk{0%{opacity:1}55%{opacity:.2}}` +
    `.car{animation:car ${carN * 1.6}s steps(${carN}) infinite alternate}@keyframes car{to{transform:translate(${(qh - x0) * CW}px,${-carN * CH}px)}}` +
    `.hl{opacity:0;animation:hl 1.875s steps(1) infinite}@keyframes hl{0%{opacity:1}9.4%,100%{opacity:0}}.tl{opacity:0;animation:hl 2.923s steps(1) infinite reverse}` +
    `.dr{animation:dr ${drift}s steps(${cols}) infinite}@keyframes dr{to{transform:translateX(${-W}px)}}` +
    nameCSS(T.ink) + REDUCED;
  const scene = `<g id="s" class="c"><g mask="url(#m)">${paths(skyB)}</g>${paths(bucket)}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="El Ávila, the mountain above Caracas, drawn in small cells as it looks right now (${phaseWord(hour)}). Jorge Plaza builds products, obsesses over design, and loves learning new things."><style>${css}</style>` +
    `<defs><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${SH}"><rect width="${W}" height="${SH}" fill="#fff"/><g class="dr" fill="#000" fill-rule="evenodd"><path d="${cm}"/><path transform="translate(${W})" d="${cm}"/></g></mask>` +
    (lightPage ? '' : `<filter id="b" x="-5%" y="-10%" width="110%" height="120%"><feGaussianBlur stdDeviation="3.2"/></filter><filter id="b2" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>`) + `</defs>` +
    `<g>` + (lightPage ? '' : `<use href="#s" filter="url(#b2)" opacity="${n2(lerp(.3, .55, N))}"/><use href="#s" filter="url(#b)" opacity="${n2(lerp(.32, .6, N))}"/>`) + scene +
    `<g class="c">${paths(anim)}${cars}${car}${mast}</g></g>${P.svg}</svg>`;
}
