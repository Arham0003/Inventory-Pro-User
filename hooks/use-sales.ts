// React hook for offline-aware sales operations
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { db, OfflineSale } from '@/lib/offline/db'
import { syncManager } from '@/lib/offline/sync'

export interface UseSalesOptions {
  enableOffline?: boolean
  autoSync?: boolean
}

export function useSales(options: UseSalesOptions = {}) {
  const { enableOffline = true, autoSync = true } = options
  
  const [sales, setSales] = useState<OfflineSale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    setLoading(true)
    setError(null)

    try {
      if (enableOffline) {
        // Try offline first with product names
        const offlineSales = await db.sales.orderBy('created_at').reverse().toArray()
        
        if (offlineSales.length > 0) {
          // Join with product data to get product names
          const salesWithProducts = await Promise.all(
            offlineSales.map(async (sale) => {
              const product = await db.products.get(sale.product_id)
              return {
                ...sale,
                products: product ? { name: product.name } : { name: 'Unknown Product' }
              }
            })
          )
          setSales(salesWithProducts)
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
        setSales([])
        setLoading(false)
        return
      }

      const { data, error: supabaseError } = await supabase
        .from('sales')
        .select('*, products(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (supabaseError) {
        throw supabaseError
      }

      const salesWithSync = (data || []).map(s => ({ ...s, synced: true }))
      setSales(salesWithSync)

      // Save to offline database
      if (enableOffline) {
        await db.syncSalesFromServer(data || [])
      }
    } catch (err: any) {
      console.error('Error loading sales:', err)
      setError(err.message)
      
      // Try offline as fallback
      if (enableOffline) {
        try {
          const offlineSales = await db.sales.orderBy('created_at').reverse().toArray()
          // Join with product data to get product names
          const salesWithProducts = await Promise.all(
            offlineSales.map(async (sale) => {
              const product = await db.products.get(sale.product_id)
              return {
                ...sale,
                products: product ? { name: product.name } : { name: 'Unknown Product' }
              }
            })
          )
          setSales(salesWithProducts)
        } catch (offlineError) {
          console.error('Offline fallback failed:', offlineError)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const addSale = async (saleData: Omit<OfflineSale, 'id' | 'created_at' | 'updated_at' | 'synced' | 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const newSale: Omit<OfflineSale, 'synced'> = {
        id: crypto.randomUUID(),
        ...saleData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id
      }

      if (enableOffline) {
        // Add to offline database first (this also updates product quantity)
        const offlineSale = await db.addSale(newSale)
        setSales(prev => [offlineSale, ...prev])

        if (isOnline && syncManager) {
          // Try to sync immediately
          await syncManager.forcSync()
          await loadSales() // Reload to get synced status
        }
      } else {
        // Direct online operation
        const { data, error } = await supabase
          .from('sales')
          .insert([newSale])
          .select('*, products(name)')
          .single()

        if (error) throw error

        setSales(prev => [{ ...data, synced: true }, ...prev])

        // Update product quantity online
        const { data: productData } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', saleData.product_id)
          .single()

        if (productData) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ 
              quantity: productData.quantity - saleData.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', saleData.product_id)

          if (updateError) {
            console.error('Error updating product quantity:', updateError)
          }
        }
      }

      return newSale
    } catch (err: any) {
      console.error('Error adding sale:', err)
      throw err
    }
  }

  const getSalesSummary = async () => {
    if (enableOffline) {
      return await db.getSalesSummary()
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { totalSales: 0, totalRevenue: 0, averageOrderValue: 0 }
      }

      const { data } = await supabase
        .from('sales')
        .select('total_price')
        .eq('user_id', user.id)

      if (!data) {
        return { totalSales: 0, totalRevenue: 0, averageOrderValue: 0 }
      }

      const totalSales = data.length
      const totalRevenue = data.reduce((sum, sale) => sum + sale.total_price, 0)
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

      return { totalSales, totalRevenue, averageOrderValue }
    }
  }

  const getRecentSales = async (limit: number = 10) => {
    if (enableOffline) {
      return await db.getRecentSales(limit)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data } = await supabase
        .from('sales')
        .select('*, products(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      return (data || []).map(s => ({ ...s, synced: true }))
    }
  }

  const getDailySales = async (days: number = 7) => {
    const dailySales = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      let daySales: OfflineSale[] = []
      
      if (enableOffline) {
        const allSales = await db.sales.toArray()
        const dailySalesRaw = allSales.filter(sale => sale.created_at.startsWith(dateStr))
        
        // Join with product data to get product names
        daySales = await Promise.all(
          dailySalesRaw.map(async (sale) => {
            const product = await db.products.get(sale.product_id)
            return {
              ...sale,
              products: product ? { name: product.name } : { name: 'Unknown Product' }
            }
          })
        )
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('sales')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', dateStr)
            .lt('created_at', dateStr + 'T23:59:59')
          
          daySales = (data || []).map(s => ({ ...s, synced: true }))
        }
      }
      
      const dayRevenue = daySales.reduce((sum, sale) => sum + sale.total_price, 0)
      
      dailySales.push({
        date: dateStr,
        sales: daySales.length,
        revenue: dayRevenue
      })
    }
    
    return dailySales
  }

  const syncNow = async () => {
    if (isOnline && syncManager) {
      await syncManager.forcSync()
      await loadSales()
    }
  }

  return {
    sales,
    loading,
    error,
    isOnline,
    addSale,
    getSalesSummary,
    getRecentSales,
    getDailySales,
    syncNow,
    reload: loadSales
  }
}