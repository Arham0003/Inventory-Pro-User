// Performance optimization utilities
import { Suspense, lazy } from 'react'
import React from 'react'

// Component lazy loading with better loading states
export const lazyWithPreload = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  const LazyComponent = lazy(importFunc)
  
  // Add preload function to the component
  ;(LazyComponent as any).preload = importFunc
  
  return LazyComponent as typeof LazyComponent & { preload: () => Promise<{ default: T }> }
}

// Instant loading states for perceived performance
export const useInstantTransition = () => {
  const [isTransitioning, setIsTransitioning] = React.useState(false)
  
  const startTransition = React.useCallback(() => {
    setIsTransitioning(true)
    // Immediate DOM update, then smooth transition
    requestAnimationFrame(() => {
      setIsTransitioning(false)
    })
  }, [])
  
  return { isTransitioning, startTransition }
}

// Optimized state management for large lists
export const useVirtualState = <T,>(items: T[], pageSize: number = 50) => {
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: pageSize })
  const [searchTerm, setSearchTerm] = React.useState('')
  
  const filteredItems = React.useMemo(() => {
    if (!searchTerm) return items
    return items.filter((item: any) => 
      JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [items, searchTerm])
  
  const visibleItems = React.useMemo(() => 
    filteredItems.slice(visibleRange.start, visibleRange.end),
    [filteredItems, visibleRange]
  )
  
  const loadMore = React.useCallback(() => {
    setVisibleRange(prev => ({
      start: prev.start,
      end: Math.min(prev.end + pageSize, filteredItems.length)
    }))
  }, [pageSize, filteredItems.length])
  
  return {
    visibleItems,
    filteredItems,
    searchTerm,
    setSearchTerm,
    loadMore,
    hasMore: visibleRange.end < filteredItems.length
  }
}

// Pre-render optimization hook
export const usePreRender = (condition: boolean) => {
  const [shouldRender, setShouldRender] = React.useState(condition)
  
  React.useEffect(() => {
    if (condition && !shouldRender) {
      // Delay rendering until next frame for smoother animations
      requestAnimationFrame(() => setShouldRender(true))
    } else if (!condition) {
      setShouldRender(false)
    }
  }, [condition, shouldRender])
  
  return shouldRender
}

// Smooth animation variants for Framer Motion-like effects
export const pageTransitions = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.15, ease: 'easeOut' }
}

export const slideTransitions = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.12, ease: 'easeOut' }
}

export const fadeTransitions = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.1 }
}

// Intersection Observer hook for better performance
export const useIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) => {
  const ref = React.useRef<HTMLElement>(null)
  
  React.useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const observer = new IntersectionObserver(callback, options)
    observer.observe(element)
    
    return () => observer.disconnect()
  }, [callback, options])
  
  return ref
}

// Debounced search hook
export const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Optimized image component
export const OptimizedImage = ({ 
  src, 
  alt, 
  className = '',
  priority = false,
  ...props 
}: {
  src: string
  alt: string
  className?: string
  priority?: boolean
  [key: string]: any
}) => {
  const [loaded, setLoaded] = React.useState(false)
  const [error, setError] = React.useState(false)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={`transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading={priority ? 'eager' : 'lazy'}
        {...props}
      />
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          Failed to load
        </div>
      )}
    </div>
  )
}

// Virtual scrolling for large lists
export const VirtualList = ({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem 
}: {
  items: any[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: any, index: number) => React.ReactNode
}) => {
  const [scrollTop, setScrollTop] = React.useState(0)
  
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )
  
  const visibleItems = items.slice(startIndex, endIndex)
  
  return (
    <div
      style={{ height: containerHeight }}
      className="overflow-auto"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              width: '100%',
              height: itemHeight,
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  )
}

// Performance monitoring
export const usePerformanceMonitor = () => {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log(`${entry.name}: ${entry.duration}ms`)
        }
      })
      
      observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] })
      
      return () => observer.disconnect()
    }
  }, [])
}

// Bundle size optimization helpers
export const trackBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Bundle Analysis:')
    console.log('Run `npm run analyze` to analyze bundle size')
    console.log('Large dependencies to watch:')
    console.log('- Chart.js & react-chartjs-2 (~400KB)')
    console.log('- @radix-ui components (~200KB)')
    console.log('- AI SDKs (~300KB)')
    console.log('- QR code libraries (~150KB)')
  }
}

// Code splitting helpers
export const preloadRoute = (routeModule: string) => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = `/_next/static/chunks/pages${routeModule}.js`
    document.head.appendChild(link)
  }
}

// Memory usage tracker
export const trackMemoryUsage = () => {
  if (typeof window !== 'undefined' && (performance as any).memory) {
    const memory = (performance as any).memory
    console.log('💾 Memory usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + 'MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + 'MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + 'MB'
    })
  }
}