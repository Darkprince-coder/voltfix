import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Package, Plus, Pencil, Trash2, Search,
  AlertTriangle, FileDown, Loader2, X, ShoppingCart
} from 'lucide-react'
import Modal from '../components/ui/Modal'
import { PageSpinner, EmptyState, ConfirmDialog } from '../components/ui/index'
import { formatKsh, stockColour } from '../utils/helpers'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const EMPTY_FORM = { name: '', quantity: '', price_ksh: '', low_stock_threshold: '5' }

/* ─────────────────────────────────────────────────────────────────────────────
   PDF GENERATION
   Uses jsPDF + jspdf-autotable loaded dynamically from CDN (no npm install).
   orderRows: [{ name, currentQty, orderQty, unitPrice, supplier, notes }]
───────────────────────────────────────────────────────────────────────────── */
async function generatePDF(orderRows, shopName = 'VoltFix') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW  = doc.internal.pageSize.getWidth()
  const today  = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
  const BLUE   = [29, 78, 216]
  const GRAY   = [107, 114, 128]
  const DARK   = [17, 24, 39]
  const AMBER  = [217, 119, 6]
  const RED    = [220, 38, 38]

  // ── Header bar ──
  doc.setFillColor(...BLUE)
  doc.rect(0, 0, pageW, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('⚡ ' + shopName, 14, 12)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Repair Shop Manager', 14, 19)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('PURCHASE ORDER', pageW - 14, 12, { align: 'right' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(today, pageW - 14, 19, { align: 'right' })

  // ── Alert summary box ──
  const lowCount = orderRows.length
  doc.setFillColor(255, 251, 235)
  doc.setDrawColor(252, 211, 77)
  doc.roundedRect(14, 34, pageW - 28, 14, 2, 2, 'FD')
  doc.setTextColor(...AMBER)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`⚠  ${lowCount} item${lowCount !== 1 ? 's' : ''} need restocking`, 20, 42)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Review order quantities below before submitting to your supplier.', 20, 48)

  // ── Table ──
  const totalOrderValue = orderRows.reduce((s, r) => {
    const price = Number(r.unitPrice) || 0
    const qty   = Number(r.orderQty)  || 0
    return s + price * qty
  }, 0)

 autoTable(doc, {
    startY:   58,
    margin:   { left: 14, right: 14 },
    head: [[
      'Part Name',
      'Current\nStock',
      'Order\nQty',
      'Unit Price\n(KSh)',
      'Total\n(KSh)',
      'Supplier',
      'Notes',
    ]],
    body: orderRows.map(r => {
      const price = Number(r.unitPrice) || 0
      const qty   = Number(r.orderQty)  || 0
      return [
        r.name,
        { content: r.currentQty, styles: { textColor: r.currentQty === 0 ? RED : AMBER, fontStyle: 'bold' } },
        { content: qty > 0 ? qty : '—', styles: { fontStyle: 'bold' } },
        price > 0 ? price.toLocaleString('en-KE') : '—',
        price > 0 && qty > 0 ? (price * qty).toLocaleString('en-KE') : '—',
        r.supplier || '—',
        r.notes    || '—',
      ]
    }),
    foot: [[
      { content: 'TOTAL ORDER VALUE', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
      {
        content: totalOrderValue > 0 ? `KSh ${totalOrderValue.toLocaleString('en-KE')}` : '—',
        styles:  { fontStyle: 'bold', textColor: BLUE },
      },
      '', '',
    ]],
    headStyles:  { fillColor: BLUE, textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center' },
    footStyles:  { fillColor: [239, 246, 255], fontSize: 9 },
    bodyStyles:  { fontSize: 8, textColor: DARK },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 22, halign: 'right'  },
      4: { cellWidth: 22, halign: 'right'  },
      5: { cellWidth: 30 },
      6: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.2,
  })

  // ── Signature block ──
  const finalY = doc.lastAutoTable.finalY + 16
  if (finalY < 260) {
    doc.setDrawColor(209, 213, 219)
    doc.setLineWidth(0.3)

    const sigW = (pageW - 42) / 2
    doc.line(14,         finalY + 14, 14 + sigW,          finalY + 14)
    doc.line(14 + sigW + 14, finalY + 14, 14 + sigW * 2 + 14, finalY + 14)

    doc.setTextColor(...GRAY)
    doc.setFontSize(8)
    doc.text('Prepared by',  14,                  finalY + 20)
    doc.text('Approved by',  14 + sigW + 14,       finalY + 20)
  }

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(...GRAY)
    doc.text(
      `${shopName} · Generated by VoltFix Repair Manager · Page ${i} of ${pageCount}`,
      pageW / 2, doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    )
  }

  doc.save(`voltfix-purchase-order-${Date.now()}.pdf`)
}

/* ─────────────────────────────────────────────────────────────────────────────
   PURCHASE ORDER MODAL
   Allows editing order qty, supplier, notes per item before export.
───────────────────────────────────────────────────────────────────────────── */
function PurchaseOrderModal({ open, onClose, lowStockItems }) {
  const initRows = useCallback(() =>
    lowStockItems.map(item => ({
      id:         item.id,
      name:       item.name,
      currentQty: item.quantity,
      orderQty:   String(Math.max(1, (item.low_stock_threshold ?? 5) * 2 - item.quantity)),
      unitPrice:  String(item.price_ksh ?? ''),
      supplier:   '',
      notes:      '',
      include:    true,
    })), [lowStockItems])

  const [rows,       setRows]       = useState(() => initRows())
  const [generating, setGenerating] = useState(false)
  const [shopName,   setShopName]   = useState('VoltFix')

  // Reset rows whenever modal opens with fresh items
useEffect(() => {
  if (open) setRows(initRows())
}, [open, initRows])

  const updateRow = (id, key, val) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r))

  const includedRows = rows.filter(r => r.include)

  const totalValue = includedRows.reduce((s, r) => {
    return s + (Number(r.unitPrice) || 0) * (Number(r.orderQty) || 0)
  }, 0)

  const handleExport = async () => {
    if (includedRows.length === 0) return
    setGenerating(true)
    try {
      await generatePDF(includedRows, shopName)
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('PDF generation failed. Please check your internet connection and try again.')
    }
    setGenerating(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="Purchase Order" size="lg">
      <div className="space-y-4">

        {/* Shop name */}
        <div>
          <label className="form-label">Shop / Business Name</label>
          <input
            className="input text-sm"
            value={shopName}
            onChange={e => setShopName(e.target.value)}
            placeholder="Your shop name"
          />
        </div>

        {/* Instructions */}
        <div
          className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-xs"
          style={{ background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Review and edit each item before exporting.</p>
            <p className="mt-0.5 opacity-80">Set the order quantity, supplier, and any notes. Uncheck items you don't want to include.</p>
          </div>
        </div>

        {/* Items table */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {/* Table header */}
          <div
            className="grid text-xs font-medium uppercase tracking-wide px-3 py-2.5"
            style={{
              background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border)',
              color: 'var(--text-muted)',
              gridTemplateColumns: '28px 1fr 60px 80px 90px 110px 110px',
              gap: 8,
            }}
          >
            <span></span>
            <span>Part Name</span>
            <span className="text-center">Have</span>
            <span className="text-center">Order Qty</span>
            <span className="text-right">Unit (KSh)</span>
            <span>Supplier</span>
            <span>Notes</span>
          </div>

          {/* Rows */}
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {rows.map((row, idx) => (
              <div
                key={row.id}
                className="grid items-center px-3 py-2.5 gap-2 transition-all"
                style={{
                  gridTemplateColumns: '28px 1fr 60px 80px 90px 110px 110px',
                  background: row.include ? (idx % 2 === 0 ? 'transparent' : 'var(--bg-elevated)') : 'var(--bg-muted)',
                  opacity: row.include ? 1 : 0.45,
                }}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={row.include}
                  onChange={e => updateRow(row.id, 'include', e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer accent-blue-500"
                />

                {/* Name */}
                <div>
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{row.name}</p>
                  <span
                    className="text-xs"
                    style={{ color: row.currentQty === 0 ? 'var(--red)' : 'var(--amber)' }}
                  >
                    {row.currentQty === 0 ? 'Out of stock' : `${row.currentQty} left`}
                  </span>
                </div>

                {/* Current qty badge */}
                <div className="text-center">
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: row.currentQty === 0 ? 'var(--red)' : 'var(--amber)' }}
                  >
                    {row.currentQty}
                  </span>
                </div>

                {/* Order qty input */}
                <input
                  type="number"
                  min="0"
                  className="input text-sm text-center px-2 py-1.5"
                  style={{ fontSize: 13 }}
                  value={row.orderQty}
                  onChange={e => updateRow(row.id, 'orderQty', e.target.value)}
                  disabled={!row.include}
                />

                {/* Unit price input */}
                <input
                  type="number"
                  min="0"
                  className="input text-sm text-right px-2 py-1.5"
                  style={{ fontSize: 13 }}
                  placeholder="0"
                  value={row.unitPrice}
                  onChange={e => updateRow(row.id, 'unitPrice', e.target.value)}
                  disabled={!row.include}
                />

                {/* Supplier */}
                <input
                  type="text"
                  className="input text-sm px-2 py-1.5"
                  style={{ fontSize: 12 }}
                  placeholder="Supplier name"
                  value={row.supplier}
                  onChange={e => updateRow(row.id, 'supplier', e.target.value)}
                  disabled={!row.include}
                />

                {/* Notes */}
                <input
                  type="text"
                  className="input text-sm px-2 py-1.5"
                  style={{ fontSize: 12 }}
                  placeholder="e.g. urgent"
                  value={row.notes}
                  onChange={e => updateRow(row.id, 'notes', e.target.value)}
                  disabled={!row.include}
                />
              </div>
            ))}
          </div>

          {/* Footer total */}
          {totalValue > 0 && (
            <div
              className="flex items-center justify-between px-4 py-2.5 text-sm font-medium"
              style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>
                {includedRows.length} item{includedRows.length !== 1 ? 's' : ''} selected
              </span>
              <span style={{ color: 'var(--accent)' }}>
                Estimated total: <span className="font-mono font-semibold">{formatKsh(totalValue)}</span>
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3 mt-6">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          PDF will download automatically
        </p>
        <div className="flex gap-3">
          <button className="btn btn-ghost text-sm" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary text-sm"
            onClick={handleExport}
            disabled={generating || includedRows.length === 0}
          >
            {generating
              ? <><Loader2 size={15} className="animate-spin" /> Generating…</>
              : <><FileDown size={15} /> Export PDF</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function InventoryPage({ items, loading, addItem, updateItem, deleteItem }) {
  const [search,      setSearch]      = useState('')
  const [modal,       setModal]       = useState(false)   // 'add' | 'edit' | false
  const [editTarget,  setEditTarget]  = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [saving,      setSaving]      = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(null)
  const [poModal,     setPoModal]     = useState(false)   // Purchase Order modal

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
      name:                item.name,
      quantity:            String(item.quantity),
      price_ksh:           String(item.price_ksh ?? ''),
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

  const lowStockItems = items.filter(i => i.quantity <= (i.low_stock_threshold ?? 5))

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
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
              className="btn btn-ghost text-sm"
              onClick={() => setPoModal(true)}
              title="Create purchase order PDF for low stock items"
            >
              <ShoppingCart size={15} />
              <span className="hidden sm:inline">Purchase Order</span>
              <span className="sm:hidden">Order</span>
              <span
                className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}
              >
                {lowStockItems.length}
              </span>
            </button>
          )}
          <button className="btn btn-primary text-sm" onClick={openAdd}>
            <Plus size={16} /> Add Part
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          className="input pl-9 text-sm"
          placeholder="Search parts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── Table ── */}
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
                  <th>Alert at</th>
                  <th>Status</th>
                  <th style={{ width: 90 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const threshold = item.low_stock_threshold ?? 5
                  const isLow = item.quantity > 0 && item.quantity <= threshold
                  const isOut = item.quantity === 0
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

      {/* ── Add / Edit Modal ── */}
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

      {/* ── Purchase Order Modal ── */}
      <PurchaseOrderModal
        open={poModal}
        onClose={() => setPoModal(false)}
        lowStockItems={lowStockItems}
      />

      {/* ── Confirm delete ── */}
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