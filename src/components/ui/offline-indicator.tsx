'use client'

import { useState, useEffect } from 'react'
import { syncManager } from '@/lib/offline/sync'
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react'

export function OfflineIndicator() {
  const [syncStatus, setSyncStatus] = useState<{
    isOnline: boolean
    pendingItems: number
    lastSync: string | null
  }>({
    isOnline: false,
    pendingItems: 0,
    lastSync: null
  })
  const [syncing, setSyncing] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Only proceed if we're on the client side and syncManager is available
    if (typeof window !== 'undefined' && syncManager) {
      setSyncStatus(prev => ({ ...prev, isOnline: navigator.onLine }))
      
      const updateStatus = async () => {
        try {
          if (syncManager) {
            const status = await syncManager.getSyncStatus()
            setSyncStatus(status)
          }
        } catch (error) {
          console.error('Error getting sync status:', error)
        }
      }

      updateStatus()
      
      // Update status every 5 seconds
      const interval = setInterval(updateStatus, 5000)
      
      // Listen for online/offline events
      const handleOnline = () => updateStatus()
      const handleOffline = () => updateStatus()
      
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        clearInterval(interval)
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  const handleSync = async () => {
    if (!syncStatus.isOnline || syncing || !syncManager) return
    
    setSyncing(true)
    try {
      await syncManager.forcSync()
      if (syncManager) {
        const newStatus = await syncManager.getSyncStatus()
        setSyncStatus(newStatus)
      }
    } catch (error) {
      console.error('Manual sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'text-red-600 bg-red-50 border-red-200'
    if (syncStatus.pendingItems > 0) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline Mode'
    if (syncStatus.pendingItems > 0) return `${syncStatus.pendingItems} items to sync`
    return 'All data synced'
  }

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) return WifiOff
    if (syncStatus.pendingItems > 0) return AlertCircle
    return Wifi
  }

  const StatusIcon = getStatusIcon()

  // Don't render anything during SSR
  if (!isClient) {
    return null
  }

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm ${getStatusColor()}`}>
      <StatusIcon className="h-4 w-4" />
      <span className="font-medium">{getStatusText()}</span>
      
      {syncStatus.isOnline && syncStatus.pendingItems > 0 && (
        <button
          onClick={handleSync}
          disabled={syncing}
          className="ml-2 p-1 rounded hover:bg-white/20 disabled:opacity-50"
          title="Sync now"
        >
          <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      )}
      
      {syncStatus.lastSync && (
        <span className="text-xs opacity-75">
          Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}