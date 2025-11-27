'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { Doctor, CreateDoctorPayload, UpdateDoctorPayload } from '@/types/doctor'
import { PaginatedResponse } from '@/types/api'
import { fetchDoctors, createDoctor, updateDoctor, deleteDoctor, getDoctorById } from '@/lib/api/doctors'
import { fetchSpecialtiesLookup } from '@/lib/api/lookups'
import { Specialty } from '@/types/specialty'

const PAGE_SIZE = 20
const GENDER_OPTIONS = ['M', 'F']

type FormState = Partial<CreateDoctorPayload> & { isActive?: boolean }

const emptyFormState: FormState = {
    code: '',
    nameEn: '',
    nameAr: '',
    gender: '',
    specialtyId: 0,
    licenseNumber: '',
    licenseAuthority: '',
    licenseExpiry: undefined,
    isActive: true,
}

export function DoctorsManagementTab() {
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [page, setPage] = useState(0)
    const [pageMeta, setPageMeta] = useState({
        totalPages: 0,
        totalElements: 0,
        numberOfElements: 0,
        first: true,
        last: true,
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formError, setFormError] = useState<string | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
    const [formData, setFormData] = useState<FormState>(emptyFormState)
    const [specialties, setSpecialties] = useState<Specialty[]>([])

    useEffect(() => {
        loadDoctors()
        loadSpecialties()
    }, [page, searchTerm])

    const loadDoctors = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const params: { page: number; size: number; name?: string } = {
                page,
                size: PAGE_SIZE,
            }
            if (searchTerm.trim()) {
                params.name = searchTerm.trim()
            }
            const response: PaginatedResponse<Doctor> = await fetchDoctors(params)
            setDoctors(response.content)
            setPageMeta({
                totalPages: response.totalPages,
                totalElements: response.totalElements,
                numberOfElements: response.numberOfElements,
                first: response.first,
                last: response.last,
            })
        } catch (err) {
            console.error('Failed to load doctors', err)
            setError(err instanceof Error ? err.message : 'Unable to load doctors')
        } finally {
            setIsLoading(false)
        }
    }

    const loadSpecialties = async () => {
        try {
            const data = await fetchSpecialtiesLookup()
            setSpecialties(data)
        } catch (err) {
            console.error('Failed to load specialties', err)
        }
    }

    const handleOpenCreate = () => {
        setSelectedDoctor(null)
        setFormData(emptyFormState)
        setFormError(null)
        setIsDialogOpen(true)
    }

    const handleOpenEdit = async (doctor: Doctor) => {
        try {
            const fullDoctor = await getDoctorById(doctor.id)
            setSelectedDoctor(fullDoctor)
            setFormData({
                code: fullDoctor.code,
                nameEn: fullDoctor.nameEn,
                nameAr: fullDoctor.nameAr,
                gender: fullDoctor.gender,
                specialtyId: fullDoctor.specialtyId,
                isActive: fullDoctor.isActive,
                licenseNumber: fullDoctor.licenseNumber,
                licenseAuthority: fullDoctor.licenseAuthority,
                licenseExpiry: fullDoctor.licenseExpiry || undefined,
            })
            setFormError(null)
            setIsDialogOpen(true)
        } catch (err) {
            console.error('Failed to load doctor details', err)
            setFormError(err instanceof Error ? err.message : 'Unable to load doctor details')
        }
    }

    const handleSubmit = async () => {
        if (!formData.code?.trim() && !selectedDoctor) {
            setFormError('Code is required.')
            return
        }
        if (!formData.nameEn?.trim() || !formData.nameAr?.trim()) {
            setFormError('English name and Arabic name are required.')
            return
        }
        if (!formData.gender) {
            setFormError('Gender is required.')
            return
        }
        if (!formData.specialtyId || formData.specialtyId <= 0) {
            setFormError('Specialty is required.')
            return
        }
        if (!formData.licenseNumber?.trim()) {
            setFormError('License number is required.')
            return
        }
        if (!formData.licenseAuthority?.trim()) {
            setFormError('License authority is required.')
            return
        }

        setFormError(null)
        setIsSaving(true)

        try {
            if (selectedDoctor) {
                const updatePayload: UpdateDoctorPayload = {
                    nameEn: formData.nameEn!,
                    nameAr: formData.nameAr!,
                    gender: formData.gender!,
                    specialtyId: formData.specialtyId!,
                    isActive: formData.isActive ?? true,
                    licenseNumber: formData.licenseNumber!,
                    licenseAuthority: formData.licenseAuthority!,
                    licenseExpiry: formData.licenseExpiry || null,
                }
                await updateDoctor(selectedDoctor.id, updatePayload)
            } else {
                const createPayload: CreateDoctorPayload = {
                    code: formData.code!,
                    nameEn: formData.nameEn!,
                    nameAr: formData.nameAr!,
                    gender: formData.gender!,
                    specialtyId: formData.specialtyId!,
                    licenseNumber: formData.licenseNumber!,
                    licenseAuthority: formData.licenseAuthority!,
                    licenseExpiry: formData.licenseExpiry,
                }
                await createDoctor(createPayload)
            }

            setIsDialogOpen(false)
            setSelectedDoctor(null)
            setFormData(emptyFormState)
            await loadDoctors()
        } catch (err) {
            console.error('Failed to save doctor', err)
            setFormError(err instanceof Error ? err.message : 'Failed to save doctor')
        } finally {
            setIsSaving(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!selectedDoctor) return

        setIsSaving(true)
        try {
            await deleteDoctor(selectedDoctor.id)
            setIsDeleteDialogOpen(false)
            setSelectedDoctor(null)
            await loadDoctors()
        } catch (err) {
            console.error('Failed to delete doctor', err)
            setFormError(err instanceof Error ? err.message : 'Failed to delete doctor')
        } finally {
            setIsSaving(false)
        }
    }

    const handleSearch = (value: string) => {
        setSearchTerm(value)
        setPage(0)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={(event) => handleSearch(event.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => loadDoctors()} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
                <Button onClick={handleOpenCreate} className="bg-tpa-primary hover:bg-tpa-accent">
                    <Plus className="h-4 w-4 mr-2" />
                    New Doctor
                </Button>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="rounded-lg border border-gray-100 overflow-hidden bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-36">Code</TableHead>
                            <TableHead>Name (EN)</TableHead>
                            <TableHead className="text-right">Name (AR)</TableHead>
                            <TableHead>Gender</TableHead>
                            <TableHead>Specialty</TableHead>
                            <TableHead>License Number</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center w-32">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="py-6 text-center text-sm text-gray-500">
                                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                    Loading doctors...
                                </TableCell>
                            </TableRow>
                        ) : doctors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="py-6 text-center text-sm text-gray-500">
                                    {error ? 'Unable to load doctors at the moment.' : 'No doctors found'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            doctors.map((item) => (
                                <TableRow key={item.id} className="hover:bg-gray-50">
                                    <TableCell className="font-medium">{item.code || '-'}</TableCell>
                                    <TableCell>{item.nameEn || '-'}</TableCell>
                                    <TableCell className="text-right">{item.nameAr || '-'}</TableCell>
                                    <TableCell>{item.gender || '-'}</TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <div className="font-medium">{item.specialtyNameEn || '-'}</div>
                                            <div className="text-gray-500 text-xs">{item.specialtyCode || ''}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.licenseNumber || '-'}</TableCell>
                                    <TableCell className="text-center">
                                        <span
                                            className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium ${
                                                item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            {item.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenEdit(item)}
                                                className="h-8 px-3"
                                            >
                                                <Pencil className="h-4 w-4 mr-1" /> Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => {
                                                    setSelectedDoctor(item)
                                                    setIsDeleteDialogOpen(true)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {pageMeta.totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <div>
                        Page {page + 1} of {pageMeta.totalPages} • {pageMeta.totalElements} doctors
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pageMeta.first || isLoading}
                            onClick={() => setPage(page - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pageMeta.last || isLoading}
                            onClick={() => setPage(page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedDoctor ? 'Edit Doctor' : 'Add Doctor'}</DialogTitle>
                        <DialogDescription>
                            {selectedDoctor
                                ? 'Update the doctor details below.'
                                : 'Provide the details below to create a new doctor.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {!selectedDoctor && (
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
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <Label htmlFor="gender">Gender *</Label>
                                <Select
                                    value={formData.gender}
                                    onValueChange={(value) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            gender: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GENDER_OPTIONS.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option === 'M' ? 'Male' : 'Female'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="specialtyId">Specialty *</Label>
                                <Select
                                    value={String(formData.specialtyId || '')}
                                    onValueChange={(value) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            specialtyId: Number(value),
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select specialty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {specialties.map((specialty) => (
                                            <SelectItem key={specialty.id} value={String(specialty.id)}>
                                                {specialty.nameEn}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="licenseNumber">License Number *</Label>
                                <Input
                                    id="licenseNumber"
                                    value={formData.licenseNumber}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            licenseNumber: event.target.value,
                                        }))
                                    }
                                    placeholder="Enter license number"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="licenseAuthority">License Authority *</Label>
                                <Input
                                    id="licenseAuthority"
                                    value={formData.licenseAuthority}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            licenseAuthority: event.target.value,
                                        }))
                                    }
                                    placeholder="Enter license authority"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="licenseExpiry">License Expiry</Label>
                                <Input
                                    id="licenseExpiry"
                                    type="date"
                                    value={formData.licenseExpiry?.slice(0, 10) || ''}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            licenseExpiry: event.target.value || undefined,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        {selectedDoctor && (
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive ?? true}
                                    onCheckedChange={(checked) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            isActive: checked,
                                        }))
                                    }
                                />
                                <Label htmlFor="isActive">Active</Label>
                            </div>
                        )}

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
                        <DialogTitle>Delete Doctor</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the doctor "{selectedDoctor?.nameEn}"? This action cannot be
                            undone.
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

