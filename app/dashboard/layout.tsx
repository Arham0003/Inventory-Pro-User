'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '@/components/layout/sidebar'
import { MobileHeader } from '@/components/ui/mobile-header'
import { PageTransition } from '@/components/ui/page-transition'
import { Loading } from '@/components/ui/loading'
import { NotificationCenter } from '@/components/ui/notification-center'
import { User } from '@supabase/supabase-js'
import { syncManager } from '@/lib/offline/sync'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  // Memoize demo mode check
  const isDemoMode = useMemo(() => {
    return !user && typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true'
  }, [user])

  // Optimized user initialization
  const initializeUser = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        const demoMode = typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true'
        if (!demoMode) {
          router.push('/')
          return
        }
      } else {
        // Initialize offline data for authenticated users (non-blocking)
        if (syncManager) {
          syncManager.initializeOfflineData(currentUser.id).catch(error => {
            console.error('Failed to initialize offline data:', error)
          })
        }
      }
      
      setUser(currentUser)
    } catch (error) {
      console.error('Error getting user:', error)
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
  }, [router])

  useEffect(() => {
    initializeUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        const demoMode = typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true'
        if (!demoMode) {
          router.push('/')
        } else {
          setUser(null)
        }
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [initializeUser, router])

  // Optimized loading state
  if (loading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loading type="spinner" size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        user={user}
        isDemoMode={isDemoMode}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:block bg-white shadow-sm border-b border-gray-200 transition-all duration-200">
          <div className="flex items-center justify-between px-4 py-3">
            {isDemoMode && (
              <div className="bg-gradient-to-r from-orange-100 to-yellow-100 border border-orange-300 text-orange-800 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                🚀 Demo Mode - Explore Features
              </div>
            )}
            
            <div className="flex items-center space-x-4 ml-auto">
              {/* Notification Center */}
              <NotificationCenter isDemoMode={isDemoMode} />
              
              <span className="text-sm text-gray-600 transition-colors duration-200 hover:text-gray-900">
                {user ? user.email : 'Demo User'}
              </span>
              <button
                onClick={async () => {
                  if (user) {
                    await supabase.auth.signOut()
                  } else {
                    localStorage.removeItem('demo_mode')
                    router.push('/')
                  }
                }}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100 transition-all duration-200"
              >
                {user ? 'Sign Out' : 'Exit Demo'}
              </button>
            </div>
          </div>
        </header>
        
        {/* Mobile Header */}
        <MobileHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        {/* Main content with page transitions */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-3 md:px-6 py-4 md:py-6 max-w-7xl">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  )
}