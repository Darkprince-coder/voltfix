import { useState, useMemo } from 'react'
import { CreditCard, Plus, Trash2, Search, Banknote, Smartphone } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { PageSpinner, EmptyState, ConfirmDialog } from '../components/ui/index'
import { formatKsh, formatDate } from '../utils/helpers'

const PAYMENT_METHODS = [
  { value: 'cash',  label: 'Cash',   icon: Banknote   },
  { value: 'mpesa', label: 'M-Pesa', icon: Smartphone },
]

export default function PaymentsPage({ payments, jobs, loading, recordPayment, deletePayment }) {
  const [search,     setSearch]     = useState('')
  const [modal,      setModal]      = useState(false)
  const [form,       setForm]       = useState({ job_id: '', amount_paid_ksh: '', payment_method: 'cash' })
  const [saving,     setSaving]     = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)

  // Unpaid / partially paid jobs for the dropdown
  const unpaidJobs = useMemo(() => {
    return jobs.filter(j => {
      const paid    = (j.payments || []).reduce((s, p) => s + Number(p.amount_paid_ksh), 0)
      const balance = Number(j.service_cost_ksh) - paid
      return balance > 0
    })
  }, [jobs])

  const filtered = useMemo(() => {
    if (!search) return payments
    const q = search.toLowerCase()
    return payments.filter(p =>
      p.repair_jobs?.customer_name?.toLowerCase().includes(q) ||
      p.repair_jobs?.device_type?.toLowerCase().includes(q) ||
      p.payment_method?.toLowerCase().includes(q)
    )
  }, [payments, search])

  // Totals
  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount_paid_ksh), 0)
  const cashTotal    = payments.filter(p => p.payment_method === 'cash').reduce((s, p) => s + Number(p.amount_paid_ksh), 0)
  const mpesaTotal   = payments.filter(p => p.payment_method === 'mpesa').reduce((s, p) => s + Number(p.amount_paid_ksh), 0)

  const openModal = () => {
    setForm({ job_id: '', amount_paid_ksh: '', payment_method: 'cash' })
    setModal(true)
  }

  const closeModal = () => { setModal(false) }

  // When job is selected, pre-fill with balance due
  const handleJobSelect = (jobId) => {
    const job = jobs.find(j => j.id === jobId)
    if (!job) { setForm(f => ({ ...f, job_id: jobId, amount_paid_ksh: '' })); return }
    const paid    = (job.payments || []).reduce((s, p) => s + Number(p.amount_paid_ksh), 0)
    const balance = Number(job.service_cost_ksh) - paid
    setForm(f => ({ ...f, job_id: jobId, amount_paid_ksh: String(Math.max(0, balance)) }))
  }

  const handleSave = async () => {
    if (!form.job_id || !form.amount_paid_ksh) return
    setSaving(true)
    await recordPayment({
      job_id:          form.job_id,
      amount_paid_ksh: Number(form.amount_paid_ksh),
      payment_method:  form.payment_method,
    })
    setSaving(false)
    closeModal()
  }

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Payments</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{payments.length} records</p>
        </div>
        <button className="btn btn-primary text-sm self-start sm:self-auto" onClick={openModal}>
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Revenue', value: formatKsh(totalRevenue), colour: 'var(--green)',  bg: 'var(--green-dim)'  },
          { label: 'Cash Received', value: formatKsh(cashTotal),    colour: 'var(--accent)', bg: 'var(--accent-dim)' },
          { label: 'M-Pesa Received', value: formatKsh(mpesaTotal), colour: 'var(--teal)',   bg: 'var(--teal-dim)'   },
        ].map(({ label, value, colour, bg }) => (
          <div key={label} className="card rounded-xl px-5 py-4">
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="font-mono font-semibold text-xl mt-1" style={{ color: colour }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          className="input pl-9 text-sm"
          placeholder="Search payments…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={search ? 'No payments match' : 'No payments recorded yet'}
          description="Record a payment when a customer pays for their repair."
          action={!search && (
            <button className="btn btn-primary text-sm" onClick={openModal}>
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
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
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
                      <span
                        className={`badge ${p.payment_method === 'mpesa' ? 'badge-green' : 'badge-blue'}`}
                      >
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
      )}

      {/* Record Payment Modal */}
      <Modal open={modal} onClose={closeModal} title="Record Payment" size="sm">
        <div className="space-y-4">

          <div>
            <label className="form-label">Select Job *</label>
            {unpaidJobs.length === 0 ? (
              <p className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>
                All jobs are fully paid. ✓
              </p>
            ) : (
              <select
                className="input"
                value={form.job_id}
                onChange={e => handleJobSelect(e.target.value)}
              >
                <option value="">Choose a job…</option>
                {unpaidJobs.map(j => {
                  const paid    = (j.payments || []).reduce((s, p) => s + Number(p.amount_paid_ksh), 0)
                  const balance = Number(j.service_cost_ksh) - paid
                  return (
                    <option key={j.id} value={j.id}>
                      {j.customer_name} — {j.device_type} (Balance: KSh {balance.toLocaleString()})
                    </option>
                  )
                })}
              </select>
            )}
          </div>

          <div>
            <label className="form-label">Amount (KSh) *</label>
            <input
              className="input"
              type="number" min="0"
              placeholder="0"
              value={form.amount_paid_ksh}
              onChange={e => setForm(f => ({ ...f, amount_paid_ksh: e.target.value }))}
            />
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
          <button className="btn btn-ghost text-sm" onClick={closeModal}>Cancel</button>
          <button
            className="btn btn-primary text-sm"
            onClick={handleSave}
            disabled={saving || !form.job_id || !form.amount_paid_ksh}
          >
            {saving ? 'Saving…' : 'Record Payment'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        title="Remove Payment?"
        message="This will delete the payment record. The job balance will be updated."
        onConfirm={async () => { await deletePayment(confirmDel); setConfirmDel(null) }}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}
