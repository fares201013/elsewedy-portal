import { useEffect, useRef } from 'react';

/*
  A short copper cable that hangs from the mouse pointer and swings with
  real rope physics. Clicking throws sparks. Desktop / mouse only.
*/

const N = 22;          // rope points
const SEG = 8.5;       // px between points
const GRAVITY = 0.55;
const DAMP = 0.982;

export default function CopperCable() {
  const ref = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!fine.matches) return undefined;

    const cv = ref.current;
    const ctx = cv.getContext('2d');
    let w = 0; let h = 0; let dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.width = `${w}px`; cv.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const mouse = { x: w / 2, y: h / 2, seen: false };
    const pts = Array.from({ length: N }, (_, i) => ({ x: mouse.x, y: mouse.y + i * SEG, px: mouse.x, py: mouse.y + i * SEG }));
    const sparks = [];
    let alpha = 0; let target = 0;
    let raf = 0;

    const onMove = (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      if (!mouse.seen) {
        mouse.seen = true;
        pts.forEach((p, i) => { p.x = p.px = mouse.x; p.y = p.py = mouse.y + i * SEG; });
      }
      target = 1;
    };
    const onLeave = (e) => { if (!e.relatedTarget) target = 0; };
    const onDown = (e) => {
      if (e.button !== 0) return;
      for (let i = 0; i < 16; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const s = 2.5 + Math.random() * 5.5;
        sparks.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, life: 1, len: 4 + Math.random() * 7 });
      }
      sparks.push({ ring: true, x: e.clientX, y: e.clientY, life: 1 });
      // the cable gets a little kick too
      pts.forEach((p, i) => { if (i > 0) p.px -= (i / N) * 3; });
    };

    const step = () => {
      alpha += (target - alpha) * 0.12;

      // head is pinned to the cursor
      pts[0].x = pts[0].px = mouse.x;
      pts[0].y = pts[0].py = mouse.y;
      for (let i = 1; i < N; i += 1) {
        const p = pts[i];
        const vx = (p.x - p.px) * DAMP;
        const vy = (p.y - p.py) * DAMP;
        p.px = p.x; p.py = p.y;
        p.x += vx; p.y += vy + GRAVITY;
      }
      for (let k = 0; k < 7; k += 1) {
        for (let i = 0; i < N - 1; i += 1) {
          const a = pts[i]; const b = pts[i + 1];
          const dx = b.x - a.x; const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 0.001;
          const diff = (d - SEG) / d;
          if (i === 0) { b.x -= dx * diff; b.y -= dy * diff; } else {
            a.x += dx * diff * 0.5; a.y += dy * diff * 0.5;
            b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5;
          }
        }
      }

      // a little bending stiffness so the cable curves instead of crumpling
      for (let i = 1; i < N - 2; i += 1) {
        const a = pts[i]; const c = pts[i + 2];
        const dx = c.x - a.x; const dy = c.y - a.y;
        const d = Math.hypot(dx, dy) || 0.001;
        const want = SEG * 1.85;
        if (d < want) {
          const k = ((want - d) / d) * 0.25;
          a.x -= dx * k; a.y -= dy * k; c.x += dx * k; c.y += dy * k;
        }
      }

      ctx.clearRect(0, 0, w, h);

      // sparks
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const s = sparks[i];
        if (s.ring) {
          s.life -= 0.06;
          ctx.beginPath(); ctx.arc(s.x, s.y, (1 - s.life) * 26, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(232, 145, 63, ${Math.max(0, s.life)})`; ctx.lineWidth = 2; ctx.stroke();
        } else {
          s.vy += 0.22; s.vx *= 0.97; s.x += s.vx; s.y += s.vy; s.life -= 0.028;
          ctx.save();
          ctx.globalAlpha = Math.max(0, s.life);
          ctx.strokeStyle = s.life > 0.55 ? '#fff3dc' : '#ffb05a';
          ctx.shadowColor = '#ff9a3c'; ctx.shadowBlur = 8; ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.vx * (s.len / 6), s.y - s.vy * (s.len / 6)); ctx.stroke();
          ctx.restore();
        }
        if (s.life <= 0) sparks.splice(i, 1);
      }

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('mouseout', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('mouseout', onLeave);
    };
  }, []);

  return <canvas ref={ref} className="fx-cable" aria-hidden="true" />;
}
