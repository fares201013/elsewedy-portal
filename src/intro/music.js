// Upbeat electro-pop loop + cute robot "babble" voice, all synthesised live.
// Sounds only play while the AudioContext is running (browsers need one tap first).

let ctx = null;
let master = null;

export function audio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    return ctx;
  } catch {
    return null;
  }
}

export const running = () => !!ctx && ctx.state === 'running';

export function tryResume() {
  const c = audio();
  if (!c) return Promise.resolve(false);
  if (c.state === 'running') return Promise.resolve(true);
  return c.resume().then(() => c.state === 'running').catch(() => false);
}

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

function noiseSrc(sec) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * sec));
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i += 1) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource();
  s.buffer = b;
  return s;
}

/* ───────── music ───────── */
const BPM = 124;
const STEP = 60 / BPM / 4;
// Am – F – C – G, the happiest sad progression on earth
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const ARP = [0, 1, 2, 1, 0, 2, 1, 2, 0, 1, 2, 1, 2, 1, 0, 2];

let musicBus = null;
let timer = 0;
let step = 0;
let nextTime = 0;

function kick(t) {
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
  g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  o.connect(g).connect(musicBus); o.start(t); o.stop(t + 0.32);
}
function clap(t) {
  const n = noiseSrc(0.18); const f = ctx.createBiquadFilter(); const g = ctx.createGain();
  f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = 0.9;
  g.gain.setValueAtTime(0.45, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  n.connect(f).connect(g).connect(musicBus); n.start(t); n.stop(t + 0.18);
}
function hat(t, v) {
  const n = noiseSrc(0.05); const f = ctx.createBiquadFilter(); const g = ctx.createGain();
  f.type = 'highpass'; f.frequency.value = 7000;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
  n.connect(f).connect(g).connect(musicBus); n.start(t); n.stop(t + 0.05);
}
function bass(t, note) {
  const o = ctx.createOscillator(); const f = ctx.createBiquadFilter(); const g = ctx.createGain();
  o.type = 'sawtooth'; o.frequency.value = midi(note - 12);
  f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(200, t + 0.2);
  g.gain.setValueAtTime(0.32, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  o.connect(f).connect(g).connect(musicBus); o.start(t); o.stop(t + 0.24);
}
function pluck(t, note) {
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = 'triangle'; o.frequency.value = midi(note + 12);
  g.gain.setValueAtTime(0.13, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  o.connect(g).connect(musicBus); o.start(t); o.stop(t + 0.18);
}

function schedule() {
  if (!running()) { nextTime = ctx ? ctx.currentTime + 0.05 : 0; return; }
  while (nextTime < ctx.currentTime + 0.12) {
    const s = step % 16;
    const chord = CHORDS[Math.floor(step / 16) % 4];
    if (s % 4 === 0) kick(nextTime);
    if (s === 4 || s === 12) clap(nextTime);
    hat(nextTime, s % 2 === 0 ? 0.05 : 0.12);
    if (s % 4 === 2) bass(nextTime, chord[0]);
    pluck(nextTime, chord[ARP[s]]);
    nextTime += STEP;
    step += 1;
  }
}

export function startMusic() {
  if (!audio() || musicBus) return;
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.0001;
  musicBus.connect(master);
  musicBus.gain.setTargetAtTime(0.42, ctx.currentTime, 0.4);
  step = 0; nextTime = ctx.currentTime + 0.05;
  timer = window.setInterval(schedule, 25);
}

export function duck(on) {
  if (!musicBus) return;
  musicBus.gain.setTargetAtTime(on ? 0.22 : 0.42, ctx.currentTime, 0.12);
}

export function stopMusic(fade = 0.8) {
  if (!musicBus) return;
  const bus = musicBus;
  bus.gain.setTargetAtTime(0.0001, ctx.currentTime, fade / 4);
  window.setTimeout(() => { window.clearInterval(timer); try { bus.disconnect(); } catch { /* gone */ } }, fade * 1000 + 200);
  musicBus = null;
}

/* ───────── sound effects ───────── */
export function whoosh(fromRight) {
  if (!running()) return;
  const t = ctx.currentTime;
  const n = noiseSrc(0.6); const f = ctx.createBiquadFilter(); const g = ctx.createGain();
  f.type = 'bandpass'; f.Q.value = 1.3;
  f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.45);
  g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.3); g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
  let last = g;
  n.connect(f).connect(g);
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.setValueAtTime(fromRight ? 0.9 : -0.9, t); p.pan.linearRampToValueAtTime(0, t + 0.45);
    g.connect(p); last = p;
  }
  last.connect(master); n.start(t); n.stop(t + 0.6);
}

export function thud(power = 1) {
  if (!running()) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.frequency.setValueAtTime(150 * power, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.3);
  g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.5);
  const c = noiseSrc(0.08); const hp = ctx.createBiquadFilter(); const cg = ctx.createGain();
  hp.type = 'highpass'; hp.frequency.value = 2500;
  cg.gain.setValueAtTime(0.3, t); cg.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  c.connect(hp).connect(cg).connect(master); c.start(t); c.stop(t + 0.08);
}

export function boom() {
  if (!running()) return;
  thud(1.25);
  const t = ctx.currentTime;
  const n = noiseSrc(0.9); const f = ctx.createBiquadFilter(); const g = ctx.createGain();
  f.type = 'lowpass'; f.frequency.setValueAtTime(4000, t); f.frequency.exponentialRampToValueAtTime(200, t + 0.8);
  g.gain.setValueAtTime(0.45, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
  n.connect(f).connect(g).connect(master); n.start(t); n.stop(t + 0.9);
}

export function zip() {
  if (!running()) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = 'sine';
  const up = Math.random() > 0.5;
  o.frequency.setValueAtTime(up ? 500 : 1300, t);
  o.frequency.exponentialRampToValueAtTime(up ? 1400 : 450, t + 0.16);
  g.gain.setValueAtTime(0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.2);
}

export function boing() {
  if (!running()) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(660, t + 0.09);
  o.frequency.exponentialRampToValueAtTime(330, t + 0.22);
  g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.28);
}

/* ───────── Volt's voice: cute robot babble, one blip per letter ───────── */
function blipFor(ch, base, accent) {
  if (!running()) return;
  const t = ctx.currentTime;
  const lower = ch.toLowerCase();
  const vowel = 'aeiouy'.includes(lower);
  const code = lower.charCodeAt(0) || 97;
  const semis = [0, 2, 4, 7, 9, 12, 7][code % 7] + (vowel ? 3 : 0) + accent;
  const f = base * Math.pow(2, semis / 12);
  const dur = vowel ? 0.075 : 0.05;
  const o = ctx.createOscillator(); const o2 = ctx.createOscillator();
  const lp = ctx.createBiquadFilter(); const g = ctx.createGain();
  o.type = 'square'; o2.type = 'triangle';
  o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * (vowel ? 1.12 : 0.94), t + dur);
  o2.frequency.setValueAtTime(f * 2, t);
  lp.type = 'lowpass'; lp.frequency.value = 2300; lp.Q.value = 4;
  g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.11, t + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(lp); o2.connect(lp); lp.connect(g).connect(master);
  o.start(t); o2.start(t); o.stop(t + dur + 0.02); o2.stop(t + dur + 0.02);
}

// Reads text letter by letter. Calls onWord(n) as word n starts. Returns a cancel fn.
export function babble(text, { onWord, onDone, base = 540, speed = 40 } = {}) {
  let i = 0; let word = 0; let id = 0; let dead = false;
  const chars = Array.from(text);
  onWord?.(1);
  const tick = () => {
    if (dead) return;
    if (i >= chars.length) { onDone?.(); return; }
    const ch = chars[i];
    const prev = chars[i - 1];
    i += 1;
    let wait = speed;
    if (ch === ' ') { word += 1; onWord?.(word + 1); wait = speed * 1.3; } else if (/[.!?]/.test(ch)) wait = speed * 6;
    else if (/[,;:]/.test(ch)) wait = speed * 4;
    else if (/[a-z0-9']/i.test(ch)) {
      // questions and exclamations go up at the end
      const rest = chars.slice(i).join('');
      const accent = /^[a-z']*[!?]/i.test(rest) ? 4 : 0;
      if (!(prev && prev.toLowerCase() === ch.toLowerCase() && i % 2)) blipFor(ch, base, accent);
    } else wait = 0; // emoji etc.
    id = window.setTimeout(tick, wait);
  };
  id = window.setTimeout(tick, 60);
  return () => { dead = true; window.clearTimeout(id); };
}
