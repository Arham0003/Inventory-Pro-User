'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  Receipt,
  Users,
  CreditCard,
  Calendar,
  TrendingUp,
  ShoppingCart,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { exportSalesReport, exportSalesToCSV } from '@/lib/utils/sales-export'
import { SalesExport } from '@/components/sales/sales-export'
import { TableSkeleton, StatCardSkeleton } from '@/components/ui/skeleton'
import { SmartLoader, InstantLoader } from '@/components/ui/loading'
import { useVirtualState, useInstantTransition } from '@/lib/utils/performance'

interface Sale {
  id: string
  customer_name: string | null
  customer_phone?: string | null
  total_price: number
  gst_amount?: number
  invoice_number?: string
  payment_method?: string
  created_at: string
  products?: { name: string }
  quantity: number
  product_id: string
  unit_price: number
  user_id: string
  updated_at: string
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPayment, setFilterPayment] = useState('')
  const [dateRange, setDateRange] = useState('today')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const { isTransitioning, startTransition } = useInstantTransition()
  
  // Virtual state for performance with search
  const {
    visibleItems: visibleSales,
    searchTerm,
    setSearchTerm,
    loadMore,
    hasMore
  } = useVirtualState(sales, 50)

  // Memoize demo mode check
  const demoMode = useMemo(() => {
    return typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true'
  }, [])

  useEffect(() => {
    setIsDemoMode(demoMode)
    loadSales()
  }, [dateRange, demoMode])

  const loadSales = useCallback(async () => {
    try {
      if (demoMode) {
        setSales(getDemoSales())
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSales(getDemoSales())
        setLoading(false)
        return
      }

      // Calculate date filter
      const today = new Date()
      let startDate = ''
      
      switch (dateRange) {
        case 'today':
          startDate = today.toISOString().split('T')[0]
          break
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          startDate = weekAgo.toISOString().split('T')[0]
          break
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          startDate = monthAgo.toISOString().split('T')[0]
          break
        default:
          startDate = ''
      }

      let query = supabase
        .from('sales')
        .select('*, products(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500) // Limit for performance

      if (startDate) {
        query = query.gte('created_at', startDate)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching sales:', error)
        setSales(getDemoSales())
      } else {
        setSales(data || [])
      }
    } catch (error) {
      console.error('Error loading sales:', error)
      setSales(getDemoSales())
    } finally {
      setLoading(false)
    }
  }, [demoMode, dateRange])

  const getDemoSales = (): Sale[] => [
    {
      id: '1',
      customer_name: 'Rajesh Kumar',
      customer_phone: '+91 98765 43210',
      total_price: 1250,
      gst_amount: 112.5,
      invoice_number: 'INV-001',
      payment_method: 'cash',
      product_id: '1',
      unit_price: 500,
      user_id: 'demo',
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      products: { name: 'Rice 5kg' },
      quantity: 2
    },
    {
      id: '2',
      customer_name: 'Priya Sharma',
      customer_phone: '+91 87654 32109',
      total_price: 890,
      gst_amount: 80.1,
      invoice_number: 'INV-002',
      payment_method: 'card',
      product_id: '2',
      unit_price: 150,
      user_id: 'demo',
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      products: { name: 'Cooking Oil 1L' },
      quantity: 6
    },
    {
      id: '3',
      customer_name: 'Amit Singh',
      customer_phone: '+91 76543 21098',
      total_price: 450,
      gst_amount: 40.5,
      invoice_number: 'INV-003',
      payment_method: 'upi',
      product_id: '3',
      unit_price: 100,
      user_id: 'demo',
      updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      products: { name: 'Wheat Flour 2kg' },
      quantity: 4
    },
    {
      id: '4',
      customer_name: 'Sunita Devi',
      customer_phone: '+91 65432 10987',
      total_price: 320,
      gst_amount: 28.8,
      invoice_number: 'INV-004',
      payment_method: 'cash',
      product_id: '4',
      unit_price: 50,
      user_id: 'demo',
      updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      products: { name: 'Sugar 1kg' },
      quantity: 6
    },
    {
      id: '5',
      customer_name: 'Vikram Gupta',
      customer_phone: '+91 54321 09876',
      total_price: 1890,
      gst_amount: 170.1,
      invoice_number: 'INV-005',
      payment_method: 'card',
      product_id: '5',
      unit_price: 200,
      user_id: 'demo',
      updated_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      products: { name: 'Tea Pack 250g' },
      quantity: 9
    }
  ]

  const deleteSale = async (saleId: string) => {
    if (isDemoMode || localStorage.getItem('demo_mode') === 'true') {
      alert('Delete functionality is disabled in demo mode. Sign up to access full features!')
      return
    }

    if (!confirm('Are you sure you want to delete this sale?')) return

    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId)

      if (error) {
        alert('Error deleting sale: ' + error.message)
      } else {
        loadSales()
      }
    } catch (error) {
      console.error('Error deleting sale:', error)
      alert('Error deleting sale')
    }
  }

  const filteredSales = sales.filter(sale => {
    const matchesSearch = (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.products?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPayment = filterPayment === '' || sale.payment_method === filterPayment
    
    return matchesSearch && matchesPayment
  })

  const totalSales = filteredSales.length
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_price, 0)
  const totalGST = filteredSales.reduce((sum, sale) => sum + (sale.gst_amount || 0), 0)
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

  const handleExportSales = () => {
    if (filteredSales.length === 0) {
      alert('No sales data to export')
      return
    }
    
    // Create a more descriptive filename based on current filters
    let dateRangeText = dateRange
    switch (dateRange) {
      case 'today':
        dateRangeText = 'today'
        break
      case 'week':
        dateRangeText = 'last_7_days'
        break
      case 'month':
        dateRangeText = 'last_30_days'
        break
      default:
        dateRangeText = 'all_time'
    }
    
    exportSalesReport(filteredSales, dateRangeText)
  }

  const paymentMethods = ['cash', 'card', 'upi', 'bank_transfer']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-600">Track sales, generate invoices, and manage customer transactions</p>
        </div>
        <div className="flex space-x-3">
          <SalesExport 
            sales={sales}
            filteredSales={filteredSales}
            dateRange={dateRange}
            searchTerm={searchTerm}
            filterPayment={filterPayment}
          />
          <button 
            onClick={handleExportSales}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            title="Quick Export"
          >
            <Download className="h-4 w-4 mr-2" />
            Quick Export
          </button>
          <Link
            href="/dashboard/sales/new"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={(e) => {
              if (isDemoMode || localStorage.getItem('demo_mode') === 'true') {
                e.preventDefault()
                alert('New sale functionality is disabled in demo mode. Sign up to access full features!')
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Sale
          </Link>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {(isDemoMode || localStorage.getItem('demo_mode') === 'true') && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <p className="text-orange-800">
              <strong>Demo Mode:</strong> Viewing sample sales data. Sign up to track your real sales and generate invoices!
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">GST Collected</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalGST)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-500">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(averageOrderValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={loadSales}
            className="flex items-center justify-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            <Filter className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{sale.invoice_number || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sale.customer_name}</div>
                      <div className="text-sm text-gray-500">{sale.customer_phone || 'No phone'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{sale.products?.name || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{sale.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(sale.total_price)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(sale.gst_amount || 0)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      sale.payment_method === 'cash' ? 'bg-green-100 text-green-800' :
                      sale.payment_method === 'card' ? 'bg-blue-100 text-blue-800' :
                      sale.payment_method === 'upi' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {(sale.payment_method || 'unknown').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(sale.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Receipt className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteSale(sale.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredSales.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No sales found matching your criteria</p>
            <Link
              href="/dashboard/sales/new"
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={(e) => {
                if (isDemoMode || localStorage.getItem('demo_mode') === 'true') {
                  e.preventDefault()
                  alert('New sale functionality is disabled in demo mode. Sign up to access full features!')
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Record Your First Sale
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}