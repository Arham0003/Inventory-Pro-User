'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Save, Package, Scan } from 'lucide-react'
import Link from 'next/link'

interface ProductForm {
  name: string
  sku: string
  category: string
  quantity: number
  purchase_price: number
  selling_price: number
  gst: number
  supplier: string
  low_stock_threshold: number
}

const categories = [
  'Groceries',
  'Beverages',
  'Snacks',
  'Personal Care',
  'Household',
  'Electronics',
  'Clothing',
  'Books',
  'Health & Medicine',
  'Others'
]

const gstRates = [0, 5, 12, 18, 28]

export default function ProductFormPage() {
  const router = useRouter()
  const params = useParams()
  const isEdit = params?.id && params.id !== 'new'
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDemoMode, setIsDemoMode] = useState(false)
  
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    purchase_price: 0,
    selling_price: 0,
    gst: 18,
    supplier: '',
    low_stock_threshold: 10
  })

  useEffect(() => {
    setIsDemoMode(localStorage.getItem('demo_mode') === 'true')
    
    if (isEdit) {
      loadProduct()
    } else {
      generateSKU()
    }
  }, [isEdit])

  const loadProduct = async () => {
    if (isDemoMode || localStorage.getItem('demo_mode') === 'true') {
      // Load demo data for editing
      setFormData({
        name: 'Demo Product',
        sku: 'DEMO-001',
        category: 'Groceries',
        quantity: 25,
        purchase_price: 100,
        selling_price: 120,
        gst: 18,
        supplier: 'Demo Supplier',
        low_stock_threshold: 10
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', Array.isArray(params.id) ? params.id[0] : params.id)
        .single()

      if (error) {
        console.error('Error loading product:', error)
        router.push('/dashboard/products')
        return
      }

      setFormData({
        name: data.name || '',
        sku: data.sku || '',
        category: data.category || '',
        quantity: data.quantity || 0,
        purchase_price: data.purchase_price || 0,
        selling_price: data.selling_price || 0,
        gst: data.gst || 18,
        supplier: data.supplier || '',
        low_stock_threshold: data.low_stock_threshold || 10
      })
    } catch (error) {
      console.error('Error loading product:', error)
      router.push('/dashboard/products')
    } finally {
      setLoading(false)
    }
  }

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6)
    setFormData(prev => ({
      ...prev,
      sku: `PRD-${timestamp}`
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative'
    }

    if (formData.purchase_price <= 0) {
      newErrors.purchase_price = 'Purchase price must be greater than 0'
    }

    if (formData.selling_price <= 0) {
      newErrors.selling_price = 'Selling price must be greater than 0'
    }

    if (formData.selling_price < formData.purchase_price) {
      newErrors.selling_price = 'Selling price should be greater than purchase price'
    }

    if (formData.low_stock_threshold < 0) {
      newErrors.low_stock_threshold = 'Low stock threshold cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isDemoMode || localStorage.getItem('demo_mode') === 'true') {
      alert('Save functionality is disabled in demo mode. Sign up to manage your real inventory!')
      return
    }

    if (!validateForm()) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to save products')
        return
      }

      const productData = {
        ...formData,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      if (isEdit) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', Array.isArray(params.id) ? params.id[0] : params.id)

        if (error) {
          console.error('Error updating product:', error)
          alert('Error updating product: ' + error.message)
          return
        }
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            ...productData,
            created_at: new Date().toISOString()
          }])

        if (error) {
          console.error('Error creating product:', error)
          alert('Error creating product: ' + error.message)
          return
        }
      }

      router.push('/dashboard/products')
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Error saving product')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof ProductForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const calculateProfit = () => {
    const profit = formData.selling_price - formData.purchase_price
    const profitPercentage = formData.purchase_price > 0 ? (profit / formData.purchase_price) * 100 : 0
    return { profit, profitPercentage }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const { profit, profitPercentage } = calculateProfit()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard/products"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Products
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-gray-600">
              {isEdit ? 'Update product details' : 'Add a new product to your inventory'}
            </p>
          </div>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {(isDemoMode || localStorage.getItem('demo_mode') === 'true') && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <Package className="h-5 w-5 text-orange-600 mr-2" />
            <p className="text-orange-800">
              <strong>Demo Mode:</strong> Product management is disabled. Sign up to add and edit your real inventory!
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter product name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU *
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  className={`flex-1 border rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.sku ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Product SKU"
                />
                <button
                  type="button"
                  onClick={generateSKU}
                  className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                >
                  <Scan className="h-4 w-4" />
                </button>
              </div>
              {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Supplier name"
              />
            </div>
          </div>
        </div>

        {/* Inventory & Pricing */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory & Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Stock *
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Low Stock Threshold *
              </label>
              <input
                type="number"
                min="0"
                value={formData.low_stock_threshold}
                onChange={(e) => handleInputChange('low_stock_threshold', parseInt(e.target.value) || 0)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.low_stock_threshold ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="10"
              />
              {errors.low_stock_threshold && <p className="text-red-500 text-sm mt-1">{errors.low_stock_threshold}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Rate (%) *
              </label>
              <select
                value={formData.gst}
                onChange={(e) => handleInputChange('gst', parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {gstRates.map(rate => (
                  <option key={rate} value={rate}>{rate}%</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => handleInputChange('purchase_price', parseFloat(e.target.value) || 0)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.purchase_price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.purchase_price && <p className="text-red-500 text-sm mt-1">{errors.purchase_price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.selling_price}
                onChange={(e) => handleInputChange('selling_price', parseFloat(e.target.value) || 0)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.selling_price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.selling_price && <p className="text-red-500 text-sm mt-1">{errors.selling_price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profit Analysis
              </label>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-sm">
                  <span className="font-medium">Profit: </span>
                  <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ₹{profit.toFixed(2)} ({profitPercentage.toFixed(1)}%)
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/dashboard/products"
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  )
}