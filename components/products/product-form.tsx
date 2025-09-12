'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().min(0, 'Quantity must be 0 or greater'),
  purchase_price: z.number().min(0, 'Purchase price must be 0 or greater'),
  selling_price: z.number().min(0, 'Selling price must be 0 or greater'),
  gst: z.number().min(0, 'GST must be 0 or greater').max(100, 'GST cannot exceed 100%'),
  supplier: z.string().optional(),
  low_stock_threshold: z.number().min(0, 'Low stock threshold must be 0 or greater'),
})

type ProductFormData = z.infer<typeof productSchema>

interface Product {
  id?: string
  name: string
  sku?: string | null
  category?: string | null
  quantity: number
  purchase_price: number
  selling_price: number
  gst: number
  supplier?: string | null
  low_stock_threshold: number
  created_at?: string
  updated_at?: string
}

interface ProductFormProps {
  product?: Product | null
  onClose: () => void
  onSuccess: () => void
}

const commonCategories = [
  'Electronics',
  'Clothing',
  'Food & Beverages',
  'Health & Beauty',
  'Home & Garden',
  'Books & Stationery',
  'Sports & Outdoors',
  'Toys & Games',
  'Automotive',
  'Other'
]

export function ProductForm({ product, onClose, onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [showCustomCategory, setShowCustomCategory] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      quantity: 0,
      purchase_price: 0,
      selling_price: 0,
      gst: 18, // Default GST rate in India
      supplier: '',
      low_stock_threshold: 10,
    }
  })

  const generateSKU = () => {
    const timestamp = Date.now()
    const randomNum = Math.floor(Math.random() * 1000)
    const sku = `SKU-${timestamp}-${randomNum}`
    setValue('sku', sku)
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    if (value === 'custom') {
      setShowCustomCategory(true)
      setValue('category', '')
    } else {
      setShowCustomCategory(false)
      setValue('category', value)
      setCustomCategory('')
    }
  }

  useEffect(() => {
    if (customCategory) {
      setValue('category', customCategory)
    }
  }, [customCategory, setValue])

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku || '',
        category: product.category || '',
        quantity: product.quantity,
        purchase_price: product.purchase_price,
        selling_price: product.selling_price,
        gst: product.gst,
        supplier: product.supplier || '',
        low_stock_threshold: product.low_stock_threshold,
      })
      
      if (product.category && commonCategories.includes(product.category)) {
        setSelectedCategory(product.category)
      } else if (product.category) {
        setSelectedCategory('custom')
        setCustomCategory(product.category)
        setShowCustomCategory(true)
      }
    }
  }, [product, reset])

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please sign in to add products')
        return
      }

      const productData = {
        ...data,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      let result
      if (product?.id) {
        // Update existing product
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .eq('user_id', user.id)
      } else {
        // Create new product
        result = await supabase
          .from('products')
          .insert([productData])
      }

      if (result.error) {
        throw result.error
      }

      alert(
        product ? 'Product updated successfully!' : 'Product added successfully!'
      )
      
      onSuccess()
    } catch (error: any) {
      console.error('Error saving product:', error)
      alert(
        error.message || 'Failed to save product. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            {product ? 'Update the product information below.' : 'Enter the product details below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="Enter product name"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU/Barcode</Label>
              <div className="flex gap-2">
                <Input
                  id="sku"
                  placeholder="Enter SKU"
                  {...register('sku')}
                />
                <Button type="button" variant="outline" onClick={generateSKU}>
                  Generate
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {commonCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Category</SelectItem>
              </SelectContent>
            </Select>
            
            {showCustomCategory && (
              <Input
                placeholder="Enter custom category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                placeholder="0"
                {...register('quantity', { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500">{errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_price">Purchase Price (₹) *</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('purchase_price', { valueAsNumber: true })}
              />
              {errors.purchase_price && (
                <p className="text-sm text-red-500">{errors.purchase_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="selling_price">Selling Price (₹) *</Label>
              <Input
                id="selling_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('selling_price', { valueAsNumber: true })}
              />
              {errors.selling_price && (
                <p className="text-sm text-red-500">{errors.selling_price.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gst">GST (%) *</Label>
              <Input
                id="gst"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="18"
                {...register('gst', { valueAsNumber: true })}
              />
              {errors.gst && (
                <p className="text-sm text-red-500">{errors.gst.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold">Low Stock Threshold *</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                min="0"
                placeholder="10"
                {...register('low_stock_threshold', { valueAsNumber: true })}
              />
              {errors.low_stock_threshold && (
                <p className="text-sm text-red-500">{errors.low_stock_threshold.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              placeholder="Enter supplier name"
              {...register('supplier')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}