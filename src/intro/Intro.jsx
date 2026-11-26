import React, { useCallback, useEffect, useRef, useState } from 'react';
import './intro.css';
import { unlockAudio, whoosh, thud, boom, blip } from './sfx.js';

/*
  Cinematic welcome.
  1. "Power up" button (browsers only allow sound after a click).
  2. Copper cables whoosh in from right and left, three power hits, flash.
  3. Volt bursts out, then actually talks (speech synthesis), moving around
     the screen to point at what he is explaining, with live captions.
  4. When he is done he dissolves and the site appears.
*/

const POP_MS = 2950;
const LIVE_MS = 3800;
const TEAM = 'Team Live Wire';

const LINES = [
  { text: "Hi there! I'm Volt, and I'm so happy you're here!", spot: 'center' },
  { text: `Welcome to the Procurement and Supplier Portal, built for Elsewedy Electric by ${TEAM}!`, spot: 'center' },
  { text: "Employees, this one's for you! Create purchase requests, get them approved, and compare supplier offers in just a few clicks.", spot: 'left' },
  { text: "Suppliers, you're up next! Find open requests, send your quotations, and track every order all the way to delivery.", spot: 'right' },
  { text: "Less paperwork, more power. Let's plug in and get started!", spot: 'center', jump: true },
];

const HEADLINE = "Hi, I'm Volt.";

function pickVoice() {
  const vs = (window.speechSynthesis && window.speechSynthesis.getVoices()) || [];
  const prefs = [/Google US English/i, /(Aria|Jenny|Ava|Emma|Ana).*Online/i, /Samantha/i, /Microsoft Zira/i, /Google UK English Female/i];
  for (const re of prefs) {
    const v = vs.find((x) => re.test(x.name));
    if (v) return v;
  }
  return vs.find((x) => /^en[-_]US/i.test(x.lang)) || vs.find((x) => /^en/i.test(x.lang)) || null;
}

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

export default function Intro({ onExit, onDone }) {
  const [phase, setPhase] = useState('ready'); // ready -> cables -> pop -> live -> exit
  const [typed, setTyped] = useState('');
  const [line, setLine] = useState(-1);
  const [shown, setShown] = useState(0);
  const [talking, setTalking] = useState(false);
  const doneRef = useRef(false);
  const token = useRef(0);
  const wordTimer = useRef(0);
  const timers = useRef([]);
  const theme = (() => {
    try { return localStorage.getItem('volt-theme') || 'light'; } catch { return 'light'; }
  })();

  const after = (fn, ms) => { const id = window.setTimeout(fn, ms); timers.current.push(id); return id; };

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    token.current += 1;
    window.clearInterval(wordTimer.current);
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch { /* ignore */ }
    setTalking(false);
    setPhase('exit');
    onExit?.();
    window.setTimeout(() => onDone?.(), 1300);
  }, [onExit, onDone]);

  // Volt reads line i out loud, then moves on to the next one
  const speak = useCallback((i) => {
    if (doneRef.current) return;
    if (i >= LINES.length) { after(finish, 1600); return; }
    const my = ++token.current;
    const { text } = LINES[i];
    const words = text.split(' ');
    setLine(i); setShown(0); blip();
    let moved = false;
    const next = () => {
      if (moved || my !== token.current) return;
      moved = true;
      window.clearInterval(wordTimer.current);
      setShown(words.length); setTalking(false);
      after(() => speak(i + 1), 550);
    };
    const revealWords = (msPerWord) => {
      window.clearInterval(wordTimer.current);
      let n = 0;
      wordTimer.current = window.setInterval(() => {
        n += 1; setShown(n);
        if (n >= words.length) window.clearInterval(wordTimer.current);
      }, msPerWord);
    };
    const synth = window.speechSynthesis;
    if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') {
      setTalking(true); revealWords(300);
      after(next, words.length * 300 + 900);
      return;
    }
    const u = new window.SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
    u.rate = 1.03; u.pitch = 1.25; u.volume = 1;
    let started = false;
    let timed = false;
    const goTimed = () => {
      // no voice available / blocked: Volt "talks" with captions only
      if (timed || started || moved || my !== token.current) return;
      timed = true;
      setTalking(true); revealWords(300);
      after(next, words.length * 300 + 1100);
    };
    u.onstart = () => { if (my === token.current) { started = true; setTalking(true); revealWords(330); } };
    u.onend = () => { if (started) next(); else goTimed(); };
    u.onerror = () => { if (started) next(); else goTimed(); };
    // safety net: some browsers never fire onend
    after(() => { if (started) next(); }, words.length * 450 + 3000);
    // if speech never starts, still show the words
    after(goTimed, 1200);
    try { synth.cancel(); synth.speak(u); } catch { next(); }
  }, [finish]);

  const start = useCallback(() => {
    if (phase !== 'ready') return;
    unlockAudio();
    // warm up the voices list
    try { window.speechSynthesis && window.speechSynthesis.getVoices(); } catch { /* ignore */ }
    setPhase('cables');
    [0, 1, 2, 3].forEach((c) => whoosh(0.25 + c * 0.42, c % 2 === 0));
    [2.05, 2.35, 2.65].forEach((t, k) => thud(t, 0.9 + k * 0.12));
    boom(2.95);
    after(() => setPhase((p) => (p === 'exit' ? p : 'pop')), POP_MS);
    after(() => setPhase((p) => (p === 'exit' ? p : 'live')), LIVE_MS);
    after(() => speak(0), LIVE_MS + 300);
  }, [phase, speak]);

  useEffect(() => {
    document.documentElement.classList.add('iv-lock');
    try { window.speechSynthesis && window.speechSynthesis.getVoices(); } catch { /* ignore */ }
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      window.clearInterval(wordTimer.current);
      try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch { /* ignore */ }
      document.documentElement.classList.remove('iv-lock');
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') finish();
      else if ((e.key === 'Enter' || e.key === ' ') && phase === 'ready') { e.preventDefault(); start(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, start, finish]);

  // typewriter for the headline once he is up
  useEffect(() => {
    if (phase !== 'live') return undefined;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(HEADLINE.slice(0, i));
      if (i >= HEADLINE.length) window.clearInterval(id);
    }, 70);
    return () => window.clearInterval(id);
  }, [phase]);

  const cur = line >= 0 ? LINES[line] : null;
  const spot = cur ? cur.spot : 'center';
  const words = cur ? cur.text.split(' ') : [];
  const progress = line < 0 ? 0 : (line + (shown >= words.length ? 1 : 0.5)) / LINES.length;

  return (
    <div
      className={`iv iv-${phase} iv-spot-${spot} ${cur?.jump ? 'iv-jump' : ''} ${theme === 'dark' ? 'iv-dark' : ''} ${talking ? 'iv-talking' : ''}`}
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

      {phase === 'ready' && (
        <div className="iv-gate">
          <p className="iv-kicker">{TEAM} · for Elsewedy Electric</p>
          <button type="button" className="iv-power" onClick={start} autoFocus>
            <span className="iv-power-ring" aria-hidden="true" />
            <span className="iv-power-ring iv-power-ring2" aria-hidden="true" />
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.2L13.5 2Z" /></svg>
            <span className="iv-power-label">Power up</span>
          </button>
          <p className="iv-hint">🔊 Turn your sound on</p>
        </div>
      )}

      {phase !== 'ready' && (
        <>
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
        </>
      )}

      <div className="iv-stage">
        <div className="iv-bot-wrap">
          <div className="iv-walker">
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

        <div className="iv-copy">
          <p className="iv-kicker">{TEAM} · Procurement &amp; Supplier Portal</p>
          <h1 className="iv-title">
            <span className="iv-shine">{typed}</span>
            <span className="iv-caret" aria-hidden="true" />
          </h1>

          <p className="iv-caption" aria-live="polite">
            {words.map((w, k) => (
              <span key={`${line}-${k}`} className={k < shown ? 'on' : ''}>{w} </span>
            ))}
          </p>

          <div className="iv-roles">
            <article className={`iv-role ${line >= 2 ? 'in' : ''} ${line === 2 ? 'active' : ''}`}>
              <span className="iv-role-tag">For employees</span>
              <p>Create purchase requests, get approvals and compare supplier offers in a few clicks.</p>
            </article>
            <article className={`iv-role ${line >= 3 ? 'in' : ''} ${line === 3 ? 'active' : ''}`}>
              <span className="iv-role-tag">For suppliers</span>
              <p>Find open requests, send quotations and track every order to delivery.</p>
            </article>
          </div>

          <p className={`iv-foot ${line >= 4 ? 'in' : ''}`}>Less paperwork, more power. ⚡</p>
        </div>
      </div>

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
