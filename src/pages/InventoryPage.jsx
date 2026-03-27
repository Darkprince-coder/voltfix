import { useState, useMemo } from 'react'
import { Package, Plus, Pencil, Trash2, Search, AlertTriangle } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { PageSpinner, EmptyState, ConfirmDialog, SectionTitle } from '../components/ui/index'
import { formatKsh, stockColour } from '../utils/helpers'

const EMPTY_FORM = { name: '', quantity: '', price_ksh: '', low_stock_threshold: '5' }

export default function InventoryPage({ items, loading, addItem, updateItem, deleteItem }) {
  const [search,      setSearch]      = useState('')
  const [modal,       setModal]       = useState(false)   // 'add' | 'edit' | false
  const [editTarget,  setEditTarget]  = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [saving,      setSaving]      = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(null)    // item id

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(i => i.name.toLowerCase().includes(q))
  }, [items, search])

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditTarget(null)
    setModal('add')
  }

  const openEdit = (item) => {
    setForm({
      name:               item.name,
      quantity:           String(item.quantity),
      price_ksh:          String(item.price_ksh ?? ''),
      low_stock_threshold: String(item.low_stock_threshold ?? 5),
    })
    setEditTarget(item)
    setModal('edit')
  }

  const closeModal = () => { setModal(false); setEditTarget(null); setForm(EMPTY_FORM) }

  const handleSave = async () => {
    if (!form.name.trim()) return
    if (form.quantity === '' || isNaN(Number(form.quantity))) return
    setSaving(true)

    const payload = {
      name:                form.name.trim(),
      quantity:            Number(form.quantity),
      price_ksh:           Number(form.price_ksh) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 5,
    }

    if (modal === 'add') {
      await addItem(payload)
    } else {
      await updateItem(editTarget.id, payload)
    }

    setSaving(false)
    closeModal()
  }

  const handleDelete = async () => {
    if (!confirmDel) return
    await deleteItem(confirmDel)
    setConfirmDel(null)
  }

  const field = (key) => ({
    value:    form[key],
    onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
  })

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-5 animate-fade-in">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Spare Parts</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {items.length} items · {items.filter(i => i.quantity <= (i.low_stock_threshold ?? 5)).length} low stock
          </p>
        </div>
        <button className="btn btn-primary text-sm self-start sm:self-auto" onClick={openAdd}>
          <Plus size={16} /> Add Part
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          className="input pl-9 text-sm"
          placeholder="Search parts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? 'No parts match your search' : 'No spare parts yet'}
          description={search ? 'Try a different search term' : 'Add your first spare part to start tracking inventory.'}
          action={!search && (
            <button className="btn btn-primary text-sm" onClick={openAdd}>
              <Plus size={15} /> Add First Part
            </button>
          )}
        />
      ) : (
        <div className="card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Part Name</th>
                  <th>Stock</th>
                  <th>Unit Price</th>
                  <th>Low Stock Alert</th>
                  <th>Status</th>
                  <th style={{ width: 90 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const threshold = item.low_stock_threshold ?? 5
                  const isLow   = item.quantity > 0 && item.quantity <= threshold
                  const isOut   = item.quantity === 0
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--bg-muted)' }}
                          >
                            <Package size={13} style={{ color: 'var(--text-muted)' }} />
                          </div>
                          <span className="font-medium text-sm">{item.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`font-mono font-medium text-sm ${stockColour(item.quantity, threshold)}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {item.price_ksh ? formatKsh(item.price_ksh) : '—'}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>≤ {threshold}</span>
                      </td>
                      <td>
                        {isOut ? (
                          <span className="badge badge-red">Out of Stock</span>
                        ) : isLow ? (
                          <span className="badge badge-amber flex items-center gap-1 w-fit">
                            <AlertTriangle size={10} /> Low Stock
                          </span>
                        ) : (
                          <span className="badge badge-green">In Stock</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button className="btn-icon p-1.5" onClick={() => openEdit(item)} title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button
                            className="btn-icon p-1.5"
                            style={{ color: 'var(--red)' }}
                            onClick={() => setConfirmDel(item.id)}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={!!modal}
        onClose={closeModal}
        title={modal === 'add' ? 'Add Spare Part' : 'Edit Spare Part'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Part Name *</label>
            <input className="input" placeholder="e.g. Samsung capacitor 10µF" {...field('name')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Quantity *</label>
              <input className="input" type="number" min="0" placeholder="0" {...field('quantity')} />
            </div>
            <div>
              <label className="form-label">Unit Price (KSh)</label>
              <input className="input" type="number" min="0" placeholder="0" {...field('price_ksh')} />
            </div>
          </div>
          <div>
            <label className="form-label">Low Stock Alert at</label>
            <input className="input" type="number" min="1" placeholder="5" {...field('low_stock_threshold')} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Show warning when quantity drops to this number
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-ghost text-sm" onClick={closeModal}>Cancel</button>
          <button
            className="btn btn-primary text-sm"
            onClick={handleSave}
            disabled={saving || !form.name.trim() || form.quantity === ''}
          >
            {saving ? 'Saving…' : modal === 'add' ? 'Add Part' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!confirmDel}
        title="Delete Part?"
        message="This will permanently remove the item from inventory. This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}
