import { useEffect, useMemo, useRef, useState } from 'react';
import './theme/supplier-base.css';
import CommandPalette from './CommandPalette.jsx';
import { Ambient, CableHero, Count, PageHeading, Robot, RouteContext, SyncToast, Ticker, TruckScene, Wipe, useFx } from './theme/PortalFX.jsx';

const DEFAULT_SUPPLIER_REQUESTS = [
  {
    id: 'PR-2026-1047',
    title: 'Office Ergonomic Chairs',
    category: 'Office Supplies',
    item: 'Ergonomic high-back office chair',
    description: 'Procurement of ergonomic executive and staff chairs for the Cairo headquarters renovation.',
    quantity: 12,
    unit: 'Piece',
    budget: 75000,
    deadline: '2026-12-15',
    publishedDate: '2026-10-18',
    department: 'IT Department',
    location: 'Cairo Office - Smart Village',
    status: 'Open',
    priority: 'Medium',
    specs: [
      'High-density molded foam cushion with breathable mesh back',
      'Multi-axis adjustable 3D armrests and lumbar support',
      'Class 4 heavy-duty pneumatic gas lift mechanism',
      'Minimum 3-year commercial warranty with parts availability'
    ],
    delivery: 'Delivery to Cairo Office during standard business hours (9 AM - 4 PM). Offloading required.',
    instructions: 'Submit itemized unit prices in EGP. Include product brochure, warranty terms, and confirmed delivery lead time.',
    attachmentName: 'Chairs_Technical_Specifications_v2.pdf'
  },
  {
    id: 'PR-2026-1052',
    title: 'Industrial Cable Connectors & Terminals',
    category: 'Electrical Supplies',
    item: 'Heavy-duty industrial cable lugs and connectors',
    description: 'High-voltage copper compression connectors and lugs for medium-voltage power distribution projects.',
    quantity: 250,
    unit: 'Piece',
    budget: 145000,
    deadline: '2026-12-20',
    publishedDate: '2026-10-22',
    department: 'Operations',
    location: 'Main Factory, 10th of Ramadan City',
    status: 'Open',
    priority: 'High',
    specs: [
      'High-conductivity electrolytic copper (99.9% purity), tin-plated',
      'Compliant with IEC 61238-1 standards for power cables',
      'Rated for medium-voltage up to 36 kV applications',
      'Clear cross-section and die code markings stamped on barrel'
    ],
    delivery: 'Delivery to Elsewedy Factory Warehouse, 10th of Ramadan City. Certificate of conformity required with shipment.',
    instructions: 'Include factory test certificates and manufacturer warranty. Quotes in EGP preferred.',
    attachmentName: 'Connectors_IEC_Standards_Specs.pdf'
  },
  {
    id: 'PR-2026-1055',
    title: 'Enterprise Managed Network Switches',
    category: 'IT Equipment',
    item: '48-Port PoE+ Gigabit Enterprise Switch',
    description: 'Layer 3 stackable PoE+ switches for office network expansion and IP telephony infrastructure.',
    quantity: 8,
    unit: 'Piece',
    budget: 42000,
    deadline: '2026-12-25',
    publishedDate: '2026-10-25',
    department: 'IT Department',
    location: 'Cairo Office - Smart Village',
    status: 'Closing Soon',
    priority: 'High',
    specs: [
      '48 × 10/100/1000Base-T PoE+ ports with 740W power budget',
      '4 × 10G SFP+ uplink ports with hardware stacking support',
      'Layer 3 dynamic routing (OSPF, RIP, static)',
      'Dual redundant hot-swappable AC power supplies included'
    ],
    delivery: 'Delivery within 14 business days to Cairo Office. Configuration staging assistance requested.',
    instructions: 'Official authorized partner letter required. Include 3-year 24/7 vendor support package.',
    attachmentName: 'Enterprise_Network_Switches_RFP.pdf'
  }
];

const ORDER_LIFECYCLE_STAGES = [
  'Purchase Order Issued',
  'Awaiting Supplier Confirmation',
  'Confirmed',
  'In Preparation',
  'Packaging in Progress',
  'Packaged',
  'Ready for Shipment',
  'Shipped',
  'In Transit',
  'Delivered',
  'Awaiting Employee Receipt Confirmation',
  'Completed'
];

const REQUEST_QUOTATION_STAGES = [
  'Request Published',
  'Supplier Viewed Request',
  'Quotation in Preparation',
  'Quotation Submitted',
  'Employee Reviewing Quotation',
  'Revision Requested',
  'Quotation Accepted or Rejected',
  'Purchase Order Issued'
];

const money = (val, currency = 'EGP') => `${currency} ${Number(val || 0).toLocaleString('en-US')}`;
const readJSON = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val));
  window.dispatchEvent(new CustomEvent('commerce-update'));
};

export const Icon = ({ name, size = 18 }) => {
  const paths = {
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
    moon: <path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5 8.5 8.5 0 1 0 20.5 14.1Z"/>,
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
    list: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    track: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
    check: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m8 15 4-5 4 3 5-7"/></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 1 2.5 2 1-2 1-1 2.5-1-2.5-2-1 2-1 1-2.5Z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.5 2.6-1.7-.6a8 8 0 0 1-1.8 1l-.3 1.8h-3l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.6-1.5-2.6 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.5-2.6 1.7.6a8 8 0 0 1 1.8-1l.3-1.8h3l.3 1.8a8 8 0 0 1 1.8 1l1.7-.6 1.5 2.6-1.4 1.1a7 7 0 0 1 0 2Z"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.5 4.5"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    print: <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
    box: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    truck: <><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.file}
    </svg>
  );
};

export function Brand({ subtitle = 'SUPPLIER PORTAL' }) {
  return (
    <div className="brand-mark" aria-label="Elsewedy Electric">
      <strong>ELSEWEDY</strong>
      <strong>ELECTRIC</strong>
      <span />
      {subtitle && <small className="brand-subtitle">{subtitle}</small>}
    </div>
  );
}


function Card({ children, className = '', id, onClick }) {
  return (
    <section id={id} className={`card ${className}`} onClick={onClick}>
      {children}
    </section>
  );
}

function Button({ children, variant = 'primary', icon, onClick, type = 'button', className = '', disabled }) {
  return (
    <button type={type} className={`button button-${variant} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
      {icon && <Icon name={icon} size={15} />}
    </button>
  );
}

function StatusPill({ status }) {
  const slug = (status || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return <span className={`status-pill status-${slug}`}>{status}</span>;
}

function DetailRows({ rows }) {
  return (
    <dl className="detail-rows">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

function Modal({ title, close, children }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <button className="modal-close" onClick={close} aria-label="Close">
          <Icon name="close" size={16} />
        </button>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

/* =========================================================================
   ROLE GATE / INITIAL AUTHENTICATION SCREEN
   ========================================================================= */
export function RoleGate({ onLogin, initialRole = '', onHome }) {
  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gateTheme, setGateTheme] = useState(() => localStorage.getItem('volt-theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = gateTheme;
    localStorage.setItem('volt-theme', gateTheme);
  }, [gateTheme]);

  return (
    <div className="role-gate">
      <Ambient />
      <header className="role-gate-header">
        <Brand subtitle="ENTERPRISE PORTAL" />
        <div className="role-gate-actions">
          {onHome && (
            <button type="button" className="gate-home-link" onClick={onHome}>
              ← Back to the story
            </button>
          )}
          <button
            className="icon-button theme-toggle"
            onClick={() => setGateTheme((c) => (c === 'dark' ? 'light' : 'dark'))}
            aria-label="Toggle theme"
            title={`Switch to ${gateTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <Icon name={gateTheme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </div>
      </header>

      <section className="gate-visual" aria-hidden="true">
        <CableHero view="cutaway" />
        <div className="gate-visual-copy">
          <p className="eyebrow">Section A–A · medium-voltage cable</p>
          <h2>Every decision carries a <em>current.</em></h2>
        </div>
      </section>

      <div className="role-gate-main">
        {!role ? (
          <div className="gate-panel card">
            <p className="eyebrow">UNIFIED ENTERPRISE PLATFORM</p>
            <h1>Elsewedy Electric Procurement</h1>
            <p>Select your workspace to continue to procurement requests, quotation management, and order fulfillment tracking.</p>

            <div className="role-cards">
              <button type="button" className="role-card-btn" onClick={() => setRole('employee')}>
                <div className="role-icon">
                  <Icon name="home" size={24} />
                </div>
                <strong>Employee Portal</strong>
                <small>Create and track purchase requests, manage department approvals, review supplier offers, and confirm receipt.</small>
                <b className="role-link">Access Employee Portal →</b>
              </button>

              <button type="button" className="role-card-btn" onClick={() => setRole('supplier')}>
                <div className="role-icon">
                  <Icon name="users" size={24} />
                </div>
                <strong>Supplier Portal</strong>
                <small>Explore procurement opportunities, build quotations with AI, track quotation reviews, and manage PO deliveries.</small>
                <b className="role-link">Access Supplier Portal →</b>
              </button>
            </div>

            <p className="data-boundary-note">Development prototype · account selection and records are stored locally in this browser. Sign-in is not verified by a server.</p>
          </div>
        ) : (
          <form
            className="gate-panel gate-login card"
            onSubmit={(e) => {
              e.preventDefault();
              onLogin({
                role,
                name: role === 'supplier' ? 'Delta Business Supplies' : 'Fares Ahmed',
                email: email || (role === 'supplier' ? 'supplier@demo.com' : 'fares@elsewedy.com')
              });
            }}
          >
            <button type="button" className="back-link" onClick={() => setRole('')}>
              ← Choose another workspace
            </button>
            <p className="eyebrow">{role === 'supplier' ? 'SUPPLIER WORKSPACE' : 'EMPLOYEE WORKSPACE'}</p>
            <h1>Sign in</h1>
            <p>Enter your {role === 'supplier' ? 'supplier' : 'employee'} account details to continue. This development prototype checks required fields locally and does not verify credentials with a server.</p>

            <label className="field">
              <span>Email address <i>*</i></span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'supplier' ? 'supplier@demo.com' : 'fares@elsewedy.com'}
              />
            </label>

            <label className="field">
              <span>Password <i>*</i></span>
              <input
                required
                type="password"
                minLength="3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter demo password"
              />
            </label>

            <div className="form-actions" style={{ marginTop: '16px' }}>
              <Button type="submit" icon="arrow">Sign In →</Button>
            </div>

            <p className="auth-local-note">Use a valid email and password to open the selected workspace. Logging out returns you here to choose another role.</p>
          </form>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   SUPPLIER PORTAL MAIN WORKSPACE COMPONENT
   ========================================================================= */
export default function SupplierPortal({
  session,
  onLogout,
  theme,
  setTheme,
  employeeRequests = [],
  quotations = [],
  setQuotations,
  orders = [],
  setOrders
}) {
  const [active, setActive] = useState('dashboard');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState('entering');
  useFx(`supplier-${active}`);
  const transitionTimer = useRef(null);

  // Company Profile
  const [company, setCompany] = useState(() =>
    readJSON('supplier-company', {
      name: session?.name || 'Delta Business Supplies',
      id: 'SUP-2048',
      contact: 'Mina Hassan',
      email: session?.email || 'supplier@demo.com',
      phone: '+20 2 2795 8400',
      country: 'Egypt',
      address: 'Plot 14, Industrial Zone, 10th of Ramadan City, Egypt',
      taxId: 'EG-928-104-582',
      commercialReg: 'CR-104829-Cairo',
      category: 'Electrical Supplies, Office Supplies, IT Equipment'
    })
  );

  // Quotation assistant & draft state
  const [quoteDraft, setQuoteDraft] = useState(() => readJSON('supplier-active-draft', null));

  function notify(msg) {
    setToast(msg);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(''), 3200);
  }

  function go(page, extraId = null) {
    setMobileNav(false);
    setTransitionPhase('exiting');
    window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => {
      if (page === 'supplier-request-details' || page === 'supplier-request-tracking') {
        if (extraId) setSelectedRequestId(extraId);
      } else if (page === 'order-details' || page === 'order-tracking') {
        if (extraId) setSelectedOrderId(extraId);
      }
      setActive(page);
      setTransitionPhase('entering');
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 380);
  }

  // Combine employee requests approved & published with default opportunities
  const availableRequests = useMemo(() => {
    const publishedEmployee = employeeRequests
      .filter((r) => r.status === 'Approved' && r.visibleToSuppliers)
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        item: r.item || r.title,
        description: r.description || r.justification || 'Approved procurement request published for supplier quotations.',
        quantity: r.quantity,
        unit: r.unit || 'Piece',
        budget: r.cost,
        deadline: r.requiredDate || '2026-12-30',
        publishedDate: r.approvalAt ? new Date(r.approvalAt).toISOString().slice(0, 10) : r.date,
        department: r.department,
        location: r.location || 'Cairo Office',
        status: 'Open',
        priority: r.priority || 'Medium',
        specs: [r.technicalSpecs || r.description || r.item].filter(Boolean),
        delivery: r.notes || 'Deliver according to Elsewedy procurement terms.',
        instructions: 'Please provide quotation with unit price, valid terms, and confirmed delivery schedule.',
        attachmentName: r.attachmentName || ''
      }));

    const combined = [...publishedEmployee];
    // Add default supplier opportunities if not already present by ID
    for (const def of DEFAULT_SUPPLIER_REQUESTS) {
      if (!combined.some((item) => item.id === def.id)) {
        combined.push(def);
      }
    }
    return combined;
  }, [employeeRequests]);

  // Current supplier quotes & orders
  const myQuotations = useMemo(
    () => quotations.filter((q) => q.supplierEmail === session?.email),
    [quotations, session?.email]
  );
  const myOrders = useMemo(
    () => orders.filter((o) => o.supplierEmail === session?.email),
    [orders, session?.email]
  );

  const pendingQuotesCount = myQuotations.filter((q) => ['Submitted', 'Revision Requested'].includes(q.status)).length;
  const activeOrdersCount = myOrders.filter((o) => o.status !== 'Received / Completed').length;
  const notificationsCount = pendingQuotesCount + activeOrdersCount;

  // Selected entities
  const currentRequest =
    availableRequests.find((r) => r.id === selectedRequestId) ||
    availableRequests[0];
  const currentOrder =
    myOrders.find((o) => o.id === selectedOrderId) ||
    myOrders[0];

  // Helper to start or continue a quotation
  function startQuotation(req) {
    setSelectedRequestId(req.id);
    const existing = myQuotations.find((q) => q.requestId === req.id);
    if (existing && existing.status !== 'Draft') {
      notify(`A formal quotation (${existing.id}) has already been submitted for this request.`);
      go('supplier-request-tracking', req.id);
      return;
    }

    const draft = quoteDraft && quoteDraft.requestId === req.id
      ? quoteDraft
      : {
          requestId: req.id,
          requestTitle: req.title,
          product: req.item || req.title,
          brand: '',
          model: '',
          quantity: req.quantity || 1,
          unit: req.unit || 'Piece',
          unitPrice: '',
          total: '',
          currency: 'EGP',
          delivery: '10 business days',
          warranty: '2-Year Commercial Warranty',
          payment: 'Net 30 Days upon delivery and inspection',
          validity: '30 Days from submission',
          conditions: 'Delivery to specified site included in price',
          specs: req.specs ? req.specs.join('\n') : '',
          notes: ''
        };

    setQuoteDraft(draft);
    writeJSON('supplier-active-draft', draft);
    go('ai-assistant', req.id);
  }

  function handleSaveDraft(draft) {
    setQuoteDraft(draft);
    writeJSON('supplier-active-draft', draft);
    notify('Quotation draft saved successfully in this browser.');
  }

  function handleSubmitQuotation(finalQuote) {
    const total = Number(finalQuote.total) || (Number(finalQuote.quantity) || 1) * (Number(finalQuote.unitPrice) || 0);
    const quoteId = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const record = {
      ...finalQuote,
      id: quoteId,
      total,
      unitPrice: Number(finalQuote.unitPrice) || (total / (Number(finalQuote.quantity) || 1)).toFixed(2),
      supplierEmail: session?.email,
      supplierName: company.name,
      supplierContact: company.contact,
      supplierPhone: company.phone,
      submittedAt: now,
      status: 'Submitted',
      feedback: '',
      history: [
        { status: 'Submitted', at: now, by: `${company.name} · Supplier` }
      ]
    };

    const nextQuotes = [record, ...quotations];
    writeJSON('commerce-quotations', nextQuotes);
    setQuotations(nextQuotes);
    setQuoteDraft(null);
    localStorage.removeItem('supplier-active-draft');
    notify(`Quotation ${quoteId} submitted successfully for review.`);
    go('supplier-request-tracking', finalQuote.requestId);
  }

  // Update operational order status (Supplier cannot mark complete!)
  function handleOrderTransition(orderId, targetStatus, updateData = {}) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (targetStatus === 'Received / Completed' || targetStatus === 'Completed') {
      notify('Final receipt confirmation is strictly an Employee action.');
      return;
    }

    const currentIdx = ORDER_LIFECYCLE_STAGES.indexOf(order.status);
    const targetIdx = ORDER_LIFECYCLE_STAGES.indexOf(targetStatus);

    if (targetIdx <= currentIdx) {
      notify(`Order is already at or past stage: ${targetStatus}.`);
      return;
    }

    const now = new Date().toISOString();
    const event = {
      from: order.status,
      status: targetStatus,
      at: now,
      by: `${company.name} · Supplier`,
      ...updateData
    };

    const updated = {
      ...order,
      ...updateData,
      status: targetStatus,
      updatedAt: now,
      history: [...(order.history || []), event]
    };

    const nextOrders = orders.map((o) => (o.id === orderId ? updated : o));
    writeJSON('commerce-orders', nextOrders);
    setOrders(nextOrders);
    notify(`Order ${orderId} updated to: ${targetStatus}`);
  }

  const NAV_ITEMS = [
    ['dashboard', 'Dashboard', 'home'],
    ['available-requests', 'Available Requests', 'file'],
    ['supplier-request-tracking', 'Request Tracking', 'track'],
    ['ai-assistant', 'AI Quotation Assistant', 'spark'],
    ['my-quotations', 'My Quotations', 'list'],
    ['my-orders', 'My Orders', 'check'],
    ['order-tracking', 'Order Tracking', 'truck'],
    ['messages', 'Activity & Alerts', 'bell'],
    ['company-profile', 'Company Profile', 'settings'],
    ['settings', 'Settings', 'settings'],
    ['help', 'Help & Support', 'check']
  ];

  const companyInitials = company.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const tickerItems = [
    ...availableRequests.map((r) => ({ id: r.id, text: `${r.title} · open for quotes · ${r.quantity} ${r.unit}`, tone: 'hot' })),
    ...myQuotations.map((q) => ({ id: q.id, text: `Quotation · ${q.status}`, tone: q.status === 'Accepted' ? 'ok' : q.status === 'Rejected' ? 'bad' : '' })),
    ...myOrders.map((o) => ({ id: o.id, text: `Order · ${o.status}`, tone: 'ok' })),
  ];
  const commands = [
    ...NAV_ITEMS.map(([id, label]) => ({ id: `nav-${id}`, label, group: 'Pages', hint: 'Go to page', run: () => go(id) })),
    { id: 'act-theme', label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`, group: 'Actions', hint: 'Appearance', run: () => setTheme((c) => (c === 'dark' ? 'light' : 'dark')) },
    { id: 'act-out', label: 'Log out to the story page', group: 'Actions', hint: 'Session', run: () => onLogout() },
    ...availableRequests.map((r) => ({ id: `opp-${r.id}`, label: `${r.id} · ${r.title}`, group: 'Opportunities', hint: r.category, run: () => go('supplier-request-details', r.id) })),
  ];

  return (
    <div className="portal-wrap supplier-app">
      <Ambient />
      <Wipe phase={transitionPhase} />
      <CommandPalette items={commands} />
      <SyncToast />
      <div className="portal">
        {/* ================= SIDEBAR ================= */}
        <aside className={`sidebar ${mobileNav ? 'nav-open' : ''}`}>
          <div className="sidebar-brand">
            <Brand subtitle="SUPPLIER PORTAL" />
          </div>

          <nav className="side-links" aria-label="Supplier Navigation">
            {NAV_ITEMS.map(([id, label, iconName]) => {
              const isCurrent =
                active === id ||
                (active === 'supplier-request-details' && id === 'available-requests') ||
                (active === 'order-details' && id === 'my-orders');
              return (
                <button
                  key={id}
                  className={`nav-link ${isCurrent ? 'active' : ''}`}
                  onClick={() => go(id)}
                  title={label}
                  aria-label={label}
                >
                  <Icon name={iconName} size={18} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="sidebar-user">
            <div className="avatar avatar-supplier">{companyInitials}</div>
            <div>
              <strong>{company.name}</strong>
              <small>Supplier · {company.id}</small>
            </div>
            <button className="logout-button" onClick={onLogout} title="Log out">
              <span>↪</span>
            </button>
          </div>
        </aside>

        {/* ================= MAIN AREA ================= */}
        <main className="main-area">
          <header className="topbar">
            <button className="portal-header-brand" onClick={() => go('dashboard')} aria-label="Return to supplier workspace"><Brand subtitle="SUPPLIER PORTAL" /><span>SUPPLIER WORKSPACE</span></button>
            {active !== 'dashboard' && <button className="workspace-return" onClick={() => go('dashboard')}><span>←</span> ALL DESTINATIONS</button>}
            <button
              className="mobile-menu"
              onClick={() => setMobileNav((open) => !open)}
              aria-label="Toggle navigation"
            >
              <Icon name="menu" size={20} />
            </button>

            <label className="global-search">
              <Icon name="search" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    go('available-requests');
                    notify(search ? `Showing results for “${search}”.` : 'Showing all opportunities.');
                  }
                }}
                placeholder="Search requests, quotations, orders..."
              />
              <button
                onClick={() => {
                  go('available-requests');
                  notify(search ? `Filtering for “${search}”.` : 'Showing all requests.');
                }}
                aria-label="Search"
              >
                <Icon name="arrow" size={16} />
              </button>
            </label>

            <div className="topbar-actions">
              <button
                className="icon-button theme-toggle"
                onClick={() => setTheme((curr) => (curr === 'dark' ? 'light' : 'dark'))}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                aria-pressed={theme === 'dark'}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
              </button>

              <div className="notice-wrap">
                <button
                  className="icon-button"
                  onClick={() => setNoticeOpen((open) => !open)}
                  aria-label="Notifications"
                >
                  <Icon name="bell" size={18} />
                  {notificationsCount > 0 && <i>{notificationsCount}</i>}
                </button>

                {noticeOpen && (
                  <div className="notice-popover" role="status">
                    <strong>Supplier Activity &amp; Alerts</strong>
                    {myQuotations.slice(0, 3).map((q) => (
                      <p key={q.id}>
                        <span className={`dot ${q.status === 'Accepted' ? 'green' : q.status === 'Rejected' ? 'red' : 'orange'}`} />
                        Quotation {q.id} · {q.status}
                      </p>
                    ))}
                    {myOrders.slice(0, 3).map((o) => (
                      <p key={o.id}>
                        <span className="dot blue" />
                        Order {o.id} · {o.status}
                      </p>
                    ))}
                    {myQuotations.length === 0 && myOrders.length === 0 && (
                      <p>No procurement updates yet.</p>
                    )}
                    <button
                      className="text-button"
                      onClick={() => {
                        setNoticeOpen(false);
                        go('messages');
                      }}
                    >
                      View all activity <Icon name="arrow" size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="account-wrap">
                <button className="avatar avatar-small avatar-supplier" onClick={() => setAccountOpen((open) => !open)} aria-label="Open supplier account menu" aria-expanded={accountOpen} title={company.name}>{companyInitials}</button>
                {accountOpen && <div className="account-popover" role="menu"><p className="account-popover-label">SIGNED IN AS</p><strong>{company.name}</strong><small>Supplier · {session?.email}</small><button role="menuitem" onClick={() => { setAccountOpen(false); go('company-profile'); }}>Company profile <Icon name="settings" size={15}/></button><button role="menuitem" onClick={() => { setAccountOpen(false); go('settings'); }}>Portal settings <Icon name="settings" size={15}/></button><button role="menuitem" className="account-logout" onClick={() => { setAccountOpen(false); onLogout(); }}>Log out <span>↗</span></button></div>}
              </div>
            </div>
          </header>

          <Ticker items={tickerItems} />
          <RouteContext.Provider value={active}>
          <div className="page-content">
            <div key={active} className={`screen-transition ${transitionPhase}`}>
              {active === 'dashboard' && (
                <SupplierDashboard
                  company={company}
                  requests={availableRequests}
                  quotations={myQuotations}
                  orders={myOrders}
                  go={go}
                  startQuotation={startQuotation}
                  navItems={NAV_ITEMS}
                />
              )}

              {active === 'available-requests' && (
                <AvailableRequestsPage
                  requests={availableRequests}
                  quotations={myQuotations}
                  search={search}
                  go={go}
                  startQuotation={startQuotation}
                />
              )}

              {active === 'supplier-request-details' && currentRequest && (
                <SupplierRequestDetailsPage
                  request={currentRequest}
                  quotations={myQuotations}
                  orders={myOrders}
                  go={go}
                  startQuotation={startQuotation}
                />
              )}

              {active === 'supplier-request-tracking' && (
                <SupplierRequestTrackingPage
                  requests={availableRequests}
                  selectedId={selectedRequestId}
                  quotations={myQuotations}
                  orders={myOrders}
                  go={go}
                  startQuotation={startQuotation}
                />
              )}

              {active === 'ai-assistant' && (
                <AiQuotationAssistantPage
                  request={currentRequest}
                  draft={quoteDraft}
                  onSaveDraft={handleSaveDraft}
                  onReview={(draft) => {
                    setQuoteDraft(draft);
                    go('review-quotation');
                  }}
                  go={go}
                />
              )}

              {active === 'review-quotation' && quoteDraft && (
                <ReviewQuotationPage
                  quote={quoteDraft}
                  company={company}
                  request={currentRequest}
                  onEdit={() => go('ai-assistant', quoteDraft.requestId)}
                  onSubmit={handleSubmitQuotation}
                  go={go}
                />
              )}

              {active === 'my-quotations' && (
                <MyQuotationsPage
                  quotations={myQuotations}
                  requests={availableRequests}
                  orders={myOrders}
                  go={go}
                />
              )}

              {active === 'my-orders' && (
                <MyOrdersPage
                  orders={myOrders}
                  go={go}
                />
              )}

              {active === 'order-details' && currentOrder && (
                <OrderDetailsPage
                  order={currentOrder}
                  requests={availableRequests}
                  quotations={myQuotations}
                  go={go}
                />
              )}

              {active === 'order-tracking' && (
                <OrderTrackingPage
                  orders={myOrders}
                  selectedId={selectedOrderId}
                  onTransition={handleOrderTransition}
                  go={go}
                />
              )}

              {active === 'messages' && (
                <ActivityMessagesPage
                  quotations={myQuotations}
                  orders={myOrders}
                  go={go}
                />
              )}

              {active === 'company-profile' && (
                <CompanyProfilePage
                  company={company}
                  onSave={(updated) => {
                    setCompany(updated);
                    writeJSON('supplier-company', updated);
                    notify('Company profile updated successfully.');
                  }}
                />
              )}

              {active === 'settings' && <SupplierSettingsPage notify={notify} />}

              {active === 'help' && <SupplierHelpPage go={go} />}
            </div>
          </div>
          </RouteContext.Provider>
        </main>
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

/* =========================================================================
   PAGE 1: DASHBOARD
   ========================================================================= */
function SupplierDashboard({ company, requests, quotations, orders, go, startQuotation, navItems }) {
  const activeOrders = orders.filter((o) => o.status !== 'Received / Completed');
  const inDelivery = orders.filter((o) => ['Shipped', 'In Transit', 'Delivered'].includes(o.status));
  const acceptedQuotes = quotations.filter((q) => q.status === 'Accepted');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const detail = {'dashboard':'Business overview','available-requests':'Find new opportunities','supplier-request-tracking':'Follow bid milestones','ai-assistant':'Build a quotation draft','my-quotations':'Review submitted offers','my-orders':'Manage issued purchase orders','order-tracking':'Follow delivery milestones','messages':'Recent activity and alerts','company-profile':'Company information','settings':'Portal preferences','help':'Guides and support'};
  const SUP_IMG = { 'supplier-request-tracking': 'container', 'ai-assistant': 'cable-section', 'my-quotations': 'coins', 'my-orders': 'parcel', 'order-tracking': 'truck', messages: 'pylon', 'company-profile': 'factory', settings: 'drum', help: 'clipboard' };
  const bidSteps = ['Published', 'Viewed', 'Preparing', 'Submitted', 'Reviewing', 'Revision', 'Decision', 'PO issued'];
  const reach = orders.length ? 7 : acceptedQuotes.length ? 6 : quotations.length ? 3 : requests.length ? 0 : -1;
  const images = ['./assets/cables/drum.webp', './assets/cables/parcel.webp', './assets/cables/container.webp'];

  return (
    <section className="vx-dash vx-dash-supplier">
      <header className="vx-hero">
        <div className="vx-hero-copy">
          <p className="vx-eyebrow"><i className="vx-live" /> Supplier terminal · {company.id}</p>
          <h1 className="vx-title">{greeting},<br /><em>{company.name}.</em></h1>
          <p className="vx-lede">{requests.length} open opportunit{requests.length === 1 ? 'y is' : 'ies are'} ready for your offer. Draft a quotation in one sentence, then review it before anything is sent.</p>
          <div className="vx-hero-actions">
            <button className="vx-btn vx-btn-primary" onClick={() => requests[0] && startQuotation(requests[0])} disabled={!requests.length}>Start a quotation <Icon name="arrow" size={16} /></button>
            <button className="vx-btn vx-btn-glass" onClick={() => window.dispatchEvent(new Event('open-command-palette'))}>Jump anywhere <kbd>Ctrl K</kbd></button>
          </div>
        </div>
        <div className="vx-hero-stage">
          <CableHero view="section" cycle={false} poster="./assets/cables/cable-section.webp" />
          <button className="vx-callout vx-callout-a" onClick={() => go('available-requests')}><small>Open opportunities</small><b><Count value={requests.length} pad={2} /></b></button>
          <div className="vx-callout vx-callout-b"><small>Offers submitted</small><b><Count value={quotations.length} pad={2} /></b></div>
          <button className="vx-callout vx-callout-c" onClick={() => go('my-orders')}><small>Active orders</small><b><Count value={activeOrders.length} pad={2} /></b></button>
        </div>
      </header>

      <div className="vx-kpis">
        {[
          ['Open opportunities', requests.length, 'file', 'Available to quote', Math.min(1, requests.length / 4), 'clipboard'],
          ['Submitted offers', quotations.length, 'list', `${acceptedQuotes.length} accepted`, quotations.length ? acceptedQuotes.length / quotations.length : 0, 'coins'],
          ['Active orders', activeOrders.length, 'check', `${inDelivery.length} in delivery`, activeOrders.length ? inDelivery.length / activeOrders.length : 0, 'parcel'],
          ['Completed', orders.length - activeOrders.length, 'truck', 'Received by Elsewedy', orders.length ? (orders.length - activeOrders.length) / orders.length : 0, 'truck'],
        ].map(([label, value, icon, note, ratio, img], i) => (
          <article className="vx-kpi" data-tilt key={label} style={{ '--i': i, '--v': ratio }}>
            <img className="vx-kpi-img" src={`./assets/cables/${img}.webp`} alt="" />
            <span className="vx-kpi-icon"><Icon name={icon} size={18} /></span>
            <small>{label}</small>
            <strong><Count value={value} pad={2} /></strong>
            <span className="vx-meter"><i /></span>
            <em>{note}</em>
          </article>
        ))}
      </div>

      <section className="vx-opps" aria-label="Latest opportunities">
        <div className="vx-section-head">
          <div><p className="vx-eyebrow">Latest opportunities</p><h2>Ready for your expertise</h2></div>
          <button className="vx-link" onClick={() => go('available-requests')}>All opportunities <Icon name="arrow" size={14} /></button>
        </div>
        <div className="vx-opp-grid">
          {requests.slice(0, 3).map((request, i) => (
            <button key={request.id} className="vx-opp" data-tilt onClick={() => go('supplier-request-details', request.id)} style={{ '--i': i }}>
              <img src={images[i % images.length]} alt="" />
              <span className="vx-opp-meta">{request.id} · {request.category}</span>
              <strong>{request.title}</strong>
              <small>{request.quantity} {request.unit} · closes {request.deadline}</small>
              <span className="vx-opp-go">Explore <Icon name="arrow" size={14} /></span>
            </button>
          ))}
          {!requests.length && <p className="vx-empty">No open opportunities are available right now.</p>}
        </div>
      </section>

      <section className="vx-flow" aria-label="Bid milestones">
        <div className="vx-section-head">
          <div><p className="vx-eyebrow">The current</p><h2>Bid milestones</h2></div>
          <button className="vx-link" onClick={() => go('supplier-request-tracking')}>Open tracking <Icon name="arrow" size={14} /></button>
        </div>
        <div className="vx-flow-line" style={{ '--reach': Math.max(0, reach) / (bidSteps.length - 1) }}>
          <i className="vx-flow-wire" />
          <i className="vx-flow-live" />
          {bidSteps.map((label, i) => (
            <div className={`vx-flow-node ${i <= reach ? 'on' : ''}`} key={label} style={{ '--i': i }}>
              <span className="vx-flow-dot" />
              <strong>{String(i + 1).padStart(2, '0')}</strong>
              <small>{label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="vx-dests" aria-label="Supplier destinations">
        <div className="vx-section-head">
          <div><p className="vx-eyebrow">Destinations</p><h2>Your commercial workflows</h2></div>
          <span className="vx-hint">or press <kbd>Ctrl K</kbd></span>
        </div>
        <nav className="vx-dest-grid">
          {navItems.filter(([id]) => id !== 'dashboard').map(([id, label, icon], i) => (
            <button key={id} className={`vx-dest ${i === 0 ? 'vx-dest-xl' : [2, 3, 5].includes(i) ? 'vx-dest-tall' : ''}`} data-tilt onClick={() => go(id)} style={{ '--i': i }}>
              {i === 0 && <img src="./assets/cables/yard.webp" alt="" className="vx-dest-img" />}
              {i > 0 && SUP_IMG[id] && <img src={`./assets/cables/${SUP_IMG[id]}.webp`} alt="" className={`vx-dest-img ${[2, 3, 5].includes(i) ? '' : 'vx-dest-img-sm'}`} />}
              <span className="vx-dest-no">{String(i + 1).padStart(2, '0')}</span>
              <span className="vx-dest-icon"><Icon name={icon} size={20} /></span>
              <span className="vx-dest-copy"><strong>{label}</strong><small>{detail[id]}</small></span>
              <span className="vx-dest-arrow"><Icon name="arrow" size={16} /></span>
            </button>
          ))}
        </nav>
      </section>
    </section>
  );
}

/* =========================================================================
   PAGE 2: AVAILABLE REQUESTS (SECTION 5 REQUIREMENT)
   ========================================================================= */
function AvailableRequestsPage({ requests, quotations, search, go, startQuotation }) {
  const [query, setQuery] = useState(search || '');
  const [category, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const categories = useMemo(() => ['All', ...new Set(requests.map((r) => r.category).filter(Boolean))], [requests]);

  const filtered = requests.filter((r) => {
    const textMatch = `${r.id} ${r.title} ${r.item} ${r.category} ${r.description}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const catMatch = category === 'All' || r.category === category;
    const statMatch = statusFilter === 'All' || r.status === statusFilter;
    return textMatch && catMatch && statMatch;
  });

  return (
    <>
      <PageHeading
        title="Available Procurement Requests"
        subtitle="Review active tenders published by Elsewedy Electric departments and prepare commercial quotations."
        eyebrow="TENDERS & OPPORTUNITIES"
        action={
          <Button variant="secondary" onClick={() => go('my-quotations')} icon="list">
            View My Quotations
          </Button>
        }
      />

      <section className="supplier-tender-board">
        <div className="filters supplier-tender-filters">
          <label className="filter-search">
            <Icon name="search" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Request ID, title, item, or keyword..."
            />
          </label>

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Closing Soon">Closing Soon</option>
          </select>
        </div>

        <div className="supplier-tender-results"><div className="supplier-ledger-heading"><span>OPEN OPPORTUNITIES</span><strong>{filtered.length} matching requests</strong></div>
          <div className="supplier-tender-list">
              {filtered.map((r) => {
                const quote = quotations.find((q) => q.requestId === r.id);
                const techSummary = r.specs?.[0] || r.description?.slice(0, 60) || 'See detailed specifications';
                return (
                  <article className="supplier-tender-card" key={r.id}>
                    <div className="supplier-tender-rail"><span>{r.category || 'TENDER'}</span><StatusPill status={r.status || 'Open'} /></div>
                    <div className="supplier-tender-copy"><span className="request-id">{r.id} <i>·</i> {r.department || 'Elsewedy Procurement'}</span><h2>{r.title}</h2><p>{r.item || r.title} <i>·</i> {r.quantity} {r.unit || 'Piece'}</p><div className="supplier-tender-spec"><small>TECHNICAL SCOPE</small><span title={techSummary}>{techSummary}</span></div><div className="supplier-tender-meta"><span>Published <b>{r.publishedDate || '2026-10-20'}</b></span><span>Submission deadline <b>{r.deadline}</b></span></div></div>
                    <div className="supplier-tender-actions">
                        <Button
                          variant="outline"
                          onClick={() => go('supplier-request-details', r.id)}
                        >
                          View Details
                        </Button>
                        {quote ? (
                          <Button
                            variant="secondary"
                            onClick={() => go('supplier-request-tracking', r.id)}
                          >
                            Track
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            onClick={() => startQuotation(r)}
                          >
                            Quote
                          </Button>
                        )}
                    </div>
                  </article>
                );
              })}
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">
              <h2>No procurement requests match your filters</h2>
              <p>Try adjusting your search query or selecting a different category.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/* =========================================================================
   PAGE 3: SUPPLIER REQUEST DETAILS (SECTION 5 REQUIREMENT)
   ========================================================================= */
function SupplierRequestDetailsPage({ request, quotations, orders, go, startQuotation }) {
  const quote = quotations.find((q) => q.requestId === request.id);
  const order = orders.find((o) => o.requestId === request.id);

  return (
    <>
      <div className="request-detail-actions">
        <button className="back-link" onClick={() => go('available-requests')}>
          ← Back to Available Requests
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" onClick={() => go('supplier-request-tracking', request.id)}>
            Track Request &amp; Quotation <Icon name="track" size={14} />
          </Button>
        </div>
      </div>

      <Card className="request-summary">
        <div className="summary-icon">
          <Icon name="file" size={26} />
        </div>
        <div className="summary-title">
          <span className="request-id">{request.id}</span>
          <h1>{request.title}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '12px' }}>
            Published: {request.publishedDate || '2026-10-20'} · Department: {request.department || 'Procurement'}
          </p>
        </div>
        <div className="summary-status">
          <StatusPill status={request.status || 'Open'} />
          <span>Deadline: {request.deadline}</span>
          {quote ? (
            <span style={{ color: 'var(--green)', fontWeight: '600' }}>
              Quotation Submitted ({quote.id})
            </span>
          ) : (
            <Button onClick={() => startQuotation(request)} icon="spark">
              Prepare Quotation
            </Button>
          )}
        </div>
      </Card>

      <div className="details-grid">
        {/* Left Column: Scope & Technical Requirements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Card>
            <h2>Request Description &amp; Scope</h2>
            <p className="body-copy">{request.description}</p>
            <DetailRows
              rows={[
                ['Product / Service', request.item || request.title],
                ['Category', request.category],
                ['Required Quantity', `${request.quantity} ${request.unit || 'Piece'}`],
                ['Target Delivery Location', request.location || 'Cairo Headquarters']
              ]}
            />
          </Card>

          <Card>
            <h2>Technical Requirements &amp; Specifications</h2>
            {request.specs && request.specs.length > 0 ? (
              <ul className="spec-list" style={{ margin: '12px 0 0', paddingLeft: '20px', lineHeight: '1.7', fontSize: '12px' }}>
                {request.specs.map((spec, i) => (
                  <li key={i}>{spec}</li>
                ))}
              </ul>
            ) : (
              <p className="body-copy">Standard specifications apply. Please consult attached documents.</p>
            )}
          </Card>

          <Card>
            <h2>Available Attachments</h2>
            {request.attachmentName ? (
              <div className="attachment-row" role="note">
                <span className="file-icon">PDF</span>
                <span>
                  {request.attachmentName}
                  <small>Official technical RFP document (local reference)</small>
                </span>
                <Button
                  variant="outline"
                  onClick={() => alert(`Downloading specification: ${request.attachmentName}`)}
                  icon="download"
                >
                  Download
                </Button>
              </div>
            ) : (
              <p className="attachment-empty">No external documents attached to this tender.</p>
            )}
          </Card>
        </div>

        {/* Right Column: Commercial Instructions & Quotation Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Card>
            <h2>Submission Instructions</h2>
            <p className="body-copy">
              {request.instructions ||
                'Please submit your itemized quotation with confirmed unit prices in EGP. Include warranty coverage, delivery lead time, and technical data sheets.'}
            </p>
            <div className="data-boundary-note" style={{ marginTop: '12px' }}>
              Submission Deadline: <strong>{request.deadline}</strong>. Offers submitted after the deadline will be subject to approval.
            </div>
          </Card>

          <Card>
            <h2>Your Quotation Submission Status</h2>
            {quote ? (
              <div style={{ marginTop: '10px' }}>
                <DetailRows
                  rows={[
                    ['Quotation Reference', quote.id],
                    ['Quotation Status', quote.status],
                    ['Submitted Total', money(quote.total, quote.currency)],
                    ['Delivery Proposed', quote.delivery || '—'],
                    ['Warranty Offered', quote.warranty || '—']
                  ]}
                />
                <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" onClick={() => go('supplier-request-tracking', request.id)}>
                    View Quotation Status Tracker →
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '12px' }}>
                <p className="body-copy">You have not submitted a quotation for this request yet.</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                  <Button onClick={() => startQuotation(request)} icon="spark">
                    Prepare with AI Assistant
                  </Button>
                  <Button variant="secondary" onClick={() => startQuotation(request)}>
                    Prepare Manually
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {order && (
            <Card>
              <h2>Official Purchase Order</h2>
              <p className="body-copy">
                A purchase order (<strong>{order.id}</strong>) was issued following acceptance of your quotation.
              </p>
              <Button onClick={() => go('order-details', order.id)} icon="arrow">
                View Purchase Order Details
              </Button>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

/* =========================================================================
   PAGE 4: SUPPLIER REQUEST TRACKING (SECTION 5 & 7 REQUIREMENT)
   ========================================================================= */
function SupplierRequestTrackingPage({ requests, selectedId, quotations, orders, go, startQuotation }) {
  const [currentId, setCurrentId] = useState(selectedId || requests[0]?.id);

  const request = requests.find((r) => r.id === currentId) || requests[0];
  const quote = quotations.find((q) => q.requestId === request?.id);
  const order = orders.find((o) => o.requestId === request?.id);

  if (!request) {
    return (
      <Card className="empty-state">
        <h2>No procurement opportunities found</h2>
        <Button onClick={() => go('available-requests')}>Browse Tenders</Button>
      </Card>
    );
  }

  // Determine stage (0 to 7) in REQUEST_QUOTATION_STAGES
  let currentStageIndex = 0; // Request Published
  if (quote) {
    if (quote.status === 'Draft') currentStageIndex = 2; // Quotation in Preparation
    else if (quote.status === 'Submitted') currentStageIndex = 3; // Quotation Submitted
    else if (quote.status === 'Under Review') currentStageIndex = 4; // Employee Reviewing
    else if (quote.status === 'Revision Requested') currentStageIndex = 5; // Revision Requested
    else if (quote.status === 'Accepted') currentStageIndex = 6; // Accepted
    else if (quote.status === 'Rejected') currentStageIndex = 6; // Rejected
  }
  if (order) {
    currentStageIndex = 7; // Purchase Order Issued
  }

  const stageDescriptions = [
    'The procurement request was formally published to the supplier network.',
    'Supplier accessed and reviewed the tender documentation.',
    'Quotation draft is being compiled with commercial and technical terms.',
    quote ? `Quotation ${quote.id} formally submitted on ${new Date(quote.submittedAt).toLocaleDateString()}.` : 'Quotation has not been submitted yet.',
    quote?.status === 'Under Review' ? 'Elsewedy procurement committee is actively evaluating the quotation.' : 'Pending quotation review by procurement.',
    quote?.status === 'Revision Requested' ? `Procurement feedback: ${quote.feedback || 'Please update delivery timeline.'}` : 'No revision requested at this time.',
    quote?.status === 'Accepted' ? 'Quotation accepted by procurement committee.' : quote?.status === 'Rejected' ? 'Quotation was declined.' : 'Awaiting committee decision.',
    order ? `Official Purchase Order ${order.id} issued.` : 'Purchase Order is issued strictly upon quotation acceptance.'
  ];

  return (
    <>
      <PageHeading
        title="Supplier Request &amp; Quotation Tracking"
        subtitle="Track the commercial lifecycle of this tender from publication to quotation evaluation and purchase order issuance."
        eyebrow="QUOTATION LIFECYCLE TRACKER"
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={() => go('supplier-request-details', request.id)}>
              Request Details
            </Button>
            {!quote && (
              <Button onClick={() => startQuotation(request)} icon="spark">
                Submit Quotation
              </Button>
            )}
          </div>
        }
      />

      <div className="filters" style={{ gridTemplateColumns: '1.5fr auto', marginBottom: '14px' }}>
        <select value={currentId} onChange={(e) => setCurrentId(e.target.value)}>
          {requests.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id} — {r.title} ({r.category})
            </option>
          ))}
        </select>
        <span style={{ fontSize: '12px', color: 'var(--muted)', alignSelf: 'center' }}>
          Deadline: {request.deadline}
        </span>
      </div>

      <Card className="request-summary">
        <div className="summary-icon">
          <Icon name="track" size={26} />
        </div>
        <div className="summary-title">
          <span className="request-id">{request.id}</span>
          <h1>{request.title}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '12px' }}>
            Category: {request.category} · Quantity: {request.quantity} {request.unit}
          </p>
        </div>
        <div className="summary-status">
          <StatusPill status={quote ? quote.status : 'No Offer Submitted'} />
          <span>Stage: {REQUEST_QUOTATION_STAGES[currentStageIndex]}</span>
        </div>
      </Card>

      {/* Approval & PO Notice */}
      {!quote && (
        <p className="data-boundary-note">
          No quotation has been submitted for this request yet. Submit your commercial offer before the deadline ({request.deadline}) to enter the review process.
        </p>
      )}

      {quote?.status === 'Revision Requested' && (
        <div className="data-boundary-note" style={{ borderLeftColor: '#dd7c35' }}>
          <strong>Revision Requested:</strong> {quote.feedback || 'Please review price and lead time specifications.'}
        </div>
      )}

      {quote?.status === 'Accepted' && !order && (
        <p className="data-boundary-note">
          Quotation accepted! Awaiting official Purchase Order issuance by the procurement department. Full shipment and delivery tracking begins after the PO is generated.
        </p>
      )}

      {order && (
        <div className="data-boundary-note" style={{ borderLeftColor: 'var(--green)' }}>
          <strong>Purchase Order Generated ({order.id}):</strong> Commercial quotation accepted. Full fulfillment and shipment tracking is active in Order Tracking.
          <div style={{ marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => go('order-tracking', order.id)}>
              Open Purchase Order Tracking →
            </Button>
          </div>
        </div>
      )}

      <Card className="request-tracking-card" style={{ marginTop: '14px' }}>
        <DetailRows
          rows={[
            ['Tender Request ID', request.id],
            ['Tender Status', request.status || 'Open'],
            ['Submission Deadline', request.deadline],
            ['Your Quotation ID', quote ? quote.id : 'None'],
            ['Quotation Amount', quote ? money(quote.total, quote.currency) : '—'],
            ['Quotation Submission Date', quote ? new Date(quote.submittedAt).toLocaleDateString() : '—'],
            ['Decision Status', quote?.status || 'Awaiting Submission'],
            ['Related Purchase Order', order ? order.id : 'Pending PO Creation']
          ]}
        />

        <div className="request-timeline" style={{ marginTop: '24px' }}>
          {REQUEST_QUOTATION_STAGES.map((stageName, i) => {
            const isDone = i < currentStageIndex;
            const isCurrent = i === currentStageIndex;
            const isBlocked = quote?.status === 'Rejected' && i >= 6;

            return (
              <div
                key={stageName}
                className={`request-stage ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''} ${isBlocked ? 'blocked' : ''}`}
              >
                <span>{isDone ? '✓' : isBlocked ? '×' : String(i + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{stageName}</strong>
                  <small>
                    {isCurrent ? 'Current Active Step' : isDone ? 'Completed' : isBlocked ? 'Blocked by Decision' : 'Upcoming Step'}
                  </small>
                  <p>{stageDescriptions[i]}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="data-boundary-note" style={{ marginTop: '20px' }}>
          <strong>Note:</strong> Tender quotation tracking is separate from Purchase Order delivery tracking. Quotation acceptance initiates PO generation.
        </p>
      </Card>
    </>
  );
}

/* =========================================================================
   PAGE 5: AI QUOTATION ASSISTANT
   ========================================================================= */
function AiQuotationAssistantPage({ request, draft, onSaveDraft, onReview, go }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello! I am your Elsewedy Smart Quotation Assistant. Describe your commercial offer for ${request?.id || 'this request'} in plain English (e.g., "12 chairs at 4,500 EGP each with 10 days delivery and 2 years warranty"). I will populate the quotation fields accurately.`
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [form, setForm] = useState(() => draft || {
    requestId: request?.id || 'PR-2026-1047',
    requestTitle: request?.title || 'Commercial Tender',
    product: request?.item || request?.title || '',
    brand: '',
    model: '',
    quantity: request?.quantity || 1,
    unit: request?.unit || 'Piece',
    unitPrice: '',
    total: '',
    currency: 'EGP',
    delivery: '10 business days',
    warranty: '2-Year Commercial Warranty',
    payment: 'Net 30 Days upon inspection',
    validity: '30 Days from submission',
    conditions: 'Standard Elsewedy site delivery',
    specs: request?.specs ? request.specs.join('\n') : '',
    notes: ''
  });

  const setField = (key) => (e) => {
    const val = e.target.value;
    setForm((curr) => {
      const next = { ...curr, [key]: val };
      if (key === 'quantity' && next.unitPrice) {
        next.total = String((Number(val) || 0) * (Number(next.unitPrice) || 0));
      } else if (key === 'unitPrice' && next.quantity) {
        next.total = String((Number(next.quantity) || 0) * (Number(val) || 0));
      } else if (key === 'total' && Number(next.quantity) > 0) {
        next.unitPrice = (Number(val) / Number(next.quantity)).toFixed(2);
      }
      return next;
    });
  };

  function parseInput(text = userInput) {
    const t = text.trim();
    if (!t) return;

    setMessages((m) => [...m, { role: 'user', text: t }]);
    setUserInput('');

    let updated = { ...form };
    const missing = [];

    // Parse currency
    const currMatch = t.match(/\b(USD|EUR|EGP|GBP)\b/i);
    if (currMatch) updated.currency = currMatch[1].toUpperCase();

    // Parse quantity
    const qtyMatch = t.match(/(\d+)\s*(?:pieces?|units?|chairs?|laptops?|items?|switches?|connectors?)/i);
    if (qtyMatch) updated.quantity = Number(qtyMatch[1]);

    // Parse price
    const unitPriceMatch = t.match(/(?:unit price|each|per unit|per piece|unit of)\s*(?:of|is|:)?\s*([\d,]+(?:\.\d+)?)/i);
    const totalPriceMatch = t.match(/(?:total|overall|sum of|amount of)\s*(?:price of|is|:)?\s*([\d,]+(?:\.\d+)?)/i);

    if (unitPriceMatch) {
      const p = Number(unitPriceMatch[1].replace(/,/g, ''));
      updated.unitPrice = String(p);
      updated.total = String(p * (Number(updated.quantity) || 1));
    } else if (totalPriceMatch) {
      const tot = Number(totalPriceMatch[1].replace(/,/g, ''));
      updated.total = String(tot);
      if (Number(updated.quantity) > 0) {
        updated.unitPrice = (tot / Number(updated.quantity)).toFixed(2);
      }
    } else {
      const generalNum = t.match(/(?:at|for|costing|price)\s*([\d,]+(?:\.\d+)?)/i);
      if (generalNum) {
        const p = Number(generalNum[1].replace(/,/g, ''));
        updated.unitPrice = String(p);
        updated.total = String(p * (Number(updated.quantity) || 1));
      }
    }

    // Parse delivery
    const deliveryMatch = t.match(/(\d+)\s*(?:days?|weeks?|months?)\s*(?:delivery|lead time)?/i);
    if (deliveryMatch) updated.delivery = `${deliveryMatch[1]} days lead time`;

    // Parse warranty
    const warrantyMatch = t.match(/(\d+)\s*(?:years?|months?)\s*warranty/i);
    if (warrantyMatch) updated.warranty = `${warrantyMatch[1]} Year Warranty`;

    if (!updated.unitPrice && !updated.total) missing.push('Price (unit or total)');
    if (!updated.delivery) missing.push('Delivery lead time');

    setForm(updated);

    const reply = missing.length > 0
      ? `I updated your quotation details. Please clarify or specify: ${missing.join(', ')}.`
      : `Quotation parameters parsed successfully. Total calculated at ${money(updated.total, updated.currency)}. You can edit any field before reviewing.`;

    setMessages((m) => [...m, { role: 'assistant', text: reply }]);
  }

  return (
    <>
      <PageHeading
        title="AI Quotation Assistant"
        subtitle={`Preparing formal commercial offer for ${request?.id || form.requestId} — ${request?.title || form.requestTitle}.`}
        eyebrow="INTELLIGENT OFFER BUILDER"
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={() => go('supplier-request-details', request?.id)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => onSaveDraft(form)}>
              Save Draft
            </Button>
            <Button onClick={() => onReview(form)} icon="arrow">
              Review Quotation →
            </Button>
          </div>
        }
      />

      <div className="assistant-layout">
        {/* Chat / Natural Language side */}
        <Card className="chat-card supplier-chat-card">
          <div className="chat-messages" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`chat-message ${m.role}`}>
                <span className="chat-avatar">{m.role === 'assistant' ? 'AI' : 'YOU'}</span>
                <p>{m.text}</p>
              </div>
            ))}
          </div>

          <div className="suggestion-row">
            {[
              `Supply 12 units at 4,800 EGP each, delivery 10 days`,
              `Total price 140,000 EGP with 3-year warranty`,
              `Unit price 1,800 EGP, delivery in 14 days, Net 30`
            ].map((s) => (
              <button key={s} type="button" onClick={() => parseInput(s)}>
                {s}
              </button>
            ))}
          </div>

          <form
            className="chat-compose"
            onSubmit={(e) => {
              e.preventDefault();
              parseInput();
            }}
          >
            <input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type quotation details (pricing, delivery, warranty)..."
            />
            <Button type="submit" icon="arrow" />
          </form>
          <small className="inline-note">
            Deterministic local parser · values are strictly extracted from your input.
          </small>
        </Card>

        {/* Structured Form */}
        <Card className="quote-form-card">
          <h2>Itemized Quotation Fields</h2>
          <p className="body-copy">Verify and edit every field prior to formal submission.</p>

          <div className="form-grid" style={{ marginTop: '14px' }}>
            <label className="field">
              <span>Product / Service Name <i>*</i></span>
              <input value={form.product} onChange={setField('product')} required />
            </label>

            <label className="field">
              <span>Brand / Manufacturer</span>
              <input value={form.brand} onChange={setField('brand')} placeholder="e.g. Dell, Siemens, Herman Miller" />
            </label>

            <label className="field">
              <span>Model / Part Number</span>
              <input value={form.model} onChange={setField('model')} placeholder="e.g. Model TX-400" />
            </label>

            <label className="field">
              <span>Quantity <i>*</i></span>
              <input type="number" min="1" value={form.quantity} onChange={setField('quantity')} required />
            </label>

            <label className="field">
              <span>Unit of Measure</span>
              <select value={form.unit} onChange={setField('unit')}>
                <option>Piece</option>
                <option>Set</option>
                <option>Box</option>
                <option>Meter</option>
                <option>Service</option>
              </select>
            </label>

            <label className="field">
              <span>Unit Price (EGP) <i>*</i></span>
              <input type="number" step="0.01" min="0" value={form.unitPrice} onChange={setField('unitPrice')} placeholder="0.00" required />
            </label>

            <label className="field">
              <span>Total Price (EGP) <i>*</i></span>
              <input type="number" step="0.01" min="0" value={form.total} onChange={setField('total')} placeholder="0.00" required />
            </label>

            <label className="field">
              <span>Currency</span>
              <select value={form.currency} onChange={setField('currency')}>
                <option value="EGP">EGP - Egyptian Pound</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </label>

            <label className="field">
              <span>Delivery Lead Time <i>*</i></span>
              <input value={form.delivery} onChange={setField('delivery')} placeholder="e.g. 14 calendar days" required />
            </label>

            <label className="field">
              <span>Warranty Period</span>
              <input value={form.warranty} onChange={setField('warranty')} placeholder="e.g. 2 Years on-site" />
            </label>

            <label className="field">
              <span>Payment Terms</span>
              <input value={form.payment} onChange={setField('payment')} placeholder="e.g. Net 30 Days" />
            </label>

            <label className="field">
              <span>Offer Validity</span>
              <input value={form.validity} onChange={setField('validity')} placeholder="e.g. 30 Days" />
            </label>
          </div>

          <label className="field" style={{ marginTop: '10px' }}>
            <span>Technical Specifications</span>
            <textarea rows="3" value={form.specs} onChange={setField('specs')} placeholder="Detailed specs compliance notes..." />
          </label>

          <label className="field" style={{ marginTop: '10px' }}>
            <span>Additional Remarks &amp; Delivery Conditions</span>
            <textarea rows="2" value={form.notes} onChange={setField('notes')} placeholder="Special handling, packaging or inspection notes..." />
          </label>

          <div className="cost-preview" style={{ marginTop: '14px', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
            <span>Calculated Commercial Offer Total</span>
            <strong>{money(form.total, form.currency)}</strong>
          </div>

          <div className="form-actions" style={{ marginTop: '16px' }}>
            <Button variant="secondary" onClick={() => onSaveDraft(form)}>
              Save Draft
            </Button>
            <Button onClick={() => onReview(form)} icon="arrow">
              Review Quotation Document →
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

/* =========================================================================
   PAGE 6: REVIEW QUOTATION (FORMAL ENTERPRISE DOCUMENT)
   ========================================================================= */
function ReviewQuotationPage({ quote, company, request, onEdit, onSubmit, go }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const totalAmount = Number(quote.total) || (Number(quote.quantity) || 1) * (Number(quote.unitPrice) || 0);

  return (
    <>
      <PageHeading
        title="Review Quotation Document"
        subtitle="Carefully inspect all commercial and technical terms before final submission to Elsewedy Electric procurement."
        eyebrow="COMMERCIAL SUBMISSION VERIFICATION"
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={onEdit}>
              Edit Quotation
            </Button>
            <Button variant="secondary" onClick={() => window.print()} icon="print">
              Print / Save PDF
            </Button>
            <Button onClick={() => setConfirmOpen(true)} icon="check">
              Confirm &amp; Submit Offer
            </Button>
          </div>
        }
      />

      <Card className="quotation-document">
        <div className="quotation-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--red)', paddingBottom: '16px' }}>
          <Brand subtitle="COMMERCIAL QUOTATION" />
          <div style={{ textAlign: 'right' }}>
            <strong style={{ fontSize: '16px', display: 'block' }}>SUPPLIER OFFER</strong>
            <small style={{ color: 'var(--muted)' }}>Reference: Draft / Ready for Submission</small>
            <small style={{ display: 'block', color: 'var(--muted)' }}>Date: {new Date().toLocaleDateString()}</small>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', margin: '20px 0' }}>
          <div>
            <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>ISSUED BY (SUPPLIER):</strong>
            <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
              <strong>{company.name}</strong>
              <div>Code: {company.id}</div>
              <div>Contact: {company.contact} ({company.email})</div>
              <div>Phone: {company.phone}</div>
              <div>Address: {company.address}</div>
              <div>Tax ID: {company.taxId}</div>
            </div>
          </div>

          <div>
            <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>SUBMITTED TO (BUYER):</strong>
            <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
              <strong>ELSEWEDY ELECTRIC S.A.E.</strong>
              <div>Procurement Department</div>
              <div>Tender Reference: <strong>{quote.requestId}</strong></div>
              <div>Title: {quote.requestTitle}</div>
              <div>Delivery Location: {request?.location || 'Cairo Facilities'}</div>
            </div>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '16px 0' }} />

        <h2>Commercial Itemization</h2>
        <div className="quotation-line-item" style={{ margin: '14px 0' }}>
          <div className="quotation-line-main"><span>COMMERCIAL LINE ITEM · 01</span><h3>{quote.product}</h3><p>{quote.specs ? quote.specs.slice(0, 100) : 'Standard enterprise specifications'}</p></div>
          <dl><div><dt>Brand / model</dt><dd>{quote.brand || quote.model ? `${quote.brand} ${quote.model}` : 'Specified'}</dd></div><div><dt>Quantity</dt><dd>{quote.quantity} {quote.unit}</dd></div><div><dt>Unit price</dt><dd>{money(quote.unitPrice, quote.currency)}</dd></div><div><dt>Line total</dt><dd>{money(totalAmount, quote.currency)}</dd></div></dl>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '14px 0' }}>
          <div style={{ width: '280px', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', margin: '4px 0' }}>
              <span>Subtotal:</span>
              <span>{money(totalAmount, quote.currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', margin: '4px 0' }}>
              <span>Taxes / VAT:</span>
              <span>Included in total</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800', marginTop: '8px', borderTop: '2px solid var(--red)', paddingTop: '8px' }}>
              <span>Total Commercial Value:</span>
              <span>{money(totalAmount, quote.currency)}</span>
            </div>
          </div>
        </div>

        <h2>Terms &amp; Conditions</h2>
        <DetailRows
          rows={[
            ['Delivery Lead Time', quote.delivery],
            ['Warranty Coverage', quote.warranty],
            ['Payment Conditions', quote.payment],
            ['Offer Validity', quote.validity],
            ['Delivery Conditions', quote.conditions || 'Site delivery included']
          ]}
        />

        <div className="data-boundary-note" style={{ marginTop: '20px' }}>
          By submitting this quotation, the supplier confirms pricing accuracy and adherence to Elsewedy Electric procurement codes of conduct.
        </div>

        <div className="form-actions" style={{ marginTop: '20px' }}>
          <Button variant="secondary" onClick={onEdit}>
            ← Make Changes
          </Button>
          <Button onClick={() => setConfirmOpen(true)} icon="check">
            Confirm &amp; Submit Offer
          </Button>
        </div>
      </Card>

      {confirmOpen && (
        <Modal title="Submit Commercial Quotation?" close={() => setConfirmOpen(false)}>
          <p className="modal-copy">
            You are about to formally submit your quotation for <strong>{quote.requestId}</strong> ({quote.requestTitle}) with a total value of <strong>{money(totalAmount, quote.currency)}</strong>.
          </p>
          <p className="modal-copy">
            Once submitted, the quotation will be forwarded to the procurement evaluation committee.
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setConfirmOpen(false);
                onSubmit(quote);
              }}
              icon="arrow"
            >
              Confirm Submission
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* =========================================================================
   PAGE 7: MY QUOTATIONS
   ========================================================================= */
function MyQuotationsPage({ quotations, requests, orders, go }) {
  return (
    <>
      <PageHeading
        title="My Submitted Quotations"
        subtitle="Review all commercial proposals submitted to Elsewedy Electric and track their evaluation status."
        eyebrow="COMMERCIAL OFFERS"
        action={
          <Button onClick={() => go('available-requests')} icon="plus">
            Explore Tenders
          </Button>
        }
      />

      <section className="supplier-quote-ledger">
        <div className="supplier-ledger-heading"><span>SUBMISSION REGISTER</span><strong>{quotations.length} offers</strong></div>
        <div className="supplier-quote-list">
          {quotations.map((q) => {
            const req = requests.find((r) => r.id === q.requestId);
            const order = orders.find((o) => o.quotationId === q.id);
            return <article className="supplier-quote-record" key={q.id}>
              <div className="supplier-quote-stamp"><span>OFFER</span><strong>{q.id}</strong><small>{new Date(q.submittedAt).toLocaleDateString()}</small></div>
              <div className="supplier-quote-content"><div className="supplier-quote-title"><div><span>{q.requestId} · {req?.category || 'Procurement'}</span><h2>{req?.title || q.product}</h2></div><StatusPill status={q.status} /></div>
                <div className="supplier-quote-facts"><span>Submitted value <b>{money(q.total, q.currency)}</b></span><span>Delivery <b>{q.delivery || '10 days'}</b></span><span>Feedback <b>{q.feedback || (q.status === 'Accepted' ? 'Offer approved by committee' : 'Under committee evaluation')}</b></span></div>
                <div className="supplier-quote-actions"><Button variant="outline" onClick={() => go('supplier-request-tracking', q.requestId)}>Track evaluation</Button>{order && <Button variant="secondary" onClick={() => go('order-details', order.id)}>View purchase order</Button>}</div>
              </div>
            </article>;
          })}
        </div>
        {quotations.length === 0 && (
            <div className="empty-state">
              <h2>No quotations submitted yet</h2>
              <p>Explore open tenders in Available Requests to prepare and submit your first offer.</p>
              <Button onClick={() => go('available-requests')}>Browse Available Requests</Button>
            </div>
          )}
      </section>
    </>
  );
}

/* =========================================================================
   PAGE 8: MY ORDERS (SECTION 6 REQUIREMENT)
   ========================================================================= */
function MyOrdersPage({ orders, go }) {
  return (
    <>
      <PageHeading
        title="My Purchase Orders"
        subtitle="Official purchase orders issued after commercial quotation acceptance. Operational tracking is managed here."
        eyebrow="PURCHASE ORDERS"
        action={
          <Button variant="secondary" onClick={() => go('order-tracking')} icon="track">
            Open Shipment Tracker
          </Button>
        }
      />

      <section className="supplier-fulfillment">
        <div className="supplier-ledger-heading"><span>FULFILLMENT QUEUE</span><strong>{orders.length} purchase orders</strong></div>
        <div className="supplier-fulfillment-list">
          {orders.map((o) => <article className="supplier-fulfillment-order" key={o.id}>
            <div className="fulfillment-order-id"><span>OFFICIAL PURCHASE ORDER</span><strong>{o.id}</strong><small>{o.expectedDelivery || 'Delivery date scheduled'}</small></div>
            <div className="fulfillment-order-body"><div className="fulfillment-order-heading"><div><h2>{o.product}</h2><p>Tender {o.requestId} <i>·</i> Quotation {o.quotationId}</p></div><StatusPill status={o.status} /></div>
              <div className="fulfillment-order-facts"><span>Quantity <b>{o.quantity} units</b></span><span>Approved value <b>{money(o.total, o.currency)}</b></span></div>
              <div className="fulfillment-order-actions"><Button variant="outline" onClick={() => go('order-details', o.id)}>Order details</Button><Button variant="primary" onClick={() => go('order-tracking', o.id)}>Track shipment</Button></div>
            </div>
          </article>)}
        </div>
        {orders.length === 0 && (
            <div className="empty-state">
              <h2>No official purchase orders yet</h2>
              <p>Official purchase orders are generated automatically when procurement accepts your quotation.</p>
              <Button onClick={() => go('available-requests')}>View Available Requests</Button>
            </div>
          )}
      </section>
    </>
  );
}

/* =========================================================================
   PAGE 9: ORDER DETAILS (SECTION 6 REQUIREMENT)
   ========================================================================= */
function OrderDetailsPage({ order, requests, quotations, go }) {
  const req = requests.find((r) => r.id === order.requestId);
  const quote = quotations.find((q) => q.id === order.quotationId);

  return (
    <>
      <div className="request-detail-actions">
        <button className="back-link" onClick={() => go('my-orders')}>
          ← Back to My Orders
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" onClick={() => window.print()} icon="print">
            Print PO
          </Button>
          <Button onClick={() => go('order-tracking', order.id)} icon="track">
            Track Order Shipment →
          </Button>
        </div>
      </div>

      <Card className="request-summary">
        <div className="summary-icon">
          <Icon name="check" size={26} />
        </div>
        <div className="summary-title">
          <span className="request-id">{order.id}</span>
          <h1>Purchase Order: {order.product}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '12px' }}>
            Issued to {order.supplierName} · Value: {money(order.total, order.currency)}
          </p>
        </div>
        <div className="summary-status">
          <StatusPill status={order.status} />
          <span>Related Tender: {order.requestId}</span>
        </div>
      </Card>

      <div className="details-grid">
        <Card>
          <h2>Order Header &amp; Commercial Terms</h2>
          <DetailRows
            rows={[
              ['Purchase Order ID', order.id],
              ['Tender Request Reference', order.requestId],
              ['Accepted Quotation Reference', order.quotationId],
              ['Total Approved Value', money(order.total, order.currency)],
              ['Supplier Name', order.supplierName],
              ['Contact Email', order.supplierEmail],
              ['Delivery Destination', req?.location || 'Cairo Central Warehouse'],
              ['Expected Delivery Date', order.expectedDelivery || 'Within agreed schedule']
            ]}
          />
        </Card>

        <Card>
          <h2>Items &amp; Scope of Supply</h2>
          <DetailRows
            rows={[
              ['Product / Item', order.product],
              ['Quantity Approved', `${order.quantity} units`],
              ['Unit Price Equivalent', money(Number(order.total) / Math.max(1, Number(order.quantity)), order.currency)],
              ['Inspection Terms', 'Standard Elsewedy technical inspection upon receipt'],
              ['Current Status', order.status]
            ]}
          />

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <Button onClick={() => go('order-tracking', order.id)} icon="track">
              Update Operational Status
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

/* =========================================================================
   PAGE 10: ORDER TRACKING (SECTION 6 & 7 FULL WORKFLOW REQUIREMENT)
   ========================================================================= */
function OrderTrackingPage({ orders, selectedId, onTransition, go }) {
  const [currentId, setCurrentId] = useState(selectedId || orders[0]?.id);
  const [targetStatus, setTargetStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form fields for status update
  const [carrier, setCarrier] = useState('Elsewedy Logistics Fleet');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingDate, setShippingDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveredQuantity, setDeliveredQuantity] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [packageCount, setPackageCount] = useState('');
  const [notes, setNotes] = useState('');
  const [docName, setDocName] = useState('');

  const order = orders.find((o) => o.id === currentId) || orders[0];

  if (!order) {
    return (
      <Card className="empty-state">
        <h2>No Active Purchase Orders to Track</h2>
        <p>Order fulfillment tracking is activated only after an official Purchase Order is issued.</p>
        <Button onClick={() => go('available-requests')}>Browse Tenders</Button>
      </Card>
    );
  }

  const currentIdx = ORDER_LIFECYCLE_STAGES.indexOf(order.status);

  // Supplier can advance through stages up to 'Delivered' (index 9)
  // Stages 10 & 11 ('Awaiting Employee Receipt Confirmation', 'Completed') are restricted to employee!
  const availableNextStages = ORDER_LIFECYCLE_STAGES.slice(currentIdx + 1, 10);

  function executeUpdate() {
    if (!targetStatus) return;

    let payload = { notes };
    if (targetStatus === 'Confirmed' && expectedDate) {
      payload.expectedDelivery = expectedDate;
    } else if (targetStatus === 'Packaged' && packageCount) {
      payload.packageCount = Number(packageCount);
    } else if (targetStatus === 'Shipped') {
      payload.carrier = carrier;
      payload.trackingNumber = trackingNumber || `TRK-EG-${Date.now().toString().slice(-6)}`;
      payload.shippingDate = shippingDate;
    } else if (targetStatus === 'Delivered') {
      payload.deliveredQuantity = deliveredQuantity || order.quantity;
      payload.deliveryDate = deliveryDate;
      payload.deliveryDocument = docName;
      // When supplier marks Delivered, order moves to stage awaiting employee receipt confirmation!
      payload.status = 'Delivered';
    }

    onTransition(order.id, targetStatus, payload);
    setModalOpen(false);
    setTargetStatus('');
    setNotes('');
  }

  return (
    <>
      <PageHeading
        title="Purchase Order Fulfillment &amp; Shipment Tracking"
        subtitle={`Live operational tracking for ${order.id} — ${order.product}.`}
        eyebrow="SUPPLIER ORDER FULFILLMENT"
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={() => go('order-details', order.id)}>
              Order Details
            </Button>
            {availableNextStages.length > 0 && (
              <Button
                onClick={() => {
                  setTargetStatus(availableNextStages[0]);
                  setModalOpen(true);
                }}
                icon="arrow"
              >
                Advance Status: {availableNextStages[0]}
              </Button>
            )}
          </div>
        }
      />

      <div className="filters" style={{ gridTemplateColumns: '1.5fr auto', marginBottom: '14px' }}>
        <select value={currentId} onChange={(e) => setCurrentId(e.target.value)}>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.id} — {o.product} ({o.status})
            </option>
          ))}
        </select>
        <span style={{ fontSize: '12px', color: 'var(--muted)', alignSelf: 'center' }}>
          Approved Value: {money(order.total, order.currency)}
        </span>
      </div>

      <Card className="request-summary">
        <div className="summary-icon">
          <Icon name="truck" size={26} />
        </div>
        <div className="summary-title">
          <span className="request-id">{order.id}</span>
          <h1>{order.product}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '12px' }}>
            Tender: {order.requestId} · Quantity: {order.quantity} units · Carrier: {order.carrier || 'Fleet TBD'}
          </p>
        </div>
        <div className="summary-status">
          <StatusPill status={order.status} />
          <span>Stage {currentIdx + 1} of 12</span>
        </div>
      </Card>

      {/* Operational update controls */}
      {availableNextStages.length > 0 ? (
        <Card style={{ marginTop: '14px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <strong>Update Order Execution Status</strong>
              <small style={{ display: 'block', color: 'var(--muted)' }}>
                Advance the purchase order to the next operational stage. Updates are recorded and instantly visible to the employee.
              </small>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={targetStatus}
                onChange={(e) => {
                  setTargetStatus(e.target.value);
                  if (e.target.value) setModalOpen(true);
                }}
                style={{ minWidth: '220px' }}
              >
                <option value="">Select next status update...</option>
                {availableNextStages.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      ) : order.status === 'Received / Completed' ? (
        <div className="data-boundary-note" style={{ borderLeftColor: 'var(--green)' }}>
          <strong>Order Complete:</strong> Final delivery was verified and confirmed by the employee. This purchase order is successfully closed.
        </div>
      ) : (
        <div className="data-boundary-note" style={{ borderLeftColor: '#dd7c35' }}>
          <strong>Awaiting Employee Receipt Confirmation:</strong> Goods have been marked Delivered. Only the requesting employee can perform the final inspection and complete receipt.
        </div>
      )}

      {/* 12-Stage Visual Timeline */}
      <Card className="request-tracking-card" style={{ marginTop: '14px' }}>
        <h2>Order Fulfillment Lifecycle</h2>
        <div className="request-timeline" style={{ marginTop: '20px' }}>
          {ORDER_LIFECYCLE_STAGES.map((stageName, i) => {
            const isDone = i < currentIdx;
            const isCurrent = i === currentIdx;
            const historyEvent = order.history?.find((h) => h.status === stageName);

            const isEmployeeOnly = i >= 10;

            return (
              <div
                key={stageName}
                className={`request-stage ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
              >
                <span>{isDone ? '✓' : String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>{stageName}</strong>
                    {isEmployeeOnly && (
                      <span className="status-pill status-draft" style={{ fontSize: '9px', padding: '1px 6px' }}>
                        Employee Action
                      </span>
                    )}
                  </div>
                  <small>
                    {historyEvent
                      ? `${new Date(historyEvent.at).toLocaleString()} · ${historyEvent.by}`
                      : isCurrent
                      ? 'Current Active Stage'
                      : 'Upcoming Stage'}
                  </small>
                  {historyEvent?.notes && <p>{historyEvent.notes}</p>}
                  {historyEvent?.trackingNumber && (
                    <p>
                      Carrier: <strong>{historyEvent.carrier}</strong> | Tracking #: <strong>{historyEvent.trackingNumber}</strong>
                    </p>
                  )}
                  {historyEvent?.packageCount && (
                    <p>Package Count: <strong>{historyEvent.packageCount} units/boxes</strong></p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Modal for status update */}
      {modalOpen && (
        <Modal title={`Update Status to: ${targetStatus}`} close={() => setModalOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p className="modal-copy">
              Record operational update for <strong>{order.id}</strong>. This update will be logged in the order history.
            </p>

            {targetStatus === 'Confirmed' && (
              <label className="field">
                <span>Confirmed Expected Delivery Date <i>*</i></span>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  required
                />
              </label>
            )}

            {targetStatus === 'Packaged' && (
              <label className="field">
                <span>Total Packages / Pallets</span>
                <input
                  type="number"
                  min="1"
                  value={packageCount}
                  onChange={(e) => setPackageCount(e.target.value)}
                  placeholder="e.g. 4 crates"
                />
              </label>
            )}

            {targetStatus === 'Shipped' && (
              <>
                <label className="field">
                  <span>Logistics Carrier <i>*</i></span>
                  <input
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="Carrier Name"
                    required
                  />
                </label>
                <label className="field">
                  <span>Tracking / Waybill Number <i>*</i></span>
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. TRK-EG-948201"
                    required
                  />
                </label>
                <label className="field">
                  <span>Dispatch Date <i>*</i></span>
                  <input
                    type="date"
                    value={shippingDate}
                    onChange={(e) => setShippingDate(e.target.value)}
                    required
                  />
                </label>
              </>
            )}

            {targetStatus === 'Delivered' && (
              <>
                <label className="field">
                  <span>Delivered Quantity</span>
                  <input
                    type="number"
                    value={deliveredQuantity}
                    onChange={(e) => setDeliveredQuantity(e.target.value)}
                    placeholder={String(order.quantity)}
                  />
                </label>
                <label className="field">
                  <span>Actual Delivery Date <i>*</i></span>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span>Proof of Delivery Document / POD</span>
                  <input
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="e.g. POD_Signed_Receipt_9482.pdf"
                  />
                </label>
              </>
            )}

            <label className="field">
              <span>Operational Notes &amp; Comments</span>
              <textarea
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add status notes, driver name, or special instructions..."
              />
            </label>

            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={executeUpdate} icon="arrow">
                Save &amp; Publish Update
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/* =========================================================================
   PAGE 11: ACTIVITY & NOTIFICATIONS
   ========================================================================= */
function ActivityMessagesPage({ quotations, orders, go }) {
  const allEvents = useMemo(() => {
    const list = [];
    quotations.forEach((q) => {
      list.push({
        type: 'quote',
        title: `Quotation ${q.id} · ${q.status}`,
        date: q.submittedAt,
        details: `Tender: ${q.requestId} | Amount: ${money(q.total, q.currency)}`,
        id: q.requestId
      });
      (q.history || []).forEach((h) => {
        list.push({
          type: 'quote',
          title: `Quotation ${q.id} status changed to ${h.status}`,
          date: h.at,
          details: `By ${h.by || 'Procurement'}`,
          id: q.requestId
        });
      });
    });

    orders.forEach((o) => {
      (o.history || []).forEach((h) => {
        list.push({
          type: 'order',
          title: `Order ${o.id} · ${h.status}`,
          date: h.at,
          details: `${o.product} | ${h.notes || 'Status updated'}`,
          id: o.id
        });
      });
    });

    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [quotations, orders]);

  return (
    <>
      <PageHeading
        title="Supplier Notifications &amp; Activity Stream"
        subtitle="Chronological feed of commercial quotation decisions and purchase order updates."
        eyebrow="COMMUNICATION & AUDIT LOG"
      />

      <Card>
        <h2>Recent Activity Feed</h2>
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {allEvents.map((ev, i) => (
            <div
              key={i}
              className="activity-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--line)'
              }}
            >
              <div>
                <strong>{ev.title}</strong>
                <small style={{ display: 'block', color: 'var(--muted)', marginTop: '2px' }}>
                  {ev.details}
                </small>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {ev.date ? new Date(ev.date).toLocaleString() : 'Recent'}
                </span>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (ev.type === 'order') go('order-tracking', ev.id);
                    else go('supplier-request-tracking', ev.id);
                  }}
                >
                  View
                </Button>
              </div>
            </div>
          ))}

          {allEvents.length === 0 && (
            <p className="body-copy">No recent events recorded yet.</p>
          )}
        </div>
      </Card>
    </>
  );
}

/* =========================================================================
   PAGE 12: COMPANY PROFILE
   ========================================================================= */
function CompanyProfilePage({ company, onSave }) {
  const [profile, setProfile] = useState(company);

  const setP = (key) => (e) => setProfile({ ...profile, [key]: e.target.value });

  return (
    <>
      <PageHeading
        title="Supplier Company Profile"
        subtitle="Manage official vendor identity, registration codes, and contact coordinates."
        eyebrow="VENDOR CREDENTIALS"
      />

      <div className="settings-layout">
        <div className="settings-main">
          <Card className="profile-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSave(profile);
              }}
            >
              <div className="profile-identity">
                <div className="avatar avatar-large avatar-supplier">
                  {profile.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2>{profile.name}</h2>
                  <span>Vendor ID: {profile.id}</span>
                </div>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Company Legal Name <i>*</i></span>
                  <input value={profile.name} onChange={setP('name')} required />
                </label>

                <label className="field">
                  <span>Vendor Code</span>
                  <input value={profile.id} onChange={setP('id')} />
                </label>

                <label className="field">
                  <span>Primary Contact Representative <i>*</i></span>
                  <input value={profile.contact} onChange={setP('contact')} required />
                </label>

                <label className="field">
                  <span>Official Business Email <i>*</i></span>
                  <input type="email" value={profile.email} onChange={setP('email')} required />
                </label>

                <label className="field">
                  <span>Telephone Number</span>
                  <input value={profile.phone} onChange={setP('phone')} />
                </label>

                <label className="field">
                  <span>Tax Registration Number</span>
                  <input value={profile.taxId} onChange={setP('taxId')} />
                </label>

                <label className="field">
                  <span>Commercial Registry (CR)</span>
                  <input value={profile.commercialReg} onChange={setP('commercialReg')} />
                </label>

                <label className="field">
                  <span>Country &amp; Jurisdiction</span>
                  <input value={profile.country} onChange={setP('country')} />
                </label>
              </div>

              <label className="field" style={{ marginTop: '10px' }}>
                <span>Registered Physical Address</span>
                <input value={profile.address} onChange={setP('address')} />
              </label>

              <label className="field" style={{ marginTop: '10px' }}>
                <span>Supply Categories</span>
                <input value={profile.category} onChange={setP('category')} />
              </label>

              <div className="profile-actions" style={{ marginTop: '16px' }}>
                <span>Changes are saved in this browser</span>
                <Button type="submit" icon="arrow">Save Profile</Button>
              </div>
            </form>
          </Card>
        </div>

        <aside className="brand-promo">
          <img src="./assets/profile-brand.png" alt="Elsewedy Electric" />
          <div className="promo-overlay">
            <Brand subtitle="ENTERPRISE PARTNER" />
            <strong>Empowering<br />Progress</strong>
          </div>
        </aside>
      </div>
    </>
  );
}

/* =========================================================================
   PAGE 13: SETTINGS
   ========================================================================= */
function SupplierSettingsPage({ notify }) {
  const [prefs, setPrefs] = useState(() =>
    readJSON('supplier-settings', {
      tenderAlerts: true,
      quotationAlerts: true,
      orderUpdates: true,
      currency: 'EGP',
      language: 'English'
    })
  );

  function toggle(key) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    writeJSON('supplier-settings', next);
    notify('Settings updated successfully.');
  }

  return (
    <>
      <PageHeading
        title="Supplier Preferences &amp; Configuration"
        subtitle="Configure alerts, display parameters, and communication channels."
        eyebrow="PREFERENCES"
      />

      <Card className="settings-panel">
        <h2>Notification Preferences</h2>
        <p>Control browser notification triggers for procurement events.</p>

        <label className="setting-row">
          <span>
            <strong>New Tender Alerts</strong>
            <small>Receive updates when new tenders matching your categories are published.</small>
          </span>
          <input
            type="checkbox"
            checked={prefs.tenderAlerts}
            onChange={() => toggle('tenderAlerts')}
          />
        </label>

        <label className="setting-row">
          <span>
            <strong>Quotation Status Updates</strong>
            <small>Receive alerts when procurement reviews, accepts, or requests revisions on your quotations.</small>
          </span>
          <input
            type="checkbox"
            checked={prefs.quotationAlerts}
            onChange={() => toggle('quotationAlerts')}
          />
        </label>

        <label className="setting-row">
          <span>
            <strong>Purchase Order Delivery Reminders</strong>
            <small>Receive alerts on expected delivery dates and milestone updates.</small>
          </span>
          <input
            type="checkbox"
            checked={prefs.orderUpdates}
            onChange={() => toggle('orderUpdates')}
          />
        </label>
      </Card>
    </>
  );
}

/* =========================================================================
   PAGE 14: HELP & SUPPORT
   ========================================================================= */
function SupplierHelpPage({ go }) {
  return (
    <>
      <PageHeading
        title="Supplier Portal Guidance &amp; Workflow"
        subtitle="Standard operating procedures for Elsewedy Electric vendor collaboration."
        eyebrow="HELP & SUPPORT"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <Card>
          <h2>The 3 Connected Tracking Experiences</h2>
          <div style={{ marginTop: '12px', fontSize: '12px', lineHeight: '1.65' }}>
            <p>
              <strong>1. Tender &amp; Request Tracking:</strong> Follows the tender from publication, quotation preparation, and review to quotation acceptance.
            </p>
            <p>
              <strong>2. Quotation Review:</strong> Allows the supplier and procurement committee to negotiate revisions and reach commercial acceptance.
            </p>
            <p>
              <strong>3. Purchase Order Fulfillment:</strong> Once quotation acceptance is granted, an official PO is issued. Delivery tracking follows the 12-stage fulfillment pipeline from confirmation to receipt.
            </p>
          </div>
        </Card>

        <Card>
          <h2>Rules on Order Status &amp; Receipt</h2>
          <div style={{ marginTop: '12px', fontSize: '12px', lineHeight: '1.65' }}>
            <p>
              <strong>Operational Updates:</strong> Suppliers are empowered to update preparation, packaging, shipment, tracking number, carrier, and delivery status.
            </p>
            <p>
              <strong>Final Receipt Confirmation:</strong> In accordance with Elsewedy internal audit standards, final receipt confirmation (Stage 11 &amp; 12) is exclusively performed by the requesting employee after inspection.
            </p>
            <Button variant="secondary" onClick={() => go('available-requests')} style={{ marginTop: '10px' }}>
              Explore Available Tenders →
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
