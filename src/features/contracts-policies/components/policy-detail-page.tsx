'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, AlertCircle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Policy, PolicyPayload } from '@/types/policy'
import { fetchPolicy, createPolicy, updatePolicy } from '@/lib/api/policies'
import { getLookupRecords } from '@/features/lookup-management/services/master-lookup-service'
import { LookupRecord } from '@/types/lookup'
import { PolicyBasicInfoTab } from './policy-form-tabs/basic-info-tab'
import { PolicyGeneralConditionsTab } from './policy-form-tabs/general-conditions-tab'
import { PolicyMaternityRulesTab } from './policy-form-tabs/maternity-rules-tab'
import { PolicyWaitingPeriodsTab } from './policy-form-tabs/waiting-periods-tab'
import { PolicySpecialLimitsTab } from './policy-form-tabs/special-limits-tab'
import { PolicyCategoryLimitsTab } from './policy-form-tabs/category-limits-tab'
import { PolicyChronicRulesTab } from './policy-form-tabs/chronic-rules-tab'
import { PolicyPreapprovalRulesTab } from './policy-form-tabs/preapproval-rules-tab'
import { PolicyProviderExceptionsTab } from './policy-form-tabs/provider-exceptions-tab'
import { PolicyExclusionsTab } from './policy-form-tabs/exclusions-tab'
import { cn } from '@/lib/utils'

interface PolicyDetailPageProps {
    policyId: number | null
    onBack?: () => void
}

export function PolicyDetailPage({ policyId, onBack }: PolicyDetailPageProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [policy, setPolicy] = useState<Policy | null>(null)
    const [activeTab, setActiveTab] = useState('basic')
    const [formData, setFormData] = useState<PolicyPayload>({
        policyNumber: '',
        policyCode: null,
        employerId: 0,
        insuranceCompanyId: null,
        policyType: null,
        policyCategory: null,
        startDate: null,
        endDate: null,
        effectiveFrom: null,
        effectiveTo: null,
        globalLimit: null,
        inpatientLimit: null,
        outpatientLimit: null,
        pharmacyLimit: null,
        maternityLimit: null,
        dentalLimit: null,
        opticalLimit: null,
        hasMaternity: false,
        hasDental: false,
        hasOptical: false,
        hasPharmacy: false,
        pricingModel: null,
        networkType: null,
        isActive: true,
    })

    // Lookup states
    const [policyTypes, setPolicyTypes] = useState<LookupRecord[]>([])
    const [policyCategories, setPolicyCategories] = useState<LookupRecord[]>([])
    const [pricingModels, setPricingModels] = useState<LookupRecord[]>([])
    const [networkTypes, setNetworkTypes] = useState<LookupRecord[]>([])
    const [loadingLookups, setLoadingLookups] = useState(false)

    // Load lookups
    useEffect(() => {
        const loadLookups = async () => {
            setLoadingLookups(true)
            try {
                const [types, categories, models, networks] = await Promise.all([
                    getLookupRecords('service-types').catch(() => []),
                    getLookupRecords('service-categories').catch(() => []),
                    getLookupRecords('service-types').catch(() => []),
                    getLookupRecords('service-types').catch(() => []),
                ])
                setPolicyTypes(types)
                setPolicyCategories(categories)
                setPricingModels(models)
                setNetworkTypes(networks)
            } catch (err) {
                console.error('Failed to load lookups', err)
            } finally {
                setLoadingLookups(false)
            }
        }
        void loadLookups()
    }, [])

    // Load policy if editing
    useEffect(() => {
        if (policyId) {
            loadPolicy()
        } else {
            setPolicy(null)
            setFormData({
                policyNumber: '',
                policyCode: null,
                employerId: 0,
                insuranceCompanyId: null,
                policyType: null,
                policyCategory: null,
                startDate: null,
                endDate: null,
                effectiveFrom: null,
                effectiveTo: null,
                globalLimit: null,
                inpatientLimit: null,
                outpatientLimit: null,
                pharmacyLimit: null,
                maternityLimit: null,
                dentalLimit: null,
                opticalLimit: null,
                hasMaternity: false,
                hasDental: false,
                hasOptical: false,
                hasPharmacy: false,
                pricingModel: null,
                networkType: null,
                isActive: true,
            })
        }
    }, [policyId])

    const loadPolicy = async () => {
        if (!policyId) return
        setLoading(true)
        setError(null)
        try {
            const data = await fetchPolicy(policyId)
            setPolicy(data)
            setFormData({
                policyCode: data.policyCode,
                employerId: data.employerId,
                insuranceCompanyId: data.insuranceCompanyId,
                policyType: data.policyType,
                policyCategory: data.policyCategory,
                startDate: Array.isArray(data.startDate)
                    ? `${data.startDate[0]}-${String(data.startDate[1]).padStart(2, '0')}-${String(data.startDate[2]).padStart(2, '0')}`
                    : data.startDate || null,
                endDate: Array.isArray(data.endDate)
                    ? `${data.endDate[0]}-${String(data.endDate[1]).padStart(2, '0')}-${String(data.endDate[2]).padStart(2, '0')}`
                    : data.endDate || null,
                effectiveFrom: data.effectiveFrom,
                effectiveTo: data.effectiveTo,
                globalLimit: data.globalLimit,
                inpatientLimit: data.inpatientLimit,
                outpatientLimit: data.outpatientLimit,
                pharmacyLimit: data.pharmacyLimit,
                maternityLimit: data.maternityLimit,
                dentalLimit: data.dentalLimit,
                opticalLimit: data.opticalLimit,
                hasMaternity: data.hasMaternity,
                hasDental: data.hasDental,
                hasOptical: data.hasOptical,
                hasPharmacy: data.hasPharmacy,
                pricingModel: data.pricingModel,
                networkType: data.networkType,
                isActive: data.isActive,
            })
        } catch (err) {
            console.error('Failed to load policy', err)
            setError(err instanceof Error ? err.message : 'Unable to load policy')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!formData.employerId) {
            setError('Employer ID is required')
            return
        }

        setSaving(true)
        setError(null)
        try {
            let savedPolicy: Policy
            if (policyId && policy) {
                savedPolicy = await updatePolicy(policyId, formData)
            } else {
                if (!formData.policyNumber) {
                    setError('Policy Number is required')
                    setSaving(false)
                    return
                }
                savedPolicy = await createPolicy(formData)
                // Navigate to the edit page with the new policy ID
                router.push(`/contracts-policies/${savedPolicy.id}`)
                return
            }
            // Update policy state
            setPolicy(savedPolicy)
        } catch (err) {
            console.error('Failed to save policy', err)
            setError(err instanceof Error ? err.message : 'Unable to save policy')
        } finally {
            setSaving(false)
        }
    }

    const handleBack = () => {
        if (onBack) {
            onBack()
        } else {
            router.push('/contracts-policies')
        }
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Loading policy details...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={handleBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">
                                {policyId ? `Edit Policy: ${policy?.policyNumber || 'Loading...'}` : 'Create New Policy'}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {policyId
                                    ? 'Update policy details and configure all aspects of the policy'
                                    : 'Fill in the details to create a new policy and configure all aspects'}
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={saving || loadingLookups} className="min-w-[120px]">
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                {policyId ? 'Update Policy' : 'Create Policy'}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Main Content with Vertical Tabs */}
            <div className="flex-1 flex overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex flex-1 overflow-hidden">
                        {/* Vertical Tabs List */}
                        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
                            <TabsList className="flex flex-col h-auto w-full p-2 bg-transparent border-0">
                                <TabsTrigger
                                    value="basic"
                                    className="w-full justify-start rounded-md mb-1 data-[state=active]:bg-tpa-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                                >
                                    Basic Info
                                </TabsTrigger>
                                <TabsTrigger
                                    value="general"
                                    className="w-full justify-start rounded-md mb-1 data-[state=active]:bg-tpa-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                                >
                                    General Conditions
                                </TabsTrigger>
                                <TabsTrigger
                                    value="maternity"
                                    className="w-full justify-start rounded-md mb-1 data-[state=active]:bg-tpa-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                                >
                                    Maternity Rules
                                </TabsTrigger>
                                <TabsTrigger
                                    value="waiting"
                                    className="w-full justify-start rounded-md mb-1 data-[state=active]:bg-tpa-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                                >
                                    Waiting Periods
                                </TabsTrigger>
                                <TabsTrigger
                                    value="special"
                                    className="w-full justify-start rounded-md mb-1 data-[state=active]:bg-tpa-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                                >
                                    Special Limits
                                </TabsTrigger>
                                <TabsTrigger
                                    value="category"
                                    className="w-full justify-start rounded-md mb-1 data-[state=active]:bg-tpa-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                                >
                                    Category Limits
                                </TabsTrigger>
                                <TabsTrigger
                                    value="chronic"
                                    className="w-full justify-start rounded-md mb-1 data-[state=active]:bg-tpa-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                                >
                                    Chronic Rules
                                </TabsTrigger>
                                <TabsTrigger
                                    value="preapproval"
                                    className="w-full justify-start rounded-md mb-1 data-[state=active]:bg-tpa-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                                >
                                    Preapproval Rules
                                </TabsTrigger>
                                <TabsTrigger
                                    value="providers"
                                    className="w-full justify-start rounded-md mb-1 data-[state=active]:bg-tpa-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                                >
                                    Provider Exceptions
                                </TabsTrigger>
                                <TabsTrigger
                                    value="exclusions"
                                    className="w-full justify-start rounded-md mb-1 data-[state=active]:bg-tpa-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                                >
                                    Exclusions
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto bg-white">
                            <div className="p-6">
                                <TabsContent value="basic" className="mt-0">
                                    <PolicyBasicInfoTab
                                        formData={formData}
                                        setFormData={setFormData}
                                        isEditing={!!policyId}
                                        policyTypes={policyTypes}
                                        policyCategories={policyCategories}
                                        pricingModels={pricingModels}
                                        networkTypes={networkTypes}
                                        loadingLookups={loadingLookups}
                                    />
                                </TabsContent>

                                <TabsContent value="general" className="mt-0">
                                    <PolicyGeneralConditionsTab policyId={policy?.id || policyId || null} />
                                </TabsContent>

                                <TabsContent value="maternity" className="mt-0">
                                    <PolicyMaternityRulesTab policyId={policy?.id || policyId || null} />
                                </TabsContent>

                                <TabsContent value="waiting" className="mt-0">
                                    <PolicyWaitingPeriodsTab policyId={policy?.id || policyId || null} />
                                </TabsContent>

                                <TabsContent value="special" className="mt-0">
                                    <PolicySpecialLimitsTab policyId={policy?.id || policyId || null} />
                                </TabsContent>

                                <TabsContent value="category" className="mt-0">
                                    <PolicyCategoryLimitsTab policyId={policy?.id || policyId || null} />
                                </TabsContent>

                                <TabsContent value="chronic" className="mt-0">
                                    <PolicyChronicRulesTab policyId={policy?.id || policyId || null} />
                                </TabsContent>

                                <TabsContent value="preapproval" className="mt-0">
                                    <PolicyPreapprovalRulesTab policyId={policy?.id || policyId || null} />
                                </TabsContent>

                                <TabsContent value="providers" className="mt-0">
                                    <PolicyProviderExceptionsTab policyId={policy?.id || policyId || null} />
                                </TabsContent>

                                <TabsContent value="exclusions" className="mt-0">
                                    <PolicyExclusionsTab policyId={policy?.id || policyId || null} />
                                </TabsContent>
                            </div>
                        </div>
                    </div>
                </Tabs>
            </div>
        </div>
    )
}

