'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { downloadSampleCSV } from '@/lib/utils/csv-utils'
import { Button } from '@/components/ui/button'
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CSVProduct {
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

interface ImportResult {
  success: CSVProduct[]
  errors: { row: number; product: Partial<CSVProduct>; error: string }[]
  total: number
}

interface CSVImportProps {
  onImportComplete?: () => void
}

export function CSVImport({ onImportComplete }: CSVImportProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showResults, setShowResults] = useState(false)

  // CSV template structure
  const csvTemplate = [
    {
      name: 'Product Name*',
      sku: 'SKU/Barcode',
      category: 'Category',
      quantity: 'Quantity*',
      purchase_price: 'Purchase Price*',
      selling_price: 'Selling Price*',
      gst: 'GST Rate (%)',
      supplier: 'Supplier',
      low_stock_threshold: 'Low Stock Alert'
    },
    {
      name: 'Basmati Rice 5kg',
      sku: 'RICE-5KG-001',
      category: 'Groceries',
      quantity: 50,
      purchase_price: 400.00,
      selling_price: 500.00,
      gst: 5,
      supplier: 'Local Supplier',
      low_stock_threshold: 10
    },
    {
      name: 'Cooking Oil 1L',
      sku: 'OIL-1L-002',
      category: 'Groceries',
      quantity: 25,
      purchase_price: 120.00,
      selling_price: 150.00,
      gst: 5,
      supplier: 'Oil Company',
      low_stock_threshold: 15
    }
  ]

  const downloadTemplate = () => {
    downloadSampleCSV()
  }

  const parseCSV = (csvText: string): CSVProduct[] => {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row')
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const products: CSVProduct[] = []

    // Expected headers mapping
    const headerMap: Record<string, keyof CSVProduct> = {
      'product name': 'name',
      'name': 'name',
      'sku': 'sku',
      'sku/barcode': 'sku',
      'barcode': 'sku',
      'category': 'category',
      'quantity': 'quantity',
      'stock': 'quantity',
      'purchase price': 'purchase_price',
      'cost price': 'purchase_price',
      'selling price': 'selling_price',
      'sale price': 'selling_price',
      'gst': 'gst',
      'gst rate': 'gst',
      'gst rate (%)': 'gst',
      'supplier': 'supplier',
      'vendor': 'supplier',
      'low stock threshold': 'low_stock_threshold',
      'low stock alert': 'low_stock_threshold',
      'minimum stock': 'low_stock_threshold'
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const product: Partial<CSVProduct> = {}

      headers.forEach((header, index) => {
        const cleanHeader = header.replace(/[*]/g, '').trim()
        const fieldName = headerMap[cleanHeader]
        if (fieldName && values[index]) {
          const value = values[index].replace(/['"]/g, '')
          
          if (['quantity', 'purchase_price', 'selling_price', 'gst', 'low_stock_threshold'].includes(fieldName)) {
            (product as any)[fieldName] = parseFloat(value) || 0
          } else {
            (product as any)[fieldName] = value
          }
        }
      })

      if (product.name) {
        products.push(product as CSVProduct)
      }
    }

    return products
  }

  const validateProduct = (product: CSVProduct, rowIndex: number): string | null => {
    if (!product.name?.trim()) {
      return 'Product name is required'
    }
    if (product.quantity < 0) {
      return 'Quantity cannot be negative'
    }
    if (product.purchase_price <= 0) {
      return 'Purchase price must be greater than 0'
    }
    if (product.selling_price <= 0) {
      return 'Selling price must be greater than 0'
    }
    if (product.gst < 0 || product.gst > 100) {
      return 'GST rate must be between 0 and 100'
    }
    if (product.low_stock_threshold < 0) {
      return 'Low stock threshold cannot be negative'
    }
    return null
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const csvText = await file.text()
      const products = parseCSV(csvText)
      
      const result: ImportResult = {
        success: [],
        errors: [],
        total: products.length
      }

      // Validate and prepare products for import
      const validProducts: any[] = []
      
      products.forEach((product, index) => {
        const error = validateProduct(product, index + 2) // +2 for header and 0-index
        
        if (error) {
          result.errors.push({
            row: index + 2,
            product,
            error
          })
        } else {
          const productData = {
            name: product.name,
            sku: product.sku || '',
            category: product.category || '',
            quantity: product.quantity,
            purchase_price: product.purchase_price,
            selling_price: product.selling_price,
            gst: product.gst || 18,
            supplier: product.supplier || '',
            low_stock_threshold: product.low_stock_threshold || 10,
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          validProducts.push(productData)
          result.success.push(product)
        }
      })

      // Import valid products to database
      if (validProducts.length > 0) {
        const { error } = await (supabase as any)
          .from('products')
          .insert(validProducts)

        if (error) {
          throw new Error('Database import failed: ' + error.message)
        }
      }

      setImportResult(result)
      setShowResults(true)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Call completion callback
      if (onImportComplete) {
        onImportComplete()
      }

    } catch (error: any) {
      console.error('Import failed:', error)
      alert('Import failed: ' + error.message)
    } finally {
      setImporting(false)
    }
  }

  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true'

  return (
    <>
      <div className="space-y-4">
        {/* Template Download */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-blue-800 font-semibold">CSV Template</h3>
              <p className="text-blue-700 text-sm mt-1">
                Download the template file to see the required format and example data.
              </p>
              <Button
                onClick={downloadTemplate}
                variant="outline"
                size="sm"
                className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>
        </div>

        {/* CSV Import */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Upload className="h-5 w-5 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold">Import Products from CSV</h3>
              <p className="text-gray-600 text-sm mt-1">
                Upload a CSV file with your product data. Make sure to follow the template format.
              </p>
              
              <div className="mt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={importing || isDemoMode}
                  className="hidden"
                />
                <Button
                  onClick={() => {
                    if (isDemoMode) {
                      alert('CSV import is disabled in demo mode. Sign up to access full features!')
                      return
                    }
                    fileInputRef.current?.click()
                  }}
                  disabled={importing || isDemoMode}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose CSV File
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CSV Format Guidelines */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3">CSV Format Guidelines</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <div><strong>Required Fields:</strong> Product Name, Quantity, Purchase Price, Selling Price</div>
            <div><strong>Optional Fields:</strong> SKU, Category, GST Rate, Supplier, Low Stock Threshold</div>
            <div><strong>Number Format:</strong> Use decimal points (e.g., 123.45) for prices</div>
            <div><strong>Text Format:</strong> Avoid commas in text fields or wrap with quotes</div>
            <div><strong>File Size:</strong> Maximum 1000 products per import</div>
          </div>
        </div>

        {isDemoMode && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
              <p className="text-orange-800">
                <strong>Demo Mode:</strong> CSV import is disabled. Sign up to import your product data!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Import Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Results</DialogTitle>
            <DialogDescription>
              Summary of the CSV import process
            </DialogDescription>
          </DialogHeader>

          {importResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-green-800">
                    {importResult.success.length}
                  </div>
                  <div className="text-sm text-green-700">Successful</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-red-800">
                    {importResult.errors.length}
                  </div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <FileText className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-blue-800">
                    {importResult.total}
                  </div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-800 mb-2">Import Errors</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="text-sm mb-2 last:mb-0">
                        <span className="font-medium">Row {error.row}:</span> {error.error}
                        <br />
                        <span className="text-gray-600">Product: {error.product.name || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success message */}
              {importResult.success.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm">
                    ✅ Successfully imported {importResult.success.length} products to your inventory.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}