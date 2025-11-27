'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { PlanExclusion, PlanExclusionPayload, PlanExclusionUpdatePayload, ExclusionType } from '@/types/plan'
import { createPlanExclusion, updatePlanExclusion } from '@/lib/api/plans'
import { fetchIcds } from '@/lib/api/icd'
import { fetchProcedures } from '@/lib/api/procedures'
import { fetchDrugs } from '@/lib/api/drugs'
import type { ICD, ProcedureSummary, Drug } from '@/types'

const exclusionFormSchema = z.object({
    exclusionType: z.string().min(1, 'Exclusion type is required'),
    codeValue: z.string().min(1, 'Code value is required'),
    description: z.string().min(1, 'Description is required'),
    isHardBlock: z.boolean(),
})

type ExclusionFormData = z.infer<typeof exclusionFormSchema>

interface PlanExclusionFormDialogProps {
    open: boolean
    onClose: () => void
    planId: number
    exclusion?: PlanExclusion | null
}

export function PlanExclusionFormDialog({
    open,
    onClose,
    planId,
    exclusion
}: PlanExclusionFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const [codeOptions, setCodeOptions] = useState<Array<{id: string, label: string, subLabel?: string}>>([])
    const [loadingCodes, setLoadingCodes] = useState(false)
    const isEditing = !!exclusion

    const form = useForm<ExclusionFormData>({
        resolver: zodResolver(exclusionFormSchema),
        defaultValues: {
            exclusionType: '',
            codeValue: '',
            description: '',
            isHardBlock: false,
        },
    })

    const selectedExclusionType = form.watch('exclusionType')

    // Load code options based on exclusion type
    const loadCodeOptions = async (exclusionType: string) => {
        if (!exclusionType) return

        setLoadingCodes(true)
        try {
            let options: Array<{id: string, label: string, subLabel?: string}> = []

            switch (exclusionType) {
                case 'ICD':
                    // Load initial set of ICDs
                    const icdResponse = await fetchIcds({ page: 0, size: 20 })
                    options = (icdResponse.content || []).map((icd: ICD) => ({
                        id: icd.code,
                        label: `${icd.code} - ${icd.nameEn}`,
                        subLabel: icd.nameAr
                    }))
                    break

                case 'CPT':
                case 'PROCEDURE':
                    const procedures = await fetchProcedures({ 
                        page: 0, 
                        size: 20 
                    })
                    options = (procedures.content || []).map((proc: ProcedureSummary) => ({
                        id: proc.code,
                        label: `${proc.code} - ${proc.nameEn}`,
                        subLabel: proc.nameAr
                    }))
                    break

                case 'DRUG':
                    const drugs = await fetchDrugs({ 
                        page: 0, 
                        size: 20 
                    })
                    options = (drugs.content || []).map((drug: Drug) => ({
                        id: drug.code,
                        label: `${drug.code} - ${drug.genericNameEn || drug.brandNameEn}`,
                        subLabel: drug.genericNameAr || drug.brandNameAr
                    }))
                    break

                default:
                    options = []
            }

            setCodeOptions(options)
        } catch (error) {
            console.error('Failed to load code options:', error)
            setCodeOptions([])
        } finally {
            setLoadingCodes(false)
        }
    }

    // Load initial options when exclusion type changes
    useEffect(() => {
        if (selectedExclusionType && !isEditing) {
            loadCodeOptions(selectedExclusionType)
            // Clear code value when exclusion type changes
            form.setValue('codeValue', '')
        }
    }, [selectedExclusionType, isEditing, form])

    useEffect(() => {
        if (exclusion) {
            form.reset({
                exclusionType: exclusion.exclusionType,
                codeValue: exclusion.codeValue,
                description: exclusion.description,
                isHardBlock: exclusion.isHardBlock,
            })
        } else {
            form.reset({
                exclusionType: '',
                codeValue: '',
                description: '',
                isHardBlock: false,
            })
        }
    }, [exclusion, form])

    const onSubmit = async (data: ExclusionFormData) => {
        try {
            setLoading(true)

            if (isEditing && exclusion) {
                const updatePayload: PlanExclusionUpdatePayload = {
                    description: data.description,
                    isHardBlock: data.isHardBlock,
                }
                await updatePlanExclusion(planId, exclusion.id, updatePayload)
            } else {
                const createPayload: PlanExclusionPayload = {
                    exclusionType: data.exclusionType,
                    codeValue: data.codeValue,
                    description: data.description,
                    isHardBlock: data.isHardBlock,
                }
                await createPlanExclusion(planId, createPayload)
            }

            onClose()
        } catch (error) {
            console.error('Failed to save exclusion:', error)
            alert('Failed to save exclusion. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (!loading) {
            form.reset()
            onClose()
        }
    }

    const exclusionTypes: { value: ExclusionType; label: string }[] = [
        { value: 'ICD', label: 'ICD Code' },
        { value: 'CPT', label: 'CPT Code' },
        { value: 'DRUG', label: 'Drug' },
        { value: 'PROCEDURE', label: 'Procedure' },
        { value: 'SPECIAL_CASE', label: 'Special Case' },
    ]

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Exclusion' : 'Add New Exclusion'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Exclusion Type */}
                        <div className="space-y-2">
                            <Label htmlFor="exclusionType">Exclusion Type *</Label>
                            <Select
                                value={form.watch('exclusionType')}
                                onValueChange={(value) => form.setValue('exclusionType', value)}
                                disabled={isEditing} // Cannot change type when editing
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select exclusion type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exclusionTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.exclusionType && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.exclusionType.message}
                                </p>
                            )}
                        </div>

                        {/* Code Value */}
                        <div className="space-y-2">
                            <Label htmlFor="codeValue">Code Value *</Label>
                            {isEditing ? (
                                <Input
                                    id="codeValue"
                                    value={form.watch('codeValue')}
                                    placeholder="Code value (read-only)"
                                    disabled={true}
                                />
                            ) : selectedExclusionType === 'SPECIAL_CASE' ? (
                                <Input
                                    id="codeValue"
                                    {...form.register('codeValue')}
                                    placeholder="Enter custom code for special case"
                                />
                            ) : selectedExclusionType ? (
                                <SearchableSelect
                                    value={form.watch('codeValue')}
                                    onValueChange={(value) => form.setValue('codeValue', value?.toString() || '')}
                                    options={codeOptions}
                                    placeholder={`Search ${selectedExclusionType.toLowerCase()} codes...`}
                                    emptyMessage={`No ${selectedExclusionType.toLowerCase()} codes found`}
                                    loading={loadingCodes}
                                />
                            ) : (
                                <Input
                                    placeholder="Select exclusion type first"
                                    disabled={true}
                                />
                            )}
                            {form.formState.errors.codeValue && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.codeValue.message}
                                </p>
                            )}
                            {!isEditing && selectedExclusionType && (
                                <p className="text-xs text-gray-500">
                                    {selectedExclusionType === 'ICD' && 'Search for ICD diagnosis codes'}
                                    {(selectedExclusionType === 'CPT' || selectedExclusionType === 'PROCEDURE') && 'Search for procedure/CPT codes'}
                                    {selectedExclusionType === 'DRUG' && 'Search for drug codes'}
                                    {selectedExclusionType === 'SPECIAL_CASE' && 'Enter a custom code for special cases'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            {...form.register('description')}
                            placeholder="Enter exclusion description"
                            rows={3}
                        />
                        {form.formState.errors.description && (
                            <p className="text-sm text-red-600">
                                {form.formState.errors.description.message}
                            </p>
                        )}
                    </div>

                    {/* Hard Block Checkbox */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isHardBlock"
                            checked={form.watch('isHardBlock')}
                            onCheckedChange={(checked) => form.setValue('isHardBlock', !!checked)}
                        />
                        <Label htmlFor="isHardBlock" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Hard Block (completely prevents authorization)
                        </Label>
                    </div>

                    {/* Help Text */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Block Types:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li><strong>Hard Block:</strong> Completely prevents authorization and claims processing</li>
                            <li><strong>Soft Block:</strong> Allows override with proper authorization or special approval</li>
                        </ul>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : isEditing ? 'Update Exclusion' : 'Add Exclusion'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
