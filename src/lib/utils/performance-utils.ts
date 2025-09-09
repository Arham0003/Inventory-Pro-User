// Performance optimization utilities for the dashboard
import React, { lazy, ComponentType } from 'react'

// Create lazy loading wrapper with better error boundaries
export const createLazyComponent = (importFn: () => Promise<{ default: ComponentType<any> }>) => {
  return lazy(() => 
    importFn().catch(() => ({
      default: () => React.createElement('div', { className: 'animate-pulse bg-gray-200 rounded h-8' })
    }))
  )
}

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
  if (typeof window !== 'undefined' && window.performance) {
    const start = performance.now()
    fn()
    const end = performance.now()
    console.log(`${name} took ${end - start} milliseconds`)
  } else {
    fn()
  }
}

// Optimized intersection observer for lazy loading
export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  callback: () => void,
  options: IntersectionObserverInit = { threshold: 0.1 }
) => {
  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback()
          observer.unobserve(element)
        }
      })
    }, options)

    observer.observe(element)
    return () => observer.disconnect()
  }, [callback])
}

// Bundle size analyzer (development only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Consider analyzing bundle size with:')
    console.log('npx @next/bundle-analyzer')
  }
}

// Memory usage tracker
export const trackMemoryUsage = () => {
  if (typeof window !== 'undefined' && (performance as any).memory) {
    const memory = (performance as any).memory
    console.log('Memory usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576),
      total: Math.round(memory.totalJSHeapSize / 1048576),
      limit: Math.round(memory.jsHeapSizeLimit / 1048576)
    })
  }
}