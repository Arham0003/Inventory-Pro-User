'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  FileText,
  PieChart,
  AlertTriangle,
  Filter,
  RefreshCw
} from 'lucide-react'
import { DashboardSkeleton, StatCardSkeleton, CardSkeleton } from '@/components/ui/skeleton'
import { SmartLoader, InstantLoader } from '@/components/ui/loading'
import { useInstantTransition } from '@/lib/utils/performance'

interface ReportData {
  salesReport: {
    totalSales: number
    totalRevenue: number
    averageOrderValue: number
    topProducts: any[]
    dailySales: any[]
  }
  inventoryReport: {
    totalProducts: number
    lowStockItems: any[]
    outOfStockItems: any[]
    inventoryValue: number
    categoryBreakdown: any[]
  }
  customerReport: {
    totalCustomers: number
    topCustomers: any[]
    repeatCustomers: number
  }
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month')
  const [reportType, setReportType] = useState('overview')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const { isTransitioning, startTransition } = useInstantTransition()

  // Memoize demo mode check
  const demoMode = useMemo(() => {
    return typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true'
  }, [])

  useEffect(() => {
    setIsDemoMode(demoMode)
    loadReportData()
  }, [dateRange, demoMode])

  const loadReportData = useCallback(async () => {
    try {
      if (demoMode) {
        setReportData(getDemoReportData())
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setReportData(getDemoReportData())
        setLoading(false)
        return
      }

      // Calculate date filter
      const today = new Date()
      let startDate = ''
      
      switch (dateRange) {
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          startDate = weekAgo.toISOString().split('T')[0]
          break
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          startDate = monthAgo.toISOString().split('T')[0]
          break
        case 'quarter':
          const quarterAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
          startDate = quarterAgo.toISOString().split('T')[0]
          break
        case 'year':
          const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
          startDate = yearAgo.toISOString().split('T')[0]
          break
      }

      // Fetch sales data with optimization
      let salesQuery = supabase
        .from('sales')
        .select('*, products(name, category)')
        .eq('user_id', user.id)
        .limit(1000) // Limit for performance

      if (startDate) {
        salesQuery = salesQuery.gte('created_at', startDate)
      }

      const { data: salesData } = await salesQuery

      // Fetch products data
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .limit(1000) // Limit for performance

      // Process the data into report format
      const processedData = processReportData(salesData || [], productsData || [])
      setReportData(processedData)
    } catch (error) {
      console.error('Error loading report data:', error)
      setReportData(getDemoReportData())
    } finally {
      setLoading(false)
    }
  }, [demoMode, dateRange])

  const processReportData = (sales: any[], products: any[]): ReportData => {
    // Sales Report
    const totalSales = sales.length
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_price, 0)
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

    // Top products by revenue
    const productSales = sales.reduce((acc, sale) => {
      const productId = sale.product_id
      if (!acc[productId]) {
        acc[productId] = {
          productName: sale.products?.name || 'Unknown Product',
          quantity: 0,
          revenue: 0
        }
      }
      acc[productId].quantity += sale.quantity
      acc[productId].revenue += sale.total_price
      return acc
    }, {})

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5)

    // Daily sales for the last 7 days
    const dailySales = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const daySales = sales.filter(sale => sale.created_at.startsWith(dateStr))
      const dayRevenue = daySales.reduce((sum, sale) => sum + sale.total_price, 0)
      
      dailySales.push({
        date: dateStr,
        sales: daySales.length,
        revenue: dayRevenue
      })
    }

    // Inventory Report
    const lowStockItems = products.filter(p => p.quantity <= p.low_stock_threshold)
    const outOfStockItems = products.filter(p => p.quantity === 0)
    const inventoryValue = products.reduce((sum, p) => sum + (p.quantity * p.purchase_price), 0)

    // Category breakdown
    const categoryBreakdown = products.reduce((acc, product) => {
      const category = product.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = { count: 0, value: 0 }
      }
      acc[category].count += 1
      acc[category].value += product.quantity * product.purchase_price
      return acc
    }, {})

    const categoryArray = Object.entries(categoryBreakdown).map(([name, data]: [string, any]) => ({
      category: name,
      count: data.count,
      value: data.value
    }))

    // Customer Report
    const customerSales = sales.reduce((acc, sale) => {
      const customerName = sale.customer_name || 'Walk-in Customer'
      if (!acc[customerName]) {
        acc[customerName] = { orders: 0, revenue: 0 }
      }
      acc[customerName].orders += 1
      acc[customerName].revenue += sale.total_price
      return acc
    }, {})

    const topCustomers = Object.entries(customerSales)
      .map(([name, data]: [string, any]) => ({
        name,
        orders: data.orders,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    const uniqueCustomers = Object.keys(customerSales).length
    const repeatCustomers = Object.values(customerSales).filter((data: any) => data.orders > 1).length

    return {
      salesReport: {
        totalSales,
        totalRevenue,
        averageOrderValue,
        topProducts,
        dailySales
      },
      inventoryReport: {
        totalProducts: products.length,
        lowStockItems,
        outOfStockItems,
        inventoryValue,
        categoryBreakdown: categoryArray
      },
      customerReport: {
        totalCustomers: uniqueCustomers,
        topCustomers,
        repeatCustomers
      }
    }
  }

  const getDemoReportData = (): ReportData => ({
    salesReport: {
      totalSales: 342,
      totalRevenue: 287450,
      averageOrderValue: 840,
      topProducts: [
        { productName: 'Rice 5kg', quantity: 45, revenue: 22500 },
        { productName: 'Cooking Oil 1L', quantity: 38, revenue: 19890 },
        { productName: 'Wheat Flour 2kg', quantity: 52, revenue: 15600 },
        { productName: 'Sugar 1kg', quantity: 67, revenue: 13400 },
        { productName: 'Tea Pack', quantity: 23, revenue: 11500 }
      ],
      dailySales: [
        { date: '2024-01-01', sales: 12, revenue: 8950 },
        { date: '2024-01-02', sales: 15, revenue: 12340 },
        { date: '2024-01-03', sales: 18, revenue: 14560 },
        { date: '2024-01-04', sales: 14, revenue: 10890 },
        { date: '2024-01-05', sales: 20, revenue: 16780 },
        { date: '2024-01-06', sales: 16, revenue: 13450 },
        { date: '2024-01-07', sales: 22, revenue: 18920 }
      ]
    },
    inventoryReport: {
      totalProducts: 145,
      lowStockItems: [
        { name: 'Basmati Rice 1kg', quantity: 5, low_stock_threshold: 10 },
        { name: 'Masala Powder', quantity: 3, low_stock_threshold: 15 },
        { name: 'Biscuits Pack', quantity: 8, low_stock_threshold: 20 }
      ],
      outOfStockItems: [
        { name: 'Premium Tea', quantity: 0 },
        { name: 'Organic Honey', quantity: 0 }
      ],
      inventoryValue: 145680,
      categoryBreakdown: [
        { category: 'Groceries', count: 85, value: 89500 },
        { category: 'Beverages', count: 25, value: 28900 },
        { category: 'Snacks', count: 20, value: 15600 },
        { category: 'Personal Care', count: 15, value: 11680 }
      ]
    },
    customerReport: {
      totalCustomers: 89,
      topCustomers: [
        { name: 'Rajesh Kumar', orders: 15, revenue: 12450 },
        { name: 'Priya Sharma', orders: 12, revenue: 9890 },
        { name: 'Amit Singh', orders: 10, revenue: 8765 },
        { name: 'Sunita Devi', orders: 8, revenue: 6540 },
        { name: 'Vikram Gupta', orders: 7, revenue: 5890 }
      ],
      repeatCustomers: 34
    }
  })

  const exportReport = (type: string) => {
    if (!reportData) return

    // Create CSV content based on report type
    let csvContent = ''
    let filename = ''

    switch (type) {
      case 'sales':
        csvContent = 'Product,Quantity Sold,Revenue\n'
        reportData.salesReport.topProducts.forEach(product => {
          csvContent += `${product.productName},${product.quantity},${product.revenue}\n`
        })
        filename = `sales-report-${dateRange}.csv`
        break
      case 'inventory':
        csvContent = 'Product,Current Stock,Low Stock Threshold,Status\n'
        reportData.inventoryReport.lowStockItems.forEach(item => {
          csvContent += `${item.name},${item.quantity},${item.low_stock_threshold},Low Stock\n`
        })
        reportData.inventoryReport.outOfStockItems.forEach(item => {
          csvContent += `${item.name},${item.quantity},,Out of Stock\n`
        })
        filename = `inventory-report-${dateRange}.csv`
        break
      case 'customers':
        csvContent = 'Customer,Orders,Revenue\n'
        reportData.customerReport.topCustomers.forEach(customer => {
          csvContent += `${customer.name},${customer.orders},${customer.revenue}\n`
        })
        filename = `customer-report-${dateRange}.csv`
        break
    }

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!reportData) {
    return (
      <div className="text-center py-12 animate-in fade-in duration-200">
        <p className="text-gray-500">Failed to load report data</p>
        <button 
          onClick={loadReportData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-fast micro-bounce focus-ring"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-300">
      {/* Header */}
      <div className="flex justify-between items-center animate-in slide-in-from-top-1 duration-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive business insights and data analysis</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              startTransition()
              loadReportData()
            }}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-fast micro-bounce focus-ring"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isTransitioning ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {(isDemoMode || demoMode) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 animate-in slide-in-from-left-2 duration-200">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <p className="text-orange-800">
              <strong>Demo Mode:</strong> Viewing sample report data. Sign up to access your real business analytics!
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="overview">Overview</option>
              <option value="sales">Sales Report</option>
              <option value="inventory">Inventory Report</option>
              <option value="customers">Customer Report</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => exportReport(reportType)}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export {reportType.charAt(0).toUpperCase() + reportType.slice(1)}
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.salesReport.totalSales}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.salesReport.totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Products</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.inventoryReport.totalProducts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-500">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.customerReport.totalCustomers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Daily Sales Trend
          </h3>
          <div className="space-y-3">
            {reportData.salesReport.dailySales.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-16 text-sm text-gray-600">{formatDate(day.date)}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(day.revenue / Math.max(...reportData.salesReport.dailySales.map(d => d.revenue))) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(day.revenue)}</div>
                  <div className="text-sm text-gray-500">{day.sales} sales</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Top Products by Revenue
          </h3>
          <div className="space-y-3">
            {reportData.salesReport.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{product.productName}</div>
                    <div className="text-sm text-gray-500">{product.quantity} sold</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(product.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Inventory Alerts
          </h3>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-red-600 mb-2">Out of Stock ({reportData.inventoryReport.outOfStockItems.length})</h4>
              {reportData.inventoryReport.outOfStockItems.slice(0, 3).map((item, index) => (
                <div key={index} className="text-sm text-gray-600 mb-1">• {item.name}</div>
              ))}
            </div>
            <div className="border-t pt-3">
              <h4 className="font-medium text-orange-600 mb-2">Low Stock ({reportData.inventoryReport.lowStockItems.length})</h4>
              {reportData.inventoryReport.lowStockItems.slice(0, 3).map((item, index) => (
                <div key={index} className="text-sm text-gray-600 mb-1">• {item.name} ({item.quantity} left)</div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Top Customers
          </h3>
          <div className="space-y-3">
            {reportData.customerReport.topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-500">{customer.orders} orders</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(customer.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}