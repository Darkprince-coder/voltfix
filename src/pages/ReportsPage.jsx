import { useMemo } from 'react'
import { format, subDays, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp, Wrench, Package, CheckCircle2 } from 'lucide-react'
import { PageSpinner } from '../components/ui/index'
import { formatKsh } from '../utils/helpers'

const COLOURS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#14b8a6', '#ef4444']

// Custom tooltip shared across charts
function ChartTooltip({ active, payload, label, prefix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: '#111d32', border: '1px solid #1e2f4a',
        borderRadius: 10, padding: '8px 12px', fontSize: 12,
        fontFamily: 'Sora, sans-serif', color: '#e2e8f4',
      }}
    >
      <p style={{ color: '#7f92b0', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{prefix}{typeof p.value === 'number' ? p.value.toLocaleString('en-KE') : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

export default function ReportsPage({ jobs, payments, inventory, loading }) {
  if (loading) return <PageSpinner />

  // Last 7 days daily revenue + job count
  const last7 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day   = subDays(new Date(), 6 - i)
      const start = startOfDay(day)
      const end   = endOfDay(day)

      const dayPayments = payments.filter(p => {
        try { return isWithinInterval(parseISO(p.paid_at), { start, end }) } catch { return false }
      })
      const dayJobs = jobs.filter(j => {
        try { return isWithinInterval(parseISO(j.created_at), { start, end }) } catch { return false }
      })
      const dayCompleted = jobs.filter(j => {
        try { return j.completed_at && isWithinInterval(parseISO(j.completed_at), { start, end }) } catch { return false }
      })

      return {
        date:      format(day, 'EEE dd'),
        revenue:   dayPayments.reduce((s, p) => s + Number(p.amount_paid_ksh), 0),
        jobs:      dayJobs.length,
        completed: dayCompleted.length,
      }
    })
  }, [payments, jobs])

  // Device type distribution
  const deviceDist = useMemo(() => {
    const counts = {}
    jobs.forEach(j => { counts[j.device_type] = (counts[j.device_type] || 0) + 1 })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [jobs])

  // Payment method split
  const methodSplit = useMemo(() => {
    const cash  = payments.filter(p => p.payment_method === 'cash').reduce((s, p)  => s + Number(p.amount_paid_ksh), 0)
    const mpesa = payments.filter(p => p.payment_method === 'mpesa').reduce((s, p) => s + Number(p.amount_paid_ksh), 0)
    return [
      { name: 'Cash',   value: cash  },
      { name: 'M-Pesa', value: mpesa },
    ].filter(m => m.value > 0)
  }, [payments])

  // All-time KPIs
  const kpis = useMemo(() => {
    const totalRevenue   = payments.reduce((s, p) => s + Number(p.amount_paid_ksh), 0)
    const completedJobs  = jobs.filter(j => j.status === 'completed').length
    const avgJobValue    = completedJobs > 0
      ? jobs.filter(j => j.status === 'completed').reduce((s, j) => s + Number(j.service_cost_ksh), 0) / completedJobs
      : 0
    const lowStockCount  = inventory.filter(i => i.quantity <= (i.low_stock_threshold ?? 5)).length
    return { totalRevenue, completedJobs, avgJobValue, lowStockCount }
  }, [jobs, payments, inventory])

  const axisStyle = { fill: '#4a5e7a', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }

  return (
    <div className="space-y-6 animate-fade-in">

      <div>
        <h1 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Reports</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>All-time business overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue',     value: formatKsh(kpis.totalRevenue),              icon: TrendingUp,  colour: 'var(--green)'  },
          { label: 'Completed Jobs',    value: kpis.completedJobs,                        icon: CheckCircle2,colour: 'var(--accent)' },
          { label: 'Avg Job Value',     value: formatKsh(kpis.avgJobValue),               icon: Wrench,      colour: 'var(--teal)'   },
          { label: 'Low Stock Items',   value: kpis.lowStockCount,                        icon: Package,     colour: kpis.lowStockCount > 0 ? 'var(--amber)' : 'var(--green)' },
        ].map(({ label, value, icon: Icon, colour }) => (
          <div key={label} className="card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-2" style={{ background: `${colour}1a` }}>
                <Icon size={18} style={{ color: colour }} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="font-mono font-semibold mt-0.5" style={{ color: colour }}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Daily Revenue Chart */}
        <div className="card rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Revenue — Last 7 Days
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last7} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2f4a" />
              <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip prefix="KSh " />} />
              <Bar dataKey="revenue" name="Revenue (KSh)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Jobs Chart */}
        <div className="card rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Jobs — Last 7 Days
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={last7} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2f4a" />
              <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="jobs"      name="Created"   stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6'  }} />
              <Line type="monotone" dataKey="completed" name="Completed" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e'  }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Sora, sans-serif', color: '#7f92b0' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Device type pie */}
        {deviceDist.length > 0 && (
          <div className="card rounded-xl p-5">
            <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
              Jobs by Device Type
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={deviceDist}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {deviceDist.map((_, i) => (
                    <Cell key={i} fill={COLOURS[i % COLOURS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Payment method split */}
        {methodSplit.length > 0 && (
          <div className="card rounded-xl p-5">
            <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
              Revenue by Payment Method
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={methodSplit}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#22c55e" />
                </Pie>
                <Tooltip content={<ChartTooltip prefix="KSh " />} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Sora, sans-serif', color: '#7f92b0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>

      {/* Top inventory items by usage */}
      <div className="card rounded-xl overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Current Inventory Status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Current Stock</th>
                <th>Unit Price</th>
                <th>Stock Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.slice(0, 10).map(item => {
                const threshold  = item.low_stock_threshold ?? 5
                const stockValue = (item.quantity || 0) * (item.price_ksh || 0)
                const isOut = item.quantity === 0
                const isLow = item.quantity > 0 && item.quantity <= threshold
                return (
                  <tr key={item.id}>
                    <td className="font-medium text-sm">{item.name}</td>
                    <td className="font-mono text-sm"
                      style={{ color: isOut ? 'var(--red)' : isLow ? 'var(--amber)' : 'var(--green)' }}>
                      {item.quantity}
                    </td>
                    <td className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {item.price_ksh ? formatKsh(item.price_ksh) : '—'}
                    </td>
                    <td className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {stockValue > 0 ? formatKsh(stockValue) : '—'}
                    </td>
                    <td>
                      {isOut ? <span className="badge badge-red">Out of Stock</span>
                        : isLow ? <span className="badge badge-amber">Low Stock</span>
                        : <span className="badge badge-green">OK</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
