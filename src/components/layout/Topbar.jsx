import { Menu, Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/':          'Dashboard',
  '/inventory': 'Inventory',
  '/jobs':      'Repair Jobs',
  '/payments':  'Payments',
  '/reports':   'Reports',
}

export default function Topbar({ onMenuOpen, lowStockCount = 0 }) {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'VoltFix'

  const today = new Date().toLocaleDateString('en-KE', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-14"
      style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden btn-icon p-2"
          onClick={onMenuOpen}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="font-semibold text-sm sm:text-base leading-none" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h1>
          <p className="text-xs mt-0.5 hidden sm:block font-mono" style={{ color: 'var(--text-muted)' }}>
            {today}
          </p>
        </div>
      </div>

      {/* Right: alerts */}
      <div className="flex items-center gap-2">
        {lowStockCount > 0 && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <Bell size={12} />
            {lowStockCount} low stock
          </div>
        )}
      </div>
    </header>
  )
}
