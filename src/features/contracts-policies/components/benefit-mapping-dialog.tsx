'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, RefreshCw, AlertCircle, Settings, FileText, Pill, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MasterBenefit, BenefitMapping, BenefitMappingPayload } from '@/types/plan'
import { fetchBenefitMapping, createBenefitMapping, deleteBenefitMapping } from '@/lib/api/plans'

interface BenefitMappingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    benefit: MasterBenefit | null
}

export function BenefitMappingDialog({
    open,
    onOpenChange,
    benefit,
}: BenefitMappingDialogProps) {
    const [mappings, setMappings] = useState<BenefitMapping[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form state for adding new mapping
    const [formData, setFormData] = useState({
        procedureId: '',
        icdId: '',
        drugId: '',
        isRequired: false,
        notes: '',
    })

    // Load benefit mappings
    const loadMappings = useCallback(async () => {
        if (!benefit) return

        setLoading(true)
        setError(null)
        try {
            const mappingData = await fetchBenefitMapping(benefit.id)
            setMappings(mappingData)
        } catch (err) {
            console.error('Failed to load benefit mappings', err)
            setError(err instanceof Error ? err.message : 'Unable to load benefit mappings')
        } finally {
            setLoading(false)
        }
    }, [benefit])

    useEffect(() => {
        if (open && benefit) {
            void loadMappings()
        }
    }, [open, benefit, loadMappings])

    const handleAddMapping = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!benefit) return

        setSaving(true)
        setError(null)
        try {
            const payload: BenefitMappingPayload = {
                procedureId: formData.procedureId ? parseInt(formData.procedureId) : undefined,
                icdId: formData.icdId ? parseInt(formData.icdId) : undefined,
                drugId: formData.drugId ? parseInt(formData.drugId) : undefined,
                isRequired: formData.isRequired,
                notes: formData.notes.trim() || undefined,
            }

            await createBenefitMapping(benefit.id, payload)
            
            // Reset form
            setFormData({
                procedureId: '',
                icdId: '',
                drugId: '',
                isRequired: false,
                notes: '',
            })
            setShowAddForm(false)
            await loadMappings()
        } catch (err) {
            console.error('Failed to add benefit mapping', err)
            setError(err instanceof Error ? err.message : 'Unable to add benefit mapping')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteMapping = async (mappingId: number) => {
        setError(null)
        try {
            await deleteBenefitMapping(mappingId)
            await loadMappings()
        } catch (err) {
            console.error('Failed to delete benefit mapping', err)
            setError(err instanceof Error ? err.message : 'Unable to delete benefit mapping')
        }
    }

    const getMappingTypeIcon = (mapping: BenefitMapping) => {
        if (mapping.procedureId) return <Stethoscope className="h-4 w-4 text-blue-600" />
        if (mapping.icdId) return <FileText className="h-4 w-4 text-green-600" />
        if (mapping.drugId) return <Pill className="h-4 w-4 text-purple-600" />
        return <Settings className="h-4 w-4 text-gray-400" />
    }

    const getMappingTypeText = (mapping: BenefitMapping) => {
        if (mapping.procedureId) return `Procedure ID: ${mapping.procedureId}`
        if (mapping.icdId) return `ICD ID: ${mapping.icdId}`
        if (mapping.drugId) return `Drug ID: ${mapping.drugId}`
        return 'Unknown'
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Benefit Mapping - {benefit?.code}
                    </DialogTitle>
                    <DialogDescription>
                        Manage procedure, ICD, and drug mappings for this benefit
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Benefit Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{benefit?.nameEn}</CardTitle>
                            <CardDescription>
                                {benefit?.nameAr && (
                                    <span className="block" dir="rtl">{benefit.nameAr}</span>
                                )}
                                Category: {benefit?.categoryNameEn}
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {/* Add New Mapping */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Mappings</CardTitle>
                                <Button
                                    onClick={() => setShowAddForm(!showAddForm)}
                                    size="sm"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Mapping
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {showAddForm && (
                                <form onSubmit={handleAddMapping} className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="procedureId">Procedure ID</Label>
                                            <Input
                                                id="procedureId"
                                                type="number"
                                                value={formData.procedureId}
                                                onChange={(e) => setFormData(prev => ({ ...prev, procedureId: e.target.value }))}
                                                placeholder="Enter procedure ID"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="icdId">ICD ID</Label>
                                            <Input
                                                id="icdId"
                                                type="number"
                                                value={formData.icdId}
                                                onChange={(e) => setFormData(prev => ({ ...prev, icdId: e.target.value }))}
                                                placeholder="Enter ICD ID"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="drugId">Drug ID</Label>
                                            <Input
                                                id="drugId"
                                                type="number"
                                                value={formData.drugId}
                                                onChange={(e) => setFormData(prev => ({ ...prev, drugId: e.target.value }))}
                                                placeholder="Enter drug ID"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Notes</Label>
                                        <Textarea
                                            id="notes"
                                            value={formData.notes}
                                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            placeholder="Optional notes about this mapping"
                                            rows={2}
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="isRequired"
                                            checked={formData.isRequired}
                                            onCheckedChange={(checked) => 
                                                setFormData(prev => ({ ...prev, isRequired: checked }))
                                            }
                                        />
                                        <Label htmlFor="isRequired">Required</Label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button type="submit" disabled={saving} size="sm">
                                            {saving ? (
                                                <>
                                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                    Adding...
                                                </>
                                            ) : (
                                                'Add Mapping'
                                            )}
                                        </Button>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => setShowAddForm(false)}
                                            size="sm"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Mappings Table */}
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                                </div>
                            ) : mappings.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-lg font-medium text-gray-900 mb-2">No Mappings Found</p>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Add mappings to link this benefit with procedures, ICDs, or drugs
                                    </p>
                                    <Button onClick={() => setShowAddForm(true)} size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add First Mapping
                                    </Button>
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Type</TableHead>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Required</TableHead>
                                                <TableHead>Notes</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {mappings.map((mapping) => (
                                                <TableRow key={mapping.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getMappingTypeIcon(mapping)}
                                                            <span className="text-sm">
                                                                {mapping.procedureId ? 'Procedure' : 
                                                                 mapping.icdId ? 'ICD' : 
                                                                 mapping.drugId ? 'Drug' : 'Unknown'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono">
                                                        {mapping.procedureId || mapping.icdId || mapping.drugId || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                            mapping.isRequired 
                                                                ? 'bg-red-100 text-red-700' 
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {mapping.isRequired ? 'Required' : 'Optional'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="max-w-xs truncate text-sm text-gray-600">
                                                            {mapping.notes || '-'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteMapping(mapping.id)}
                                                            title="Delete Mapping"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}
