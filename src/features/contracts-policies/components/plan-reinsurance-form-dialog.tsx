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
import { Label } from '@/components/ui/label'
import { PlanReinsurance, PlanReinsurancePayload, PlanReinsuranceUpdatePayload } from '@/types/plan'
import { attachPlanReinsurance, updatePlanReinsurance } from '@/lib/api/plans'

const reinsuranceFormSchema = z.object({
    treatyId: z.number().min(1, 'Treaty ID is required'),
    retentionLimit: z.number().min(0, 'Retention limit must be non-negative'),
    cededPercentage: z.number().min(0, 'Ceded percentage must be non-negative').max(100, 'Ceded percentage cannot exceed 100%'),
    priorityOrder: z.number().min(1, 'Priority order must be at least 1'),
})

type ReinsuranceFormData = z.infer<typeof reinsuranceFormSchema>

interface PlanReinsuranceFormDialogProps {
    open: boolean
    onClose: () => void
    planId: number
    reinsurance?: PlanReinsurance | null
}

export function PlanReinsuranceFormDialog({
    open,
    onClose,
    planId,
    reinsurance
}: PlanReinsuranceFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const isEditing = !!reinsurance

    const form = useForm<ReinsuranceFormData>({
        resolver: zodResolver(reinsuranceFormSchema),
        defaultValues: {
            treatyId: 0,
            retentionLimit: 0,
            cededPercentage: 0,
            priorityOrder: 1,
        },
    })

    useEffect(() => {
        if (reinsurance) {
            form.reset({
                treatyId: reinsurance.treatyId,
                retentionLimit: reinsurance.retentionLimit,
                cededPercentage: reinsurance.cededPercentage,
                priorityOrder: reinsurance.priorityOrder,
            })
        } else {
            form.reset({
                treatyId: 0,
                retentionLimit: 0,
                cededPercentage: 0,
                priorityOrder: 1,
            })
        }
    }, [reinsurance, form])

    const onSubmit = async (data: ReinsuranceFormData) => {
        try {
            setLoading(true)

            if (isEditing && reinsurance) {
                const updatePayload: PlanReinsuranceUpdatePayload = {
                    retentionLimit: data.retentionLimit,
                    cededPercentage: data.cededPercentage,
                    priorityOrder: data.priorityOrder,
                }
                await updatePlanReinsurance(planId, reinsurance.treatyId, updatePayload)
            } else {
                const createPayload: PlanReinsurancePayload = {
                    treatyId: data.treatyId,
                    retentionLimit: data.retentionLimit,
                    cededPercentage: data.cededPercentage,
                    priorityOrder: data.priorityOrder,
                }
                await attachPlanReinsurance(planId, createPayload)
            }

            onClose()
        } catch (error) {
            console.error('Failed to save reinsurance:', error)
            alert('Failed to save reinsurance treaty. Please try again.')
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

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Reinsurance Treaty' : 'Attach Reinsurance Treaty'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Treaty ID */}
                        <div className="space-y-2">
                            <Label htmlFor="treatyId">Treaty ID *</Label>
                            <Input
                                id="treatyId"
                                type="number"
                                {...form.register('treatyId', { valueAsNumber: true })}
                                placeholder="Enter treaty ID"
                                disabled={isEditing} // Cannot change treaty when editing
                            />
                            {form.formState.errors.treatyId && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.treatyId.message}
                                </p>
                            )}
                            {isEditing && reinsurance && (
                                <p className="text-sm text-gray-600">
                                    Treaty: {reinsurance.treatyNameEn} {reinsurance.treatyCode && `(${reinsurance.treatyCode})`}
                                </p>
                            )}
                        </div>

                        {/* Priority Order */}
                        <div className="space-y-2">
                            <Label htmlFor="priorityOrder">Priority Order *</Label>
                            <Input
                                id="priorityOrder"
                                type="number"
                                min="1"
                                {...form.register('priorityOrder', { valueAsNumber: true })}
                                placeholder="Enter priority order"
                            />
                            {form.formState.errors.priorityOrder && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.priorityOrder.message}
                                </p>
                            )}
                            <p className="text-xs text-gray-500">
                                Lower numbers = higher priority (1 = highest)
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Retention Limit */}
                        <div className="space-y-2">
                            <Label htmlFor="retentionLimit">Retention Limit *</Label>
                            <Input
                                id="retentionLimit"
                                type="number"
                                min="0"
                                step="0.01"
                                {...form.register('retentionLimit', { valueAsNumber: true })}
                                placeholder="Enter retention limit"
                            />
                            {form.formState.errors.retentionLimit && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.retentionLimit.message}
                                </p>
                            )}
                            <p className="text-xs text-gray-500">
                                Maximum amount retained before reinsurance applies
                            </p>
                        </div>

                        {/* Ceded Percentage */}
                        <div className="space-y-2">
                            <Label htmlFor="cededPercentage">Ceded Percentage *</Label>
                            <Input
                                id="cededPercentage"
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                {...form.register('cededPercentage', { valueAsNumber: true })}
                                placeholder="Enter ceded percentage"
                            />
                            {form.formState.errors.cededPercentage && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.cededPercentage.message}
                                </p>
                            )}
                            <p className="text-xs text-gray-500">
                                Percentage of excess claims ceded to reinsurer
                            </p>
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Reinsurance Settings:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li><strong>Retention Limit:</strong> The maximum amount the plan retains before reinsurance coverage begins</li>
                            <li><strong>Ceded Percentage:</strong> The percentage of claims above the retention limit that are transferred to the reinsurer</li>
                            <li><strong>Priority Order:</strong> Determines the sequence in which multiple treaties are applied (1 = first priority)</li>
                        </ul>
                    </div>

                    {/* Example Calculation */}
                    {form.watch('retentionLimit') > 0 && form.watch('cededPercentage') > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-green-900 mb-2">Example:</h4>
                            <p className="text-sm text-green-800">
                                For a ${(form.watch('retentionLimit') + 10000).toLocaleString()} claim:
                            </p>
                            <ul className="text-sm text-green-800 mt-1 space-y-1">
                                <li>• Plan retains: ${form.watch('retentionLimit').toLocaleString()}</li>
                                <li>• Excess amount: ${(10000).toLocaleString()}</li>
                                <li>• Reinsurer covers: ${(10000 * form.watch('cededPercentage') / 100).toLocaleString()} ({form.watch('cededPercentage')}%)</li>
                                <li>• Plan covers excess: ${(10000 * (100 - form.watch('cededPercentage')) / 100).toLocaleString()} ({100 - form.watch('cededPercentage')}%)</li>
                            </ul>
                        </div>
                    )}

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
                            {loading ? 'Saving...' : isEditing ? 'Update Treaty' : 'Attach Treaty'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
