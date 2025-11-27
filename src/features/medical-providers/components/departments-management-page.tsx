'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, RefreshCw, Loader2, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Department, PaginatedResponse } from '@/types/department'
import {
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deactivateDepartment,
    deleteDepartment,
    CreateDepartmentPayload,
    UpdateDepartmentPayload,
} from '@/lib/api/departments'

const PAGE_SIZE = 20

type FormState = Partial<CreateDepartmentPayload> & { isActive?: boolean }

const emptyFormState: FormState = {
    code: '',
    nameEn: '',
    nameAr: '',
    isActive: true,
}

export function DepartmentsManagementPage() {
    const [departments, setDepartments] = useState<Department[]>([])
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
    const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
    const [formData, setFormData] = useState<FormState>(emptyFormState)

    useEffect(() => {
        loadDepartments()
    }, [page, searchTerm])

    const loadDepartments = async () => {
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
            const response: PaginatedResponse<Department> = await fetchDepartments(params)
            setDepartments(response.content)
            setPageMeta({
                totalPages: response.totalPages,
                totalElements: response.totalElements,
                numberOfElements: response.numberOfElements,
                first: response.first,
                last: response.last,
            })
        } catch (err) {
            console.error('Failed to load departments', err)
            setError(err instanceof Error ? err.message : 'Unable to load departments')
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenCreate = () => {
        setSelectedDepartment(null)
        setFormData(emptyFormState)
        setFormError(null)
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (department: Department) => {
        setSelectedDepartment(department)
        setFormData({
            nameEn: department.nameEn,
            nameAr: department.nameAr,
            isActive: department.isActive,
        })
        setFormError(null)
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        if (!formData.code?.trim() && !selectedDepartment) {
            setFormError('Code is required.')
            return
        }
        if (!formData.nameEn?.trim() || !formData.nameAr?.trim()) {
            setFormError('English name and Arabic name are required.')
            return
        }

        setFormError(null)
        setIsSaving(true)

        try {
            if (selectedDepartment) {
                const updatePayload: UpdateDepartmentPayload = {
                    nameEn: formData.nameEn!,
                    nameAr: formData.nameAr!,
                    isActive: formData.isActive ?? true,
                }
                await updateDepartment(selectedDepartment.id, updatePayload)
            } else {
                const createPayload: CreateDepartmentPayload = {
                    code: formData.code!,
                    nameEn: formData.nameEn!,
                    nameAr: formData.nameAr!,
                }
                await createDepartment(createPayload)
            }

            setIsDialogOpen(false)
            setSelectedDepartment(null)
            setFormData(emptyFormState)
            await loadDepartments()
        } catch (err) {
            console.error('Failed to save department', err)
            setFormError(err instanceof Error ? err.message : 'Failed to save department')
        } finally {
            setIsSaving(false)
        }
    }

    const handleConfirmDeactivate = async () => {
        if (!selectedDepartment) return

        setIsSaving(true)
        try {
            await deactivateDepartment(selectedDepartment.id)
            setIsDeactivateDialogOpen(false)
            setSelectedDepartment(null)
            await loadDepartments()
        } catch (err) {
            console.error('Failed to deactivate department', err)
            setFormError(err instanceof Error ? err.message : 'Failed to deactivate department')
        } finally {
            setIsSaving(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!selectedDepartment) return

        setIsSaving(true)
        try {
            await deleteDepartment(selectedDepartment.id)
            setIsDeleteDialogOpen(false)
            setSelectedDepartment(null)
            await loadDepartments()
        } catch (err) {
            console.error('Failed to delete department', err)
            setFormError(err instanceof Error ? err.message : 'Failed to delete department')
        } finally {
            setIsSaving(false)
        }
    }

    const handleSearch = (value: string) => {
        setSearchTerm(value)
        setPage(0)
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Departments</h1>
                    <p className="text-gray-600 max-w-2xl">
                        Manage all departments in the system with quick add, edit, deactivate, and delete actions. Keep
                        your department records consistent across the platform.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadDepartments()} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={handleOpenCreate} className="bg-tpa-primary hover:bg-tpa-accent">
                        <Plus className="h-4 w-4 mr-2" />
                        New Department
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
                            onChange={(event) => handleSearch(event.target.value)}
                            className="pl-10 w-80"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>

                <div className="rounded-lg border border-gray-100 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-28 font-semibold">Code</TableHead>
                                <TableHead className="font-semibold">Name (EN)</TableHead>
                                <TableHead className="text-right font-semibold">Name (AR)</TableHead>
                                <TableHead className="w-28 text-center font-semibold">Status</TableHead>
                                <TableHead className="w-48 text-center font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-6 text-center text-sm text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                        Loading departments...
                                    </TableCell>
                                </TableRow>
                            ) : departments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-6 text-center text-sm text-gray-500">
                                        {error ? 'Unable to load departments at the moment.' : 'No departments found'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                departments.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">{item.code || '-'}</TableCell>
                                        <TableCell>{item.nameEn || '-'}</TableCell>
                                        <TableCell className="text-right">{item.nameAr || '-'}</TableCell>
                                        <TableCell className="text-center">
                                            <span
                                                className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium ${
                                                    item.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-700'
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
                                                {item.isActive && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-3 text-amber-600 border-amber-200 hover:bg-amber-50"
                                                        onClick={() => {
                                                            setSelectedDepartment(item)
                                                            setIsDeactivateDialogOpen(true)
                                                        }}
                                                    >
                                                        <Ban className="h-4 w-4 mr-1" /> Deactivate
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                                                    onClick={() => {
                                                        setSelectedDepartment(item)
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
                    <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
                        <div>
                            Page {page + 1} of {pageMeta.totalPages} • {pageMeta.totalElements} departments
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
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedDepartment ? 'Edit Department' : 'Add Department'}</DialogTitle>
                        <DialogDescription>
                            {selectedDepartment
                                ? 'Update the department details below.'
                                : 'Provide the details below to create a new department.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {!selectedDepartment && (
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
                        </div>

                        {selectedDepartment && (
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

            <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Deactivate Department</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to deactivate the department "{selectedDepartment?.nameEn}"? This will
                            mark it as inactive but will not permanently delete it.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeactivateDialogOpen(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmDeactivate}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Deactivating...' : 'Deactivate'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Department</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete the department "{selectedDepartment?.nameEn}"?
                            This action cannot be undone.
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

