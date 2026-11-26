import { useCallback, useEffect, useRef, useState } from 'react';
import './fun.css';

/*
  Volt, the little robot who lives on the edge of the screen.
  - peeks in from the right edge, eyes follow the mouse
  - reacts to what you actually do (new request, approvals, quotes, POs, shipments)
  - says something about the page you open
  - falls asleep if you leave him alone, wakes up when you come back
  - poke him too many times and he runs away
*/

const KEYS = { 'last-desgin-requests': 'request', 'commerce-quotations': 'quote', 'commerce-orders': 'order' };
const IDLE_MS = 35000;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fmt = (n) => Number(n || 0).toLocaleString('en-US');

const PAGE_LINES = [
  [/create-request/, ['A new request? I love new things. Fill it in, I will not look. 👀', 'Pro tip: a clear title gets approved faster. Probably.']],
  [/approvals/, ['Approvals. Where dreams get a ✅ or a ❌.', 'Be kind. Someone wrote that request at 3 AM.']],
  [/my-requests|track-requests|request-tracking/, ['All your requests, lined up like good little cables.', 'Tracking things is my favourite hobby.']],
  [/purchase-orders|my-orders/, ['Purchase orders! Now it is getting serious. 💼']],
  [/order-tracking|order-details/, ['Vroom vroom 🚚 I can hear the truck from here.']],
  [/quotation|review-quotation/, ['Quotations: where suppliers fight with numbers.', 'Lowest price is not always the best. Says the robot with no budget.']],
  [/available-requests/, ['Fresh requests waiting for a good offer. Go get them. 💪']],
  [/ai-assistant|assistant/, ['Oh, my cousin works here. He is the serious one.']],
  [/settings|profile|company-profile/, ['Settings. The place where nothing exciting ever happens.', 'Change your password. Not to "1234". I am watching.']],
  [/messages|notification/, ['Inbox time. I hope it is good news. 📬']],
  [/dashboard/, ['Welcome back, boss. Everything is under control. Mostly.', 'Dashboards make everyone look busy. Nice one.']],
];

const POKES = ['Hey! 👋', 'Hehe, that tickles.', 'I am working here, you know.', 'One more and I am leaving.'];

function diff(prev, next) {
  const out = [];
  const before = new Map(prev.map((x) => [x.id, x]));
  next.forEach((item) => {
    const old = before.get(item.id);
    if (!old) out.push({ type: 'new', item });
    else if (old.status !== item.status) out.push({ type: 'status', item, from: old.status });
  });
  return out;
}

function lineFor(kind, ev) {
  const s = String(ev.item.status || '');
  if (kind === 'request') {
    if (ev.type === 'new') {
      const cost = Number(ev.item.cost || 0);
      if (cost >= 1000000) return { text: `${fmt(cost)} EGP?! Who is paying for this, me? 😳`, mood: 'shock' };
      if (s === 'Draft') return { text: 'Saved as a draft. I will keep it warm for you. 📝' };
      return { text: 'New request sent! Off it goes into the grid. ⚡', mood: 'happy' };
    }
    if (/approved/i.test(s)) return { text: 'APPROVED! Let me do my little dance. 🕺', mood: 'dance' };
    if (/reject/i.test(s)) return { text: 'Rejected... it is okay, we fix it and try again. 🔧', mood: 'sad' };
    if (/publish/i.test(s)) return { text: 'Published to suppliers. Let the offers begin! 📣', mood: 'happy' };
    if (/review/i.test(s)) return { text: 'Under review. Fingers crossed. I do not have fingers. 🤞' };
  }
  if (kind === 'quote') {
    if (ev.type === 'new') return { text: 'A new quotation just landed! 💰', mood: 'happy' };
    if (/accepted/i.test(s)) return { text: 'Deal! Quotation accepted. 🤝', mood: 'dance' };
    if (/rejected/i.test(s)) return { text: 'Quotation rejected. Ouch. Next! 😬', mood: 'sad' };
    if (/revision/i.test(s)) return { text: 'Sent back for a revision. Negotiation mode on. 🧐' };
  }
  if (kind === 'order') {
    if (ev.type === 'new') return { text: 'A purchase order was born! 🎉', mood: 'dance' };
    if (/ship|transit/i.test(s)) return { text: 'On the road! 🚚 Vroom vroom.', mood: 'happy' };
    if (/received|completed|deliver/i.test(s)) return { text: 'Delivered! Mission complete. ✅', mood: 'dance' };
    if (/confirm/i.test(s)) return { text: 'Supplier confirmed the order. Nice and smooth.' };
  }
  return null;
}

export default function Volt() {
  const [mode, setMode] = useState('hidden'); // hidden | peek | out | sleep | flee
  const [mood, setMood] = useState('idle');   // idle | happy | dance | sad | shock
  const [bubble, setBubble] = useState('');
  const [onLanding, setOnLanding] = useState(() => document.body.classList.contains('lx-body'));
  const eyes = useRef(null);
  const self = useRef(null);
  const timers = useRef({});
  const pokes = useRef(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const clear = (k) => { window.clearTimeout(timers.current[k]); };
  const later = (k, fn, ms) => { clear(k); timers.current[k] = window.setTimeout(fn, ms); };

  const say = useCallback((text, m = 'idle', ms = 4800) => {
    if (modeRef.current === 'flee') return;
    setBubble(text); setMood(m); setMode('out');
    later('back', () => { setMode('peek'); setMood('idle'); setBubble(''); }, ms);
  }, []);

  // hide on the landing page (the story page has its own show)
  useEffect(() => {
    const mo = new MutationObserver(() => setOnLanding(document.body.classList.contains('lx-body')));
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  // first appearance
  useEffect(() => {
    if (onLanding) { setMode('hidden'); return; }
    setMode('peek');
    let greeted = false;
    try { greeted = sessionStorage.getItem('volt-greeted') === '1'; sessionStorage.setItem('volt-greeted', '1'); } catch { /* fine */ }
    later('hello', () => say(greeted ? 'I am still here. Just so you know. 👀' : "Hey! I'm Volt. I'll keep an eye on things for you. ⚡", 'happy', 5200), 1800);
  }, [onLanding, say]);

  // react to real changes in requests, quotations and orders
  useEffect(() => {
    const proto = Storage.prototype;
    const original = proto.setItem;
    proto.setItem = function patched(key, value) {
      const kind = this === window.localStorage ? KEYS[key] : null;
      let before = null;
      if (kind) { try { before = JSON.parse(this.getItem(key) || 'null'); } catch { before = null; } }
      const result = original.call(this, key, value);
      if (kind && Array.isArray(before)) {
        try {
          const after = JSON.parse(value);
          if (Array.isArray(after)) {
            const evs = diff(before, after);
            const ev = evs[evs.length - 1];
            const line = ev && lineFor(kind, ev);
            if (line) window.setTimeout(() => say(line.text, line.mood || 'idle', 5200), 350);
          }
        } catch { /* ignore */ }
      }
      return result;
    };
    return () => { proto.setItem = original; };
  }, [say]);

  // comment on the page you open (not every time, he is not that annoying)
  useEffect(() => {
    const seen = new Set();
    const onHash = () => {
      const route = (window.location.hash || '').replace('#', '').split('?')[0];
      if (!route || seen.has(route)) return;
      seen.add(route);
      const hit = PAGE_LINES.find(([re]) => re.test(route));
      if (hit && Math.random() < 0.7) later('page', () => say(pick(hit[1])), 900);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [say]);

  // eyes follow the mouse; idle -> sleep; activity -> wake up
  useEffect(() => {
    const goSleep = () => {
      if (modeRef.current === 'peek') { setMode('sleep'); setBubble(''); }
    };
    later('idle', goSleep, IDLE_MS);
    const onMove = (e) => {
      if (modeRef.current === 'sleep') {
        setMode('peek');
        later('wake', () => say(pick(['Huh?! I was not sleeping. I was… optimizing. 😴', 'Oh, you are back! I missed you. A little.', 'Zzz… wha— yes, boss, all good!']), 'shock', 4200), 250);
      }
      later('idle', goSleep, IDLE_MS);
      const el = eyes.current; const me = self.current;
      if (!el || !me) return;
      const r = me.getBoundingClientRect();
      const cx = r.left + r.width / 2; const cy = r.top + r.height * 0.3;
      const a = Math.atan2(e.clientY - cy, e.clientX - cx);
      const d = Math.min(1, Math.hypot(e.clientX - cx, e.clientY - cy) / 300);
      el.style.transform = `translate(${Math.cos(a) * 4 * d}px, ${Math.sin(a) * 3 * d}px)`;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('keydown', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('keydown', onMove);
    };
  }, [say]);

  useEffect(() => () => Object.values(timers.current).forEach((t) => window.clearTimeout(t)), []);

  const poke = () => {
    if (mode === 'flee') return;
    if (mode === 'sleep') { setMode('peek'); say('AH! Do not do that! 😱', 'shock', 3200); return; }
    pokes.current += 1;
    clear('pokes'); later('pokes', () => { pokes.current = 0; }, 6000);
    if (pokes.current >= 5) {
      pokes.current = 0;
      say('That is it. I am out! 💨', 'shock', 1200);
      later('flee', () => { clear('back'); setMode('flee'); setBubble(''); }, 1100);
      later('return', () => { modeRef.current = 'peek'; setMode('peek'); say(pick(['…fine. I am back. But I am watching you. 😒', 'I came back for the snacks. There are no snacks. 😑']), 'sad', 4600); }, 8000);
      return;
    }
    say(POKES[pokes.current - 1], pokes.current >= 3 ? 'sad' : 'happy', 2600);
  };

  if (onLanding) return null;

  return (
    <div className={`volt volt-${mode} volt-m-${mood}`} aria-live="polite">
      {bubble && (mode === 'out') && <div className="volt-bubble" key={bubble}>{bubble}</div>}
      <button type="button" className="volt-bot" ref={self} onClick={poke} aria-label="Volt, your robot buddy">
        <svg viewBox="0 0 120 150" aria-hidden="true">
          <line x1="60" y1="16" x2="60" y2="4" className="volt-ant" />
          <circle cx="60" cy="4" r="4" className="volt-bulb" />
          <rect x="18" y="16" width="84" height="56" rx="14" className="volt-shell" />
          <rect x="27" y="24" width="66" height="40" rx="8" className="volt-screen" />
          <rect x="12" y="34" width="7" height="18" rx="2" className="volt-shell-d" />
          <rect x="101" y="34" width="7" height="18" rx="2" className="volt-shell-d" />
          <g ref={eyes} className="volt-eyes">
            <rect x="40" y="33" width="11" height="15" rx="5.5" className="volt-eye" />
            <rect x="69" y="33" width="11" height="15" rx="5.5" className="volt-eye" />
          </g>
          <path d="M50 55 Q60 61 70 55" className="volt-mouth" />
          <path d="M42 41 L49 44 M78 41 L71 44" className="volt-zz-eyes" />
          <rect x="30" y="78" width="60" height="50" rx="12" className="volt-shell" />
          <path d="M63 88 L53 103 H60 L56 118 L68 100 H61 Z" className="volt-bolt" />
          <path d="M30 92 C18 98 14 112 18 122" className="volt-arm volt-arm-l" />
          <path d="M90 92 C102 86 108 74 106 62" className="volt-arm volt-arm-r" />
          <rect x="40" y="128" width="12" height="10" rx="2" className="volt-shell-d" />
          <rect x="68" y="128" width="12" height="10" rx="2" className="volt-shell-d" />
        </svg>
        <span className="volt-z" aria-hidden="true"><i>z</i><i>z</i><i>Z</i></span>
      </button>
    </div>
  );
}
