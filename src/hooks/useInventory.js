import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useInventory() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name')

    if (error) {
      toast.error('Failed to load inventory')
      console.error(error)
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const addItem = async (item) => {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([{ ...item, quantity: Number(item.quantity), price_ksh: Number(item.price_ksh) || 0 }])
      .select()
      .single()

    if (error) { toast.error('Failed to add item'); return null }
    setItems(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    toast.success(`"${data.name}" added to inventory`)
    return data
  }

  const updateItem = async (id, updates) => {
    const { data, error } = await supabase
      .from('inventory_items')
      .update({ ...updates, quantity: Number(updates.quantity), price_ksh: Number(updates.price_ksh) || 0 })
      .eq('id', id)
      .select()
      .single()

    if (error) { toast.error('Failed to update item'); return null }
    setItems(prev => prev.map(i => i.id === id ? data : i))
    toast.success('Item updated')
    return data
  }

  const deleteItem = async (id) => {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)

    if (error) { toast.error('Failed to delete item'); return false }
    setItems(prev => prev.filter(i => i.id !== id))
    toast.success('Item removed')
    return true
  }

  /**
   * Reduce stock when a job is marked as completed.
   *
   * partsUsed comes from job.job_parts which Supabase returns as:
   *   [{ id, quantity_used, inventory_item_id, inventory_items: { id, name, price_ksh } }]
   *
   * We resolve the item id from BOTH possible locations so it works
   * regardless of how the join is shaped.
   */
  const reduceStock = async (partsUsed) => {
    if (!partsUsed || partsUsed.length === 0) return

    // Re-fetch fresh stock levels right before deducting to avoid stale state
    const { data: freshItems, error: fetchError } = await supabase
      .from('inventory_items')
      .select('id, quantity')

    if (fetchError) {
      console.error('reduceStock: failed to fetch fresh items', fetchError)
      return
    }

    for (const part of partsUsed) {
      // Resolve the inventory item id from either the flat field or the nested join object
      const itemId = part.inventory_item_id || part.inventory_items?.id
      if (!itemId) { console.warn('reduceStock: could not resolve item id for part', part); continue }

      const qtyUsed = Number(part.quantity_used) || 0
      if (qtyUsed <= 0) continue

      const freshItem = freshItems.find(i => i.id === itemId)
      if (!freshItem) { console.warn('reduceStock: item not found in DB', itemId); continue }

      const newQty = Math.max(0, freshItem.quantity - qtyUsed)

      const { error } = await supabase
        .from('inventory_items')
        .update({ quantity: newQty })
        .eq('id', itemId)

      if (error) console.error('reduceStock: failed to update item', itemId, error)
    }

    // Refresh local state after all updates
    await fetchItems()
  }

  /**
   * Restore stock when a completed job is deleted.
   * Adds back the quantities that were previously deducted.
   */
  const restoreStock = async (partsUsed) => {
    if (!partsUsed || partsUsed.length === 0) return

    const { data: freshItems, error: fetchError } = await supabase
      .from('inventory_items')
      .select('id, quantity')

    if (fetchError) {
      console.error('restoreStock: failed to fetch fresh items', fetchError)
      return
    }

    for (const part of partsUsed) {
      const itemId = part.inventory_item_id || part.inventory_items?.id
      if (!itemId) continue

      const qtyUsed = Number(part.quantity_used) || 0
      if (qtyUsed <= 0) continue

      const freshItem = freshItems.find(i => i.id === itemId)
      if (!freshItem) continue

      const newQty = freshItem.quantity + qtyUsed

      const { error } = await supabase
        .from('inventory_items')
        .update({ quantity: newQty })
        .eq('id', itemId)

      if (error) console.error('restoreStock: failed to restore item', itemId, error)
    }

    await fetchItems()
  }

  const lowStockItems = items.filter(i => i.quantity <= (i.low_stock_threshold ?? 5))

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    reduceStock,
    restoreStock,
    refetch: fetchItems,
    lowStockItems,
  }
}