import { useState, useMemo } from 'react'
import {
  CreditCard, Plus, Trash2, Search, Banknote, Smartphone,
  CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp
} from 'lucide-react'
import Modal from '../components/ui/Modal'
import { PageSpinner, EmptyState, ConfirmDialog } from '../components/ui/index'
import { formatKsh, formatDate } from '../utils/helpers'

const PAYMENT_METHODS = [
  { value: 'cash',  label: 'Cash',   icon: Banknote   },
  { value: 'mpesa', label: 'M-Pesa', icon: Smartphone },
]

/** Compute payment status for a single job */
function getPaymentStatus(job) {
  const cost    = Number(job.service_cost_ksh) || 0
  const paid    = (job.payments || []).reduce((s, p) => s + Number(p.amount_paid_ksh), 0)
  const balance = cost - paid
  if (cost === 0 || paid >= cost)  return { label: 'Fully Paid', variant: 'green',  balance: 0,     paid }
  if (paid > 0 && paid < cost)     return { label: 'Partial',    variant: 'amber',  balance,        paid }
  return                                  { label: 'Unpaid',     variant: 'red',    balance: cost,  paid: 0 }
}

export default function PaymentsPage({ payments, jobs, loading, recordPayment, deletePayment }) {
  const [tab,          setTab]          = useState('jobs')
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal,        setModal]        = useState(false)
  const [expandedJob,  setExpandedJob]  = useState(null)
  const [form,         setForm]         = useState({ job_id: '', amount_paid_ksh: '', payment_method: 'cash' })
  const [saving,       setSaving]       = useState(false)
  const [confirmDel,   setConfirmDel]   = useState(null)

  // Enrich every job with its payment status
  const enrichedJobs = useMemo(() =>
    jobs.map(j => ({ ...j, payStatus: getPaymentStatus(j) })), [jobs])

  // Jobs tab: filter by search + payment status
  const filteredJobs = useMemo(() => {
    let list = enrichedJobs
    if (statusFilter === 'paid')    list = list.filter(j => j.payStatus.label === 'Fully Paid')
    if (statusFilter === 'partial') list = list.filter(j => j.payStatus.label === 'Partial')
    if (statusFilter === 'unpaid')  list = list.filter(j => j.payStatus.label === 'Unpaid')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(j =>
        j.customer_name.toLowerCase().includes(q) ||
        j.device_type.toLowerCase().includes(q) ||
        (j.phone && j.phone.includes(q))
      )
    }
    return list
  }, [enrichedJobs, statusFilter, search])

  // Records tab: filter by search
  const filteredRecords = useMemo(() => {
    if (!search) return payments
    const q = search.toLowerCase()
    return payments.filter(p =>
      p.repair_jobs?.customer_name?.toLowerCase().includes(q) ||
      p.repair_jobs?.device_type?.toLowerCase().includes(q) ||
      p.payment_method?.toLowerCase().includes(q)
    )
  }, [payments, search])

  // Summary totals
  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount_paid_ksh), 0)
  const cashTotal    = payments.filter(p => p.payment_method === 'cash').reduce((s, p)  => s + Number(p.amount_paid_ksh), 0)
  const mpesaTotal   = payments.filter(p => p.payment_method === 'mpesa').reduce((s, p) => s + Number(p.amount_paid_ksh), 0)
  const totalBalance = enrichedJobs.reduce((s, j) => s + j.payStatus.balance, 0)

  // Jobs still needing payment (for modal dropdown)
  const jobsNeedingPayment = useMemo(() =>
    enrichedJobs.filter(j => j.payStatus.balance > 0), [enrichedJobs])

  const openModal = (preselectedJob = null) => {
    if (preselectedJob) {
      setForm({
        job_id:          preselectedJob.id,
        amount_paid_ksh: String(preselectedJob.payStatus.balance),
        payment_method:  'cash',
      })
    } else {
      setForm({ job_id: '', amount_paid_ksh: '', payment_method: 'cash' })
    }
    setModal(true)
  }

  const handleJobSelect = (jobId) => {
  setForm(f => ({
    ...f,
    job_id: jobId,
    amount_paid_ksh: f.amount_paid_ksh || ''
  }))
}
 const handleSave = async () => {
  const amount = Number(form.amount_paid_ksh)

  if (!form.job_id || !amount || amount <= 0) return

  setSaving(true)

  await recordPayment({
    job_id: form.job_id,
    amount_paid_ksh: amount,
    payment_method: form.payment_method,
  })

  // 🔥 FORCE UI UPDATE (without changing structure)
  const jobIndex = jobs.findIndex(j => j.id === form.job_id)

  if (jobIndex !== -1) {
    const updatedJob = {
      ...jobs[jobIndex],
      payments: [
        ...(jobs[jobIndex].payments || []),
        {
          id: Date.now(),
          amount_paid_ksh: amount,
          payment_method: form.payment_method,
          paid_at: new Date().toISOString(),
        }
      ]
    }

    jobs[jobIndex] = updatedJob
  }

  setSaving(false)
  setModal(false)
}

  const badgeClass  = { green: 'badge-green', amber: 'badge-amber', red: 'badge-red' }
  const statusIcon  = { green: CheckCircle2,  amber: AlertCircle,   red: Clock }

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Payments</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {payments.length} records · {jobsNeedingPayment.length} jobs have outstanding balances
          </p>
        </div>
        <button className="btn btn-primary text-sm self-start sm:self-auto" onClick={() => openModal()}>
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Collected',     value: formatKsh(totalRevenue), colour: 'var(--green)',  bg: 'var(--green-dim)'  },
          { label: 'Cash',                value: formatKsh(cashTotal),    colour: 'var(--accent)', bg: 'var(--accent-dim)' },
          { label: 'M-Pesa',              value: formatKsh(mpesaTotal),   colour: 'var(--teal)',   bg: 'var(--teal-dim)'   },
          {
            label:  'Outstanding Balance',
            value:  formatKsh(totalBalance),
            colour: totalBalance > 0 ? 'var(--amber)' : 'var(--green)',
            bg:     totalBalance > 0 ? 'var(--amber-dim)' : 'var(--green-dim)',
          },
        ].map(({ label, value, colour }) => (
          <div key={label} className="card rounded-xl px-4 py-3">
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="font-mono font-semibold text-lg mt-0.5" style={{ color: colour }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div
        className="flex gap-1 p-1 rounded-lg w-fit"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        {[
          { key: 'jobs',    label: 'Jobs Overview'    },
          { key: 'records', label: 'Payment Records'  },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? 'var(--bg-surface)' : 'transparent',
              color:      tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              border:     tab === t.key ? '1px solid var(--border-lg)' : '1px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Search + status filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input pl-9 text-sm"
            placeholder={tab === 'jobs' ? 'Search customer, device…' : 'Search payments…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {tab === 'jobs' && (
          <div className="flex gap-1.5 flex-wrap">
            {[
              { key: 'all',     label: 'All'        },
              { key: 'unpaid',  label: 'Unpaid'     },
              { key: 'partial', label: 'Partial'    },
              { key: 'paid',    label: 'Fully Paid' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                style={{
                  background: statusFilter === f.key ? 'var(--accent-dim)' : 'var(--bg-muted)',
                  color:      statusFilter === f.key ? 'var(--accent)'     : 'var(--text-muted)',
                  border:     `1px solid ${statusFilter === f.key ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── JOBS OVERVIEW TAB ── */}
      {tab === 'jobs' && (
        filteredJobs.length === 0 ? (
          <EmptyState icon={CreditCard} title="No jobs match" description="Try adjusting your filters." />
        ) : (
          <div className="space-y-2">
            {filteredJobs.map(job => {
              const ps         = job.payStatus
              const Icon       = statusIcon[ps.variant]
              const isExpanded = expandedJob === job.id
              const costNum    = Number(job.service_cost_ksh) || 0
              const pct        = costNum > 0 ? Math.min(100, (ps.paid / costNum) * 100) : 0

              return (
                <div key={job.id} className="card rounded-xl overflow-hidden">

                  {/* Main row — clickable to expand */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                    style={{ userSelect: 'none' }}
                  >
                    {/* Status icon bubble */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: ps.variant === 'green' ? 'var(--green-dim)'
                          : ps.variant === 'amber' ? 'var(--amber-dim)' : 'var(--red-dim)',
                      }}
                    >
                      <Icon size={15} style={{
                        color: ps.variant === 'green' ? 'var(--green)'
                          : ps.variant === 'amber' ? 'var(--amber)' : 'var(--red)',
                      }} />
                    </div>

                    {/* Customer + progress */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                          {job.customer_name}
                        </p>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{job.device_type}</span>
                        {job.phone && (
                          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{job.phone}</span>
                        )}
                      </div>

                      {/* Payment progress bar */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div
                          className="h-1.5 rounded-full overflow-hidden flex-shrink-0"
                          style={{ background: 'var(--bg-hover)', width: 100 }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: ps.variant === 'green' ? 'var(--green)'
                                : ps.variant === 'amber' ? 'var(--amber)' : 'var(--red)',
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                          {formatKsh(ps.paid)} / {formatKsh(costNum)}
                        </span>
                      </div>
                    </div>

                    {/* Right: badge + balance + pay button + chevron */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge ${badgeClass[ps.variant]} hidden sm:inline-flex`}>
                        {ps.label}
                      </span>
                      {ps.balance > 0 && (
                        <span className="text-xs font-mono font-semibold" style={{ color: 'var(--amber)' }}>
                          -{formatKsh(ps.balance)}
                        </span>
                      )}
                      {ps.balance > 0 && (
                        <button
                          className="btn btn-primary text-xs py-1 px-2.5"
                          onClick={e => { e.stopPropagation(); openModal(job) }}
                        >
                          Pay
                        </button>
                      )}
                      {isExpanded
                        ? <ChevronUp  size={14} style={{ color: 'var(--text-muted)' }} />
                        : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </div>

                  {/* Expanded: payment history for this job */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                      {!job.payments || job.payments.length === 0 ? (
                        <p className="px-5 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                          No payments recorded yet for this job.
                        </p>
                      ) : (
                        <div className="px-4 py-2 space-y-1">
                          {job.payments.map(p => (
                            <div key={p.id} className="flex items-center justify-between py-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`badge ${p.payment_method === 'mpesa' ? 'badge-green' : 'badge-blue'} text-xs`}>
                                  {p.payment_method === 'mpesa' ? 'M-Pesa' : 'Cash'}
                                </span>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {formatDate(p.paid_at)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm font-medium" style={{ color: 'var(--green)' }}>
                                  {formatKsh(p.amount_paid_ksh)}
                                </span>
                                <button
                                  className="btn-icon p-1"
                                  style={{ color: 'var(--red)' }}
                                  onClick={() => setConfirmDel(p.id)}
                                  title="Delete this payment"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── PAYMENT RECORDS TAB ── */}
      {tab === 'records' && (
        filteredRecords.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={search ? 'No payments match' : 'No payments recorded yet'}
            description="Record a payment when a customer pays for their repair."
            action={!search && (
              <button className="btn btn-primary text-sm" onClick={() => openModal()}>
                <Plus size={15} /> Record First Payment
              </button>
            )}
          />
        ) : (
          <div className="card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Device</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(p => (
                    <tr key={p.id}>
                      <td>
                        <p className="font-medium text-sm">{p.repair_jobs?.customer_name || '—'}</p>
                      </td>
                      <td>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {p.repair_jobs?.device_type || '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${p.payment_method === 'mpesa' ? 'badge-green' : 'badge-blue'}`}>
                          {p.payment_method === 'mpesa' ? '📱 M-Pesa' : '💵 Cash'}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono font-semibold text-sm" style={{ color: 'var(--green)' }}>
                          {formatKsh(p.amount_paid_ksh)}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(p.paid_at)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-icon p-1.5"
                          style={{ color: 'var(--red)' }}
                          onClick={() => setConfirmDel(p.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── Record Payment Modal ── */}
      <Modal open={modal} onClose={() => setModal(false)} title="Record Payment" size="sm">
        <div className="space-y-4">

          <div>
            <label className="form-label">Select Job *</label>
            {jobsNeedingPayment.length === 0 ? (
              <div
                className="flex items-center gap-2 px-3 py-3 rounded-lg text-sm"
                style={{
                  background: 'var(--green-dim)',
                  color: 'var(--green)',
                  border: '1px solid rgba(34,197,94,0.2)',
                }}
              >
                <CheckCircle2 size={15} /> All jobs are fully paid!
              </div>
            ) : (
              <select
                className="input"
                value={form.job_id}
                onChange={e => handleJobSelect(e.target.value)}
              >
                <option value="">Choose a job…</option>
                {jobsNeedingPayment.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.customer_name} — {j.device_type} (Balance: KSh {j.payStatus.balance.toLocaleString('en-KE')})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="form-label">Amount (KSh) *</label>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="0"
              value={form.amount_paid_ksh}
              onChange={e => setForm(f => ({ ...f, amount_paid_ksh: e.target.value }))}
            />
            {/* Live feedback: partial vs full payment */}
            {form.job_id && (() => {
              const job     = enrichedJobs.find(j => j.id === form.job_id)
              if (!job) return null
              const entered  = Number(form.amount_paid_ksh) || 0
              const balance  = job.payStatus.balance
              const isFull   = entered >= balance && entered > 0
              const isPartial = entered > 0 && entered < balance
              return (
                <p className="text-xs mt-1.5" style={{
                  color: isFull ? 'var(--green)' : isPartial ? 'var(--amber)' : 'var(--text-muted)',
                }}>
                  {isFull
                    ? `✓ This will fully settle the balance of ${formatKsh(balance)}`
                    : isPartial
                    ? `Partial payment — ${formatKsh(balance - entered)} will remain outstanding`
                    : `Balance due: ${formatKsh(balance)}`}
                </p>
              )
            })()}
          </div>

          <div>
            <label className="form-label">Payment Method *</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, payment_method: value }))}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: form.payment_method === value ? 'var(--accent-dim)' : 'var(--bg-muted)',
                    border:     `1px solid ${form.payment_method === value ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
                    color:      form.payment_method === value ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-ghost text-sm" onClick={() => setModal(false)}>Cancel</button>
          <button
            className="btn btn-primary text-sm"
            onClick={handleSave}
            disabled={saving || !form.job_id || !form.amount_paid_ksh || Number(form.amount_paid_ksh) <= 0}
          >
            {saving ? 'Saving…' : 'Record Payment'}
          </button>
        </div>
      </Modal>

      {/* ── Confirm delete payment ── */}
      <ConfirmDialog
        open={!!confirmDel}
        title="Remove Payment?"
        message="This will delete the payment record. The job's outstanding balance will increase accordingly."
        onConfirm={async () => { await deletePayment(confirmDel); setConfirmDel(null) }}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}