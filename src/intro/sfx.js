// Tiny synthesised sound effects for the intro (no audio files needed).
let ctx = null;

export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function noise(seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

function out(gainValue, pan = 0) {
  const g = ctx.createGain();
  g.gain.value = gainValue;
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    g.connect(p).connect(ctx.destination);
  } else g.connect(ctx.destination);
  return g;
}

// a cable flying in: filtered noise sweeping up, panned from its side to the centre
export function whoosh(delay = 0, fromRight = true) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const src = noise(0.6);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(300, t);
  bp.frequency.exponentialRampToValueAtTime(3200, t + 0.45);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.55, t + 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  const dest = out(0.9, 0);
  if (dest.connect && ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.setValueAtTime(fromRight ? 0.9 : -0.9, t);
    p.pan.linearRampToValueAtTime(0, t + 0.45);
    src.connect(bp).connect(g).connect(p).connect(ctx.destination);
  } else src.connect(bp).connect(g).connect(dest);
  src.start(t); src.stop(t + 0.6);
}

// the "taan": a punchy low hit with a little metallic click
export function thud(delay = 0, power = 1) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(150 * power, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.3);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.9 * Math.min(1.3, power), t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + 0.5);

  const c = noise(0.08);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 2500;
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.35, t);
  cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  c.connect(hp).connect(cg).connect(ctx.destination);
  c.start(t); c.stop(t + 0.08);
}

// the burst when Volt pops out: boom + rising sparkle
export function boom(delay = 0) {
  if (!ctx) return;
  thud(delay, 1.25);
  const t = ctx.currentTime + delay;
  const n = noise(0.9);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(4000, t);
  lp.frequency.exponentialRampToValueAtTime(200, t + 0.8);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
  n.connect(lp).connect(g).connect(ctx.destination);
  n.start(t); n.stop(t + 0.9);
  [880, 1320, 1760].forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t + 0.15 + i * 0.07);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.setValueAtTime(0.12, t + 0.15 + i * 0.07);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.45 + i * 0.07);
    o.connect(og).connect(ctx.destination);
    o.start(t); o.stop(t + 0.7);
  });
}

// little blip when Volt changes topic
export function blip() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(660, t);
  o.frequency.exponentialRampToValueAtTime(990, t + 0.08);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + 0.16);
}
