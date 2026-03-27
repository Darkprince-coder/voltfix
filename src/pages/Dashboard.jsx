import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Wrench, TrendingUp, Package, AlertTriangle,
  CheckCircle2, Clock, ArrowRight, Zap
} from 'lucide-react'
import { isToday, parseISO } from 'date-fns'
import StatCard from '../components/ui/StatCard'
import { PageSpinner } from '../components/ui/index'
import { formatKsh, formatDate, statusBadge, statusLabel } from '../utils/helpers'

export default function Dashboard({ jobs, payments, inventory, loadingJobs, loadingPayments, loadingInventory }) {
  const loading = loadingJobs || loadingPayments || loadingInventory

  // Today's stats
  const todayStats = useMemo(() => {
    const todayJobs = jobs.filter(j => j.created_at && isToday(parseISO(j.created_at)))
    const completedToday = jobs.filter(j => j.completed_at && isToday(parseISO(j.completed_at)))
    const todayRevenue = payments
      .filter(p => p.paid_at && isToday(parseISO(p.paid_at)))
      .reduce((sum, p) => sum + Number(p.amount_paid_ksh), 0)
    const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'in_progress')
    return { todayJobs: todayJobs.length, completedToday: completedToday.length, todayRevenue, pendingJobs: pendingJobs.length }
  }, [jobs, payments])

  const lowStock = inventory.filter(i => i.quantity <= (i.low_stock_threshold ?? 5))
  const recentJobs = jobs.slice(0, 6)

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Low stock alert banner */}
      {lowStock.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.25)', color: 'var(--amber)' }}
        >
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span className="flex-1">
            <strong>{lowStock.length} item{lowStock.length > 1 ? 's' : ''}</strong> running low on stock:{' '}
            {lowStock.slice(0, 3).map(i => i.name).join(', ')}
            {lowStock.length > 3 ? ` +${lowStock.length - 3} more` : ''}
          </span>
          <Link
            to="/inventory"
            className="flex items-center gap-1 text-xs font-medium flex-shrink-0"
            style={{ color: 'var(--amber)' }}
          >
            View <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Today's Revenue"
          value={formatKsh(todayStats.todayRevenue)}
          sub="Payments received today"
          icon={TrendingUp}
          accent="green"
        />
        <StatCard
          label="Jobs Today"
          value={todayStats.todayJobs}
          sub="New jobs created"
          icon={Wrench}
          accent="blue"
        />
        <StatCard
          label="Completed Today"
          value={todayStats.completedToday}
          sub="Jobs finished"
          icon={CheckCircle2}
          accent="teal"
        />
        <StatCard
          label="Pending Jobs"
          value={todayStats.pendingJobs}
          sub="Awaiting completion"
          icon={Clock}
          accent={todayStats.pendingJobs > 5 ? 'amber' : 'purple'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Recent Jobs */}
        <div className="lg:col-span-2 card rounded-xl overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Recent Jobs</h2>
            <Link
              to="/jobs"
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: 'var(--accent)' }}
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <Wrench size={28} style={{ color: 'var(--text-muted)' }} className="mb-2" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No jobs yet. Create your first repair job.</p>
              <Link to="/jobs" className="btn btn-primary mt-3 text-xs">+ New Job</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Device</th>
                    <th>Status</th>
                    <th>Cost</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map(job => (
                    <tr key={job.id}>
                      <td>
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{job.customer_name}</p>
                        {job.phone && <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{job.phone}</p>}
                      </td>
                      <td>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{job.device_type}</span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadge(job.status)}`}>
                          {statusLabel(job.status)}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-sm" style={{ color: 'var(--green)' }}>
                          {formatKsh(job.service_cost_ksh)}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(job.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock & Quick Links */}
        <div className="space-y-4">

          {/* Low stock */}
          <div className="card rounded-xl overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Low Stock</h2>
              <span className="badge badge-amber">{lowStock.length}</span>
            </div>
            {lowStock.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Package size={22} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-2" />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>All stock levels are good</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {lowStock.slice(0, 6).map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{
                      background: 'var(--bg-muted)',
                      borderLeft: `3px solid ${item.quantity === 0 ? 'var(--red)' : 'var(--amber)'}`,
                    }}
                  >
                    <span className="text-sm truncate mr-2" style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                    <span
                      className="text-xs font-mono font-medium flex-shrink-0"
                      style={{ color: item.quantity === 0 ? 'var(--red)' : 'var(--amber)' }}
                    >
                      {item.quantity} left
                    </span>
                  </div>
                ))}
                {lowStock.length > 6 && (
                  <Link to="/inventory" className="block text-center text-xs pt-1" style={{ color: 'var(--accent)' }}>
                    +{lowStock.length - 6} more →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card rounded-xl p-4 space-y-2">
            <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
            {[
              { to: '/jobs',      icon: Wrench,   label: 'New Repair Job',   accent: 'var(--accent)' },
              { to: '/inventory', icon: Package,  label: 'Add Spare Part',   accent: 'var(--teal)'   },
              { to: '/payments',  icon: TrendingUp, label: 'Record Payment', accent: 'var(--green)'  },
            ].map(({ to, icon: Icon, label, accent }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-all"
                style={{
                  background: 'var(--bg-muted)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                <Icon size={16} />
                {label}
                <ArrowRight size={13} className="ml-auto opacity-50" />
              </Link>
            ))}
          </div>

        </div>
      </div>

      {/* Totals strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total All-Time Revenue', value: formatKsh(payments.reduce((s, p) => s + Number(p.amount_paid_ksh), 0)), colour: 'var(--green)' },
          { label: 'Total Jobs All-Time',    value: jobs.length,           colour: 'var(--accent)' },
          { label: 'Inventory Items',        value: inventory.length,      colour: 'var(--teal)' },
        ].map(({ label, value, colour }) => (
          <div key={label} className="card rounded-xl px-5 py-4 flex items-center gap-4">
            <Zap size={20} style={{ color: colour, flexShrink: 0 }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="font-semibold font-mono mt-0.5" style={{ color:colour }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
