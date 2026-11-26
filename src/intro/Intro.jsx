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
function speakOut(text, { onWord, onDone }) {
  const words = text.split(' ');
  let n = 0; let wt = 0; let st = 0; let dead = false; let finished = false; let started = false; let voiced = false;
  const reveal = (ms) => {
    window.clearInterval(wt);
    wt = window.setInterval(() => { n += 1; onWord(n); if (n >= words.length) window.clearInterval(wt); }, ms);
  };
  const done = () => {
    if (finished || dead) return;
    finished = true; window.clearInterval(wt); onWord(words.length); onDone();
  };
  const silent = () => { if (started || dead) return; started = true; reveal(300); st = window.setTimeout(() => { if (!voiced) done(); }, words.length * 300 + 900); };
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
  const [pos, setPos] = useState(() => ({ x: window.innerWidth / 2, y: window.innerHeight / 2, rot: 0, sx: 1, sy: 1, dur: 0 }));
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
  const roam = useCallback((hops, spot, cb) => {
    setLanded(false);
    let n = 0;
    const hop = () => {
      if (doneRef.current) return;
      const { vw, vh } = size();
      if (n >= hops) {
        const s = spotXY(spot);
        setPos({ x: s.x, y: s.y, rot: 0, sx: 1, sy: 1, dur: 520 });
        after(() => { setPos((p) => ({ ...p, sx: 1.12, sy: 0.88, dur: 120 })); }, 520);
        after(() => { setPos((p) => ({ ...p, sx: 1, sy: 1, dur: 260 })); setLanded(true); cb?.(); }, 650);
        return;
      }
      n += 1;
      const d = rand(260, 400);
      setPos({ x: rand(0.08, 0.92) * vw, y: rand(0.12, 0.86) * vh, rot: rand(-28, 28), sx: rand(0.9, 1.1), sy: rand(0.9, 1.1), dur: d });
      after(hop, d + 40);
    };
    hop();
  }, []);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    stopVoice.current?.();
    setTalking(false);
    setPhase('exit');
    onExit?.();
    window.setTimeout(() => onDone?.(), 1300);
  }, [onExit, onDone]);

  const say = useCallback((i) => {
    if (doneRef.current) return;
    if (i >= LINES.length) {
      // victory lap, then vanish
      roam(4, 'mid', () => after(finish, 500));
      return;
    }
    const L = LINES[i];
    const go = () => {
      setLine(i); setShown(0); setTalking(true);
      stopVoice.current = speakOut(L.text, {
        onWord: (n) => setShown(n),
        onDone: () => { setTalking(false); after(() => say(i + 1), 800); },
      });
    };
    if (i === 0) {
      const s = spotXY(L.spot);
      setPos({ x: s.x, y: s.y, rot: 0, sx: 1, sy: 1, dur: 700 });
      after(() => { setLanded(true); go(); }, 760);
    } else roam(Math.round(rand(3, 5)), L.spot, go);
  }, [roam, finish]);

  // the whole show runs on its own
  useEffect(() => {
    document.documentElement.classList.add('iv-lock');
    audio();
    try { window.speechSynthesis && window.speechSynthesis.getVoices(); } catch { /* warm up */ }
    tryResume().then((ok) => { if (!ok && !doneRef.current) setNeedTap(true); });

    [0, 1, 2, 3].forEach((c) => after(() => whoosh(c % 2 === 0), 250 + c * 420));
    [2050, 2350, 2650].forEach((t, k) => after(() => thud(0.9 + k * 0.12), t));
    after(() => boom(), POP_MS);
    after(() => setPhase('pop'), POP_MS);
    after(() => setPhase('live'), LIVE_MS);
    after(() => say(0), LIVE_MS + 200);

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
  const bubbleLeft = pos.x > vw * 0.55; // bubble goes on the side facing the middle
  const showBubble = !mobile && landed && cur && phase === 'live';

  const caption = (
    words.map((w, k) => <span key={`${line}-${k}`} className={k < shown ? 'on' : ''}>{w} </span>)
  );

  return (
    <div
      className={`iv iv-${phase} ${cur?.jump && landed ? 'iv-jump' : ''} ${theme === 'dark' ? 'iv-dark' : ''} ${talking ? 'iv-talking' : ''} ${landed ? 'iv-landed' : 'iv-moving'}`}
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
      <div className="iv-robo" style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, transitionDuration: `${pos.dur}ms` }}>
        <div className="iv-robo-tilt" style={{ transform: `rotate(${pos.rot}deg) scale(${pos.sx}, ${pos.sy})`, transitionDuration: `${pos.dur}ms` }}>
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
          <div className={`iv-bubble ${bubbleLeft ? 'to-left' : 'to-right'}`} key={line} aria-live="polite">{caption}</div>
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
