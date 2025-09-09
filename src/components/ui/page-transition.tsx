'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export const PageTransition = ({ children, className = '' }: PageTransitionProps) => {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [currentPath, setCurrentPath] = useState(pathname)

  useEffect(() => {
    if (pathname !== currentPath) {
      setIsVisible(false)
      const timer = setTimeout(() => {
        setCurrentPath(pathname)
        setIsVisible(true)
      }, 150)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(true)
    }
  }, [pathname, currentPath])

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </div>
  )
}

export const FadeTransition = ({ 
  children, 
  isVisible, 
  duration = 200,
  className = '' 
}: {
  children: React.ReactNode
  isVisible: boolean
  duration?: number
  className?: string
}) => (
  <div
    className={`transition-opacity ease-out ${className}`}
    style={{ 
      transitionDuration: `${duration}ms`,
      opacity: isVisible ? 1 : 0 
    }}
  >
    {children}
  </div>
)

export const SlideTransition = ({ 
  children, 
  isVisible, 
  direction = 'right',
  duration = 250,
  className = '' 
}: {
  children: React.ReactNode
  isVisible: boolean
  direction?: 'left' | 'right' | 'up' | 'down'
  duration?: number
  className?: string
}) => {
  const transforms = {
    left: isVisible ? 'translateX(0)' : 'translateX(-20px)',
    right: isVisible ? 'translateX(0)' : 'translateX(20px)',
    up: isVisible ? 'translateY(0)' : 'translateY(-20px)',
    down: isVisible ? 'translateY(0)' : 'translateY(20px)'
  }

  return (
    <div
      className={`transition-all ease-out ${className}`}
      style={{ 
        transitionDuration: `${duration}ms`,
        opacity: isVisible ? 1 : 0,
        transform: transforms[direction]
      }}
    >
      {children}
    </div>
  )
}

export const ScaleTransition = ({ 
  children, 
  isVisible, 
  duration = 200,
  className = '' 
}: {
  children: React.ReactNode
  isVisible: boolean
  duration?: number
  className?: string
}) => (
  <div
    className={`transition-all ease-out origin-center ${className}`}
    style={{ 
      transitionDuration: `${duration}ms`,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1)' : 'scale(0.95)'
    }}
  >
    {children}
  </div>
)

export const StaggeredList = ({ 
  children, 
  staggerDelay = 50,
  className = '' 
}: {
  children: React.ReactNode[]
  staggerDelay?: number
  className?: string
}) => {
  const [visibleItems, setVisibleItems] = useState<number[]>([])

  useEffect(() => {
    const timers = children.map((_, index) => 
      setTimeout(() => {
        setVisibleItems(prev => [...prev, index])
      }, index * staggerDelay)
    )

    return () => timers.forEach(clearTimeout)
  }, [children, staggerDelay])

  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={`transition-all duration-300 ease-out ${
            visibleItems.includes(index)
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          {child}
        </div>
      ))}
    </div>
  )
}