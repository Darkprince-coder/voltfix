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

  /** Reduce stock after a job is completed */
  const reduceStock = async (partsUsed) => {
    // partsUsed: [{ inventory_item_id, quantity_used }]
    for (const part of partsUsed) {
      const item = items.find(i => i.id === part.inventory_item_id)
      if (!item) continue
      const newQty = Math.max(0, item.quantity - part.quantity_used)
      await supabase
        .from('inventory_items')
        .update({ quantity: newQty })
        .eq('id', item.id)
    }
    await fetchItems() // refresh all stock
  }

  const lowStockItems = items.filter(i => i.quantity <= (i.low_stock_threshold ?? 5))

  return { items, loading, addItem, updateItem, deleteItem, reduceStock, refetch: fetchItems, lowStockItems }
}
