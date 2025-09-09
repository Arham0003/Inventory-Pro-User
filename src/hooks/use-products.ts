// React hook for offline-aware product operations
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { db, OfflineProduct } from '@/lib/offline/db'
import { syncManager } from '@/lib/offline/sync'

export interface UseProductsOptions {
  enableOffline?: boolean
  autoSync?: boolean
}

export function useProducts(options: UseProductsOptions = {}) {
  const { enableOffline = true, autoSync = true } = options
  
  const [products, setProducts] = useState<OfflineProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : false)
  const [syncStatus, setSyncStatus] = useState<{
    isOnline: boolean
    pendingItems: number
    lastSync: string | null
  }>({ isOnline: false, pendingItems: 0, lastSync: null })

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)
    }
    
    loadProducts()
    
    if (autoSync && typeof window !== 'undefined') {
      const interval = setInterval(updateSyncStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [])

  const updateSyncStatus = async () => {
    if (syncManager) {
      try {
        const status = await syncManager.getSyncStatus()
        setSyncStatus(status)
        setIsOnline(status.isOnline)
      } catch (error) {
        console.error('Error updating sync status:', error)
      }
    }
  }

  const loadProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      if (enableOffline) {
        // Try offline first
        const offlineProducts = await db.products.toArray()
        
        if (offlineProducts.length > 0) {
          setProducts(offlineProducts)
          setLoading(false)
          
          // Sync in background if online
          if (isOnline && autoSync && syncManager) {
            syncManager.forcSync()
          }
          return
        }
      }

      // Fallback to online if no offline data
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProducts([])
        setLoading(false)
        return
      }

      const { data, error: supabaseError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (supabaseError) {
        throw supabaseError
      }

      const productsWithSync = (data || []).map(p => ({ ...p, synced: true }))
      setProducts(productsWithSync)

      // Save to offline database
      if (enableOffline) {
        await db.syncProductsFromServer(data || [])
      }
    } catch (err: any) {
      console.error('Error loading products:', err)
      setError(err.message)
      
      // Try offline as fallback
      if (enableOffline) {
        try {
          const offlineProducts = await db.products.toArray()
          setProducts(offlineProducts)
        } catch (offlineError) {
          console.error('Offline fallback failed:', offlineError)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const addProduct = async (productData: Omit<OfflineProduct, 'id' | 'created_at' | 'updated_at' | 'synced' | 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const newProduct: Omit<OfflineProduct, 'synced'> = {
        id: crypto.randomUUID(),
        ...productData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id
      }

      if (enableOffline) {
        // Add to offline database first
        const offlineProduct = await db.addProduct(newProduct)
        setProducts(prev => [offlineProduct, ...prev])

        if (isOnline && syncManager) {
          // Try to sync immediately
          await syncManager.forcSync()
          await loadProducts() // Reload to get synced status
        }
      } else {
        // Direct online operation
        const { data, error } = await supabase
          .from('products')
          .insert([newProduct])
          .select()
          .single()

        if (error) throw error

        setProducts(prev => [{ ...data, synced: true }, ...prev])
      }

      return newProduct
    } catch (err: any) {
      console.error('Error adding product:', err)
      throw err
    }
  }

  const updateProduct = async (id: string, updates: Partial<OfflineProduct>) => {
    try {
      if (enableOffline) {
        // Update offline first
        await db.updateProduct(id, updates)
        
        // Update local state
        setProducts(prev => prev.map(p => 
          p.id === id ? { ...p, ...updates, synced: false } : p
        ))

        if (isOnline) {
          // Try to sync immediately
          if (syncManager) {
            await syncManager.forcSync()
            await loadProducts() // Reload to get synced status
          }
        }
      } else {
        // Direct online operation
        const { error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', id)

        if (error) throw error

        setProducts(prev => prev.map(p => 
          p.id === id ? { ...p, ...updates, synced: true } : p
        ))
      }
    } catch (err: any) {
      console.error('Error updating product:', err)
      throw err
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      if (enableOffline) {
        // Delete from offline database
        await db.deleteProduct(id)
        
        // Update local state
        setProducts(prev => prev.filter(p => p.id !== id))

        if (isOnline) {
          // Try to sync immediately
          if (syncManager) {
            await syncManager.forcSync()
          }
        }
      } else {
        // Direct online operation
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id)

        if (error) throw error

        setProducts(prev => prev.filter(p => p.id !== id))
      }
    } catch (err: any) {
      console.error('Error deleting product:', err)
      throw err
    }
  }

  const searchProducts = async (query: string) => {
    if (enableOffline) {
      return await db.searchProducts(query)
    } else {
      // Online search
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%,category.ilike.%${query}%`)

      return (data || []).map(p => ({ ...p, synced: true }))
    }
  }

  const getLowStockProducts = async () => {
    if (enableOffline) {
      return await db.getLowStockProducts()
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .filter('quantity', 'lt', 'low_stock_threshold')

      return (data || []).map(p => ({ ...p, synced: true }))
    }
  }

  const syncNow = async () => {
    if (isOnline && syncManager) {
      await syncManager.forcSync()
      await loadProducts()
      await updateSyncStatus()
    }
  }

  return {
    products,
    loading,
    error,
    isOnline,
    syncStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getLowStockProducts,
    syncNow,
    reload: loadProducts
  }
}