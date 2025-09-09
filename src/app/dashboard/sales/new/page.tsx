'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  ShoppingCart, 
  User, 
  CreditCard,
  Receipt,
  Search,
  Trash2,
  Calculator,
  Save,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  sku: string | null
  selling_price: number
  gst: number
  quantity: number
}

interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  total: number
  gstAmount: number
}

interface CustomerInfo {
  name: string
  phone: string
  email: string
}

export default function NewSalePage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [customer, setCustomer] = useState<CustomerInfo>({ name: '', phone: '', email: '' })
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discount, setDiscount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    setIsDemoMode(localStorage.getItem('demo_mode') === 'true')
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      if (isDemoMode || localStorage.getItem('demo_mode') === 'true') {
        setProducts(getDemoProducts())
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProducts(getDemoProducts())
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .gt('quantity', 0) // Only show products in stock
        .order('name')

      if (error) {
        console.error('Error fetching products:', error)
        setProducts(getDemoProducts())
      } else {
        setProducts(data || [])
      }
    } catch (error) {
      console.error('Error loading products:', error)
      setProducts(getDemoProducts())
    } finally {
      setLoading(false)
    }
  }

  const getDemoProducts = (): Product[] => [
    {
      id: '1',
      name: 'Basmati Rice 5kg',
      sku: 'RICE-5KG-001',
      selling_price: 500,
      gst: 5,
      quantity: 45
    },
    {
      id: '2',
      name: 'Cooking Oil 1L',
      sku: 'OIL-1L-002',
      selling_price: 150,
      gst: 5,
      quantity: 28
    },
    {
      id: '3',
      name: 'Wheat Flour 2kg',
      sku: 'FLOUR-2KG-003',
      selling_price: 100,
      gst: 5,
      quantity: 25
    },
    {
      id: '4',
      name: 'Sugar 1kg',
      sku: 'SUGAR-1KG-004',
      selling_price: 50,
      gst: 5,
      quantity: 15
    },
    {
      id: '5',
      name: 'Tea Pack 250g',
      sku: 'TEA-250G-005',
      selling_price: 200,
      gst: 12,
      quantity: 18
    }
  ]

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id)
    
    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        updateCartItemQuantity(product.id, existingItem.quantity + 1)
      } else {
        alert('Not enough stock available')
      }
    } else {
      const unitPrice = product.selling_price
      const gstAmount = (unitPrice * product.gst) / 100
      const total = unitPrice + gstAmount
      
      setCart([...cart, {
        product,
        quantity: 1,
        unitPrice,
        total,
        gstAmount
      }])
    }
  }

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const unitPrice = item.product.selling_price
        const gstAmount = (unitPrice * item.product.gst) / 100 * newQuantity
        const total = (unitPrice + (unitPrice * item.product.gst) / 100) * newQuantity
        
        return {
          ...item,
          quantity: newQuantity,
          total,
          gstAmount
        }
      }
      return item
    }))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    const totalGST = cart.reduce((sum, item) => sum + item.gstAmount, 0)
    const discountAmount = (subtotal * discount) / 100
    const finalTotal = subtotal + totalGST - discountAmount
    
    return { subtotal, totalGST, discountAmount, finalTotal }
  }

  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString().slice(-6)
    return `INV-${timestamp}`
  }

  const completeSale = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart')
      return
    }

    if (!customer.name) {
      alert('Please enter customer name')
      return
    }

    if (isDemoMode || localStorage.getItem('demo_mode') === 'true') {
      alert('Sales functionality is disabled in demo mode. Sign up to record real sales!')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to record sales')
        return
      }

      const { finalTotal, totalGST } = calculateTotals()
      const invoiceNumber = generateInvoiceNumber()

      // Create sales records for each cart item
      for (const item of cart) {
        const { error: salesError } = await supabase
          .from('sales')
          .insert([{
            user_id: user.id,
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.total,
            gst_amount: item.gstAmount,
            invoice_number: invoiceNumber,
            customer_name: customer.name,
            customer_phone: customer.phone,
            payment_method: paymentMethod
          }])

        if (salesError) {
          console.error('Error creating sale:', salesError)
          alert('Error recording sale: ' + salesError.message)
          return
        }

        // Update product quantity
        const { error: updateError } = await supabase
          .from('products')
          .update({
            quantity: item.product.quantity - item.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.product.id)

        if (updateError) {
          console.error('Error updating product quantity:', updateError)
        }
      }

      // Reset form
      setCart([])
      setCustomer({ name: '', phone: '', email: '' })
      setDiscount(0)
      loadProducts() // Refresh product quantities

      alert(`Sale completed successfully! Invoice: ${invoiceNumber}`)
      router.push('/dashboard/sales')
    } catch (error) {
      console.error('Error completing sale:', error)
      alert('Error completing sale')
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const { subtotal, totalGST, discountAmount, finalTotal } = calculateTotals()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard/sales"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Sales
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Sale - Point of Sale</h1>
            <p className="text-gray-600">Add products to cart and complete the transaction</p>
          </div>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {(isDemoMode || localStorage.getItem('demo_mode') === 'true') && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <p className="text-orange-800">
              <strong>Demo Mode:</strong> Sales recording is disabled. Sign up to record real sales and generate invoices!
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Search */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer"
                  onClick={() => addToCart(product)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                      <p className="text-lg font-bold text-green-600 mt-1">
                        {formatCurrency(product.selling_price)}
                      </p>
                      <p className="text-xs text-gray-500">GST: {product.gst}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Stock: {product.quantity}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          addToCart(product)
                        }}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <p className="text-center text-gray-500 py-8">No products found</p>
            )}
          </div>
        </div>

        {/* Cart and Checkout Section */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) => setCustomer({...customer, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={customer.phone}
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Shopping Cart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Shopping Cart ({cart.length})
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.product.name}</h4>
                    <p className="text-xs text-gray-500">{formatCurrency(item.unitPrice)} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 rounded-md bg-red-100 hover:bg-red-200 text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-medium text-sm">{formatCurrency(item.total)}</p>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <p className="text-center text-gray-500 py-4">Cart is empty</p>
              )}
            </div>
          </div>

          {/* Payment and Total */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Payment & Total
            </h2>
            
            {/* Discount */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>GST:</span>
                <span>{formatCurrency(totalGST)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({discount}%):</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={completeSale}
              disabled={saving || cart.length === 0 || !customer.name}
              className="w-full mt-4 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Receipt className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}