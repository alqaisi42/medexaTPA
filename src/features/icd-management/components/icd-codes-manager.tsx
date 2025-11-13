'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Edit, Trash2, Search, Upload, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { ICD, IcdPayload } from '@/types'
import { useAppStore } from '@/store/app-store'
import { cn, formatDate } from '@/lib/utils'
import { createIcd, deleteIcd, fetchIcds, searchIcds, updateIcd } from '@/lib/api/icd'

interface FeedbackState {
    type: 'success' | 'error'
    message: string
}

interface PageMetadata {
    totalPages: number
    totalElements: number
    numberOfElements: number
    first: boolean
    last: boolean
}

const INITIAL_FORM_STATE: IcdPayload = {
    systemCode: '',
    code: '',
    nameEn: '',
    nameAr: '',
    chapter: '',
    block: '',
    isBillable: false,
    validFrom: '',
    validTo: '',
    severityLevel: '',
    isChronic: false,
    requiresAuthorization: false,
    standardLosDays: 0,
    isActive: true,
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

export function IcdCodesManager() {
    const selectedItems = useAppStore((state) => state.selectedItems)
    const setSelectedItems = useAppStore((state) => state.setSelectedItems)
    const toggleSelectedItem = useAppStore((state) => state.toggleSelectedItem)
    const clearSelectedItems = useAppStore((state) => state.clearSelectedItems)

    const [icds, setIcds] = useState<ICD[]>([])
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
    const [isSearching, setIsSearching] = useState(false)

    const [isLoading, setIsLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<FeedbackState | null>(null)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState<IcdPayload>(INITIAL_FORM_STATE)
    const [editingIcdId, setEditingIcdId] = useState<number | null>(null)
    const [formError, setFormError] = useState<string | null>(null)

    const [chapterFilter, setChapterFilter] = useState('all')
    const [severityFilter, setSeverityFilter] = useState('all')
    const [billableFilter, setBillableFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 400)

        return () => clearTimeout(handler)
    }, [searchTerm])

    const loadIcds = useCallback(
        async (targetPage: number, targetSize: number) => {
            setIsLoading(true)
            setError(null)
            try {
                const data = await fetchIcds({ page: targetPage, size: targetSize })
                setIcds(data.content ?? [])
                setPageMeta({
                    totalPages: data.totalPages,
                    totalElements: data.totalElements,
                    numberOfElements: data.numberOfElements,
                    first: data.first,
                    last: data.last,
                })
                clearSelectedItems()
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load ICD codes')
                setIcds([])
                setPageMeta({ totalPages: 0, totalElements: 0, numberOfElements: 0, first: true, last: true })
            } finally {
                setIsLoading(false)
            }
        },
        [clearSelectedItems]
    )

    const fetchSearchResults = useCallback(
        async (keyword: string) => {
            setIsLoading(true)
            setError(null)
            try {
                const results = await searchIcds(keyword)
                setIcds(results)
                setPageMeta({
                    totalPages: results.length > 0 ? 1 : 0,
                    totalElements: results.length,
                    numberOfElements: results.length,
                    first: true,
                    last: true,
                })
                clearSelectedItems()
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to search ICD codes')
                setIcds([])
                setPageMeta({ totalPages: 0, totalElements: 0, numberOfElements: 0, first: true, last: true })
            } finally {
                setIsLoading(false)
            }
        },
        [clearSelectedItems]
    )

    useEffect(() => {
        const keyword = debouncedSearchTerm.trim()
        setActiveSearchTerm(keyword)
        if (keyword) {
            setIsSearching(true)
            void fetchSearchResults(keyword)
        } else {
            setIsSearching(false)
            void loadIcds(page, pageSize)
        }
    }, [debouncedSearchTerm, page, pageSize, fetchSearchResults, loadIcds])

    const refreshData = useCallback(async () => {
        if (activeSearchTerm) {
            await fetchSearchResults(activeSearchTerm)
        } else {
            await loadIcds(page, pageSize)
        }
    }, [activeSearchTerm, fetchSearchResults, loadIcds, page, pageSize])

    const chapterOptions = useMemo(() => {
        return Array.from(new Set(icds.map((icd) => icd.chapter).filter(Boolean))).sort()
    }, [icds])

    const severityOptions = useMemo(() => {
        return Array.from(new Set(icds.map((icd) => icd.severityLevel).filter(Boolean))).sort()
    }, [icds])

    const displayedIcds = useMemo(() => {
        return icds.filter((icd) => {
            if (chapterFilter !== 'all' && icd.chapter !== chapterFilter) {
                return false
            }
            if (severityFilter !== 'all' && icd.severityLevel !== severityFilter) {
                return false
            }
            if (statusFilter !== 'all') {
                if (statusFilter === 'active' && !icd.isActive) {
                    return false
                }
                if (statusFilter === 'inactive' && icd.isActive) {
                    return false
                }
            }
            if (billableFilter !== 'all') {
                if (billableFilter === 'billable' && !icd.isBillable) {
                    return false
                }
                if (billableFilter === 'non-billable' && icd.isBillable) {
                    return false
                }
            }
            return true
        })
    }, [icds, chapterFilter, severityFilter, statusFilter, billableFilter])

    const allDisplayedSelected = displayedIcds.length > 0 && displayedIcds.every((icd) => selectedItems.includes(String(icd.id)))

    const handleToggleAll = () => {
        if (allDisplayedSelected) {
            setSelectedItems([])
        } else {
            setSelectedItems(displayedIcds.map((icd) => String(icd.id)))
        }
    }

    const handleAdd = () => {
        setEditingIcdId(null)
        setFormData(INITIAL_FORM_STATE)
        setFormError(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (icd: ICD) => {
        setEditingIcdId(icd.id)
        setFormError(null)
        setFormData({
            systemCode: icd.systemCode ?? '',
            code: icd.code ?? '',
            nameEn: icd.nameEn ?? '',
            nameAr: icd.nameAr ?? '',
            chapter: icd.chapter ?? '',
            block: icd.block ?? '',
            isBillable: Boolean(icd.isBillable),
            validFrom: icd.validFrom ?? '',
            validTo: icd.validTo ?? '',
            severityLevel: icd.severityLevel ?? '',
            isChronic: Boolean(icd.isChronic),
            requiresAuthorization: Boolean(icd.requiresAuthorization),
            standardLosDays: icd.standardLosDays ?? 0,
            isActive: Boolean(icd.isActive),
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (icd: ICD) => {
        if (!confirm(`Are you sure you want to delete ICD ${icd.code}?`)) {
            return
        }

        setActionLoading(true)
        setFeedback(null)
        try {
            await deleteIcd(icd.id)
            setFeedback({ type: 'success', message: `ICD ${icd.code} deleted successfully.` })
            await refreshData()
        } catch (err) {
            setFeedback({
                type: 'error',
                message: err instanceof Error ? err.message : 'Failed to delete ICD record',
            })
        } finally {
            setActionLoading(false)
        }
    }

    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open)
        if (!open) {
            setEditingIcdId(null)
            setFormData(INITIAL_FORM_STATE)
            setFormError(null)
        }
    }

    const handleSave = async () => {
        setFormError(null)
        setFeedback(null)

        const requiredFields: (keyof IcdPayload)[] = [
            'systemCode',
            'code',
            'nameEn',
            'nameAr',
            'chapter',
            'block',
            'validFrom',
            'validTo',
            'severityLevel',
        ]

        const missing = requiredFields.filter((field) => {
            const value = formData[field]
            if (typeof value === 'boolean' || typeof value === 'number') {
                return false
            }
            return !value || value.toString().trim().length === 0
        })

        if (missing.length > 0) {
            setFormError('Please fill in all required fields highlighted with * before saving.')
            return
        }

        if (Number.isNaN(formData.standardLosDays)) {
            setFormError('Standard LOS days must be a valid number.')
            return
        }

        const payload: IcdPayload = {
            ...formData,
            standardLosDays: Number(formData.standardLosDays ?? 0),
        }

        setActionLoading(true)
        try {
            if (editingIcdId !== null) {
                await updateIcd(editingIcdId, payload)
                setFeedback({ type: 'success', message: 'ICD updated successfully.' })
            } else {
                await createIcd(payload)
                setFeedback({ type: 'success', message: 'ICD created successfully.' })
            }
            handleDialogChange(false)
            await refreshData()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Unable to save ICD record at this time.')
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

    const totalSelected = selectedItems.length
    const totalRecordsLabel = isSearching
        ? `${displayedIcds.length} result${displayedIcds.length === 1 ? '' : 's'} found`
        : `${pageMeta.numberOfElements} of ${pageMeta.totalElements} records`

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
                                placeholder="Search ICD codes or names..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="pl-10"
                                aria-label="Search ICD codes"
                            />
                        </div>
                        <Select value={chapterFilter} onValueChange={setChapterFilter}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="All chapters" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All chapters</SelectItem>
                                {chapterOptions.map((chapter) => (
                                    <SelectItem key={chapter} value={chapter}>
                                        {chapter}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={severityFilter} onValueChange={setSeverityFilter}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="All severity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All severity</SelectItem>
                                {severityOptions.map((severity) => (
                                    <SelectItem key={severity} value={severity}>
                                        {severity}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-36">
                                <SelectValue placeholder="All status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={billableFilter} onValueChange={setBillableFilter}>
                            <SelectTrigger className="w-full sm:w-36">
                                <SelectValue placeholder="Billable" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All billing</SelectItem>
                                <SelectItem value="billable">Billable</SelectItem>
                                <SelectItem value="non-billable">Non-billable</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button variant="outline" size="sm" disabled={isLoading || actionLoading}>
                            <Upload className="mr-2 h-4 w-4" />
                            Import
                        </Button>
                        <Button variant="outline" size="sm" disabled={isLoading || actionLoading}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button onClick={handleAdd} className="bg-tpa-primary hover:bg-tpa-accent" disabled={isLoading}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add ICD
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
                    <span>{totalRecordsLabel}</span>
                    {activeSearchTerm && (
                        <span>
                            Showing results for <strong className="text-gray-800">{activeSearchTerm}</strong>
                        </span>
                    )}
                    {totalSelected > 0 && (
                        <span className="font-medium text-tpa-primary">{totalSelected} selected</span>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <input
                                    type="checkbox"
                                    className="rounded"
                                    checked={allDisplayedSelected}
                                    onChange={handleToggleAll}
                                    aria-label="Select all ICD codes"
                                />
                            </TableHead>
                            <TableHead>System</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Name (EN)</TableHead>
                            <TableHead>Name (AR)</TableHead>
                            <TableHead>Chapter</TableHead>
                            <TableHead>Block</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Billable</TableHead>
                            <TableHead>Validity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={12} className="py-10 text-center text-gray-500">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading ICD records...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : displayedIcds.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={12} className="py-10 text-center text-gray-500">
                                    No ICD records found. Adjust filters or create a new entry.
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayedIcds.map((icd) => {
                                const isSelected = selectedItems.includes(String(icd.id))
                                return (
                                    <TableRow key={icd.id} className="hover:bg-gray-50">
                                        <TableCell>
                                            <input
                                                type="checkbox"
                                                className="rounded"
                                                checked={isSelected}
                                                onChange={() => toggleSelectedItem(String(icd.id))}
                                                aria-label={`Select ICD ${icd.code}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{icd.systemCode}</TableCell>
                                        <TableCell>{icd.code}</TableCell>
                                        <TableCell>{icd.nameEn}</TableCell>
                                        <TableCell className="text-right" dir="rtl">
                                            {icd.nameAr}
                                        </TableCell>
                                        <TableCell>{icd.chapter}</TableCell>
                                        <TableCell>{icd.block}</TableCell>
                                        <TableCell>{icd.severityLevel || '-'}</TableCell>
                                        <TableCell>
                                            <span
                                                className={cn(
                                                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                                    icd.isBillable
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                )}
                                            >
                                                {icd.isBillable ? 'Billable' : 'Non-billable'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            <div>{icd.validFrom ? formatDate(icd.validFrom) : '-'}</div>
                                            <div>{icd.validTo ? formatDate(icd.validTo) : '-'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={cn(
                                                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                                                    icd.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'
                                                )}
                                            >
                                                {icd.isActive ? 'active' : 'inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(icd)}
                                                    disabled={actionLoading || isLoading}
                                                    aria-label={`Edit ICD ${icd.code}`}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(icd)}
                                                    disabled={actionLoading || isLoading}
                                                    aria-label={`Delete ICD ${icd.code}`}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isSearching && (
                <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between">
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
                        <span className="text-sm text-gray-600">
                            Page {page + 1} of {Math.max(pageMeta.totalPages, 1)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Rows per page:</span>
                        <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                            <SelectTrigger className="w-24">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingIcdId !== null ? 'Edit ICD' : 'Add New ICD'}</DialogTitle>
                        <DialogDescription>
                            {editingIcdId !== null
                                ? 'Update the classification details for this ICD entry.'
                                : 'Provide classification details to register a new ICD code.'}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="basic">Basic Information</TabsTrigger>
                            <TabsTrigger value="classification">Classification Details</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="systemCode">System Code *</Label>
                                    <Input
                                        id="systemCode"
                                        value={formData.systemCode}
                                        onChange={(event) =>
                                            setFormData((prev) => ({ ...prev, systemCode: event.target.value }))
                                        }
                                        placeholder="Enter system code"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">ICD Code *</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(event) => setFormData((prev) => ({ ...prev, code: event.target.value }))}
                                        placeholder="e.g., A00.0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nameEn">Name (English) *</Label>
                                    <Input
                                        id="nameEn"
                                        value={formData.nameEn}
                                        onChange={(event) =>
                                            setFormData((prev) => ({ ...prev, nameEn: event.target.value }))
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
                                            setFormData((prev) => ({ ...prev, nameAr: event.target.value }))
                                        }
                                        placeholder="أدخل الاسم بالعربية"
                                        dir="rtl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="chapter">Chapter *</Label>
                                    <Input
                                        id="chapter"
                                        value={formData.chapter}
                                        onChange={(event) =>
                                            setFormData((prev) => ({ ...prev, chapter: event.target.value }))
                                        }
                                        placeholder="Enter chapter"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="block">Block *</Label>
                                    <Input
                                        id="block"
                                        value={formData.block}
                                        onChange={(event) =>
                                            setFormData((prev) => ({ ...prev, block: event.target.value }))
                                        }
                                        placeholder="Enter block"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="severityLevel">Severity Level *</Label>
                                    <Input
                                        id="severityLevel"
                                        value={formData.severityLevel}
                                        onChange={(event) =>
                                            setFormData((prev) => ({ ...prev, severityLevel: event.target.value }))
                                        }
                                        placeholder="Enter severity level"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="standardLosDays">Standard LOS Days</Label>
                                    <Input
                                        id="standardLosDays"
                                        type="number"
                                        min={0}
                                        value={formData.standardLosDays}
                                        onChange={(event) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                standardLosDays: Number(event.target.value) || 0,
                                            }))
                                        }
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="validFrom">Valid From *</Label>
                                    <Input
                                        id="validFrom"
                                        type="date"
                                        value={formData.validFrom}
                                        onChange={(event) =>
                                            setFormData((prev) => ({ ...prev, validFrom: event.target.value }))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="validTo">Valid To *</Label>
                                    <Input
                                        id="validTo"
                                        type="date"
                                        value={formData.validTo}
                                        onChange={(event) =>
                                            setFormData((prev) => ({ ...prev, validTo: event.target.value }))
                                        }
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="classification" className="space-y-6 pt-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="flex items-center justify-between rounded-md border p-3">
                                    <div>
                                        <p className="text-sm font-medium">Billable</p>
                                        <p className="text-xs text-gray-500">
                                            Indicates if this ICD can be used for billing purposes.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.isBillable}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({ ...prev, isBillable: checked }))
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-md border p-3">
                                    <div>
                                        <p className="text-sm font-medium">Requires Authorization</p>
                                        <p className="text-xs text-gray-500">
                                            Some ICD codes need prior authorization before use.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.requiresAuthorization}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({ ...prev, requiresAuthorization: checked }))
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-md border p-3">
                                    <div>
                                        <p className="text-sm font-medium">Chronic Condition</p>
                                        <p className="text-xs text-gray-500">Flag whether this diagnosis is chronic in nature.</p>
                                    </div>
                                    <Switch
                                        checked={formData.isChronic}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({ ...prev, isChronic: checked }))
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-md border p-3">
                                    <div>
                                        <p className="text-sm font-medium">Active</p>
                                        <p className="text-xs text-gray-500">Inactive codes remain in history but cannot be used.</p>
                                    </div>
                                    <Switch
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({ ...prev, isActive: checked }))
                                        }
                                    />
                                </div>
                            </div>
                            <div className="rounded-md border p-4 text-sm text-gray-600">
                                Ensure the validity dates align with official release schedules. Chronic and authorization
                                flags help downstream processes determine medical necessity workflows.
                            </div>
                        </TabsContent>
                    </Tabs>

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
                            ) : editingIcdId !== null ? (
                                'Update'
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
