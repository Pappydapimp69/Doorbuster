// Pixel-art sprites as character maps, rendered once to offscreen canvases.

const BASE = {
  k: '#1b1a24', s: '#f1c39b', S: '#c98f6a', h: '#5a3a24', w: '#f3f1ea',
  b: '#2d3b66', y: '#f5d142', g: '#8a8f99', G: '#555a66', o: '#f08a24',
  p: '#e86a9a', R: '#b8312d', B: '#68b6ea', c: '#888888', e: '#2a2a2a',
};

const MAPS = {
  worker: [
    '....hhhh....',
    '...hhhhhh...',
    '...hsssss...',
    '...sksskS...',
    '...ssssss...',
    '....ssss....',
    '..wvvwwvvw..',
    '.svvvwwvvvs.',
    '.svvyvvvvvs.',
    '..vvvvvvvv..',
    '...bbbbbb...',
    '...bb..bb...',
    '...bb..bb...',
    '...kk..kk...',
  ],
  shopper: [
    '....hhhh....',
    '...hhhhhh...',
    '...ssssss...',
    '...skssks...',
    '...ssssss...',
    '....sSSs....',
    '..cccccccc..',
    '.sccccccccs.',
    '.sccccccccs.',
    '..cccccccc..',
    '...bbbbbb...',
    '...bb..bb...',
    '...bb..bb...',
    '...kk..kk...',
  ],
  walker: [
    '............',
    '...RRRRRR...',
    '...ssssss...',
    '...skssks...',
    '...ssssss...',
    '....ssss....',
    '..cccccccc..',
    's.cccccccc.s',
    '.scccccccs..',
    '..cccccccc..',
    '...gggggg...',
    '..gg....gg..',
    '.gg......gg.',
    '.ww......ww.',
  ],
  cartPusher: [
    '..hhhh..........',
    '.hhhhhh.........',
    '.ssssss.........',
    '.skssks.........',
    '.ssssss.........',
    '..ssss..........',
    'cccccccsssssk...',
    'cccccccc...gk...',
    'cccccccc.ggggggg',
    '.cccccc..gGgGgGg',
    '.bbbbbb..gGgGgGg',
    '.bb..bb..ggggggg',
    '.bb..bb...k...k.',
    '.kk..kk.........',
  ],
  clipper: [
    '....hhhh....',
    '...hhhhhh...',
    '...ssssss...',
    '...swsswS...',
    '...ssssss...',
    '....ssss....',
    '..cccccccc..',
    '.sccccccccww',
    '.scccccccsww',
    '..cccccccc..',
    '...bbbbbb...',
    '...bb..bb...',
    '...bb..bb...',
    '...kk..kk...',
  ],
  requester: [
    '..yyyyyyy...',
    '.yyyyyyyyyy.',
    '.yykkkkyyyy.',
    '.yysssssyyy.',
    '.yskssksyy..',
    '..ssssssy...',
    '...sRRs.....',
    '..pppppppp..',
    '.sppppppppS.',
    '.sppppppppS.',
    '..pppppppp..',
    '...pppppp...',
    '...ss..ss...',
    '...kk..kk...',
  ],
  boss: [
    '.....GGGGGG.....',
    '....GGGGGGGG....',
    '....ssssssss....',
    '....skkssk ks...',
    '....ssssssss....',
    '....sssRRsss....',
    '.....ssssss.....',
    '..eeeeewweeeee..',
    '.eeeeeewRweeeee.',
    '.eeeeeewRweeeee.',
    'seeeeeeeRweeeees',
    'seeeeeewRweeeees',
    '.eeeeeeewweeeee.',
    '..eeeeeeeeeeee..',
    '...eeeeeeeeee...',
    '...eee....eee...',
    '...eee....eee...',
    '..kkkk....kkkk..',
  ],
  scalper: [
    '....kkkk....',
    '...kkkkkk...',
    '..kkssssk...',
    '...seesee...',
    '...ssssss...',
    '....ssss....',
    '..cccccccc..',
    '.scccBBccs..',
    '.sccBBBBcs..',
    '..cccccccc..',
    '...bbbbbb...',
    '..bb....bb..',
    '.bb......bb.',
    '.kk......kk.',
  ],
  camper: [
    '......oo........',
    '.....oooo.......',
    '....oooooo......',
    '...oooooooo.....',
    '..oooohhoooo....',
    '.ooooskssoooo...',
    'oooooossssoooo..',
    'oooocccccccoooo.',
    'oooocccccccoooo.',
    'oooocccccccoooo.',
    'ggggggggggggggg.',
  ],
  kid: [
    '..hhhh..',
    '.hssssh.',
    '.skssks.',
    '.ssssss.',
    '..cccc..',
    '.sccccs.',
    '..cccc..',
    '..b..b..',
    '..b..b..',
    '..w..w..',
  ],
  hoarder: [
    '..oooooooo..',
    '..oyyoopoo..',
    '..oooooooo..',
    '.Bpppp.BBBB.',
    '.BBBB..pppp.',
    '...hhhh.....',
    '...skssk....',
    '...ssssss...',
    '..cccccccc..',
    '.sccccccccs.',
    '..cccccccc..',
    '...bbbbbb...',
    '...bb..bb...',
    '...kk..kk...',
  ],
  cart: [
    'k.........',
    'kgggggggg.',
    '.gGgGgGgg.',
    '.gGgGgGgg.',
    '.gggggggg.',
    '..k....k..',
  ],
  // Paper slips with a torn bottom edge and an outline so they read on any floor.
  receipt1: ['kkkkk', 'kwwwk', 'kwkwk', 'kwwwk', 'kwkwk', 'kwwwk', 'kw.wk'],
  receipt2: ['kkkkk', 'kyyyk', 'kykyk', 'kyyyk', 'kykyk', 'kyyyk', 'ky.yk'],
  receipt3: ['kkkkk', 'kpppk', 'kpkpk', 'kpppk', 'kpkpk', 'kpppk', 'kp.pk'],
  coin: ['.yy.', 'yooy', 'yooy', '.yy.'],
  heart: ['R.R.', 'RRRR', 'RRRR', '.RR.'],
  box: ['oooooo', 'okkkko', 'oooooo', 'oyyyyo', 'oooooo'],
  chicken: ['..oo..', '.oyyo.', 'oyyyyo', 'oyyyyo', '.oooo.', 'w....w'],
};

// Second walk frame: the legs (bottom rows) step apart, left half out to the
// left and right half out to the right.
function stride(map, rows = 3) {
  const w = map[0].length, mid = w / 2;
  return map.map((row, j) => {
    if (j < map.length - rows + 1) return row;
    const out = Array(w).fill('.');
    for (let i = 0; i < w; i++) {
      if (row[i] === '.') continue;
      const ni = i < mid ? i - 1 : i + 1;
      if (ni >= 0 && ni < w) out[ni] = row[i];
    }
    return out.join('');
  });
}

const SHIRTS = ['#4a90d9', '#9b59b6', '#e67e22', '#27ae60', '#c0392b', '#16a085', '#7f8c8d', '#d35400'];
const HAIRS = ['#5a3a24', '#1b1a24', '#c9a35a', '#8b4a2b', '#999999'];

function render(map, pal, scale = 1) {
  const w = map[0].length, h = map.length;
  const c = document.createElement('canvas');
  c.width = w * scale; c.height = h * scale;
  const x = c.getContext('2d');
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const ch = map[j][i];
    if (ch === '.' || ch === ' ') continue;
    x.fillStyle = pal[ch] || BASE[ch] || '#ff00ff';
    x.fillRect(i * scale, j * scale, scale, scale);
  }
  return c;
}

// White silhouette used for the hit flash.
function flash(src) {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

export const SPR = {};

export function buildSprites(characters) {
  for (const [id, ch] of Object.entries(characters)) {
    SPR['worker_' + id] = render(MAPS.worker, { v: ch.vest });
    SPR['worker_' + id + '_b'] = render(stride(MAPS.worker), { v: ch.vest });
  }
  for (const kind of ['shopper', 'walker', 'clipper', 'cartPusher', 'scalper', 'camper', 'kid', 'hoarder']) {
    SPR[kind] = [];
    SPR[kind + '_b'] = [];
    for (let i = 0; i < SHIRTS.length; i++) {
      SPR[kind].push(render(MAPS[kind], { c: SHIRTS[i], h: HAIRS[i % HAIRS.length] }));
      SPR[kind + '_b'].push(render(kind === 'camper' ? MAPS[kind] : stride(MAPS[kind]), { c: SHIRTS[i], h: HAIRS[i % HAIRS.length] }));
    }
  }
  SPR.requester = [render(MAPS.requester, {})];
  SPR.requester_b = [render(stride(MAPS.requester), {})];
  const BOSS_PALS = [{}, { e: '#3b1f4a', G: '#dddddd' }, { e: '#5a4a1a', G: '#f3f1ea', R: '#2a7a3a' }];
  SPR.boss = BOSS_PALS.map((pal) => render(MAPS.boss, pal, 2));
  SPR.boss_b = BOSS_PALS.map((pal) => render(stride(MAPS.boss), pal, 2));
  for (const k of ['cart', 'chicken', 'receipt1', 'receipt2', 'receipt3', 'coin', 'heart', 'box']) SPR[k] = render(MAPS[k], {});
  for (const k of Object.keys(SPR)) {
    if (Array.isArray(SPR[k])) SPR[k + '_flash'] = SPR[k].map(flash);
    else SPR[k + '_flash'] = flash(SPR[k]);
  }
}

export const SHIRT_COUNT = SHIRTS.length;
