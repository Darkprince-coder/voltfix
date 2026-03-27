import { format, isToday, parseISO } from 'date-fns'

/** Format a number as Kenyan Shillings */
export const formatKsh = (amount) => {
  const n = Number(amount) || 0
  return `KSh ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/** Format date to readable string */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`
    return format(d, 'dd MMM yyyy, h:mm a')
  } catch {
    return dateStr
  }
}

/** Format date short */
export const formatDateShort = (dateStr) => {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return format(d, 'dd MMM yyyy')
  } catch {
    return dateStr
  }
}

/** Get today ISO string (date only) */
export const todayISO = () => format(new Date(), 'yyyy-MM-dd')

/** Status → badge class mapping */
export const statusBadge = (status) => {
  switch (status) {
    case 'completed':   return 'badge-green'
    case 'in_progress': return 'badge-blue'
    case 'pending':     return 'badge-amber'
    case 'cancelled':   return 'badge-red'
    default:            return 'badge-teal'
  }
}

/** Status → display label */
export const statusLabel = (status) => {
  switch (status) {
    case 'completed':   return 'Completed'
    case 'in_progress': return 'In Progress'
    case 'pending':     return 'Pending'
    case 'cancelled':   return 'Cancelled'
    default:            return status
  }
}

/** Stock level → colour */
export const stockColour = (qty, threshold = 5) => {
  if (qty === 0)          return 'text-red-400'
  if (qty <= threshold)   return 'text-amber-400'
  return 'text-green-400'
}

/** Generate simple ID (for optimistic UI before Supabase returns id) */
export const tempId = () => `temp_${Math.random().toString(36).slice(2)}`

/** Truncate string */
export const truncate = (str, n = 40) =>
  str && str.length > n ? str.slice(0, n) + '…' : str
