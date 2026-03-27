import { useState, useMemo } from 'react'
import {
  Wrench, Plus, Pencil, Trash2, Search, ChevronDown,
  CheckCircle2, Clock, Loader, XCircle, Phone, Smartphone
} from 'lucide-react'
import Modal from '../components/ui/Modal'
import { PageSpinner, EmptyState, ConfirmDialog } from '../components/ui/index'
import { formatKsh, formatDate, statusBadge, statusLabel, truncate } from '../utils/helpers'

const DEVICE_TYPES = ['TV', 'Radio', 'Phone', 'Laptop', 'DVD Player', 'Speaker', 'Iron Box', 'Blender', 'Fridge', 'Fan', 'Other']
const STATUSES     = ['pending', 'in_progress', 'completed', 'cancelled']

const EMPTY_FORM = {
  customer_name: '', phone: '', device_type: '', problem_description: '',
  service_cost_ksh: '', status: 'pending',
}

export default function JobsPage({ jobs, loading, inventory, addJob, updateJob, updateJobStatus, deleteJob, reduceStock, restoreStock }) {
  const [search,     setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal,      setModal]      = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [parts,      setParts]      = useState([])   // [{ inventory_item_id, quantity_used }]
  const [saving,     setSaving]     = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)

  // Filter jobs
  const filtered = useMemo(() => {
    let list = jobs
    if (statusFilter !== 'all') list = list.filter(j => j.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(j =>
        j.customer_name.toLowerCase().includes(q) ||
        j.device_type.toLowerCase().includes(q) ||
        (j.phone && j.phone.includes(q))
      )
    }
    return list
  }, [jobs, search, statusFilter])

  const openAdd = () => {
    setForm(EMPTY_FORM); setParts([]); setEditTarget(null); setModal(true)
  }

  const openEdit = (job) => {
    setForm({
      customer_name:       job.customer_name,
      phone:               job.phone || '',
      device_type:         job.device_type,
      problem_description: job.problem_description,
      service_cost_ksh:    String(job.service_cost_ksh),
      status:              job.status,
    })
    setParts((job.job_parts || []).map(p => ({
      inventory_item_id: p.inventory_item_id || p.inventory_items?.id,
      quantity_used:     String(p.quantity_used),
    })))
    setEditTarget(job)
    setModal(true)
  }

  const closeModal = () => { setModal(false); setEditTarget(null); setForm(EMPTY_FORM); setParts([]) }

  const handleSave = async () => {
    if (!form.customer_name.trim() || !form.device_type || !form.problem_description.trim()) return
    setSaving(true)

    const partsPayload = parts
      .filter(p => p.inventory_item_id && p.quantity_used)
      .map(p => ({ inventory_item_id: p.inventory_item_id, quantity_used: Number(p.quantity_used) }))

    if (editTarget) {
      await updateJob(editTarget.id, form, partsPayload)
    } else {
      await addJob(form, partsPayload)
    }
    setSaving(false)
    closeModal()
  }

  const handleStatusChange = async (job, newStatus) => {
    const wasCompleted = job.status === 'completed'
    const isNowCompleted = newStatus === 'completed'

    // Reduce stock only when transitioning TO completed (not already completed)
    if (isNowCompleted && !wasCompleted) {
      await updateJobStatus(job.id, newStatus, reduceStock)
    }
    // Restore stock if un-completing a job (e.g. back to in_progress)
    else if (wasCompleted && !isNowCompleted) {
      await updateJobStatus(job.id, newStatus, null)
      if (job.job_parts?.length > 0 && restoreStock) {
        await restoreStock(job.job_parts)
      }
    }
    else {
      await updateJobStatus(job.id, newStatus, null)
    }
  }

  const addPartRow    = () => setParts(p => [...p, { inventory_item_id: '', quantity_used: '1' }])
  const removePartRow = (i) => setParts(p => p.filter((_, idx) => idx !== i))
  const updatePart    = (i, key, val) => setParts(p => p.map((row, idx) => idx === i ? { ...row, [key]: val } : row))

  const field = (key) => ({
    value:    form[key],
    onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
  })

  const statusIcon = { pending: Clock, in_progress: Loader, completed: CheckCircle2, cancelled: XCircle }

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Repair Jobs</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {jobs.length} total · {jobs.filter(j => j.status === 'pending' || j.status === 'in_progress').length} active
          </p>
        </div>
        <button className="btn btn-primary text-sm self-start sm:self-auto" onClick={openAdd}>
          <Plus size={16} /> New Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9 text-sm" placeholder="Search customer, device…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: statusFilter === s ? 'var(--accent-dim)' : 'var(--bg-muted)',
                color:      statusFilter === s ? 'var(--accent)'    : 'var(--text-muted)',
                border:     `1px solid ${statusFilter === s ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
              }}
            >
              {s === 'all' ? 'All' : statusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={search || statusFilter !== 'all' ? 'No jobs match your filters' : 'No repair jobs yet'}
          description="Create a job for every customer device that comes in for repair."
          action={!search && statusFilter === 'all' && (
            <button className="btn btn-primary text-sm" onClick={openAdd}><Plus size={15} /> New Job</button>
          )}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(job => {
            const StatusIcon = statusIcon[job.status] || Clock
            const totalPaid  = (job.payments || []).reduce((s, p) => s + Number(p.amount_paid_ksh), 0)
            const balance    = Number(job.service_cost_ksh) - totalPaid

            return (
              <div
                key={job.id}
                className="card rounded-xl p-4 sm:p-5 transition-all"
                style={{ '--hover-border': 'var(--border-lg)' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--bg-muted)' }}
                  >
                    <Smartphone size={18} style={{ color: 'var(--accent)' }} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{job.customer_name}</p>
                      {job.phone && (
                        <span className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                          <Phone size={10} /> {job.phone}
                        </span>
                      )}
                      <span className={`badge ${statusBadge(job.status)}`}>{statusLabel(job.status)}</span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{job.device_type}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {truncate(job.problem_description, 80)}
                    </p>

                    {/* Parts */}
                    {job.job_parts?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {job.job_parts.map(p => (
                          <span key={p.id} className="badge badge-teal text-xs">
                            {p.inventory_items?.name} ×{p.quantity_used}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{formatDate(job.created_at)}</p>
                  </div>

                  {/* Right: cost + actions */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-mono font-semibold text-sm" style={{ color: 'var(--green)' }}>
                        {formatKsh(job.service_cost_ksh)}
                      </p>
                      {balance > 0 && (
                        <p className="text-xs font-mono" style={{ color: 'var(--amber)' }}>
                          Bal: {formatKsh(balance)}
                        </p>
                      )}
                      {balance <= 0 && totalPaid > 0 && (
                        <p className="text-xs" style={{ color: 'var(--green)' }}>Paid ✓</p>
                      )}
                    </div>

                    {/* Status changer */}
                    <div className="relative">
                      <select
                        value={job.status}
                        onChange={e => handleStatusChange(job, e.target.value)}
                        className="input text-xs py-1.5 pl-2 pr-7 appearance-none cursor-pointer"
                        style={{ minWidth: 120 }}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                    </div>

                    <div className="flex items-center gap-1">
                      <button className="btn-icon p-1.5" onClick={() => openEdit(job)} title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button className="btn-icon p-1.5" style={{ color: 'var(--red)' }} onClick={() => setConfirmDel(job.id)} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal open={!!modal} onClose={closeModal} title={editTarget ? 'Edit Job' : 'New Repair Job'} size="lg">
        <div className="space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Customer Name *</label>
              <input className="input" placeholder="John Kamau" {...field('customer_name')} />
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input className="input" placeholder="0712 345 678" {...field('phone')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Device Type *</label>
              <select className="input" {...field('device_type')}>
                <option value="">Select device…</option>
                {DEVICE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Service Cost (KSh) *</label>
              <input className="input" type="number" min="0" placeholder="1500" {...field('service_cost_ksh')} />
            </div>
          </div>

          <div>
            <label className="form-label">Problem Description *</label>
            <textarea className="input" rows={3} placeholder="Describe the fault…" {...field('problem_description')} />
          </div>

          <div>
            <label className="form-label">Status</label>
            <select className="input" {...field('status')}>
              {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          </div>

          {/* Parts used */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Parts Used</label>
              <button className="btn btn-ghost text-xs py-1 px-2" onClick={addPartRow}>
                <Plus size={12} /> Add Part
              </button>
            </div>

            {parts.length === 0 && (
              <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>No parts added yet.</p>
            )}

            {parts.map((part, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <select
                  className="input text-sm flex-1"
                  value={part.inventory_item_id}
                  onChange={e => updatePart(idx, 'inventory_item_id', e.target.value)}
                >
                  <option value="">Select part…</option>
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (stock: {i.quantity})</option>
                  ))}
                </select>
                <input
                  className="input text-sm"
                  type="number" min="1" placeholder="Qty"
                  style={{ width: 70 }}
                  value={part.quantity_used}
                  onChange={e => updatePart(idx, 'quantity_used', e.target.value)}
                />
                <button className="btn-icon p-2" style={{ color: 'var(--red)' }} onClick={() => removePartRow(idx)}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-ghost text-sm" onClick={closeModal}>Cancel</button>
          <button
            className="btn btn-primary text-sm"
            onClick={handleSave}
            disabled={saving || !form.customer_name.trim() || !form.device_type || !form.problem_description.trim()}
          >
            {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Job'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete Job?"
        message="This will permanently delete the job and all its parts/payment records."
        onConfirm={async () => { await deleteJob(confirmDel, restoreStock); setConfirmDel(null) }}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}