'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import {
  Package,
  Search,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react'

export default function ProductsDemo() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')

  const demoProducts = [
    {
      id: '1',
      name: 'Wireless Earbuds',
      sku: 'WE-001',
      category: 'Electronics',
      quantity: 25,
      purchasePrice: 800,
      sellingPrice: 1200,
      gst: 18,
      supplier: 'Tech Supplier',
      lowStockThreshold: 10
    },
    {
      id: '2',
      name: 'Bluetooth Speaker',
      sku: 'BS-002',
      category: 'Electronics',
      quantity: 15,
      purchasePrice: 1500,
      sellingPrice: 2200,
      gst: 18,
      supplier: 'Audio Corp',
      lowStockThreshold: 5
    },
    {
      id: '3',
      name: 'Phone Case',
      sku: 'PC-003',
      category: 'Accessories',
      quantity: 3,
      purchasePrice: 150,
      sellingPrice: 300,
      gst: 18,
      supplier: 'Case Co',
      lowStockThreshold: 10
    },
    {
      id: '4',
      name: 'USB Cable',
      sku: 'UC-004',
      category: 'Accessories',
      quantity: 50,
      purchasePrice: 80,
      sellingPrice: 150,
      gst: 18,
      supplier: 'Cable Inc',
      lowStockThreshold: 20
    },
    {
      id: '5',
      name: 'Power Bank',
      sku: 'PB-005',
      category: 'Electronics',
      quantity: 8,
      purchasePrice: 1200,
      sellingPrice: 1800,
      gst: 18,
      supplier: 'Power Tech',
      lowStockThreshold: 5
    }
  ]

  const filteredProducts = demoProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const handleAction = (action: string) => {
    alert(`This is demo mode. ${action} is disabled.`)
  }

  const lowStockProducts = filteredProducts.filter(p => p.quantity <= p.lowStockThreshold)
  const totalValue = filteredProducts.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                <p className="text-muted-foreground">
                  Demo Mode - Manage your inventory and product catalog
                </p>
              </div>
            </div>
          </div>
          <Button onClick={() => handleAction('Adding products')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Demo Banner */}
        <Card className="border-orange-200 bg-orange-50 mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Demo Mode Active</span>
              <span className="text-sm">- Product modifications are disabled</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredProducts.length}</div>
              <p className="text-xs text-muted-foreground">
                {filteredProducts.reduce((sum, p) => sum + p.quantity, 0)} units in stock
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                Inventory value at cost
              </p>
            </CardContent>
          </Card>
          
          <Card className={lowStockProducts.length > 0 ? 'border-orange-200' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${lowStockProducts.length > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${lowStockProducts.length > 0 ? 'text-orange-600' : ''}`}>
                {lowStockProducts.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Products need restocking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Catalog</CardTitle>
            <CardDescription>
              Manage your inventory with detailed product information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Product</th>
                    <th className="text-left p-2">SKU</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-right p-2">Stock</th>
                    <th className="text-right p-2">Purchase Price</th>
                    <th className="text-right p-2">Selling Price</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Supplier: {product.supplier}
                            </p>
                          </div>
                          {product.quantity <= product.lowStockThreshold && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              Low Stock
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-2 font-mono text-sm">{product.sku}</td>
                      <td className="p-2">
                        <Badge variant="secondary">{product.category}</Badge>
                      </td>
                      <td className="p-2 text-right">
                        <span className={product.quantity <= product.lowStockThreshold ? 'text-orange-600 font-medium' : ''}>
                          {product.quantity}
                        </span>
                      </td>
                      <td className="p-2 text-right">{formatCurrency(product.purchasePrice)}</td>
                      <td className="p-2 text-right">{formatCurrency(product.sellingPrice)}</td>
                      <td className="p-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleAction('Editing products')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleAction('Deleting products')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No products found matching your search.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}