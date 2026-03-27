import { AlertTriangle } from 'lucide-react'

/** Badge pill */
export function Badge({ children, variant = 'blue' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}

/** Spinner */
export function Spinner({ size = 20 }) {
  return (
    <div
      style={{
        width: size, height: size,
        border: `2px solid var(--border-lg)`,
        borderTop: `2px solid var(--accent)`,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  )
}

/* inject spin keyframe once */
if (!document.getElementById('__voltfix_spin')) {
  const s = document.createElement('style')
  s.id = '__voltfix_spin'
  s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}'
  document.head.appendChild(s)
}

/** Full-area spinner */
export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size={32} />
    </div>
  )
}

/** Empty state placeholder */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-muted)' }}>
          <Icon size={28} style={{ color: 'var(--text-muted)' }} />
        </div>
      )}
      <p className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{title}</p>
      {description && <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      {action}
    </div>
  )
}

/** Inline confirm dialog (replaces window.confirm) */
export function ConfirmDialog({ open, onConfirm, onCancel, title, message, danger = true }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
    >
      <div className="card-elevated rounded-2xl p-6 w-full max-w-sm animate-slide-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-xl p-2" style={{ background: 'var(--red-dim)' }}>
            <AlertTriangle size={18} style={{ color: 'var(--red)' }} />
          </div>
          <h3 className="font-semibold">{title}</h3>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button className="btn-ghost btn text-sm" onClick={onCancel}>Cancel</button>
          <button
            className={`btn text-sm ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

/** Section heading */
export function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{children}</h2>
      {action}
    </div>
  )
}

/** Search input */
export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <input
      className="input text-sm"
      style={{ maxWidth: 240 }}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}
