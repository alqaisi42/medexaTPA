'use client'

import { useState, useEffect, useCallback } from 'react'
import { Grid3X3, Search, Filter, Loader2, AlertCircle, Eye, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LimitCombination, NetworkScope, LimitScope, LimitPeriod } from '@/types/contract-limits'

interface MatrixCombinationTabProps {
  contractId: number
}

interface MatrixRow {
  combination: LimitCombination
  amountLimits: {
    inNetwork: string
    outNetwork: string
    inOutNetwork: string
  }
  countLimits: {
    inNetwork: string
    outNetwork: string
    inOutNetwork: string
  }
  frequencies: string
  coInsurance: {
    inNetwork: string
    outNetwork: string
  }
}

export function MatrixCombinationTab({ contractId }: MatrixCombinationTabProps) {
  const [combinations, setCombinations] = useState<LimitCombination[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCombination, setSelectedCombination] = useState<LimitCombination | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  // Filter states
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [networkFilter, setNetworkFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const loadCombinations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/contracts/${contractId}/limits/combinations?size=1000`)
      
      if (!response.ok) {
        throw new Error('Failed to load combinations')
      }

      const data = await response.json()
      setCombinations(data.content || [])
    } catch (err) {
      console.error('Failed to load combinations', err)
      setError(err instanceof Error ? err.message : 'Unable to load combinations')
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    void loadCombinations()
  }, [loadCombinations])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const buildMatrixData = (): MatrixRow[] => {
    return combinations.map(combination => {
      // Process amount limits by network scope
      const amountLimits = {
        inNetwork: '',
        outNetwork: '',
        inOutNetwork: ''
      }

      combination.amounts?.forEach(amount => {
        const limitText = `${formatCurrency(amount.amount)} (${amount.limitPeriod.replace('PER_', '')})`
        switch (amount.networkScope) {
          case NetworkScope.IN:
            amountLimits.inNetwork += amountLimits.inNetwork ? `, ${limitText}` : limitText
            break
          case NetworkScope.OUT:
            amountLimits.outNetwork += amountLimits.outNetwork ? `, ${limitText}` : limitText
            break
          case NetworkScope.IN_OUT:
            amountLimits.inOutNetwork += amountLimits.inOutNetwork ? `, ${limitText}` : limitText
            break
        }
      })

      // Process count limits by network scope
      const countLimits = {
        inNetwork: '',
        outNetwork: '',
        inOutNetwork: ''
      }

      combination.counts?.forEach(count => {
        const limitText = `${count.countLimit} (${count.limitPeriod.replace('PER_', '')})`
        switch (count.networkScope) {
          case NetworkScope.IN:
            countLimits.inNetwork += countLimits.inNetwork ? `, ${limitText}` : limitText
            break
          case NetworkScope.OUT:
            countLimits.outNetwork += countLimits.outNetwork ? `, ${limitText}` : limitText
            break
          case NetworkScope.IN_OUT:
            countLimits.inOutNetwork += countLimits.inOutNetwork ? `, ${limitText}` : limitText
            break
        }
      })

      // Process frequencies
      const frequencies = combination.frequencies?.map(freq => 
        `${freq.freqValue} ${freq.freqUnit.toLowerCase()}${freq.freqValue > 1 ? 's' : ''} (${freq.appliesTo})`
      ).join(', ') || ''

      // Process co-insurance
      const coInsurance = {
        inNetwork: '',
        outNetwork: ''
      }

      combination.coInsurances?.forEach(coIns => {
        const coInsText = `${coIns.copayPercent}% (Ded: ${formatCurrency(coIns.deductible)})`
        switch (coIns.networkScope) {
          case NetworkScope.IN:
            coInsurance.inNetwork += coInsurance.inNetwork ? `, ${coInsText}` : coInsText
            break
          case NetworkScope.OUT:
            coInsurance.outNetwork += coInsurance.outNetwork ? `, ${coInsText}` : coInsText
            break
        }
      })

      return {
        combination,
        amountLimits,
        countLimits,
        frequencies,
        coInsurance
      }
    })
  }

  const filteredMatrixData = buildMatrixData().filter(row => {
    const combination = row.combination
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        combination.description?.toLowerCase().includes(searchLower) ||
        combination.id?.toString().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Region filter
    if (regionFilter !== 'all' && combination.regionId?.toString() !== regionFilter) {
      return false
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      if (priorityFilter === 'high' && combination.priority > 3) return false
      if (priorityFilter === 'medium' && (combination.priority <= 1 || combination.priority > 3)) return false
      if (priorityFilter === 'low' && combination.priority > 1) return false
    }

    return true
  })

  const handleViewDetails = (combination: LimitCombination) => {
    setSelectedCombination(combination)
    setShowDetailDialog(true)
  }

  const exportToCSV = () => {
    const headers = [
      'ID', 'Description', 'Priority', 'Region', 'Subscriber Type', 'Network',
      'Amount Limits (IN)', 'Amount Limits (OUT)', 'Amount Limits (IN&OUT)',
      'Count Limits (IN)', 'Count Limits (OUT)', 'Count Limits (IN&OUT)',
      'Frequencies', 'Co-Insurance (IN)', 'Co-Insurance (OUT)'
    ]

    const csvData = filteredMatrixData.map(row => [
      row.combination.id,
      row.combination.description || '',
      row.combination.priority,
      row.combination.regionId || '',
      row.combination.subscriberTypeId || '',
      row.combination.networkId || '',
      row.amountLimits.inNetwork || '-',
      row.amountLimits.outNetwork || '-',
      row.amountLimits.inOutNetwork || '-',
      row.countLimits.inNetwork || '-',
      row.countLimits.outNetwork || '-',
      row.countLimits.inOutNetwork || '-',
      row.frequencies || '-',
      row.coInsurance.inNetwork || '-',
      row.coInsurance.outNetwork || '-'
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contract-${contractId}-limits-matrix.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const activeFiltersCount = [
    regionFilter !== 'all',
    networkFilter !== 'all',
    priorityFilter !== 'all'
  ].filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-100 p-3 text-cyan-600">
            <Grid3X3 className="h-6 w-6" />
          </div>
            <div>
              <h2 className="text-2xl font-bold">Matrix Combination View</h2>
              <p className="text-sm text-gray-500 mt-1">
                View all limit combinations and their rules in a single comprehensive table
              </p>
            </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={loading || filteredMatrixData.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Matrix Guide */}
      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-cyan-100 p-2 text-cyan-600 flex-shrink-0">
              <Grid3X3 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-cyan-800 mb-2">📊 How to Read the Matrix</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-100 rounded border border-green-200"></span>
                    <span className="text-green-700"><strong>Green:</strong> In-Network Amount Limits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-100 rounded border border-orange-200"></span>
                    <span className="text-orange-700"><strong>Orange:</strong> Out-Network Amount Limits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-100 rounded border border-blue-200"></span>
                    <span className="text-blue-700"><strong>Blue:</strong> In-Network Count Limits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-purple-100 rounded border border-purple-200"></span>
                    <span className="text-purple-700"><strong>Purple:</strong> Out-Network Count Limits</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-indigo-100 rounded border border-indigo-200"></span>
                    <span className="text-indigo-700"><strong>Indigo:</strong> Frequency Rules</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-teal-100 rounded border border-teal-200"></span>
                    <span className="text-teal-700"><strong>Teal:</strong> In-Network Co-Pay</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-100 rounded border border-red-200"></span>
                    <span className="text-red-700"><strong>Red:</strong> Out-Network Co-Pay</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-3 h-3 text-gray-600" />
                    <span className="text-gray-700"><strong>Eye Icon:</strong> View full details</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search combinations by ID or description..."
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
                  <SheetTitle>Filter Matrix View</SheetTitle>
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
                        {/* TODO: Load regions from API */}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority Level</Label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="high">High Priority (1-3)</SelectItem>
                        <SelectItem value="medium">Medium Priority (4-6)</SelectItem>
                        <SelectItem value="low">Low Priority (7+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setRegionFilter('all')
                        setNetworkFilter('all')
                        setPriorityFilter('all')
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
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Matrix Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Limits Matrix</CardTitle>
          <CardDescription>
            {filteredMatrixData.length > 0
              ? `${filteredMatrixData.length} combination${filteredMatrixData.length === 1 ? '' : 's'} displayed`
              : 'No combinations found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredMatrixData.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Grid3X3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">No Matrix Data</p>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm || activeFiltersCount > 0
                  ? 'Try adjusting your search criteria'
                  : 'No limit combinations available to display in matrix format'}
              </p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-16 font-semibold">ID</TableHead>
                      <TableHead className="min-w-[200px] font-semibold">Combination Details</TableHead>
                      <TableHead className="w-20 font-semibold">Priority</TableHead>
                      <TableHead className="min-w-[180px] font-semibold text-green-700">💰 Amount Limits (IN)</TableHead>
                      <TableHead className="min-w-[180px] font-semibold text-orange-700">💰 Amount Limits (OUT)</TableHead>
                      <TableHead className="min-w-[180px] font-semibold text-blue-700">🔢 Count Limits (IN)</TableHead>
                      <TableHead className="min-w-[180px] font-semibold text-purple-700">🔢 Count Limits (OUT)</TableHead>
                      <TableHead className="min-w-[180px] font-semibold text-indigo-700">⏰ Frequency Rules</TableHead>
                      <TableHead className="min-w-[180px] font-semibold text-teal-700">📊 Co-Pay (IN)</TableHead>
                      <TableHead className="min-w-[180px] font-semibold text-red-700">📊 Co-Pay (OUT)</TableHead>
                      <TableHead className="w-20 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMatrixData.map((row) => (
                      <TableRow key={row.combination.id}>
                        <TableCell className="font-mono text-sm">{row.combination.id}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <div className="font-medium truncate" title={row.combination.description || ''}>
                              {row.combination.description || 'Untitled Combination'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 space-y-1">
                              <div>🏥 Region: <span className="font-mono">{row.combination.regionId || 'All'}</span></div>
                              <div>🌐 Network: <span className="font-mono">{row.combination.networkId || 'All'}</span></div>
                              <div>👤 Sub Type: <span className="font-mono">{row.combination.subscriberTypeId || 'All'}</span></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              row.combination.priority <= 3 ? 'default' :
                              row.combination.priority <= 6 ? 'secondary' : 'outline'
                            }
                          >
                            {row.combination.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="bg-green-50">
                          <div className="text-xs max-w-[180px]" title={row.amountLimits.inNetwork}>
                            {row.amountLimits.inNetwork ? (
                              <div className="space-y-1">
                                {row.amountLimits.inNetwork.split(', ').map((limit, idx) => (
                                  <div key={idx} className="bg-green-100 px-2 py-1 rounded text-green-800 font-medium">
                                    {limit}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No limits</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="bg-orange-50">
                          <div className="text-xs max-w-[180px]" title={row.amountLimits.outNetwork}>
                            {row.amountLimits.outNetwork ? (
                              <div className="space-y-1">
                                {row.amountLimits.outNetwork.split(', ').map((limit, idx) => (
                                  <div key={idx} className="bg-orange-100 px-2 py-1 rounded text-orange-800 font-medium">
                                    {limit}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No limits</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="bg-blue-50">
                          <div className="text-xs max-w-[180px]" title={row.countLimits.inNetwork}>
                            {row.countLimits.inNetwork ? (
                              <div className="space-y-1">
                                {row.countLimits.inNetwork.split(', ').map((limit, idx) => (
                                  <div key={idx} className="bg-blue-100 px-2 py-1 rounded text-blue-800 font-medium">
                                    {limit}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No limits</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="bg-purple-50">
                          <div className="text-xs max-w-[180px]" title={row.countLimits.outNetwork}>
                            {row.countLimits.outNetwork ? (
                              <div className="space-y-1">
                                {row.countLimits.outNetwork.split(', ').map((limit, idx) => (
                                  <div key={idx} className="bg-purple-100 px-2 py-1 rounded text-purple-800 font-medium">
                                    {limit}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No limits</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="bg-indigo-50">
                          <div className="text-xs max-w-[180px]" title={row.frequencies}>
                            {row.frequencies ? (
                              <div className="space-y-1">
                                {row.frequencies.split(', ').map((freq, idx) => (
                                  <div key={idx} className="bg-indigo-100 px-2 py-1 rounded text-indigo-800 font-medium">
                                    {freq}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No rules</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="bg-teal-50">
                          <div className="text-xs max-w-[180px]" title={row.coInsurance.inNetwork}>
                            {row.coInsurance.inNetwork ? (
                              <div className="space-y-1">
                                {row.coInsurance.inNetwork.split(', ').map((coIns, idx) => (
                                  <div key={idx} className="bg-teal-100 px-2 py-1 rounded text-teal-800 font-medium">
                                    {coIns}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No co-pay</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="bg-red-50">
                          <div className="text-xs max-w-[180px]" title={row.coInsurance.outNetwork}>
                            {row.coInsurance.outNetwork ? (
                              <div className="space-y-1">
                                {row.coInsurance.outNetwork.split(', ').map((coIns, idx) => (
                                  <div key={idx} className="bg-red-100 px-2 py-1 rounded text-red-800 font-medium">
                                    {coIns}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No co-pay</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(row.combination)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Combination Details - #{selectedCombination?.id}</DialogTitle>
            <DialogDescription>
              Complete details for: {selectedCombination?.description || 'Untitled'}
            </DialogDescription>
          </DialogHeader>
          {selectedCombination && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedCombination.priority}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Insurance Degree</Label>
                  <div className="mt-1 text-sm">{selectedCombination.insuranceDegree || '-'}</div>
                </div>
              </div>

              {/* Amount Limits */}
              {selectedCombination.amounts && selectedCombination.amounts.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Amount Limits</Label>
                  <div className="mt-2 space-y-2">
                    {selectedCombination.amounts.map((amount, index) => (
                      <div key={index} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                        <Badge variant="outline" className="text-xs">{amount.scope}</Badge>
                        <Badge variant="secondary" className="text-xs">{amount.networkScope}</Badge>
                        <span className="font-mono">{formatCurrency(amount.amount)}</span>
                        <span className="text-xs text-gray-500">{amount.limitPeriod}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Count Limits */}
              {selectedCombination.counts && selectedCombination.counts.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Count Limits</Label>
                  <div className="mt-2 space-y-2">
                    {selectedCombination.counts.map((count, index) => (
                      <div key={index} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                        <Badge variant="outline" className="text-xs">{count.scope}</Badge>
                        <Badge variant="secondary" className="text-xs">{count.networkScope}</Badge>
                        <span className="font-mono font-semibold">{count.countLimit}</span>
                        <span className="text-xs text-gray-500">{count.limitPeriod}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Frequencies */}
              {selectedCombination.frequencies && selectedCombination.frequencies.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Frequency Limits</Label>
                  <div className="mt-2 space-y-2">
                    {selectedCombination.frequencies.map((freq, index) => (
                      <div key={index} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                        <span className="font-mono">{freq.freqValue} {freq.freqUnit}</span>
                        <Badge variant="outline" className="text-xs">{freq.appliesTo}</Badge>
                        {freq.freqOver && <span className="text-xs text-gray-500">Over {freq.freqOver} days</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Co-Insurance */}
              {selectedCombination.coInsurances && selectedCombination.coInsurances.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Co-Insurance Rules</Label>
                  <div className="mt-2 space-y-2">
                    {selectedCombination.coInsurances.map((coIns, index) => (
                      <div key={index} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                        <Badge variant="secondary" className="text-xs">{coIns.networkScope}</Badge>
                        <Badge variant="outline" className="text-xs">{coIns.cashScope}</Badge>
                        <span>Copay: {coIns.copayPercent}%</span>
                        <span>Deductible: {formatCurrency(coIns.deductible)}</span>
                        {coIns.maxCopayVisit && <span className="text-xs">Max/Visit: {formatCurrency(coIns.maxCopayVisit)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Summary Stats */}
      {filteredMatrixData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Combinations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredMatrixData.length}</div>
              <p className="text-xs text-gray-500">Limit combinations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">With Amount Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredMatrixData.filter(row => row.combination.amounts && row.combination.amounts.length > 0).length}
              </div>
              <p className="text-xs text-gray-500">Have amount limits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">With Count Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredMatrixData.filter(row => row.combination.counts && row.combination.counts.length > 0).length}
              </div>
              <p className="text-xs text-gray-500">Have count limits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">With Co-Insurance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredMatrixData.filter(row => row.combination.coInsurances && row.combination.coInsurances.length > 0).length}
              </div>
              <p className="text-xs text-gray-500">Have co-insurance rules</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
