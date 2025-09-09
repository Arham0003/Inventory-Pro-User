'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Download, 
  FileText, 
  BarChart3,
  Calendar,
  Filter,
  CheckCircle
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { exportSalesReport, exportSalesToCSV, getSalesAnalytics } from '@/lib/utils/sales-export'

interface SalesExportProps {
  sales: any[]
  filteredSales: any[]
  dateRange: string
  searchTerm: string
  filterPayment: string
}

export function SalesExport({ sales, filteredSales, dateRange, searchTerm, filterPayment }: SalesExportProps) {
  const [exportType, setExportType] = useState<'simple' | 'detailed' | 'analytics'>('detailed')
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exporting, setExporting] = useState(false)

  const analytics = getSalesAnalytics(filteredSales)

  const handleExport = async () => {
    if (filteredSales.length === 0) {
      alert('No sales data to export')
      return
    }

    setExporting(true)
    
    try {
      let filename = `sales_export_${new Date().toISOString().split('T')[0]}`
      
      // Add filter info to filename
      if (dateRange !== 'all') {
        filename += `_${dateRange}`
      }
      if (filterPayment) {
        filename += `_${filterPayment}`
      }
      
      switch (exportType) {
        case 'simple':
          exportSalesToCSV(filteredSales, `${filename}_simple.csv`)
          break
        case 'detailed':
          exportSalesReport(filteredSales, dateRange)
          break
        case 'analytics':
          exportAnalyticsReport(filteredSales, analytics, `${filename}_analytics.csv`)
          break
      }
      
      setShowExportDialog(false)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const exportAnalyticsReport = (sales: any[], analytics: any, filename: string) => {
    const reportData = [
      ['SALES ANALYTICS REPORT'],
      ['Generated on:', new Date().toLocaleDateString('en-IN')],
      ['Date Range:', dateRange],
      [''],
      ['SUMMARY STATISTICS'],
      ['Total Sales:', analytics.totalSales.toString()],
      ['Total Revenue:', `₹${analytics.totalRevenue.toFixed(2)}`],
      ['Total GST:', `₹${analytics.totalGST.toFixed(2)}`],
      ['Average Order Value:', `₹${analytics.avgOrderValue.toFixed(2)}`],
      [''],
      ['PAYMENT METHOD BREAKDOWN'],
      ['Method', 'Count', 'Total Amount'],
      ...Object.entries(analytics.paymentStats).map(([method, stats]: [string, any]) => [
        method.toUpperCase(),
        stats.count.toString(),
        `₹${stats.total.toFixed(2)}`
      ]),
      [''],
      ['TOP SELLING PRODUCTS'],
      ['Product', 'Quantity Sold', 'Revenue'],
      ...analytics.topProducts.map(([product, stats]: [string, any]) => [
        product,
        stats.count.toString(),
        `₹${stats.revenue.toFixed(2)}`
      ])
    ]

    const csvContent = reportData
      .map(row => Array.isArray(row) ? row.map(field => `"${field}"`).join(',') : `"${row}"`)
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  const getFilterSummary = () => {
    const filters = []
    if (dateRange !== 'all') {
      filters.push(`Date: ${dateRange}`)
    }
    if (filterPayment) {
      filters.push(`Payment: ${filterPayment}`)
    }
    if (searchTerm) {
      filters.push(`Search: "${searchTerm}"`)
    }
    return filters.length > 0 ? filters.join(', ') : 'No filters applied'
  }

  return (
    <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Download className="h-4 w-4 mr-2" />
          Export Sales
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Sales Data</DialogTitle>
          <DialogDescription>
            Choose the export format for your sales data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm">
              <div className="flex items-center text-blue-800 mb-2">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="font-medium">Export Summary</span>
              </div>
              <div className="text-blue-700 space-y-1">
                <div>Records: {filteredSales.length} sales</div>
                <div>Total Value: ₹{analytics.totalRevenue.toFixed(2)}</div>
                <div>Filters: {getFilterSummary()}</div>
              </div>
            </div>
          </div>

          {/* Export Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Export Type</label>
            
            <div className="space-y-2">
              <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="exportType"
                  value="simple"
                  checked={exportType === 'simple'}
                  onChange={(e) => setExportType(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-600" />
                    <span className="font-medium">Simple CSV</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Basic sales data in CSV format
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="exportType"
                  value="detailed"
                  checked={exportType === 'detailed'}
                  onChange={(e) => setExportType(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <Download className="h-4 w-4 mr-2 text-gray-600" />
                    <span className="font-medium">Detailed Report</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Comprehensive report with summary and details
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="exportType"
                  value="analytics"
                  checked={exportType === 'analytics'}
                  onChange={(e) => setExportType(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-gray-600" />
                    <span className="font-medium">Analytics Report</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Statistics, trends, and insights
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}