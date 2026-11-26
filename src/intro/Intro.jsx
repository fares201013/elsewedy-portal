import React, { useCallback, useEffect, useRef, useState } from 'react';
import './intro.css';
import { audio, tryResume, whoosh, thud, boom } from './music.js';

/*
  Cinematic welcome — starts on its own, no button.
  Cables whoosh in, three power hits, boom: Volt pops out, the music drops,
  and he zips all over the screen. Every time he has something to say he
  lands somewhere, chats in his cute robot voice with a speech bubble,
  then zooms off again. When he is done he dissolves and the site appears.
  (Browsers keep sound muted until the first tap/key, so a tiny chip asks for it.)
*/

const POP_MS = 2950;
const LIVE_MS = 3600;
const TEAM = 'Team Nexora';

const LINES = [
  { text: "Hey hey! I'm Volt! ⚡", spot: 'mid' },
  { text: `Welcome to the Procurement and Supplier Portal, made by ${TEAM}, for Elsewedy Electric!`, spot: 'right' },
  { text: 'Work at Elsewedy? Make a request, get it approved, and compare offers. Super easy!', spot: 'left', card: 0 },
  { text: 'Are you a supplier? Find open requests, send your best price, and track your order, all the way to the door!', spot: 'right', card: 1 },
  { text: "Less paperwork, more power. Let's go! 🚀", spot: 'mid', jump: true },
];

const CABLES = [
  'M1720 150 C1380 110 1140 430 800 450',
  'M-120 770 C240 820 470 470 800 450',
  'M1720 760 C1380 800 1100 500 800 450',
  'M-120 120 C300 90 520 420 800 450',
];

// every stroke of the robot, drawn in this order
const STROKES = [
  // hover ring
  { d: 'M70 344 a90 18 0 1 0 180 0 a90 18 0 1 0 -180 0', w: 2 },
  // antenna
  { d: 'M160 62 V30', w: 3 },
  { d: 'M160 14 a9 9 0 1 1 0 18 a9 9 0 1 1 0 -18', w: 3, cls: 'iv-bulb' },
  // TV head
  { d: 'M96 62 H224 a26 26 0 0 1 26 26 V150 a26 26 0 0 1 -26 26 H96 a26 26 0 0 1 -26 -26 V88 a26 26 0 0 1 26 -26 Z', w: 3.5 },
  // screen
  { d: 'M106 78 H214 a14 14 0 0 1 14 14 V146 a14 14 0 0 1 -14 14 H106 a14 14 0 0 1 -14 -14 V92 a14 14 0 0 1 14 -14 Z', w: 2 },
  // ears
  { d: 'M70 104 H58 V134 H70', w: 3 },
  { d: 'M250 104 H262 V134 H250', w: 3 },
  // neck
  { d: 'M146 176 V192 M174 176 V192', w: 3 },
  // body
  { d: 'M108 192 H212 a22 22 0 0 1 22 22 V282 a22 22 0 0 1 -22 22 H108 a22 22 0 0 1 -22 -22 V214 a22 22 0 0 1 22 -22 Z', w: 3.5 },
  // chest panel + lightning bolt
  { d: 'M126 214 H194 a8 8 0 0 1 8 8 V270 a8 8 0 0 1 -8 8 H126 a8 8 0 0 1 -8 -8 V222 a8 8 0 0 1 8 -8 Z', w: 2 },
  { d: 'M166 222 L146 248 H160 L152 272 L176 242 H161 Z', w: 2.5, cls: 'iv-bolt' },
  // left arm (resting)
  { d: 'M86 222 C62 232 56 262 62 286', w: 3.5 },
  { d: 'M62 286 a8 8 0 1 0 0.1 0', w: 3 },
  // feet / thrusters
  { d: 'M124 304 V322 H148 V304 M172 304 V322 H196 V304', w: 3 },
];

const rand = (a, b) => a + Math.random() * (b - a);

// friendliest voice the device has (Edge's "Natural" voices sound the most human)
function pickVoice() {
  const vs = (window.speechSynthesis && window.speechSynthesis.getVoices()) || [];
  const prefs = [/Ava.*Natural/i, /Emma.*Natural/i, /Jenny.*Natural/i, /Aria.*Natural/i, /Natural.*English \(United States\)/i, /Google US English/i, /Samantha/i, /Microsoft Zira/i];
  for (const re of prefs) {
    const v = vs.find((x) => re.test(x.name));
    if (v) return v;
  }
  return vs.find((x) => /^en[-_]US/i.test(x.lang)) || vs.find((x) => /^en/i.test(x.lang)) || null;
}

// says text out loud while captions follow; captions only if the browser blocks speech
function speakOut(text, { onWord, onDone, clip }) {
  const words = text.split(' ');
  let n = 0; let wt = 0; let st = 0; let lt = 0; let dead = false; let finished = false; let started = false; let voiced = false;
  const reveal = (ms) => {
    window.clearInterval(wt);
    wt = window.setInterval(() => { n += 1; onWord(n); if (n >= words.length) window.clearInterval(wt); }, ms);
  };
  const done = () => {
    if (finished || dead) return;
    finished = true; window.clearInterval(wt); window.clearTimeout(lt); onWord(words.length); onDone();
  };
  const silent = () => { if (started || dead) return; started = true; reveal(300); st = window.setTimeout(() => { if (!voiced) done(); }, words.length * 300 + 900); };
  // a recorded voice line (public/assets/voice/volt-N.mp3) wins over the browser voice
  if (clip) {
    let tts = null;
    const a = new Audio(clip);
    a.preload = 'auto';
    a.onplaying = () => {
      if (started) return;
      started = true;
      const ms = a.duration && Number.isFinite(a.duration) ? (a.duration * 1000) / words.length : 320;
      reveal(Math.max(160, ms * 0.9));
    };
    a.onended = done;
    a.onerror = () => {
      if (started || dead || finished) return;
      finished = true; window.clearTimeout(lt); // hand over to the browser voice
      tts = speakOut(text, { onWord, onDone });
    };
    a.play().catch((err) => { if (err && err.name === 'NotAllowedError') silent(); });
    lt = window.setTimeout(done, 20000);
    return () => { dead = true; window.clearInterval(wt); window.clearTimeout(st); a.pause(); tts?.(); };
  }
  const synth = window.speechSynthesis;
  if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') { silent(); return () => { dead = true; }; }
  const u = new window.SpeechSynthesisUtterance(text.replace(/[^\p{L}\p{N}\s.,!?'’-]/gu, ''));
  const v = pickVoice();
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
  u.rate = 1.05; u.pitch = 1.15; u.volume = 1;
  u.onstart = () => { voiced = true; window.clearTimeout(st); if (!started) { started = true; reveal(310); } };
  u.onend = () => { if (voiced) done(); else silent(); };
  u.onerror = () => { if (voiced) done(); else silent(); };
  const safety = window.setTimeout(done, words.length * 480 + 3500);
  const kick = window.setTimeout(silent, 2000);
  try { synth.cancel(); synth.speak(u); } catch { silent(); }
  return () => { dead = true; window.clearInterval(wt); window.clearTimeout(st); window.clearTimeout(safety); window.clearTimeout(kick); try { synth.cancel(); } catch { /* ignore */ } };
}


export default function Intro({ onExit, onDone }) {
  const [phase, setPhase] = useState('cables'); // cables -> pop -> live -> exit
  const [line, setLine] = useState(-1);
  const [shown, setShown] = useState(0);
  const [talking, setTalking] = useState(false);
  const [landed, setLanded] = useState(false);
  const [needTap, setNeedTap] = useState(false);
  const [side, setSide] = useState('to-right');
  const [flying, setFlying] = useState(false);
  const [cable, setCable] = useState('none'); // none | on | off
  const [rocket, setRocket] = useState(false);
  const roboRef = useRef(null);
  const tiltRef = useRef(null);
  const rafRef = useRef(0);
  const flightOverride = useRef(false);
  const posRef = useRef({ x: window.innerWidth / 2, y: -400, rot: 0 });
  const doneRef = useRef(false);
  const timers = useRef([]);
  const stopVoice = useRef(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const theme = (() => {
    try { return localStorage.getItem('volt-theme') || 'light'; } catch { return 'light'; }
  })();

  const after = (fn, ms) => { const id = window.setTimeout(() => { if (!doneRef.current) fn(); }, ms); timers.current.push(id); return id; };

  const size = () => {
    const vw = window.innerWidth; const vh = window.innerHeight;
    return { vw, vh, mobile: vw < 700 };
  };

  // where Volt stands while talking (always in the upper band, clear of the text)
  const spotXY = (spot) => {
    const { vw, vh, mobile } = size();
    const y = mobile ? vh * 0.17 : vh * 0.26;
    if (mobile) return { x: spot === 'left' ? vw * 0.27 : spot === 'right' ? vw * 0.73 : vw * 0.5, y };
    return { x: spot === 'left' ? vw * 0.2 : spot === 'right' ? vw * 0.8 : vw * 0.5, y: spot === 'mid' ? vh * 0.22 : y };
  };

  // zip around the whole screen a few times, then land on a spot
  // ── choreography: one smooth, deliberate flight between lines ──
  const ease = {
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outBack: (t) => { const c1 = 1.25; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    in: (t) => t * t * t,
    sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  };
  const bez = (a, b, c, d) => (t) => {
    const u = 1 - t;
    return {
      x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
    };
  };
  const apply = (x, y, rot) => {
    posRef.current = { x, y, rot };
    if (roboRef.current) roboRef.current.style.transform = `translate(${x}px, ${y}px)`;
    if (tiltRef.current) tiltRef.current.style.transform = `rotate(${rot}deg)`;
  };
  const fly = ({ path, dur, easing = ease.inOut, bank = true, spin }, done) => {
    setLanded(false); setFlying(true);
    const t0 = performance.now();
    let prev = path(0); let rot = posRef.current.rot || 0;
    const frame = (now) => {
      if (doneRef.current && !flightOverride.current) return;
      const t = Math.min(1, (now - t0) / dur);
      const p = path(easing(t));
      const vx = p.x - prev.x;
      prev = p;
      const extra = spin ? spin(easing(t)) : 0;
      const target = bank && !extra ? Math.max(-24, Math.min(24, vx * 1.3)) : 0;
      rot += (target - rot) * 0.14;
      apply(p.x, p.y, rot + extra);
      if (t < 1) { rafRef.current = requestAnimationFrame(frame); return; }
      apply(p.x, p.y, 0);
      setFlying(false);
      done?.();
    };
    rafRef.current = requestAnimationFrame(frame);
  };
  const robotH = () => (roboRef.current ? roboRef.current.offsetHeight : 200);

  const moveTo = (i, cb) => {
    const { vw, vh } = size();
    const from = { x: posRef.current.x, y: posRef.current.y };
    const to = spotXY(LINES[i].spot);
    const land = () => { setSide(to.x > vw * 0.55 ? 'to-left' : 'to-right'); setLanded(true); cb(); };
    if (i === 0) {
      // drops in from the top, hanging from a copper cable, yo-yo bounce
      setCable('on');
      const start = { x: to.x, y: -robotH() };
      apply(start.x, start.y, 0);
      fly({ path: (t) => ({ x: start.x, y: start.y + (to.y - start.y) * t }), dur: 1500, easing: ease.outBack, bank: false }, land);
      return;
    }
    if (i === 1) {
      // unplug with a spark, then swoop down and up to the right
      setCable('off');
      after(() => fly({ path: bez(from, { x: from.x + vw * 0.04, y: from.y + vh * 0.42 }, { x: to.x - vw * 0.12, y: to.y + vh * 0.42 }, to), dur: 1800 }, land), 380);
      return;
    }
    if (i === 2) {
      // a big arc over the top of the screen to the employees card
      fly({ path: bez(from, { x: from.x - vw * 0.12, y: -vh * 0.06 }, { x: to.x + vw * 0.12, y: -vh * 0.06 }, to), dur: 2000 }, land);
      return;
    }
    if (i === 3) {
      // loop-the-loop on the way to the suppliers card
      const R = Math.min(vw * 0.13, vh * 0.2);
      const path = (e) => {
        let x = from.x + (to.x - from.x) * e;
        let y = from.y + (to.y - from.y) * e + Math.sin(Math.PI * e) * vh * 0.26;
        if (e > 0.25 && e < 0.75) {
          const th = ((e - 0.25) / 0.5) * Math.PI * 2;
          x += R * Math.sin(th) * 0.9; y -= R * (1 - Math.cos(th));
        }
        return { x, y };
      };
      const spin = (e) => (e > 0.25 && e < 0.75 ? -360 * ((e - 0.25) / 0.5) : 0);
      fly({ path, dur: 3100, easing: ease.sine, spin }, land);
      return;
    }
    // back to centre with a swoop underneath and a spin to finish
    fly({
      path: bez(from, { x: from.x, y: vh * 0.72 }, { x: to.x + vw * 0.22, y: vh * 0.66 }, to),
      dur: 2000,
      spin: (e) => (e > 0.72 ? 360 * ((e - 0.72) / 0.28) : 0),
    }, land);
  };

  // "Let's go!" — blasts off through the top of the screen
  const blastOff = (cb) => {
    const from = { x: posRef.current.x, y: posRef.current.y };
    setRocket(true);
    fly({ path: (t) => ({ x: from.x, y: from.y + (-robotH() * 1.6 - from.y) * t }), dur: 950, easing: ease.in, bank: false }, cb);
  };

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    stopVoice.current?.();
    if (!flightOverride.current) cancelAnimationFrame(rafRef.current);
    setTalking(false);
    setPhase('exit');
    onExit?.();
    window.setTimeout(() => onDone?.(), 1300);
  }, [onExit, onDone]);

  const say = useCallback((i) => {
    if (doneRef.current) return;
    if (i >= LINES.length) {
      blastOff(finish);
      return;
    }
    const L = LINES[i];
    const go = () => {
      setLine(i); setShown(0); setTalking(true);
      stopVoice.current = speakOut(L.text, {
        clip: `./assets/voice/volt-${i + 1}.mp3`,
        onWord: (n) => setShown(n),
        onDone: () => { setTalking(false); after(() => say(i + 1), 800); },
      });
    };
    moveTo(i, go);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finish]);

  // the whole show runs on its own
  useEffect(() => {
    document.documentElement.classList.add('iv-lock');
    audio();
    apply(window.innerWidth / 2, -400, 0);
    try { window.speechSynthesis && window.speechSynthesis.getVoices(); } catch { /* warm up */ }
    tryResume().then((ok) => { if (!ok && !doneRef.current) setNeedTap(true); });

    [0, 1, 2, 3].forEach((c) => after(() => whoosh(c % 2 === 0), 250 + c * 420));
    [2050, 2350, 2650].forEach((t, k) => after(() => thud(0.9 + k * 0.12), t));
    after(() => boom(), POP_MS);
    after(() => setPhase('pop'), POP_MS);
    after(() => setPhase('live'), LIVE_MS);
    after(() => say(0), POP_MS + 350);

    const unlock = () => {
      tryResume().then((ok) => {
        if (!ok) return;
        setNeedTap(false);
      });
    };
    const onKey = (e) => { if (e.key === 'Escape') finish(); else unlock(); };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', onKey);
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      cancelAnimationFrame(rafRef.current);
      stopVoice.current?.();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('iv-lock');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cur = line >= 0 ? LINES[line] : null;
  const words = cur ? cur.text.split(' ') : [];
  const progress = line < 0 ? 0 : (line + (shown >= words.length ? 1 : 0.5)) / LINES.length;
  const { vw, mobile } = size();
  const showBubble = !mobile && landed && cur && phase === 'live';

  const caption = (
    words.map((w, k) => <span key={`${line}-${k}`} className={k < shown ? 'on' : ''}>{w} </span>)
  );

  return (
    <div
      className={`iv iv-${phase} ${cur?.jump && landed ? 'iv-jump' : ''} ${theme === 'dark' ? 'iv-dark' : ''} ${talking ? 'iv-talking' : ''} ${landed ? 'iv-landed' : ''} ${flying ? 'iv-flying' : ''} ${rocket ? 'iv-rocket' : ''} iv-cable-${cable}`}
      role="dialog"
      aria-label="Welcome"
    >
      <div className="iv-grid" aria-hidden="true" />
      <div className="iv-glow" aria-hidden="true" />
      <div className="iv-sparks" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <i key={i} style={{ '--i': i, '--x': `${(i * 37) % 100}%`, '--d': `${(i % 6) * 0.45}s` }} />
        ))}
      </div>

      <svg className="iv-cables" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <filter id="ivCableGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {CABLES.map((d, i) => (
          <g key={i} className="iv-cable" style={{ '--c': i }} filter="url(#ivCableGlow)">
            <path d={d} pathLength="1" className="iv-cable-body" />
            <path d={d} pathLength="1" className="iv-cable-core" />
            <path d={d} pathLength="1" className="iv-cable-comet" />
          </g>
        ))}
      </svg>
      <div className="iv-core" aria-hidden="true" />
      <div className="iv-beats" aria-hidden="true"><i /><i /><i /></div>
      <div className="iv-flash" aria-hidden="true" />

      <div className="iv-stage">
        <div className="iv-copy">
          <p className="iv-kicker">{TEAM} presents</p>
          <h1 className="iv-title"><span className="iv-shine">Procurement &amp; Supplier Portal</span></h1>
          <p className="iv-sub2">for Elsewedy Electric</p>
          {mobile && <p className="iv-caption" aria-live="polite">{caption}</p>}
          <div className="iv-roles">
            <article className={`iv-role ${line >= 2 ? 'in' : ''} ${cur?.card === 0 ? 'active' : ''}`}>
              <span className="iv-role-tag">For employees</span>
              <p>Create purchase requests, get approvals and compare supplier offers in a few clicks.</p>
            </article>
            <article className={`iv-role ${line >= 3 ? 'in' : ''} ${cur?.card === 1 ? 'active' : ''}`}>
              <span className="iv-role-tag">For suppliers</span>
              <p>Find open requests, send quotations and track every order to delivery.</p>
            </article>
          </div>
        </div>
      </div>

      {/* Volt himself, free to run anywhere */}
      <div className="iv-robo" ref={roboRef}>
        <div className="iv-hang" aria-hidden="true"><i /></div>
        <div className="iv-robo-tilt" ref={tiltRef}>
          <div className="iv-flame" aria-hidden="true"><i /><i /></div>
          <div className="iv-bob">
            <div className="iv-popper">
          <svg className="iv-bot" viewBox="0 0 320 370" aria-hidden="true">
            <defs>
              <linearGradient id="ivShine" x1="0" y1="0" x2="320" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#8a3d14" />
                <stop offset="0.35" stopColor="#d9792e" />
                <stop offset="0.5" stopColor="#ffe3b3" />
                <stop offset="0.65" stopColor="#e8913f" />
                <stop offset="1" stopColor="#8a3d14" />
                <animateTransform attributeName="gradientTransform" type="translate" values="-320 0; 320 0" dur="2.4s" repeatCount="indefinite" />
              </linearGradient>
              <linearGradient id="ivFillHead" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f39a4a" />
                <stop offset="1" stopColor="#c85f1f" />
              </linearGradient>
              <linearGradient id="ivFillScreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2a1a12" />
                <stop offset="1" stopColor="#120b07" />
              </linearGradient>
              <filter id="ivBloom" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* solid fills that fade in after the sketch */}
            <g className="iv-fill">
              <ellipse cx="160" cy="344" rx="90" ry="18" fill="rgba(232,145,63,.18)" />
              <rect x="70" y="62" width="180" height="114" rx="26" fill="url(#ivFillHead)" />
              <rect x="92" y="78" width="136" height="82" rx="14" fill="url(#ivFillScreen)" />
              <rect x="86" y="192" width="148" height="112" rx="22" fill="url(#ivFillHead)" />
              <rect x="118" y="214" width="84" height="64" rx="8" fill="rgba(18,11,7,.85)" />
              <rect x="124" y="304" width="24" height="18" fill="#a9521c" />
              <rect x="172" y="304" width="24" height="18" fill="#a9521c" />
            </g>

            {/* the face lives on the screen */}
            <g className="iv-face">
              <g className="iv-eyes">
                <rect x="124" y="100" width="20" height="26" rx="10" />
                <rect x="176" y="100" width="20" height="26" rx="10" />
              </g>
              <g className="iv-mouth">
                {[0, 1, 2, 3, 4].map((k) => (
                  <rect key={k} x={140 + k * 9} y="138" width="5" height="10" rx="2.5" style={{ '--k': k }} />
                ))}
              </g>
            </g>

            {/* the sketch */}
            <g className="iv-lines" filter="url(#ivBloom)">
              {STROKES.map((s, i) => (
                <path
                  key={i}
                  d={s.d}
                  pathLength="1"
                  className={s.cls || ''}
                  strokeWidth={s.w}
                  style={{ '--n': i }}
                />
              ))}
              {/* waving arm, drawn last */}
              <g className="iv-wave">
                <path d="M234 222 C258 212 270 186 266 160" pathLength="1" strokeWidth="3.5" style={{ '--n': STROKES.length }} />
                <path d="M266 144 a8 8 0 1 0 0.1 0" pathLength="1" strokeWidth="3" style={{ '--n': STROKES.length + 1 }} />
              </g>
            </g>
          </svg>
            </div>
          </div>
        </div>
        {showBubble && (
          <div className={`iv-bubble ${side}`} key={line} aria-live="polite">{caption}</div>
        )}
      </div>

      {needTap && phase !== 'exit' && (
        <button type="button" className="iv-tap" onClick={() => tryResume().then((ok) => { if (ok) setNeedTap(false); })}>
          <span aria-hidden="true">🔊</span> Tap anywhere for sound
        </button>
      )}

      <button type="button" className="iv-skip" onClick={finish}>
        Skip intro
        <svg viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="15" />
          <circle className="iv-skip-ring" cx="18" cy="18" r="15" pathLength="1" style={{ strokeDashoffset: 1 - progress }} />
        </svg>
      </button>
    </div>
  );
}
