// Utility functions for sales CSV export operations
export interface SalesExportData {
  invoice_number: string
  customer_name: string
  customer_phone: string
  product_name: string
  quantity: number
  unit_price: number
  total_amount: number
  gst_amount: number
  payment_method: string
  date: string
  time: string
}

export const generateSalesCSV = (sales: any[]): string => {
  const headers = [
    'Invoice Number',
    'Customer Name',
    'Customer Phone',
    'Product Name',
    'Quantity',
    'Unit Price',
    'Total Amount',
    'GST Amount',
    'Payment Method',
    'Date',
    'Time'
  ]

  const csvData = sales.map(sale => {
    const saleDate = new Date(sale.created_at)
    const unitPrice = sale.quantity > 0 ? (sale.total_price - sale.gst_amount) / sale.quantity : 0

    return [
      sale.invoice_number || '',
      sale.customer_name || '',
      sale.customer_phone || '',
      sale.products?.name || 'Unknown Product',
      sale.quantity?.toString() || '0',
      unitPrice.toFixed(2),
      (sale.total_price - sale.gst_amount).toFixed(2),
      sale.gst_amount?.toFixed(2) || '0.00',
      sale.payment_method?.toUpperCase() || '',
      saleDate.toLocaleDateString('en-IN'),
      saleDate.toLocaleTimeString('en-IN')
    ]
  })

  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  return csvContent
}

export const exportSalesToCSV = (sales: any[], filename?: string) => {
  const csvContent = generateSalesCSV(sales)
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename || `sales_export_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export const exportSalesReport = (sales: any[], dateRange: string) => {
  const reportDate = new Date().toLocaleDateString('en-IN')
  const totalSales = sales.length
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_price, 0)
  const totalGST = sales.reduce((sum, sale) => sum + sale.gst_amount, 0)
  
  // Create summary data
  const summary = [
    ['SALES REPORT SUMMARY'],
    ['Generated on:', reportDate],
    ['Date Range:', dateRange],
    ['Total Sales:', totalSales.toString()],
    ['Total Revenue:', `₹${totalRevenue.toFixed(2)}`],
    ['Total GST:', `₹${totalGST.toFixed(2)}`],
    [''],
    ['DETAILED SALES DATA']
  ]

  const headers = [
    'Invoice Number',
    'Customer Name',
    'Customer Phone', 
    'Product Name',
    'Quantity',
    'Unit Price',
    'Total Amount',
    'GST Amount',
    'Payment Method',
    'Date',
    'Time'
  ]

  const salesData = sales.map(sale => {
    const saleDate = new Date(sale.created_at)
    const unitPrice = sale.quantity > 0 ? (sale.total_price - sale.gst_amount) / sale.quantity : 0

    return [
      sale.invoice_number || '',
      sale.customer_name || '',
      sale.customer_phone || '',
      sale.products?.name || 'Unknown Product',
      sale.quantity?.toString() || '0',
      `₹${unitPrice.toFixed(2)}`,
      `₹${(sale.total_price - sale.gst_amount).toFixed(2)}`,
      `₹${sale.gst_amount?.toFixed(2) || '0.00'}`,
      sale.payment_method?.toUpperCase() || '',
      saleDate.toLocaleDateString('en-IN'),
      saleDate.toLocaleTimeString('en-IN')
    ]
  })

  const csvContent = [...summary, headers, ...salesData]
    .map(row => Array.isArray(row) ? row.map(field => `"${field}"`).join(',') : `"${row}"`)
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `sales_report_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export const getPaymentMethodStats = (sales: any[]) => {
  const stats: Record<string, { count: number; total: number }> = {}
  
  sales.forEach(sale => {
    const method = sale.payment_method || 'unknown'
    if (!stats[method]) {
      stats[method] = { count: 0, total: 0 }
    }
    stats[method].count++
    stats[method].total += sale.total_price
  })
  
  return stats
}

export const getSalesAnalytics = (sales: any[]) => {
  const totalSales = sales.length
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_price, 0)
  const totalGST = sales.reduce((sum, sale) => sum + sale.gst_amount, 0)
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0
  
  const paymentStats = getPaymentMethodStats(sales)
  
  // Top products
  const productStats: Record<string, { count: number; revenue: number }> = {}
  sales.forEach(sale => {
    const productName = sale.products?.name || 'Unknown Product'
    if (!productStats[productName]) {
      productStats[productName] = { count: 0, revenue: 0 }
    }
    productStats[productName].count += sale.quantity || 1
    productStats[productName].revenue += sale.total_price
  })
  
  const topProducts = Object.entries(productStats)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
  
  return {
    totalSales,
    totalRevenue,
    totalGST,
    avgOrderValue,
    paymentStats,
    topProducts
  }
}