// If the browser blocks localStorage/sessionStorage (private mode, sandboxed
// frames), fall back to in-memory storage so the portal still runs.
function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(String(k)) ? map.get(String(k)) : null),
    setItem: (k, v) => map.set(String(k), String(v)),
    removeItem: (k) => map.delete(String(k)),
    clear: () => map.clear(),
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() { return map.size; },
  };
}
['localStorage', 'sessionStorage'].forEach((name) => {
  try {
    const s = window[name];
    const probe = '__volt_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
  } catch {
    try {
      Object.defineProperty(window, name, { value: memoryStorage(), configurable: true });
    } catch {
      /* nothing else we can do */
    }
  }
});
