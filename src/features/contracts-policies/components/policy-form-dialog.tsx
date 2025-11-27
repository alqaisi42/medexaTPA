'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Policy, PolicyPayload } from '@/types/policy'
import { SearchableSelect } from '@/components/ui/searchable-select'
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

interface PolicyFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    policy: Policy | null
    isEditing: boolean
    onSave: (payload: PolicyPayload) => Promise<void>
    saving: boolean
    error: string | null
    policyTypes: LookupRecord[]
    policyCategories: LookupRecord[]
    pricingModels: LookupRecord[]
    networkTypes: LookupRecord[]
    loadingLookups: boolean
}

export function PolicyFormDialog({
    open,
    onOpenChange,
    policy,
    isEditing,
    onSave,
    saving,
    error,
    policyTypes,
    policyCategories,
    pricingModels,
    networkTypes,
    loadingLookups,
}: PolicyFormDialogProps) {
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

    // Initialize form data when policy changes
    useEffect(() => {
        if (policy && isEditing) {
            setFormData({
                policyCode: policy.policyCode,
                employerId: policy.employerId,
                insuranceCompanyId: policy.insuranceCompanyId,
                policyType: policy.policyType,
                policyCategory: policy.policyCategory,
                startDate: Array.isArray(policy.startDate)
                    ? `${policy.startDate[0]}-${String(policy.startDate[1]).padStart(2, '0')}-${String(policy.startDate[2]).padStart(2, '0')}`
                    : policy.startDate || null,
                endDate: Array.isArray(policy.endDate)
                    ? `${policy.endDate[0]}-${String(policy.endDate[1]).padStart(2, '0')}-${String(policy.endDate[2]).padStart(2, '0')}`
                    : policy.endDate || null,
                effectiveFrom: policy.effectiveFrom,
                effectiveTo: policy.effectiveTo,
                globalLimit: policy.globalLimit,
                inpatientLimit: policy.inpatientLimit,
                outpatientLimit: policy.outpatientLimit,
                pharmacyLimit: policy.pharmacyLimit,
                maternityLimit: policy.maternityLimit,
                dentalLimit: policy.dentalLimit,
                opticalLimit: policy.opticalLimit,
                hasMaternity: policy.hasMaternity,
                hasDental: policy.hasDental,
                hasOptical: policy.hasOptical,
                hasPharmacy: policy.hasPharmacy,
                pricingModel: policy.pricingModel,
                networkType: policy.networkType,
                isActive: policy.isActive,
            })
        } else {
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
        setActiveTab('basic')
    }, [policy, isEditing, open])

    const handleSave = async () => {
        if (!formData.employerId) {
            return
        }
        await onSave(formData)
        // Note: After save, the parent component should update the policy and pass it back
        // so tabs can access the policy ID
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Policy' : 'Create New Policy'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the policy details below. Use tabs to configure different aspects of the policy.'
                            : 'Fill in the details to create a new policy. Use tabs to configure different aspects of the policy.'}
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid grid-cols-10 w-full overflow-x-auto">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="general">General Conditions</TabsTrigger>
                        <TabsTrigger value="maternity">Maternity</TabsTrigger>
                        <TabsTrigger value="waiting">Waiting Periods</TabsTrigger>
                        <TabsTrigger value="special">Special Limits</TabsTrigger>
                        <TabsTrigger value="category">Category Limits</TabsTrigger>
                        <TabsTrigger value="chronic">Chronic Rules</TabsTrigger>
                        <TabsTrigger value="preapproval">Preapproval</TabsTrigger>
                        <TabsTrigger value="providers">Provider Exceptions</TabsTrigger>
                        <TabsTrigger value="exclusions">Exclusions</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto mt-4">
                        <TabsContent value="basic" className="mt-0">
                            <PolicyBasicInfoTab
                                formData={formData}
                                setFormData={setFormData}
                                isEditing={isEditing}
                                policyTypes={policyTypes}
                                policyCategories={policyCategories}
                                pricingModels={pricingModels}
                                networkTypes={networkTypes}
                                loadingLookups={loadingLookups}
                            />
                        </TabsContent>

                        <TabsContent value="general" className="mt-0">
                            <PolicyGeneralConditionsTab policyId={policy?.id || null} />
                        </TabsContent>

                        <TabsContent value="maternity" className="mt-0">
                            <PolicyMaternityRulesTab policyId={policy?.id || null} />
                        </TabsContent>

                        <TabsContent value="waiting" className="mt-0">
                            <PolicyWaitingPeriodsTab policyId={policy?.id || null} />
                        </TabsContent>

                        <TabsContent value="special" className="mt-0">
                            <PolicySpecialLimitsTab policyId={policy?.id || null} />
                        </TabsContent>

                        <TabsContent value="category" className="mt-0">
                            <PolicyCategoryLimitsTab policyId={policy?.id || null} />
                        </TabsContent>

                        <TabsContent value="chronic" className="mt-0">
                            <PolicyChronicRulesTab policyId={policy?.id || null} />
                        </TabsContent>

                        <TabsContent value="preapproval" className="mt-0">
                            <PolicyPreapprovalRulesTab policyId={policy?.id || null} />
                        </TabsContent>

                        <TabsContent value="providers" className="mt-0">
                            <PolicyProviderExceptionsTab policyId={policy?.id || null} />
                        </TabsContent>

                        <TabsContent value="exclusions" className="mt-0">
                            <PolicyExclusionsTab policyId={policy?.id || null} />
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="gap-2 mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving || loadingLookups} className="min-w-[120px]">
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            isEditing ? 'Update Policy' : 'Create Policy'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

