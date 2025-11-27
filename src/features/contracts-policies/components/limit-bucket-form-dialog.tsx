'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, RefreshCw, AlertCircle, Plus, Trash2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { LimitBucketDetail, LimitBucketPayload, LimitBucketItemPayload, MasterBenefit, LimitPeriod } from '@/types/plan'
import { createLimitBucket, updateLimitBucket, fetchMasterBenefits } from '@/lib/api/plans'

interface LimitBucketFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    planId: number
    mode: 'create' | 'edit'
    bucket?: LimitBucketDetail | null
    onSaved: () => void
}

export function LimitBucketFormDialog({
    open,
    onOpenChange,
    planId,
    mode,
    bucket,
    onSaved,
}: LimitBucketFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [masterBenefits, setMasterBenefits] = useState<MasterBenefit[]>([])

    // Form state
    const [formData, setFormData] = useState({
        nameEn: '',
        limitAmount: 0,
        limitPeriod: 'PER_YEAR' as LimitPeriod,
        deductFromAnnualLimit: true,
        items: [] as LimitBucketItemPayload[],
    })

    // Load master benefits for selection
    const loadMasterBenefits = useCallback(async () => {
        try {
            const response = await fetchMasterBenefits()
            if (response.success && response.data) {
                setMasterBenefits(response.data.content)
            }
        } catch (err) {
            console.error('Failed to load master benefits', err)
        }
    }, [])

    useEffect(() => {
        if (open) {
            void loadMasterBenefits()
        }
    }, [open, loadMasterBenefits])

    // Initialize form data when bucket changes
    useEffect(() => {
        if (mode === 'edit' && bucket) {
            setFormData({
                nameEn: bucket.nameEn,
                limitAmount: bucket.limitAmount,
                limitPeriod: bucket.limitPeriod as LimitPeriod,
                deductFromAnnualLimit: bucket.deductFromAnnualLimit,
                items: bucket.items.map(item => ({
                    benefitId: item.benefitId || null,
                    medicalBasket: item.medicalBasket?.code || null,
                    procedureId: item.procedureId || null,
                    drugId: item.drugId || null,
                })),
            })
        } else {
            // Reset form for create mode
            setFormData({
                nameEn: '',
                limitAmount: 0,
                limitPeriod: 'PER_YEAR',
                deductFromAnnualLimit: true,
                items: [],
            })
        }
        setError(null)
    }, [mode, bucket, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const payload: LimitBucketPayload = {
                nameEn: formData.nameEn.trim(),
                limitAmount: formData.limitAmount,
                limitPeriod: formData.limitPeriod,
                deductFromAnnualLimit: formData.deductFromAnnualLimit,
                items: formData.items,
            }

            if (mode === 'create') {
                await createLimitBucket(planId, payload)
            } else if (mode === 'edit' && bucket) {
                await updateLimitBucket(planId, bucket.id, payload)
            }

            onSaved()
        } catch (err) {
            console.error('Failed to save limit bucket', err)
            setError(err instanceof Error ? err.message : 'Unable to save limit bucket')
        } finally {
            setLoading(false)
        }
    }

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                benefitId: null,
                medicalBasket: null,
                procedureId: null,
                drugId: null,
            }],
        }))
    }

    const handleRemoveItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }))
    }

    const handleUpdateItem = (index: number, field: keyof LimitBucketItemPayload, value: any) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => 
                i === index ? { ...item, [field]: value } : item
            ),
        }))
    }

    const masterBenefitOptions = masterBenefits.map(benefit => ({
        id: benefit.id,
        label: `${benefit.code} - ${benefit.nameEn}`,
        subLabel: benefit.nameAr || undefined,
    }))

    const isFormValid = formData.nameEn.trim() && formData.limitAmount > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Create Limit Bucket' : 'Edit Limit Bucket'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'create' 
                            ? 'Create a new shared limit bucket for this plan'
                            : 'Update the limit bucket configuration'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nameEn">Bucket Name *</Label>
                                <Input
                                    id="nameEn"
                                    value={formData.nameEn}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                                    placeholder="e.g., Optical Hardware Limit"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="limitAmount">Limit Amount *</Label>
                                    <Input
                                        id="limitAmount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.limitAmount}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            limitAmount: parseFloat(e.target.value) || 0 
                                        }))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="limitPeriod">Limit Period *</Label>
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
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="deductFromAnnualLimit"
                                    checked={formData.deductFromAnnualLimit}
                                    onCheckedChange={(checked) => 
                                        setFormData(prev => ({ ...prev, deductFromAnnualLimit: checked }))
                                    }
                                />
                                <Label htmlFor="deductFromAnnualLimit">Deduct from Annual Limit</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bucket Items */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Bucket Items</CardTitle>
                                    <CardDescription>Add benefits, procedures, or drugs to this bucket</CardDescription>
                                </div>
                                <Button type="button" onClick={handleAddItem} size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Item
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {formData.items.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                    <Tag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm text-gray-500 mb-4">No items added to this bucket</p>
                                    <Button type="button" onClick={handleAddItem} size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add First Item
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="p-4 border rounded-lg bg-gray-50">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-medium">Item {index + 1}</h4>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveItem(index)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Benefit</Label>
                                                    <SearchableSelect
                                                        options={masterBenefitOptions}
                                                        value={item.benefitId || ''}
                                                        onValueChange={(value) => 
                                                            handleUpdateItem(index, 'benefitId', value ? parseInt(value.toString()) : null)
                                                        }
                                                        placeholder="Select a benefit..."
                                                        emptyMessage="No benefits found"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Medical Basket</Label>
                                                    <Input
                                                        value={item.medicalBasket || ''}
                                                        onChange={(e) => 
                                                            handleUpdateItem(index, 'medicalBasket', e.target.value || null)
                                                        }
                                                        placeholder="Medical basket code"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Procedure ID</Label>
                                                    <Input
                                                        type="number"
                                                        value={item.procedureId || ''}
                                                        onChange={(e) => 
                                                            handleUpdateItem(index, 'procedureId', e.target.value ? parseInt(e.target.value) : null)
                                                        }
                                                        placeholder="Procedure ID"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Drug ID</Label>
                                                    <Input
                                                        type="number"
                                                        value={item.drugId || ''}
                                                        onChange={(e) => 
                                                            handleUpdateItem(index, 'drugId', e.target.value ? parseInt(e.target.value) : null)
                                                        }
                                                        placeholder="Drug ID"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !isFormValid}>
                            {loading ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {mode === 'create' ? 'Create Bucket' : 'Update Bucket'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
