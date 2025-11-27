'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { MaternityRule, MaternityRulePayload } from '@/types/policy'
import { fetchMaternityRule, createMaternityRule } from '@/lib/api/policies'

interface PolicyMaternityRulesTabProps {
    policyId: number | null
}

export function PolicyMaternityRulesTab({ policyId }: PolicyMaternityRulesTabProps) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<MaternityRule | null>(null)
    const [formData, setFormData] = useState<MaternityRulePayload>({
        policyId: policyId || 0,
        waitingDays: null,
        requiresMarriage: false,
        coversNormalDelivery: false,
        coversCSection: false,
        coversComplications: false,
        coversIvf: false,
        perPregnancyLimit: null,
        annualLimit: null,
        maxPregnancies: null,
        requiresPreapproval: false,
        newbornCoverageDays: null,
        pricingModel: null,
        packagePrice: null,
        notes: null,
    })

    useEffect(() => {
        if (policyId) {
            loadData()
        } else {
            setData(null)
            setFormData({ ...formData, policyId: 0 })
        }
    }, [policyId])

    const loadData = async () => {
        if (!policyId) return
        setLoading(true)
        setError(null)
        try {
            const result = await fetchMaternityRule(policyId)
            if (result) {
                setData(result)
                setFormData({
                    policyId: result.policyId,
                    waitingDays: result.waitingDays,
                    requiresMarriage: result.requiresMarriage,
                    coversNormalDelivery: result.coversNormalDelivery,
                    coversCSection: result.coversCSection,
                    coversComplications: result.coversComplications,
                    coversIvf: result.coversIvf,
                    perPregnancyLimit: result.perPregnancyLimit,
                    annualLimit: result.annualLimit,
                    maxPregnancies: result.maxPregnancies,
                    requiresPreapproval: result.requiresPreapproval,
                    newbornCoverageDays: result.newbornCoverageDays,
                    pricingModel: result.pricingModel,
                    packagePrice: result.packagePrice,
                    notes: result.notes,
                })
            } else {
                setData(null)
                setFormData({ ...formData, policyId })
            }
        } catch (err) {
            console.error('Failed to load maternity rules', err)
            setError(err instanceof Error ? err.message : 'Unable to load maternity rules')
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
            await createMaternityRule({ ...formData, policyId })
            await loadData()
        } catch (err) {
            console.error('Failed to save maternity rules', err)
            setError(err instanceof Error ? err.message : 'Unable to save maternity rules')
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
                        <p className="text-gray-500">Please save the policy first to configure maternity rules</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="waitingDays">Waiting Days</Label>
                            <Input
                                id="waitingDays"
                                type="number"
                                value={formData.waitingDays || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        waitingDays: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newbornCoverageDays">Newborn Coverage Days</Label>
                            <Input
                                id="newbornCoverageDays"
                                type="number"
                                value={formData.newbornCoverageDays || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        newbornCoverageDays: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="perPregnancyLimit">Per Pregnancy Limit</Label>
                            <Input
                                id="perPregnancyLimit"
                                type="number"
                                value={formData.perPregnancyLimit || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        perPregnancyLimit: e.target.value ? Number(e.target.value) : null,
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
                            <Label htmlFor="maxPregnancies">Max Pregnancies</Label>
                            <Input
                                id="maxPregnancies"
                                type="number"
                                value={formData.maxPregnancies || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        maxPregnancies: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pricingModel">Pricing Model</Label>
                            <Input
                                id="pricingModel"
                                value={formData.pricingModel || ''}
                                onChange={(e) => setFormData({ ...formData, pricingModel: e.target.value || null })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="packagePrice">Package Price</Label>
                            <Input
                                id="packagePrice"
                                type="number"
                                value={formData.packagePrice || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        packagePrice: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Coverage Options</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="requiresMarriage"
                                    checked={formData.requiresMarriage || false}
                                    onCheckedChange={(checked) => setFormData({ ...formData, requiresMarriage: checked })}
                                />
                                <Label htmlFor="requiresMarriage">Requires Marriage</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="coversNormalDelivery"
                                    checked={formData.coversNormalDelivery || false}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, coversNormalDelivery: checked })
                                    }
                                />
                                <Label htmlFor="coversNormalDelivery">Covers Normal Delivery</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="coversCSection"
                                    checked={formData.coversCSection || false}
                                    onCheckedChange={(checked) => setFormData({ ...formData, coversCSection: checked })}
                                />
                                <Label htmlFor="coversCSection">Covers C-Section</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="coversComplications"
                                    checked={formData.coversComplications || false}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, coversComplications: checked })
                                    }
                                />
                                <Label htmlFor="coversComplications">Covers Complications</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="coversIvf"
                                    checked={formData.coversIvf || false}
                                    onCheckedChange={(checked) => setFormData({ ...formData, coversIvf: checked })}
                                />
                                <Label htmlFor="coversIvf">Covers IVF</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="requiresPreapproval"
                                    checked={formData.requiresPreapproval || false}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, requiresPreapproval: checked })
                                    }
                                />
                                <Label htmlFor="requiresPreapproval">Requires Preapproval</Label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : data ? (
                                'Update Maternity Rules'
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Maternity Rules
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

