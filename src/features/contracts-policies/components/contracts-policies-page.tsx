'use client'

import { useState, useEffect } from 'react'
import { FileText, Building2, Users, Shield, TrendingUp, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ContractsManagement } from './contracts-management'
import { PoliciesManagement } from './policies-management'
import { PlansManagement } from './plans-management'
import { MasterBenefitsManagement } from './master-benefits-management'
import { fetchProviderContracts } from '@/lib/api/provider-contracts'
import { searchPolicies } from '@/lib/api/policies'

export function ContractsPoliciesPage() {
    const [activeView, setActiveView] = useState<'overview' | 'contracts' | 'plans' | 'benefits' | 'policies'>('overview')
    const [stats, setStats] = useState({
        totalContracts: 0,
        activeContracts: 0,
        totalPolicies: 0,
        activePolicies: 0,
        loading: true,
    })

    // Load overview stats
    useEffect(() => {
        const loadStats = async () => {
            try {
                const [contractsResponse, policiesResponse] = await Promise.all([
                    fetchProviderContracts({ page: 0, size: 1 }),
                    searchPolicies({ page: 0, size: 1 }),
                ])

                // Get active counts with separate requests
                const [activeContractsResponse, activePoliciesResponse] = await Promise.all([
                    fetchProviderContracts({ page: 0, size: 1, isActive: true }),
                    searchPolicies({ page: 0, size: 1, isActive: true }),
                ])

                setStats({
                    totalContracts: contractsResponse.totalElements,
                    activeContracts: activeContractsResponse.totalElements,
                    totalPolicies: policiesResponse.totalElements,
                    activePolicies: activePoliciesResponse.totalElements,
                    loading: false,
                })
            } catch (error) {
                console.error('Failed to load stats', error)
                setStats(prev => ({ ...prev, loading: false }))
            }
        }

        if (activeView === 'overview') {
            void loadStats()
        }
    }, [activeView])

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        Contracts & Policies
                    </h1>
                    <p className="text-lg text-gray-600 mt-2">
                        Comprehensive management of contracts and insurance policies
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b">
                <Button
                    variant={activeView === 'overview' ? 'default' : 'ghost'}
                    onClick={() => setActiveView('overview')}
                    className="rounded-b-none"
                >
                    Overview
                </Button>
                <Button
                    variant={activeView === 'contracts' ? 'default' : 'ghost'}
                    onClick={() => setActiveView('contracts')}
                    className="rounded-b-none"
                >
                    Contracts
                </Button>
                <Button
                    variant={activeView === 'plans' ? 'default' : 'ghost'}
                    onClick={() => setActiveView('plans')}
                    className="rounded-b-none"
                >
                    Plans
                </Button>
                <Button
                    variant={activeView === 'benefits' ? 'default' : 'ghost'}
                    onClick={() => setActiveView('benefits')}
                    className="rounded-b-none"
                >
                    Master Benefits
                </Button>
                <Button
                    variant={activeView === 'policies' ? 'default' : 'ghost'}
                    onClick={() => setActiveView('policies')}
                    className="rounded-b-none"
                >
                    Policies
                </Button>
            </div>

            {/* Content Area */}
            <div className="min-h-[600px]">
                {activeView === 'overview' && (
                    <div className="space-y-6">
                        {/* Quick Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-blue-600" />
                                        Provider Contracts
                                    </CardTitle>
                                    <CardDescription>
                                        Total contracts with providers
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-blue-600 mb-2">
                                        {stats.loading ? '--' : stats.totalContracts.toLocaleString()}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {stats.loading ? '--' : stats.activeContracts} active
                                    </p>
                                    <Button 
                                        className="w-full mt-4" 
                                        onClick={() => setActiveView('contracts')}
                                    >
                                        Manage Contracts
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-green-600" />
                                        Insurance Policies
                                    </CardTitle>
                                    <CardDescription>
                                        Total insurance policies
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-green-600 mb-2">
                                        {stats.loading ? '--' : stats.totalPolicies.toLocaleString()}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {stats.loading ? '--' : stats.activePolicies} active
                                    </p>
                                    <Button 
                                        className="w-full mt-4" 
                                        onClick={() => setActiveView('policies')}
                                    >
                                        Manage Policies
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-purple-600" />
                                        Active Rate
                                    </CardTitle>
                                    <CardDescription>
                                        Percentage of active contracts
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-purple-600 mb-2">
                                        {stats.loading ? '--' : stats.totalContracts > 0 
                                            ? Math.round((stats.activeContracts / stats.totalContracts) * 100)
                                            : 0}%
                                    </div>
                                    <p className="text-sm text-gray-500">Contract activation</p>
                                    <Button 
                                        variant="outline" 
                                        className="w-full mt-4"
                                        onClick={() => setActiveView('contracts')}
                                    >
                                        View Details
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-amber-600" />
                                        Coverage Health
                                    </CardTitle>
                                    <CardDescription>
                                        Policy coverage status
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-amber-600 mb-2">
                                        {stats.loading ? '--' : stats.totalPolicies > 0 
                                            ? Math.round((stats.activePolicies / stats.totalPolicies) * 100)
                                            : 0}%
                                    </div>
                                    <p className="text-sm text-gray-500">Policy activation</p>
                                    <Button 
                                        variant="outline" 
                                        className="w-full mt-4"
                                        onClick={() => setActiveView('policies')}
                                    >
                                        View Policies
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-blue-600" />
                                        Recent Contract Activity
                                    </CardTitle>
                                    <CardDescription>
                                        Latest updates and changes to provider contracts
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 mb-4">View recent contract modifications, renewals, and new agreements</p>
                                        <Button onClick={() => setActiveView('contracts')}>
                                            View All Contracts
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-green-600" />
                                        Policy Management
                                    </CardTitle>
                                    <CardDescription>
                                        Manage insurance policies and coverage plans
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 mb-4">Configure policy terms, coverage limits, and benefit structures</p>
                                        <Button onClick={() => setActiveView('policies')}>
                                            View All Policies
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {activeView === 'contracts' && <ContractsManagement />}
                {activeView === 'plans' && <PlansManagement />}
                {activeView === 'benefits' && <MasterBenefitsManagement />}
                {activeView === 'policies' && <PoliciesManagement />}
            </div>
        </div>
    )
}

