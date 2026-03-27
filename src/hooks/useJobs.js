import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useJobs() {
  const [jobs,    setJobs]    = useState([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('repair_jobs')
      .select(`
        *,
        job_parts (
          id,
          quantity_used,
          inventory_items ( id, name, price_ksh )
        ),
        payments ( id, amount_paid_ksh, payment_method, paid_at )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load jobs')
      console.error(error)
    } else {
      setJobs(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const addJob = async (jobData, partsUsed = []) => {
    // 1. Insert the job
    const { data: job, error: jobError } = await supabase
      .from('repair_jobs')
      .insert([{
        customer_name:       jobData.customer_name,
        phone:               jobData.phone || null,
        device_type:         jobData.device_type,
        problem_description: jobData.problem_description,
        service_cost_ksh:    Number(jobData.service_cost_ksh) || 0,
        status:              jobData.status || 'pending',
      }])
      .select()
      .single()

    if (jobError) { toast.error('Failed to create job'); return null }

    // 2. Insert parts used (if any)
    if (partsUsed.length > 0) {
      const partRows = partsUsed.map(p => ({
        job_id:              job.id,
        inventory_item_id:   p.inventory_item_id,
        quantity_used:       Number(p.quantity_used),
      }))
      await supabase.from('job_parts').insert(partRows)
    }

    toast.success('Job created!')
    await fetchJobs()
    return job
  }

  const updateJobStatus = async (id, status, reduceStockFn) => {
    const { data, error } = await supabase
      .from('repair_jobs')
      .update({
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) { toast.error('Failed to update status'); return null }

    // Auto-reduce stock when job is marked completed
    if (status === 'completed' && reduceStockFn) {
      const job = jobs.find(j => j.id === id)
      if (job?.job_parts?.length > 0) {
        await reduceStockFn(job.job_parts)
      }
    }

    toast.success(`Job marked as ${status}`)
    await fetchJobs()
    return data
  }

  const updateJob = async (id, updates, partsUsed = null) => {
    const { data, error } = await supabase
      .from('repair_jobs')
      .update({
        customer_name:       updates.customer_name,
        phone:               updates.phone || null,
        device_type:         updates.device_type,
        problem_description: updates.problem_description,
        service_cost_ksh:    Number(updates.service_cost_ksh) || 0,
        status:              updates.status,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) { toast.error('Failed to update job'); return null }

    // Replace parts if provided
    if (partsUsed !== null) {
      await supabase.from('job_parts').delete().eq('job_id', id)
      if (partsUsed.length > 0) {
        const partRows = partsUsed.map(p => ({
          job_id:            id,
          inventory_item_id: p.inventory_item_id,
          quantity_used:     Number(p.quantity_used),
        }))
        await supabase.from('job_parts').insert(partRows)
      }
    }

    toast.success('Job updated')
    await fetchJobs()
    return data
  }

  const deleteJob = async (id) => {
    // Parts and payments cascade-delete (set up in Supabase)
    const { error } = await supabase.from('repair_jobs').delete().eq('id', id)
    if (error) { toast.error('Failed to delete job'); return false }
    setJobs(prev => prev.filter(j => j.id !== id))
    toast.success('Job deleted')
    return true
  }

  return { jobs, loading, addJob, updateJob, updateJobStatus, deleteJob, refetch: fetchJobs }
}
