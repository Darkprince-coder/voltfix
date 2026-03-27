import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function usePayments() {
  const [payments, setPayments] = useState([])
  const [loading,  setLoading]  = useState(true)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        repair_jobs ( id, customer_name, device_type, service_cost_ksh )
      `)
      .order('paid_at', { ascending: false })

    if (error) {
      toast.error('Failed to load payments')
      console.error(error)
    } else {
      setPayments(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const recordPayment = async ({ job_id, amount_paid_ksh, payment_method }) => {
    const { data, error } = await supabase
      .from('payments')
      .insert([{
        job_id,
        amount_paid_ksh: Number(amount_paid_ksh),
        payment_method:  payment_method || 'cash',
        paid_at:         new Date().toISOString(),
      }])
      .select(`*, repair_jobs ( id, customer_name, device_type, service_cost_ksh )`)
      .single()

    if (error) { toast.error('Failed to record payment'); return null }
    setPayments(prev => [data, ...prev])
    toast.success(`Payment of ${Number(amount_paid_ksh).toLocaleString('en-KE')} KSh recorded`)
    return data
  }

  const deletePayment = async (id) => {
    const { error } = await supabase.from('payments').delete().eq('id', id)
    if (error) { toast.error('Failed to delete payment'); return false }
    setPayments(prev => prev.filter(p => p.id !== id))
    toast.success('Payment removed')
    return true
  }

  return { payments, loading, recordPayment, deletePayment, refetch: fetchPayments }
}
