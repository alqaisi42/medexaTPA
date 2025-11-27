'use client'

import { useState, useEffect, useCallback } from 'react'
import { Percent, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { LimitCombination, NetworkScope, CashScope } from '@/types/contract-limits'

interface CoInsuranceTabProps {
  contractId: number
}

export function CoInsuranceTab({ contractId }: CoInsuranceTabProps) {
  const [combinations, setCombinations] = useState<LimitCombination[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCombinationId, setSelectedCombinationId] = useState<number | null>(null)
  const [networkScopeFilter, setNetworkScopeFilter] = useState<string>('all')
  const [cashScopeFilter, setCashScopeFilter] = useState<string>('all')

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

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getCoInsurances = () => {
    if (selectedCombinationId) {
      const combination = combinations.find(c => c.id === selectedCombinationId)
      return combination?.coInsurances || []
    }
    
    return combinations.flatMap(c => 
      (c.coInsurances || []).map(coIns => ({
        ...coIns,
        combinationId: c.id,
        combinationDescription: c.description
      }))
    )
  }

  const filteredCoInsurances = getCoInsurances().filter(coIns => {
    if (networkScopeFilter !== 'all' && coIns.networkScope !== networkScopeFilter) {
      return false
    }
    if (cashScopeFilter !== 'all' && coIns.cashScope !== cashScopeFilter) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Co-Insurance</h2>
            <p className="text-sm text-gray-500 mt-1">
              View and manage co-insurance rules across combinations
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

            <div className="space-y-2">
              <Label>Cash Scope</Label>
              <Select
                value={cashScopeFilter}
                onValueChange={setCashScopeFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={CashScope.CASH}>Cash</SelectItem>
                  <SelectItem value={CashScope.NON_CASH}>Non-Cash</SelectItem>
                  <SelectItem value={CashScope.BOTH}>Both</SelectItem>
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

      {/* Co-Insurance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Co-Insurance Rules</CardTitle>
          <CardDescription>
            {filteredCoInsurances.length > 0
              ? `${filteredCoInsurances.length} co-insurance rule${filteredCoInsurances.length === 1 ? '' : 's'} found`
              : 'No co-insurance rules found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredCoInsurances.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Percent className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">No Co-Insurance Rules Found</p>
              <p className="text-sm text-gray-500 mb-4">
                {selectedCombinationId || networkScopeFilter !== 'all' || cashScopeFilter !== 'all'
                  ? 'Try adjusting your filter criteria'
                  : 'Co-insurance rules will appear here when combinations are created'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Combination</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Cash/Non-Cash</TableHead>
                    <TableHead className="text-right">Deductible</TableHead>
                    <TableHead className="text-right">Copay %</TableHead>
                    <TableHead className="text-right">Max Visit</TableHead>
                    <TableHead className="text-right">Max Claim</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoInsurances.map((coIns, index) => (
                    <TableRow key={`${coIns.combinationId}-${index}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">#{coIns.combinationId}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {coIns.combinationDescription || 'Untitled'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            coIns.networkScope === NetworkScope.IN ? 'default' :
                            coIns.networkScope === NetworkScope.OUT ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {coIns.networkScope}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            coIns.cashScope === CashScope.CASH ? 'default' :
                            coIns.cashScope === CashScope.NON_CASH ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {coIns.cashScope}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(coIns.deductible)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {coIns.copayPercent}%
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(coIns.maxCopayVisit)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(coIns.maxCopayClaim)}
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
      {filteredCoInsurances.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredCoInsurances.length}</div>
              <p className="text-xs text-gray-500">Co-insurance rules</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Copay %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  filteredCoInsurances.reduce((sum, c) => sum + c.copayPercent, 0) / filteredCoInsurances.length
                )}%
              </div>
              <p className="text-xs text-gray-500">Average copay percentage</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Deductible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  filteredCoInsurances.reduce((sum, c) => sum + c.deductible, 0) / filteredCoInsurances.length
                )}
              </div>
              <p className="text-xs text-gray-500">Average deductible</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">In Network</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredCoInsurances.filter(c => c.networkScope === NetworkScope.IN).length}
              </div>
              <p className="text-xs text-gray-500">In-network rules</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
