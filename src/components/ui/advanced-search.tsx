'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface FilterOption {
  id: string
  label: string
  value: any
  count?: number
}

interface SortOption {
  id: string
  label: string
  field: string
  direction: 'asc' | 'desc'
}

interface AdvancedSearchProps {
  placeholder?: string
  onSearch: (query: string) => void
  onFilter: (filters: Record<string, any>) => void
  onSort: (sort: SortOption) => void
  filterGroups?: {
    id: string
    label: string
    type: 'select' | 'multiselect' | 'range' | 'date'
    options: FilterOption[]
  }[]
  sortOptions?: SortOption[]
  initialQuery?: string
  className?: string
}

export function AdvancedSearch({
  placeholder = "Search...",
  onSearch,
  onFilter,
  onSort,
  filterGroups = [],
  sortOptions = [],
  initialQuery = "",
  className = ""
}: AdvancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [currentSort, setCurrentSort] = useState<SortOption | null>(null)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, onSearch])

  const handleFilterChange = (groupId: string, value: any) => {
    const newFilters = { ...activeFilters }
    
    if (value === null || value === undefined || value === '') {
      delete newFilters[groupId]
    } else {
      newFilters[groupId] = value
    }
    
    setActiveFilters(newFilters)
    onFilter(newFilters)
  }

  const handleSortChange = (sort: SortOption) => {
    setCurrentSort(sort)
    onSort(sort)
  }

  const clearFilters = () => {
    setActiveFilters({})
    onFilter({})
  }

  const clearSearch = () => {
    setSearchQuery('')
    onSearch('')
  }

  const activeFilterCount = Object.keys(activeFilters).length

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-8"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filter
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white border rounded-lg p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filters</h3>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Filter Groups */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filterGroups.map((group) => (
              <div key={group.id}>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  {group.label}
                </label>
                {group.type === 'select' && (
                  <select
                    value={activeFilters[group.id] || ''}
                    onChange={(e) => handleFilterChange(group.id, e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All {group.label}</option>
                    {group.options.map((option) => (
                      <option key={option.id} value={option.value}>
                        {option.label}
                        {option.count && ` (${option.count})`}
                      </option>
                    ))}
                  </select>
                )}
                {group.type === 'multiselect' && (
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {group.options.map((option) => (
                      <label key={option.id} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={(activeFilters[group.id] || []).includes(option.value)}
                          onChange={(e) => {
                            const currentValues = activeFilters[group.id] || []
                            const newValues = e.target.checked
                              ? [...currentValues, option.value]
                              : currentValues.filter((v: any) => v !== option.value)
                            handleFilterChange(group.id, newValues.length > 0 ? newValues : null)
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{option.label}</span>
                        {option.count && (
                          <span className="text-gray-500">({option.count})</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
                {group.type === 'range' && (
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={activeFilters[group.id]?.min || ''}
                      onChange={(e) => handleFilterChange(group.id, {
                        ...activeFilters[group.id],
                        min: e.target.value
                      })}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={activeFilters[group.id]?.max || ''}
                      onChange={(e) => handleFilterChange(group.id, {
                        ...activeFilters[group.id],
                        max: e.target.value
                      })}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sort Options */}
          {sortOptions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((sort) => (
                  <Button
                    key={sort.id}
                    variant={currentSort?.id === sort.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSortChange(sort)}
                    className="flex items-center space-x-1"
                  >
                    <span>{sort.label}</span>
                    {sort.direction === 'asc' ? (
                      <SortAsc className="h-3 w-3" />
                    ) : (
                      <SortDesc className="h-3 w-3" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {Object.entries(activeFilters).map(([key, value]) => {
            const group = filterGroups.find(g => g.id === key)
            if (!group) return null

            const displayValue = Array.isArray(value) 
              ? `${value.length} selected`
              : typeof value === 'object'
                ? `${value.min || 0} - ${value.max || '∞'}`
                : group.options.find(opt => opt.value === value)?.label || value

            return (
              <Badge
                key={key}
                variant="secondary"
                className="flex items-center space-x-1 pr-1"
              >
                <span>{group.label}: {displayValue}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange(key, null)}
                  className="h-4 w-4 p-0 ml-1 hover:bg-gray-300"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}