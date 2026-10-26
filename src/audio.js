// Synthesized sound: no audio files to license or ship.

let ctx = null, master = null, sfxBus = null, musicBus = null;
let lastPlay = {};
let musicTimer = null, step = 0, nextTime = 0;
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

// Mall muzak: I-vi-IV-V, picks up a drum layer as the store fills.
const CHORDS = [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]];
const BASS = [130.8, 110, 87.3, 98];

export function startMusic(tempo = 112) {
  if (!ctx) return;
  stopMusic();
  step = 0; nextTime = ctx.currentTime + 0.05;
  const spb = 60 / tempo / 2; // eighth notes
  musicTimer = setInterval(() => {
    while (nextTime < ctx.currentTime + 0.2) {
      const bar = Math.floor(step / 8) % 4, s = step % 8;
      const when = nextTime - ctx.currentTime;
      if (s === 0) CHORDS[bar].forEach(f => tone(f, spb * 7, 'triangle', 0.035, 0, musicBus, when));
      if (s % 2 === 0) tone(BASS[bar] / (s === 4 ? 1 : 2) * 2, spb * 1.6, 'sine', 0.12, 0, musicBus, when);
      const arp = CHORDS[bar][(s * 2) % 3] * 2;
      if (s % 2 === 1) tone(arp, spb * 0.8, 'square', 0.015, 0, musicBus, when);
      if (audio.intensity > 0.3) {
        if (s % 4 === 0) tone(60, 0.12, 'sine', 0.25, -30, musicBus, when);
        noise(0.03, 0.04 * audio.intensity, 6000, musicBus, when);
      }
      if (audio.intensity > 0.7 && s % 4 === 2) noise(0.08, 0.08, 1500, musicBus, when);
      nextTime += spb; step++;
    }
  }, 50);
}

export function stopMusic() { if (musicTimer) clearInterval(musicTimer); musicTimer = null; }
