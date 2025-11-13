'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Search, Trash2, Edit } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
    createDiagnosisCategory,
    deleteDiagnosisCategory,
    fetchDiagnosisCategories,
    fetchDiagnosisCategoryByName,
    updateDiagnosisCategory,
} from '@/lib/api/diagnosis-categories'
import { cn, formatDate } from '@/lib/utils'
import { DiagnosisCategory, DiagnosisCategoryPayload } from '@/types'

interface PageMetadata {
    totalPages: number
    totalElements: number
    numberOfElements: number
    first: boolean
    last: boolean
}

interface FeedbackState {
    type: 'success' | 'error'
    message: string
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const INITIAL_FORM_STATE: DiagnosisCategoryPayload = {
    code: '',
    nameEn: '',
    nameAr: '',
    isActive: true,
    effectiveFrom: '',
    effectiveTo: '',
}

function toInputDateTime(value?: string): string {
    if (!value) {
        return ''
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return ''
    }

    const tzOffset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

function fromInputDateTime(value: string): string | undefined {
    if (!value) {
        return undefined
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return undefined
    }

    return date.toISOString()
}

export function DiagnosisCategoriesManager() {
    const [categories, setCategories] = useState<DiagnosisCategory[]>([])
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])
    const [pageMeta, setPageMeta] = useState<PageMetadata>({
        totalPages: 0,
        totalElements: 0,
        numberOfElements: 0,
        first: true,
        last: true,
    })

    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [activeSearchTerm, setActiveSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

    const [isLoading, setIsLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<FeedbackState | null>(null)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState<DiagnosisCategoryPayload>(INITIAL_FORM_STATE)
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
    const [formError, setFormError] = useState<string | null>(null)
    const [pendingAction, setPendingAction] = useState<{
        type: 'edit' | 'delete'
        category: DiagnosisCategory
    } | null>(null)

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 400)
        return () => clearTimeout(handler)
    }, [searchTerm])

    const loadCategories = useCallback(
        async (targetPage: number, targetSize: number) => {
            setIsLoading(true)
            setError(null)
            try {
                const data = await fetchDiagnosisCategories({ page: targetPage, size: targetSize })
                setCategories(data.content ?? [])
                setPageMeta({
                    totalPages: data.totalPages,
                    totalElements: data.totalElements,
                    numberOfElements: data.numberOfElements,
                    first: data.first,
                    last: data.last,
                })
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load diagnosis categories')
                setCategories([])
                setPageMeta({ totalPages: 0, totalElements: 0, numberOfElements: 0, first: true, last: true })
            } finally {
                setIsLoading(false)
            }
        },
        []
    )

    const loadCategoryByName = useCallback(async (name: string) => {
        setIsLoading(true)
        setError(null)
        try {
            const category = await fetchDiagnosisCategoryByName(name)
            if (category) {
                setCategories([category])
                setPageMeta({
                    totalPages: 1,
                    totalElements: 1,
                    numberOfElements: 1,
                    first: true,
                    last: true,
                })
            } else {
                setCategories([])
                setPageMeta({
                    totalPages: 0,
                    totalElements: 0,
                    numberOfElements: 0,
                    first: true,
                    last: true,
                })
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to find a diagnosis category with that name')
            setCategories([])
            setPageMeta({ totalPages: 0, totalElements: 0, numberOfElements: 0, first: true, last: true })
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        const keyword = debouncedSearchTerm.trim()
        setActiveSearchTerm(keyword)
        if (keyword) {
            setIsSearching(true)
            void loadCategoryByName(keyword)
        } else {
            setIsSearching(false)
            void loadCategories(page, pageSize)
        }
    }, [debouncedSearchTerm, loadCategories, loadCategoryByName, page, pageSize])

    const refreshData = useCallback(async () => {
        if (activeSearchTerm) {
            await loadCategoryByName(activeSearchTerm)
        } else {
            await loadCategories(page, pageSize)
        }
    }, [activeSearchTerm, loadCategories, loadCategoryByName, page, pageSize])

    const filteredCategories = useMemo(() => {
        return categories.filter((category) => {
            if (statusFilter === 'active' && !category.isActive) {
                return false
            }
            if (statusFilter === 'inactive' && category.isActive) {
                return false
            }
            return true
        })
    }, [categories, statusFilter])

    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open)
        if (!open) {
            setFormData(INITIAL_FORM_STATE)
            setFormError(null)
            setEditingCategoryId(null)
        }
    }

    const handleAdd = () => {
        setEditingCategoryId(null)
        setFormData(INITIAL_FORM_STATE)
        setFormError(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (category: DiagnosisCategory) => {
        setPendingAction({ type: 'edit', category })
    }

    const handleDelete = (category: DiagnosisCategory) => {
        setPendingAction({ type: 'delete', category })
    }

    const cancelPendingAction = () => {
        if (actionLoading) {
            return
        }
        setPendingAction(null)
    }

    const executePendingAction = async () => {
        if (!pendingAction) {
            return
        }

        if (pendingAction.type === 'edit') {
            const category = pendingAction.category
            setPendingAction(null)
            setEditingCategoryId(category.id)
            setFormError(null)
            setFormData({
                code: category.code ?? '',
                nameEn: category.nameEn ?? '',
                nameAr: category.nameAr ?? '',
                isActive: Boolean(category.isActive),
                effectiveFrom: category.effectiveFrom ?? '',
                effectiveTo: category.effectiveTo ?? '',
            })
            setIsDialogOpen(true)
            return
        }

        const category = pendingAction.category
        setActionLoading(true)
        setFeedback(null)
        try {
            await deleteDiagnosisCategory(category.id)
            setFeedback({ type: 'success', message: `${category.nameEn} deleted successfully.` })
            await refreshData()
        } catch (err) {
            setFeedback({
                type: 'error',
                message: err instanceof Error ? err.message : 'Failed to delete diagnosis category',
            })
        } finally {
            setActionLoading(false)
            setPendingAction(null)
        }
    }

    const handleSave = async () => {
        setFormError(null)
        setFeedback(null)

        if (!formData.code.trim() || !formData.nameEn.trim() || !formData.nameAr.trim()) {
            setFormError('Code, English name, and Arabic name are required fields.')
            return
        }

        const payload: DiagnosisCategoryPayload & { id?: number } = {
            ...formData,
            effectiveFrom: formData.effectiveFrom ? formData.effectiveFrom : undefined,
            effectiveTo: formData.effectiveTo ? formData.effectiveTo : undefined,
        }

        setActionLoading(true)
        try {
            if (editingCategoryId) {
                await updateDiagnosisCategory({ ...payload, id: editingCategoryId })
                setFeedback({ type: 'success', message: 'Diagnosis category updated successfully.' })
            } else {
                await createDiagnosisCategory(payload)
                setFeedback({ type: 'success', message: 'Diagnosis category created successfully.' })
            }
            handleDialogChange(false)
            await refreshData()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Unable to save diagnosis category')
        } finally {
            setActionLoading(false)
        }
    }

    const handlePageChange = (direction: 'next' | 'prev') => {
        if (direction === 'next' && !pageMeta.last) {
            setPage((prev) => prev + 1)
        }
        if (direction === 'prev' && !pageMeta.first) {
            setPage((prev) => Math.max(prev - 1, 0))
        }
    }

    const handlePageSizeChange = (value: string) => {
        const newSize = Number(value)
        setPageSize(newSize)
        setPage(0)
    }

    const totalRecordsLabel = isSearching
        ? `${filteredCategories.length} result${filteredCategories.length === 1 ? '' : 's'} found`
        : `${pageMeta.numberOfElements} of ${pageMeta.totalElements} records`

    const pendingCategory = pendingAction?.category

    return (
        <div className="space-y-6">
            {feedback && (
                <div
                    className={cn(
                        'rounded-md border px-4 py-3 text-sm',
                        feedback.type === 'success'
                            ? 'border-green-200 bg-green-50 text-green-800'
                            : 'border-red-200 bg-red-50 text-red-700'
                    )}
                >
                    {feedback.message}
                </div>
            )}

            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by category name (exact match)"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="pl-10"
                                aria-label="Search diagnosis categories by name"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                            <SelectTrigger className="w-full sm:w-36">
                                <SelectValue placeholder="All status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={handleAdd} className="bg-tpa-primary hover:bg-tpa-accent" disabled={isLoading}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                    </Button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
                    <span>{totalRecordsLabel}</span>
                    {activeSearchTerm && (
                        <span>
                            Showing results for <strong className="text-gray-800">{activeSearchTerm}</strong>
                        </span>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name (EN)</TableHead>
                            <TableHead>Name (AR)</TableHead>
                            <TableHead>Effective</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-10 text-center text-gray-500">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading categories...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-10 text-center text-gray-500">
                                    No diagnosis categories found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCategories.map((category) => (
                                <TableRow key={category.id} className="hover:bg-gray-50">
                                    <TableCell className="font-medium">{category.code}</TableCell>
                                    <TableCell>{category.nameEn}</TableCell>
                                    <TableCell dir="rtl">{category.nameAr}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs text-gray-600">
                                            {category.effectiveFrom && (
                                                <span>From {formatDate(category.effectiveFrom)}</span>
                                            )}
                                            {category.effectiveTo && <span>To {formatDate(category.effectiveTo)}</span>}
                                            {!category.effectiveFrom && !category.effectiveTo && <span>Not specified</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={cn(
                                                'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                                                category.isActive
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-200 text-gray-600'
                                            )}
                                        >
                                            {category.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(category)}
                                                disabled={actionLoading}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isSearching && (
                <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange('prev')}
                            disabled={pageMeta.first || isLoading}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange('next')}
                            disabled={pageMeta.last || isLoading}
                        >
                            Next
                        </Button>
                        <span>
                            Page {page + 1} of {Math.max(pageMeta.totalPages, 1)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Rows</span>
                        <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                            <SelectTrigger className="w-20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAGE_SIZE_OPTIONS.map((sizeOption) => (
                                    <SelectItem key={sizeOption} value={String(sizeOption)}>
                                        {sizeOption}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategoryId ? 'Edit Diagnosis Category' : 'Create Diagnosis Category'}
                        </DialogTitle>
                        <DialogDescription>
                            Maintain high-level groupings to speed up ICD navigation and reporting.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 pt-2">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="categoryCode">Code *</Label>
                                <Input
                                    id="categoryCode"
                                    value={formData.code}
                                    onChange={(event) => setFormData((prev) => ({ ...prev, code: event.target.value }))}
                                    placeholder="Enter unique category code"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="categoryActive">Active</Label>
                                <div className="flex items-center gap-3 rounded-md border p-3">
                                    <span className="text-sm text-gray-600">Available for use</span>
                                    <Switch
                                        id="categoryActive"
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({ ...prev, isActive: checked }))
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="categoryNameEn">Name (English) *</Label>
                                <Input
                                    id="categoryNameEn"
                                    value={formData.nameEn}
                                    onChange={(event) => setFormData((prev) => ({ ...prev, nameEn: event.target.value }))}
                                    placeholder="Enter English name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="categoryNameAr">Name (Arabic) *</Label>
                                <Input
                                    id="categoryNameAr"
                                    value={formData.nameAr}
                                    onChange={(event) => setFormData((prev) => ({ ...prev, nameAr: event.target.value }))}
                                    placeholder="أدخل الاسم بالعربية"
                                    dir="rtl"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="effectiveFrom">Effective From</Label>
                                <Input
                                    id="effectiveFrom"
                                    type="datetime-local"
                                    value={toInputDateTime(formData.effectiveFrom)}
                                    onChange={(event) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            effectiveFrom: fromInputDateTime(event.target.value) ?? '',
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="effectiveTo">Effective To</Label>
                                <Input
                                    id="effectiveTo"
                                    type="datetime-local"
                                    value={toInputDateTime(formData.effectiveTo)}
                                    onChange={(event) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            effectiveTo: fromInputDateTime(event.target.value) ?? '',
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {formError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {formError}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleDialogChange(false)} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-tpa-primary hover:bg-tpa-accent"
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : editingCategoryId ? (
                                'Update'
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && cancelPendingAction()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {pendingAction?.type === 'delete'
                                ? 'Delete Diagnosis Category'
                                : 'Edit Diagnosis Category'}
                        </DialogTitle>
                        <DialogDescription>
                            {pendingAction?.type === 'delete'
                                ? 'Deleting a category will remove it from reports and mappings. This action cannot be undone.'
                                : 'You are about to modify this diagnosis category. Confirm to proceed.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p>
                            Category: <span className="font-medium text-gray-900">{pendingCategory?.nameEn}</span>
                        </p>
                        {pendingCategory?.code && (
                            <p>
                                Code: <span className="font-medium text-gray-900">{pendingCategory.code}</span>
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={cancelPendingAction} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => void executePendingAction()}
                            className={cn(
                                pendingAction?.type === 'delete'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-tpa-primary hover:bg-tpa-accent'
                            )}
                            disabled={actionLoading}
                        >
                            {actionLoading && pendingAction?.type === 'delete' ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                                </>
                            ) : pendingAction?.type === 'delete' ? (
                                'Delete'
                            ) : (
                                'Continue'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
