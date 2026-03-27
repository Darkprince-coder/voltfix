import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Modal — accessible, animated dialog overlay
 * Props: open, onClose, title, children, size ('sm'|'md'|'lg')
 */
export default function Modal({ open, onClose, title, children, size = 'md' }) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`w-full ${widths[size]} rounded-2xl border animate-slide-up overflow-hidden`}
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-lg)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} className="btn-icon rounded-lg p-1.5" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto p-5" style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
