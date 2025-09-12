'use client'

import { ReactNode } from 'react'

interface ResponsiveGridProps {
  children: ReactNode
  cols?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
  className?: string
}

export function ResponsiveGrid({ 
  children, 
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
  className = ""
}: ResponsiveGridProps) {
  const getGridClasses = () => {
    const classes = ['grid']
    
    // Add responsive column classes
    if (cols.sm) classes.push(`grid-cols-${cols.sm}`)
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`)
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`)
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`)
    
    // Add gap class
    classes.push(`gap-${gap}`)
    
    return classes.join(' ')
  }

  return (
    <div className={`${getGridClasses()} ${className}`}>
      {children}
    </div>
  )
}

interface ResponsiveCardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
}

export function ResponsiveCard({ 
  children, 
  className = "",
  padding = 'md',
  shadow = 'md',
  onClick
}: ResponsiveCardProps) {
  const getPaddingClass = () => {
    switch (padding) {
      case 'none': return ''
      case 'sm': return 'p-3'
      case 'md': return 'p-4 md:p-6'
      case 'lg': return 'p-6 md:p-8'
      default: return 'p-4 md:p-6'
    }
  }

  const getShadowClass = () => {
    switch (shadow) {
      case 'none': return ''
      case 'sm': return 'shadow-sm'
      case 'md': return 'shadow'
      case 'lg': return 'shadow-lg'
      default: return 'shadow'
    }
  }

  return (
    <div 
      className={`bg-white rounded-lg ${getShadowClass()} ${getPaddingClass()} ${className} ${
        onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
      }`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface MobileStackProps {
  children: ReactNode
  spacing?: number
  className?: string
}

export function MobileStack({ children, spacing = 4, className = "" }: MobileStackProps) {
  return (
    <div className={`flex flex-col space-y-${spacing} ${className}`}>
      {children}
    </div>
  )
}

interface ResponsiveTableProps {
  children: ReactNode
  className?: string
}

export function ResponsiveTable({ children, className = "" }: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto">
      <div className="hidden md:block">
        <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
          {children}
        </table>
      </div>
    </div>
  )
}

interface MobileListProps {
  items: any[]
  renderItem: (item: any, index: number) => ReactNode
  className?: string
}

export function MobileList({ items, renderItem, className = "" }: MobileListProps) {
  return (
    <div className={`md:hidden space-y-3 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-4">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}