import React, { useEffect, useRef, useState } from 'react';
import './intro.css';

/*
  Cinematic welcome: Volt the robot is sketched stroke by stroke with
  shiny metallic lines, comes alive in the middle of the screen, greets
  the visitor and explains what the portal does for employees and
  suppliers, then dissolves as if it was never there.
  Plays on every full page load.
*/

const POP_MS = 2950;  // cables have slammed in and the beats are done
const LIVE_MS = 3800; // robot is up, the greeting starts
const HOLD_MS = 14300; // ~10s of reading after the greeting
const EXIT_MS = 1300;

const HEADLINE = "Hi, I'm Volt.";
const SUB = 'Welcome to the Elsewedy Electric Procurement & Supplier Portal.';

// cables: right, left, right, left — all aimed at the centre (800,450)
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
  const [phase, setPhase] = useState('cables'); // cables -> pop -> live -> exit
  const [typed, setTyped] = useState('');
  const doneRef = useRef(false);
  const theme = (() => {
    try { return localStorage.getItem('volt-theme') || 'light'; } catch { return 'light'; }
  })();

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase('exit');
    onExit?.();
    window.setTimeout(() => onDone?.(), EXIT_MS);
  };

  useEffect(() => {
    document.documentElement.classList.add('iv-lock');
    const t0 = window.setTimeout(() => setPhase((p) => (p === 'exit' ? p : 'pop')), POP_MS);
    const t1 = window.setTimeout(() => setPhase((p) => (p === 'exit' ? p : 'live')), LIVE_MS);
    const t2 = window.setTimeout(finish, HOLD_MS);
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('iv-lock');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // typewriter for the greeting once the robot is alive
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

  const talking = phase === 'live' && typed.length < HEADLINE.length;

  return (
    <div
      className={`iv iv-${phase} ${theme === 'dark' ? 'iv-dark' : ''} ${talking ? 'iv-talking' : ''}`}
      role="dialog"
      aria-label="Welcome"
      style={{ '--hold': `${HOLD_MS - LIVE_MS}ms` }}
    >
      <div className="iv-grid" aria-hidden="true" />
      <div className="iv-glow" aria-hidden="true" />
      <div className="iv-sparks" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <i key={i} style={{ '--i': i, '--x': `${(i * 37) % 100}%`, '--d': `${(i % 6) * 0.45}s` }} />
        ))}
      </div>

      {/* power cables whoosh in from both sides and slam into the centre */}
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
        <div className="iv-bot-wrap">
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

        <div className="iv-copy">
          <p className="iv-kicker">Elsewedy Electric · Procurement &amp; Supplier Portal</p>
          <h1 className="iv-title">
            <span className="iv-shine">{typed}</span>
            <span className="iv-caret" aria-hidden="true" />
          </h1>
          <p className="iv-sub">{SUB}</p>

          <div className="iv-roles">
            <article className="iv-role">
              <span className="iv-role-tag">For employees</span>
              <p>Raise purchase requests, get them approved, compare supplier quotations and issue purchase orders, all in one flow.</p>
            </article>
            <article className="iv-role">
              <span className="iv-role-tag">For suppliers</span>
              <p>See open requests, submit your quotations, and follow your purchase orders from approval to delivery.</p>
            </article>
          </div>

          <p className="iv-foot">From request to delivery, wired end to end.</p>
        </div>
      </div>

      <button type="button" className="iv-skip" onClick={finish}>
        Skip intro
        <svg viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="15" />
          <circle className="iv-skip-ring" cx="18" cy="18" r="15" pathLength="1" />
        </svg>
      </button>
    </div>
  );
}
