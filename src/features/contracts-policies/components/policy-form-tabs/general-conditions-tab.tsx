'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GeneralCondition, GeneralConditionPayload } from '@/types/policy'
import { fetchGeneralCondition, createGeneralCondition } from '@/lib/api/policies'

interface PolicyGeneralConditionsTabProps {
    policyId: number | null
}

export function PolicyGeneralConditionsTab({ policyId }: PolicyGeneralConditionsTabProps) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<GeneralCondition | null>(null)
    const [formData, setFormData] = useState<GeneralConditionPayload>({
        policyId: policyId || 0,
        minAgeYears: null,
        maxAgeYears: null,
        allowDependentsAfterHofDeath: false,
        newbornGraceDays: null,
        coverageScope: null,
        isInternationalCoverage: false,
        defaultCopayPercent: null,
        defaultDeductibleAmount: null,
        defaultCoinsurancePercent: null,
        annualLimit: null,
        lifetimeLimit: null,
        familyLimit: null,
        gracePeriodDays: null,
        maxClaimsPerDay: null,
        minGapBetweenVisitsDays: null,
        autoApproveChronic: false,
        autoApproveMaternityFollowups: false,
        termsEn: null,
        termsAr: null,
    })

    useEffect(() => {
        if (policyId) {
            loadData()
        } else {
            setData(null)
            setFormData({
                ...formData,
                policyId: 0,
            })
        }
    }, [policyId])

    const loadData = async () => {
        if (!policyId) return
        setLoading(true)
        setError(null)
        try {
            const result = await fetchGeneralCondition(policyId)
            if (result) {
                setData(result)
                setFormData({
                    policyId: result.policyId,
                    minAgeYears: result.minAgeYears,
                    maxAgeYears: result.maxAgeYears,
                    allowDependentsAfterHofDeath: result.allowDependentsAfterHofDeath,
                    newbornGraceDays: result.newbornGraceDays,
                    coverageScope: result.coverageScope,
                    isInternationalCoverage: result.isInternationalCoverage,
                    defaultCopayPercent: result.defaultCopayPercent,
                    defaultDeductibleAmount: result.defaultDeductibleAmount,
                    defaultCoinsurancePercent: result.defaultCoinsurancePercent,
                    annualLimit: result.annualLimit,
                    lifetimeLimit: result.lifetimeLimit,
                    familyLimit: result.familyLimit,
                    gracePeriodDays: result.gracePeriodDays,
                    maxClaimsPerDay: result.maxClaimsPerDay,
                    minGapBetweenVisitsDays: result.minGapBetweenVisitsDays,
                    autoApproveChronic: result.autoApproveChronic,
                    autoApproveMaternityFollowups: result.autoApproveMaternityFollowups,
                    termsEn: result.termsEn,
                    termsAr: result.termsAr,
                })
            } else {
                setData(null)
                setFormData({
                    ...formData,
                    policyId,
                })
            }
        } catch (err) {
            console.error('Failed to load general conditions', err)
            setError(err instanceof Error ? err.message : 'Unable to load general conditions')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!policyId) {
            setError('Policy ID is required')
            return
        }
        setSaving(true)
        setError(null)
        try {
            await createGeneralCondition({ ...formData, policyId })
            await loadData()
        } catch (err) {
            console.error('Failed to save general conditions', err)
            setError(err instanceof Error ? err.message : 'Unable to save general conditions')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {!policyId ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <p className="text-gray-500">Please save the policy first to configure general conditions</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="minAgeYears">Min Age (Years)</Label>
                            <Input
                                id="minAgeYears"
                                type="number"
                                value={formData.minAgeYears || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        minAgeYears: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxAgeYears">Max Age (Years)</Label>
                            <Input
                                id="maxAgeYears"
                                type="number"
                                value={formData.maxAgeYears || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        maxAgeYears: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newbornGraceDays">Newborn Grace Days</Label>
                            <Input
                                id="newbornGraceDays"
                                type="number"
                                value={formData.newbornGraceDays || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        newbornGraceDays: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="coverageScope">Coverage Scope</Label>
                            <Input
                                id="coverageScope"
                                value={formData.coverageScope || ''}
                                onChange={(e) => setFormData({ ...formData, coverageScope: e.target.value || null })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="defaultCopayPercent">Default Copay %</Label>
                            <Input
                                id="defaultCopayPercent"
                                type="number"
                                value={formData.defaultCopayPercent || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        defaultCopayPercent: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="defaultDeductibleAmount">Default Deductible</Label>
                            <Input
                                id="defaultDeductibleAmount"
                                type="number"
                                value={formData.defaultDeductibleAmount || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        defaultDeductibleAmount: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="defaultCoinsurancePercent">Default Coinsurance %</Label>
                            <Input
                                id="defaultCoinsurancePercent"
                                type="number"
                                value={formData.defaultCoinsurancePercent || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        defaultCoinsurancePercent: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="annualLimit">Annual Limit</Label>
                            <Input
                                id="annualLimit"
                                type="number"
                                value={formData.annualLimit || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        annualLimit: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lifetimeLimit">Lifetime Limit</Label>
                            <Input
                                id="lifetimeLimit"
                                type="number"
                                value={formData.lifetimeLimit || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        lifetimeLimit: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="familyLimit">Family Limit</Label>
                            <Input
                                id="familyLimit"
                                type="number"
                                value={formData.familyLimit || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        familyLimit: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gracePeriodDays">Grace Period (Days)</Label>
                            <Input
                                id="gracePeriodDays"
                                type="number"
                                value={formData.gracePeriodDays || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        gracePeriodDays: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxClaimsPerDay">Max Claims Per Day</Label>
                            <Input
                                id="maxClaimsPerDay"
                                type="number"
                                value={formData.maxClaimsPerDay || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        maxClaimsPerDay: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minGapBetweenVisitsDays">Min Gap Between Visits (Days)</Label>
                            <Input
                                id="minGapBetweenVisitsDays"
                                type="number"
                                value={formData.minGapBetweenVisitsDays || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        minGapBetweenVisitsDays: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Auto-Approval Settings</h3>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="allowDependentsAfterHofDeath"
                                    checked={formData.allowDependentsAfterHofDeath || false}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, allowDependentsAfterHofDeath: checked })
                                    }
                                />
                                <Label htmlFor="allowDependentsAfterHofDeath">Allow Dependents After HOF Death</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="isInternationalCoverage"
                                    checked={formData.isInternationalCoverage || false}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, isInternationalCoverage: checked })
                                    }
                                />
                                <Label htmlFor="isInternationalCoverage">International Coverage</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="autoApproveChronic"
                                    checked={formData.autoApproveChronic || false}
                                    onCheckedChange={(checked) => setFormData({ ...formData, autoApproveChronic: checked })}
                                />
                                <Label htmlFor="autoApproveChronic">Auto Approve Chronic</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="autoApproveMaternityFollowups"
                                    checked={formData.autoApproveMaternityFollowups || false}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, autoApproveMaternityFollowups: checked })
                                    }
                                />
                                <Label htmlFor="autoApproveMaternityFollowups">Auto Approve Maternity Followups</Label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Terms & Conditions</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="termsEn">Terms (English)</Label>
                                <Textarea
                                    id="termsEn"
                                    value={formData.termsEn || ''}
                                    onChange={(e) => setFormData({ ...formData, termsEn: e.target.value || null })}
                                    rows={4}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="termsAr">Terms (Arabic)</Label>
                                <Textarea
                                    id="termsAr"
                                    value={formData.termsAr || ''}
                                    onChange={(e) => setFormData({ ...formData, termsAr: e.target.value || null })}
                                    rows={4}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : data ? (
                                'Update General Conditions'
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create General Conditions
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

