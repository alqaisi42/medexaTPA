'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { useSpecialties } from '../hooks/use-specialties'
import { Specialty, SpecialtyPayload } from '@/types/specialty'

type FormState = SpecialtyPayload

const emptyFormState: FormState = {
    code: '',
    nameEn: '',
    nameAr: '',
    isActive: true,
    effectiveTo: null,
}

export function SpecialtyManagementPage() {
    const { specialties, isLoading, isSaving, fetchError, loadSpecialties, create, update, remove, clearError } =
        useSpecialties()
    const [searchTerm, setSearchTerm] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null)
    const [formData, setFormData] = useState<FormState>(emptyFormState)
    const [formError, setFormError] = useState<string | null>(null)

    useEffect(() => {
        clearError()
        void loadSpecialties()
    }, [loadSpecialties, clearError])

    const filteredSpecialties = useMemo(() => {
        if (!searchTerm) return specialties

        const term = searchTerm.toLowerCase()
        return specialties.filter((item) =>
            [item.code, item.nameEn, item.nameAr].some((field) => field?.toLowerCase().includes(term)),
        )
    }, [specialties, searchTerm])

    const handleOpenCreate = () => {
        setSelectedSpecialty(null)
        setFormData(emptyFormState)
        setFormError(null)
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (specialty: Specialty) => {
        setSelectedSpecialty(specialty)
        setFormData({
            code: specialty.code,
            nameEn: specialty.nameEn,
            nameAr: specialty.nameAr,
            isActive: specialty.isActive,
            effectiveTo: specialty.effectiveTo,
        })
        setFormError(null)
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        if (!formData.code.trim() || !formData.nameEn.trim() || !formData.nameAr.trim()) {
            setFormError('Code, English name, and Arabic name are required.')
            return
        }

        setFormError(null)

        try {
            if (selectedSpecialty) {
                await update(selectedSpecialty.id, formData)
            } else {
                await create(formData)
            }

            setIsDialogOpen(false)
            setSelectedSpecialty(null)
            setFormData(emptyFormState)
        } catch (error) {
            console.error('Failed to save specialty', error)
            setFormError(error instanceof Error ? error.message : 'Failed to save specialty')
        }
    }

    const handleConfirmDelete = async () => {
        if (!selectedSpecialty) return

        try {
            await remove(selectedSpecialty.id)
            setIsDeleteDialogOpen(false)
            setSelectedSpecialty(null)
        } catch (error) {
            console.error('Failed to delete specialty', error)
            setFormError(error instanceof Error ? error.message : 'Failed to delete specialty')
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Specialties</h1>
                    <p className="text-gray-600 max-w-2xl">
                        Manage specialty lookup values with quick add, edit, and delete actions. Keep your references
                        consistent across the platform.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadSpecialties()} disabled={isLoading}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={handleOpenCreate} className="bg-tpa-primary hover:bg-tpa-accent">
                        <Plus className="h-4 w-4 mr-2" />
                        New Specialty
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by code, English or Arabic name"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="pl-10 w-80"
                        />
                    </div>
                    {fetchError && <p className="text-sm text-red-600">{fetchError}</p>}
                </div>

                <div className="rounded-lg border border-gray-100 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-28 font-semibold">Code</TableHead>
                                <TableHead className="font-semibold">Name (EN)</TableHead>
                                <TableHead className="font-semibold text-right">Name (AR)</TableHead>
                                <TableHead className="w-28 text-center font-semibold">Status</TableHead>
                                <TableHead className="w-32 text-center font-semibold">Effective From</TableHead>
                                <TableHead className="w-32 text-center font-semibold">Effective To</TableHead>
                                <TableHead className="w-32 text-center font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-6 text-center text-sm text-gray-500">
                                        Loading specialties...
                                    </TableCell>
                                </TableRow>
                            ) : filteredSpecialties.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-6 text-center text-sm text-gray-500">
                                        {fetchError ? 'Unable to load specialties at the moment.' : 'No specialties found'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSpecialties.map((item) => (
                                    <TableRow key={`${item.id}-${item.code}`} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">{item.code || '-'}</TableCell>
                                        <TableCell>{item.nameEn || '-'}</TableCell>
                                        <TableCell className="text-right">{item.nameAr || '-'}</TableCell>
                                        <TableCell className="text-center">
                                            <span
                                                className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}
                                            >
                                                {item.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-gray-600">
                                            {item.effectiveFrom ? formatDate(item.effectiveFrom) : '-'}
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-gray-600">
                                            {item.effectiveTo ? formatDate(item.effectiveTo) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="h-8 px-3"
                                                >
                                                    <Pencil className="h-4 w-4 mr-2" /> Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                                                    onClick={() => {
                                                        setSelectedSpecialty(item)
                                                        setIsDeleteDialogOpen(true)
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedSpecialty ? 'Edit Specialty' : 'Add Specialty'}</DialogTitle>
                        <DialogDescription>
                            {selectedSpecialty
                                ? 'Update the specialty details below.'
                                : 'Provide the details below to create a new specialty.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Code *</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            code: event.target.value.toUpperCase(),
                                        }))
                                    }
                                    placeholder="Enter code"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nameEn">Name (English) *</Label>
                                <Input
                                    id="nameEn"
                                    value={formData.nameEn}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            nameEn: event.target.value,
                                        }))
                                    }
                                    placeholder="Enter English name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nameAr">Name (Arabic) *</Label>
                                <Input
                                    id="nameAr"
                                    value={formData.nameAr}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            nameAr: event.target.value,
                                        }))
                                    }
                                    placeholder="أدخل الاسم بالعربية"
                                    dir="rtl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="effectiveTo">Effective To</Label>
                                <Input
                                    id="effectiveTo"
                                    type="date"
                                    value={formData.effectiveTo?.slice(0, 10) ?? ''}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            effectiveTo: event.target.value || null,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) =>
                                    setFormData((previous) => ({
                                        ...previous,
                                        isActive: checked,
                                    }))
                                }
                            />
                            <Label htmlFor="isActive">Active</Label>
                        </div>

                        {formError && <p className="text-sm text-red-600">{formError}</p>}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="bg-tpa-primary hover:bg-tpa-accent"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Specialty</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the specialty “{selectedSpecialty?.nameEn}”? This action
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
