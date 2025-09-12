'use client'

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useSales } from '@/hooks/use-sales'
import { useProducts } from '@/hooks/use-products'
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle,
  Users,
  BarChart3,
  Calendar,
  RefreshCw,
  Eye,
  Plus,
  Search,
  Filter,
  Activity,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { DashboardSkeleton, StatCardSkeleton, CardSkeleton } from '@/components/ui/skeleton'
import { SmartLoader, InstantLoader } from '@/components/ui/loading'
import { useVirtualState, useInstantTransition } from '@/lib/utils/performance'
import { ChatWidget } from '@/components/ui/chat-widget'
import { NotificationCenter } from '@/components/ui/notification-center'
import { Button } from '@/components/ui/button'

// Lazy load heavy components for better performance
const InteractiveChart = lazy(() => import('@/components/ui/interactive-charts').then(module => ({ default: module.InteractiveChart })))
const AdvancedSearch = lazy(() => import('@/components/ui/advanced-search').then(module => ({ default: module.AdvancedSearch })))
const ActivityFeed = lazy(() => import('@/components/ui/activity-feed').then(module => ({ default: module.ActivityFeed })))

interface Sale {
  id: string
  product_id: string
  quantity: number
  total_price: number
  created_at: string
  customer_name?: string | null
  products?: {
    name: string
  }
}

interface Product {
  id: string
  name: string
  quantity: number
  low_stock_threshold: number
  purchase_price: number
}

interface DashboardStats {
  totalProducts: number
  lowStockProducts: number
  totalSales: number
  todaysSales: number
  totalRevenue: number
  todaysRevenue: number
  totalCustomers: number
  recentSales: Sale[]
  topProducts: any[]
  lowStockItems: Product[]
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedView, setSelectedView] = useState('overview')
  const [isLightMode, setIsLightMode] = useState(false)
  const { isTransitioning, startTransition } = useInstantTransition()
  
  // Use real hooks for data
  const { sales, loading: salesLoading, reload: reloadSales, getSalesSummary, getDailySales } = useSales()
  const { products, loading: productsLoading, reload: reloadProducts, getLowStockProducts } = useProducts()
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [realChartData, setRealChartData] = useState<any>(null)
  const [demoChartData, setDemoChartData] = useState<any>(null)

  // Memoize demo mode and performance settings check
  const demoMode = useMemo(() => {
    return typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true'
  }, [])

  const performanceMode = useMemo(() => {
    return typeof window !== 'undefined' && localStorage.getItem('performance_mode') === 'enabled'
  }, [])

  // Optimized data loading with conditional heavy operations
  const loadDashboardData = useCallback(async () => {
    try {
      if (demoMode) {
        // Load demo data and demo chart data
        setStats(getDemoData())
        if (!demoChartData) {
          const { generateDemoChartData } = await import('@/components/ui/interactive-charts')
          const chartData = generateDemoChartData()
          setDemoChartData(chartData)
        }
        setRealChartData(null)
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setStats(getDemoData())
        if (!demoChartData) {
          const { generateDemoChartData } = await import('@/components/ui/interactive-charts')
          const chartData = generateDemoChartData()
          setDemoChartData(chartData)
        }
        setRealChartData(null)
        setLoading(false)
        return
      }

      // Use real data from hooks and additional queries
      const [salesSummary, lowStockProducts, dailySalesData] = await Promise.all([
        getSalesSummary(),
        getLowStockProducts(),
        getDailySales(7)
      ])

      // Calculate today's sales and revenue
      const today = new Date().toISOString().split('T')[0]
      const todaysSales = sales.filter(sale => sale.created_at.startsWith(today))
      
      // Group sales by product for top products
      const productSales = sales.reduce((acc: Record<string, any>, sale) => {
        const productId = sale.product_id
        if (!acc[productId]) {
          acc[productId] = {
            productName: (sale as any).products?.name || 'Unknown Product',
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

      // Always generate real chart data if we have real data
      if (sales.length > 0 && products.length > 0) {
        const { generateRealChartData } = await import('@/components/ui/interactive-charts')
        const chartData = await generateRealChartData(sales, products)
        setRealChartData(chartData)
      } else if (!demoChartData) {
        const { generateDemoChartData } = await import('@/components/ui/interactive-charts')
        setDemoChartData(generateDemoChartData())
      }

      setStats({
        totalProducts: products.length,
        lowStockProducts: lowStockProducts.length,
        totalSales: sales.length,
        todaysSales: todaysSales.length,
        totalRevenue: salesSummary.totalRevenue,
        todaysRevenue: todaysSales.reduce((sum, sale) => sum + sale.total_price, 0),
        totalCustomers: new Set(sales.map(s => s.customer_name).filter(Boolean)).size,
        recentSales: sales.slice(0, 10) as Sale[],
        topProducts,
        lowStockItems: lowStockProducts.slice(0, 5)
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setStats(getDemoData())
      if (!demoChartData) {
        try {
          const { generateDemoChartData } = await import('@/components/ui/interactive-charts')
          setDemoChartData(generateDemoChartData())
      } catch (chartError) {
        console.error('Error loading demo chart data:', chartError)
      }
      }
      setRealChartData(null)
    } finally {
      setLoading(false)
    }
  }, [demoMode, sales, products, getSalesSummary, getLowStockProducts, getDailySales, demoChartData])

  // Load chart data when switching to analytics view
  useEffect(() => {
    if (selectedView === 'analytics' && !realChartData && !demoChartData) {
      loadDashboardData()
    }
  }, [selectedView, realChartData, demoChartData, loadDashboardData])

  useEffect(() => {
    setIsDemoMode(demoMode)
    if (!salesLoading && !productsLoading) {
      loadDashboardData()
    }
  }, [demoMode, salesLoading, productsLoading, loadDashboardData])

  const getDemoData = (): DashboardStats => ({
    totalProducts: 145,
    lowStockProducts: 8,
    totalSales: 342,
    todaysSales: 12,
    totalRevenue: 287450,
    todaysRevenue: 8950,
    totalCustomers: 89,
    recentSales: [
      { id: '1', customer_name: 'Rajesh Kumar', total_price: 1250, created_at: new Date().toISOString(), products: { name: 'Rice 5kg' } } as Sale,
      { id: '2', customer_name: 'Priya Sharma', total_price: 890, created_at: new Date().toISOString(), products: { name: 'Cooking Oil 1L' } } as Sale,
      { id: '3', customer_name: 'Amit Singh', total_price: 450, created_at: new Date().toISOString(), products: { name: 'Wheat Flour 2kg' } } as Sale,
      { id: '4', customer_name: 'Sunita Devi', total_price: 320, created_at: new Date().toISOString(), products: { name: 'Sugar 1kg' } } as Sale,
      { id: '5', customer_name: 'Vikram Gupta', total_price: 1890, created_at: new Date().toISOString(), products: { name: 'Tea Pack' } } as Sale
    ],
    topProducts: [
      { productName: 'Rice 5kg', quantity: 45, revenue: 22500 },
      { productName: 'Cooking Oil 1L', quantity: 38, revenue: 19890 },
      { productName: 'Wheat Flour 2kg', quantity: 52, revenue: 15600 },
      { productName: 'Sugar 1kg', quantity: 67, revenue: 13400 },
      { productName: 'Tea Pack', quantity: 23, revenue: 11500 }
    ],
    lowStockItems: [
      { id: '1', name: 'Basmati Rice 1kg', quantity: 5, low_stock_threshold: 10, purchase_price: 80 } as Product,
      { id: '2', name: 'Masala Powder', quantity: 3, low_stock_threshold: 15, purchase_price: 120 } as Product,
      { id: '3', name: 'Biscuits Pack', quantity: 8, low_stock_threshold: 20, purchase_price: 45 } as Product,
      { id: '4', name: 'Soap Bar', quantity: 2, low_stock_threshold: 12, purchase_price: 60 } as Product
    ]
  })

  const refreshData = useCallback(async () => {
    setRefreshing(true)
    startTransition()
    // Refresh data from hooks first
    await Promise.all([
      reloadSales(),
      reloadProducts()
    ])
    // Then reload dashboard data
    await loadDashboardData()
    setRefreshing(false)
  }, [loadDashboardData, startTransition, reloadSales, reloadProducts])

  // Optimized stat cards with memoization
  const statCards = useMemo(() => [
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive',
      href: '/dashboard/products'
    },
    {
      title: "Today's Sales",
      value: stats?.todaysSales || 0,
      icon: ShoppingCart,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive',
      href: '/dashboard/sales'
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(stats?.todaysRevenue || 0),
      icon: DollarSign,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'positive',
      href: '/dashboard/reports'
    },
    {
      title: 'Low Stock Items',
      value: stats?.lowStockProducts || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: '-3%',
      changeType: 'negative',
      href: '/dashboard/products?filter=low-stock'
    }
  ], [stats])

  const chartData = useMemo(() => {
    if (selectedView !== 'analytics') return null
    const data = realChartData || demoChartData
    return data
  }, [selectedView, realChartData, demoChartData])
  
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    // Implement search functionality here
  }, [])

  const handleFilter = useCallback((filters: Record<string, any>) => {
    // Implement filter functionality here
    console.log('Filters applied:', filters)
  }, [])

  const handleSort = useCallback((sort: any) => {
    // Implement sort functionality here
    console.log('Sort applied:', sort)
  }, [])

  // Show optimized loading state
  if (loading || salesLoading || productsLoading) {
    return <DashboardSkeleton />
  }

  if (!stats) {
    return (
      <div className="text-center py-12 animate-in fade-in duration-200">
        <p className="text-gray-500">Failed to load dashboard data</p>
        <button 
          onClick={refreshData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-fast micro-bounce"
        >
          {refreshing ? <InstantLoader size="sm" /> : 'Retry'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Search and Notifications */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar - Lazy Loaded */}
            <div className="hidden md:block">
              <Suspense fallback={<div className="w-80 h-10 bg-gray-100 rounded-lg animate-pulse"></div>}>
                <AdvancedSearch
                  placeholder="Search products, sales, customers..."
                  onSearch={handleSearch}
                  onFilter={handleFilter}
                  onSort={handleSort}
                  className="w-80"
                />
              </Suspense>
            </div>
            
            {/* Performance Mode Toggle */}
            <Link
              href="/dashboard/light"
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              Lite Mode
            </Link>
            
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={selectedView === 'overview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedView('overview')}
                className="text-xs"
              >
                Overview
              </Button>
              <Button
                variant={selectedView === 'analytics' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedView('analytics')}
                className="text-xs"
              >
                Analytics
              </Button>
            </div>
            
            {/* Notifications */}
            <NotificationCenter isDemoMode={isDemoMode || demoMode} />
            
            {/* Refresh Button */}
            <Button
              onClick={refreshData}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {(isDemoMode || demoMode) && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2 animate-pulse" />
            <p className="text-orange-800">
              <strong>🚀 Demo Mode:</strong> Exploring sample data. Sign up to connect your real inventory and unlock all features!
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Stats Cards with Reduced Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="transform transition-transform hover:scale-105"
          >
            <Link href={card.href}>
              <div className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                <div className="flex items-center">
                  <div className={`p-4 rounded-xl ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{card.value}</p>
                  </div>
                  <div className={`flex items-center text-sm font-semibold ${
                    card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.changeType === 'positive' ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {card.change}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Dynamic Content Based on Selected View */}
      <div key={selectedView}>
        {selectedView === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Sales - Enhanced */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
                    </div>
                    <Link href="/dashboard/sales" className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors hover:underline">
                      View all →
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {stats.recentSales.map((sale, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-b-0 hover:bg-gray-50 rounded-lg p-2 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-md">
                            <ShoppingCart className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{sale.products?.name || 'Product'}</p>
                            <p className="text-sm text-gray-600">{sale.customer_name || 'Walk-in Customer'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-lg">{formatCurrency(sale.total_price)}</p>
                          <p className="text-xs text-gray-500">{formatDate(sale.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Top Products */}
          <SmartLoader loading={false} instant>
            <div className="bg-white rounded-lg shadow hover-lift transition-fast">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between stagger-item">
                      <div>
                        <p className="font-medium text-gray-900">{product.productName}</p>
                        <p className="text-sm text-gray-500">{product.quantity} sold</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SmartLoader>

          {/* Low Stock Alert */}
          {stats.lowStockItems.length > 0 && (
            <SmartLoader loading={false} instant>
              <div className="bg-white rounded-lg shadow border border-red-200 hover-lift transition-fast">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {stats.lowStockItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between stagger-item">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-red-600">Only {item.quantity} left</p>
                        </div>
                        <Link
                          href="/dashboard/products"
                          className="text-blue-600 hover:text-blue-800 text-sm transition-fast micro-bounce"
                        >
                          Restock
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SmartLoader>
          )}

          {/* Quick Actions */}
          <SmartLoader loading={false} instant>
            <div className="bg-white rounded-lg shadow hover-lift transition-fast">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <Link
                  href="/dashboard/products/new"
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-fast micro-bounce focus-ring"
                  onClick={(e) => {
                    if (isDemoMode || demoMode) {
                      e.preventDefault()
                      alert('Feature disabled in demo mode. Sign up to access full functionality!')
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Link>
                <Link
                  href="/dashboard/sales/new"
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-fast micro-bounce focus-ring"
                  onClick={(e) => {
                    if (isDemoMode || demoMode) {
                      e.preventDefault()
                      alert('Feature disabled in demo mode. Sign up to access full functionality!')
                    }
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  New Sale
                </Link>
                <Link
                  href="/dashboard/reports"
                  className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-fast micro-bounce focus-ring"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Link>
              </div>
            </div>
          </SmartLoader>
            </div>
          </div>
        ) : (
          /* Analytics View with Lazy Loading */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<div className="bg-gray-200 h-96 rounded-lg animate-pulse"></div>}>
              <InteractiveChart 
                type="line" 
                data={chartData?.salesTrend || { labels: [], datasets: [] }} 
                title="Sales & Profit Trends" 
                isDemoMode={isDemoMode || demoMode}
              />
            </Suspense>
            <Suspense fallback={<div className="bg-gray-200 h-96 rounded-lg animate-pulse"></div>}>
              <InteractiveChart 
                type="bar" 
                data={chartData?.dailySales || { labels: [], datasets: [] }} 
                title="Daily Sales This Week" 
                isDemoMode={isDemoMode || demoMode}
              />
            </Suspense>
            <Suspense fallback={<div className="bg-gray-200 h-96 rounded-lg animate-pulse"></div>}>
              <InteractiveChart 
                type="doughnut" 
                data={chartData?.categoryDistribution || { labels: [], datasets: [] }} 
                title="Category Distribution" 
                isDemoMode={isDemoMode || demoMode}
              />
            </Suspense>
            <Suspense fallback={<div className="bg-gray-200 h-96 rounded-lg animate-pulse"></div>}>
              <InteractiveChart 
                type="bar" 
                data={chartData?.topProducts || { labels: [], datasets: [] }} 
                title="Top Selling Products" 
                isDemoMode={isDemoMode || demoMode}
              />
            </Suspense>
          </div>
        )}
      </div>
      
      {/* Activity Feed - Lazy Loaded */}
      <Suspense fallback={<div className="bg-gray-200 h-96 rounded-lg animate-pulse"></div>}>
        <ActivityFeed 
          isDemoMode={isDemoMode || demoMode} 
          maxItems={8}
          realSales={sales.slice(0, 10)}
          realProducts={products.slice(0, 5)}
        />
      </Suspense>

      {/* Performance Notice */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-green-800 text-sm">
          ⚡ <strong>Performance Tip:</strong> Switch to <Link href="/dashboard/light" className="underline font-semibold">Lite Mode</Link> for 70% faster loading with essential features only.
        </p>
      </div>

      {/* Chat Widget */}
      <ChatWidget isDemo={isDemoMode || demoMode} />
    </div>
  )
}