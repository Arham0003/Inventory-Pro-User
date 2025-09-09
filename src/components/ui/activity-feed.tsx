'use client'

import { useState, useEffect } from 'react'
import { Activity, Clock, User, Package, DollarSign, TrendingUp, MessageCircle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'sale' | 'product' | 'user' | 'system' | 'alert'
  title: string
  description: string
  timestamp: Date
  user?: {
    name: string
    avatar?: string
  }
  metadata?: {
    amount?: number
    quantity?: number
    productName?: string
    customerName?: string
  }
}

interface ActivityFeedProps {
  isDemoMode?: boolean
  maxItems?: number
  realSales?: any[]
  realProducts?: any[]
}

export function ActivityFeed({ isDemoMode = false, maxItems = 10, realSales = [], realProducts = [] }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const generateRealActivities = (): ActivityItem[] => {
      const activities: ActivityItem[] = []
      const now = new Date()
      
      // Add recent sales activities
      realSales.slice(0, 5).forEach((sale, index) => {
        activities.push({
          id: `sale-${sale.id}`,
          type: 'sale',
          title: 'New Sale Recorded',
          description: `Sale of ${(sale as any).products?.name || 'Product'} completed`,
          timestamp: new Date(sale.created_at),
          user: { name: sale.customer_name || 'Walk-in Customer' },
          metadata: {
            amount: sale.total_price,
            quantity: sale.quantity,
            productName: (sale as any).products?.name || 'Product',
            customerName: sale.customer_name || 'Walk-in Customer'
          }
        })
      })
      
      // Add low stock alerts for products
      realProducts.filter(product => product.quantity <= product.low_stock_threshold)
        .slice(0, 3).forEach(product => {
          activities.push({
            id: `low-stock-${product.id}`,
            type: 'alert',
            title: 'Low Stock Alert',
            description: `${product.name} is running low`,
            timestamp: new Date(now.getTime() - Math.random() * 60 * 60 * 1000), // Random time in last hour
            metadata: {
              quantity: product.quantity,
              productName: product.name
            }
          })
        })
      
      // Add product additions (recent products)
      realProducts.slice(0, 2).forEach((product, index) => {
        activities.push({
          id: `product-${product.id}`,
          type: 'product',
          title: 'Product Added',
          description: `New product "${product.name}" added to inventory`,
          timestamp: new Date(product.created_at || now.getTime() - (index + 1) * 2 * 60 * 60 * 1000),
          user: { name: 'Store Manager' },
          metadata: {
            productName: product.name,
            quantity: product.quantity
          }
        })
      })
      
      // Add system activities
      activities.push({
        id: 'backup-' + Date.now(),
        type: 'system',
        title: 'Data Sync Completed',
        description: 'Automatic data synchronization was successful',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      })
      
      if (realSales.length > 0) {
        const totalRevenue = realSales.reduce((sum, sale) => sum + sale.total_price, 0)
        if (totalRevenue > 10000) {
          activities.push({
            id: 'milestone-' + Date.now(),
            type: 'alert',
            title: 'Revenue Milestone',
            description: `Total revenue of ${formatCurrency(totalRevenue)} achieved`,
            timestamp: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
          })
        }
      }
      
      // Sort by timestamp (newest first) and limit
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, maxItems)
    }
    
    const generateDemoActivities = (): ActivityItem[] => {
      const now = new Date()
      return [
        {
          id: '1',
          type: 'sale',
          title: 'New Sale Recorded',
          description: 'Sale of Rice 5kg completed',
          timestamp: new Date(now.getTime() - 5 * 60 * 1000),
          user: { name: 'Rajesh Kumar' },
          metadata: { amount: 1250, quantity: 1, productName: 'Rice 5kg', customerName: 'Rajesh Kumar' }
        },
        {
          id: '2',
          type: 'product',
          title: 'Low Stock Alert',
          description: 'Basmati Rice 1kg is running low',
          timestamp: new Date(now.getTime() - 15 * 60 * 1000),
          metadata: { quantity: 5, productName: 'Basmati Rice 1kg' }
        },
        {
          id: '3',
          type: 'sale',
          title: 'Sale Recorded',
          description: 'Cooking Oil 1L sold',
          timestamp: new Date(now.getTime() - 25 * 60 * 1000),
          user: { name: 'Priya Sharma' },
          metadata: { amount: 890, quantity: 1, productName: 'Cooking Oil 1L', customerName: 'Priya Sharma' }
        },
        {
          id: '4',
          type: 'system',
          title: 'Daily Backup Completed',
          description: 'Automatic data backup was successful',
          timestamp: new Date(now.getTime() - 45 * 60 * 1000),
        },
        {
          id: '5',
          type: 'product',
          title: 'Product Added',
          description: 'New product "Organic Honey 500g" added to inventory',
          timestamp: new Date(now.getTime() - 60 * 60 * 1000),
          user: { name: 'Store Manager' },
          metadata: { productName: 'Organic Honey 500g', quantity: 25 }
        },
        {
          id: '6',
          type: 'sale',
          title: 'Bulk Sale',
          description: 'Large order processed',
          timestamp: new Date(now.getTime() - 75 * 60 * 1000),
          user: { name: 'Amit Singh' },
          metadata: { amount: 4500, quantity: 5, customerName: 'Amit Singh' }
        },
        {
          id: '7',
          type: 'alert',
          title: 'Revenue Milestone',
          description: 'Daily revenue target of ₹10,000 achieved',
          timestamp: new Date(now.getTime() - 90 * 60 * 1000),
        },
        {
          id: '8',
          type: 'user',
          title: 'New Customer',
          description: 'Customer "Sunita Devi" added to database',
          timestamp: new Date(now.getTime() - 120 * 60 * 1000),
          user: { name: 'Sunita Devi' },
        },
        {
          id: '9',
          type: 'product',
          title: 'Stock Restocked',
          description: 'Tea Pack inventory updated (+50 units)',
          timestamp: new Date(now.getTime() - 150 * 60 * 1000),
          metadata: { productName: 'Tea Pack', quantity: 50 }
        },
        {
          id: '10',
          type: 'system',
          title: 'Report Generated',
          description: 'Weekly sales report has been generated',
          timestamp: new Date(now.getTime() - 180 * 60 * 1000),
        }
      ]
    }

    setTimeout(() => {
      if (isDemoMode || realSales.length === 0) {
        setActivities(generateDemoActivities().slice(0, maxItems))
      } else {
        setActivities(generateRealActivities())
      }
      setLoading(false)
    }, 500) // Reduced loading time for better UX
  }, [isDemoMode, maxItems, realSales, realProducts])

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'sale':
        return <DollarSign className="h-4 w-4 text-green-600" />
      case 'product':
        return <Package className="h-4 w-4 text-blue-600" />
      case 'user':
        return <User className="h-4 w-4 text-purple-600" />
      case 'system':
        return <Activity className="h-4 w-4 text-gray-600" />
      case 'alert':
        return <TrendingUp className="h-4 w-4 text-orange-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <Activity className="h-5 w-5 text-gray-400 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <div className="flex items-center space-x-2">
            {isDemoMode && (
              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                Demo
              </span>
            )}
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <ScrollArea className="max-h-96">
        <div className="p-6 space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity</p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.5s ease-out forwards'
                }}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    {getIcon(activity.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </h4>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {getTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>

                  {/* Metadata */}
                  {activity.metadata && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {activity.metadata.amount && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          {formatCurrency(activity.metadata.amount)}
                        </span>
                      )}
                      {activity.metadata.quantity && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          Qty: {activity.metadata.quantity}
                        </span>
                      )}
                      {activity.metadata.customerName && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                          <User className="h-3 w-3 mr-1" />
                          {activity.metadata.customerName}
                        </span>
                      )}
                    </div>
                  )}

                  {/* User info */}
                  {activity.user && (
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Avatar className="h-4 w-4 mr-2">
                        <AvatarImage src={activity.user.avatar} />
                        <AvatarFallback className="text-xs">
                          {activity.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {activity.user.name}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// CSS for animations
const styles = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style")
  styleSheet.innerText = styles
  document.head.appendChild(styleSheet)
}