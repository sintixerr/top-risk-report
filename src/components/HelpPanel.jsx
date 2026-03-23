import { useState } from 'react';

/**
 * Collapsible help/explanation panel for each screen.
 * Shows a "How to read this" section that first-time visitors can expand.
 * Remembers open/closed state per session via component state.
 */
export default function HelpPanel({ text, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  if (!text) return null;

  return (
    <div style={{
      marginBottom: 14,
      fontFamily: 'var(--mono)',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 0', fontSize: 10, color: 'var(--text-muted)',
          fontFamily: 'var(--mono)', fontWeight: 600, letterSpacing: '0.5px',
          transition: 'color 0.12s',
        }}
        onMouseOver={e => { e.currentTarget.style.color = 'var(--navy)'; }}
        onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <span style={{
          display: 'inline-block', transition: 'transform 0.15s',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          fontSize: 8,
        }}>▶</span>
        {open ? 'Hide guide' : 'How to read this view'}
      </button>
      {open && (
        <div style={{
          padding: '10px 14px', marginTop: 4,
          background: 'var(--bg-card)', border: '1px solid var(--border-light)',
          borderRadius: 3, fontSize: 11, lineHeight: 1.7,
          color: 'var(--text)', maxWidth: 720,
        }}>
          {text}
        </div>
      )}
    </div>
  );
}

/**
 * Inline tooltip wrapper. Adds a dotted underline and shows tip on hover.
 * Usage: <Tip text="explanation">visible term</Tip>
 */
export function Tip({ text, children }) {
  return (
    <span
      title={text}
      style={{
        borderBottom: '1px dotted var(--text-dim)',
        cursor: 'help',
      }}
    >
      {children}
    </span>
  );
}

/**
 * Screen header with title, subtitle, and optional help panel.
 * Standardizes the top of every view.
 */
export function ScreenHeader({ title, subtitle, help, right }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700,
            color: 'var(--navy)', letterSpacing: '-0.2px', margin: 0,
          }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{
              fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)',
              lineHeight: 1.5, margin: '4px 0 0', maxWidth: 640,
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {right && <div>{right}</div>}
      </div>
      {help && <HelpPanel text={help} />}
    </div>
  );
}

/**
 * Color-coded key/legend strip.
 * items: [{ color, label }]
 */
export function Legend({ items }) {
  return (
    <div style={{
      display: 'flex', gap: 16, flexWrap: 'wrap',
      fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)',
      marginTop: 12,
    }}>
      {items.map(item => (
        <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            display: 'inline-block', width: 10, height: 10,
            borderRadius: item.shape === 'circle' ? '50%' : 1,
            background: item.color, opacity: item.opacity || 0.7,
          }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
