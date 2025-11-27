'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, Edit2, Trash2, Loader2, AlertCircle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { LimitCombination, LimitCombinationFilters } from '@/types/contract-limits'
import { LimitCombinationFormDrawer } from './limit-combination-form-drawer'

interface LimitCombinationsTabProps {
  contractId: number
}

export function LimitCombinationsTab({ contractId }: LimitCombinationsTabProps) {
  const [combinations, setCombinations] = useState<LimitCombination[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 20

  // Filter states
  const [filters, setFilters] = useState<LimitCombinationFilters>({})
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Dialog states
  const [showFormDrawer, setShowFormDrawer] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCombination, setSelectedCombination] = useState<LimitCombination | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadCombinations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString(),
      })

      if (searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim())
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/contracts/${contractId}/limits/combinations?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to load limit combinations')
      }

      const data = await response.json()
      setCombinations(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      console.error('Failed to load combinations', err)
      setError(err instanceof Error ? err.message : 'Unable to load limit combinations')
    } finally {
      setLoading(false)
    }
  }, [contractId, page, searchTerm, filters])

  useEffect(() => {
    void loadCombinations()
  }, [loadCombinations])

  const handleCreate = () => {
    setSelectedCombination(null)
    setIsEditing(false)
    setShowFormDrawer(true)
  }

  const handleEdit = (combination: LimitCombination) => {
    setSelectedCombination(combination)
    setIsEditing(true)
    setShowFormDrawer(true)
  }

  const handleDelete = async () => {
    if (!selectedCombination) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/contracts/${contractId}/limits/combinations/${selectedCombination.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete combination')
      }

      setShowDeleteDialog(false)
      setSelectedCombination(null)
      await loadCombinations()
    } catch (err) {
      console.error('Failed to delete combination', err)
      setError(err instanceof Error ? err.message : 'Unable to delete combination')
    } finally {
      setDeleting(false)
    }
  }

  const handleFormSuccess = async () => {
    setShowFormDrawer(false)
    setSelectedCombination(null)
    await loadCombinations()
  }

  const handleSearch = () => {
    setPage(0)
    void loadCombinations()
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleFilterChange = (key: keyof LimitCombinationFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }))
  }

  const applyFilters = () => {
    setPage(0)
    setFiltersOpen(false)
    void loadCombinations()
  }

  const clearFilters = () => {
    setFilters({})
    setPage(0)
    void loadCombinations()
  }

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== null && v !== '').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Limit Combinations</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage limit combinations and their associated rules
          </p>
        </div>
        <Button onClick={handleCreate} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Add Combination
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
                  placeholder="Search combinations by description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    }
                  }}
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
                  <SheetTitle>Filter Combinations</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <Label>Region</Label>
                    <Select
                      value={filters.regionId?.toString() || 'all'}
                      onValueChange={(value) => handleFilterChange('regionId', value === 'all' ? undefined : Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Regions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        {/* TODO: Load regions from API */}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Subscriber Type</Label>
                    <Select
                      value={filters.subscriberTypeId?.toString() || 'all'}
                      onValueChange={(value) => handleFilterChange('subscriberTypeId', value === 'all' ? undefined : Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {/* TODO: Load subscriber types from API */}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Network</Label>
                    <Select
                      value={filters.networkId?.toString() || 'all'}
                      onValueChange={(value) => handleFilterChange('networkId', value === 'all' ? undefined : Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Networks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Networks</SelectItem>
                        {/* TODO: Load networks from API */}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority Range</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.priorityMin || ''}
                        onChange={(e) => handleFilterChange('priorityMin', e.target.value ? Number(e.target.value) : undefined)}
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.priorityMax || ''}
                        onChange={(e) => handleFilterChange('priorityMax', e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={clearFilters} className="flex-1">
                      Clear All
                    </Button>
                    <Button onClick={applyFilters} className="flex-1">
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button onClick={handleSearch} disabled={loading}>
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

      {/* Combinations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Limit Combinations</CardTitle>
          <CardDescription>
            {totalElements > 0
              ? `${totalElements} combination${totalElements === 1 ? '' : 's'} found`
              : 'No combinations found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : combinations.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">No Combinations Found</p>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm || activeFiltersCount > 0
                  ? 'Try adjusting your search criteria'
                  : 'Create your first limit combination to get started'}
              </p>
              {!searchTerm && activeFiltersCount === 0 && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Combination
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Subscriber Type</TableHead>
                      <TableHead>Claim Type</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Limits</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinations.map((combination) => (
                      <TableRow key={combination.id}>
                        <TableCell className="font-mono text-sm">{combination.id}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={combination.description || ''}>
                            {combination.description || '-'}
                          </div>
                        </TableCell>
                        <TableCell>{combination.regionId || '-'}</TableCell>
                        <TableCell>{combination.subscriberTypeId || '-'}</TableCell>
                        <TableCell>{combination.claimTypeId || '-'}</TableCell>
                        <TableCell>{combination.networkId || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{combination.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {combination.amounts && combination.amounts.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                A:{combination.amounts.length}
                              </Badge>
                            )}
                            {combination.counts && combination.counts.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                C:{combination.counts.length}
                              </Badge>
                            )}
                            {combination.frequencies && combination.frequencies.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                F:{combination.frequencies.length}
                              </Badge>
                            )}
                            {combination.coInsurances && combination.coInsurances.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                CI:{combination.coInsurances.length}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(combination)}
                              title="Edit Combination"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCombination(combination)
                                setShowDeleteDialog(true)
                              }}
                              title="Delete Combination"
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {page + 1} of {totalPages} ({totalElements} total)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0 || loading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages - 1 || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Form Drawer */}
      <LimitCombinationFormDrawer
        open={showFormDrawer}
        onOpenChange={setShowFormDrawer}
        contractId={contractId}
        combination={selectedCombination}
        isEditing={isEditing}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Combination</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this limit combination? This action cannot be undone and will
              remove all associated limits.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
