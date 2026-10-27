// Store layouts: a bounded floor plan laid out like a real big-box store, so
// each department has landmarks and the player can retrace their steps.
// Shelves are solid (things slide along them); shots fly over them.
//
// Main Floor follows a Walmart-style grid: columns of shelf runs with aisles
// between the rows, the same gap between neighbouring columns, and wider
// "action alleys" every two columns with displays down their centre.

const A = 100;        // aisle gap: about 10x the player's width
const SHELF_T = 24;   // shelf run depth (double-sided gondola)
const SHELF_L = 180;  // shelf run length
const ALLEY = 250;    // action alley width (2.5 aisles)
const PERIM = 140;    // walkway between the outer wall and the shelves
const WALL = 40;
export const CELL = 16; // path grid

export function buildStore(kind) {
  if (kind !== 'grocery') return null;
  const rects = [], gondolas = [], signs = [], deco = [];
  const add = (x, y, w, h, type, extra = {}) => { const r = { x, y, w, h, type, ...extra }; rects.push(r); return r; };

  // Columns: two shelf columns, an action alley, two more, an alley, two more.
  const cols = [];
  let x = PERIM;
  for (let c = 0; c < 6; c++) {
    cols.push(x);
    x += SHELF_L + (c % 2 === 0 ? A : (c < 5 ? ALLEY : 0));
  }
  const width = x + PERIM;
  const ROWS = 8, top = PERIM;
  const rowY = (r) => top + r * (SHELF_T + A);
  const shelvesBottom = rowY(ROWS - 1) + SHELF_T;

  // Produce: the front-left corner block is open bins instead of shelf runs.
  const produce = (c, r) => c < 2 && r >= ROWS - 3;
  for (let c = 0; c < 6; c++) for (let r = 0; r < ROWS; r++) {
    if (produce(c, r)) continue;
    const g = add(cols[c], rowY(r), SHELF_L, SHELF_T, 'shelf');
    // The Restock or Riot shelf for this run: centre plus its footprint.
    g.g = { key: `${c},${r}`, x: g.x + g.w / 2, y: g.y + g.h / 2, rx: g.x, ry: g.y, rw: g.w, rh: g.h, stock: 1, low: false, fill: 0 };
    gondolas.push(g.g);
  }
  const pY0 = rowY(ROWS - 3), pX0 = cols[0];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    add(pX0 + 20 + i * 120, pY0 + 10 + j * 110, 56, 44, 'bin', { hue: (i * 3 + j) % 4 });
  }

  // Displays down the centre of each action alley, half an aisle apart.
  for (let k = 0; k < 2; k++) {
    const ax = cols[1 + k * 2] + SHELF_L + ALLEY / 2;
    for (let y = top; y + 36 <= shelvesBottom; y += 36 + A / 2) add(ax - 26, y, 52, 36, 'display', { hue: (y / 86 + k) % 3 | 0 });
  }

  // Front of store: a wide racetrack, then a row of checkout lanes.
  const frontY = shelvesBottom + 220;
  for (let lx = 300; lx + 16 < width - 300; lx += 96) add(lx, frontY, 16, 52, 'register');
  const height = frontY + 52 + 210;

  // Outer walls (solid), with coolers along the back and doors in the front.
  add(-WALL, -WALL, width + WALL * 2, WALL, 'wall', { coolers: true });
  add(-WALL, height, width + WALL * 2, WALL, 'wall', { doors: true });
  add(-WALL, 0, WALL, height, 'wall');
  add(width, 0, WALL, height, 'wall');
  const doors = [{ x: width * 0.25, y: height - 30 }, { x: width * 0.75, y: height - 30 }];

  // Department signs on the floor (big) and aisle numbers at each alley mouth.
  signs.push({ x: width * 0.25, y: 60, text: 'DAIRY', big: true }, { x: width * 0.75, y: 60, text: 'MEAT & DELI', big: true });
  signs.push({ x: (cols[0] + cols[1] + SHELF_L) / 2, y: pY0 - 40, text: 'PRODUCE', big: true });
  signs.push({ x: (cols[2] + cols[3] + SHELF_L) / 2, y: top - 40, text: 'GROCERY', big: true });
  signs.push({ x: (cols[4] + cols[5] + SHELF_L) / 2, y: top - 40, text: 'HOME', big: true });
  signs.push({ x: width / 2, y: frontY - 40, text: 'CHECKOUT', big: true });
  signs.push({ x: width / 2, y: height - 70, text: 'ENTRANCE', big: true });
  let n = 1;
  for (let c = 0; c < 6; c += 2) for (let r = 0; r < ROWS - 1; r++) {
    if (produce(c, r) && produce(c, r + 1)) continue;
    signs.push({ x: cols[c] - 14, y: rowY(r) + SHELF_T + A / 2, text: String(n++) });
  }

  const s = { kind, w: width, h: height, rects, gondolas, signs, deco, doors, start: { x: width / 2, y: height - 120 } };
  buildGrids(s);
  return s;
}

// Buckets for collision lookups, plus two path grids: `solid` (the cell
// touches an obstacle; blocks sight) and `walk` (inflated by a shopper's
// radius; what the flow field routes through).
function buildGrids(s) {
  s.bucket = new Map();
  const B = 64;
  for (const r of s.rects) {
    for (let i = Math.floor(r.x / B); i <= Math.floor((r.x + r.w) / B); i++)
      for (let j = Math.floor(r.y / B); j <= Math.floor((r.y + r.h) / B); j++) {
        const k = i + ',' + j;
        if (!s.bucket.has(k)) s.bucket.set(k, []);
        s.bucket.get(k).push(r);
      }
  }
  s.B = B;
  s.gw = Math.ceil(s.w / CELL); s.gh = Math.ceil(s.h / CELL);
  s.solid = new Uint8Array(s.gw * s.gh); s.walk = new Uint8Array(s.gw * s.gh);
  for (let j = 0; j < s.gh; j++) for (let i = 0; i < s.gw; i++) {
    const x0 = i * CELL, y0 = j * CELL;
    for (const r of s.rects) {
      if (x0 < r.x + r.w && x0 + CELL > r.x && y0 < r.y + r.h && y0 + CELL > r.y) s.solid[j * s.gw + i] = 1;
      if (x0 - 6 < r.x + r.w && x0 + CELL + 6 > r.x && y0 - 6 < r.y + r.h && y0 + CELL + 6 > r.y) s.walk[j * s.gw + i] = 1;
    }
  }
  s.dist = new Float64Array(s.gw * s.gh); // not Float32: rounding makes Dijkstra re-relax nodes endlessly
}

export function inside(s, x, y, pad = 0) { return x > pad && y > pad && x < s.w - pad && y < s.h - pad; }
export function walkable(s, x, y) {
  const i = Math.floor(x / CELL), j = Math.floor(y / CELL);
  return i >= 0 && j >= 0 && i < s.gw && j < s.gh && !s.walk[j * s.gw + i];
}

// Push a circle out of every obstacle it overlaps; returns true if it hit one.
// Resolving to the nearest point makes movement slide along edges.
export function collide(s, ent, r) {
  const B = s.B, seen = new Set();
  let hit = false;
  for (let i = Math.floor((ent.x - r) / B); i <= Math.floor((ent.x + r) / B); i++)
    for (let j = Math.floor((ent.y - r) / B); j <= Math.floor((ent.y + r) / B); j++) {
      const list = s.bucket.get(i + ',' + j);
      if (!list) continue;
      for (const o of list) {
        if (seen.has(o)) continue;
        seen.add(o);
        const cx = Math.max(o.x, Math.min(ent.x, o.x + o.w)), cy = Math.max(o.y, Math.min(ent.y, o.y + o.h));
        let dx = ent.x - cx, dy = ent.y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 >= r * r) continue;
        hit = true;
        if (d2 > 0.0001) { const d = Math.sqrt(d2); ent.x += dx / d * (r - d); ent.y += dy / d * (r - d); continue; }
        // Centre is inside: leave by the nearest side.
        const l = ent.x - o.x, rr = o.x + o.w - ent.x, t = ent.y - o.y, b = o.y + o.h - ent.y, m = Math.min(l, rr, t, b);
        if (m === l) ent.x = o.x - r; else if (m === rr) ent.x = o.x + o.w + r; else if (m === t) ent.y = o.y - r; else ent.y = o.y + o.h + r;
      }
    }
  return hit;
}

// Is the straight line clear? grid: s.solid for sight, s.walk for a body's path.
export function clearLine(s, x0, y0, x1, y1, grid = s.solid) {
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 6);
  for (let k = 1; k <= n; k++) {
    const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n;
    const i = Math.floor(x / CELL), j = Math.floor(y / CELL);
    if (i < 0 || j < 0 || i >= s.gw || j >= s.gh || grid[j * s.gw + i]) return false;
  }
  return true;
}

// Distance field from the player over the walk grid (8-way, octile costs,
// no corner cutting). Shoppers step downhill on it to route around shelves.
export function updateFlow(s, px, py) {
  const { gw, gh, walk, dist } = s;
  dist.fill(Infinity);
  let si = Math.floor(px / CELL), sj = Math.floor(py / CELL);
  si = Math.max(0, Math.min(gw - 1, si)); sj = Math.max(0, Math.min(gh - 1, sj));
  const heap = [[0, sj * gw + si]];
  dist[sj * gw + si] = 0;
  const D = Math.SQRT2;
  while (heap.length) {
    const [d, c] = pop(heap);
    if (d > dist[c]) continue;
    const i = c % gw, j = (c / gw) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= gw || nj >= gh) continue;
      const nc = nj * gw + ni;
      if (walk[nc]) continue;
      if (di && dj && (walk[j * gw + ni] || walk[nj * gw + i])) continue;
      const nd = d + (di && dj ? D : 1);
      if (nd < dist[nc]) { dist[nc] = nd; push(heap, [nd, nc]); }
    }
  }
}

// Direction one step downhill from (x, y), or null if there's no field there.
export function flowDir(s, x, y) {
  const { gw, gh, walk, dist } = s;
  const i = Math.floor(x / CELL), j = Math.floor(y / CELL);
  if (i < 0 || j < 0 || i >= gw || j >= gh) return null;
  let best = walk[j * gw + i] ? Infinity : dist[j * gw + i], bx = 0, by = 0;
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
    if (!di && !dj) continue;
    const ni = i + di, nj = j + dj;
    if (ni < 0 || nj < 0 || ni >= gw || nj >= gh) continue;
    if (di && dj && (walk[j * gw + ni] || walk[nj * gw + i])) continue;
    const v = dist[nj * gw + ni];
    if (v < best) { best = v; bx = (ni + 0.5) * CELL - x; by = (nj + 0.5) * CELL - y; }
  }
  const m = Math.hypot(bx, by);
  return m ? [bx / m, by / m] : null;
}

function push(h, v) {
  h.push(v);
  let i = h.length - 1;
  while (i > 0) { const p = (i - 1) >> 1; if (h[p][0] <= h[i][0]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; }
}
function pop(h) {
  const top = h[0], last = h.pop();
  if (h.length) {
    h[0] = last;
    let i = 0;
    for (;;) {
      const l = i * 2 + 1, r = l + 1;
      let m = i;
      if (l < h.length && h[l][0] < h[m][0]) m = l;
      if (r < h.length && h[r][0] < h[m][0]) m = r;
      if (m === i) break;
      [h[m], h[i]] = [h[i], h[m]]; i = m;
    }
  }
  return top;
}
