'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  FileText, 
  Settings, 
  Home,
  TrendingUp,
  AlertTriangle,
  Users,
  Calendar,
  CreditCard,
  Printer,
  Download,
  Scan
} from 'lucide-react'
import { OfflineIndicator } from '@/components/ui/offline-indicator'

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  user: User | null
  isDemoMode: boolean
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Overview and analytics'
  },
  {
    name: 'Products',
    href: '/dashboard/products',
    icon: Package,
    description: 'Manage inventory'
  },
  {
    name: 'Sales',
    href: '/dashboard/sales',
    icon: ShoppingCart,
    description: 'Record transactions'
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
    description: 'Analytics and exports'
  },
  {
    name: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
    description: 'Customer management'
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Business configuration'
  }
]

const quickActions = [
  {
    name: 'Add Product',
    href: '/dashboard/products/new',
    icon: Package,
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    name: 'New Sale',
    href: '/dashboard/sales/new',
    icon: CreditCard,
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    name: 'Scan Barcode',
    href: '/dashboard/scanner',
    icon: Scan,
    color: 'bg-purple-500 hover:bg-purple-600'
  }
]

export default function Sidebar({ sidebarOpen, setSidebarOpen, user, isDemoMode }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between h-16 px-4 bg-blue-600 text-white">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 mr-2" />
              <h1 className="text-xl font-bold">InventoryPro</h1>
            </div>
            <button
              className="md:hidden p-1 rounded-md hover:bg-blue-700"
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User info */}
          <div className="px-4 py-3 bg-gray-50 border-b">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user ? user.email?.[0]?.toUpperCase() : 'D'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user ? user.email?.split('@')[0] : 'Demo User'}
                </p>
                <p className="text-xs text-gray-500">
                  {isDemoMode ? 'Demo Mode' : 'Retailer'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-3 border-b">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium text-white rounded-md transition-colors ${action.color} ${
                    isDemoMode ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={(e) => {
                    if (isDemoMode) {
                      e.preventDefault()
                      alert('Feature disabled in demo mode. Sign up to access full functionality!')
                    }
                  }}
                >
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname && (pathname === item.href || pathname.startsWith(item.href + '/'))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  <div>
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Offline Indicator */}
          <div className="px-4 py-3 border-t">
            <OfflineIndicator />
          </div>

          {/* Footer info */}
          <div className="px-4 py-3 border-t bg-gray-50">
            <div className="text-xs text-gray-500">
              <div className="flex items-center justify-between mb-1">
                <span>Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Made for</span>
                <span className="font-medium">🇮🇳 Indian Retailers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}