'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BarcodeScanner } from '@/components/ui/barcode-scanner'
import { Camera, X } from 'lucide-react'

interface BarcodeInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function BarcodeInput({ 
  value, 
  onChange, 
  placeholder = "Enter or scan barcode", 
  disabled = false,
  className = ""
}: BarcodeInputProps) {
  const [showScanner, setShowScanner] = useState(false)

  const handleScan = (scannedCode: string) => {
    onChange(scannedCode)
    setShowScanner(false)
  }

  const clearBarcode = () => {
    onChange('')
  }

  return (
    <>
      <div className={`relative ${className}`}>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-20"
        />
        
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex space-x-1">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearBarcode}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowScanner(true)}
            disabled={disabled}
            className="h-8 w-8 p-0"
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <BarcodeScanner
        isOpen={showScanner}
        onScan={handleScan}
        onClose={() => setShowScanner(false)}
      />
    </>
  )
}