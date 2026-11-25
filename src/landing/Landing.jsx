import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createCableScene } from './CableScene.js';
import './landing.css';

gsap.registerPlugin(ScrollTrigger);

const STAGES = [
  {
    layer: 'Outer sheath',
    title: 'The Request',
    text: 'Every purchase starts as a need, wrapped in context: the item, the quantity, the budget, the deadline and the reason it matters.',
  },
  {
    layer: 'Steel armour',
    title: 'The Approval',
    text: 'Department review gives a request its strength. Approve, reject or send it back for changes, and every decision stays on record.',
  },
  {
    layer: 'Copper screen',
    title: 'The Quotation',
    text: 'Approved requests reach suppliers, who answer with offers drafted by the quotation assistant. Procurement compares them side by side.',
  },
  {
    layer: 'XLPE insulation',
    title: 'The Purchase Order',
    text: 'The winning offer becomes an official PO, insulated from change: the agreed value and quantity are locked in.',
  },
  {
    layer: 'Copper core',
    title: 'The Delivery',
    text: 'Confirmation, packing, shipping and receipt, tracked milestone by milestone until the current reaches its destination.',
  },
];

const FLOW = [
  ['Request created', 'An employee describes the need, the budget and the date it is required.', 'clipboard'],
  ['Department review', 'Managers approve, reject or ask for changes in one click.', 'cable-armour'],
  ['Published', 'Approved requests open up as opportunities in the supplier portal.', 'pylon'],
  ['Quotations in', 'Suppliers answer with structured offers: unit price, total, delivery and terms.', 'coins'],
  ['Side-by-side', 'Procurement compares offers and asks for revisions where needed.', 'cable-section'],
  ['Offer accepted', 'One decision closes the bid and notifies every supplier.', 'clipboard'],
  ['PO issued', 'An official purchase order is generated with locked value and quantity.', 'parcel'],
  ['In production', 'The supplier confirms, prepares and packs the order.', 'factory'],
  ['Shipped', 'Carrier and tracking number travel with the order record.', 'truck'],
  ['Received', 'Only the employee can confirm receipt and complete the order.', 'drum'],
];

const MANIFESTO =
  'We did not just redesign a form. We rewired how Elsewedy buys, so every request travels like current through copper: fast, protected, and never lost on the way.';

function money(value) {
  if (value >= 1_000_000) return { n: value / 1_000_000, suffix: 'M', dec: 2 };
  if (value >= 1000) return { n: value / 1000, suffix: 'K', dec: 0 };
  return { n: value, suffix: '', dec: 0 };
}

function Wordmark() {
  return (
    <span className="lx-wordmark" aria-label="Elsewedy Electric">
      <b>ELSEWEDY</b>
      <b>ELECTRIC</b>
      <i aria-hidden="true" />
    </span>
  );
}

export default function Landing({ requests = [], quotations = [], orders = [], onEnter, signedIn = false, theme = 'light', onToggleTheme }) {
  const root = useRef(null);
  const canvasRef = useRef(null);
  const heroRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [charge, setCharge] = useState(0);
  const [stage, setStage] = useState(-1);
  const [heroP, setHeroP] = useState(0);
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  const stats = useMemo(() => {
    const live = requests.filter((r) => r.status !== 'Draft');
    const value = live.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
    return [
      { label: 'Requests in the grid', value: live.length, dec: 0, suffix: '' },
      { label: 'EGP in motion', ...(() => { const m = money(value); return { value: m.n, dec: m.dec, suffix: m.suffix }; })() },
      { label: 'Awaiting a decision', value: live.filter((r) => r.status === 'Under Review').length, dec: 0, suffix: '' },
      { label: 'Supplier quotations', value: quotations.length, dec: 0, suffix: '' },
      { label: 'Purchase orders issued', value: orders.length, dec: 0, suffix: '' },
    ];
  }, [requests, quotations, orders]);

  // preloader "charging" counter
  useEffect(() => {
    if (reduced) {
      setCharge(100);
      setLoaded(true);
      return undefined;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1700);
      const eased = 1 - Math.pow(1 - t, 3);
      setCharge(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else window.setTimeout(() => setLoaded(true), 250);
    };
    raf = requestAnimationFrame(tick);
    // safety net: never keep the visitor behind the loader
    const fallback = window.setTimeout(() => {
      setCharge(100);
      setLoaded(true);
    }, 3200);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
    };
  }, [reduced]);

  // lock scroll while charging
  useEffect(() => {
    document.documentElement.classList.toggle('lx-lock', !loaded);
    return () => document.documentElement.classList.remove('lx-lock');
  }, [loaded]);

  // landing page always starts dark & at the top
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.classList.add('lx-page');
    document.body.classList.add('lx-body');
    return () => {
      document.documentElement.classList.remove('lx-page');
      document.body.classList.remove('lx-body');
    };
  }, []);

  // 3D cable + all scroll choreography
  useLayoutEffect(() => {
    let scene;
    try {
      scene = createCableScene(canvasRef.current, { reducedMotion: reduced });
    } catch (error) {
      // WebGL unavailable: the static poster stays visible
      root.current?.classList.add('lx-no-webgl');
    }

    const lenis = reduced ? null : new Lenis({ duration: 1.15, smoothWheel: true });
    let tickerFn;
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      tickerFn = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(0);
    }

    const ctx = gsap.context(() => {
      // HERO: the pinned cable story
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate(self) {
          const p = self.progress;
          scene?.setProgress(Math.max(0, (p - 0.1) / 0.85));
          scene?.setIntro(1 - p / 0.1);
          setHeroP(p);
          setStage(p < 0.1 ? -1 : Math.min(4, Math.floor(((p - 0.1) / 0.85) * 5)));
        },
        onToggle(self) {
          if (self.isActive) scene?.resume();
          else scene?.pause();
        },
      });

      if (reduced) return;

      // manifesto words light up one by one
      gsap.fromTo(
        '.lx-manifesto .w',
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.06,
          ease: 'none',
          scrollTrigger: { trigger: '.lx-manifesto', start: 'top 75%', end: 'bottom 45%', scrub: true },
        }
      );

      // the flow: cards light up one by one as the section scrolls through
      ScrollTrigger.create({
        trigger: '.lx-flow',
        start: 'top 75%',
        end: 'bottom 55%',
        scrub: true,
        onUpdate(self) {
          document.querySelector('.lx-flow')?.style.setProperty('--flow', self.progress.toFixed(4));
        },
      });
      gsap.fromTo(
        '.lx-flow-card',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: '.lx-flow-track', start: 'top 85%', once: true } }
      );

      // counters
      gsap.utils.toArray('.lx-stat b[data-to]').forEach((el) => {
        const to = Number(el.dataset.to);
        const dec = Number(el.dataset.dec || 0);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: to,
          duration: 2,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate() {
            el.textContent = obj.v.toFixed(dec);
          },
        });
      });

      // generic reveals
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 60, opacity: 0, filter: 'blur(8px)' },
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 1.1,
            ease: 'expo.out',
            delay: Number(el.dataset.reveal || 0),
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          }
        );
      });

      // giant footer word slides in
      gsap.fromTo(
        '.lx-giant span',
        { yPercent: 110 },
        { yPercent: 0, stagger: 0.04, ease: 'expo.out', duration: 1.4, scrollTrigger: { trigger: '.lx-giant', start: 'top 90%', once: true } }
      );
    }, root);

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      root.current?.style.setProperty('--sp', max > 0 ? (window.scrollY / max).toFixed(4) : '0');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const onAnchor = (e) => {
      const a = e.target.closest('a[href^="#lx-"]');
      if (!a) return;
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      if (lenis) lenis.scrollTo(target, { offset: 0 });
      else target.scrollIntoView();
    };
    root.current?.addEventListener('click', onAnchor);
    const rootEl = root.current;

    return () => {
      rootEl?.removeEventListener('click', onAnchor);
      window.removeEventListener('scroll', onScroll);
      ctx.revert();
      if (tickerFn) gsap.ticker.remove(tickerFn);
      lenis?.destroy();
      scene?.dispose();
    };
  }, [reduced]);

  // custom cursor + magnetic buttons (fine pointers only)
  useEffect(() => {
    if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    const dot = document.querySelector('.lx-cursor');
    const ring = document.querySelector('.lx-cursor-ring');
    if (!dot || !ring) return undefined;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let raf = 0;
    const move = (e) => {
      x = e.clientX;
      y = e.clientY;
      const hot = e.target.closest('a,button,[data-hot]');
      ring.classList.toggle('hot', Boolean(hot));
    };
    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      dot.style.transform = `translate(${x}px,${y}px)`;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    const magnets = Array.from(document.querySelectorAll('[data-magnet]'));
    const mag = (e) => {
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${mx * 0.25}px, ${my * 0.3}px)`;
    };
    const reset = (e) => {
      e.currentTarget.style.transform = '';
    };
    magnets.forEach((m) => {
      m.addEventListener('pointermove', mag);
      m.addEventListener('pointerleave', reset);
    });
    window.addEventListener('pointermove', move, { passive: true });
    raf = requestAnimationFrame(loop);
    document.documentElement.classList.add('lx-has-cursor');
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      magnets.forEach((m) => {
        m.removeEventListener('pointermove', mag);
        m.removeEventListener('pointerleave', reset);
      });
      document.documentElement.classList.remove('lx-has-cursor');
    };
  }, [reduced, loaded]);

  const introOpacity = Math.max(0, 1 - heroP / 0.08);

  return (
    <div className={`lx ${loaded ? 'is-loaded' : ''} ${theme === 'dark' ? 'is-dark' : ''}`} ref={root}>
      <div className="lx-progress" aria-hidden="true"><i /></div>
      <div className="lx-cursor" aria-hidden="true" />
      <div className="lx-cursor-ring" aria-hidden="true" />
      <div className="lx-grain" aria-hidden="true" />

      {/* PRELOADER */}
      <div className="lx-loader" aria-hidden={loaded}>
        <div className="lx-loader-inner">
          <Wordmark />
          <div className="lx-loader-meter">
            <span style={{ transform: `scaleX(${charge / 100})` }} />
          </div>
          <div className="lx-loader-row">
            <small>ENERGISING THE GRID</small>
            <strong>{String(charge).padStart(3, '0')}<em>%</em></strong>
          </div>
        </div>
      </div>

      {/* NAV */}
      <header className="lx-nav">
        <a href="#lx-top" className="lx-nav-brand" aria-label="Back to top">
          <Wordmark />
        </a>
        <nav aria-label="Sections">
          <a href="#lx-cable">The cable</a>
          <a href="#lx-flow">The flow</a>
          <a href="#lx-portals">Portals</a>
          <a href="#lx-platform">Platform</a>
        </nav>
        <div className="lx-nav-actions">
        {onToggleTheme && (
          <button className="lx-theme" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            <span className="lx-theme-track"><i /></span>
          </button>
        )}
        <button className="lx-btn lx-btn-ghost" data-magnet onClick={() => onEnter()}>
          {signedIn ? 'Open portal' : 'Sign in'} <span aria-hidden="true">→</span>
        </button>
        </div>
      </header>

      <main>
        {/* HERO: 3D cable stripped by scroll */}
        <section className="lx-hero" id="lx-top" ref={heroRef}>
          <div className="lx-hero-sticky" id="lx-cable">
            <canvas ref={canvasRef} className="lx-canvas" aria-label="3D medium-voltage cable being stripped layer by layer" role="img" />
            <div className="lx-hero-glow" aria-hidden="true" />

            <div className="lx-hero-intro" style={{ opacity: introOpacity, transform: `translateY(${heroP * -260}px)` }}>
              <p className="lx-kicker"><span className="lx-live" /> Procurement &amp; Supplier Portal</p>
              <h1 className="lx-display">
                <span className="lx-line"><span>Every decision</span></span>
                <span className="lx-line"><span>carries a <em>current.</em></span></span>
              </h1>
              <p className="lx-lede">
                One grid for purchase requests, approvals, supplier quotations and purchase orders, engineered with the same discipline as the cables we make.
              </p>
              <div className="lx-hero-cta">
                <button className="lx-btn lx-btn-primary" data-magnet onClick={() => onEnter()}>
                  Enter the portal <span aria-hidden="true">→</span>
                </button>
                <a className="lx-btn lx-btn-ghost" href="#lx-flow">See the flow</a>
              </div>
            </div>

            <div className="lx-scroll-cue" style={{ opacity: introOpacity }} aria-hidden="true">
              <span />
              Scroll to strip the cable
            </div>

            <ol className="lx-stages" aria-label="The procurement journey, layer by layer">
              {STAGES.map((s, i) => (
                <li key={s.title} className={stage === i ? 'on' : stage > i ? 'past' : ''}>
                  <span className="lx-stage-no">0{i + 1}</span>
                  <span className="lx-stage-layer">{s.layer}</span>
                  <h2>{s.title}</h2>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>

            <div className="lx-rail" aria-hidden="true">
              {STAGES.map((s, i) => (
                <span key={s.title} className={stage >= i ? 'on' : ''}>
                  <i />
                  <small>{s.title.replace('The ', '')}</small>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* MANIFESTO */}
        <section className="lx-manifesto" aria-label="Manifesto">
          <p className="lx-kicker">Why this exists</p>
          <p className="lx-manifesto-text">
            {MANIFESTO.split(' ').map((word, i) => (
              <span className="w" key={i}>{word} </span>
            ))}
          </p>
        </section>

        {/* FLOW */}
        <section className="lx-flow" id="lx-flow" aria-label="End-to-end flow">
          <div className="lx-flow-head">
            <p className="lx-kicker">The flow</p>
            <h2 className="lx-h2">Ten steps.<br /><em>Zero</em> lost requests.</h2>
          </div>
          <div className="lx-flow-track">
            {FLOW.map(([title, text, img], i) => (
              <article className="lx-flow-card" key={title} style={{ '--i': i }}>
                <img className="lx-flow-img" src={`./assets/cables/${img}.webp`} alt="" />
                <span className="lx-flow-no">{String(i + 1).padStart(2, '0')}</span>
                <span className="lx-flow-node" aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* LIVE NUMBERS */}
        <section className="lx-stats" aria-label="Live workspace numbers">
          <div className="lx-stats-head" data-reveal>
            <p className="lx-kicker"><span className="lx-live" /> Live from this workspace</p>
            <h2 className="lx-h2">Numbers that <em>move</em>.</h2>
            <small>Calculated from the procurement records stored in this browser.</small>
          </div>
          <div className="lx-stats-grid">
            {stats.map((s, i) => (
              <div className="lx-stat" key={s.label} data-reveal={i * 0.08}>
                <b data-to={s.value} data-dec={s.dec}>{reduced ? Number(s.value).toFixed(s.dec) : '0'}</b>
                <em>{s.suffix}</em>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* PORTALS */}
        <section className="lx-portals" id="lx-portals" aria-label="Choose a workspace">
          <div className="lx-portals-head" data-reveal>
            <p className="lx-kicker">Two sides of one grid</p>
            <h2 className="lx-h2">Pick your <em>terminal</em>.</h2>
          </div>
          <div className="lx-portal-row">
            <button className="lx-portal lx-portal-emp" onClick={() => onEnter('employee')} data-reveal>
              <span className="lx-portal-tag">Terminal A</span>
              <h3>Employee<br />Workspace</h3>
              <ul>
                <li>Raise and draft purchase requests</li>
                <li>Approve, reject or request changes</li>
                <li>Compare supplier offers</li>
                <li>Confirm receipt and close orders</li>
              </ul>
              <span className="lx-portal-go">Enter as employee <i>→</i></span>
              <span className="lx-portal-art" aria-hidden="true"><i /><i /><i /></span>
              <img className="lx-portal-img" src="./assets/cables/factory.webp" alt="" />
            </button>
            <button className="lx-portal lx-portal-sup" onClick={() => onEnter('supplier')} data-reveal="0.1">
              <span className="lx-portal-tag">Terminal B</span>
              <h3>Supplier<br />Workspace</h3>
              <ul>
                <li>Browse open procurement opportunities</li>
                <li>Draft quotations with the assistant</li>
                <li>Track every bid milestone</li>
                <li>Update production, shipping and delivery</li>
              </ul>
              <span className="lx-portal-go">Enter as supplier <i>→</i></span>
              <span className="lx-portal-art" aria-hidden="true"><i /><i /><i /></span>
              <img className="lx-portal-img" src="./assets/cables/container.webp" alt="" />
            </button>
          </div>
        </section>

        {/* PLATFORM BENTO */}
        <section className="lx-platform" id="lx-platform" aria-label="Platform features">
          <div className="lx-platform-head" data-reveal>
            <p className="lx-kicker">Under the sheath</p>
            <h2 className="lx-h2">Built to be <em>used</em>, not just seen.</h2>
          </div>
          <div className="lx-bento">
            <article className="lx-tile lx-tile-ai" data-reveal>
              <span className="lx-tile-tag">Quotation assistant</span>
              <h3>Describe the offer. Get a structured quotation.</h3>
              <img className="lx-tile-img lx-tile-img-xl" src="./assets/cables/cable-strands.webp" alt="" />
              <div className="lx-ai-demo" aria-hidden="true">
                <p className="lx-typed"><span>“250 m of 3×120 mm² cable, EGP 480 per metre, delivery in 3 weeks”</span></p>
                <div className="lx-ai-fields">
                  <span><small>Quantity</small>250 m</span>
                  <span><small>Unit price</small>EGP 480</span>
                  <span><small>Total</small>EGP 120,000</span>
                  <span><small>Delivery</small>21 days</span>
                </div>
              </div>
            </article>
            <article className="lx-tile lx-tile-track" data-reveal="0.08">
              <span className="lx-tile-tag">Tracking</span>
              <h3>Ten-stage request tracking.</h3>
              <img className="lx-tile-img" src="./assets/cables/truck.webp" alt="" />
              <div className="lx-track-demo" aria-hidden="true">
                {Array.from({ length: 10 }).map((_, i) => <i key={i} style={{ '--i': i }} />)}
              </div>
            </article>
            <article className="lx-tile lx-tile-gate" data-reveal="0.16">
              <span className="lx-tile-tag">Approval gate</span>
              <h3>Nothing ships before it is approved.</h3>
              <img className="lx-tile-img lx-tile-img-sm" src="./assets/cables/clipboard.webp" alt="" />
              <div className="lx-gate-demo" aria-hidden="true"><span>Under review</span><i /><span>Approved</span></div>
            </article>
            <article className="lx-tile lx-tile-bars" data-reveal="0.04">
              <span className="lx-tile-tag">Analytics</span>
              <h3>Spend you can read at a glance.</h3>
              <img className="lx-tile-img lx-tile-img-sm" src="./assets/cables/coins.webp" alt="" />
              <div className="lx-bars-demo" aria-hidden="true">
                {[42, 68, 51, 86, 64, 95, 72].map((h, i) => <i key={i} style={{ '--h': `${h}%`, '--i': i }} />)}
              </div>
            </article>
            <article className="lx-tile lx-tile-k" data-reveal="0.12">
              <span className="lx-tile-tag">Command palette</span>
              <h3>Jump anywhere in the portal.</h3>
              <div className="lx-keys" aria-hidden="true"><kbd>Ctrl</kbd><span>+</span><kbd>K</kbd></div>
            </article>
            <article className="lx-tile lx-tile-theme" data-reveal="0.2">
              <span className="lx-tile-tag">Two modes</span>
              <h3>Graphite by night. Ivory by day.</h3>
              <div className="lx-theme-demo" aria-hidden="true"><i /><i /></div>
            </article>
          </div>
        </section>

        {/* CTA */}
        <section className="lx-cta" aria-label="Get started">
          <div className="lx-marquee" aria-hidden="true">
            <div>
              {Array.from({ length: 2 }).map((_, k) => (
                <span key={k}>REQUEST <i>●</i> APPROVE <i>●</i> QUOTE <i>●</i> ORDER <i>●</i> DELIVER <i>●</i> </span>
              ))}
            </div>
          </div>
          <h2 className="lx-cta-title" data-reveal>Plug <em>in.</em></h2>
          <button className="lx-btn lx-btn-primary lx-btn-xl" data-magnet onClick={() => onEnter()}>
            Open the portal <span aria-hidden="true">→</span>
          </button>
        </section>
      </main>

      <footer className="lx-footer">
        <div className="lx-giant" aria-hidden="true">
          {'ELSEWEDY'.split('').map((c, i) => <span key={i}>{c}</span>)}
        </div>
        <div className="lx-footer-row">
          <Wordmark />
          <small>Procurement &amp; Supplier Portal · Graduation Project 2026</small>
          <small>Prototype · records are stored locally in this browser</small>
        </div>
      </footer>
    </div>
  );
}
