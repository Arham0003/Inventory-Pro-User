'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Package,
  TrendingDown,
  BarChart3,
  Download,
  Upload,
  Scan
} from 'lucide-react'
import Link from 'next/link'
import { CSVImport } from '@/components/products/csv-import'
import { exportProductsToCSV } from '@/lib/utils/csv-utils'
import { ProductTableSkeleton, StatCardSkeleton } from '@/components/ui/skeleton'
import { SmartLoader, InstantLoader } from '@/components/ui/loading'
import { useVirtualState, useInstantTransition } from '@/lib/utils/performance'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Product {
  id: string
  name: string
  sku: string | null
  category: string | null
  quantity: number
  purchase_price: number
  selling_price: number
  gst: number
  supplier: string | null
  low_stock_threshold: number
  created_at: string
  updated_at: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const { isTransitioning, startTransition } = useInstantTransition()
  
  // Virtual state for performance
  const {
    visibleItems: visibleProducts,
    searchTerm,
    setSearchTerm,
    loadMore,
    hasMore
  } = useVirtualState(products, 50)
  
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStock, setFilterStock] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Memoize demo mode check
  const demoMode = useMemo(() => {
    return typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true'
  }, [])

  // Optimized product loading
  const loadProducts = useCallback(async () => {
    try {
      if (demoMode) {
        setProducts(getDemoProducts())
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProducts(getDemoProducts())
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .limit(1000) // Limit for performance

      if (error) {
        console.error('Error fetching products:', error)
        setProducts(getDemoProducts())
      } else {
        setProducts(data || [])
      }
    } catch (error) {
      console.error('Error loading products:', error)
      setProducts(getDemoProducts())
    } finally {
      setLoading(false)
    }
  }, [demoMode, sortBy, sortOrder])

  useEffect(() => {
    setIsDemoMode(demoMode)
    loadProducts()
  }, [demoMode, loadProducts])

  const getDemoProducts = (): Product[] => [
    {
      id: '1',
      name: 'Basmati Rice 5kg',
      sku: 'RICE-5KG-001',
      category: 'Groceries',
      quantity: 45,
      purchase_price: 400,
      selling_price: 500,
      gst: 5,
      supplier: 'Local Supplier',
      low_stock_threshold: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Cooking Oil 1L',
      sku: 'OIL-1L-002',
      category: 'Groceries',
      quantity: 8,
      purchase_price: 120,
      selling_price: 150,
      gst: 5,
      supplier: 'Oil Company',
      low_stock_threshold: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Wheat Flour 2kg',
      sku: 'FLOUR-2KG-003',
      category: 'Groceries',
      quantity: 25,
      purchase_price: 80,
      selling_price: 100,
      gst: 5,
      supplier: 'Flour Mill',
      low_stock_threshold: 20,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Sugar 1kg',
      sku: 'SUGAR-1KG-004',
      category: 'Groceries',
      quantity: 3,
      purchase_price: 45,
      selling_price: 50,
      gst: 5,
      supplier: 'Sugar Factory',
      low_stock_threshold: 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '5',
      name: 'Tea Pack 250g',
      sku: 'TEA-250G-005',
      category: 'Beverages',
      quantity: 18,
      purchase_price: 180,
      selling_price: 200,
      gst: 12,
      supplier: 'Tea Company',
      low_stock_threshold: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  // Optimized product deletion
  const deleteProduct = useCallback(async (productId: string) => {
    if (isDemoMode || demoMode) {
      alert('Delete functionality is disabled in demo mode. Sign up to access full features!')
      return
    }

    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      startTransition()
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) {
        alert('Error deleting product: ' + error.message)
      } else {
        loadProducts()
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product')
    }
  }, [isDemoMode, demoMode, startTransition, loadProducts])

  // Memoized filtered products for performance
  const filteredProducts = useMemo(() => {
    return visibleProducts.filter(product => {
      const matchesCategory = filterCategory === '' || product.category === filterCategory
      const matchesStock = filterStock === '' || 
                        (filterStock === 'low' && product.quantity <= product.low_stock_threshold) ||
                        (filterStock === 'out' && product.quantity === 0) ||
                        (filterStock === 'available' && product.quantity > product.low_stock_threshold)
      
      return matchesCategory && matchesStock
    })
  }, [visibleProducts, filterCategory, filterStock])

  // Memoized statistics
  const stats = useMemo(() => {
    const categories = Array.from(new Set(products.map(p => p.category).filter((c): c is string => c !== null)))
    const lowStockCount = products.filter(p => p.quantity <= p.low_stock_threshold).length
    const outOfStockCount = products.filter(p => p.quantity === 0).length
    const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.purchase_price), 0)
    
    return { categories, lowStockCount, outOfStockCount, totalValue }
  }, [products])

  // Show optimized loading state
  if (loading) {
    return <ProductTableSkeleton />
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-300">
      {/* Header */}
      <div className="flex justify-between items-center animate-in slide-in-from-top-1 duration-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600">Manage your inventory with advanced tracking and alerts</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/products/import"
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-fast micro-bounce focus-ring"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Link>
          <Dialog open={showCSVImport} onOpenChange={setShowCSVImport}>
            <DialogTrigger asChild>
              <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-fast micro-bounce focus-ring">
                <Upload className="h-4 w-4 mr-2" />
                Quick Import
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Quick Import Products from CSV</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to import multiple products at once
                </DialogDescription>
              </DialogHeader>
              <CSVImport onImportComplete={() => {
                setShowCSVImport(false)
                loadProducts()
              }} />
            </DialogContent>
          </Dialog>
          <button 
            onClick={() => exportProductsToCSV(products)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-fast micro-bounce focus-ring"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <Link
            href="/dashboard/products/new"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-fast micro-bounce focus-ring"
            onClick={(e) => {
              if (isDemoMode || demoMode) {
                e.preventDefault()
                alert('Add product functionality is disabled in demo mode. Sign up to access full features!')
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {(isDemoMode || demoMode) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 animate-in slide-in-from-left-2 duration-200">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <p className="text-orange-800">
              <strong>Demo Mode:</strong> Viewing sample product data. Sign up to manage your real inventory!
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards with staggered animation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 stagger-item hover-lift transition-fast">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500 gpu-accelerate">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 stagger-item hover-lift transition-fast">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-500 gpu-accelerate">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 stagger-item hover-lift transition-fast">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-gray-500 gpu-accelerate">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.outOfStockCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 stagger-item hover-lift transition-fast">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500 gpu-accelerate">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <SmartLoader loading={false} instant>
        <div className="bg-white rounded-lg shadow p-6 hover-lift transition-fast">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-fast focus-ring"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-fast focus-ring"
            >
              <option value="">All Categories</option>
              {stats.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-fast focus-ring"
            >
              <option value="">All Stock Levels</option>
              <option value="available">Available</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order as 'asc' | 'desc')
              }}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-fast focus-ring"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="quantity-asc">Stock Low-High</option>
              <option value="quantity-desc">Stock High-Low</option>
              <option value="selling_price-asc">Price Low-High</option>
              <option value="selling_price-desc">Price High-Low</option>
            </select>
          </div>
        </div>
      </SmartLoader>
      {/* Products Table with optimized rendering */}
      <SmartLoader loading={false} instant>
        <div className="bg-white rounded-lg shadow overflow-hidden hover-lift transition-fast">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product, index) => (
                  <tr key={product.id} className={`hover:bg-gray-50 transition-fast stagger-item`} style={{ animationDelay: `${index * 25}ms` }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center gpu-accelerate">
                          <Package className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.supplier}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${
                          product.quantity === 0 ? 'text-red-600' :
                          product.quantity <= product.low_stock_threshold ? 'text-orange-600' :
                          'text-gray-900'
                        }`}>
                          {product.quantity}
                        </span>
                        {product.quantity <= product.low_stock_threshold && product.quantity > 0 && (
                          <AlertTriangle className="h-4 w-4 text-orange-500 ml-1" />
                        )}
                        {product.quantity === 0 && (
                          <AlertTriangle className="h-4 w-4 text-red-500 ml-1" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.purchase_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.selling_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.gst}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/dashboard/products/${product.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 transition-fast micro-bounce"
                        onClick={(e) => {
                          if (isDemoMode || demoMode) {
                            e.preventDefault()
                            alert('Edit functionality is disabled in demo mode. Sign up to access full features!')
                          }
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900 transition-fast micro-bounce"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Load more button for virtual scrolling */}
          {hasMore && (
            <div className="p-4 text-center border-t border-gray-200">
              <button
                onClick={loadMore}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-fast micro-bounce focus-ring"
              >
                Load More Products
              </button>
            </div>
          )}
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 animate-in fade-in duration-200">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No products found matching your criteria</p>
              <Link
                href="/dashboard/products/new"
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-fast micro-bounce focus-ring"
                onClick={(e) => {
                  if (isDemoMode || demoMode) {
                    e.preventDefault()
                    alert('Add product functionality is disabled in demo mode. Sign up to access full features!')
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Link>
            </div>
          )}
        </div>
      </SmartLoader>
    </div>
  )
}