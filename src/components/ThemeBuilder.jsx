import { useState, useMemo, useCallback } from 'react';
import { DATA, extractVocabulary, buildUserThemeFilter } from '../data.js';
import { ScreenHeader } from './HelpPanel.jsx';
import { SCREENS, CONCEPTS, fmt } from '../terminology.js';

const VOCAB = extractVocabulary();

const DIMENSION_CONFIG = [
  { key: 'ttps', label: 'Attack methods', description: 'What techniques are employed in the attack' },
  { key: 'weaknesses', label: 'Vulnerabilities exploited', description: 'What environmental conditions enable the attack' },
  { key: 'objectives', label: 'Defensive positions', description: 'What security positions are traversed by the attack' },
  { key: 'assets', label: 'Systems targeted', description: 'What infrastructure, data, or applications are affected' },
  { key: 'motiveObj', label: 'Attacker motivation', description: 'Why the attacker acts and what they\'re trying to accomplish' },
];

const EMPTY_CRITERIA = { ttps: [], weaknesses: [], objectives: [], assets: [], motiveObj: [] };

function DimensionSelector({ dim, label, description, values, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const count = selected.length;

  const toggle = (val) => {
    onChange(dim, selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div onClick={() => setOpen(!open)} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px', background: count > 0 ? 'var(--navy)' : 'var(--bg-card)',
        color: count > 0 ? '#e8e4d9' : 'var(--text)', border: '1px solid var(--border)',
        borderRadius: 3, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11,
        transition: 'all 0.15s',
      }}>
        <div>
          <div style={{ fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 9, opacity: 0.6, marginTop: 1 }}>{description}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {count > 0 ? (
            <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 2 }}>{count} selected</span>
          ) : (
            <span style={{ fontSize: 10, opacity: 0.5 }}>Any (no filter)</span>
          )}
          <span style={{ fontSize: 10 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div style={{
          border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 3px 3px',
          background: 'var(--bg-card)', maxHeight: 240, overflowY: 'auto', padding: '4px 0',
        }}>
          <div style={{ padding: '4px 12px 8px', display: 'flex', gap: 6 }}>
            <button className="btn" style={{ fontSize: 9, padding: '2px 8px' }}
              onClick={() => onChange(dim, [...values])}>Select all</button>
            <button className="btn" style={{ fontSize: 9, padding: '2px 8px' }}
              onClick={() => onChange(dim, [])}>Clear</button>
          </div>
          {values.map(val => (
            <label key={val} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 12px',
              fontSize: 11, cursor: 'pointer', fontFamily: 'var(--mono)',
              color: selected.includes(val) ? 'var(--navy)' : 'var(--text-muted)',
              fontWeight: selected.includes(val) ? 600 : 400, transition: 'color 0.1s',
            }}>
              <input type="checkbox" checked={selected.includes(val)}
                onChange={() => toggle(val)}
                style={{ accentColor: 'var(--navy)', marginTop: 2, flexShrink: 0 }} />
              <span style={{ lineHeight: 1.4 }}>{val}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function SavedThemeCard({ theme, onEdit, onRemove, onApply }) {
  const [confirming, setConfirming] = useState(false);
  const matched = DATA.filter(buildUserThemeFilter(theme.criteria));
  const activeDims = Object.entries(theme.criteria).filter(([, v]) => v.length > 0);

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
      padding: '12px 14px', fontFamily: 'var(--mono)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{theme.name}</div>
          {theme.description && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{theme.description}</div>
          )}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--coral)', whiteSpace: 'nowrap', marginLeft: 12 }}>
          {matched.length} scenarios
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {activeDims.map(([dim, vals]) => (
          <span key={dim} style={{
            fontSize: 9, background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 2, color: 'var(--text-muted)',
          }}>
            {DIMENSION_CONFIG.find(d => d.key === dim)?.label}: {vals.length} selected
          </span>
        ))}
        {activeDims.length === 0 && (
          <span style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic' }}>No filters — matches all scenarios</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn" style={{ fontSize: 9, padding: '4px 10px' }} onClick={() => onApply(theme)}>View in reports</button>
        <button className="btn" style={{ fontSize: 9, padding: '4px 10px' }} onClick={() => onEdit(theme)}>Edit</button>
        {!confirming ? (
          <button className="btn" style={{ fontSize: 9, padding: '4px 10px', color: 'var(--coral)' }}
            onClick={() => setConfirming(true)}>Remove</button>
        ) : (
          <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: 'var(--coral)' }}>Sure?</span>
            <button className="btn" style={{ fontSize: 9, padding: '4px 8px', color: 'var(--coral)', borderColor: 'var(--coral)' }}
              onClick={() => { onRemove(theme.id); setConfirming(false); }}>Yes</button>
            <button className="btn" style={{ fontSize: 9, padding: '4px 8px' }}
              onClick={() => setConfirming(false)}>No</button>
          </span>
        )}
      </div>
    </div>
  );
}

export default function ThemeBuilder({ userThemes, onSave, onRemove, onNavigate }) {
  const [criteria, setCriteria] = useState({ ...EMPTY_CRITERIA });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);

  const matchedScenarios = useMemo(() => DATA.filter(buildUserThemeFilter(criteria)), [criteria]);
  const hasAnyFilter = Object.values(criteria).some(v => v.length > 0);

  const handleDimChange = useCallback((dim, selected) => {
    setCriteria(prev => ({ ...prev, [dim]: selected }));
  }, []);

  const handleSave = () => {
    if (!name.trim()) return;
    const theme = {
      id: editingId || `user-${Date.now()}`, name: name.trim(),
      description: description.trim(), criteria: { ...criteria },
      createdAt: editingId ? userThemes.find(t => t.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(theme);
    resetForm();
  };

  const handleEdit = (theme) => {
    setEditingId(theme.id); setName(theme.name);
    setDescription(theme.description || '');
    setCriteria({ ...EMPTY_CRITERIA, ...theme.criteria });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApply = (theme) => { onNavigate(theme.name, 'detail'); };

  const resetForm = () => {
    setCriteria({ ...EMPTY_CRITERIA }); setName(''); setDescription(''); setEditingId(null);
  };

  return (
    <div>
      <ScreenHeader
        title={SCREENS.builder.title}
        subtitle={SCREENS.builder.subtitle}
        help={SCREENS.builder.help}
      />

      {/* Saved themes */}
      {userThemes.length > 0 && (
        <div style={{
          background: 'var(--teal-bg)', border: '1px solid #9FE1CB', borderRadius: 3,
          padding: '12px 16px', marginBottom: 16,
        }}>
          <div style={{
            fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase',
            color: 'var(--teal-dark)', fontWeight: 700, marginBottom: 10, fontFamily: 'var(--mono)',
          }}>
            Your saved themes ({userThemes.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 8 }}>
            {userThemes.map(t => (
              <SavedThemeCard key={t.id} theme={t} onEdit={handleEdit} onRemove={onRemove} onApply={handleApply} />
            ))}
          </div>
        </div>
      )}

      {/* Builder form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 24 }}>
        {/* Left: dimension selectors */}
        <div style={{ paddingRight: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            {editingId ? 'Editing theme' : 'Build a custom risk theme'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: 12, lineHeight: 1.6 }}>
            A risk theme is a structural query across the baseline scenarios.
            Select values in one or more dimensions below. Within a dimension, scenarios matching <strong>any</strong> selected value qualify.
            Across dimensions, scenarios must match <strong>all</strong> dimensions that have selections.
          </div>

          <div style={{ marginBottom: 14 }}>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Theme name (required)"
              style={{
                width: '100%', padding: '8px 10px', border: '1px solid var(--border)',
                borderRadius: 3, fontFamily: 'var(--mono)', fontSize: 12,
                background: 'var(--bg-card)', color: 'var(--text)', marginBottom: 6,
              }} />
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Description / notes (optional)" rows={2}
              style={{
                width: '100%', padding: '8px 10px', border: '1px solid var(--border)',
                borderRadius: 3, fontFamily: 'var(--mono)', fontSize: 11,
                background: 'var(--bg-card)', color: 'var(--text)', resize: 'vertical',
              }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className={`btn ${name.trim() ? 'btn-active' : ''}`}
                style={{ opacity: name.trim() ? 1 : 0.4 }}
                onClick={handleSave} disabled={!name.trim()}>
                {editingId ? '✓ Update theme' : '✓ Save theme'}
              </button>
              {(hasAnyFilter || name || description || editingId) && (
                <button className="btn" onClick={resetForm}>{editingId ? 'Cancel edit' : 'Clear'}</button>
              )}
            </div>
          </div>

          {DIMENSION_CONFIG.map(dim => (
            <DimensionSelector key={dim.key} dim={dim.key} label={dim.label}
              description={dim.description} values={VOCAB[dim.key]}
              selected={criteria[dim.key]} onChange={handleDimChange} />
          ))}
        </div>

        {/* Right: preview */}
        <div style={{ paddingLeft: 16, borderLeft: '1px solid var(--border)' }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            Live preview — {matchedScenarios.length} of {DATA.length} scenarios match
          </div>

          {hasAnyFilter && (
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
              borderRadius: 3, padding: '8px 12px', marginBottom: 12,
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase' }}>Active filters</div>
              {Object.entries(criteria).filter(([, v]) => v.length > 0).map(([dim, vals]) => (
                <div key={dim}>
                  <strong>{DIMENSION_CONFIG.find(d => d.key === dim)?.label}:</strong> {vals.join(', ')}
                </div>
              ))}
            </div>
          )}

          <div style={{
            border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden', maxHeight: 480, overflowY: 'auto',
          }}>
            {matchedScenarios.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>No scenarios match these criteria</div>
            ) : (
              matchedScenarios.map((s, i) => (
                <div key={s.id} style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr auto',
                  padding: '8px 12px', fontFamily: 'var(--mono)',
                  borderTop: i > 0 ? '1px solid var(--border-light)' : 'none',
                  background: 'var(--bg-card)', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)' }}>{s.id}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
                      {s.ttps.length} methods · {s.weaknesses.length} vulnerabilities · {(s.assets || []).length} targets
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--coral)' }}>
                    {fmt.dollars(s.rALE)}
                  </div>
                </div>
              ))
            )}
          </div>

          {matchedScenarios.length > 0 && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
              Total net annual exposure: {fmt.dollars(matchedScenarios.reduce((a, s) => a + s.rALE, 0))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
