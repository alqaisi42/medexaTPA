'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Settings, RefreshCw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Contract } from '@/types/contract'
import { fetchContract } from '@/lib/api/contracts'
import { LimitCombinationsTab } from './contract-limits-tabs/limit-combinations-tab'
import { AmountLimitsTab } from './contract-limits-tabs/amount-limits-tab'
import { CountLimitsTab } from './contract-limits-tabs/count-limits-tab'
import { FrequencyLimitsTab } from './contract-limits-tabs/frequency-limits-tab'
import { CoInsuranceTab } from './contract-limits-tabs/coinsurance-tab'
import { AdvancedCoverageTab } from './contract-limits-tabs/advanced-coverage-tab'
import { LinkedCombinationsTab } from './contract-limits-tabs/linked-combinations-tab'
import { MatrixCombinationTab } from './contract-limits-tabs/matrix-combination-tab'

export function ContractLimitsPage() {
  const router = useRouter()
  const params = useParams()
  const contractId = params?.id ? Number(params.id) : null

  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!contractId) {
      setError('Contract ID is required')
      return
    }

    const loadContract = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchContract(contractId)
        setContract(data)
      } catch (err) {
        console.error('Failed to load contract', err)
        setError(err instanceof Error ? err.message : 'Unable to load contract details')
      } finally {
        setLoading(false)
      }
    }

    void loadContract()
  }, [contractId])

  const handleRefresh = async () => {
    if (!contractId) return
    setLoading(true)
    try {
      const data = await fetchContract(contractId)
      setContract(data)
    } catch (err) {
      console.error('Failed to refresh contract', err)
      setError(err instanceof Error ? err.message : 'Unable to refresh contract')
    } finally {
      setLoading(false)
    }
  }

  if (!contractId) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Invalid contract ID
        </div>
      </div>
    )
  }

  if (loading && !contract) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Loading contract details...</p>
        </div>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Contract not found'}
        </div>
        <Button variant="outline" onClick={() => router.push('/contracts-policies')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contracts
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push(`/contracts-policies/contracts/${contractId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Contract
          </Button>
          <div className="rounded-lg bg-tpa-primary/10 p-3 text-tpa-primary">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Contract Limits</h1>
            <p className="text-sm text-gray-600">
              Manage all limit rules and combinations for contract
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Guide Notes */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base text-blue-800 flex items-center gap-2">
            📚 Contract Limits Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-blue-800">🔍 Matrix View</div>
                <div className="text-blue-700">See all combinations and their limits in one comprehensive table. Perfect for getting an overview.</div>
              </div>
              <div>
                <div className="font-semibold text-blue-800">🎯 Combinations</div>
                <div className="text-blue-700">Create and manage limit combinations that define which benefits, regions, and networks apply together.</div>
              </div>
              <div>
                <div className="font-semibold text-blue-800">💰 Amount Limits</div>
                <div className="text-blue-700">Set monetary limits per year, visit, or claim. Controls how much can be spent.</div>
              </div>
              <div>
                <div className="font-semibold text-blue-800">🔢 Count Limits</div>
                <div className="text-blue-700">Set visit/service count limits per period. Controls how many times a service can be used.</div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-blue-800">⏰ Frequency</div>
                <div className="text-blue-700">Define how often services can be used (e.g., once per year, twice per month).</div>
              </div>
              <div>
                <div className="font-semibold text-blue-800">📊 Co-Insurance</div>
                <div className="text-blue-700">Set copay percentages and deductibles for in-network vs out-network providers.</div>
              </div>
              <div>
                <div className="font-semibold text-blue-800">⚙️ Advanced</div>
                <div className="text-blue-700">Complex coverage conditions with overrides for specific scenarios.</div>
              </div>
              <div>
                <div className="font-semibold text-blue-800">🔗 Links</div>
                <div className="text-blue-700">Connect combinations together to create hierarchical limit structures.</div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <div className="font-semibold text-blue-800 mb-2">💡 Quick Tips:</div>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Start with the <strong>Matrix View</strong> to understand existing limits</li>
              <li>• Use <strong>Combinations</strong> to group related benefits and rules</li>
              <li>• Set <strong>Amount</strong> and <strong>Count</strong> limits to control usage</li>
              <li>• Configure <strong>Co-Insurance</strong> for member cost-sharing</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Contract Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{contract.contractNumber}</CardTitle>
              <CardDescription className="mt-1">
                Contract ID: {contract.id} • Status: {contract.status}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={contract.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {contract.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-900">Start Date</div>
              <div className="text-gray-600">
                {contract.startDate ? (
                  Array.isArray(contract.startDate) 
                    ? new Date(contract.startDate[0], contract.startDate[1] - 1, contract.startDate[2]).toLocaleDateString()
                    : new Date(contract.startDate).toLocaleDateString()
                ) : '-'}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-900">End Date</div>
              <div className="text-gray-600">
                {contract.endDate ? (
                  Array.isArray(contract.endDate) 
                    ? new Date(contract.endDate[0], contract.endDate[1] - 1, contract.endDate[2]).toLocaleDateString()
                    : new Date(contract.endDate).toLocaleDateString()
                ) : '-'}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Plans Count</div>
              <div className="text-gray-600">{contract.plans?.length || 0}</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Currency</div>
              <div className="text-gray-600">{contract.currencyCode || 'USD'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="matrix" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="matrix" className="text-xs">
            Matrix View
          </TabsTrigger>
          <TabsTrigger value="combinations" className="text-xs">
            Combinations
          </TabsTrigger>
          <TabsTrigger value="amount" className="text-xs">
            Amount
          </TabsTrigger>
          <TabsTrigger value="count" className="text-xs">
            Count
          </TabsTrigger>
          <TabsTrigger value="frequency" className="text-xs">
            Frequency
          </TabsTrigger>
          <TabsTrigger value="coinsurance" className="text-xs">
            Co-Insurance
          </TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">
            Advanced
          </TabsTrigger>
          <TabsTrigger value="linked" className="text-xs">
            Links
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <MatrixCombinationTab contractId={contractId} />
        </TabsContent>

        <TabsContent value="combinations">
          <LimitCombinationsTab contractId={contractId} />
        </TabsContent>

        <TabsContent value="amount">
          <AmountLimitsTab contractId={contractId} />
        </TabsContent>

        <TabsContent value="count">
          <CountLimitsTab contractId={contractId} />
        </TabsContent>

        <TabsContent value="frequency">
          <FrequencyLimitsTab contractId={contractId} />
        </TabsContent>

        <TabsContent value="coinsurance">
          <CoInsuranceTab contractId={contractId} />
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedCoverageTab contractId={contractId} />
        </TabsContent>

        <TabsContent value="linked">
          <LinkedCombinationsTab contractId={contractId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
