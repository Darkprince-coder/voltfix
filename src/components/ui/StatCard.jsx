/**
 * StatCard — dashboard metric tile
 * Props: label, value, sub, icon (Lucide), accent ('blue'|'green'|'amber'|'red'|'purple'|'teal')
 */
export default function StatCard({ label, value, sub, icon: Icon, accent = 'blue' }) {
  const colours = {
    blue:   { glow: 'rgba(59,130,246,0.18)',  text: 'var(--accent)',  bg: 'var(--accent-dim)' },
    green:  { glow: 'rgba(34,197,94,0.18)',   text: 'var(--green)',   bg: 'var(--green-dim)' },
    amber:  { glow: 'rgba(245,158,11,0.18)',  text: 'var(--amber)',   bg: 'var(--amber-dim)' },
    red:    { glow: 'rgba(239,68,68,0.18)',   text: 'var(--red)',     bg: 'var(--red-dim)' },
    purple: { glow: 'rgba(168,85,247,0.18)',  text: 'var(--purple)',  bg: 'var(--purple-dim)' },
    teal:   { glow: 'rgba(20,184,166,0.18)',  text: 'var(--teal)',    bg: 'var(--teal-dim)' },
  }
  const c = colours[accent] || colours.blue

  return (
    <div
      className="card rounded-xl p-5 relative overflow-hidden animate-slide-up"
      style={{ '--glow': c.glow }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute', top: -20, right: -20,
          width: 80, height: 80, borderRadius: '50%',
          background: c.glow, filter: 'blur(24px)', pointerEvents: 'none',
        }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            {label}
          </p>
          <p className="text-2xl font-semibold font-mono" style={{ color: c.text }}>
            {value}
          </p>
          {sub && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
          )}
        </div>

        {Icon && (
          <div className="rounded-xl p-2.5 flex-shrink-0" style={{ background: c.bg }}>
            <Icon size={20} style={{ color: c.text }} />
          </div>
        )}
      </div>
    </div>
  )
}
