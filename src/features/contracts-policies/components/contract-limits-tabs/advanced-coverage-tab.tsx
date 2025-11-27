'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings2, Plus, Search, Filter, Edit2, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { AdvancedCoverageCondition, InsuranceDegree } from '@/types/contract-limits'

interface AdvancedCoverageTabProps {
  contractId: number
}

export function AdvancedCoverageTab({ contractId }: AdvancedCoverageTabProps) {
  const [conditions, setConditions] = useState<AdvancedCoverageCondition[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 20

  // Filter states
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [degreeFilter, setDegreeFilter] = useState<string>('all')
  const [subscriberTypeFilter, setSubscriberTypeFilter] = useState<string>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Dialog states
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [selectedCondition, setSelectedCondition] = useState<AdvancedCoverageCondition | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const loadConditions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // For now, we'll create mock data since the API endpoint isn't specified
      // In a real implementation, this would call the actual API
      const mockData: AdvancedCoverageCondition[] = [
        {
          id: 1,
          contractId,
          regionId: 1,
          insuranceDegree: InsuranceDegree.FIRST,
          subscriberTypeId: 1,
          subscriberOldNew: 'NEW',
          serviceTypeId: 1,
          claimTypeId: 1,
          overrideLimitAmount: 5000,
          overrideCopayPercent: 15,
          priority: 1,
          isActive: true
        },
        {
          id: 2,
          contractId,
          regionId: 2,
          insuranceDegree: InsuranceDegree.SECOND,
          subscriberTypeId: 2,
          subscriberOldNew: 'OLD',
          serviceTypeId: 2,
          claimTypeId: 2,
          overrideLimitAmount: 3000,
          overrideCopayPercent: 25,
          priority: 2,
          isActive: true
        }
      ]

      setConditions(mockData)
      setTotalElements(mockData.length)
      setTotalPages(1)
    } catch (err) {
      console.error('Failed to load conditions', err)
      setError(err instanceof Error ? err.message : 'Unable to load advanced coverage conditions')
    } finally {
      setLoading(false)
    }
  }, [contractId, page, searchTerm])

  useEffect(() => {
    void loadConditions()
  }, [loadConditions])

  const handleCreate = () => {
    setSelectedCondition(null)
    setIsEditing(false)
    setShowFormDialog(true)
  }

  const handleEdit = (condition: AdvancedCoverageCondition) => {
    setSelectedCondition(condition)
    setIsEditing(true)
    setShowFormDialog(true)
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const filteredConditions = conditions.filter(condition => {
    if (regionFilter !== 'all' && condition.regionId?.toString() !== regionFilter) {
      return false
    }
    if (degreeFilter !== 'all' && condition.insuranceDegree !== degreeFilter) {
      return false
    }
    if (subscriberTypeFilter !== 'all' && condition.subscriberTypeId?.toString() !== subscriberTypeFilter) {
      return false
    }
    return true
  })

  const activeFiltersCount = [
    regionFilter !== 'all',
    degreeFilter !== 'all',
    subscriberTypeFilter !== 'all'
  ].filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-3 text-indigo-600">
            <Settings2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Advanced Coverage Conditions</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure advanced coverage rules and overrides
            </p>
          </div>
        </div>
        <Button onClick={handleCreate} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Add Condition
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conditions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[500px]">
                <SheetHeader>
                  <SheetTitle>Filter Conditions</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <Label>Region</Label>
                    <Select value={regionFilter} onValueChange={setRegionFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Regions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        <SelectItem value="1">Region 1</SelectItem>
                        <SelectItem value="2">Region 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Insurance Degree</Label>
                    <Select value={degreeFilter} onValueChange={setDegreeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Degrees" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Degrees</SelectItem>
                        <SelectItem value={InsuranceDegree.FIRST}>First</SelectItem>
                        <SelectItem value={InsuranceDegree.SECOND}>Second</SelectItem>
                        <SelectItem value={InsuranceDegree.THIRD}>Third</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Subscriber Type</Label>
                    <Select value={subscriberTypeFilter} onValueChange={setSubscriberTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="1">Type 1</SelectItem>
                        <SelectItem value="2">Type 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setRegionFilter('all')
                        setDegreeFilter('all')
                        setSubscriberTypeFilter('all')
                      }} 
                      className="flex-1"
                    >
                      Clear All
                    </Button>
                    <Button onClick={() => setFiltersOpen(false)} className="flex-1">
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button onClick={() => void loadConditions()} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Conditions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Advanced Coverage Conditions</CardTitle>
          <CardDescription>
            {filteredConditions.length > 0
              ? `${filteredConditions.length} condition${filteredConditions.length === 1 ? '' : 's'} found`
              : 'No conditions found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredConditions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Settings2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">No Conditions Found</p>
              <p className="text-sm text-gray-500 mb-4">
                {activeFiltersCount > 0
                  ? 'Try adjusting your filter criteria'
                  : 'Create your first advanced coverage condition to get started'}
              </p>
              {activeFiltersCount === 0 && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Degree</TableHead>
                    <TableHead>Sub Type</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Claim</TableHead>
                    <TableHead className="text-right">Override Amount</TableHead>
                    <TableHead className="text-right">Override %</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConditions.map((condition) => (
                    <TableRow key={condition.id}>
                      <TableCell className="font-mono text-sm">{condition.id}</TableCell>
                      <TableCell>{condition.regionId || '-'}</TableCell>
                      <TableCell>
                        {condition.insuranceDegree && (
                          <Badge variant="outline" className="text-xs">
                            {condition.insuranceDegree}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{condition.subscriberTypeId || '-'}</div>
                          {condition.subscriberOldNew && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {condition.subscriberOldNew}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{condition.serviceTypeId || '-'}</TableCell>
                      <TableCell>{condition.claimTypeId || '-'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(condition.overrideLimitAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {condition.overrideCopayPercent ? `${condition.overrideCopayPercent}%` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{condition.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={condition.isActive ? 'default' : 'secondary'} className="text-xs">
                          {condition.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(condition)}
                            title="Edit Condition"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete Condition"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {filteredConditions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredConditions.length}</div>
              <p className="text-xs text-gray-500">Coverage conditions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredConditions.filter(c => c.isActive).length}
              </div>
              <p className="text-xs text-gray-500">Active conditions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Override %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const withOverride = filteredConditions.filter(c => c.overrideCopayPercent)
                  if (withOverride.length === 0) return '-'
                  return Math.round(
                    withOverride.reduce((sum, c) => sum + (c.overrideCopayPercent || 0), 0) / withOverride.length
                  ) + '%'
                })()}
              </div>
              <p className="text-xs text-gray-500">Average override percentage</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Highest Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.max(...filteredConditions.map(c => c.priority))}
              </div>
              <p className="text-xs text-gray-500">Highest priority level</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
