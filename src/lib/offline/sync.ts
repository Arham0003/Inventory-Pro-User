// Sync manager for handling offline/online data synchronization
import { supabase } from '@/lib/supabase/client'
import { db, SyncQueue } from './db'

export class SyncManager {
  private static instance: SyncManager
  private isOnline: boolean = false
  private syncInProgress: boolean = false

  constructor() {
    // Only run browser-specific code on client side
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      
      // Listen for online/offline events
      window.addEventListener('online', () => {
        this.isOnline = true
        this.performSync()
      })

      window.addEventListener('offline', () => {
        this.isOnline = false
      })

      // Periodic sync when online
      setInterval(() => {
        if (this.isOnline && !this.syncInProgress) {
          this.performSync()
        }
      }, 30000) // Sync every 30 seconds
    }
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  // Check if currently online
  getOnlineStatus(): boolean {
    return this.isOnline
  }

  // Perform full synchronization
  async performSync(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return
    }

    this.syncInProgress = true

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return
      }

      // First, sync from server to local (download)
      await this.syncFromServer(user.id)

      // Then, sync local changes to server (upload)
      await this.syncToServer(user.id)

      console.log('Sync completed successfully')
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  // Sync data from server to local database
  private async syncFromServer(userId: string): Promise<void> {
    try {
      // Fetch products from server
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)

      if (products) {
        await db.syncProductsFromServer(products)
      }

      // Fetch sales from server
      const { data: sales } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', userId)

      if (sales) {
        await db.syncSalesFromServer(sales)
      }
    } catch (error) {
      console.error('Error syncing from server:', error)
    }
  }

  // Sync local changes to server
  private async syncToServer(userId: string): Promise<void> {
    const pendingItems = await db.getPendingSyncItems()
    
    for (const item of pendingItems) {
      try {
        await this.processSyncItem(item)
        await db.removeSyncItem(item.id!)
      } catch (error) {
        console.error('Error syncing item:', error)
        
        // Increment retry count
        await db.incrementRetries(item.id!)
        
        // Remove item if too many retries
        if (item.retries >= 3) {
          await db.removeSyncItem(item.id!)
        }
      }
    }
  }

  // Process individual sync item
  private async processSyncItem(item: SyncQueue): Promise<void> {
    switch (item.type) {
      case 'product':
        await this.syncProduct(item.data)
        break
      case 'sale':
        await this.syncSale(item.data)
        break
      case 'delete_product':
        await this.deleteProduct(item.data.id)
        break
      case 'delete_sale':
        await this.deleteSale(item.data.id)
        break
    }
  }

  // Sync product to server
  private async syncProduct(product: any): Promise<void> {
    const { error } = await supabase
      .from('products')
      .upsert([product])

    if (error) {
      throw error
    }

    // Mark as synced in local database
    await db.products.update(product.id, { synced: true })
  }

  // Sync sale to server
  private async syncSale(sale: any): Promise<void> {
    const { error } = await supabase
      .from('sales')
      .upsert([sale])

    if (error) {
      throw error
    }

    // Mark as synced in local database
    await db.sales.update(sale.id, { synced: true })
  }

  // Delete product on server
  private async deleteProduct(productId: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      throw error
    }
  }

  // Delete sale on server
  private async deleteSale(saleId: string): Promise<void> {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', saleId)

    if (error) {
      throw error
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    isOnline: boolean
    pendingItems: number
    lastSync: string | null
  }> {
    const pendingItems = await db.getPendingSyncItems()
    
    return {
      isOnline: this.isOnline,
      pendingItems: pendingItems.length,
      lastSync: typeof window !== 'undefined' ? localStorage.getItem('lastSyncTime') : null
    }
  }

  // Force sync now
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.performSync()
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastSyncTime', new Date().toISOString())
      }
    }
  }

  // Initialize offline data on first load
  async initializeOfflineData(userId: string): Promise<void> {
    const hasOfflineData = await db.hasOfflineData()
    
    if (!hasOfflineData && this.isOnline) {
      await this.syncFromServer(userId)
    }
  }
}

// Singleton instance - only create on client side
let syncManagerInstance: SyncManager | null = null

if (typeof window !== 'undefined') {
  syncManagerInstance = SyncManager.getInstance()
}

export const syncManager = syncManagerInstance