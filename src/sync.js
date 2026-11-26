/*
  Live sync between devices — no database.

  Every change to requests, quotations or purchase orders is published as a
  small message on a public ntfy.sh topic. Every open portal (employee or
  supplier, any device) listens on the same topic and merges what arrives
  into its own browser storage. ntfy keeps messages for about 12 hours, so a
  device that opens later still catches up on the recent changes.

  Demo data only: anyone who knows the topic name can read it.
*/

const TOPIC = 'elsewedy-volt-portal-7f3k9q2m8x';
const BASE = `https://ntfy.sh/${TOPIC}`;
const KEYS = {
  'last-desgin-requests': 'request',
  'commerce-quotations': 'quotation',
  'commerce-orders': 'order',
};
const TS_KEY = 'volt-sync-ts';

const store = window.localStorage;
const isRealStorage = typeof Storage !== 'undefined' && store instanceof Storage;
const origSet = isRealStorage ? Storage.prototype.setItem : store.setItem.bind(store);
const rawSet = (k, v) => (isRealStorage ? origSet.call(store, k, v) : origSet(k, v));
const rawGet = (k) => store.getItem(k);

const clientId = (() => {
  try {
    let id = sessionStorage.getItem('volt-client');
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('volt-client', id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2);
  }
})();

const parse = (text, fallback) => {
  try {
    return text ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
};

// last known JSON of every record, so we only send what actually changed
const known = {};
Object.keys(KEYS).forEach((key) => {
  known[key] = {};
  (parse(rawGet(key), []) || []).forEach((r) => {
    if (r && r.id) known[key][r.id] = JSON.stringify(r);
  });
});
const stamps = parse(rawGet(TS_KEY), {});
const saveStamps = () => rawSet(TS_KEY, JSON.stringify(stamps));

function publish(key, record) {
  const ts = Date.now();
  stamps[`${key}:${record.id}`] = ts;
  saveStamps();
  const body = JSON.stringify({ v: 1, from: clientId, key, ts, record });
  fetch(BASE, { method: 'POST', body, headers: { Title: `${KEYS[key]} ${record.id}` } }).catch(() => {
    /* offline: the change stays local */
  });
}

// Only changes a person makes are published. Writes the app does on its own
// (seeding demo data on a first visit, re-saving after a reload) are not,
// so a new visitor can never roll other devices back to the demo data.
let lastUserAction = 0;
['pointerdown', 'keydown', 'submit', 'change'].forEach((type) =>
  window.addEventListener(type, () => { lastUserAction = Date.now(); }, true)
);

// outgoing: watch writes to the three shared lists
function onWrite(key, value) {
  if (!KEYS[key]) return;
  const byUser = Date.now() - lastUserAction < 6000;
  const list = parse(value, []);
  if (!Array.isArray(list)) return;
  list.forEach((record) => {
    if (!record || !record.id) return;
    const json = JSON.stringify(record);
    if (known[key][record.id] !== json) {
      known[key][record.id] = json;
      if (byUser) publish(key, record);
    }
  });
}
if (isRealStorage) {
  Storage.prototype.setItem = function setItem(key, value) {
    origSet.call(this, key, value);
    if (this === store) onWrite(String(key), String(value));
  };
} else {
  store.setItem = (key, value) => {
    origSet(key, value);
    onWrite(String(key), String(value));
  };
}

function label(key, record, isNew) {
  const kind = KEYS[key];
  if (kind === 'request') return `${isNew ? 'New request' : 'Request updated'} · ${record.id}${record.status ? ` · ${record.status}` : ''}`;
  if (kind === 'quotation') return `${isNew ? 'New quotation' : 'Quotation updated'} · ${record.id}${record.status ? ` · ${record.status}` : ''}`;
  return `${isNew ? 'New purchase order' : 'Order updated'} · ${record.id}${record.status ? ` · ${record.status}` : ''}`;
}

// incoming: merge into local storage and tell the app to re-read it
let quietUntil = Date.now() + 4000; // the catch-up replay on page load stays silent
function receive(envelope) {
  if (!envelope || envelope.from === clientId || !KEYS[envelope.key] || !envelope.record?.id) return;
  const { key, record, ts } = envelope;
  const stampKey = `${key}:${record.id}`;
  if (stamps[stampKey] && stamps[stampKey] >= ts) return;
  stamps[stampKey] = ts;
  saveStamps();
  const list = parse(rawGet(key), []) || [];
  const index = list.findIndex((r) => r && r.id === record.id);
  const isNew = index === -1;
  const json = JSON.stringify(record);
  if (!isNew && JSON.stringify(list[index]) === json) return;
  if (isNew) list.unshift(record);
  else list[index] = record;
  known[key][record.id] = json;
  rawSet(key, JSON.stringify(list));
  window.dispatchEvent(new Event('commerce-update'));
  if (Date.now() > quietUntil) {
    window.dispatchEvent(new CustomEvent('volt-sync', { detail: { text: label(key, record, isNew) } }));
  }
}

async function handle(message) {
  if (message.event !== 'message') return;
  if (message.message && message.message.trim().startsWith('{')) {
    receive(parse(message.message, null));
  } else if (message.attachment?.url) {
    // big records arrive as an attachment
    try {
      const text = await fetch(message.attachment.url).then((r) => r.text());
      receive(parse(text, null));
    } catch {
      /* ignore */
    }
  }
}

function connect() {
  if (typeof EventSource === 'undefined') return;
  let source;
  try {
    source = new EventSource(`${BASE}/sse?since=12h`);
  } catch {
    return;
  }
  source.onopen = () => window.dispatchEvent(new CustomEvent('volt-sync-state', { detail: 'live' }));
  source.onmessage = (e) => handle(parse(e.data, {}));
  source.onerror = () => {
    window.dispatchEvent(new CustomEvent('volt-sync-state', { detail: 'offline' }));
    // EventSource retries on its own; nothing else to do
  };
}

connect();
