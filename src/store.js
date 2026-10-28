// Store layouts: a bounded floor plan laid out like a real big-box store, so
// each department has landmarks and the player can retrace their steps.
// Shelves are solid (things slide along them); shots fly over them.
//
// Every department follows a Walmart-style grid: columns of shelf runs with
// aisles between the rows, the same gap between neighbouring columns, and wider
// "action alleys" every two columns with displays down their centre.

const A = 100;        // aisle gap: about 10x the player's width
const SHELF_T = 24;   // shelf run depth (double-sided gondola)
const SHELF_L = 180;  // shelf run length
const ALLEY = 250;    // action alley width (2.5 aisles)
const PERIM = 140;    // walkway between the outer wall and the shelves
const WALL = 40;
export const CELL = 16; // path grid

export function buildStore(kind) {
  const plan = PLANS[kind];
  if (!plan) return null;
  const rects = [], gondolas = [], signs = [], deco = [];
  const add = (x, y, w, h, type, extra = {}) => { const r = { x, y, w, h, type, ...extra }; rects.push(r); return r; };
  const top = PERIM, rowY = (r) => top + r * (SHELF_T + A);
  // A stockable shelf run (Restock or Riot uses its centre plus footprint).
  const shelf = (x, y, key, style) => {
    const g = add(x, y, SHELF_L, SHELF_T, 'shelf', { style });
    g.g = { key, x: g.x + g.w / 2, y: g.y + g.h / 2, rx: g.x, ry: g.y, rw: g.w, rh: g.h, stock: 1, low: false, fill: 0 };
    gondolas.push(g.g);
  };
  // A pair of shelf columns, one aisle apart, rows an aisle apart; aisle numbers on the left.
  let aisle = 1;
  const block = (x, rows, skip = () => false, style) => {
    for (let c = 0; c < 2; c++) for (let r = 0; r < rows; r++) if (!skip(c, r)) shelf(x + c * (SHELF_L + A), rowY(r), `${x},${c},${r}`, style);
    for (let r = 0; r < rows - 1; r++) if (!(skip(0, r) && skip(0, r + 1))) signs.push({ x: x - 14, y: rowY(r) + SHELF_T + A / 2, text: String(aisle++) });
    return x + 2 * SHELF_L + A;
  };
  const BLOCK_W = 2 * SHELF_L + A;
  // An action alley: displays centred in it, half an aisle apart.
  const alley = (x, bottom, hue = 0) => {
    for (let y = top; y + 36 <= bottom; y += 36 + A / 2) add(x + ALLEY / 2 - 26, y, 52, 36, 'display', { hue: (y / 86 + hue) % 3 | 0 });
    return x + ALLEY;
  };
  const ctx = { add, shelf, block, alley, rowY, top, signs, BLOCK_W };
  const { width, shelvesBottom, wallDeco } = plan(ctx);

  // Front of store: a wide racetrack, then checkout lanes (and anything the plan put there).
  const frontY = shelvesBottom + 220;
  const regFrom = plan.registersFrom ? plan.registersFrom(width) : 300;
  for (let lx = regFrom; lx + 16 < width - 300; lx += 96) add(lx, frontY, 16, 52, 'register');
  if (plan.front) plan.front(ctx, frontY, width);
  const height = frontY + 52 + 210;

  // Outer walls (solid): the back wall is decorated per department; doors in the front.
  add(-WALL, -WALL, width + WALL * 2, WALL, 'wall', { deco: wallDeco });
  add(-WALL, height, width + WALL * 2, WALL, 'wall', { doors: true });
  add(-WALL, 0, WALL, height, 'wall');
  add(width, 0, WALL, height, 'wall');
  const doors = [{ x: width * 0.25, y: height - 30 }, { x: width * 0.75, y: height - 30 }];
  signs.push({ x: width / 2, y: frontY - 40, text: 'CHECKOUT', big: true }, { x: width / 2, y: height - 70, text: 'ENTRANCE', big: true });

  const s = { kind, w: width, h: height, rects, gondolas, signs, deco, doors, start: { x: width / 2, y: height - 120 } };
  buildGrids(s);
  return s;
}

// One floor plan per department, all on the same grid rules.
const PLANS = {
  // Main Floor: two columns, an action alley, two, an alley, two. Produce bins
  // take the front-left corner; dairy and meat coolers line the back wall.
  grocery({ add, block, alley, rowY, top, signs, BLOCK_W }) {
    const ROWS = 8, bottom = rowY(ROWS - 1) + SHELF_T;
    const produce = (c, r) => r >= ROWS - 3;
    let x = block(PERIM, ROWS, produce);
    const pY0 = rowY(ROWS - 3);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) add(PERIM + 20 + i * 120, pY0 + 10 + j * 110, 56, 44, 'bin', { hue: (i * 3 + j) % 4 });
    x = alley(x, bottom, 0);
    const b2 = x; x = block(x, ROWS);
    x = alley(x, bottom, 1);
    const b3 = x; x = block(x, ROWS);
    const width = x + PERIM;
    signs.push({ x: width * 0.25, y: 60, text: 'DAIRY', big: true }, { x: width * 0.75, y: 60, text: 'MEAT & DELI', big: true });
    signs.push({ x: PERIM + BLOCK_W / 2, y: pY0 - 40, text: 'PRODUCE', big: true });
    signs.push({ x: b2 + BLOCK_W / 2, y: top - 40, text: 'GROCERY', big: true }, { x: b3 + BLOCK_W / 2, y: top - 40, text: 'HOME', big: true });
    return { width, shelvesBottom: bottom, wallDeco: 'coolers' };
  },

  // Electronics: gaming aisles, a demo-kiosk alley, an open showroom of laptop
  // and phone tables, another alley, then locked glass cases. TVs cover the back wall.
  electronics({ add, block, alley, rowY, top, signs, BLOCK_W }) {
    const ROWS = 7, bottom = rowY(ROWS - 1) + SHELF_T;
    let x = block(PERIM, ROWS);
    x = alley(x, bottom, 1);
    const show = x, SHOW_W = 640;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 6; j++) add(show + 60 + i * 220, top + 10 + j * 150, 80, 44, 'table', { hue: (i + j) % 3 });
    x = alley(show + SHOW_W, bottom, 2);
    const cases = x; x = block(x, ROWS, undefined, 'case');
    const width = x + PERIM;
    signs.push({ x: width / 2, y: 60, text: 'TV & HOME THEATER', big: true });
    signs.push({ x: PERIM + BLOCK_W / 2, y: top - 40, text: 'GAMING', big: true }, { x: show + SHOW_W / 2, y: top - 40, text: 'COMPUTERS', big: true });
    signs.push({ x: cases + BLOCK_W / 2, y: top - 40, text: 'PHONES', big: true });
    return { width, shelvesBottom: bottom, wallDeco: 'tvs' };
  },

  // Toys: three blocks with two action alleys and a bike-and-ball corner carved
  // out of the middle block. Plush and building sets fill the back wall.
  toys({ add, block, alley, rowY, top, signs, BLOCK_W }) {
    const ROWS = 9, bottom = rowY(ROWS - 1) + SHELF_T;
    let x = block(PERIM, ROWS);
    x = alley(x, bottom, 0);
    const mid = x, bikes = (c, r) => r >= 3 && r <= 5;
    x = block(x, ROWS, bikes);
    // Bike racks and a ball cage where the middle rows would be.
    const y0 = rowY(3) + 20;
    for (let k = 0; k < 3; k++) add(mid + 20, y0 + k * 110, 220, 22, 'bikes');
    add(mid + BLOCK_W - 110, y0 + 60, 84, 84, 'cage');
    x = alley(x, bottom, 2);
    const right = x; x = block(x, ROWS);
    const width = x + PERIM;
    signs.push({ x: width * 0.25, y: 60, text: 'PLUSH', big: true }, { x: width * 0.75, y: 60, text: 'BUILDING SETS', big: true });
    signs.push({ x: PERIM + BLOCK_W / 2, y: top - 40, text: 'ACTION FIGURES', big: true }, { x: mid + BLOCK_W / 2, y: top - 40, text: 'DOLLS', big: true });
    signs.push({ x: mid + BLOCK_W / 2, y: y0 - 16, text: 'BIKES', big: true }, { x: right + BLOCK_W / 2, y: top - 40, text: 'GAMES & PUZZLES', big: true });
    return { width, shelvesBottom: bottom, wallDeco: 'toys' };
  },
};
// Electronics puts a Tech Help counter at the front, left of the registers.
PLANS.electronics.registersFrom = () => 820;
PLANS.electronics.front = ({ add, signs }, frontY) => {
  add(300, frontY + 12, 400, 28, 'counter');
  signs.push({ x: 500, y: frontY - 20, text: 'TECH HELP' });
};

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
