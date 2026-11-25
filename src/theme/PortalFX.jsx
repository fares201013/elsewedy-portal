import { createContext, useContext, useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------
   Live 3D cable (lazy-loads three.js so the portal stays fast)
   ------------------------------------------------------------------ */
const VIEWS = {
  cutaway: { pos: [3.4, 2.8, 13.2], look: [0.8, 0.2, 0], tilt: -0.16, orbit: 0.26 },
  section: { pos: [10.5, 1.4, 4.2], look: [0.6, 0, 0], tilt: 0, orbit: 0.08, spin: 0.35 },
  strands: { pos: [5.2, 1.1, 2.6], look: [3.0, 0, 0], tilt: -0.1, orbit: 0.18 },
};

export function CableHero({ view = 'cutaway', cycle = true, poster = './assets/cables/cable-cutaway.webp', className = '' }) {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let scene;
    let raf = 0;
    let visible = true;
    let cancelled = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    import('../landing/CableScene.js')
      .then(({ createCableScene }) => {
        if (cancelled || !canvas.current) return;
        scene = createCableScene(canvas.current, { reducedMotion: reduced });
        scene.setView(VIEWS[view] || VIEWS.cutaway);
        setReady(true);
        const start = performance.now();
        const loop = (now) => {
          const t = (now - start) / 1000;
          // layers slowly peel and re-wrap, like a breathing product shot
          if (cycle && !reduced) scene.setProgress(((Math.sin(t * 0.32 - Math.PI / 2) + 1) / 2) * 0.86);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      })
      .catch(() => setFailed(true));

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!scene) return;
      if (visible) scene.resume();
      else scene.pause();
    });
    if (wrap.current) io.observe(wrap.current);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      try {
        scene?.dispose();
      } catch {
        /* ignore */
      }
    };
  }, [view, cycle]);

  return (
    <div className={`vx-cable ${ready ? 'is-ready' : ''} ${className}`} ref={wrap} aria-hidden="true">
      <img className="vx-cable-poster" src={poster} alt="" />
      {!failed && <canvas ref={canvas} />}
    </div>
  );
}

/* ------------------------------------------------------------------
   Ambient background: glows, grid, grain
   ------------------------------------------------------------------ */
export function Ambient() {
  return (
    <div className="vx-ambient" aria-hidden="true">
      <i className="vx-orb vx-orb-a" />
      <i className="vx-orb vx-orb-b" />
      <i className="vx-orb vx-orb-c" />
      <i className="vx-gridlines" />
      <i className="vx-grain" />
    </div>
  );
}

/* ------------------------------------------------------------------
   Live activity ticker
   ------------------------------------------------------------------ */
export function Ticker({ items }) {
  if (!items?.length) return null;
  const row = items.map((item, i) => (
    <span key={i} className="vx-tick">
      <i className={`vx-tick-dot ${item.tone || ''}`} />
      <b>{item.id}</b>
      {item.text}
    </span>
  ));
  return (
    <div className="vx-ticker" role="marquee" aria-label="Live activity">
      <span className="vx-ticker-label"><i /> LIVE</span>
      <div className="vx-ticker-track">
        <div className="vx-ticker-move">
          {row}
          {row}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Page-change "current" wipe
   ------------------------------------------------------------------ */
export function Wipe({ phase }) {
  return (
    <div className={`vx-wipe ${phase}`} aria-hidden="true">
      <i />
    </div>
  );
}

/* ------------------------------------------------------------------
   Global micro-interactions: spotlight, tilt, count-up, magnetic
   ------------------------------------------------------------------ */
export function useFx(dep) {
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SPOT = '.card, .vx-tile, .vx-kpi, .approval-card, .report-card, .destination-badge, .supplier-hub-badge, .vx-dest, .request-entry, .supplier-tender-card, .role-card-btn';

    const onMove = (e) => {
      const el = e.target.closest?.(SPOT);
      if (el) {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
      if (!reduced) {
        const tilt = e.target.closest?.('[data-tilt]');
        if (tilt) {
          const r = tilt.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          tilt.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-4px)`;
        }
      }
    };
    const onLeave = (e) => {
      const tilt = e.target.closest?.('[data-tilt]');
      if (tilt && !tilt.contains(e.relatedTarget)) tilt.style.transform = '';
    };
    if (fine) {
      document.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerout', onLeave, { passive: true });
    }

    // click sparks on primary actions + a stamp for decisions
    const onClick = (e) => {
      if (reduced) return;
      const btn = e.target.closest?.('.button-primary, .vx-btn-primary, .button:not([class*="button-"]), .approval-buttons button');
      if (!btn) return;
      const x = e.clientX || btn.getBoundingClientRect().left + 20;
      const y = e.clientY || btn.getBoundingClientRect().top + 10;
      const burst = document.createElement('div');
      burst.className = 'vx-burst';
      burst.style.left = `${x}px`;
      burst.style.top = `${y}px`;
      for (let i = 0; i < 14; i++) {
        const sp = document.createElement('i');
        const a = (i / 14) * Math.PI * 2;
        const d = 38 + Math.random() * 34;
        sp.style.setProperty('--dx', `${Math.cos(a) * d}px`);
        sp.style.setProperty('--dy', `${Math.sin(a) * d}px`);
        burst.appendChild(sp);
      }
      document.body.appendChild(burst);
      window.setTimeout(() => burst.remove(), 800);
      const label = (btn.textContent || '').trim().toLowerCase();
      if (label === 'approve' || label === 'reject' || label.startsWith('accept')) {
        const stamp = document.createElement('div');
        stamp.className = `vx-stamp ${label === 'reject' ? 'is-bad' : ''}`;
        stamp.textContent = label === 'reject' ? 'REJECTED' : 'APPROVED';
        document.body.appendChild(stamp);
        window.setTimeout(() => stamp.remove(), 1400);
      }
    };
    document.addEventListener('click', onClick);

    // count-up numbers
    const counted = new WeakSet();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        if (!entry.isIntersecting || counted.has(el)) return;
        counted.add(el);
        const to = Number(el.dataset.count);
        const dec = Number(el.dataset.dec || 0);
        const pad = Number(el.dataset.pad || 0);
        if (reduced || !Number.isFinite(to)) return;
        const start = performance.now();
        const dur = 1400;
        const step = (now) => {
          const t = Math.min(1, (now - start) / dur);
          const v = to * (1 - Math.pow(1 - t, 4));
          el.textContent = pad ? String(Math.round(v)).padStart(pad, '0') : v.toFixed(dec);
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    });
    const scan = () => document.querySelectorAll('[data-count]').forEach((el) => io.observe(el));
    const t = window.setTimeout(scan, 60);

    return () => {
      window.clearTimeout(t);
      io.disconnect();
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerout', onLeave);
      document.removeEventListener('click', onClick);
    };
  }, [dep]);
}

export function Count({ value, pad = 0, dec = 0 }) {
  const shown = pad ? String(value).padStart(pad, '0') : Number(value).toFixed(dec);
  return (
    <span data-count={value} data-pad={pad || undefined} data-dec={dec || undefined}>
      {shown}
    </span>
  );
}

/* ------------------------------------------------------------------
   Live 3D assistant robot
   ------------------------------------------------------------------ */
export function Robot({ talking = false, className = '' }) {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const api = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import('./RobotScene.js')
      .then(({ createRobot }) => {
        if (cancelled || !canvas.current) return;
        api.current = createRobot(canvas.current);
        setReady(true);
      })
      .catch(() => {});
    const io = new IntersectionObserver(([entry]) => {
      if (!api.current) return;
      if (entry.isIntersecting) api.current.resume();
      else api.current.pause();
    });
    if (wrap.current) io.observe(wrap.current);
    return () => {
      cancelled = true;
      io.disconnect();
      try { api.current?.dispose(); } catch { /* ignore */ }
      api.current = null;
    };
  }, []);

  useEffect(() => {
    api.current?.setTalking(talking);
  }, [talking, ready]);

  return (
    <div className={`vx-robot ${ready ? 'is-ready' : ''} ${className}`} ref={wrap} aria-hidden="true">
      <span className="vx-robot-halo" />
      <canvas ref={canvas} />
    </div>
  );
}

/* ------------------------------------------------------------------
   Animated delivery truck on a road
   ------------------------------------------------------------------ */
export function TruckScene({ progress = null }) {
  return (
    <div className={`vx-truck-scene ${progress === null ? 'is-looping' : ''}`} style={progress === null ? undefined : { '--p': progress }} aria-hidden="true">
      <span className="vx-sky-line" />
      <span className="vx-road"><i /></span>
      <span className="vx-truck">
        <img src="./assets/cables/truck.webp" alt="" />
        <i className="vx-dust" />
        <i className="vx-dust vx-dust-b" />
      </span>
      <span className="vx-pin vx-pin-a">Supplier</span>
      <span className="vx-pin vx-pin-b">Elsewedy site</span>
    </div>
  );
}

/* ------------------------------------------------------------------
   Page hero: every inner page gets its own art
   ------------------------------------------------------------------ */

export const RouteContext = createContext('');

const IMG = (n) => `./assets/cables/${n}.webp`;
const ART = {
  'create-request': { img: IMG('cable-strands'), cls: 'wide' },
  'my-requests': { img: IMG('drum') },
  'request-view': { img: IMG('cable-section') },
  'track-requests': { kind: 'truck' },
  'request-tracking': { kind: 'truck' },
  approvals: { img: IMG('clipboard') },
  reports: { img: IMG('pylon') },
  analytics: { img: IMG('coins') },
  'ai-assistant': { kind: 'robot' },
  'profile-settings': { img: IMG('factory'), cls: 'wide' },
  'supplier-offers': { img: IMG('container') },
  'purchase-orders': { kind: 'truck' },
  'available-requests': { img: IMG('yard'), cls: 'wide' },
  'supplier-request-details': { img: IMG('cable-section') },
  'supplier-request-tracking': { kind: 'truck' },
  'my-quotations': { img: IMG('coins') },
  'review-quotation': { img: IMG('clipboard') },
  'my-orders': { img: IMG('parcel') },
  'order-details': { img: IMG('container') },
  'order-tracking': { kind: 'truck' },
  messages: { img: IMG('pylon') },
  'company-profile': { img: IMG('factory'), cls: 'wide' },
  settings: { img: IMG('drum') },
  help: { img: IMG('cable-armour'), cls: 'wide' },
};

export function PageHeading({ title, subtitle, action, eyebrow }) {
  const route = useContext(RouteContext);
  const art = ART[route] || { img: IMG('cable-section') };
  return (
    <header className={`page-heading vx-page-hero vx-art-${art.kind || 'img'}`}>
      <span className="vx-ph-grid" aria-hidden="true" />
      <div className="vx-ph-copy">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {action && <div className="vx-ph-action">{action}</div>}
      </div>
      <div className="vx-ph-art">
        {art.kind === 'truck' && <TruckScene />}
        {art.kind === 'robot' && <Robot />}
        {!art.kind && <img className={`vx-ph-img ${art.cls || ''}`} src={art.img} alt="" />}
      </div>
    </header>
  );
}
