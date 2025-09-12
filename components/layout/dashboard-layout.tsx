'use client'

import { ReactNode, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { AuthForm } from '@/components/auth/auth-form'
import Sidebar from '@/components/layout/sidebar'
import { Loader2 } from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Check for demo mode
  const isDemoMode = useMemo(() => {
    return typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true'
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Allow access to dashboard even without authentication (demo mode)
  // if (!user) {
  //   return <AuthForm />
  // }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <Sidebar 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
          isDemoMode={isDemoMode}
        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center space-x-2">
            <h1 className="font-semibold text-lg">InventoryPro</h1>
          </div>
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}