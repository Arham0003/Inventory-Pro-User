'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from './skeleton'

interface LoadingProps {
  type?: 'spinner' | 'skeleton' | 'dots' | 'bars' | 'pulse'
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
  delay?: number
  className?: string
  instant?: boolean
}

export const Loading = ({
  type = 'spinner',
  size = 'md',
  text,
  fullScreen = false,
  delay = 0,
  className = '',
  instant = false
}: LoadingProps) => {
  const [show, setShow] = useState(instant || delay === 0)

  useEffect(() => {
    if (!instant && delay > 0) {
      const timer = setTimeout(() => setShow(true), delay)
      return () => clearTimeout(timer)
    }
  }, [delay, instant])

  if (!show) return null

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const spinnerClasses = {
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-3'
  }

  const LoadingSpinner = () => (
    <div className={`animate-spin rounded-full border-gray-200 border-t-blue-600 ${sizeClasses[size]} ${spinnerClasses[size]}`} />
  )

  const LoadingDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`bg-blue-600 rounded-full animate-bounce ${
            size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'
          }`}
          style={{ animationDelay: `${i * 0.1}s`, animationDuration: '0.6s' }}
        />
      ))}
    </div>
  )

  const LoadingBars = () => (
    <div className="flex space-x-1 items-end">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`bg-blue-600 animate-pulse ${
            size === 'sm' ? 'w-1' : size === 'md' ? 'w-1.5' : 'w-2'
          }`}
          style={{ 
            height: size === 'sm' ? '8px' : size === 'md' ? '12px' : '16px',
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )

  const LoadingPulse = () => (
    <div className={`bg-blue-600 rounded-full animate-ping ${sizeClasses[size]}`} />
  )

  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return <LoadingDots />
      case 'bars':
        return <LoadingBars />
      case 'pulse':
        return <LoadingPulse />
      case 'skeleton':
        return <Skeleton className={sizeClasses[size]} />
      default:
        return <LoadingSpinner />
    }
  }

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      {renderLoader()}
      {text && (
        <p className={`text-gray-600 animate-pulse ${
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
        }`}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-200">
        {content}
      </div>
    )
  }

  return content
}

// Optimized loading states
export const InstantLoader = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
  <Loading type="pulse" size={size} instant className="animate-in fade-in duration-75" />
)

export const PageLoader = ({ text }: { text?: string }) => (
  <div className="flex items-center justify-center min-h-[200px] animate-in fade-in duration-150">
    <Loading type="spinner" size="lg" text={text || "Loading..."} instant />
  </div>
)

export const ComponentLoader = ({ text, minimal = false }: { text?: string; minimal?: boolean }) => (
  <div className={`flex items-center justify-center ${minimal ? 'py-4' : 'py-8'} animate-in fade-in duration-100`}>
    <Loading type={minimal ? "dots" : "spinner"} size={minimal ? "sm" : "md"} text={text} instant />
  </div>
)

export const ButtonLoader = () => (
  <Loading type="spinner" size="sm" instant className="mr-2" />
)

export const InlineLoader = ({ text }: { text?: string }) => (
  <div className="flex items-center space-x-2 animate-in fade-in duration-75">
    <Loading type="dots" size="sm" instant />
    {text && <span className="text-xs text-gray-600">{text}</span>}
  </div>
)

// Smart loading wrapper with instant feedback
export const SmartLoader = ({ 
  loading, 
  children, 
  skeleton,
  className = '',
  instant = true
}: { 
  loading: boolean
  children: React.ReactNode
  skeleton?: React.ReactNode
  className?: string
  instant?: boolean
}) => {
  const [showContent, setShowContent] = useState(!loading)

  useEffect(() => {
    if (!loading) {
      if (instant) {
        setShowContent(true)
      } else {
        const timer = setTimeout(() => setShowContent(true), 50)
        return () => clearTimeout(timer)
      }
    } else {
      setShowContent(false)
    }
  }, [loading, instant])

  if (loading) {
    return (
      <div className={`animate-in fade-in duration-75 ${className}`}>
        {skeleton || <ComponentLoader minimal />}
      </div>
    )
  }

  return (
    <div className={`animate-in fade-in slide-in-from-bottom-1 duration-150 ${className} ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  )
}