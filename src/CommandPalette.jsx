import { useEffect, useMemo, useRef, useState } from 'react';

/*
  Ctrl/⌘ + K command palette.
  items: [{ id, label, group, hint, run }]
*/
export default function CommandPalette({ items }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-command-palette', onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items
      .map((item) => {
        const hay = `${item.label} ${item.group} ${item.hint || ''}`.toLowerCase();
        const pos = hay.indexOf(q);
        return pos === -1 ? null : { item, score: pos + (item.label.toLowerCase().startsWith(q) ? -100 : 0) };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .map((r) => r.item);
  }, [items, query]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  if (!open) return null;

  const run = (item) => {
    setOpen(false);
    item?.run();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(results[index]);
    }
  };

  let lastGroup = '';
  return (
    <div className="cmdk-backdrop" onMouseDown={() => setOpen(false)}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cmdk-input">
          <span className="cmdk-spark" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Where to? Pages, requests, actions…"
            aria-label="Search commands"
          />
          <kbd>esc</kbd>
        </div>
        <div className="cmdk-list" ref={listRef} role="listbox">
          {results.length === 0 && <p className="cmdk-empty">No match for “{query}”.</p>}
          {results.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {header && <p className="cmdk-group">{header}</p>}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === index}
                  data-active={i === index}
                  className="cmdk-item"
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => run(item)}
                >
                  <span>{item.label}</span>
                  {item.hint && <small>{item.hint}</small>}
                  <i aria-hidden="true">↵</i>
                </button>
              </div>
            );
          })}
        </div>
        <div className="cmdk-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>Ctrl</kbd><kbd>K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}
