'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Users,
    Shield,
    Network,
    Ban,
    Umbrella,
    CreditCard,
    RefreshCw,
    AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchContract } from '@/lib/api/contracts'
import { Contract } from '@/types/contract'
import { PlanBenefitsTab } from './plan-tabs/plan-benefits-tab'
import { PlanSharedLimitsTab } from './plan-tabs/plan-shared-limits-tab'
import { PlanNetworksTab } from './plan-tabs/plan-networks-tab'
import { PlanExclusionsTab } from './plan-tabs/plan-exclusions-tab'
import { PlanReinsuranceTab } from './plan-tabs/plan-reinsurance-tab'
import { PlanCardTemplatesTab } from './plan-tabs/plan-card-templates-tab'

interface PlanDetailPageProps {
    contractId: number
    planId: number
}

export function PlanDetailPage({ contractId, planId }: PlanDetailPageProps) {
    const router = useRouter()
    const [contract, setContract] = useState<Contract | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('benefits')

    // Load contract details
    const loadContract = async () => {
        setLoading(true)
        setError(null)
        try {
            const contractData = await fetchContract(contractId)
            setContract(contractData)
        } catch (err) {
            console.error('Failed to load contract', err)
            setError(err instanceof Error ? err.message : 'Unable to load contract')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadContract()
    }, [contractId])

    // Find the current plan
    const currentPlan = contract?.plans.find(plan => plan.id === planId)

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            </div>
        )
    }

    if (error || !contract || !currentPlan) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </div>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error || 'Plan not found'}</span>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Plans
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6 text-blue-600" />
                            Plan Details
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {currentPlan.planCode} - {currentPlan.nameEn}
                        </p>
                    </div>
                </div>
            </div>

            {/* Plan Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Plan Code</p>
                                <p className="text-lg font-bold">{currentPlan.planCode}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Shield className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Annual Limit (Member)</p>
                                <p className="text-lg font-bold">{currentPlan.annualLimitPerMember.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Annual Limit (Family)</p>
                                <p className="text-lg font-bold">{currentPlan.annualLimitPerFamily.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Shield className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Status</p>
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    {currentPlan.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Plan Management Tabs - Full Width */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Plan Management</CardTitle>
                    <CardDescription>Configure plan settings and benefits</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-6 h-auto bg-transparent p-1 mb-6">
                            <TabsTrigger 
                                value="benefits" 
                                className="flex-col gap-1 h-16 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                            >
                                <Shield className="h-4 w-4" />
                                <span className="text-xs">Benefits</span>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="shared-limits" 
                                className="flex-col gap-1 h-16 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                            >
                                <Users className="h-4 w-4" />
                                <span className="text-xs">Shared Limits</span>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="networks" 
                                className="flex-col gap-1 h-16 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                            >
                                <Network className="h-4 w-4" />
                                <span className="text-xs">Networks</span>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="exclusions" 
                                className="flex-col gap-1 h-16 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                            >
                                <Ban className="h-4 w-4" />
                                <span className="text-xs">Exclusions</span>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="reinsurance" 
                                className="flex-col gap-1 h-16 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                            >
                                <Umbrella className="h-4 w-4" />
                                <span className="text-xs">Reinsurance</span>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="card-templates" 
                                className="flex-col gap-1 h-16 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                            >
                                <CreditCard className="h-4 w-4" />
                                <span className="text-xs">Card Templates</span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Tab Content - Full Width */}
            <div className="w-full">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsContent value="benefits" className="mt-0">
                        <PlanBenefitsTab planId={planId} />
                    </TabsContent>
                    <TabsContent value="shared-limits" className="mt-0">
                        <PlanSharedLimitsTab planId={planId} />
                    </TabsContent>
                    <TabsContent value="networks" className="mt-0">
                        <PlanNetworksTab planId={planId} />
                    </TabsContent>
                    <TabsContent value="exclusions" className="mt-0">
                        <PlanExclusionsTab planId={planId} />
                    </TabsContent>
                    <TabsContent value="reinsurance" className="mt-0">
                        <PlanReinsuranceTab planId={planId} />
                    </TabsContent>
                    <TabsContent value="card-templates" className="mt-0">
                        <PlanCardTemplatesTab planId={planId} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
