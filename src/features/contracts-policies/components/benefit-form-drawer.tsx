'use client'

import { useState, useEffect } from 'react'
import { Save, X, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
    PlanBenefit,
    PlanBenefitPayload,
    PlanBenefitUpdatePayload,
    MasterBenefit,
    CoverageStatus,
    GenderScope,
    SubscriberEligibilityType,
    PreExistingBasis,
    LimitPeriod,
    CopayType,
    FrequencyUnit,
} from '@/types/plan'
import { addBenefitToPlan, updatePlanBenefit } from '@/lib/api/plans'

interface BenefitFormDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    planId: number
    benefit?: PlanBenefit | null
    masterBenefits: MasterBenefit[]
    mode: 'add' | 'edit'
    onSaved: () => void
}

export function BenefitFormDrawer({
    open,
    onOpenChange,
    planId,
    benefit,
    masterBenefits,
    mode,
    onSaved,
}: BenefitFormDrawerProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedMasterBenefit, setSelectedMasterBenefit] = useState<MasterBenefit | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        // Coverage section
        coverageStatus: 'COVERED' as CoverageStatus,
        waitingPeriodDays: 0,
        genderScope: 'BOTH' as GenderScope,
        minAgeMonths: null as number | null,
        maxAgeMonths: null as number | null,
        maxAgeYears: null as number | null,
        subscriberEligibilityType: 'ALL' as SubscriberEligibilityType,
        coverPreExisting: true,
        preExistingBasis: 'JOINING_DATE' as PreExistingBasis,
        isCoverageDriver: false,
        isExclusionDriver: false,

        // Limits section
        limitAmount: null as number | null,
        limitPeriod: 'PER_YEAR' as LimitPeriod,
        amountLimitScope: 'PER_YEAR',
        sessionLimit: null as number | null,
        limitInNetwork: null as number | null,
        limitOutNetwork: null as number | null,
        isLimitDriver: false,

        // Copay section
        copayType: null as CopayType | null,
        copayValue: null as number | null,
        minCopayAmount: null as number | null,
        maxCopayAmount: null as number | null,
        copayInNetwork: null as number | null,
        copayOutNetwork: null as number | null,

        // Preauth section
        requiresPreauth: false,
        preauthThresholdAmount: null as number | null,

        // Rules section
        basketId: null as number | null,
        requiredDoctorSpecialtyId: null as number | null,
        frequencyValue: null as number | null,
        frequencyUnit: null as FrequencyUnit | null,
        frequencyDuration: null as number | null,
        linkToCaseType: null as string | null,
    })

    // Initialize form data when benefit changes
    useEffect(() => {
        if (mode === 'edit' && benefit) {
            setFormData({
                coverageStatus: benefit.coverage.coverageStatus as CoverageStatus,
                waitingPeriodDays: benefit.coverage.waitingPeriodDays,
                genderScope: benefit.coverage.genderScope as GenderScope,
                minAgeMonths: benefit.coverage.minAgeMonths,
                maxAgeMonths: benefit.coverage.maxAgeMonths,
                maxAgeYears: benefit.coverage.maxAgeYears,
                subscriberEligibilityType: benefit.coverage.subscriberEligibilityType as SubscriberEligibilityType,
                coverPreExisting: benefit.coverage.coverPreExisting,
                preExistingBasis: benefit.coverage.preExistingBasis as PreExistingBasis,
                isCoverageDriver: benefit.coverage.isCoverageDriver,
                isExclusionDriver: benefit.coverage.isExclusionDriver,

                limitAmount: benefit.limits.limitAmount,
                limitPeriod: benefit.limits.limitPeriod as LimitPeriod,
                amountLimitScope: benefit.limits.amountLimitScope,
                sessionLimit: benefit.limits.sessionLimit,
                limitInNetwork: benefit.limits.limitInNetwork,
                limitOutNetwork: benefit.limits.limitOutNetwork,
                isLimitDriver: benefit.limits.isLimitDriver,

                copayType: benefit.copay.copayType as CopayType | null,
                copayValue: benefit.copay.copayValue,
                minCopayAmount: benefit.copay.minCopayAmount,
                maxCopayAmount: benefit.copay.maxCopayAmount,
                copayInNetwork: benefit.copay.copayInNetwork,
                copayOutNetwork: benefit.copay.copayOutNetwork,

                requiresPreauth: benefit.rules.requiresPreauth,
                preauthThresholdAmount: benefit.rules.preauthThresholdAmount,
                basketId: benefit.rules.basketId,
                requiredDoctorSpecialtyId: benefit.rules.requiredDoctorSpecialtyId,
                frequencyValue: benefit.rules.frequencyValue,
                frequencyUnit: benefit.rules.frequencyUnit as FrequencyUnit | null,
                frequencyDuration: benefit.rules.frequencyDuration,
                linkToCaseType: benefit.rules.linkToCaseType,
            })

            // Find the master benefit
            const masterBenefit = masterBenefits.find(mb => mb.id === benefit.benefitId)
            setSelectedMasterBenefit(masterBenefit || null)
        } else {
            // Reset form for add mode
            setFormData({
                coverageStatus: 'COVERED',
                waitingPeriodDays: 0,
                genderScope: 'BOTH',
                minAgeMonths: null,
                maxAgeMonths: null,
                maxAgeYears: null,
                subscriberEligibilityType: 'ALL',
                coverPreExisting: true,
                preExistingBasis: 'JOINING_DATE',
                isCoverageDriver: false,
                isExclusionDriver: false,

                limitAmount: null,
                limitPeriod: 'PER_YEAR',
                amountLimitScope: 'PER_YEAR',
                sessionLimit: null,
                limitInNetwork: null,
                limitOutNetwork: null,
                isLimitDriver: false,

                copayType: null,
                copayValue: null,
                minCopayAmount: null,
                maxCopayAmount: null,
                copayInNetwork: null,
                copayOutNetwork: null,

                requiresPreauth: false,
                preauthThresholdAmount: null,
                basketId: null,
                requiredDoctorSpecialtyId: null,
                frequencyValue: null,
                frequencyUnit: null,
                frequencyDuration: null,
                linkToCaseType: null,
            })
            setSelectedMasterBenefit(null)
        }
    }, [mode, benefit, masterBenefits])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (mode === 'add') {
                if (!selectedMasterBenefit) {
                    throw new Error('Please select a benefit')
                }

                const payload: PlanBenefitPayload = {
                    benefitId: selectedMasterBenefit.id,
                    coverage: {
                        coverageStatus: formData.coverageStatus,
                        waitingPeriodDays: formData.waitingPeriodDays,
                        genderScope: formData.genderScope,
                        minAgeMonths: formData.minAgeMonths,
                        maxAgeMonths: formData.maxAgeMonths,
                        maxAgeYears: formData.maxAgeYears,
                        subscriberEligibilityType: formData.subscriberEligibilityType,
                        coverPreExisting: formData.coverPreExisting,
                        preExistingBasis: formData.preExistingBasis,
                        usageFlags: {
                            copay: formData.copayType !== null && formData.copayType !== 'NONE',
                            limit: formData.limitAmount !== null,
                            coverage: formData.coverageStatus === 'COVERED',
                        },
                        isCoverageDriver: formData.isCoverageDriver,
                        isExclusionDriver: formData.isExclusionDriver,
                    },
                    limits: {
                        limitAmount: formData.limitAmount,
                        limitPeriod: formData.limitPeriod,
                        amountLimitScope: formData.amountLimitScope,
                        sessionLimit: formData.sessionLimit,
                        limitInNetwork: formData.limitInNetwork,
                        limitOutNetwork: formData.limitOutNetwork,
                        isLimitDriver: formData.isLimitDriver,
                    },
                    copay: {
                        copayType: formData.copayType,
                        copayValue: formData.copayValue,
                        minCopayAmount: formData.minCopayAmount,
                        maxCopayAmount: formData.maxCopayAmount,
                        copayInNetwork: formData.copayInNetwork,
                        copayOutNetwork: formData.copayOutNetwork,
                    },
                    rules: {
                        requiresPreauth: formData.requiresPreauth,
                        preauthThresholdAmount: formData.preauthThresholdAmount,
                        basketId: formData.basketId,
                        requiredDoctorSpecialtyId: formData.requiredDoctorSpecialtyId,
                        frequencyValue: formData.frequencyValue,
                        frequencyUnit: formData.frequencyUnit,
                        frequencyDuration: formData.frequencyDuration,
                        linkToCaseType: formData.linkToCaseType,
                    },
                }

                await addBenefitToPlan(planId, payload)
            } else if (mode === 'edit' && benefit) {
                const payload: PlanBenefitUpdatePayload = {
                    benefitId: benefit.benefitId,
                    coverage: {
                        coverageStatus: formData.coverageStatus,
                        waitingPeriodDays: formData.waitingPeriodDays,
                        genderScope: formData.genderScope,
                        minAgeMonths: formData.minAgeMonths,
                        maxAgeMonths: formData.maxAgeMonths,
                        maxAgeYears: formData.maxAgeYears,
                        subscriberEligibilityType: formData.subscriberEligibilityType,
                        coverPreExisting: formData.coverPreExisting,
                        preExistingBasis: formData.preExistingBasis,
                        usageFlags: {
                            copay: formData.copayType !== null && formData.copayType !== 'NONE',
                            limit: formData.limitAmount !== null,
                            coverage: formData.coverageStatus === 'COVERED',
                        },
                        isCoverageDriver: formData.isCoverageDriver,
                        isExclusionDriver: formData.isExclusionDriver,
                    },
                    limits: {
                        limitAmount: formData.limitAmount,
                        limitPeriod: formData.limitPeriod,
                        amountLimitScope: formData.amountLimitScope,
                        sessionLimit: formData.sessionLimit,
                        limitInNetwork: formData.limitInNetwork,
                        limitOutNetwork: formData.limitOutNetwork,
                        isLimitDriver: formData.isLimitDriver,
                    },
                    copay: {
                        copayType: formData.copayType,
                        copayValue: formData.copayValue,
                        minCopayAmount: formData.minCopayAmount,
                        maxCopayAmount: formData.maxCopayAmount,
                        copayInNetwork: formData.copayInNetwork,
                        copayOutNetwork: formData.copayOutNetwork,
                    },
                    rules: {
                        requiresPreauth: formData.requiresPreauth,
                        preauthThresholdAmount: formData.preauthThresholdAmount,
                        basketId: formData.basketId,
                        requiredDoctorSpecialtyId: formData.requiredDoctorSpecialtyId,
                        frequencyValue: formData.frequencyValue,
                        frequencyUnit: formData.frequencyUnit,
                        frequencyDuration: formData.frequencyDuration,
                        linkToCaseType: formData.linkToCaseType,
                    },
                }

                await updatePlanBenefit(planId, benefit.id, payload)
            }

            onSaved()
        } catch (err) {
            console.error('Failed to save benefit', err)
            setError(err instanceof Error ? err.message : 'Unable to save benefit')
        } finally {
            setLoading(false)
        }
    }

    const masterBenefitOptions = masterBenefits.map(benefit => ({
        id: benefit.id,
        label: `${benefit.code} - ${benefit.nameEn}`,
        subLabel: benefit.nameAr || undefined,
    }))

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>
                        {mode === 'add' ? 'Add Benefit to Plan' : 'Edit Plan Benefit'}
                    </SheetTitle>
                    <SheetDescription>
                        {mode === 'add' 
                            ? 'Configure a new benefit for this insurance plan'
                            : 'Update the benefit configuration for this plan'
                        }
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    {/* Benefit Selection (Add mode only) */}
                    {mode === 'add' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Select Benefit</CardTitle>
                                <CardDescription>Choose a benefit from the master list</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label>Master Benefit *</Label>
                                    <SearchableSelect
                                        options={masterBenefitOptions}
                                        value={selectedMasterBenefit?.id || ''}
                                        onValueChange={(value) => {
                                            const benefit = masterBenefits.find(b => b.id === value)
                                            setSelectedMasterBenefit(benefit || null)
                                        }}
                                        placeholder="Search and select a benefit..."
                                        emptyMessage="No benefits found"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Coverage Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Coverage</CardTitle>
                            <CardDescription>Configure coverage settings and eligibility</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Coverage Status</Label>
                                    <Select 
                                        value={formData.coverageStatus} 
                                        onValueChange={(value: CoverageStatus) => 
                                            setFormData(prev => ({ ...prev, coverageStatus: value }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="COVERED">Covered</SelectItem>
                                            <SelectItem value="NOT_COVERED">Not Covered</SelectItem>
                                            <SelectItem value="EXCLUDED">Excluded</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Waiting Period (Days)</Label>
                                    <Input
                                        type="number"
                                        value={formData.waitingPeriodDays}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            waitingPeriodDays: parseInt(e.target.value) || 0 
                                        }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gender Scope</Label>
                                    <Select 
                                        value={formData.genderScope} 
                                        onValueChange={(value: GenderScope) => 
                                            setFormData(prev => ({ ...prev, genderScope: value }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BOTH">Both</SelectItem>
                                            <SelectItem value="MALE">Male Only</SelectItem>
                                            <SelectItem value="FEMALE">Female Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Subscriber Eligibility</Label>
                                    <Select 
                                        value={formData.subscriberEligibilityType} 
                                        onValueChange={(value: SubscriberEligibilityType) => 
                                            setFormData(prev => ({ ...prev, subscriberEligibilityType: value }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Members</SelectItem>
                                            <SelectItem value="SUBSCRIBER_ONLY">Subscriber Only</SelectItem>
                                            <SelectItem value="DEPENDENTS_ONLY">Dependents Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Min Age (Months)</Label>
                                    <Input
                                        type="number"
                                        value={formData.minAgeMonths || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            minAgeMonths: e.target.value ? parseInt(e.target.value) : null 
                                        }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Age (Months)</Label>
                                    <Input
                                        type="number"
                                        value={formData.maxAgeMonths || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            maxAgeMonths: e.target.value ? parseInt(e.target.value) : null 
                                        }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Age (Years)</Label>
                                    <Input
                                        type="number"
                                        value={formData.maxAgeYears || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            maxAgeYears: e.target.value ? parseInt(e.target.value) : null 
                                        }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="coverPreExisting"
                                        checked={formData.coverPreExisting}
                                        onCheckedChange={(checked) => 
                                            setFormData(prev => ({ ...prev, coverPreExisting: checked }))
                                        }
                                    />
                                    <Label htmlFor="coverPreExisting">Cover Pre-existing Conditions</Label>
                                </div>

                                {formData.coverPreExisting && (
                                    <div className="space-y-2">
                                        <Label>Pre-existing Basis</Label>
                                        <Select 
                                            value={formData.preExistingBasis} 
                                            onValueChange={(value: PreExistingBasis) => 
                                                setFormData(prev => ({ ...prev, preExistingBasis: value }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="JOINING_DATE">From Joining Date</SelectItem>
                                                <SelectItem value="POLICY_START">From Policy Start</SelectItem>
                                                <SelectItem value="NEVER">Never</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isCoverageDriver"
                                        checked={formData.isCoverageDriver}
                                        onCheckedChange={(checked) => 
                                            setFormData(prev => ({ ...prev, isCoverageDriver: checked }))
                                        }
                                    />
                                    <Label htmlFor="isCoverageDriver">Is Coverage Driver</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isExclusionDriver"
                                        checked={formData.isExclusionDriver}
                                        onCheckedChange={(checked) => 
                                            setFormData(prev => ({ ...prev, isExclusionDriver: checked }))
                                        }
                                    />
                                    <Label htmlFor="isExclusionDriver">Is Exclusion Driver</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Limits Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Limits</CardTitle>
                            <CardDescription>Configure benefit limits and restrictions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Limit Amount</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.limitAmount || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            limitAmount: e.target.value ? parseFloat(e.target.value) : null 
                                        }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Limit Period</Label>
                                    <Select 
                                        value={formData.limitPeriod} 
                                        onValueChange={(value: LimitPeriod) => 
                                            setFormData(prev => ({ ...prev, limitPeriod: value }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PER_YEAR">Per Year</SelectItem>
                                            <SelectItem value="PER_MONTH">Per Month</SelectItem>
                                            <SelectItem value="PER_VISIT">Per Visit</SelectItem>
                                            <SelectItem value="LIFETIME">Lifetime</SelectItem>
                                            <SelectItem value="PER_CASE">Per Case</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Session Limit</Label>
                                    <Input
                                        type="number"
                                        value={formData.sessionLimit || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            sessionLimit: e.target.value ? parseInt(e.target.value) : null 
                                        }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>In-Network Limit</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.limitInNetwork || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            limitInNetwork: e.target.value ? parseFloat(e.target.value) : null 
                                        }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Out-Network Limit</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.limitOutNetwork || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            limitOutNetwork: e.target.value ? parseFloat(e.target.value) : null 
                                        }))}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isLimitDriver"
                                    checked={formData.isLimitDriver}
                                    onCheckedChange={(checked) => 
                                        setFormData(prev => ({ ...prev, isLimitDriver: checked }))
                                    }
                                />
                                <Label htmlFor="isLimitDriver">Is Limit Driver</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Copay Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Copay</CardTitle>
                            <CardDescription>Configure copayment settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Copay Type</Label>
                                    <Select 
                                        value={formData.copayType || ''} 
                                        onValueChange={(value) => 
                                            setFormData(prev => ({ 
                                                ...prev, 
                                                copayType: value === '' ? null : value as CopayType 
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="No copay" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">No Copay</SelectItem>
                                            <SelectItem value="FIXED">Fixed Amount</SelectItem>
                                            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.copayType && (
                                    <div className="space-y-2">
                                        <Label>Copay Value</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.copayValue || ''}
                                            onChange={(e) => setFormData(prev => ({ 
                                                ...prev, 
                                                copayValue: e.target.value ? parseFloat(e.target.value) : null 
                                            }))}
                                        />
                                    </div>
                                )}
                            </div>

                            {formData.copayType && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Min Copay Amount</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.minCopayAmount || ''}
                                            onChange={(e) => setFormData(prev => ({ 
                                                ...prev, 
                                                minCopayAmount: e.target.value ? parseFloat(e.target.value) : null 
                                            }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Max Copay Amount</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.maxCopayAmount || ''}
                                            onChange={(e) => setFormData(prev => ({ 
                                                ...prev, 
                                                maxCopayAmount: e.target.value ? parseFloat(e.target.value) : null 
                                            }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>In-Network Copay</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.copayInNetwork || ''}
                                            onChange={(e) => setFormData(prev => ({ 
                                                ...prev, 
                                                copayInNetwork: e.target.value ? parseFloat(e.target.value) : null 
                                            }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Out-Network Copay</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.copayOutNetwork || ''}
                                            onChange={(e) => setFormData(prev => ({ 
                                                ...prev, 
                                                copayOutNetwork: e.target.value ? parseFloat(e.target.value) : null 
                                            }))}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Preauth Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Preauthorization</CardTitle>
                            <CardDescription>Configure preauthorization requirements</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="requiresPreauth"
                                    checked={formData.requiresPreauth}
                                    onCheckedChange={(checked) => 
                                        setFormData(prev => ({ ...prev, requiresPreauth: checked }))
                                    }
                                />
                                <Label htmlFor="requiresPreauth">Requires Preauthorization</Label>
                            </div>

                            {formData.requiresPreauth && (
                                <div className="space-y-2">
                                    <Label>Preauth Threshold Amount</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.preauthThresholdAmount || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            preauthThresholdAmount: e.target.value ? parseFloat(e.target.value) : null 
                                        }))}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Advanced Rules Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Advanced Rules</CardTitle>
                            <CardDescription>Configure additional benefit rules and restrictions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Basket ID</Label>
                                    <Input
                                        type="number"
                                        value={formData.basketId || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            basketId: e.target.value ? parseInt(e.target.value) : null 
                                        }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Required Doctor Specialty ID</Label>
                                    <Input
                                        type="number"
                                        value={formData.requiredDoctorSpecialtyId || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            requiredDoctorSpecialtyId: e.target.value ? parseInt(e.target.value) : null 
                                        }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Frequency Value</Label>
                                    <Input
                                        type="number"
                                        value={formData.frequencyValue || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            frequencyValue: e.target.value ? parseInt(e.target.value) : null 
                                        }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Frequency Unit</Label>
                                    <Select 
                                        value={formData.frequencyUnit || ''} 
                                        onValueChange={(value) => 
                                            setFormData(prev => ({ 
                                                ...prev, 
                                                frequencyUnit: value === '' ? null : value as FrequencyUnit 
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">No frequency</SelectItem>
                                            <SelectItem value="DAYS">Days</SelectItem>
                                            <SelectItem value="WEEKS">Weeks</SelectItem>
                                            <SelectItem value="MONTHS">Months</SelectItem>
                                            <SelectItem value="YEARS">Years</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Frequency Duration</Label>
                                    <Input
                                        type="number"
                                        value={formData.frequencyDuration || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            frequencyDuration: e.target.value ? parseInt(e.target.value) : null 
                                        }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Link to Case Type</Label>
                                <Input
                                    value={formData.linkToCaseType || ''}
                                    onChange={(e) => setFormData(prev => ({ 
                                        ...prev, 
                                        linkToCaseType: e.target.value || null 
                                    }))}
                                    placeholder="Enter case type"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || (mode === 'add' && !selectedMasterBenefit)}>
                            {loading ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {mode === 'add' ? 'Add Benefit' : 'Update Benefit'}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    )
}
