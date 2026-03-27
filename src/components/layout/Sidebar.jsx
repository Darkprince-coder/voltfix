import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, Wrench, CreditCard,
  BarChart3, LogOut, Zap, X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/inventory', icon: Package,         label: 'Inventory'  },
  { to: '/jobs',      icon: Wrench,          label: 'Repair Jobs' },
  { to: '/payments',  icon: CreditCard,      label: 'Payments'   },
  { to: '/reports',   icon: BarChart3,       label: 'Reports'    },
]

export default function Sidebar({ open, onClose }) {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'VF'

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50 flex flex-col
          w-60 transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent)' }}
            >
              <Zap size={16} color="#fff" fill="#fff" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none" style={{ color: 'var(--text-primary)' }}>VoltFix</p>
              <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>Repair Manager</p>
            </div>
          </div>
          <button className="lg:hidden btn-icon p-1.5" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to)

            return (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 no-underline"
                style={{
                  color:      isActive ? 'var(--accent)'        : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-dim)'    : 'transparent',
                  border:     isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                }}
              >
                <Icon size={17} />
                {label}
              </NavLink>
            )
          })}
        </nav>

        {/* User card */}
        <div className="px-2 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ background: 'var(--bg-muted)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.email || 'owner@voltfix.ke'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Shop Owner</p>
            </div>
            <button
              onClick={handleSignOut}
              className="btn-icon p-1.5 flex-shrink-0"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
