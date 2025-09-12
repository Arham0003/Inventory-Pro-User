// Utility functions for CSV operations
export interface CSVProduct {
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

export const generateSampleCSV = (): string => {
  const headers = [
    'Product Name*',
    'SKU/Barcode',
    'Category',
    'Quantity*',
    'Purchase Price*',
    'Selling Price*',
    'GST Rate (%)',
    'Supplier',
    'Low Stock Alert'
  ]

  const sampleData = [
    [
      'Basmati Rice 5kg',
      'RICE-5KG-001',
      'Groceries',
      '50',
      '400.00',
      '500.00',
      '5',
      'Local Supplier',
      '10'
    ],
    [
      'Cooking Oil 1L',
      'OIL-1L-002',
      'Groceries',
      '25',
      '120.00',
      '150.00',
      '5',
      'Oil Company',
      '15'
    ],
    [
      'Wheat Flour 2kg',
      'FLOUR-2KG-003',
      'Groceries',
      '30',
      '80.00',
      '100.00',
      '5',
      'Flour Mill',
      '20'
    ],
    [
      'Sugar 1kg',
      'SUGAR-1KG-004',
      'Groceries',
      '40',
      '45.00',
      '50.00',
      '5',
      'Sugar Factory',
      '12'
    ],
    [
      'Tea Pack 250g',
      'TEA-250G-005',
      'Beverages',
      '20',
      '180.00',
      '200.00',
      '12',
      'Tea Company',
      '10'
    ],
    [
      'Notebook A4',
      'NOTE-A4-006',
      'Stationery',
      '100',
      '25.00',
      '35.00',
      '12',
      'Paper Mills',
      '25'
    ],
    [
      'Pen Blue',
      'PEN-BLU-007',
      'Stationery',
      '200',
      '5.00',
      '8.00',
      '18',
      'Pen Company',
      '50'
    ],
    [
      'Mobile Phone',
      'MOB-PH-008',
      'Electronics',
      '5',
      '15000.00',
      '18000.00',
      '18',
      'Electronics Store',
      '2'
    ]
  ]

  const csvRows = [headers, ...sampleData]
  return csvRows.map(row => row.join(',')).join('\\n')
}

export const downloadSampleCSV = () => {
  const csvContent = generateSampleCSV()
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'product_import_template.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const parseCSVLine = (line: string): string[] => {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

export const validateCSVProduct = (product: Partial<CSVProduct>): string[] => {
  const errors: string[] = []

  if (!product.name?.trim()) {
    errors.push('Product name is required')
  }

  if (product.quantity === undefined || product.quantity < 0) {
    errors.push('Quantity must be a non-negative number')
  }

  if (!product.purchase_price || product.purchase_price <= 0) {
    errors.push('Purchase price must be greater than 0')
  }

  if (!product.selling_price || product.selling_price <= 0) {
    errors.push('Selling price must be greater than 0')
  }

  if (product.gst !== undefined && (product.gst < 0 || product.gst > 100)) {
    errors.push('GST rate must be between 0 and 100')
  }

  if (product.low_stock_threshold !== undefined && product.low_stock_threshold < 0) {
    errors.push('Low stock threshold cannot be negative')
  }

  return errors
}

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(price)
}

export const getCSVHeaders = (): string[] => {
  return [
    'Product Name*',
    'SKU/Barcode',
    'Category',
    'Quantity*',
    'Purchase Price*',
    'Selling Price*',
    'GST Rate (%)',
    'Supplier',
    'Low Stock Alert'
  ]
}

export const exportProductsToCSV = (products: any[]) => {
  const headers = getCSVHeaders()
  
  const csvData = products.map(product => [
    product.name,
    product.sku || '',
    product.category || '',
    product.quantity.toString(),
    product.purchase_price.toString(),
    product.selling_price.toString(),
    product.gst.toString(),
    product.supplier || '',
    product.low_stock_threshold.toString()
  ])

  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}