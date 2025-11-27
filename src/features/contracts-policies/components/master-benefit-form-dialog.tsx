'use client'

import { useState, useEffect } from 'react'
import { Save, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MasterBenefit, MasterBenefitPayload, MasterBenefitUpdatePayload } from '@/types/plan'
import { createMasterBenefit, updateMasterBenefit } from '@/lib/api/plans'

interface MasterBenefitFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'create' | 'edit'
    benefit?: MasterBenefit | null
    onSaved: () => void
}

export function MasterBenefitFormDialog({
    open,
    onOpenChange,
    mode,
    benefit,
    onSaved,
}: MasterBenefitFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        nameEn: '',
        nameAr: '',
        categoryId: 1,
        isActive: true,
    })

    // Initialize form data when benefit changes
    useEffect(() => {
        if (mode === 'edit' && benefit) {
            setFormData({
                code: benefit.code,
                nameEn: benefit.nameEn,
                nameAr: benefit.nameAr || '',
                categoryId: benefit.categoryId,
                isActive: benefit.isActive,
            })
        } else {
            // Reset form for create mode
            setFormData({
                code: '',
                nameEn: '',
                nameAr: '',
                categoryId: 1,
                isActive: true,
            })
        }
        setError(null)
    }, [mode, benefit, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (mode === 'create') {
                const payload: MasterBenefitPayload = {
                    code: formData.code.trim(),
                    nameEn: formData.nameEn.trim(),
                    nameAr: formData.nameAr.trim() || undefined,
                    categoryId: formData.categoryId,
                    isActive: formData.isActive,
                }

                await createMasterBenefit(payload)
            } else if (mode === 'edit' && benefit) {
                const payload: MasterBenefitUpdatePayload = {
                    nameEn: formData.nameEn.trim(),
                    nameAr: formData.nameAr.trim() || undefined,
                    categoryId: formData.categoryId,
                    isActive: formData.isActive,
                }

                await updateMasterBenefit(benefit.id, payload)
            }

            onSaved()
        } catch (err) {
            console.error('Failed to save master benefit', err)
            setError(err instanceof Error ? err.message : 'Unable to save master benefit')
        } finally {
            setLoading(false)
        }
    }

    const isFormValid = formData.code.trim() && formData.nameEn.trim() && formData.categoryId > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Create Master Benefit' : 'Edit Master Benefit'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'create' 
                            ? 'Add a new benefit to the master catalog'
                            : 'Update the master benefit information'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Benefit Code *</Label>
                        <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                            placeholder="e.g., GP_VISIT, SPECIALIST_VISIT"
                            disabled={mode === 'edit'} // Code cannot be changed in edit mode
                            required
                        />
                        {mode === 'edit' && (
                            <p className="text-xs text-gray-500">Benefit code cannot be changed</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nameEn">Name (English) *</Label>
                        <Input
                            id="nameEn"
                            value={formData.nameEn}
                            onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                            placeholder="e.g., GP Consultation"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nameAr">Name (Arabic)</Label>
                        <Input
                            id="nameAr"
                            value={formData.nameAr}
                            onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                            placeholder="e.g., كشفية طب عام"
                            dir="rtl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="categoryId">Category ID *</Label>
                        <Input
                            id="categoryId"
                            type="number"
                            min="1"
                            value={formData.categoryId}
                            onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                categoryId: parseInt(e.target.value) || 1 
                            }))}
                            required
                        />
                        <p className="text-xs text-gray-500">
                            Category ID from the benefit categories master data
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => 
                                setFormData(prev => ({ ...prev, isActive: checked }))
                            }
                        />
                        <Label htmlFor="isActive">Active</Label>
                    </div>

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
                                    {mode === 'create' ? 'Create Benefit' : 'Update Benefit'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
