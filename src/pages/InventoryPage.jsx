import { useState, useMemo } from 'react'
import { Package, Plus, Pencil, Trash2, Search, AlertTriangle, FileDown } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { PageSpinner, EmptyState, ConfirmDialog, SectionTitle } from '../components/ui/index'
import { formatKsh, stockColour, formatDateShort } from '../utils/helpers'

const EMPTY_FORM = { name: '', quantity: '', price_ksh: '', low_stock_threshold: '5' }

/** Generate and download a styled HTML-to-print PDF of low stock items */
function downloadLowStockPDF(lowStockItems, neededQty) {
  const date = new Date().toLocaleDateString('en-KE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

 const rows = lowStockItems.map((item, idx) => `
    <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f9fafb'}">
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111827">${item.name}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;font-weight:600;color:${item.quantity === 0 ? '#dc2626' : '#d97706'}">${item.quantity}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;color:#6b7280">${item.low_stock_threshold ?? 5}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;color:#374151">${item.price_ksh ? `KSh ${Number(item.price_ksh).toLocaleString('en-KE')}` : '—'}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center">
        <span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;
          background:${item.quantity === 0 ? '#fee2e2' : '#fef3c7'};
          color:${item.quantity === 0 ? '#dc2626' : '#d97706'}">
          ${item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
        </span>
      </td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>VoltFix — Low Stock Report</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Sora', sans-serif; background: #fff; color: #111827; padding: 32px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div style="max-width:720px;margin:0 auto">

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #1d4ed8">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:42px;height:42px;background:#1d4ed8;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px">⚡</div>
            <div>
              <h1 style="font-size:20px;font-weight:700;color:#1d4ed8">VoltFix</h1>
              <p style="font-size:11px;color:#6b7280">Repair Shop Manager</p>
            </div>
          </div>
          <div style="text-align:right">
            <p style="font-size:13px;font-weight:600;color:#111827">Low Stock Purchase List</p>
            <p style="font-size:11px;color:#6b7280;margin-top:2px">${date}</p>
          </div>
        </div>

        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin-bottom:22px;display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">⚠️</span>
          <div>
            <p style="font-size:13px;font-weight:600;color:#92400e">${lowStockItems.length} item${lowStockItems.length !== 1 ? 's' : ''} need restocking</p>
            <p style="font-size:11px;color:#b45309;margin-top:1px">Review quantities and purchase as soon as possible</p>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <thead>
            <tr style="background:#1d4ed8">
              <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:600;color:#fff">Part Name</th>
              <th style="padding:11px 14px;text-align:center;font-size:11px;font-weight:600;color:#fff">Current Qty</th>
              <th style="padding:11px 14px;text-align:center;font-size:11px;font-weight:600;color:#fff">Min Level</th>
              <th style="padding:11px 14px;text-align:right;font-size:11px;font-weight:600;color:#fff">Unit Price</th>
              <th style="padding:11px 14px;text-align:center;font-size:11px;font-weight:600;color:#fff">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div style="margin-top:28px">
          ${lowStockItems.map(item => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
              <div style="width:14px;height:14px;border:1.5px solid #d1d5db;border-radius:3px"></div>
              <span style="font-size:13px;color:#374151">${item.name}</span>
              <span style="font-size:11px;color:#9ca3af;margin-left:auto">
                Qty needed: ${neededQty[item.id] || '____'}
              </span>
            </div>
          `).join('')}
        </div>

        <div class="no-print" style="text-align:center;margin-top:28px">
          <button onclick="window.print()" style="background:#1d4ed8;color:#fff;border:none;padding:10px 28px;border-radius:8px">
            Print / Save as PDF
          </button>
        </div>

      </div>
    </body>
    </html>
  `

  // Open in new tab so user can print/save as PDF
   const blob = new Blob([html], { type: 'text/html' })
const url = URL.createObjectURL(blob)

const win = window.open(url, '_blank')

if (!win) {
  alert('Popup blocked. Please allow popups for this site.')
}
}
export default function InventoryPage({ items, loading, addItem, updateItem, deleteItem }) {
  const [search,      setSearch]      = useState('')
  const [modal,       setModal]       = useState(false)   // 'add' | 'edit' | false
  const [editTarget,  setEditTarget]  = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [saving,      setSaving]      = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(null)    // item id
  const [neededQty, setNeededQty] = useState({})

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

 const handleNeededChange = (id, value) => {
    setNeededQty(prev => ({ ...prev, [id]: value }))
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

  const lowStockItems = items.filter(i => i.quantity <= (i.low_stock_threshold ?? 5))

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-5 animate-fade-in">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Spare Parts</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {items.length} items · {lowStockItems.length} low stock
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {lowStockItems.length > 0 && (
            <button
            type="button"
              className="btn btn-ghost text-sm"
              onClick={() => downloadLowStockPDF(lowStockItems)}
              title="Download low stock list as PDF"
            >
              <FileDown size={15} />
              <span className="hidden sm:inline">Export Low Stock</span>
              <span className="sm:hidden">PDF</span>
            </button>
          )}
          <button className="btn btn-primary text-sm" onClick={openAdd}>
            <Plus size={16} /> Add Part
          </button>
        </div>
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
                        <div className="mt-1">
                        <input
                          type="number"
                          min="0"
                          placeholder="Need"
                          className="input text-xs py-1 px-2 w-20"
                          value={neededQty?.[item.id] || ''}
                          onChange={(e) => handleNeededChange(item.id, e.target.value)}
                        />
                      </div>
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