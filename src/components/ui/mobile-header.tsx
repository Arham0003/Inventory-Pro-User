'use client'

import { useState, useEffect } from 'react'
import { Menu, X, Bell, Search, Plus } from 'lucide-react'
import Link from 'next/link'

interface MobileHeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  title?: string
  showSearch?: boolean
  showAddButton?: boolean
  addButtonHref?: string
  addButtonText?: string
  onSearch?: (query: string) => void
}

export function MobileHeader({ 
  sidebarOpen, 
  setSidebarOpen, 
  title = "InventoryPro",
  showSearch = false,
  showAddButton = false,
  addButtonHref = "/dashboard/products/new",
  addButtonText = "Add",
  onSearch
}: MobileHeaderProps) {
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left side - Menu button and title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {sidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            
            {!searchVisible && (
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {title}
              </h1>
            )}
          </div>

          {/* Center - Search (when visible) */}
          {searchVisible && showSearch && (
            <div className="flex-1 mx-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          )}

          {/* Right side - Action buttons */}
          <div className="flex items-center space-x-2">
            {showSearch && (
              <button
                onClick={() => setSearchVisible(!searchVisible)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {searchVisible ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </button>
            )}
            
            {showAddButton && !searchVisible && (
              <Link
                href={addButtonHref}
                className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                {addButtonText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  )
}