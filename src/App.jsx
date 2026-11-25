import { useEffect, useMemo, useRef, useState } from 'react';
import SupplierPortal, { RoleGate } from './SupplierPortal.jsx';
import Landing from './landing/Landing.jsx';
import CommandPalette from './CommandPalette.jsx';
import { Ambient, CableHero, Count, PageHeading, Robot, RouteContext, Ticker, TruckScene, Wipe, useFx } from './theme/PortalFX.jsx';

const NAV = [
  ['dashboard', 'Dashboard', 'home'],
  ['create-request', 'Create Request', 'file'],
  ['my-requests', 'My Requests', 'list'],
  ['track-requests', 'Track Request', 'track'],
  ['approvals', 'Approvals', 'check'],
  ['reports', 'Reports', 'chart'],
  ['analytics', 'Analytics', 'chart'],
  ['ai-assistant', 'Smart Assistant', 'spark'],
  ['profile-settings', 'Settings', 'settings'],
  ['supplier-offers', 'Supplier Offers', 'users'],
  ['purchase-orders', 'Purchase Orders', 'track'],
];

const CATEGORIES = ['Electrical Supplies', 'IT Equipment', 'Office Supplies', 'Network Equipment', 'Operations'];

const INITIAL_REQUESTS = [
  {
    id: 'PR-2026-1048',
    title: 'Electrical Cables & Conduits',
    category: 'Electrical Supplies',
    item: 'Medium-voltage power cables (3x120mm²)',
    quantity: 250,
    unit: 'Meter',
    cost: 125000,
    priority: 'High',
    status: 'Under Review',
    employee: 'Fares Ahmed',
    department: 'Operations',
    date: '2026-10-20',
    submittedAt: '2026-10-20T09:30:00Z',
    requiredDate: '2026-11-25',
    location: 'Main Factory, 10th of Ramadan City',
    justification: 'Crucial for upgrading production line 4 power sub-station and avoiding operational bottlenecks.',
    technicalSpecs: 'XLPE insulated copper conductor cables, IEC 60502-2 compliant, rated voltage 12/20 kV with flame retardant outer sheath.',
    notes: 'Deliver during standard receiving hours (8 AM - 3 PM). Certificate of analysis required with delivery.',
    attachmentName: 'Cables_Technical_Data_Sheet_v1.pdf',
    visibleToSuppliers: false,
    history: [
      { status: 'Under Review', at: '2026-10-20T09:30:00Z', by: 'Fares Ahmed · Employee' }
    ]
  },
  {
    id: 'PR-2026-1047',
    title: 'Office Ergonomic Chairs',
    category: 'Office Supplies',
    item: 'Ergonomic high-back office chair',
    quantity: 12,
    unit: 'Piece',
    cost: 75000,
    priority: 'Medium',
    status: 'Approved',
    employee: 'Fares Ahmed',
    department: 'IT Department',
    date: '2026-10-16',
    submittedAt: '2026-10-16T11:00:00Z',
    approvalAt: '2026-10-18T14:20:00Z',
    requiredDate: '2026-12-15',
    location: 'Cairo Office - Smart Village',
    justification: 'Ergonomic replacement chairs for development staff to improve ergonomics and posture.',
    technicalSpecs: 'Breathable mesh back with lumbar support, 3D adjustable armrests, pneumatic lift rated to 150kg.',
    notes: 'Coordinate delivery with Cairo facility reception.',
    attachmentName: 'Ergonomic_Chairs_Specs.pdf',
    visibleToSuppliers: true,
    history: [
      { status: 'Under Review', at: '2026-10-16T11:00:00Z', by: 'Fares Ahmed · Employee' },
      { status: 'Approved', at: '2026-10-18T14:20:00Z', by: 'Procurement Committee' },
      { status: 'Published to suppliers', at: '2026-10-18T15:00:00Z', by: 'Fares Ahmed · Employee' }
    ]
  },
  {
    id: 'PR-2026-1045',
    title: 'Industrial Cable Connectors',
    category: 'Electrical Supplies',
    item: 'Copper compression lugs 120mm²',
    quantity: 150,
    unit: 'Piece',
    cost: 32000,
    priority: 'High',
    status: 'Rejected for Change',
    employee: 'Fares Ahmed',
    department: 'Operations',
    date: '2026-10-12',
    submittedAt: '2026-10-12T10:15:00Z',
    requiredDate: '2026-11-20',
    location: 'Main Factory',
    justification: 'Required for scheduled preventative switchgear maintenance.',
    technicalSpecs: 'Tin-plated high conductivity copper compression terminals.',
    feedback: 'Please revise quantities to align with Q4 maintenance budget quotas.',
    notes: 'Urgent turnaround requested.',
    attachmentName: 'Connectors_BOM_List.xlsx',
    visibleToSuppliers: false,
    history: [
      { status: 'Under Review', at: '2026-10-12T10:15:00Z', by: 'Fares Ahmed · Employee' },
      { status: 'Rejected for Change', at: '2026-10-14T16:00:00Z', by: 'Department Manager' }
    ]
  },
  {
    id: 'PR-2026-1042',
    title: 'Marketing Workstation Laptops',
    category: 'IT Equipment',
    item: 'High-performance mobile workstation',
    quantity: 4,
    unit: 'Piece',
    cost: 160000,
    priority: 'Medium',
    status: 'Draft',
    employee: 'Fares Ahmed',
    department: 'Marketing',
    date: '2026-10-09',
    requiredDate: '2026-12-01',
    location: 'Cairo Office',
    justification: 'Required for new 3D animation and brand video rendering designers.',
    technicalSpecs: 'Intel Core i9 / 32GB RAM / 1TB SSD / RTX 4070 Graphics.',
    notes: 'Save as draft pending finalization of department head headcount approval.',
    attachmentName: 'Marketing_HW_Request.pdf',
    visibleToSuppliers: false,
    history: [
      { status: 'Draft', at: '2026-10-09T08:00:00Z', by: 'Fares Ahmed · Employee' }
    ]
  }
];

const money = (value) => `EGP ${Number(value || 0).toLocaleString('en-US')}`;
const readJSON = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const routeFromHash = () => {
  const route = window.location.hash.slice(1).split('?')[0];
  return NAV.some(([id]) => id === route) || ['request-view', 'request-tracking'].includes(route)
    ? route
    : 'dashboard';
};

const Icon = ({ name, size = 18 }) => {
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
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.file}
    </svg>
  );
};

function Brand() {
  return (
    <div className="brand-mark" aria-label="Elsewedy Electric">
      <strong>ELSEWEDY</strong>
      <strong>ELECTRIC</strong>
      <span />
    </div>
  );
}

function SideNav({ active, go, mobileNav, onLogout }) {
  return (
    <aside className={`sidebar ${mobileNav ? 'nav-open' : ''}`}>
      <div className="sidebar-brand">
        <Brand />
      </div>
      <nav className="side-links" aria-label="Main navigation">
        {NAV.map(([id, label, icon]) => (
          <button
            key={id}
            className={`nav-link ${active === id ? 'active' : ''}`}
            onClick={() => go(id)}
            title={label}
            aria-label={label}
          >
            <Icon name={icon} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="avatar">FA</div>
        <div>
          <strong>Fares Ahmed</strong>
          <small>Employee</small>
        </div>
        <button className="logout-button" onClick={onLogout} title="Log out">
          <span>↪</span>
        </button>
      </div>
    </aside>
  );
}


function Card({ children, className = '', id }) {
  return (
    <section id={id} className={`card ${className}`}>
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
   APP ROOT (EMPLOYEE WORKSPACE + WORKSPACE SWITCHER)
   ========================================================================= */
function App() {
  const [active, setActive] = useState(routeFromHash);
  const [session, setSession] = useState(() => readJSON('last-desgin-session', null));
  const [gate, setGate] = useState(() => (window.location.hash.startsWith('#login') ? 'login' : sessionStorage.getItem('volt-intro') ? 'skip' : 'landing'));
  const [gateRole, setGateRole] = useState('');
  const [quotations, setQuotations] = useState(() => readJSON('commerce-quotations', []));
  const [orders, setOrders] = useState(() => readJSON('commerce-orders', []));
  const [theme, setTheme] = useState(() => localStorage.getItem('volt-theme') || 'light');
  const [requests, setRequests] = useState(() => readJSON('last-desgin-requests', INITIAL_REQUESTS));
  const [selectedId, setSelectedId] = useState(() => {
    return new URLSearchParams(window.location.hash.split('?')[1] || '').get('id') || INITIAL_REQUESTS[0].id;
  });
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState('entering');
  const transitionTimer = useRef(null);
  useFx(`${active}-${Boolean(session)}`);

  useEffect(() => {
    localStorage.setItem('last-desgin-requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    const sync = () => {
      setQuotations(readJSON('commerce-quotations', []));
      setOrders(readJSON('commerce-orders', []));
      setRequests(readJSON('last-desgin-requests', INITIAL_REQUESTS));
    };
    window.addEventListener('commerce-update', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('commerce-update', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('volt-theme', theme);
  }, [theme]);

  useEffect(() => {
    const sync = () => {
      setTransitionPhase('exiting');
      window.clearTimeout(transitionTimer.current);
      transitionTimer.current = window.setTimeout(() => {
        setActive(routeFromHash());
        setTransitionPhase('entering');
      }, 150);
      const urlId = new URLSearchParams(window.location.hash.split('?')[1] || '').get('id');
      if (urlId) setSelectedId(urlId);
    };
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
      window.clearTimeout(transitionTimer.current);
    };
  }, []);

  function notify(message) {
    setToast(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(''), 3000);
  }

  function go(page, id) {
    if (page === active && (!id || id === selectedId)) return;
    setMobileNav(false);
    setTransitionPhase('exiting');
    window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => {
      if (id) setSelectedId(id);
      setActive(page);
      setTransitionPhase('entering');
      const hash = page === 'dashboard' ? '' : `#${page}${id ? `?id=${encodeURIComponent(id)}` : ''}`;
      window.history.pushState({}, '', hash || '/');
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 380);
  }

  // CREATE OR UPDATE REQUEST (SECTION 4 REQUIREMENT: SAVE AS DRAFT VS SUBMIT)
  function createRequest(data) {
    const now = new Date().toISOString();
    const isDraft = data.status === 'Draft';
    const existingId = data.id;
    const requestId = existingId || `PR-2026-${Math.floor(1050 + Math.random() * 8900)}`;

    const request = {
      ...data,
      id: requestId,
      status: isDraft ? 'Draft' : 'Under Review',
      employee: data.employee || 'Fares Ahmed',
      department: data.department || 'IT Department',
      date: data.date || now.slice(0, 10),
      submittedAt: isDraft ? '' : (data.submittedAt || now),
      updatedAt: now,
      history: isDraft
        ? (data.history || [{ status: 'Draft', at: now, by: 'Fares Ahmed · Employee' }])
        : [...(data.history || []), { status: 'Under Review', at: now, by: 'Fares Ahmed · Employee' }]
    };

    setRequests((current) =>
      existingId
        ? current.map((item) => (item.id === existingId ? request : item))
        : [request, ...current]
    );

    setSelectedId(request.id);
    go('my-requests');
    notify(
      isDraft
        ? `Draft ${request.id} saved to your requests.`
        : `Your purchase request ${request.id} was submitted successfully.`
    );
  }

  function deleteDraft(id) {
    if (window.confirm(`Are you sure you want to delete draft ${id}?`)) {
      const next = requests.filter((r) => r.id !== id);
      setRequests(next);
      localStorage.setItem('last-desgin-requests', JSON.stringify(next));
      notify(`Draft ${id} was deleted.`);
    }
  }

  function updateStatus(id, status) {
    const request = requests.find((item) => item.id === id);
    if (!request) return false;
    if (request.status === status) {
      notify(`${id} is already ${status.toLowerCase()}.`);
      return false;
    }
    const allowed =
      (request.status === 'Draft' && status === 'Under Review') ||
      (request.status === 'Under Review' && ['Approved', 'Rejected', 'Rejected for Change'].includes(status));
    if (!allowed) {
      notify('This request has already been finalized.');
      return false;
    }
    const now = new Date().toISOString();
    const nextRequests = requests.map((item) =>
      item.id === id
        ? {
            ...item,
            status,
            approvalAt: status === 'Approved' ? now : item.approvalAt,
            updatedAt: now,
            history: [...(item.history || []), { status, at: now, by: 'Fares Ahmed · Approver' }]
          }
        : item
    );
    localStorage.setItem('last-desgin-requests', JSON.stringify(nextRequests));
    setRequests(nextRequests);
    notify(`${id} marked as ${status.toLowerCase()}.`);
    return true;
  }

  function togglePublication(id) {
    const request = requests.find((item) => item.id === id);
    if (!request || request.status !== 'Approved') {
      notify('Only an approved request can be published to suppliers.');
      return;
    }
    const now = new Date().toISOString();
    const next = requests.map((item) =>
      item.id === id
        ? {
            ...item,
            visibleToSuppliers: !item.visibleToSuppliers,
            updatedAt: now,
            history: [
              ...(item.history || []),
              {
                status: item.visibleToSuppliers ? 'Unpublished from suppliers' : 'Published to suppliers',
                at: now,
                by: 'Fares Ahmed · Employee'
              }
            ]
          }
        : item
    );
    localStorage.setItem('last-desgin-requests', JSON.stringify(next));
    setRequests(next);
    window.dispatchEvent(new CustomEvent('commerce-update'));
    notify(
      request.visibleToSuppliers
        ? 'Request unpublished from supplier portal.'
        : 'Approved request published to supplier opportunities.'
    );
  }

  function login(next) {
    localStorage.setItem('last-desgin-session', JSON.stringify(next));
    setSession(next);
  }

  function logout() {
    localStorage.removeItem('last-desgin-session');
    setSession(null);
    sessionStorage.removeItem('volt-intro');
    setGate('landing');
    setGateRole('');
  }

  function decideQuotation(id, status) {
    const quote = quotations.find((item) => item.id === id);
    if (!quote || !['Accepted', 'Rejected', 'Revision Requested'].includes(status)) return;
    const at = new Date().toISOString();
    const nextQuotes = quotations.map((item) =>
      item.id === id
        ? {
            ...item,
            status,
            feedback: status === 'Revision Requested' ? 'Please review pricing and delivery schedule.' : item.feedback || '',
            history: [...(item.history || []), { status, at, by: 'Fares Ahmed · Procurement' }]
          }
        : item
    );
    localStorage.setItem('commerce-quotations', JSON.stringify(nextQuotes));
    setQuotations(nextQuotes);

    // If quotation accepted, issue Purchase Order
    if (status === 'Accepted' && !orders.some((item) => item.quotationId === quote.id)) {
      const order = {
        id: `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
        quotationId: quote.id,
        requestId: quote.requestId,
        product: quote.product,
        quantity: quote.quantity,
        total: quote.total,
        currency: quote.currency || 'EGP',
        supplierName: quote.supplierName,
        supplierEmail: quote.supplierEmail,
        status: 'Awaiting Supplier Confirmation',
        expectedDelivery: quote.delivery || '',
        carrier: '',
        trackingNumber: '',
        history: [{ status: 'Purchase Order Issued', at, by: 'Procurement · Purchase Order Issued' }]
      };
      const nextOrders = [order, ...orders];
      localStorage.setItem('commerce-orders', JSON.stringify(nextOrders));
      setOrders(nextOrders);
    }
    window.dispatchEvent(new CustomEvent('commerce-update'));
    notify(`Quotation ${id} marked ${status.toLowerCase()}${status === 'Accepted' ? '; Purchase Order issued.' : '.'}`);
  }

  // EMPLOYEE RECEIPT CONFIRMATION (EXCLUSIVE EMPLOYEE ACTION - SECTION 6 REQUIREMENT)
  function confirmReceipt(orderId) {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;
    const at = new Date().toISOString();
    const updated = {
      ...order,
      status: 'Received / Completed',
      receiptConfirmedAt: at,
      history: [
        ...(order.history || []),
        { from: order.status, status: 'Received / Completed', at, by: 'Fares Ahmed · Employee Receipt Confirmed' }
      ]
    };
    const next = orders.map((item) => (item.id === orderId ? updated : item));
    localStorage.setItem('commerce-orders', JSON.stringify(next));
    setOrders(next);
    window.dispatchEvent(new CustomEvent('commerce-update'));
    notify(`Official receipt confirmed for ${orderId}. Purchase order is now completed.`);
  }

  function exportCSV(title, data = requests) {
    const cols = ['Request ID', 'Title', 'Category', 'Item', 'Quantity', 'Estimated Cost (EGP)', 'Priority', 'Status', 'Employee', 'Required Date'];
    const rows = data.map((r) => [r.id, r.title, r.category, r.item, r.quantity, r.cost, r.priority, r.status, r.employee, r.requiredDate]);
    const csv = [cols, ...rows].map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `${title.toLowerCase().replaceAll(' ', '-')}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    notify(`${title} downloaded as CSV.`);
  }

  // ROUTE GATES
  if (gate === 'landing') {
    return (
      <Landing
        requests={requests}
        quotations={quotations}
        orders={orders}
        signedIn={Boolean(session)}
        theme={theme}
        onToggleTheme={() => setTheme((c) => (c === 'dark' ? 'light' : 'dark'))}
        onEnter={(role) => {
          sessionStorage.setItem('volt-intro', '1');
          window.scrollTo(0, 0);
          if (session && (!role || role === session.role)) {
            setGate('skip');
            return;
          }
          if (session) logout();
          setGateRole(role || '');
          setGate('login');
        }}
      />
    );
  }
  if (!session) {
    return <RoleGate onLogin={login} initialRole={gateRole} onHome={() => setGate('landing')} />;
  }
  if (session.role === 'supplier') {
    return (
      <SupplierPortal
        session={session}
        onLogout={logout}
        theme={theme}
        setTheme={setTheme}
        employeeRequests={requests}
        quotations={quotations}
        setQuotations={setQuotations}
        orders={orders}
        setOrders={setOrders}
      />
    );
  }

  const pendingApprovalCount = requests.filter((r) => r.status === 'Under Review').length;
  const selectedRequest = requests.find((r) => r.id === selectedId) || requests[0];
  const selectedOrder = orders.find((o) => o.requestId === selectedId);

  const tickerItems = requests.map((r) => ({
    id: r.id,
    text: `${r.title} · ${r.status} · ${money(r.cost)}`,
    tone: r.status === 'Approved' ? 'ok' : r.status === 'Under Review' ? 'hot' : String(r.status).startsWith('Rejected') ? 'bad' : '',
  }));
  const commands = [
    ...NAV.map(([id, label]) => ({ id: `nav-${id}`, label, group: 'Pages', hint: 'Go to page', run: () => go(id) })),
    { id: 'act-new', label: 'New purchase request', group: 'Actions', hint: 'Create', run: () => go('create-request') },
    { id: 'act-theme', label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`, group: 'Actions', hint: 'Appearance', run: () => setTheme((c) => (c === 'dark' ? 'light' : 'dark')) },
    { id: 'act-csv', label: 'Export all requests as CSV', group: 'Actions', hint: 'Reports', run: () => exportCSV('All Requests') },
    { id: 'act-home', label: 'Back to the story page', group: 'Actions', hint: 'Landing', run: () => logout() },
    ...requests.map((r) => ({ id: `req-${r.id}`, label: `${r.id} · ${r.title}`, group: 'Requests', hint: r.status, run: () => go('request-view', r.id) })),
  ];

  return (
    <div className="portal-wrap employee-app">
      <Ambient />
      <Wipe phase={transitionPhase} />
      <CommandPalette items={commands} />
      <div className="portal">
        <SideNav active={active} go={go} mobileNav={mobileNav} onLogout={logout} />
        <main className="main-area">
          <header className="topbar">
            <button className="portal-header-brand" onClick={() => go('dashboard')} aria-label="Return to workspace"><Brand /><span>EMPLOYEE PORTAL</span></button>
            {active !== 'dashboard' && <button className="workspace-return" onClick={() => go('dashboard')}><span>←</span> ALL DESTINATIONS</button>}
            <button
              className="mobile-menu"
              onClick={() => setMobileNav((open) => !open)}
              aria-label="Toggle navigation"
            >
              <Icon name="menu" />
            </button>
            <label className="global-search">
              <Icon name="search" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) =>
                  event.key === 'Enter' && (go('my-requests'), setSearch(event.target.value))
                }
                placeholder="Search requests, suppliers..."
              />
              <button
                onClick={() => {
                  go('my-requests');
                  notify(search ? `Showing results for “${search}”.` : 'Showing all purchase requests.');
                }}
                aria-label="Search"
              >
                <Icon name="arrow" size={16} />
              </button>
            </label>
            <div className="topbar-actions">
              <button
                className="icon-button theme-toggle"
                onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
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
                  <Icon name="bell" />
                  {pendingApprovalCount > 0 && <i>{pendingApprovalCount}</i>}
                </button>
                {noticeOpen && (
                  <div className="notice-popover" role="status">
                    <strong>Notifications</strong>
                    <p>
                      <span className="dot red" />
                      {pendingApprovalCount
                        ? `${pendingApprovalCount} request${pendingApprovalCount === 1 ? ' is' : 's are'} waiting for approval.`
                        : 'No requests are waiting for approval.'}
                    </p>
                    {pendingApprovalCount > 0 && (
                      <button
                        className="text-button"
                        onClick={() => {
                          setNoticeOpen(false);
                          go('approvals');
                        }}
                      >
                        Open approvals <Icon name="arrow" size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="account-wrap">
                <button className="avatar avatar-small" onClick={() => setAccountOpen((open) => !open)} aria-label="Open account menu" aria-expanded={accountOpen}>FA</button>
                {accountOpen && <div className="account-popover" role="menu"><p className="account-popover-label">SIGNED IN AS</p><strong>Fares Ahmed</strong><small>Employee · fares@elsewedy.com</small><button role="menuitem" onClick={() => { setAccountOpen(false); go('profile-settings'); }}>Profile &amp; settings <Icon name="settings" size={15}/></button><button role="menuitem" className="account-logout" onClick={() => { setAccountOpen(false); logout(); }}>Log out <span>↗</span></button></div>}
              </div>
            </div>
          </header>

          <Ticker items={tickerItems} />
          <RouteContext.Provider value={active}>
          <div className="page-content">
            <div key={active} className={`screen-transition ${transitionPhase}`} data-motion-page={active}>
              {active === 'dashboard' && <Dashboard requests={requests} quotations={quotations} orders={orders} go={go} />}

              {active === 'create-request' && (
                <CreateRequest
                  key={selectedId}
                  initial={requests.find((r) => r.id === selectedId && r.status === 'Draft')}
                  onSubmit={createRequest}
                  go={go}
                />
              )}

              {active === 'my-requests' && (
                <MyRequests
                  requests={requests}
                  go={go}
                  search={search}
                  deleteDraft={deleteDraft}
                />
              )}

              {active === 'track-requests' && (
                <TrackRequests
                  requests={requests}
                  orders={orders}
                  quotations={quotations}
                  go={go}
                />
              )}

              {active === 'request-tracking' && selectedRequest && (
                <RequestTracking
                  request={selectedRequest}
                  order={selectedOrder}
                  quotations={quotations.filter((q) => q.requestId === selectedId)}
                  go={go}
                />
              )}

              {active === 'request-view' && selectedRequest && (
                <RequestDetails
                  request={selectedRequest}
                  order={selectedOrder}
                  go={go}
                  updateStatus={updateStatus}
                  togglePublication={togglePublication}
                />
              )}

              {active === 'approvals' && <Approvals requests={requests} go={go} updateStatus={updateStatus} />}
              {active === 'reports' && <Reports requests={requests} exportCSV={exportCSV} />}
              {active === 'analytics' && <Analytics requests={requests} go={go} />}
              {active === 'ai-assistant' && <Assistant requests={requests} quotations={quotations} orders={orders} go={go} />}
              {active === 'profile-settings' && <ProfileSettings notify={notify} />}
              {active === 'supplier-offers' && <EmployeeOffers quotations={quotations} decide={decideQuotation} />}
              {active === 'purchase-orders' && <EmployeeOrders orders={orders} confirmReceipt={confirmReceipt} />}
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
   DASHBOARD
   ========================================================================= */
function Dashboard({ requests, quotations = [], orders = [], go }) {
  const live = requests.filter((r) => r.status !== 'Draft');
  const pending = requests.filter((r) => r.status === 'Under Review').length;
  const approved = requests.filter((r) => r.status === 'Approved').length;
  const drafts = requests.filter((r) => r.status === 'Draft').length;
  const changes = requests.filter((r) => String(r.status).startsWith('Rejected')).length;
  const completed = orders.filter((o) => o.status === 'Received / Completed').length;
  const total = live.reduce((sum, r) => sum + Number(r.cost || 0), 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date());
  const compact = total >= 1e6 ? `${(total / 1e6).toFixed(2)}M` : total >= 1e3 ? `${Math.round(total / 1e3)}K` : String(total);
  const flow = [
    ['Drafted', drafts],
    ['Under review', pending],
    ['Approved', approved],
    ['Offers in', quotations.length],
    ['PO issued', orders.length],
    ['Received', completed],
  ];
  const reach = flow.reduce((last, [, n], i) => (n > 0 ? i : last), 0);
  const tiles = [
    ['create-request', 'Create request', 'file', 'Raise a new purchase need in minutes', 'xl', './assets/cables/cable-strands.webp'],
    ['approvals', 'Approvals', 'check', `${pending} waiting for a decision`, 'tall', './assets/cables/clipboard.webp'],
    ['supplier-offers', 'Supplier offers', 'users', `${quotations.length} quotations to compare`, 'wide', './assets/cables/container.webp'],
    ['my-requests', 'My requests', 'list', `${requests.length} records in your register`, 'tall', './assets/cables/drum.webp'],
    ['track-requests', 'Track request', 'track', 'Ten milestones, end to end', '', './assets/cables/truck.webp'],
    ['purchase-orders', 'Purchase orders', 'track', `${orders.length} issued orders`, '', './assets/cables/parcel.webp'],
    ['analytics', 'Analytics', 'chart', 'Spend by category and month', '', './assets/cables/coins.webp'],
    ['reports', 'Reports', 'download', 'Audit-ready CSV exports', '', './assets/cables/pylon.webp'],
    ['ai-assistant', 'Smart assistant', 'spark', 'Ask about any request', '', './assets/cables/cable-section.webp'],
    ['profile-settings', 'Settings', 'settings', 'Account and preferences', '', './assets/cables/factory.webp'],
  ];

  return (
    <section className="vx-dash">
      <header className="vx-hero">
        <div className="vx-hero-copy">
          <p className="vx-eyebrow"><i className="vx-live" /> {today} · Employee workspace</p>
          <h1 className="vx-title">{greeting},<br /><em>Fares.</em></h1>
          <p className="vx-lede">
            {pending ? `${pending} request${pending === 1 ? ' is' : 's are'} waiting for your decision` : 'Nothing is waiting on you right now'}, and {money(total)} is moving through the grid.
          </p>
          <div className="vx-hero-actions">
            <button className="vx-btn vx-btn-primary" onClick={() => go('create-request')}>New request <Icon name="arrow" size={16} /></button>
            <button className="vx-btn vx-btn-glass" onClick={() => window.dispatchEvent(new Event('open-command-palette'))}>Jump anywhere <kbd>Ctrl K</kbd></button>
          </div>
        </div>
        <div className="vx-hero-stage">
          <CableHero view="cutaway" />
          <button className="vx-callout vx-callout-a" onClick={() => go('approvals')}><small>Under review</small><b><Count value={pending} pad={2} /></b></button>
          <div className="vx-callout vx-callout-b"><small>In the pipeline</small><b>EGP {compact}</b></div>
          <button className="vx-callout vx-callout-c" onClick={() => go('my-requests')}><small>Approved</small><b><Count value={approved} pad={2} /></b></button>
        </div>
      </header>

      <div className="vx-kpis">
        {[
          ['Requests in the grid', live.length, 'list', `${drafts} draft${drafts === 1 ? '' : 's'} not submitted`, live.length / Math.max(1, requests.length), 'drum'],
          ['Awaiting decision', pending, 'check', pending ? 'Open approvals to decide' : 'All decided', pending / Math.max(1, live.length), 'clipboard'],
          ['Supplier quotations', quotations.length, 'users', `${quotations.filter((q) => q.status === 'Accepted').length} accepted`, Math.min(1, quotations.length / 3), 'coins'],
          ['Purchase orders', orders.length, 'track', `${completed} completed`, orders.length ? completed / orders.length : 0, 'parcel'],
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

      <section className="vx-factory" aria-label="Elsewedy Electric">
        <img src="./assets/cables/factory.webp" alt="" className="vx-factory-img" />
        <div className="vx-factory-copy">
          <p className="vx-eyebrow">Elsewedy Electric · factory to field</p>
          <h2>Every request ends up on a drum,<br /><em>a truck and a site.</em></h2>
          <p>Cables are made, wound, shipped and installed. This portal keeps the paperwork moving at the same pace as the production line.</p>
          <div className="vx-factory-stats">
            <span><b><Count value={requests.length} pad={2} /></b><small>requests</small></span>
            <span><b><Count value={quotations.length} pad={2} /></b><small>quotations</small></span>
            <span><b><Count value={orders.length} pad={2} /></b><small>orders</small></span>
          </div>
        </div>
      </section>

      <section className="vx-flow" aria-label="Request flow">
        <div className="vx-section-head">
          <div><p className="vx-eyebrow">The current</p><h2>Where your requests are</h2></div>
          <button className="vx-link" onClick={() => go('track-requests')}>Open tracking <Icon name="arrow" size={14} /></button>
        </div>
        <div className="vx-flow-line" style={{ '--reach': reach / (flow.length - 1) }}>
          <i className="vx-flow-wire" />
          <i className="vx-flow-live" />
          {flow.map(([label, n], i) => (
            <div className={`vx-flow-node ${i <= reach ? 'on' : ''}`} key={label} style={{ '--i': i }}>
              <span className="vx-flow-dot" />
              <strong><Count value={n} pad={2} /></strong>
              <small>{label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="vx-dests" aria-label="Destinations">
        <div className="vx-section-head">
          <div><p className="vx-eyebrow">Destinations</p><h2>Everything, one move away</h2></div>
          <span className="vx-hint">or press <kbd>Ctrl K</kbd></span>
        </div>
        <nav className="vx-dest-grid">
          {tiles.map(([id, label, icon, detail, size, image], i) => (
            <button key={id} className={`vx-dest ${size ? `vx-dest-${size}` : ''}`} data-tilt onClick={() => go(id)} style={{ '--i': i }}>
              {image && <img src={image} alt="" className={`vx-dest-img ${size ? '' : 'vx-dest-img-sm'}`} />}
              <span className="vx-dest-no">{String(i + 1).padStart(2, '0')}</span>
              <span className="vx-dest-icon"><Icon name={icon} size={20} /></span>
              <span className="vx-dest-copy"><strong>{label}</strong><small>{detail}</small></span>
              <span className="vx-dest-arrow"><Icon name="arrow" size={16} /></span>
            </button>
          ))}
        </nav>
      </section>

      <section className="vx-recent card" aria-label="Recent requests">
        <div className="vx-section-head">
          <div><p className="vx-eyebrow">Recent</p><h2>Latest requests</h2></div>
          <button className="vx-link" onClick={() => go('my-requests')}>All requests <Icon name="arrow" size={14} /></button>
        </div>
        {requests.slice(0, 5).map((r, i) => (
          <button className="vx-row" key={r.id} onClick={() => go('request-view', r.id)} style={{ '--i': i }}>
            <span className="vx-row-id">{r.id}</span>
            <span className="vx-row-main"><strong>{r.title}</strong><small>{r.item}</small></span>
            <span className="vx-row-value">{money(r.cost)}</span>
            <StatusPill status={r.status} />
            <Icon name="arrow" size={15} />
          </button>
        ))}
      </section>
    </section>
  );
}

function SpendLineChart() {
  return (
    <div className="line-chart">
      <div className="chart-ylabels">
        <span>150</span>
        <span>120</span>
        <span>80</span>
        <span>30</span>
        <span>0</span>
      </div>
      <svg viewBox="0 0 560 210" role="img" aria-label="Monthly procurement spend trend">
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#c7111c" stopOpacity=".2" />
            <stop offset="1" stopColor="#c7111c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 180 L40 122 L76 110 L116 65 L152 57 L196 86 L240 100 L282 66 L320 54 L358 72 L396 64 L434 76 L468 23 L505 37 L542 24 L560 0 L560 210 L0 210Z" fill="url(#area)" />
        <path d="M0 180 L40 122 L76 110 L116 65 L152 57 L196 86 L240 100 L282 66 L320 54 L358 72 L396 64 L434 76 L468 23 L505 37 L542 24 L560 0" fill="none" stroke="#c7111c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="chart-xlabels">
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
      </div>
    </div>
  );
}

/* =========================================================================
   SECTION 4: CREATE REQUEST (SAVE AS DRAFT + SUBMIT REQUEST ACTIONS)
   ========================================================================= */
const EMPTY_FORM = {
  title: '',
  category: '',
  item: '',
  description: '',
  quantity: 1,
  unit: 'Piece',
  priority: 'Medium',
  unitPrice: '',
  requiredDate: '',
  location: 'Cairo Office',
  justification: '',
  technicalSpecs: '',
  notes: '',
  department: 'IT Department'
};

function CreateRequest({ onSubmit, go, initial }) {
  const [form, setForm] = useState(() => (initial ? { ...EMPTY_FORM, ...initial } : EMPTY_FORM));
  const [attachment, setAttachment] = useState(initial?.attachmentName || '');

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const total = (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0);

  function saveAsDraft() {
    const draftTitle = form.title.trim() || 'Untitled Draft Request';
    onSubmit({
      ...form,
      id: initial?.id,
      title: draftTitle,
      item: form.item.trim() || draftTitle,
      attachmentName: attachment,
      status: 'Draft',
      cost: total,
      quantity: Number(form.quantity) || 1
    });
  }

  function submitRequest(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    onSubmit({
      ...form,
      id: initial?.id,
      title: form.title.trim(),
      item: form.item.trim() || form.title.trim(),
      attachmentName: attachment,
      status: 'Under Review',
      cost: total,
      quantity: Number(form.quantity) || 1,
      submittedAt: new Date().toISOString()
    });
  }

  return (
    <>
      <PageHeading
        title={initial ? `Edit Draft Request (${initial.id})` : 'Create a New Purchase Request'}
        subtitle="Add purchase specifications, delivery requirements, and business justification."
        eyebrow="PROCUREMENT REQUEST"
        action={
          <Button variant="secondary" onClick={() => go('my-requests')}>
            Cancel
          </Button>
        }
      />

      <form className="request-form" onSubmit={submitRequest}>
        <Card className="employee-card">
          <div className="section-title">
            <h2>Employee Information</h2>
            <span className="section-plus">+</span>
          </div>
          <DetailRows
            rows={[
              ['Employee Name', 'Fares Ahmed'],
              ['Employee ID', 'EMP-1045'],
              ['Department', form.department],
              ['Role', 'Procurement Officer'],
              ['Email', 'fares@elsewedy.com']
            ]}
          />
        </Card>

        <Card className="purchase-card">
          <div className="section-title">
            <h2>Purchase Information</h2>
            <span className="section-plus">−</span>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Request Title <i>*</i></span>
              <input
                value={form.title}
                onChange={set('title')}
                placeholder="e.g. Workstation Laptops for Marketing"
                required
              />
            </label>

            <label className="field">
              <span>Purchase Category <i>*</i></span>
              <select value={form.category} onChange={set('category')} required>
                <option value="">Select a category</option>
                {CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Item / Product Name <i>*</i></span>
              <input
                value={form.item}
                onChange={set('item')}
                placeholder="Product or service name"
                required
              />
            </label>

            <label className="field">
              <span>Item Description <i>*</i></span>
              <input
                value={form.description}
                onChange={set('description')}
                placeholder="Brief specifications or purpose"
                required
              />
            </label>

            <label className="field">
              <span>Quantity <i>*</i></span>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={set('quantity')}
                required
              />
            </label>

            <label className="field">
              <span>Unit of Measure</span>
              <select value={form.unit} onChange={set('unit')}>
                <option>Piece</option>
                <option>Box</option>
                <option>Set</option>
                <option>Meter</option>
                <option>Service</option>
              </select>
            </label>

            <label className="field">
              <span>Priority</span>
              <select value={form.priority} onChange={set('priority')}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </label>

            <label className="field">
              <span>Estimated Unit Price (EGP) <i>*</i></span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={set('unitPrice')}
                placeholder="0.00"
                required
              />
            </label>
          </div>
        </Card>

        <Card className="budget-card">
          <div className="section-title">
            <h2>Budget &amp; Cost</h2>
          </div>
          <div className="cost-preview">
            <span>Estimated Total Cost</span>
            <strong>{money(total)}</strong>
          </div>
          <small>Final budget allocation is subject to department approval.</small>
        </Card>

        <Card className="delivery-card">
          <div className="section-title">
            <h2>Delivery Information</h2>
          </div>
          <label className="field">
            <span>Required Delivery Date <i>*</i></span>
            <input type="date" value={form.requiredDate} onChange={set('requiredDate')} required />
          </label>
          <label className="field">
            <span>Delivery Location</span>
            <input value={form.location} onChange={set('location')} placeholder="e.g. Cairo Headquarters" />
          </label>
          <label className="field">
            <span>Delivery Notes</span>
            <input value={form.notes} onChange={set('notes')} placeholder="Optional site or receiving notes" />
          </label>
        </Card>

        <Card className="justification-card">
          <div className="section-title">
            <h2>Justification &amp; Technical Specs</h2>
          </div>
          <label className="field">
            <span>Business Justification <i>*</i></span>
            <textarea
              rows="2"
              value={form.justification}
              onChange={set('justification')}
              placeholder="Why is this purchase required?"
              required
            />
          </label>

          <label className="field">
            <span>Detailed Technical Specifications</span>
            <textarea
              rows="2"
              value={form.technicalSpecs}
              onChange={set('technicalSpecs')}
              placeholder="Electrical, physical or standard requirements..."
            />
          </label>

          <label className="file-picker">
            <Icon name="plus" size={16} />
            <span>{attachment || 'Attach supporting document (RFP/BOM)'}</span>
            <input type="file" onChange={(e) => setAttachment(e.target.files?.[0]?.name || '')} />
          </label>
        </Card>

        <div className="form-actions">
          <Button variant="secondary" onClick={() => go('my-requests')}>
            Cancel
          </Button>
          <Button variant="secondary" type="button" onClick={saveAsDraft}>
            Save as Draft
          </Button>
          <Button type="submit" icon="arrow">
            Submit Request
          </Button>
        </div>
      </form>
    </>
  );
}

/* =========================================================================
   SECTION 3: MY REQUESTS (FULL ACCESS TO REQUESTS + VIEW TO DETAILS)
   ========================================================================= */
function MyRequests({ requests, go, search, deleteDraft }) {
  const [status, setStatus] = useState('All Statuses');
  const [category, setCategory] = useState('All Categories');
  const [query, setQuery] = useState(search || '');
  const [range, setRange] = useState('');
  const [selectedId, setSelectedId] = useState(requests[0]?.id || '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(
    () =>
      requests.filter((request) => {
        const matchesStatus =
          status === 'All Statuses' ||
          request.status === status ||
          (status === 'Rejected' && request.status === 'Rejected for Change');
        const matchesCategory = category === 'All Categories' || request.category === category;
        const matchesQuery = `${request.id} ${request.title} ${request.category} ${request.status} ${request.item}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesDate = !range || request.date >= range;
        return matchesStatus && matchesCategory && matchesQuery && matchesDate;
      }),
    [requests, status, category, query, range]
  );

  const counts = [
    ['Draft', requests.filter((r) => r.status === 'Draft').length, 'orange'],
    ['Under Review', requests.filter((r) => r.status === 'Under Review').length, 'blue'],
    ['Approved', requests.filter((r) => r.status === 'Approved').length, 'green'],
    ['Rejected', requests.filter((r) => ['Rejected', 'Rejected for Change'].includes(r.status)).length, 'red']
  ];
  const selected = filtered.find((request) => request.id === selectedId) || filtered[0];
  const hasFilters = status !== 'All Statuses' || category !== 'All Categories' || range;
  const clearFilters = () => { setStatus('All Statuses'); setCategory('All Categories'); setRange(''); setQuery(''); };

  return (
    <>
      <PageHeading
        title="My Purchase Requests"
        subtitle="Manage and track procurement requests created by your department."
        eyebrow="PROCUREMENT MANAGEMENT"
        action={
          <Button onClick={() => go('create-request')} icon="plus">
            Create New Request
          </Button>
        }
      />

      <section className="request-status-overview" aria-label="Request status distribution">
        <div className="request-total"><span>YOUR REQUESTS</span><strong>{requests.length.toString().padStart(2,'0')}</strong><small>records in this workspace</small></div>
        <div className="request-status-main"><div className="request-status-bar" aria-hidden="true">{counts.map(([label,value])=><span key={label} className={`segment-${label.toLowerCase().replaceAll(' ','-')}`} style={{width:`${requests.length ? (value/requests.length)*100 : 0}%`}}/>)}</div><div className="request-status-keys"><button className={status==='All Statuses'?'active':''} onClick={()=>setStatus('All Statuses')}><i className="key-total"/>All <b>{requests.length}</b></button>{counts.map(([label,value,color])=><button key={label} className={status===label?'active':''} onClick={()=>setStatus(label==='Rejected'?'Rejected':label)}><i className={`key-${color}`}/>{label}<b>{value}</b></button>)}</div></div>
      </section>

      <section className="request-commandbar" aria-label="Search and filter requests"><label className="request-command-search"><Icon name="search" size={16}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Find a request by ID, item or department"/><kbd>⌕</kbd></label><button className={`filter-toggle ${filtersOpen?'active':''}`} onClick={()=>setFiltersOpen((open)=>!open)} aria-expanded={filtersOpen}><Icon name="settings" size={15}/> Refine {hasFilters&&<i/>}</button><span className="request-result-count">{filtered.length} OF {requests.length}</span>{(query||hasFilters)&&<button className="clear-request-filters" onClick={clearFilters}>Clear</button>}</section>
      {filtersOpen&&<div className="request-refine-panel"><label>Status<select value={status} onChange={(e)=>setStatus(e.target.value)}><option>All Statuses</option>{['Draft','Under Review','Approved','Rejected','Rejected for Change'].map((item)=><option key={item}>{item}</option>)}</select></label><label>Category<select value={category} onChange={(e)=>setCategory(e.target.value)}><option>All Categories</option>{CATEGORIES.map((item)=><option key={item}>{item}</option>)}</select></label><label>Submitted on or after<input aria-label="Filter after date" type="date" value={range} onChange={(e)=>setRange(e.target.value)}/></label></div>}

      <section className="request-workspace" aria-label="Request records and selected request details">
        <div className="request-record-list"><div className="request-list-heading"><div><span>REQUEST REGISTER</span><strong>{filtered.length} <small>records</small></strong></div><span>SELECT A REQUEST</span></div>
          {filtered.map((request,index)=><button key={request.id} type="button" className={`request-entry ${selected?.id===request.id?'selected':''}`} onClick={()=>setSelectedId(request.id)} aria-pressed={selected?.id===request.id}><span className="request-entry-index">{String(index+1).padStart(2,'0')}</span><span className="request-entry-content"><span className="request-entry-top"><span className="request-id">{request.id}</span><StatusPill status={request.status}/></span><strong>{request.title}</strong><small className="request-item-line">{request.item}</small><span className="request-entry-meta"><span>{request.category}</span><i/> <span>{request.department}</span></span></span><span className="request-entry-value"><strong>{money(request.cost)}</strong><small>{request.quantity} {request.unit||'Piece'} · {request.priority||'Medium'}</small><small>{request.submittedAt?new Date(request.submittedAt).toLocaleDateString():request.status==='Draft'?'Not submitted':request.date}</small></span><span className="request-entry-arrow"><Icon name="arrow" size={17}/></span></button>)}
          {filtered.length===0&&<div className="request-empty"><span>0</span><h2>No matching requests</h2><p>Clear or refine the filters to find a request.</p><button onClick={clearFilters}>Reset search</button></div>}
        </div>
        {selected&&<aside className="request-inspector"><div className="inspector-kicker"><span>SELECTED RECORD</span><span>01 / {String(filtered.length).padStart(2,'0')}</span></div><span className="request-id">{selected.id}</span><h2>{selected.title}</h2><p className="inspector-item">{selected.item}</p><div className="inspector-status"><StatusPill status={selected.status}/><span className={`priority-pill priority-${(selected.priority||'medium').toLowerCase()}`}>{selected.priority||'Medium'} priority</span></div><div className="inspector-value"><small>ESTIMATED VALUE</small><strong>{money(selected.cost)}</strong></div><dl className="inspector-data"><div><dt>Category</dt><dd>{selected.category}</dd></div><div><dt>Department</dt><dd>{selected.department}</dd></div><div><dt>Quantity</dt><dd>{selected.quantity} {selected.unit||'Piece'}</dd></div><div><dt>Submitted</dt><dd>{selected.submittedAt?new Date(selected.submittedAt).toLocaleDateString():selected.status==='Draft'?'Draft · not submitted':selected.date}</dd></div></dl><div className="inspector-note"><span>BUSINESS JUSTIFICATION</span><p>{selected.justification||'No additional justification was provided.'}</p></div><div className="inspector-actions"><Button variant="primary" onClick={()=>go('request-view',selected.id)} icon="arrow">Open full details</Button><Button variant="secondary" onClick={()=>go('request-tracking',selected.id)} icon="track">Track progress</Button>{selected.status==='Draft'&&<><Button variant="outline" onClick={()=>go('create-request',selected.id)}>Edit draft</Button><button className="delete-draft-action" onClick={()=>deleteDraft(selected.id)}>Delete draft</button></>}</div></aside>}
      </section>
    </>
  );
}

/* =========================================================================
   SECTION 3: REQUEST DETAILS (FULL REQUEST INFO + VISIBLE TRACK BUTTON)
   ========================================================================= */
function RequestDetails({ request, order, go, updateStatus, togglePublication }) {
  const [rejectOpen, setRejectOpen] = useState(false);

  if (!request) return <EmptyRequests go={go} />;
  const isReviewed = ['Approved', 'Rejected', 'Rejected for Change'].includes(request.status);
  const isUnderReview = request.status === 'Under Review';
  const isApproved = request.status === 'Approved';
  const isRejected = ['Rejected', 'Rejected for Change'].includes(request.status);

  return (
    <>
      <div className="request-detail-actions">
        <button className="back-link" onClick={() => go('my-requests')}>
          ← <span>Back to My Requests</span>
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" onClick={() => go('request-tracking', request.id)} icon="track">
            Track Request
          </Button>
          {isApproved && (
            <Button
              variant="secondary"
              onClick={() => togglePublication(request.id)}
            >
              {request.visibleToSuppliers ? 'Unpublish from Suppliers' : 'Publish to Suppliers'}
            </Button>
          )}
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
            Category: {request.category} · Priority: {request.priority || 'Medium'} · Submitted: {request.date}
          </p>
        </div>
        <div className="summary-status">
          <StatusPill status={request.status} />
          {isUnderReview && (
            <div className="review-actions">
              <Button variant="danger-outline" onClick={() => setRejectOpen(true)}>
                Reject
              </Button>
              <Button variant="success" onClick={() => updateStatus(request.id, 'Approved')}>
                Approve
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* APPROVAL CONDITIONS BANNER */}
      {isUnderReview && (
        <div className="data-boundary-note" style={{ borderLeftColor: '#dd7c35' }}>
          <strong>Status: Under Review.</strong> This request is currently awaiting department and procurement approval. Full purchase order and shipment tracking becomes available after approval and Purchase Order creation.
        </div>
      )}

      {isApproved && (
        <div className="data-boundary-note" style={{ borderLeftColor: 'var(--green)' }}>
          <strong>Approved on {request.approvalAt ? new Date(request.approvalAt).toLocaleString() : request.date}.</strong> Procurement review and supplier quotation stage is active. {order ? `Purchase Order ${order.id} is created.` : 'Awaiting Purchase Order generation.'}
        </div>
      )}

      {isRejected && (
        <div className="data-boundary-note" style={{ borderLeftColor: '#c7111c' }}>
          <strong>Request Declined:</strong> {request.feedback || 'This request was rejected during review. Resubmit with revisions to proceed.'}
        </div>
      )}

      <div className="details-grid">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Card>
            <h2>1. Request Overview &amp; Employee Info</h2>
            <DetailRows
              rows={[
                ['Employee Name', request.employee || 'Fares Ahmed'],
                ['Department', request.department],
                ['Category', request.category],
                ['Item Name', request.item || request.title],
                ['Quantity', `${request.quantity} ${request.unit || 'Piece'}`],
                ['Estimated Cost', money(request.cost)],
                ['Priority', request.priority || 'Medium']
              ]}
            />
          </Card>

          <Card>
            <h2>2. Technical Specifications</h2>
            <p className="body-copy">
              {request.technicalSpecs || request.description || 'Standard technical specifications apply.'}
            </p>
          </Card>

          <Card>
            <h2>3. Business Justification</h2>
            <p className="body-copy">
              {request.justification || 'No justification provided.'}
            </p>
          </Card>

          <Card>
            <h2>4. Attachments &amp; Documentation</h2>
            {request.attachmentName ? (
              <div className="attachment-row">
                <span className="file-icon">DOC</span>
                <span>
                  {request.attachmentName}
                  <small>Recorded attachment file</small>
                </span>
              </div>
            ) : (
              <p className="attachment-empty">No supporting document attached.</p>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Card>
            <h2>5. Delivery Information</h2>
            <DetailRows
              rows={[
                ['Required Delivery Date', request.requiredDate || '—'],
                ['Delivery Location', request.location || '—'],
                ['Delivery Notes', request.notes || '—']
              ]}
            />
          </Card>

          <Card className="approval-timeline">
            <h2>6. Approval Workflow &amp; History</h2>
            <div className="timeline">
              <div className="timeline-item complete">
                <span>✓</span>
                <div>
                  <strong>Request Submitted</strong>
                  <small>{request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : request.date} · {request.employee}</small>
                </div>
              </div>
              <div className={`timeline-item ${isUnderReview ? 'current' : isApproved ? 'complete' : isRejected ? 'rejected' : ''}`}>
                <span>{isApproved ? '✓' : isRejected ? '×' : '2'}</span>
                <div>
                  <strong>Department Review &amp; Approval</strong>
                  <small>{isUnderReview ? 'Awaiting review decision' : request.status}</small>
                </div>
              </div>
              <div className={`timeline-item ${isApproved ? (order ? 'complete' : 'current') : ''}`}>
                <span>{order ? '✓' : '3'}</span>
                <div>
                  <strong>Procurement &amp; PO Creation</strong>
                  <small>{order ? `PO ${order.id} Issued` : isApproved ? 'Ready for Purchase Order' : 'Pending Approval'}</small>
                </div>
              </div>
            </div>

            {request.history && request.history.length > 0 && (
              <div style={{ marginTop: '14px', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
                <strong style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Decision Audit History:</strong>
                {request.history.map((h, i) => (
                  <div key={i} style={{ fontSize: '11px', color: 'var(--muted)', margin: '3px 0' }}>
                    • {new Date(h.at).toLocaleString()} — <strong>{h.status}</strong> by {h.by}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {order && (
            <Card>
              <h2>7. Associated Purchase Order</h2>
              <DetailRows
                rows={[
                  ['Purchase Order Reference', order.id],
                  ['Supplier', order.supplierName],
                  ['Order Status', order.status],
                  ['Total Amount', money(order.total, order.currency)]
                ]}
              />
              <Button onClick={() => go('purchase-orders')} icon="arrow" style={{ marginTop: '12px' }}>
                Open Purchase Order Tracking
              </Button>
            </Card>
          )}
        </div>
      </div>

      {rejectOpen && (
        <Modal title="Reject Request?" close={() => setRejectOpen(false)}>
          <p className="modal-copy">
            Reject <strong>{request.id}</strong>? Its status will change to Rejected and fulfillment will be blocked.
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Keep Request
            </Button>
            <Button
              variant="danger-outline"
              onClick={() => {
                updateStatus(request.id, 'Rejected');
                setRejectOpen(false);
              }}
            >
              Confirm Rejection
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* =========================================================================
   SECTION 2: TRACK REQUESTS (RESTRUCTURED - EXCLUSIVELY DEDICATED TO TRACKING)
   ========================================================================= */
function TrackRequests({ requests, orders, quotations, go }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All Statuses');
  const [department, setDepartment] = useState('All Departments');
  const [date, setDate] = useState('');

  const departments = [...new Set(requests.map((r) => r.department).filter(Boolean))];

  const rows = requests.filter((r) => {
    const textMatch = `${r.id} ${r.title}`.toLowerCase().includes(query.toLowerCase());
    const statMatch = status === 'All Statuses' || r.status === status;
    const deptMatch = department === 'All Departments' || r.department === department;
    const dateMatch = !date || r.date >= date;
    return textMatch && statMatch && deptMatch && dateMatch;
  });

  const getWorkflowStage = (r) => {
    if (r.status === 'Draft') return 'Draft (Not Submitted)';
    if (r.status === 'Under Review') return 'Department Review';
    if (['Rejected', 'Rejected for Change'].includes(r.status)) return 'Blocked · Rejected';
    const po = orders.find((o) => o.requestId === r.id);
    if (po) {
      if (po.status === 'Received / Completed') return 'Completed';
      if (['Delivered', 'Delivered — Awaiting Employee Confirmation'].includes(po.status)) return 'Delivery';
      return 'Order Fulfillment';
    }
    const quote = quotations.find((q) => q.requestId === r.id);
    if (quote) return 'Supplier Selection / Quotation';
    return 'Procurement Review';
  };

  return (
    <>
      <PageHeading
        title="Track Request"
        subtitle="Dedicated procurement lifecycle tracking. Follow review approvals and purchase order fulfillment progress."
        eyebrow="REQUEST STATUS & LIFECYCLE"
      />

      <section className="tracking-workspace">
        <div className="tracking-commandbar">
          <label className="filter-search">
            <Icon name="search" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Request ID or Title..."
            />
          </label>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All Statuses</option>
            {['Draft', 'Under Review', 'Approved', 'Rejected', 'Rejected for Change'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option>All Departments</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          <input
            aria-label="Filter after date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <span className="tracking-match-count">{rows.length} journeys</span>
        </div>
        <div className="tracking-feed">{rows.map((r,index)=>{
          const order=orders.find((item)=>item.requestId===r.id);
          const quote=quotations.find((item)=>item.requestId===r.id);
          const progress=r.status==='Draft'?0:['Rejected','Rejected for Change'].includes(r.status)?23:r.status==='Under Review'?18:order?.status==='Received / Completed'?100:order&&['Delivered','Delivered — Awaiting Employee Confirmation'].includes(order.status)?90:order?75:quote?58:r.status==='Approved'?39:0;
          return <article key={r.id} className={`tracking-record ${r.status==='Draft'?'is-draft':''}`}><div className="tracking-spine"><span>{String(index+1).padStart(2,'0')}</span><i/></div><div className="tracking-record-body"><div className="tracking-record-head"><div><span className="request-id">{r.id}</span><small>{r.department}</small></div><StatusPill status={r.status}/></div><h2>{r.title}</h2><div className="tracking-stage-line"><span>NOW AT</span><strong>{getWorkflowStage(r)}</strong><span>{Math.round(progress)}%</span></div><div className="tracking-progress" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"><i style={{width:`${progress}%`}}/></div><div className="tracking-record-meta"><span>SUBMITTED <b>{r.submittedAt?new Date(r.submittedAt).toLocaleDateString():r.status==='Draft'?'Not submitted':r.date}</b></span><span>UPDATED <b>{r.updatedAt?new Date(r.updatedAt).toLocaleDateString():r.date}</b></span><span>EST. VALUE <b>{money(r.cost)}</b></span><Button variant="outline" onClick={()=>go('request-tracking',r.id)} icon="track">Open journey</Button></div></div></article>;
        })}{rows.length===0&&<div className="request-empty"><span>0</span><h2>No requests match these tracking filters</h2><p>Adjust your search, department, status or date to view a procurement journey.</p></div>}</div>
      </section>
    </>
  );
}

/* =========================================================================
   SECTION 2: DEDICATED REQUEST TRACKING DETAILS (EXACT 10 STAGES + APPROVAL GATE)
   ========================================================================= */
function RequestTracking({ request, order, quotations, go }) {
  if (!request) return <EmptyRequests go={go} />;

  const isDraft = request.status === 'Draft';
  const isUnderReview = request.status === 'Under Review';
  const isRejected = ['Rejected', 'Rejected for Change'].includes(request.status);
  const isApproved = request.status === 'Approved';

  const quote = quotations[0];
  const po = order;

  // 10 Essential Stages strictly following Section 2:
  const STAGES = [
    'Request Submitted',
    'Department Review',
    'Department Approval',
    'Procurement Review',
    'Supplier Selection / Quotation',
    'Purchase Order Issued',
    'Order Fulfillment',
    'Delivery',
    'Employee Receipt Confirmation',
    'Completed'
  ];

  // Stage calculation
  let currentStageIdx = 0;
  if (isDraft) {
    currentStageIdx = -1;
  } else if (isUnderReview) {
    currentStageIdx = 1; // Department Review
  } else if (isRejected) {
    currentStageIdx = 2; // Blocked at Department Approval
  } else if (isApproved) {
    if (!quote && !po) {
      currentStageIdx = 3; // Procurement Review
    } else if (quote && !po) {
      currentStageIdx = 4; // Supplier Selection / Quotation
    } else if (po) {
      if (po.status === 'Received / Completed') {
        currentStageIdx = 9; // Completed
      } else if (['Delivered', 'Delivered — Awaiting Employee Confirmation'].includes(po.status)) {
        currentStageIdx = 8; // Employee Receipt Confirmation
      } else if (['Shipped', 'In Transit'].includes(po.status)) {
        currentStageIdx = 7; // Delivery
      } else {
        currentStageIdx = 6; // Order Fulfillment
      }
    }
  }

  const stageExplanations = [
    'Procurement request recorded in the system.',
    isUnderReview ? 'Department head is currently evaluating the request.' : 'Department review completed.',
    isApproved ? `Approved on ${request.approvalAt ? new Date(request.approvalAt).toLocaleDateString() : 'N/A'}.` : isRejected ? 'Approval blocked by rejection.' : 'Pending department approval.',
    isApproved ? 'Procurement team reviewing sourcing strategy.' : 'Requires department approval first.',
    quote ? `Quotation ${quote.id} (${quote.status}) under evaluation.` : 'Supplier selection pending.',
    po ? `Purchase Order ${po.id} issued to ${po.supplierName}.` : 'PO generated after quotation acceptance.',
    po ? `Order in progress: ${po.status}.` : 'Fulfillment tracking begins after PO issuance.',
    po && ['Shipped', 'In Transit', 'Delivered'].includes(po.status) ? `Carrier: ${po.carrier || 'Logistics Fleet'} · In transit` : 'Delivery tracking starts when dispatched.',
    po?.status === 'Delivered' || po?.status === 'Delivered — Awaiting Employee Confirmation' ? 'Goods delivered to site. Employee inspection and receipt confirmation required.' : 'Employee confirms receipt upon site delivery.',
    po?.status === 'Received / Completed' ? 'Order received, verified, and officially completed.' : 'Final milestone after confirmed receipt.'
  ];

  return (
    <>
      <div className="request-detail-actions">
        <button className="back-link" onClick={() => go('track-requests')}>
          ← Back to Track Request List
        </button>
        <Button variant="secondary" onClick={() => go('request-view', request.id)}>
          View Request Details
        </Button>
      </div>

      <Card className="request-summary">
        <div className="summary-icon">
          <Icon name="track" size={26} />
        </div>
        <div className="summary-title">
          <span className="request-id">{request.id}</span>
          <h1>{request.title}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '12px' }}>
            Department: {request.department} · Estimated Cost: {money(request.cost)}
          </p>
        </div>
        <div className="summary-status">
          <StatusPill status={request.status} />
          <span>Stage: {currentStageIdx < 0 ? 'Draft' : STAGES[currentStageIdx]}</span>
        </div>
      </Card>

      {/* APPROVAL GATE (CRITICAL REQUIREMENT SECTION 2) */}
      {isDraft && (
        <div className="data-boundary-note">
          <strong>Draft Request:</strong> This request is currently saved as a draft and has not been submitted for approval yet.
        </div>
      )}

      {isUnderReview && (
        <div className="data-boundary-note" style={{ borderLeftColor: '#dd7c35' }}>
          <strong>This request has not been approved yet.</strong>
          <p style={{ margin: '4px 0 0' }}>
            Status: <strong>Under Review</strong>. Your request is currently awaiting approval. Full order tracking will become available after approval and Purchase Order creation.
          </p>
        </div>
      )}

      {isApproved && !po && (
        <div className="data-boundary-note" style={{ borderLeftColor: 'var(--green)' }}>
          <strong>Request approved – Awaiting Purchase Order creation.</strong>
          <p style={{ margin: '4px 0 0' }}>
            Approval was granted on {request.approvalAt ? new Date(request.approvalAt).toLocaleString() : 'recently'}. Full order fulfillment tracking becomes active once the official Purchase Order exists.
          </p>
        </div>
      )}

      {isRejected && (
        <div className="data-boundary-note" style={{ borderLeftColor: 'var(--red)' }}>
          <strong>This request was rejected.</strong>
          <p style={{ margin: '4px 0 0' }}>
            Fulfillment and delivery tracking are blocked. Feedback: {request.feedback || 'Please review with your department manager.'}
          </p>
        </div>
      )}

      {po && (
        <div className="data-boundary-note" style={{ borderLeftColor: 'var(--green)' }}>
          <strong>Purchase Order Active ({po.id}):</strong> Order fulfillment tracking is live. Follow shipment and delivery updates below.
        </div>
      )}

      {/* Essential Tracking Info Table */}
      <Card className="request-tracking-card" style={{ marginTop: '14px' }}>
        <DetailRows
          rows={[
            ['Request ID', request.id],
            ['Request Title', request.title],
            ['Submission Date', request.submittedAt ? new Date(request.submittedAt).toLocaleString() : isDraft ? 'Not submitted' : request.date],
            ['Approval Date', request.approvalAt ? new Date(request.approvalAt).toLocaleString() : isApproved ? 'Recorded' : 'Pending approval'],
            ['Current Stage', currentStageIdx < 0 ? 'Draft' : STAGES[currentStageIdx]],
            ['Current Status', request.status],
            ['Last Update Date', request.updatedAt ? new Date(request.updatedAt).toLocaleString() : request.date],
            ['Responsible Department or Party', isUnderReview ? 'Department Head' : isApproved && !po ? 'Procurement Committee' : po ? po.supplierName : 'Requesting Employee'],
            ['Expected Next Step', isDraft ? 'Submit request for approval' : isUnderReview ? 'Review decision' : isApproved && !po ? 'Issue Purchase Order' : po ? `Supplier delivery (${po.status})` : '—']
          ]}
        />

        {/* Clean 10-Stage Visual Timeline */}
        <div className="request-timeline" style={{ marginTop: '24px' }}>
          {STAGES.map((stageName, i) => {
            const isBlocked = isRejected && i >= 2;
            const isDone = !isDraft && !isBlocked && i < currentStageIdx;
            const isCurrent = !isDraft && !isBlocked && i === currentStageIdx;

            return (
              <div
                key={stageName}
                className={`request-stage ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''} ${isBlocked ? 'blocked' : ''}`}
              >
                <span>{isDone ? '✓' : isBlocked ? '×' : String(i + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{stageName}</strong>
                  <small>
                    {isCurrent ? 'Current Active Stage' : isDone ? 'Completed' : isBlocked ? 'Blocked by Rejection' : 'Upcoming Stage'}
                  </small>
                  <p>{stageExplanations[i]}</p>
                </div>
              </div>
            );
          })}
        </div>

        {po && (
          <div style={{ marginTop: '20px' }}>
            <Button onClick={() => go('purchase-orders')} icon="arrow">
              View Purchase Order &amp; Confirm Receipt →
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}

/* =========================================================================
   APPROVALS, REPORTS, ANALYTICS, ASSISTANT, SETTINGS, ORDERS
   ========================================================================= */
function Approvals({ requests, go, updateStatus }) {
  const [rejecting, setRejecting] = useState(null);
  const waiting = requests.filter((request) => request.status === 'Under Review');

  return (
    <>
      <PageHeading
        title="Approvals"
        subtitle="Review purchase requests waiting for your authorization."
        eyebrow="DEPARTMENT AUTHORIZATION"
        action={
          <Button variant="secondary" onClick={() => go('my-requests')}>
            View All Requests <Icon name="arrow" size={14} />
          </Button>
        }
      />

      <section className="approval-section">
        <div className="section-heading">
          <h2>Pending Approvals</h2>
          <p>{waiting.length} requests require your attention</p>
        </div>

        {waiting.length ? (
          waiting.map((request, index) => (
            <Card className="approval-card" key={request.id}>
              <span className={`supplier-symbol ${index % 2 ? 'orange' : 'blue'}`}>□</span>
              <div className="approval-main">
                <strong>{request.title}</strong>
                <small>
                  {request.department} · {request.id}
                </small>
              </div>
              <strong className="approval-cost">{money(request.cost)}</strong>
              <div className="approval-buttons">
                <Button variant="outline" onClick={() => go('request-view', request.id)}>
                  Review
                </Button>
                <Button variant="danger-outline" onClick={() => setRejecting(request)}>
                  Reject
                </Button>
                <Button variant="success" onClick={() => updateStatus(request.id, 'Approved')}>
                  Approve
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <EmptyRequests go={go} />
        )}
      </section>

      {rejecting && (
        <Modal title="Reject Request?" close={() => setRejecting(null)}>
          <p className="modal-copy">
            Reject <strong>{rejecting.id}</strong> — {rejecting.title}? Status will change to Rejected.
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger-outline"
              onClick={() => {
                updateStatus(rejecting.id, 'Rejected');
                setRejecting(null);
              }}
            >
              Confirm Rejection
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

function EmptyRequests({ go }) {
  return (
    <Card className="empty-state">
      <h2>All caught up</h2>
      <p>There are no procurement requests pending your decision.</p>
      <Button variant="secondary" onClick={() => go('my-requests')}>
        View My Requests
      </Button>
    </Card>
  );
}

function Reports({ requests, exportCSV }) {
  const [showCustom, setShowCustom] = useState(false);
  const [category, setCategory] = useState('All Categories');

  const reports = [
    ['Procurement Request Report', 'Detailed activity of all procurement requests.', 'file'],
    ['Supplier Spend Analysis', 'Export local expenditure data itemized by category.', 'chart'],
    ['Department Budget Status', 'Departmental procurement allocation summary.', 'users']
  ];

  return (
    <>
      <PageHeading
        title="Reports &amp; Data Exports"
        subtitle="Generate and download audit reports for procurement compliance."
        eyebrow="COMPLIANCE & AUDIT"
      />

      <div className="report-grid">
        {reports.map(([title, description, icon]) => (
          <Card className="report-card" key={title}>
            <div className="report-icon">
              <Icon name={icon} size={28} />
            </div>
            <h2>{title}</h2>
            <p>{description}</p>
            <Button
              variant="secondary"
              onClick={() =>
                exportCSV(
                  title,
                  category === 'All Categories' ? requests : requests.filter((r) => r.category === category)
                )
              }
            >
              Download CSV <Icon name="download" size={14} />
            </Button>
          </Card>
        ))}
      </div>
    </>
  );
}

function Analytics({ requests, go }) {
  const total = requests.reduce((sum, request) => sum + Number(request.cost || 0), 0);
  const categories = CATEGORIES.slice(0, 3).map((name) => ({
    name,
    value: requests.filter((r) => r.category === name).reduce((sum, r) => sum + Number(r.cost || 0), 0)
  }));
  const denominator = Math.max(total, 1);
  const distribution = categories.map((item) => (item.value / denominator) * 100);

  let cumulative = 0;
  const gradient = `conic-gradient(${categories
    .map((item, index) => {
      const color = ['#c7111c', '#ed9b51', '#5c78a4'][index];
      const part = distribution[index];
      const segment = `${color} ${cumulative}% ${cumulative + part}%`;
      cumulative += part;
      return segment;
    })
    .join(', ')})`;

  return (
    <>
      <PageHeading
        title="Procurement Analytics"
        subtitle="Spending breakdowns, supplier scorecards, and category distributions."
        eyebrow="ANALYTICS & METRICS"
      />
      <div className="analytics-top">
        <Card className="total-spend motion-tilt">
          <h2>Total Spend</h2>
          <strong>{money(total)}</strong>
          <span className="trend">↑ 12% vs prior quarter</span>
        </Card>
        <Card className="category-card motion-tilt">
          <h2>Spend by Category</h2>
          <div className="category-chart-row">
            <div className="donut" style={{ background: gradient }}>
              <span>{Math.round(distribution[0] || 0)}%</span>
            </div>
            <div className="legend">
              {categories.map((item, index) => (
                <div key={item.name}>
                  <span className={`legend-dot legend-${index}`} />
                  {item.name}
                  <b>{Math.round(distribution[index] || 0)}%</b>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function Assistant({ requests, quotations, orders, go }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello Fares. I can help you find information in this workspace and take you to the right procurement workflow. What are you working on?',
      action: null
    }
  ]);
  const [value, setValue] = useState('');

  function send(text = value) {
    const msg = text.trim();
    if (!msg) return;
    setMessages((m) => [...m, { role: 'user', text: msg }]);
    setValue('');

    const lower = msg.toLowerCase();
    let reply = `I can search the local procurement records and guide you through supported workflows. This workspace contains ${requests.length} requests. This demo uses local rules and browser data; it is not connected to a live AI service.`;
    let action = null;
    if (lower.includes('approval') || lower.includes('pending')) {
      const pending = requests.filter((r) => r.status === 'Under Review');
      reply = pending.length ? `${pending.length} request${pending.length===1?' is':'s are'} waiting for review: ${pending.slice(0,3).map((r)=>`${r.id} — ${r.title}`).join('; ')}.` : 'There are no requests waiting for review in the current local records.';
      action = { label: 'Open approvals', page: 'approvals' };
    } else if (lower.includes('order') || lower.includes('po')) {
      reply = orders?.length ? `There ${orders.length===1?'is':'are'} ${orders.length} purchase order${orders.length===1?'':'s'} in the local workspace: ${orders.slice(0,3).map((o)=>`${o.id} · ${o.status}`).join('; ')}.` : 'There are no purchase orders in the local workspace yet.';
      action = { label: 'Open purchase orders', page: 'purchase-orders' };
    } else if (lower.includes('offer') || lower.includes('quotation') || lower.includes('supplier')) {
      reply = quotations?.length ? `${quotations.length} supplier offer${quotations.length===1?'':'s'} are recorded: ${quotations.slice(0,3).map((q)=>`${q.id} · ${q.status}`).join('; ')}.` : 'No supplier offers have been recorded in this local workspace yet.';
      action = { label: 'Review supplier offers', page: 'supplier-offers' };
    } else if (lower.includes('request') || lower.includes('pr-')) {
      const match = requests.find((r)=>lower.includes(r.id.toLowerCase()));
      reply = match ? `${match.id} — ${match.title}. Status: ${match.status}. Estimated value: ${money(match.cost)}.` : `There are ${requests.length} requests saved locally. ${requests.slice(0,3).map((r)=>`${r.id} · ${r.status}`).join('; ')}`;
      action = { label: 'Open my requests', page: 'my-requests' };
    } else if (lower.includes('create') || lower.includes('new')) {
      reply = 'I can take you to the purchase request form. You can save a draft or submit it for review there.';
      action = { label: 'Create a request', page: 'create-request' };
    }

    setMessages((m) => [...m, { role: 'assistant', text: reply, action }]);
  }

  return (
    <section className="assistant-experience">
      <aside className="assistant-presence"><p className="eyebrow">PROCUREMENT COMPANION · LOCAL DEMO</p><h1>Let’s move<br/><em>work forward.</em></h1><p className="assistant-presence-copy">A calm place to find the next step in your procurement work.</p><Robot className="vx-robot-assistant" /><div className="assistant-status"><i/> WORKSPACE CONTEXT READY</div><p className="assistant-boundary">Replies use request, offer and order records stored in this browser. No live AI connection is configured.</p></aside>
      <div className="assistant-conversation"><header className="assistant-conversation-head"><div><span className="assistant-presence-dot"/><div><strong>Procurement guide</strong><small>Here to help you navigate your work</small></div></div><span className="assistant-local-tag">LOCAL WORKSPACE</span></header><div className="assistant-prompt-label">START WITH A TOPIC</div><div className="assistant-prompts">{[['My approvals','approval'],['Purchase orders','purchase orders'],['Supplier offers','supplier offers'],['My requests','my requests']].map(([label,q])=><button key={label} onClick={()=>send(q)}>{label}<Icon name="arrow" size={13}/></button>)}</div><div className="assistant-messages" aria-live="polite">{messages.map((m,i)=><article key={i} className={`assistant-message ${m.role}`}><span className="message-mark">{m.role==='assistant'?<i/>:'FA'}</span><div className="message-content"><span className="message-speaker">{m.role==='assistant'?'PROCUREMENT GUIDE':'YOU'}</span><p>{m.text}</p>{m.action&&<button className="assistant-action" onClick={()=>go(m.action.page)}>{m.action.label}<Icon name="arrow" size={14}/></button>}</div></article>)}</div><form className="assistant-composer" onSubmit={(e)=>{e.preventDefault();send();}}><span className="composer-mark">↗</span><input value={value} onChange={(e)=>setValue(e.target.value)} placeholder="Ask about requests, approvals, offers or orders…" aria-label="Ask the procurement guide"/><button type="submit" disabled={!value.trim()} aria-label="Send message"><Icon name="arrow" size={17}/></button></form></div>
    </section>
  );
}

function ProfileSettings({ notify }) {
  const [profile, setProfile] = useState(() =>
    readJSON('last-desgin-profile', {
      name: 'Fares Ahmed',
      email: 'fares@elsewedy.com',
      department: 'IT Department',
      role: 'Procurement Officer'
    })
  );

  return (
    <>
      <PageHeading title="Account Settings" subtitle="Manage profile coordinates and preferences." eyebrow="PROFILE" />
      <div className="settings-layout">
        <div className="settings-main">
          <Card className="profile-card">
            <div className="profile-identity">
              <div className="avatar avatar-large">FA</div>
              <div>
                <h2>{profile.name}</h2>
                <span>{profile.email}</span>
              </div>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Full Name</span>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Department</span>
                <select
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="profile-actions" style={{ marginTop: '16px' }}>
              <Button
                onClick={() => {
                  localStorage.setItem('last-desgin-profile', JSON.stringify(profile));
                  notify('Profile saved successfully.');
                }}
              >
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
        <aside className="brand-promo">
          <img src="./assets/profile-brand.png" alt="Elsewedy Electric" />
          <div className="promo-overlay">
            <Brand />
            <strong>Empowering<br />Progress</strong>
          </div>
        </aside>
      </div>
    </>
  );
}

/* =========================================================================
   EMPLOYEE OFFERS & PURCHASE ORDERS REVIEW (SECTION 6 & 7)
   ========================================================================= */
function EmployeeOffers({ quotations, decide }) {
  return (
    <>
      <PageHeading
        title="Supplier Quotations &amp; Offers"
        subtitle="Review commercial proposals submitted by vendors. Accepting an offer issues an official Purchase Order."
        eyebrow="COMMERCIAL EVALUATION"
      />

      {quotations.length ? (
        quotations.map((q) => (
          <Card className="approval-card" key={q.id}>
            <div className="approval-main">
              <strong>
                {q.supplierName} · {q.product}
              </strong>
              <small>
                Quote: {q.id} · Tender: {q.requestId} · Qty: {q.quantity}
              </small>
              <small>
                Delivery: {q.delivery || 'Standard'} | Warranty: {q.warranty || 'Commercial standard'}
              </small>
            </div>
            <strong className="approval-cost">{money(q.total, q.currency)}</strong>
            <StatusPill status={q.status} />

            {['Submitted', 'Revision Requested'].includes(q.status) && (
              <div className="approval-buttons">
                <Button variant="danger-outline" onClick={() => decide(q.id, 'Rejected')}>
                  Reject
                </Button>
                <Button variant="outline" onClick={() => decide(q.id, 'Revision Requested')}>
                  Request Revision
                </Button>
                <Button variant="success" onClick={() => decide(q.id, 'Accepted')}>
                  Accept &amp; Issue PO
                </Button>
              </div>
            )}
          </Card>
        ))
      ) : (
        <EmptyRequests go={() => {}} />
      )}
    </>
  );
}

function EmployeeOrders({ orders, confirmReceipt }) {
  return (
    <>
      <PageHeading
        title="Purchase Orders"
        subtitle="Official orders issued to vendors. Final receipt confirmation is strictly an employee authority."
        eyebrow="PURCHASE ORDERS & RECEIPT"
      />

      <section className="employee-order-board" aria-label="Purchase order fulfillment">
        <div className="employee-order-summary"><span>{orders.length} issued orders</span><span>Receipt confirmation is available when a delivery arrives</span></div>
        <div className="employee-order-list">
          {orders.map((o) => {
            const canConfirm = ['Delivered', 'Delivered — Awaiting Employee Confirmation'].includes(o.status);
            const done = o.status === 'Received / Completed';
            return <article className="employee-order-row" key={o.id}>
              <div className="employee-order-mark"><span>{done ? '✓' : 'PO'}</span></div>
              <div className="employee-order-main"><div className="employee-order-top"><strong>{o.product}</strong><StatusPill status={o.status} /></div>
                <p>{o.id} <i>·</i> Tender {o.requestId} <i>·</i> {o.quantity} units</p>
                <div className="employee-order-meta"><span>Supplier <b>{o.supplierName}</b></span><span>Approved value <b>{money(o.total, o.currency)}</b></span><span>{o.history?.length || 0} logged updates</span></div>
              </div>
              <div className="employee-order-action">{canConfirm ? <Button variant="success" onClick={() => confirmReceipt(o.id)}>Confirm Receipt</Button> : done ? <span className="employee-order-done">✓ Completed &amp; verified</span> : <span className="employee-order-wait">In fulfillment</span>}</div>
            </article>;
          })}
        </div>
        {orders.length === 0 && (
            <div className="empty-state">
              <h2>No purchase orders yet</h2>
              <p>Accept a supplier quotation in Supplier Offers to issue an official Purchase Order.</p>
            </div>
          )}
      </section>
    </>
  );
}

export default App;
