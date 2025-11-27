'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { BarChart3, FileText, DollarSign, Network, Loader2, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchProviderContracts } from '@/lib/api/provider-contracts'
import { fetchProviderContractPrices } from '@/lib/api/provider-contract-prices'
import { fetchProviderNetworksByProvider } from '@/lib/api/provider-networks'
import { getSpecialties } from '@/features/specialties/services/specialty-service'
import { Specialty } from '@/types/specialty'
import { formatCurrency } from '@/lib/utils'

interface ProviderDashboardTabProps {
    providerId?: number
}

interface DashboardStats {
    totalContracts: number
    activeContracts: number
    totalPrices: number
    specialtyCoverage: Array<{
        specialtyId: number
        specialtyName: string
        specialtyNameAr?: string
        count: number
    }>
    networkDistribution: Array<{
        networkId: number
        networkName: string
        networkCode: string
        tierCode: string | null
        count: number
    }>
}

export function ProviderDashboardTab({ providerId: propProviderId }: ProviderDashboardTabProps) {
    const searchParams = useSearchParams()
    const urlProviderId = searchParams.get('providerId')
    const effectiveProviderId = propProviderId || (urlProviderId ? Number(urlProviderId) : undefined)

    const [stats, setStats] = useState<DashboardStats>({
        totalContracts: 0,
        activeContracts: 0,
        totalPrices: 0,
        specialtyCoverage: [],
        networkDistribution: [],
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!effectiveProviderId) {
            setError('Provider ID is required')
            return
        }

        const loadDashboardData = async () => {
            setLoading(true)
            setError(null)
            try {
                // Fetch all data in parallel
                const [contractsResponse, pricesResponse, networksResponse, specialtiesResponse] = await Promise.all([
                    fetchProviderContracts({ providerId: effectiveProviderId, page: 0, size: 1000 }),
                    fetchProviderContractPrices({ providerId: effectiveProviderId, page: 0, size: 1000 }),
                    fetchProviderNetworksByProvider({ providerId: effectiveProviderId, page: 0, size: 1000 }),
                    getSpecialties(),
                ])

                const contracts = contractsResponse.content || []
                const prices = pricesResponse.content || []
                const networks = networksResponse.content || []
                const specialties = specialtiesResponse

                // Calculate contract stats
                const totalContracts = contracts.length
                const activeContracts = contracts.filter(c => c.isActive).length

                // Calculate price stats
                const totalPrices = prices.length

                // Calculate specialty coverage
                const specialtyMap = new Map<number, { name: string; nameAr?: string; count: number }>()
                const specialtyLookup = new Map(specialties.map(s => [s.id, s]))
                
                prices.forEach((price) => {
                    if (price.specialtyId && price.specialtyName) {
                        const specialty = specialtyLookup.get(price.specialtyId)
                        const existing = specialtyMap.get(price.specialtyId) || {
                            name: price.specialtyName,
                            nameAr: specialty?.nameAr,
                            count: 0,
                        }
                        existing.count++
                        specialtyMap.set(price.specialtyId, existing)
                    }
                })

                const specialtyCoverage = Array.from(specialtyMap.entries())
                    .map(([specialtyId, data]) => ({
                        specialtyId,
                        specialtyName: data.name,
                        specialtyNameAr: data.nameAr,
                        count: data.count,
                    }))
                    .sort((a, b) => b.count - a.count)

                // Calculate network distribution
                const networkMap = new Map<string, { networkId: number; networkName: string; networkCode: string; tierCode: string | null; count: number }>()
                networks.forEach((network) => {
                    const key = `${network.networkId}-${network.tierCode || 'default'}`
                    const existing = networkMap.get(key) || {
                        networkId: network.networkId,
                        networkName: network.networkNameEn,
                        networkCode: network.networkCode,
                        tierCode: network.tierCode,
                        count: 0,
                    }
                    existing.count++
                    networkMap.set(key, existing)
                })

                const networkDistribution = Array.from(networkMap.values())
                    .sort((a, b) => b.count - a.count)

                setStats({
                    totalContracts,
                    activeContracts,
                    totalPrices,
                    specialtyCoverage,
                    networkDistribution,
                })
            } catch (err) {
                console.error('Failed to load dashboard data', err)
                setError(err instanceof Error ? err.message : 'Unable to load dashboard data')
            } finally {
                setLoading(false)
            }
        }

        void loadDashboardData()
    }, [effectiveProviderId])

    const topSpecialties = useMemo(() => stats.specialtyCoverage.slice(0, 5), [stats.specialtyCoverage])
    const topNetworks = useMemo(() => stats.networkDistribution.slice(0, 5), [stats.networkDistribution])

    if (!effectiveProviderId) {
        return (
            <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-900">Select a Provider</h3>
                    </div>
                    <p className="text-sm text-blue-700">
                        Please select a provider from the Contracts tab to view the dashboard statistics.
                    </p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Loading dashboard data...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-tpa-primary/10 p-3 text-tpa-primary">
                    <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Provider Dashboard</h2>
                    <p className="text-sm text-gray-600">Overview of contracts, prices, specialties, and networks</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalContracts}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.activeContracts} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Prices</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalPrices}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Price entries configured
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Specialties Covered</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.specialtyCoverage.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Unique specialties
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Specialty Coverage */}
            <Card>
                <CardHeader>
                    <CardTitle>Specialty Coverage</CardTitle>
                    <CardDescription>Distribution of prices across specialties</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.specialtyCoverage.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No specialty coverage data available
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {topSpecialties.map((specialty) => {
                                const percentage = stats.totalPrices > 0 
                                    ? Math.round((specialty.count / stats.totalPrices) * 100) 
                                    : 0
                                return (
                                    <div key={specialty.specialtyId} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div>
                                                <div className="font-medium">{specialty.specialtyName}</div>
                                                {specialty.specialtyNameAr && (
                                                    <div className="text-xs text-gray-500" dir="rtl">
                                                        {specialty.specialtyNameAr}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold">{specialty.count}</div>
                                                <div className="text-xs text-gray-500">{percentage}%</div>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                            {stats.specialtyCoverage.length > 5 && (
                                <div className="text-sm text-gray-500 text-center pt-2">
                                    +{stats.specialtyCoverage.length - 5} more specialties
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Network Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Network Distribution</CardTitle>
                    <CardDescription>Provider's network assignments and tiers</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.networkDistribution.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No network assignments found
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {topNetworks.map((network, index) => (
                                <div key={`${network.networkId}-${network.tierCode || index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-full bg-blue-100 p-2">
                                            <Network className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium">{network.networkName}</div>
                                            <div className="text-xs text-gray-500">
                                                {network.networkCode}
                                                {network.tierCode && ` • Tier: ${network.tierCode}`}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-blue-600">{network.count}</div>
                                        <div className="text-xs text-gray-500">assignment{network.count !== 1 ? 's' : ''}</div>
                                    </div>
                                </div>
                            ))}
                            {stats.networkDistribution.length > 5 && (
                                <div className="text-sm text-gray-500 text-center pt-2">
                                    +{stats.networkDistribution.length - 5} more networks
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

