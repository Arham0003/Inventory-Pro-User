'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CSVImport } from '@/components/products/csv-import'

export default function CSVImportPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link 
          href="/dashboard/products"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Products
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Products from CSV</h1>
          <p className="text-gray-600">Upload a CSV file to import multiple products at once</p>
        </div>
      </div>

      {/* CSV Import Component */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <CSVImport onImportComplete={() => {
            // Redirect back to products page after successful import
            window.location.href = '/dashboard/products'
          }} />
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">CSV Import Instructions</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Required Fields</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Product Name:</strong> Name of the product</li>
              <li>• <strong>Quantity:</strong> Current stock quantity</li>
              <li>• <strong>Purchase Price:</strong> Cost price per unit</li>
              <li>• <strong>Selling Price:</strong> Sale price per unit</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Optional Fields</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>SKU:</strong> Stock Keeping Unit/Barcode</li>
              <li>• <strong>Category:</strong> Product category</li>
              <li>• <strong>GST Rate:</strong> Tax rate (default: 18%)</li>
              <li>• <strong>Supplier:</strong> Vendor/Supplier name</li>
              <li>• <strong>Low Stock Alert:</strong> Minimum quantity threshold</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Tips for Best Results</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Download and use the provided template for correct formatting</li>
            <li>• Ensure all required fields are filled</li>
            <li>• Use decimal numbers for prices (e.g., 123.45)</li>
            <li>• Avoid special characters in text fields</li>
            <li>• Maximum 1000 products per import</li>
            <li>• Check for duplicate SKUs before importing</li>
          </ul>
        </div>
      </div>
    </div>
  )
}