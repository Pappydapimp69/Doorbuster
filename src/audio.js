// Synthesized sound: no audio files to license or ship.

let ctx = null, master = null, sfxBus = null, musicBus = null;
let lastPlay = {};
let musicTimer = null, nextTime = 0;
export const audio = { sfx: 0.6, music: 0.4, intensity: 0 };

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
  sfxBus = ctx.createGain(); sfxBus.connect(master);
  musicBus = ctx.createGain(); musicBus.connect(master);
  setVolumes();
}

export function setVolumes() {
  if (!ctx) return;
  sfxBus.gain.value = audio.sfx;
  musicBus.gain.value = audio.music * 0.5;
}

function tone(freq, dur, type = 'square', vol = 0.2, slide = 0, bus = sfxBus, when = 0) {
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur, vol = 0.2, hp = 800, bus = sfxBus, when = 0) {
  const t = ctx.currentTime + when;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource(); s.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(bus);
  s.start(t);
}

// Throttle per sound so 200 hits in one frame don't clip.
function ok(name, gap) {
  const now = ctx.currentTime;
  if (lastPlay[name] && now - lastPlay[name] < gap) return false;
  lastPlay[name] = now; return true;
}

export function sfx(name, arg = 0) {
  if (!ctx || audio.sfx <= 0) return;
  switch (name) {
    case 'hit': if (ok(name, 0.035)) tone(180 + Math.random() * 60, 0.05, 'square', 0.08, -80); break;
    case 'kill': if (ok(name, 0.03)) tone(320 + Math.random() * 120, 0.06, 'triangle', 0.1, 200); break;
    case 'shoot': if (ok(name, 0.06)) tone(900, 0.03, 'square', 0.04, -300); break;
    case 'pickup': if (ok(name, 0.025)) tone(660 + Math.min(arg, 30) * 25, 0.06, 'sine', 0.12); break;
    case 'coin': if (ok(name, 0.05)) { tone(988, 0.06, 'square', 0.08); tone(1319, 0.12, 'square', 0.08, 0, sfxBus, 0.06); } break;
    case 'hurt': if (ok(name, 0.15)) { noise(0.15, 0.3, 300); tone(140, 0.18, 'sawtooth', 0.15, -60); } break;
    case 'level': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'square', 0.1, 0, sfxBus, i * 0.07)); break;
    case 'pick': tone(784, 0.08, 'square', 0.1); tone(1175, 0.12, 'square', 0.1, 0, sfxBus, 0.07); break;
    case 'pa': if (ok(name, 0.2)) { tone(392, 0.25, 'triangle', 0.12); tone(523, 0.3, 'triangle', 0.12, 0, sfxBus, 0.12); } break;
    case 'laser': if (ok(name, 0.1)) tone(1500, 0.18, 'sawtooth', 0.06, -1200); break;
    case 'slash': if (ok(name, 0.08)) noise(0.08, 0.15, 2500); break;
    case 'boss': tone(98, 1.2, 'sawtooth', 0.2, -30); tone(147, 1.2, 'sawtooth', 0.15, -40); break;
    case 'evolve': [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, 'triangle', 0.12, 0, sfxBus, i * 0.06)); break;
    case 'lose': [392, 349, 311, 262].forEach((f, i) => tone(f, 0.35, 'triangle', 0.14, 0, sfxBus, i * 0.25)); break;
    case 'win': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.2, 'square', 0.1, 0, sfxBus, i * 0.12)); break;
    case 'ui': tone(1200, 0.03, 'square', 0.05); break;
  }
}

// ---------- music ----------
// Songs are data: chords per bar, a bass pattern, a lead melody on a 16-step
// grid, and drum patterns. Layers fade in and out with crowd intensity
// (vertical), and song changes wait for the next bar line (horizontal).

const N = (name) => {
  const m = /^([A-G])(#|b)?(\d)$/.exec(name);
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return base + (+m[3] + 1) * 12;
};
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
// [step, note, length in steps]
const mel = (str) => str.trim().split(/\s+/).map((t) => { const [st, n, l] = t.split(':'); return [+st, n === '-' ? null : N(n), +l]; });

const SONGS = {
  menu: {
    bpm: 92, swing: 0.12,
    chords: [['F3', 'A3', 'C4', 'E4'], ['E3', 'G3', 'B3', 'D4'], ['D3', 'F3', 'A3', 'C4'], ['G3', 'B3', 'D4', 'F4']],
    bass: ['F2', 'E2', 'D2', 'G2'], bassSteps: [0, 6, 10],
    lead: [mel('0:A4:4 6:C5:2 8:E5:6'), mel('0:D5:4 6:B4:2 8:G4:6'), mel('0:F4:3 4:A4:3 8:C5:4 12:A4:4'), mel('0:B4:4 6:D5:2 8:F5:8')],
    drums: { kick: [0, 10], snare: [], hat: [4, 12], hatOpen: [] },
    leadWave: 'sine', padWave: 'sine', lead2: false,
  },
  shift: {
    bpm: 124, swing: 0.06,
    chords: [['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['C4', 'E4', 'G4'], ['E3', 'G3', 'B3'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4']],
    bass: ['C2', 'A1', 'F1', 'G1', 'C2', 'E2', 'F1', 'G1'], bassSteps: [0, 3, 6, 8, 10, 14], bassOct: [6, 14],
    lead: [
      mel('0:E5:2 2:G5:2 4:A5:3 8:G5:2 10:E5:2 12:D5:4'), mel('0:C5:2 2:E5:2 4:A4:4 10:C5:2 12:D5:4'),
      mel('0:F5:2 2:A5:2 4:C6:3 8:A5:2 10:F5:2 12:E5:4'), mel('0:D5:2 2:E5:2 4:G5:4 8:B4:2 10:D5:2 12:G5:4'),
      mel('0:E5:2 2:G5:2 4:A5:3 8:G5:2 10:E5:2 12:D5:4'), mel('0:B4:2 2:E5:2 4:G5:4 10:B5:2 12:A5:4'),
      mel('0:F5:2 2:A5:2 4:C6:3 8:A5:2 10:F5:2 12:E5:4'), mel('0:G5:2 2:F5:2 4:E5:2 6:D5:2 8:B4:4'),
    ],
    drums: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14], hat16: [1, 3, 5, 7, 9, 11, 13, 15], hatOpen: [14] },
    leadWave: 'square', padWave: 'triangle', lead2: true,
  },
  boss: {
    bpm: 144, swing: 0,
    chords: [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['E3', 'G#3', 'B3']],
    bass: ['A1', 'F1', 'G1', 'E1'], bassSteps: [0, 2, 4, 6, 8, 10, 12, 14], bassOct: [4, 12],
    lead: [mel('0:A4:2 2:A4:1 3:C5:2 6:E5:2 8:D5:4 12:C5:4'), mel('0:F5:2 2:E5:2 4:C5:4 8:A4:2 10:C5:2 12:F5:4'),
      mel('0:G5:2 2:F5:2 4:D5:4 8:B4:2 10:D5:2 12:G5:4'), mel('0:E5:3 4:G#5:4 8:B5:4 12:E6:4')],
    drums: { kick: [0, 3, 6, 8, 11, 14], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], hat16: [1, 3, 5, 7, 9, 11, 13, 15], hatOpen: [], tom: [13, 15] },
    leadWave: 'sawtooth', padWave: 'sawtooth', lead2: true,
  },
};
SONGS.overtime = { ...SONGS.shift, bpm: 136, transpose: 2, drums: { ...SONGS.shift.drums, kick: [0, 3, 4, 8, 11, 12] } };

let reverb = null, layers = null, song = null, pending = null, bar = 0;
const LAYERS = ['pad', 'bass', 'kick', 'snare', 'hat', 'lead', 'lead2'];
let level = {}; // target gain per layer

function buildMusicGraph() {
  if (layers) return;
  // Short plate-ish reverb from decaying noise, shared by pad and lead.
  reverb = ctx.createConvolver();
  const len = ctx.sampleRate * 1.6, buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  reverb.buffer = buf;
  const wet = ctx.createGain(); wet.gain.value = 0.25; reverb.connect(wet); wet.connect(musicBus);
  layers = {};
  for (const l of LAYERS) { const g = ctx.createGain(); g.gain.value = 0; g.connect(musicBus); layers[l] = g; }
  layers.pad.connect(reverb); layers.lead.connect(reverb);
}

function voice(freq, dur, type, vol, dest, when, attack = 0.005) {
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + 0.05);
}

function drum(kind, when, vol = 1) {
  const t = ctx.currentTime + when;
  if (kind === 'kick') {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(0.9 * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g); g.connect(layers.kick); o.start(t); o.stop(t + 0.3);
  } else if (kind === 'tom') {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.2);
    g.gain.setValueAtTime(0.5 * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g); g.connect(layers.snare); o.start(t); o.stop(t + 0.3);
  } else {
    const dur = kind === 'snare' ? 0.16 : kind === 'hatOpen' ? 0.22 : 0.04;
    const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = kind === 'snare' ? 'bandpass' : 'highpass'; f.frequency.value = kind === 'snare' ? 1800 : 7000;
    const g = ctx.createGain(); g.gain.setValueAtTime((kind === 'snare' ? 0.6 : 0.25) * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(kind === 'snare' ? layers.snare : layers.hat); src.start(t);
    if (kind === 'snare') voice(190, 0.1, 'triangle', 0.25 * vol, layers.snare, when);
  }
}

function scheduleBar(when) {
  const sng = song, spb = 60 / sng.bpm / 4, tr = sng.transpose || 0;
  const bi = bar % sng.chords.length;
  const at = (st) => when + st * spb + (st % 2 ? sng.swing * spb : 0);
  // Pad: the bar's chord, held.
  for (const n of sng.chords[bi]) voice(hz(N(n) + tr), spb * 16, sng.padWave, sng.padWave === 'sawtooth' ? 0.025 : 0.045, layers.pad, at(0), 0.08);
  // Bass.
  const root = N(sng.bass[bi]) + tr;
  for (const st of sng.bassSteps) voice(hz(root + ((sng.bassOct || []).includes(st) ? 12 : 0)), spb * 1.6, 'triangle', 0.35, layers.bass, at(st));
  // Lead melody (and an octave-down double on the busier songs).
  for (const [st, n, l] of sng.lead[bi % sng.lead.length]) {
    if (n == null) continue;
    voice(hz(n + tr), spb * l * 0.95, sng.leadWave, sng.leadWave === 'sine' ? 0.12 : 0.05, layers.lead, at(st));
    if (sng.lead2) voice(hz(n + tr - 12), spb * l * 0.95, 'triangle', 0.06, layers.lead2, at(st));
  }
  const dr = sng.drums;
  for (const st of dr.kick) drum('kick', at(st));
  for (const st of dr.snare) drum('snare', at(st));
  for (const st of dr.hat) drum('hat', at(st));
  for (const st of dr.hat16 || []) drum('hat', at(st), 0.5);
  for (const st of dr.hatOpen) drum('hatOpen', at(st));
  for (const st of dr.tom || []) drum('tom', at(st));
  // Fill on the last bar of each 8-bar phrase.
  if (bar % 8 === 7) for (const st of [12, 13, 14, 15]) drum('snare', at(st), 0.6);
  bar++;
}

// Which layers play at a given crowd intensity (0..1). The menu ignores it.
function mixFor(name, x) {
  if (name === 'menu') return { pad: 1, bass: 0.7, kick: 0.4, snare: 0, hat: 0.5, lead: 0.8, lead2: 0 };
  if (name === 'boss') return { pad: 0.7, bass: 1, kick: 1, snare: 1, hat: 0.8, lead: 1, lead2: 0.8 };
  return { pad: 1, bass: 1, kick: x > 0.08 ? 1 : 0.0, snare: x > 0.3 ? 1 : 0, hat: x > 0.15 ? 0.8 : 0.3, lead: x > 0.45 ? 1 : 0, lead2: x > 0.7 ? 1 : 0 };
}

let lastMix = '';
function applyMix() {
  const m = mixFor(song === SONGS.menu ? 'menu' : song === SONGS.boss ? 'boss' : 'shift', audio.intensity);
  const key = JSON.stringify(m);
  if (key === lastMix) return;
  lastMix = key;
  // Fades rather than cuts, so a layer joining mid-bar never clicks in.
  for (const l of LAYERS) layers[l].gain.setTargetAtTime(m[l], ctx.currentTime, 0.6);
}

export function startMusic(name = 'shift') {
  if (!ctx) return;
  buildMusicGraph();
  if (song && musicTimer) { if (SONGS[name] !== song) pending = SONGS[name]; return; } // switch on the next bar line
  song = SONGS[name]; bar = 0; lastMix = '';
  nextTime = ctx.currentTime + 0.08;
  musicTimer = setInterval(() => {
    while (nextTime < ctx.currentTime + 0.25) {
      if (pending) { song = pending; pending = null; bar = 0; lastMix = ''; }
      applyMix();
      scheduleBar(nextTime - ctx.currentTime);
      nextTime += (60 / song.bpm) * 4;
    }
  }, 60);
}

export function currentSong() { return Object.keys(SONGS).find((k) => SONGS[k] === song) || null; }

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null; song = null; pending = null;
  if (layers) for (const l of LAYERS) layers[l].gain.setTargetAtTime(0, ctx.currentTime, 0.05);
}
