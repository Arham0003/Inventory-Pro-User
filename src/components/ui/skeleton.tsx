'use client'

import React from 'react'

// Advanced skeleton loading components for instant perceived performance
interface SkeletonProps {
  className?: string
  animation?: 'pulse' | 'wave' | 'shimmer' | 'none'
  rounded?: boolean
}

export const Skeleton = ({ 
  className = '', 
  animation = 'pulse',
  rounded = true
}: SkeletonProps) => {
  const animationClass = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:400%_100%]',
    shimmer: 'shimmer-effect',
    none: ''
  }[animation]

  return (
    <div 
      className={`bg-gray-200 ${rounded ? 'rounded' : ''} ${animationClass} ${className}`}
    />
  )
}

// Fast loading skeletons for common UI patterns
export const TableSkeleton = ({ rows = 5, columns = 6, animated = true }) => (
  <div className="space-y-3">
    {/* Header skeleton */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" animation={animated ? 'pulse' : 'none'} />
      ))}
    </div>
    
    {/* Rows skeleton */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4 w-full" animation="pulse" />
        ))}
      </div>
    ))}
  </div>
)

export const CardSkeleton = ({ 
  rows = 3, 
  hasHeader = true, 
  hasFooter = false,
  className = '' 
}) => (
  <div className={`bg-white rounded-lg shadow p-6 space-y-4 ${className}`}>
    {hasHeader && (
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    )}
    
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === rows - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
    
    {hasFooter && (
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    )}
  </div>
)

export const StatCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <Skeleton className="h-12 w-12 rounded-lg" />
      <div className="ml-4 space-y-2 flex-1">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-6 w-1/2" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  </div>
)

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
    
    {/* Stats grid */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    
    {/* Main content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <CardSkeleton rows={5} hasHeader className="h-96" />
      </div>
      <div className="space-y-6">
        <CardSkeleton rows={3} hasHeader />
        <CardSkeleton rows={4} hasHeader hasFooter />
      </div>
    </div>
  </div>
)

export const ProductTableSkeleton = () => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="p-6 border-b border-gray-200">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
    
    <div className="p-6">
      <TableSkeleton rows={8} columns={7} />
    </div>
  </div>
)