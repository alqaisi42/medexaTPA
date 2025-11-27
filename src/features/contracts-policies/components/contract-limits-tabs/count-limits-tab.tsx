'use client'

import { useState, useEffect, useCallback } from 'react'
import { Hash, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { LimitCombination, NetworkScope } from '@/types/contract-limits'

interface CountLimitsTabProps {
  contractId: number
}

export function CountLimitsTab({ contractId }: CountLimitsTabProps) {
  const [combinations, setCombinations] = useState<LimitCombination[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCombinationId, setSelectedCombinationId] = useState<number | null>(null)
  const [networkScopeFilter, setNetworkScopeFilter] = useState<string>('all')

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

  const getCountLimits = () => {
    if (selectedCombinationId) {
      const combination = combinations.find(c => c.id === selectedCombinationId)
      return combination?.counts || []
    }
    
    return combinations.flatMap(c => 
      (c.counts || []).map(count => ({
        ...count,
        combinationId: c.id,
        combinationDescription: c.description
      }))
    )
  }

  const filteredCountLimits = getCountLimits().filter(count => {
    if (networkScopeFilter !== 'all' && count.networkScope !== networkScopeFilter) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
            <Hash className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Count Limits</h2>
            <p className="text-sm text-gray-500 mt-1">
              View and manage visit/claim count limits across combinations
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
              <Label>Network Scope</Label>
              <Select
                value={networkScopeFilter}
                onValueChange={setNetworkScopeFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Networks</SelectItem>
                  <SelectItem value={NetworkScope.IN}>In Network</SelectItem>
                  <SelectItem value={NetworkScope.OUT}>Out Network</SelectItem>
                  <SelectItem value={NetworkScope.IN_OUT}>In & Out</SelectItem>
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

      {/* Count Limits Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Count Limits</CardTitle>
          <CardDescription>
            {filteredCountLimits.length > 0
              ? `${filteredCountLimits.length} count limit${filteredCountLimits.length === 1 ? '' : 's'} found`
              : 'No count limits found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredCountLimits.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Hash className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">No Count Limits Found</p>
              <p className="text-sm text-gray-500 mb-4">
                {selectedCombinationId || networkScopeFilter !== 'all'
                  ? 'Try adjusting your filter criteria'
                  : 'Count limits will appear here when combinations are created'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Combination</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead className="text-right">Count Limit</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCountLimits.map((limit, index) => (
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
                        <Badge variant="outline" className="text-xs">
                          {limit.scope.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            limit.networkScope === NetworkScope.IN ? 'default' :
                            limit.networkScope === NetworkScope.OUT ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {limit.networkScope}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-lg font-semibold">
                        {limit.countLimit}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {limit.limitPeriod.replace(/_/g, ' ')}
                        </Badge>
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
      {filteredCountLimits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredCountLimits.length}</div>
              <p className="text-xs text-gray-500">Count limits configured</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Highest Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.max(...filteredCountLimits.map(l => l.countLimit))}
              </div>
              <p className="text-xs text-gray-500">Maximum count limit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Average Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  filteredCountLimits.reduce((sum, l) => sum + l.countLimit, 0) / filteredCountLimits.length
                )}
              </div>
              <p className="text-xs text-gray-500">Average count limit</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
