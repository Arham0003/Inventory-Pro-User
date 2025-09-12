'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Save, 
  Settings as SettingsIcon, 
  Building, 
  Percent, 
  CreditCard,
  Bell,
  User,
  Shield,
  Database,
  AlertTriangle
} from 'lucide-react'

interface BusinessSettings {
  business_name: string
  business_address: string
  business_phone: string
  currency: string
  gst_enabled: boolean
  default_gst_rate: number
}

interface UserProfile {
  full_name: string
  email: string
}

export default function SettingsPage() {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    business_name: '',
    business_address: '',
    business_phone: '',
    currency: 'INR',
    gst_enabled: true,
    default_gst_rate: 18.0
  })

  const [userProfile, setUserProfile] = useState<UserProfile>({
    full_name: '',
    email: ''
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('business')
  const [isDemoMode, setIsDemoMode] = useState(false)

  const loadSettings = useCallback(async () => {
    try {
      if (isDemoMode || localStorage.getItem('demo_mode') === 'true') {
        setBusinessSettings({
          business_name: 'Demo Retail Store',
          business_address: '123 Main Street, Mumbai, Maharashtra 400001',
          business_phone: '+91 98765 43210',
          currency: 'INR',
          gst_enabled: true,
          default_gst_rate: 18.0
        })
        setUserProfile({
          full_name: 'Demo User',
          email: 'demo@example.com'
        })
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setUserProfile({
          full_name: profileData.full_name || '',
          email: profileData.email || user.email || ''
        })
      }

      // Load business settings from profiles
      const { data: settingsData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (settingsData) {
        setBusinessSettings({
          business_name: settingsData.business_name || '',
          business_address: settingsData.business_address || '',
          business_phone: settingsData.business_phone || '',
          currency: 'INR', // Default currency
          gst_enabled: true, // Default GST enabled
          default_gst_rate: 18.0 // Default GST rate
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }, [isDemoMode])

  useEffect(() => {
    setIsDemoMode(localStorage.getItem('demo_mode') === 'true')
    loadSettings()
  }, [loadSettings])

  const saveBusinessSettings = async () => {
    if (isDemoMode || localStorage.getItem('demo_mode') === 'true') {
      alert('Settings cannot be saved in demo mode. Sign up to configure your business settings!')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to save settings')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: businessSettings.business_name,
          business_address: businessSettings.business_address,
          business_phone: businessSettings.business_phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error saving settings:', error)
        alert('Error saving settings: ' + error.message)
        return
      }

      alert('Business settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const saveUserProfile = async () => {
    if (isDemoMode || localStorage.getItem('demo_mode') === 'true') {
      alert('Profile cannot be updated in demo mode. Sign up to manage your profile!')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to update profile')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userProfile.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating profile:', error)
        alert('Error updating profile: ' + error.message)
        return
      }

      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const exportData = async () => {
    if (isDemoMode || localStorage.getItem('demo_mode') === 'true') {
      alert('Data export is not available in demo mode. Sign up to export your data!')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to export data')
        return
      }

      // Fetch all user data
      const [productsData, salesData] = await Promise.all([
        supabase.from('products').select('*').eq('user_id', user.id),
        supabase.from('sales').select('*').eq('user_id', user.id)
      ])

      const exportData = {
        products: productsData.data || [],
        sales: salesData.data || [],
        settings: businessSettings,
        profile: userProfile,
        exported_at: new Date().toISOString()
      }

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventory-data-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)

      alert('Data exported successfully!')
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Error exporting data')
    }
  }

  const clearData = async () => {
    if (isDemoMode || localStorage.getItem('demo_mode') === 'true') {
      alert('Data cannot be cleared in demo mode!')
      return
    }

    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to clear data')
        return
      }

      // Clear sales and products data
      await Promise.all([
        supabase.from('sales').delete().eq('user_id', user.id),
        supabase.from('products').delete().eq('user_id', user.id)
      ])

      alert('All data cleared successfully!')
      window.location.reload()
    } catch (error) {
      console.error('Error clearing data:', error)
      alert('Error clearing data')
    }
  }

  const tabs = [
    { id: 'business', name: 'Business', icon: Building },
    { id: 'tax', name: 'Tax & GST', icon: Percent },
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'data', name: 'Data', icon: Database }
  ]

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
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your business settings and preferences</p>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {(isDemoMode || localStorage.getItem('demo_mode') === 'true') && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <p className="text-orange-800">
              <strong>Demo Mode:</strong> Settings cannot be saved. Sign up to configure your business settings!
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={businessSettings.business_name}
                      onChange={(e) => setBusinessSettings({...businessSettings, business_name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your Business Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={businessSettings.business_phone}
                      onChange={(e) => setBusinessSettings({...businessSettings, business_phone: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address
                  </label>
                  <textarea
                    value={businessSettings.business_address}
                    onChange={(e) => setBusinessSettings({...businessSettings, business_address: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Complete business address"
                  />
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={businessSettings.currency}
                    onChange={(e) => setBusinessSettings({...businessSettings, currency: e.target.value})}
                    className="w-full md:w-48 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={saveBusinessSettings}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Business Settings
                </button>
              </div>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax & GST Configuration</h2>
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="gst_enabled"
                      checked={businessSettings.gst_enabled}
                      onChange={(e) => setBusinessSettings({...businessSettings, gst_enabled: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="gst_enabled" className="text-sm font-medium text-gray-700">
                      Enable GST calculations
                    </label>
                  </div>
                  {businessSettings.gst_enabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default GST Rate (%)
                      </label>
                      <select
                        value={businessSettings.default_gst_rate}
                        onChange={(e) => setBusinessSettings({...businessSettings, default_gst_rate: parseFloat(e.target.value)})}
                        className="w-full md:w-48 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </div>
                  )}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">GST Information</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• GST rates in India: 0%, 5%, 12%, 18%, 28%</li>
                      <li>• Essential items: 0% or 5%</li>
                      <li>• Most goods and services: 18%</li>
                      <li>• Luxury items: 28%</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={saveBusinessSettings}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Tax Settings
                </button>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">User Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={userProfile.full_name}
                      onChange={(e) => setUserProfile({...userProfile, full_name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={userProfile.email}
                      disabled
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                      placeholder="your@email.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={saveUserProfile}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Update Profile
                </button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-medium text-green-900 mb-2">Export Data</h3>
                    <p className="text-sm text-green-800 mb-4">
                      Download all your business data including products, sales, and settings as a backup.
                    </p>
                    <button
                      onClick={exportData}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Export All Data
                    </button>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-medium text-red-900 mb-2">Clear All Data</h3>
                    <p className="text-sm text-red-800 mb-4">
                      <strong>Warning:</strong> This will permanently delete all your products, sales, and transaction data. This action cannot be undone.
                    </p>
                    <button
                      onClick={clearData}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Clear All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}