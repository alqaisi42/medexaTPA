'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Search, Calculator, TrendingUp, TrendingDown, RefreshCw, User, Calendar, Activity } from 'lucide-react'
import { 
  MemberAccumulatorWithLimits, 
  MemberAccumulatorListResponse, 
  AccumulatorSearchParams,
  ApplyUsagePayload 
} from '@/types/member-accumulator'
import { ApplyUsageDialog } from './apply-usage-dialog'

export function MemberAccumulatorsPage() {
  const [accumulators, setAccumulators] = useState<MemberAccumulatorWithLimits[]>([])
  const [loading, setLoading] = useState(false)
  const [searchParams, setSearchParams] = useState<AccumulatorSearchParams>({
    enrollmentId: 0,
    year: new Date().getFullYear(),
    planId: undefined,
    page: 0,
    size: 20
  })
  const [totalPages, setTotalPages] = useState(0)
  const [isApplyUsageOpen, setIsApplyUsageOpen] = useState(false)
  const [selectedAccumulator, setSelectedAccumulator] = useState<MemberAccumulatorWithLimits | null>(null)

  const fetchAccumulators = async () => {
    if (!searchParams.enrollmentId) return

    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        year: searchParams.year.toString(),
        page: searchParams.page?.toString() || '0',
        size: searchParams.size?.toString() || '20'
      })
      
      if (searchParams.planId) {
        queryParams.set('planId', searchParams.planId.toString())
      }

      const response = await fetch(`/api/enrollments/${searchParams.enrollmentId}/accumulators?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch accumulators')
      
      const data: MemberAccumulatorListResponse = await response.json()
      
      // Calculate remaining amounts and visits (assuming we have plan limits)
      const enrichedAccumulators = data.data.content.map(acc => ({
        ...acc,
        remainingAmount: acc.limitAmount ? Math.max(0, acc.limitAmount - acc.usedAmount) : undefined,
        remainingVisits: acc.limitVisits ? Math.max(0, acc.limitVisits - acc.usedVisits) : undefined
      }))
      
      setAccumulators(enrichedAccumulators)
      setTotalPages(data.data.totalPages)
    } catch (error) {
      console.error('Error fetching accumulators:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchParams.enrollmentId) {
      fetchAccumulators()
    }
  }, [searchParams])

  const handleSearch = () => {
    setSearchParams(prev => ({ ...prev, page: 0 }))
    fetchAccumulators()
  }

  const handleApplyUsage = (accumulator: MemberAccumulatorWithLimits) => {
    setSelectedAccumulator(accumulator)
    setIsApplyUsageOpen(true)
  }

  const handleApplyUsageSuccess = () => {
    fetchAccumulators()
    setIsApplyUsageOpen(false)
    setSelectedAccumulator(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const getUsagePercentage = (used: number, limit?: number) => {
    if (!limit || limit === 0) return 0
    return Math.min(100, (used / limit) * 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Member Accumulators</h1>
          <p className="text-muted-foreground">
            View and manage member benefit usage and remaining limits
          </p>
        </div>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Accumulators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="enrollmentId">Enrollment ID *</Label>
              <Input
                id="enrollmentId"
                type="number"
                placeholder="Enter enrollment ID"
                value={searchParams.enrollmentId || ''}
                onChange={(e) => setSearchParams(prev => ({ 
                  ...prev, 
                  enrollmentId: parseInt(e.target.value) || 0 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                placeholder="2025"
                value={searchParams.year}
                onChange={(e) => setSearchParams(prev => ({ 
                  ...prev, 
                  year: parseInt(e.target.value) || new Date().getFullYear() 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planId">Plan ID (Optional)</Label>
              <Input
                id="planId"
                type="number"
                placeholder="Filter by plan"
                value={searchParams.planId || ''}
                onChange={(e) => setSearchParams(prev => ({ 
                  ...prev, 
                  planId: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleSearch} 
                disabled={!searchParams.enrollmentId || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {accumulators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Accumulator Results ({accumulators.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Benefit</TableHead>
                    <TableHead>Used Amount</TableHead>
                    <TableHead>Used Visits</TableHead>
                    <TableHead>Remaining Amount</TableHead>
                    <TableHead>Remaining Visits</TableHead>
                    <TableHead>Usage %</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accumulators.map((accumulator) => {
                    const amountPercentage = getUsagePercentage(accumulator.usedAmount, accumulator.limitAmount)
                    const visitsPercentage = getUsagePercentage(accumulator.usedVisits, accumulator.limitVisits)
                    
                    return (
                      <TableRow key={accumulator.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">Plan {accumulator.planId}</div>
                            {accumulator.planNameEn && (
                              <div className="text-sm text-muted-foreground">{accumulator.planNameEn}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{accumulator.benefitNameEn}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatCurrency(accumulator.usedAmount)}</span>
                            {accumulator.limitAmount && (
                              <div className={`text-xs ${getUsageColor(amountPercentage)}`}>
                                ({amountPercentage.toFixed(1)}%)
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{accumulator.usedVisits}</span>
                            {accumulator.limitVisits && (
                              <div className={`text-xs ${getUsageColor(visitsPercentage)}`}>
                                ({visitsPercentage.toFixed(1)}%)
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {accumulator.remainingAmount !== undefined ? (
                            <div className="flex items-center gap-1">
                              {accumulator.remainingAmount > 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                              )}
                              <span className={accumulator.remainingAmount > 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(accumulator.remainingAmount)}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="secondary">Unlimited</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {accumulator.remainingVisits !== undefined ? (
                            <div className="flex items-center gap-1">
                              {accumulator.remainingVisits > 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                              )}
                              <span className={accumulator.remainingVisits > 0 ? 'text-green-600' : 'text-red-600'}>
                                {accumulator.remainingVisits}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="secondary">Unlimited</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {accumulator.limitAmount && (
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      amountPercentage >= 90 ? 'bg-red-500' :
                                      amountPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(100, amountPercentage)}%` }}
                                  />
                                </div>
                                <span className="text-xs">Amount</span>
                              </div>
                            )}
                            {accumulator.limitVisits && (
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      visitsPercentage >= 90 ? 'bg-red-500' :
                                      visitsPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(100, visitsPercentage)}%` }}
                                  />
                                </div>
                                <span className="text-xs">Visits</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(accumulator.lastUpdated)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyUsage(accumulator)}
                            className="flex items-center gap-1"
                          >
                            <Activity className="h-3 w-3" />
                            Apply Usage
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {(searchParams.page || 0) + 1} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchParams(prev => ({ ...prev, page: Math.max(0, (prev.page || 0) - 1) }))}
                    disabled={(searchParams.page || 0) === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchParams(prev => ({ ...prev, page: Math.min(totalPages - 1, (prev.page || 0) + 1) }))}
                    disabled={(searchParams.page || 0) === totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && accumulators.length === 0 && searchParams.enrollmentId > 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Accumulators Found</h3>
            <p className="text-muted-foreground mb-4">
              No accumulator data found for the specified enrollment and year.
            </p>
            <Button onClick={handleSearch} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Apply Usage Dialog */}
      {selectedAccumulator && (
        <ApplyUsageDialog
          open={isApplyUsageOpen}
          onClose={() => {
            setIsApplyUsageOpen(false)
            setSelectedAccumulator(null)
          }}
          onSuccess={handleApplyUsageSuccess}
          accumulator={selectedAccumulator}
        />
      )}
    </div>
  )
}
