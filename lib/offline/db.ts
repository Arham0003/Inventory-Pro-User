// IndexedDB database for offline functionality
import Dexie, { Table } from 'dexie'

export interface OfflineProduct {
  id: string
  name: string
  sku: string | null
  category: string | null
  purchase_price: number
  selling_price: number
  quantity: number
  low_stock_threshold: number
  supplier: string | null
  gst: number
  created_at: string
  updated_at: string
  synced: boolean
  user_id: string
}

export interface OfflineSale {
  id: string
  product_id: string
  customer_name: string | null
  customer_phone: string | null
  quantity: number
  unit_price: number
  total_price: number
  user_id: string
  created_at: string
  updated_at: string
  synced: boolean
}

export interface SyncQueue {
  id?: number
  type: 'product' | 'sale' | 'delete_product' | 'delete_sale'
  data: any
  timestamp: string
  retries: number
}

export class InventoryDatabase extends Dexie {
  products!: Table<OfflineProduct>
  sales!: Table<OfflineSale>
  syncQueue!: Table<SyncQueue>

  constructor() {
    super('InventoryDatabase')
    
    this.version(1).stores({
      products: 'id, name, sku, category, quantity, synced, user_id',
      sales: 'id, product_id, customer_name, created_at, synced, user_id',
      syncQueue: '++id, type, timestamp'
    })
  }

  // Sync products from Supabase
  async syncProductsFromServer(products: any[]) {
    const offlineProducts: OfflineProduct[] = products.map(p => ({
      ...p,
      synced: true
    }))
    
    await this.products.clear()
    await this.products.bulkAdd(offlineProducts)
  }

  // Sync sales from Supabase
  async syncSalesFromServer(sales: any[]) {
    const offlineSales: OfflineSale[] = sales.map(s => ({
      ...s,
      synced: true
    }))
    
    await this.sales.clear()
    await this.sales.bulkAdd(offlineSales)
  }

  // Add product for offline use
  async addProduct(product: Omit<OfflineProduct, 'synced'>) {
    const offlineProduct: OfflineProduct = {
      ...product,
      synced: false
    }
    
    await this.products.add(offlineProduct)
    
    // Add to sync queue
    await this.addToSyncQueue('product', offlineProduct)
    
    return offlineProduct
  }

  // Update product offline
  async updateProduct(id: string, updates: Partial<OfflineProduct>) {
    const updatedProduct = {
      ...updates,
      synced: false,
      updated_at: new Date().toISOString()
    }
    
    await this.products.update(id, updatedProduct)
    
    // Add to sync queue
    const product = await this.products.get(id)
    if (product) {
      await this.addToSyncQueue('product', product)
    }
  }

  // Delete product offline
  async deleteProduct(id: string) {
    await this.products.delete(id)
    await this.addToSyncQueue('delete_product', { id })
  }

  // Add sale offline
  async addSale(sale: Omit<OfflineSale, 'synced'>) {
    const offlineSale: OfflineSale = {
      ...sale,
      synced: false
    }
    
    await this.sales.add(offlineSale)
    
    // Add to sync queue
    await this.addToSyncQueue('sale', offlineSale)
    
    // Update product quantity
    await this.updateProductQuantity(sale.product_id, -sale.quantity)
    
    return offlineSale
  }

  // Update product quantity
  async updateProductQuantity(productId: string, quantityChange: number) {
    const product = await this.products.get(productId)
    if (product) {
      const newQuantity = Math.max(0, product.quantity + quantityChange)
      await this.updateProduct(productId, { quantity: newQuantity })
    }
  }

  // Add to sync queue
  async addToSyncQueue(type: SyncQueue['type'], data: any) {
    await this.syncQueue.add({
      type,
      data,
      timestamp: new Date().toISOString(),
      retries: 0
    })
  }

  // Get all pending sync items
  async getPendingSyncItems() {
    return await this.syncQueue.orderBy('timestamp').toArray()
  }

  // Remove sync item
  async removeSyncItem(id: number) {
    await this.syncQueue.delete(id)
  }

  // Increment retry count
  async incrementRetries(id: number) {
    const item = await this.syncQueue.get(id)
    if (item) {
      await this.syncQueue.update(id, { retries: item.retries + 1 })
    }
  }

  // Check if we have offline products
  async hasOfflineData() {
    const productCount = await this.products.count()
    const salesCount = await this.sales.count()
    return productCount > 0 || salesCount > 0
  }

  // Get offline products with low stock
  async getLowStockProducts() {
    return await this.products
      .filter(p => p.quantity <= p.low_stock_threshold)
      .toArray()
  }

  // Get recent offline sales with product names
  async getRecentSales(limit: number = 10) {
    const sales = await this.sales
      .orderBy('created_at')
      .reverse()
      .limit(limit)
      .toArray()
    
    // Join with product data to get product names
    const salesWithProducts = await Promise.all(
      sales.map(async (sale) => {
        const product = await this.products.get(sale.product_id)
        return {
          ...sale,
          products: product ? { name: product.name } : { name: 'Unknown Product' }
        }
      })
    )
    
    return salesWithProducts
  }

  // Search products offline
  async searchProducts(query: string) {
    const lowerQuery = query.toLowerCase()
    return await this.products
      .filter(p => {
        return p.name.toLowerCase().includes(lowerQuery) ||
        (p.sku?.toLowerCase().includes(lowerQuery) ?? false) ||
        (p.category?.toLowerCase().includes(lowerQuery) ?? false)
      })
      .toArray()
  }

  // Get products by category
  async getProductsByCategory(category: string) {
    return await this.products
      .where('category')
      .equals(category)
      .toArray()
  }

  // Get sales summary
  async getSalesSummary() {
    const sales = await this.sales.toArray()
    
    const totalSales = sales.length
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_price, 0)
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0
    
    return {
      totalSales,
      totalRevenue,
      averageOrderValue
    }
  }

  // Clear all offline data
  async clearAllData() {
    await this.products.clear()
    await this.sales.clear()
    await this.syncQueue.clear()
  }
}

// Singleton instance
export const db = new InventoryDatabase()