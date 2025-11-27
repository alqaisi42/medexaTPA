'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { LimitCombination, FrequencyAppliesTo } from '@/types/contract-limits'

interface FrequencyLimitsTabProps {
  contractId: number
}

export function FrequencyLimitsTab({ contractId }: FrequencyLimitsTabProps) {
  const [combinations, setCombinations] = useState<LimitCombination[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCombinationId, setSelectedCombinationId] = useState<number | null>(null)
  const [appliesToFilter, setAppliesToFilter] = useState<string>('all')

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

  const getFrequencyLimits = () => {
    if (selectedCombinationId) {
      const combination = combinations.find(c => c.id === selectedCombinationId)
      return combination?.frequencies || []
    }
    
    return combinations.flatMap(c => 
      (c.frequencies || []).map(freq => ({
        ...freq,
        combinationId: c.id,
        combinationDescription: c.description
      }))
    )
  }

  const filteredFrequencyLimits = getFrequencyLimits().filter(freq => {
    if (appliesToFilter !== 'all' && freq.appliesTo !== appliesToFilter) {
      return false
    }
    return true
  })

  const formatFrequency = (freq: any) => {
    return `${freq.freqValue} ${freq.freqUnit.toLowerCase()}${freq.freqValue > 1 ? 's' : ''}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Frequency Limits</h2>
            <p className="text-sm text-gray-500 mt-1">
              View and manage frequency restrictions across combinations
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="space-y-2">
              <Label>Combination</Label>
              <Select
                value={selectedCombinationId?.toString() || 'all'}
                onValueChange={(value) => setSelectedCombinationId(value === 'all' ? null : Number(value))}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="All Combinations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Combinations</SelectItem>
                  {combinations.map(combination => (
                    <SelectItem key={combination.id} value={combination.id!.toString()}>
                      #{combination.id} - {combination.description || 'Untitled'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Applies To</Label>
              <Select
                value={appliesToFilter}
                onValueChange={setAppliesToFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={FrequencyAppliesTo.VISIT}>Visit</SelectItem>
                  <SelectItem value={FrequencyAppliesTo.CLAIM}>Claim</SelectItem>
                  <SelectItem value={FrequencyAppliesTo.SERVICE}>Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Frequency Limits Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Frequency Limits</CardTitle>
          <CardDescription>
            {filteredFrequencyLimits.length > 0
              ? `${filteredFrequencyLimits.length} frequency limit${filteredFrequencyLimits.length === 1 ? '' : 's'} found`
              : 'No frequency limits found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredFrequencyLimits.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">No Frequency Limits Found</p>
              <p className="text-sm text-gray-500 mb-4">
                {selectedCombinationId || appliesToFilter !== 'all'
                  ? 'Try adjusting your filter criteria'
                  : 'Frequency limits will appear here when combinations are created'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Combination</TableHead>
                    <TableHead>Applies To</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Over Period</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFrequencyLimits.map((limit, index) => (
                    <TableRow key={`${limit.combinationId}-${index}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">#{limit.combinationId}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {limit.combinationDescription || 'Untitled'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            limit.appliesTo === FrequencyAppliesTo.VISIT ? 'default' :
                            limit.appliesTo === FrequencyAppliesTo.CLAIM ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {limit.appliesTo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono font-semibold">
                          {formatFrequency(limit)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {limit.freqOver ? (
                          <Badge variant="outline" className="text-xs">
                            {limit.freqOver} days
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
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
      {filteredFrequencyLimits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredFrequencyLimits.length}</div>
              <p className="text-xs text-gray-500">Frequency limits configured</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Most Common Unit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const units = filteredFrequencyLimits.map(l => l.freqUnit)
                  const unitCounts = units.reduce((acc, unit) => {
                    acc[unit] = (acc[unit] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                  const mostCommon = Object.entries(unitCounts).sort(([,a], [,b]) => b - a)[0]
                  return mostCommon ? mostCommon[0] : '-'
                })()}
              </div>
              <p className="text-xs text-gray-500">Most used frequency unit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Average Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  filteredFrequencyLimits.reduce((sum, l) => sum + l.freqValue, 0) / filteredFrequencyLimits.length
                )}
              </div>
              <p className="text-xs text-gray-500">Average frequency value</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
