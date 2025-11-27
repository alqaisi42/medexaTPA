'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, Edit2, Trash2, Loader2, AlertCircle, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { LimitCombination, AmountLimit, LimitScope, NetworkScope, LimitPeriod } from '@/types/contract-limits'

interface AmountLimitsTabProps {
  contractId: number
}

export function AmountLimitsTab({ contractId }: AmountLimitsTabProps) {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getAmountLimits = () => {
    if (selectedCombinationId) {
      const combination = combinations.find(c => c.id === selectedCombinationId)
      return combination?.amounts || []
    }
    
    // Return all amount limits from all combinations
    return combinations.flatMap(c => 
      (c.amounts || []).map(amount => ({
        ...amount,
        combinationId: c.id,
        combinationDescription: c.description
      }))
    )
  }

  const filteredAmountLimits = getAmountLimits().filter(amount => {
    if (networkScopeFilter !== 'all' && amount.networkScope !== networkScopeFilter) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-3 text-green-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Amount Limits</h2>
            <p className="text-sm text-gray-500 mt-1">
              View and manage financial limits across combinations
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

      {/* Amount Limits Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Amount Limits</CardTitle>
          <CardDescription>
            {filteredAmountLimits.length > 0
              ? `${filteredAmountLimits.length} amount limit${filteredAmountLimits.length === 1 ? '' : 's'} found`
              : 'No amount limits found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredAmountLimits.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">No Amount Limits Found</p>
              <p className="text-sm text-gray-500 mb-4">
                {selectedCombinationId || networkScopeFilter !== 'all'
                  ? 'Try adjusting your filter criteria'
                  : 'Amount limits will appear here when combinations are created'}
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
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAmountLimits.map((limit, index) => (
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
                      <TableCell className="text-right font-mono">
                        {formatCurrency(limit.amount)}
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
      {filteredAmountLimits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredAmountLimits.length}</div>
              <p className="text-xs text-gray-500">Amount limits configured</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Highest Limit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(Math.max(...filteredAmountLimits.map(l => l.amount)))}
              </div>
              <p className="text-xs text-gray-500">Maximum amount limit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Average Limit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  filteredAmountLimits.reduce((sum, l) => sum + l.amount, 0) / filteredAmountLimits.length
                )}
              </div>
              <p className="text-xs text-gray-500">Average amount limit</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
