'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Plus,
    Search,
    Filter,
    Loader2,
    Eye,
    RefreshCcw,
    Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
    CreateProcedurePayload,
    ProcedureCategoryRecord,
    ProcedureDetails,
    ProcedureSearchFilters,
    ProcedureSummary,
} from '@/types'
import {
    createProcedure,
    fetchProcedureCategories,
    getProcedureDetails,
    searchProcedures,
} from '@/lib/api/procedures'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

const PAGE_SIZE_OPTIONS = [10, 20, 50]
const BOOLEAN_SELECT_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' },
]

const INITIAL_FORM_STATE: CreateProcedurePayload = {
    systemCode: '',
    code: '',
    nameEn: '',
    nameAr: '',
    unitOfMeasure: '',
    isSurgical: false,
    referencePrice: 0,
    requiresAuthorization: false,
    requiresAnesthesia: false,
    minIntervalDays: 0,
    maxFrequencyPerYear: 0,
    standardDurationMinutes: 0,
    validFrom: '',
    validTo: '',
    isActive: true,
    createdBy: '',
    updatedBy: '',
}

const INITIAL_FILTERS: ProcedureSearchFilters = {
    keyword: '',
    systemCode: '',
    isSurgical: null,
    requiresAuthorization: null,
    requiresAnesthesia: null,
    isActive: null,
    minPrice: null,
    maxPrice: null,
    validOn: '',
    categoryId: null,
    containerId: null,
}

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

export function ProceduresManagementPage() {
    const selectedItems = useAppStore((state) => state.selectedItems)
    const setSelectedItems = useAppStore((state) => state.setSelectedItems)
    const toggleSelectedItem = useAppStore((state) => state.toggleSelectedItem)
    const clearSelectedItems = useAppStore((state) => state.clearSelectedItems)

    const [procedures, setProcedures] = useState<ProcedureSummary[]>([])
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
    const [filters, setFilters] = useState<ProcedureSearchFilters>(INITIAL_FILTERS)
    const [showFilters, setShowFilters] = useState(false)

    const [categories, setCategories] = useState<ProcedureCategoryRecord[]>([])

    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formError, setFormError] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<FeedbackState | null>(null)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState<CreateProcedurePayload>(INITIAL_FORM_STATE)

    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [detailsError, setDetailsError] = useState<string | null>(null)
    const [procedureDetails, setProcedureDetails] = useState<ProcedureDetails | null>(null)
    const [detailsId, setDetailsId] = useState<number | null>(null)

    const allDisplayedSelected =
        procedures.length > 0 && procedures.every((procedure) => selectedItems.includes(String(procedure.id)))

    const handleToggleAll = () => {
        if (allDisplayedSelected) {
            clearSelectedItems()
        } else {
            setSelectedItems(procedures.map((procedure) => String(procedure.id)))
        }
    }

    useEffect(() => {
        let isMounted = true
        ;(async () => {
            try {
                const data = await fetchProcedureCategories({ page: 0, size: 100 })
                if (isMounted) {
                    setCategories(data.content ?? [])
                }
            } catch (categoryError) {
                console.warn('Unable to load procedure categories', categoryError)
            }
        })()

        return () => {
            isMounted = false
        }
    }, [])

    useEffect(() => {
        const handler = setTimeout(() => {
            const trimmed = searchTerm.trim()
            setFilters((prev) => {
                if (prev.keyword === trimmed) {
                    return prev
                }
                setPage(0)
                return { ...prev, keyword: trimmed }
            })
        }, 400)

        return () => clearTimeout(handler)
    }, [searchTerm])

    const loadProcedures = useCallback(
        async (targetPage: number, targetSize: number, activeFilters: ProcedureSearchFilters) => {
            setIsLoading(true)
            setError(null)
            setFeedback((prev) => (prev && prev.type === 'success' ? prev : null))

            try {
                const usingSearch = hasActiveFilters(activeFilters)
                const data = await searchProcedures({ filters: activeFilters, page: targetPage, size: targetSize })

                setProcedures(data.content ?? [])
                setPageMeta({
                    totalPages: data.totalPages,
                    totalElements: data.totalElements,
                    numberOfElements: data.numberOfElements,
                    first: data.first,
                    last: data.last,
                })
                setIsSearching(usingSearch)
                clearSelectedItems()
            } catch (err) {
                setProcedures([])
                setPageMeta({ totalPages: 0, totalElements: 0, numberOfElements: 0, first: true, last: true })
                setError(err instanceof Error ? err.message : 'Failed to load procedures')
            } finally {
                setIsLoading(false)
            }
        },
        [clearSelectedItems],
    )

    useEffect(() => {
        void loadProcedures(page, pageSize, filters)
    }, [page, pageSize, filters, loadProcedures])

    const handleAdd = () => {
        setFormData(INITIAL_FORM_STATE)
        setFormError(null)
        setIsDialogOpen(true)
    }

    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open)
        if (!open) {
            setFormData(INITIAL_FORM_STATE)
            setFormError(null)
        }
    }

    const handleSave = async () => {
        setFormError(null)
        setFeedback(null)

        const requiredFields: (keyof CreateProcedurePayload)[] = [
            'systemCode',
            'code',
            'nameEn',
            'nameAr',
            'unitOfMeasure',
            'validFrom',
            'validTo',
        ]

        const missing = requiredFields.filter((field) => !String(formData[field] ?? '').trim())
        if (missing.length > 0) {
            setFormError('Please fill in all required fields marked with * before saving.')
            return
        }

        const numericFields: (keyof CreateProcedurePayload)[] = [
            'referencePrice',
            'minIntervalDays',
            'maxFrequencyPerYear',
            'standardDurationMinutes',
        ]

        for (const field of numericFields) {
            const value = Number(formData[field])
            if (Number.isNaN(value)) {
                setFormError('Please ensure numeric fields contain valid numbers.')
                return
            }
        }

        const payload: CreateProcedurePayload = {
            ...formData,
            referencePrice: Number(formData.referencePrice),
            minIntervalDays: Number(formData.minIntervalDays),
            maxFrequencyPerYear: Number(formData.maxFrequencyPerYear),
            standardDurationMinutes: Number(formData.standardDurationMinutes),
            createdBy: formData.createdBy?.trim() || undefined,
            updatedBy: formData.updatedBy?.trim() || undefined,
        }

        setIsSaving(true)
        try {
            await createProcedure(payload)
            setFeedback({ type: 'success', message: 'Procedure created successfully.' })
            handleDialogChange(false)
            if (page !== 0) {
                setPage(0)
            } else {
                await loadProcedures(0, pageSize, filters)
            }
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Unable to create procedure at this time.')
            setFeedback({ type: 'error', message: 'Unable to create procedure.' })
        } finally {
            setIsSaving(false)
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

    const handleFilterToggle = () => {
        setShowFilters((prev) => !prev)
    }

    const handleRefresh = () => {
        void loadProcedures(page, pageSize, filters)
    }

    const handleBooleanFilterChange = (field: keyof ProcedureSearchFilters) => (value: string) => {
        const parsedValue = parseBooleanSelect(value)
        setFilters((prev) => ({ ...prev, [field]: parsedValue }))
        setPage(0)
    }

    const handleCategoryChange = (value: string) => {
        setFilters((prev) => ({ ...prev, categoryId: value === 'all' ? null : Number(value) }))
        setPage(0)
    }

    const handleValidOnChange = (value: string) => {
        setFilters((prev) => ({ ...prev, validOn: value }))
        setPage(0)
    }

    const handleMinPriceChange = (value: string) => {
        setFilters((prev) => ({ ...prev, minPrice: value ? Number(value) : null }))
        setPage(0)
    }

    const handleMaxPriceChange = (value: string) => {
        setFilters((prev) => ({ ...prev, maxPrice: value ? Number(value) : null }))
        setPage(0)
    }

    const handleSystemCodeChange = (value: string) => {
        setFilters((prev) => ({ ...prev, systemCode: value }))
        setPage(0)
    }

    const handleContainerChange = (value: string) => {
        setFilters((prev) => ({ ...prev, containerId: value ? Number(value) : null }))
        setPage(0)
    }

    const handleViewDetails = (procedure: ProcedureSummary) => {
        setDetailsId(procedure.id)
        setIsDetailsOpen(true)
    }

    const handleDetailsOpenChange = (open: boolean) => {
        setIsDetailsOpen(open)
        if (!open) {
            setProcedureDetails(null)
            setDetailsError(null)
            setDetailsId(null)
        }
    }

    useEffect(() => {
        if (!isDetailsOpen || detailsId === null) {
            return
        }

        setDetailsLoading(true)
        setDetailsError(null)
        setProcedureDetails(null)

        ;(async () => {
            try {
                const detail = await getProcedureDetails(detailsId)
                setProcedureDetails(detail)
            } catch (err) {
                setDetailsError(err instanceof Error ? err.message : 'Failed to load procedure details')
            } finally {
                setDetailsLoading(false)
            }
        })()
    }, [isDetailsOpen, detailsId, getProcedureDetails])

    const totalRecordsLabel = isSearching
        ? `${procedures.length} result${procedures.length === 1 ? '' : 's'} found`
        : `${pageMeta.numberOfElements} of ${pageMeta.totalElements} records`

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">Procedures Management</h1>
                <p className="text-gray-600">Manage procedures master data, pricing, and availability.</p>
            </div>

            {feedback && (
                <div
                    className={cn(
                        'rounded-md border px-4 py-3 text-sm',
                        feedback.type === 'success'
                            ? 'border-green-200 bg-green-50 text-green-800'
                            : 'border-red-200 bg-red-50 text-red-700',
                    )}
                >
                    {feedback.message}
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <Info className="h-4 w-4" />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by code or name..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="pl-10"
                                aria-label="Search procedures"
                            />
                        </div>

                        <Select value={booleanToSelectValue(filters.isActive)} onValueChange={handleBooleanFilterChange('isActive')}>
                            <SelectTrigger className="w-full sm:w-32">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {BOOLEAN_SELECT_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                            <SelectTrigger className="w-full sm:w-24">
                                <SelectValue placeholder="Page size" />
                            </SelectTrigger>
                            <SelectContent>
                                {PAGE_SIZE_OPTIONS.map((option) => (
                                    <SelectItem key={option} value={String(option)}>
                                        {option} / page
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="outline" onClick={handleFilterToggle} className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
                            <RefreshCcw className="h-4 w-4" />
                            Refresh
                        </Button>
                        <Button onClick={handleAdd} className="bg-tpa-primary hover:bg-tpa-accent text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Procedure
                        </Button>
                    </div>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="systemCode">System Code</Label>
                            <Input
                                id="systemCode"
                                value={filters.systemCode ?? ''}
                                onChange={(event) => handleSystemCodeChange(event.target.value)}
                                placeholder="Filter by system code"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="categoryFilter">Category</Label>
                            <Select
                                value={filters.categoryId !== null && filters.categoryId !== undefined ? String(filters.categoryId) : 'all'}
                                onValueChange={handleCategoryChange}
                            >
                                <SelectTrigger id="categoryFilter">
                                    <SelectValue placeholder="All categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All categories</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={String(category.id)}>
                                            {category.nameEn}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="validOn">Valid On</Label>
                            <Input
                                id="validOn"
                                type="date"
                                value={filters.validOn ?? ''}
                                onChange={(event) => handleValidOnChange(event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="isSurgical">Surgical</Label>
                            <Select
                                value={booleanToSelectValue(filters.isSurgical)}
                                onValueChange={handleBooleanFilterChange('isSurgical')}
                            >
                                <SelectTrigger id="isSurgical">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BOOLEAN_SELECT_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="requiresAuthorization">Requires Authorization</Label>
                            <Select
                                value={booleanToSelectValue(filters.requiresAuthorization)}
                                onValueChange={handleBooleanFilterChange('requiresAuthorization')}
                            >
                                <SelectTrigger id="requiresAuthorization">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BOOLEAN_SELECT_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="requiresAnesthesia">Requires Anesthesia</Label>
                            <Select
                                value={booleanToSelectValue(filters.requiresAnesthesia)}
                                onValueChange={handleBooleanFilterChange('requiresAnesthesia')}
                            >
                                <SelectTrigger id="requiresAnesthesia">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BOOLEAN_SELECT_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="minPrice">Min Reference Price</Label>
                            <Input
                                id="minPrice"
                                type="number"
                                min="0"
                                step="0.01"
                                value={filters.minPrice ?? ''}
                                onChange={(event) => handleMinPriceChange(event.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maxPrice">Max Reference Price</Label>
                            <Input
                                id="maxPrice"
                                type="number"
                                min="0"
                                step="0.01"
                                value={filters.maxPrice ?? ''}
                                onChange={(event) => handleMaxPriceChange(event.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="containerId">Container ID</Label>
                            <Input
                                id="containerId"
                                type="number"
                                min="0"
                                value={filters.containerId ?? ''}
                                onChange={(event) => handleContainerChange(event.target.value)}
                                placeholder="Enter container identifier"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-sm text-gray-600">
                    <span>{totalRecordsLabel}</span>
                    <span>{selectedItems.length} selected</span>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <input
                                    type="checkbox"
                                    className="rounded"
                                    checked={allDisplayedSelected}
                                    onChange={handleToggleAll}
                                    aria-label="Select all procedures"
                                />
                            </TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Name (EN)</TableHead>
                            <TableHead>Name (AR)</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Reference Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Flags</TableHead>
                            <TableHead className="w-24 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center">
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading procedures...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : procedures.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center text-sm text-gray-500">
                                    No procedures found. Try adjusting your search or filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            procedures.map((procedure) => (
                                <TableRow key={procedure.id} className="hover:bg-gray-50">
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            className="rounded"
                                            checked={selectedItems.includes(String(procedure.id))}
                                            onChange={() => toggleSelectedItem(String(procedure.id))}
                                            aria-label={`Select procedure ${procedure.code}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{procedure.code}</TableCell>
                                    <TableCell>{procedure.nameEn}</TableCell>
                                    <TableCell className="text-right" dir="rtl">
                                        {procedure.nameAr}
                                    </TableCell>
                                    <TableCell>{procedure.unitOfMeasure}</TableCell>
                                    <TableCell>{formatCurrency(procedure.referencePrice)}</TableCell>
                                    <TableCell>
                                        <span
                                            className={cn(
                                                'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                                                procedure.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-700',
                                            )}
                                        >
                                            {procedure.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            {procedure.isSurgical && (
                                                <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">Surgical</span>
                                            )}
                                            {procedure.requiresAuthorization && (
                                                <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">Auth</span>
                                            )}
                                            {procedure.requiresAnesthesia && (
                                                <span className="rounded bg-purple-100 px-2 py-1 text-purple-700">Anesthesia</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewDetails(procedure)}
                                            aria-label={`View details for ${procedure.code}`}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pageMeta.first}
                            onClick={() => handlePageChange('prev')}
                        >
                            Previous
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pageMeta.last}
                            onClick={() => handlePageChange('next')}
                        >
                            Next
                        </Button>
                        <span>
                            Page {page + 1} of {Math.max(pageMeta.totalPages, 1)}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500">
                        Showing records {page * pageSize + 1} – {page * pageSize + procedures.length}
                    </div>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Add New Procedure</DialogTitle>
                        <DialogDescription>Provide procedure master data and pricing information.</DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="basic">Basic Information</TabsTrigger>
                            <TabsTrigger value="pricing">Pricing & Availability</TabsTrigger>
                            <TabsTrigger value="ownership">Ownership & Audit</TabsTrigger>
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
                                    <Label htmlFor="code">Procedure Code *</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(event) => setFormData((prev) => ({ ...prev, code: event.target.value }))}
                                        placeholder="Enter procedure code"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nameEn">Name (English) *</Label>
                                    <Input
                                        id="nameEn"
                                        value={formData.nameEn}
                                        onChange={(event) => setFormData((prev) => ({ ...prev, nameEn: event.target.value }))}
                                        placeholder="Enter English name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nameAr">Name (Arabic) *</Label>
                                    <Input
                                        id="nameAr"
                                        value={formData.nameAr}
                                        onChange={(event) => setFormData((prev) => ({ ...prev, nameAr: event.target.value }))}
                                        placeholder="أدخل الاسم بالعربية"
                                        dir="rtl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
                                    <Input
                                        id="unitOfMeasure"
                                        value={formData.unitOfMeasure}
                                        onChange={(event) =>
                                            setFormData((prev) => ({ ...prev, unitOfMeasure: event.target.value }))
                                        }
                                        placeholder="e.g., procedure, visit"
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <Switch
                                        id="isActive"
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({ ...prev, isActive: checked }))
                                        }
                                    />
                                    <Label htmlFor="isActive">Active</Label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Switch
                                        id="isSurgical"
                                        checked={formData.isSurgical}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({ ...prev, isSurgical: checked }))
                                        }
                                    />
                                    <Label htmlFor="isSurgical">Surgical procedure</Label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Switch
                                        id="requiresAuthorization"
                                        checked={formData.requiresAuthorization}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({ ...prev, requiresAuthorization: checked }))
                                        }
                                    />
                                    <Label htmlFor="requiresAuthorization">Requires authorization</Label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Switch
                                        id="requiresAnesthesia"
                                        checked={formData.requiresAnesthesia}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({ ...prev, requiresAnesthesia: checked }))
                                        }
                                    />
                                    <Label htmlFor="requiresAnesthesia">Requires anesthesia</Label>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="pricing" className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="referencePrice">Reference Price *</Label>
                                    <Input
                                        id="referencePrice"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.referencePrice}
                                        onChange={(event) =>
                                            setFormData((prev) => ({ ...prev, referencePrice: Number(event.target.value) }))
                                        }
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="minIntervalDays">Minimum Interval (days)</Label>
                                    <Input
                                        id="minIntervalDays"
                                        type="number"
                                        min="0"
                                        value={formData.minIntervalDays}
                                        onChange={(event) =>
                                            setFormData((prev) => ({ ...prev, minIntervalDays: Number(event.target.value) }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="maxFrequencyPerYear">Max Frequency / Year</Label>
                                    <Input
                                        id="maxFrequencyPerYear"
                                        type="number"
                                        min="0"
                                        value={formData.maxFrequencyPerYear}
                                        onChange={(event) =>
                                            setFormData((prev) => ({ ...prev, maxFrequencyPerYear: Number(event.target.value) }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="standardDurationMinutes">Standard Duration (minutes)</Label>
                                    <Input
                                        id="standardDurationMinutes"
                                        type="number"
                                        min="0"
                                        value={formData.standardDurationMinutes}
                                        onChange={(event) =>
                                            setFormData((prev) => ({ ...prev, standardDurationMinutes: Number(event.target.value) }))
                                        }
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

                        <TabsContent value="ownership" className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="createdBy">Created By</Label>
                                    <Input
                                        id="createdBy"
                                        value={formData.createdBy ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({ ...prev, createdBy: event.target.value }))
                                        }
                                        placeholder="Optional creator identifier"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="updatedBy">Updated By</Label>
                                    <Input
                                        id="updatedBy"
                                        value={formData.updatedBy ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({ ...prev, updatedBy: event.target.value }))
                                        }
                                        placeholder="Optional last editor"
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">
                                Ownership fields help track who created and last updated the procedure in downstream systems.
                            </p>
                        </TabsContent>
                    </Tabs>

                    {formError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {formError}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-tpa-primary hover:bg-tpa-accent text-white"
                        >
                            {isSaving ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                                </span>
                            ) : (
                                'Save Procedure'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailsOpen} onOpenChange={handleDetailsOpenChange}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Procedure Details</DialogTitle>
                        <DialogDescription>Review the latest information received from the procedures service.</DialogDescription>
                    </DialogHeader>

                    {detailsLoading ? (
                        <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading details...
                        </div>
                    ) : detailsError ? (
                        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <Info className="h-4 w-4" />
                            {detailsError}
                        </div>
                    ) : procedureDetails ? (
                        <div className="space-y-6">
                            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <DetailItem label="System Code" value={procedureDetails.systemCode} />
                                <DetailItem label="Procedure Code" value={procedureDetails.code} />
                                <DetailItem label="Name (EN)" value={procedureDetails.nameEn} />
                                <DetailItem label="Name (AR)" value={procedureDetails.nameAr} rtl />
                                <DetailItem label="Unit" value={procedureDetails.unitOfMeasure} />
                                <DetailItem label="Reference Price" value={formatCurrency(procedureDetails.referencePrice)} />
                                <DetailItem label="Valid From" value={formatDate(procedureDetails.validFrom)} />
                                <DetailItem label="Valid To" value={formatDate(procedureDetails.validTo)} />
                                <DetailItem label="Created By" value={procedureDetails.createdBy ?? '-'} />
                                <DetailItem label="Updated By" value={procedureDetails.updatedBy ?? '-'} />
                            </section>

                            <section className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">Categories</h4>
                                <div className="flex flex-wrap gap-2">
                                    {procedureDetails.categories.length === 0 ? (
                                        <span className="text-sm text-gray-500">No categories linked.</span>
                                    ) : (
                                        procedureDetails.categories.map((category) => (
                                            <span
                                                key={`${category.id}-${category.code}`}
                                                className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                                            >
                                                {category.nameEn}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </section>

                            <section className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">Containers</h4>
                                <div className="space-y-2">
                                    {procedureDetails.containers.length === 0 ? (
                                        <p className="text-sm text-gray-500">No container mappings available.</p>
                                    ) : (
                                        procedureDetails.containers.map((container) => (
                                            <div key={`${container.id}-${container.code}`} className="rounded-lg border border-gray-100 p-3 text-sm">
                                                <div className="font-medium text-gray-800">{container.nameEn}</div>
                                                <div className="text-gray-500">Level {container.levelNo}</div>
                                                {container.parentName && (
                                                    <div className="text-gray-500">Parent: {container.parentName}</div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">No details available for the selected procedure.</div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleDetailsOpenChange(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function parseBooleanSelect(value: string): boolean | null {
    if (value === 'true') {
        return true
    }
    if (value === 'false') {
        return false
    }
    return null
}

function booleanToSelectValue(value: boolean | null | undefined): string {
    if (value === true) {
        return 'true'
    }
    if (value === false) {
        return 'false'
    }
    return 'all'
}

function hasActiveFilters(filters: ProcedureSearchFilters): boolean {
    return Object.entries(filters).some(([key, rawValue]) => {
        if (key === 'minPrice' || key === 'maxPrice' || key === 'categoryId' || key === 'containerId') {
            return rawValue !== null && rawValue !== undefined && rawValue !== ''
        }

        if (typeof rawValue === 'boolean') {
            return true
        }

        if (rawValue === null || rawValue === undefined) {
            return false
        }

        if (typeof rawValue === 'string') {
            return rawValue.trim().length > 0
        }

        return true
    })
}

interface DetailItemProps {
    label: string
    value: React.ReactNode
    rtl?: boolean
}

function DetailItem({ label, value, rtl = false }: DetailItemProps) {
    return (
        <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
            <div className={cn('text-sm text-gray-800', rtl && 'text-right')} dir={rtl ? 'rtl' : undefined}>
                {value}
            </div>
        </div>
    )
}
