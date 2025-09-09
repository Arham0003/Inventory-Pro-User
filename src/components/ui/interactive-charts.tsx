'use client'

import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface ChartData {
  labels: string[]
  datasets: any[]
}

interface InteractiveChartProps {
  type: 'line' | 'bar' | 'doughnut'
  data: ChartData
  title: string
  height?: number
  isDemoMode?: boolean
}

export function InteractiveChart({ type, data, title, height = 300, isDemoMode = false }: InteractiveChartProps) {
  // Handle missing or invalid data
  if (!data || !data.labels || !data.datasets) {
    return (
      <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
        <div style={{ height }} className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">{title}</p>
            <p className="text-gray-400 text-sm">No data available</p>
          </div>
        </div>
        {isDemoMode && (
          <div className="mt-3 text-center">
            <span className="text-xs text-gray-500 bg-orange-100 px-2 py-1 rounded">
              📊 Demo Data
            </span>
          </div>
        )}
      </div>
    )
  }
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
  }

  const lineOptions = {
    ...commonOptions,
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  }

  const barOptions = {
    ...commonOptions,
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  }

  const doughnutOptions = {
    ...commonOptions,
    cutout: '60%',
    plugins: {
      ...commonOptions.plugins,
      legend: {
        position: 'bottom' as const,
      },
    },
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={data} options={lineOptions} />
      case 'bar':
        return <Bar data={data} options={barOptions} />
      case 'doughnut':
        return <Doughnut data={data} options={doughnutOptions} />
      default:
        return null
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
      <div style={{ height }}>
        {renderChart()}
      </div>
      {isDemoMode && (
        <div className="mt-3 text-center">
          <span className="text-xs text-gray-500 bg-orange-100 px-2 py-1 rounded">
            📊 Demo Data
          </span>
        </div>
      )}
    </div>
  )
}

// Generate real chart data from sales and products
export const generateRealChartData = async (sales: any[], products: any[]) => {
  // Calculate sales trend over last 7 months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
  const salesByMonth: Record<string, number> = {}
  const profitByMonth: Record<string, number> = {}
  
  // Initialize months
  months.forEach(month => {
    salesByMonth[month] = 0
    profitByMonth[month] = 0
  })
  
  // Process sales data
  sales.forEach(sale => {
    const date = new Date(sale.created_at)
    const month = months[date.getMonth()]
    if (month) {
      salesByMonth[month] += sale.total_price
      // Calculate profit (assuming 30% margin)
      profitByMonth[month] += sale.total_price * 0.3
    }
  })
  
  const salesTrendData = {
    labels: months,
    datasets: [
      {
        label: 'Sales Revenue (₹)',
        data: months.map(month => salesByMonth[month]),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Profit (₹)',
        data: months.map(month => profitByMonth[month]),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ]
  }

  // Calculate top products from sales
  const productSales: Record<string, { name: string, quantity: number, revenue: number }> = {}
  
  sales.forEach(sale => {
    const productId = sale.product_id
    const productName = (sale as any).products?.name || 'Unknown Product'
    
    if (!productSales[productId]) {
      productSales[productId] = {
        name: productName,
        quantity: 0,
        revenue: 0
      }
    }
    
    productSales[productId].quantity += sale.quantity
    productSales[productId].revenue += sale.total_price
  })
  
  const topProductsArray = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
  
  const topProductsData = {
    labels: topProductsArray.map(p => p.name),
    datasets: [
      {
        label: 'Sales Quantity',
        data: topProductsArray.map(p => p.quantity),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 2,
        hoverBorderWidth: 3,
      }
    ]
  }

  // Calculate category distribution from products
  const categories: Record<string, number> = {}
  products.forEach(product => {
    const category = product.category || 'Other'
    categories[category] = (categories[category] || 0) + 1
  })
  
  const categoryDistributionData = {
    labels: Object.keys(categories),
    datasets: [
      {
        data: Object.values(categories),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#06B6D4',
          '#F97316',
        ],
        borderColor: [
          '#1E40AF',
          '#059669',
          '#D97706',
          '#DC2626',
          '#7C3AED',
          '#0891B2',
          '#EA580C',
        ],
        borderWidth: 2,
        hoverBorderWidth: 3,
      }
    ]
  }

  // Calculate daily sales for last 7 days
  const dailySales: Record<string, number> = {}
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  
  // Initialize days
  daysOfWeek.forEach(day => {
    dailySales[day] = 0
  })
  
  // Process last 7 days of sales
  const last7Days = sales.filter(sale => {
    const saleDate = new Date(sale.created_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return saleDate > weekAgo
  })
  
  last7Days.forEach(sale => {
    const date = new Date(sale.created_at)
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1 // Convert Sunday=0 to Sunday=6
    const day = daysOfWeek[dayIndex]
    dailySales[day] += sale.total_price
  })
  
  const dailySalesData = {
    labels: daysOfWeek,
    datasets: [
      {
        label: 'Daily Sales (₹)',
        data: daysOfWeek.map(day => dailySales[day]),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
      }
    ]
  }

  return {
    salesTrend: salesTrendData,
    topProducts: topProductsData,
    categoryDistribution: categoryDistributionData,
    dailySales: dailySalesData,
  }
}
export const generateDemoChartData = () => {
  const salesTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Sales Revenue (₹)',
        data: [45000, 52000, 48000, 61000, 55000, 67000, 73000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Profit (₹)',
        data: [12000, 15000, 14000, 18000, 16000, 20000, 22000],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ]
  }

  const topProductsData = {
    labels: ['Rice 5kg', 'Cooking Oil', 'Wheat Flour', 'Sugar', 'Tea Pack'],
    datasets: [
      {
        label: 'Sales Quantity',
        data: [45, 38, 52, 67, 23],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 2,
        hoverBorderWidth: 3,
      }
    ]
  }

  const categoryDistributionData = {
    labels: ['Groceries', 'Personal Care', 'Beverages', 'Snacks', 'Household'],
    datasets: [
      {
        data: [35, 20, 15, 18, 12],
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
        ],
        borderColor: [
          '#1E40AF',
          '#059669',
          '#D97706',
          '#DC2626',
          '#7C3AED',
        ],
        borderWidth: 2,
        hoverBorderWidth: 3,
      }
    ]
  }

  const dailySalesData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Daily Sales (₹)',
        data: [8500, 12000, 9500, 14000, 11000, 16000, 13500],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
      }
    ]
  }

  return {
    salesTrend: salesTrendData,
    topProducts: topProductsData,
    categoryDistribution: categoryDistributionData,
    dailySales: dailySalesData,
  }
}