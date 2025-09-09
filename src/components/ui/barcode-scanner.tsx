'use client'

import { useState, useRef, useEffect } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Camera, X, Flashlight, FlashlightOff } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (result: string) => void
  onClose: () => void
  isOpen: boolean
}

export function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFlash, setHasFlash] = useState(false)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('')
  const codeReader = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isOpen) {
      initializeScanner()
    } else {
      stopScanner()
    }

    return () => {
      stopScanner()
    }
  }, [isOpen])

  const initializeScanner = async () => {
    try {
      setError(null)
      
      // Initialize the code reader
      codeReader.current = new BrowserMultiFormatReader()
      
      // Get available video input devices
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices()
      setDevices(videoInputDevices)
      
      if (videoInputDevices.length === 0) {
        setError('No camera devices found')
        return
      }

      // Select the back camera if available, otherwise use the first device
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      ) || videoInputDevices[0]

      setCurrentDeviceId(backCamera.deviceId)
      await startScanning(backCamera.deviceId)
    } catch (err: any) {
      console.error('Error initializing scanner:', err)
      setError(`Camera access denied: ${err.message}`)
    }
  }

  const startScanning = async (deviceId?: string) => {
    if (!codeReader.current || !videoRef.current) return

    try {
      setIsScanning(true)
      setError(null)

      const selectedDeviceId = deviceId || currentDeviceId
      
      // Get video stream first to manage it properly
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
        }
      })
      
      streamRef.current = stream
      videoRef.current.srcObject = stream
      
      // Start decoding from video element
      const result = await codeReader.current.decodeOnceFromVideoDevice(
        selectedDeviceId,
        videoRef.current
      )

      if (result) {
        onScan(result.getText())
        onClose()
      }
    } catch (err: any) {
      console.error('Error starting scanner:', err)
      
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access and try again.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please ensure your device has a camera.')
      } else if (err.name === 'NotSupportedError') {
        setError('Camera not supported by this browser.')
      } else {
        setError(`Scanner error: ${err.message}`)
      }
    } finally {
      setIsScanning(false)
    }
  }

  const stopScanner = () => {
    // Clean up video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    // Reset video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsScanning(false)
    setFlashEnabled(false)
  }

  const toggleFlash = async () => {
    if (!streamRef.current) return

    try {
      const videoTrack = streamRef.current.getVideoTracks()[0]
      const capabilities = videoTrack.getCapabilities() as any

      if (capabilities.torch) {
        setHasFlash(true)
        const newFlashState = !flashEnabled
        
        await videoTrack.applyConstraints({
          advanced: [{ torch: newFlashState } as any]
        })
        
        setFlashEnabled(newFlashState)
      }
    } catch (err) {
      console.error('Error toggling flash:', err)
    }
  }

  const switchCamera = async () => {
    if (devices.length <= 1) return

    const currentIndex = devices.findIndex(d => d.deviceId === currentDeviceId)
    const nextIndex = (currentIndex + 1) % devices.length
    const nextDevice = devices[nextIndex]

    setCurrentDeviceId(nextDevice.deviceId)
    stopScanner()
    await startScanning(nextDevice.deviceId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">Scan Barcode</h2>
          <div className="flex items-center space-x-4">
            {hasFlash && (
              <button
                onClick={toggleFlash}
                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
              >
                {flashEnabled ? (
                  <FlashlightOff className="h-5 w-5" />
                ) : (
                  <Flashlight className="h-5 w-5" />
                )}
              </button>
            )}
            
            {devices.length > 1 && (
              <button
                onClick={switchCamera}
                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
              >
                <Camera className="h-5 w-5" />
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Video container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {error ? (
          <div className="text-center p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="text-red-700 mb-2">Camera Error</div>
              <div className="text-red-600 text-sm">{error}</div>
              <button
                onClick={() => initializeScanner()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-full max-w-lg max-h-96 object-cover rounded-lg"
              autoPlay
              playsInline
              muted
            />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 border-2 border-white rounded-lg">
              <div className="absolute inset-4 border border-white/50 rounded">
                {/* Corner indicators */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                
                {/* Scanning line animation */}
                {isScanning && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500 animate-pulse"></div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
        <p className="text-white text-sm">
          Position the barcode within the frame to scan
        </p>
        {isScanning && (
          <div className="flex items-center justify-center mt-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            <span className="text-white text-sm">Scanning...</span>
          </div>
        )}
      </div>
    </div>
  )
}