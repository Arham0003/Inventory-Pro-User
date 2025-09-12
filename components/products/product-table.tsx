'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit2, Trash2, AlertTriangle, Package, Eye } from 'lucide-react'
import { ProductForm } from './product-form'

interface Product {
  id: string
  name: string
  sku?: string | null
  category?: string | null
  quantity: number
  purchase_price: number
  selling_price: number
  gst: number
  supplier?: string | null
  low_stock_threshold: number
  created_at: string
  updated_at: string
}

interface ProductTableProps {
  products: Product[]
  loading: boolean
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onRefresh: () => void
}

export function ProductTable({ products, loading, onEdit, onDelete, onRefresh }: ProductTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [viewProduct, setViewProduct] = useState<Product | null>(null)

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setShowEditForm(true)
  }

  const handleCloseForm = () => {
    setShowEditForm(false)
    setSelectedProduct(null)
  }

  const handleFormSuccess = () => {
    handleCloseForm()
    onRefresh()
  }

  const handleView = (product: Product) => {
    setViewProduct(product)
  }

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) {
      return { text: 'Out of Stock', variant: 'destructive' as const }
    } else if (quantity <= threshold) {
      return { text: 'Low Stock', variant: 'secondary' as const }
    } else {
      return { text: 'In Stock', variant: 'default' as const }
    }
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="rounded-md border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-500 mb-4">Get started by adding your first product.</p>
      </div>
    )
  }

  return (
    <>
      <div className="w-full">
        <div className="rounded-md border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => {
                const stockStatus = getStockStatus(product.quantity, product.low_stock_threshold)
                const margin = ((product.selling_price - product.purchase_price) / product.purchase_price * 100).toFixed(1)
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        {product.supplier && (
                          <div className="text-sm text-gray-500">Supplier: {product.supplier}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-mono text-sm">{product.sku || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.category ? (
                        <Badge variant="outline">{product.category}</Badge>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Badge variant={stockStatus.variant}>
                          {stockStatus.text}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {product.quantity} units
                        </span>
                        {product.quantity <= product.low_stock_threshold && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.purchase_price)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.selling_price)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        parseFloat(margin) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {margin}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(product)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showEditForm && (
        <ProductForm
          product={selectedProduct}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {viewProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Product Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewProduct(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Name:</span> {viewProduct.name}
              </div>
              <div>
                <span className="font-medium">SKU:</span> {viewProduct.sku || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Category:</span> {viewProduct.category || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Quantity:</span> {viewProduct.quantity}
              </div>
              <div>
                <span className="font-medium">Purchase Price:</span> {formatCurrency(viewProduct.purchase_price)}
              </div>
              <div>
                <span className="font-medium">Selling Price:</span> {formatCurrency(viewProduct.selling_price)}
              </div>
              <div>
                <span className="font-medium">GST:</span> {viewProduct.gst}%
              </div>
              <div>
                <span className="font-medium">Supplier:</span> {viewProduct.supplier || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Low Stock Threshold:</span> {viewProduct.low_stock_threshold}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}