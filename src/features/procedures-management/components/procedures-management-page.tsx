'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Boxes,
    Filter,
    Eye,
    Info,
    Library,
    Link2,
    Loader2,
    PencilLine,
    Plus,
    RefreshCcw,
    Search,
    Trash2,
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
    CreateProcedureCategoryPayload,
    CreateProcedureContainerPayload,
    CreateProcedurePayload,
    LinkProcedurePayload,
    ProcedureCategoryRecord,
    ProcedureContainerRecord,
    ProcedureDetails,
    ProcedureSearchFilters,
    ProcedureSummary,
} from '@/types'
import {
    createProcedure,
    createProcedureCategory,
    createProcedureContainer,
    deleteProcedure,
    fetchProcedureCategories,
    fetchProcedureContainers,
    getProcedureDetails,
    linkProcedureAssociations,
    searchProcedures,
    updateProcedure,
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

const INITIAL_CATEGORY_FORM: CreateProcedureCategoryPayload = {
    code: '',
    nameEn: '',
    nameAr: '',
    isActive: true,
}

const INITIAL_CONTAINER_FORM: CreateProcedureContainerPayload = {
    code: '',
    nameEn: '',
    nameAr: '',
    parentId: null,
    isActive: true,
    createdBy: '',
    updatedBy: '',
}

type LinkSelectionState = {
    categoryIds: number[]
    containerIds: number[]
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
    const [containers, setContainers] = useState<ProcedureContainerRecord[]>([])

    const [categoriesLoading, setCategoriesLoading] = useState(false)
    const [containersLoading, setContainersLoading] = useState(false)

    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formError, setFormError] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<FeedbackState | null>(null)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
    const [formData, setFormData] = useState<CreateProcedurePayload>(INITIAL_FORM_STATE)
    const [editingProcedureId, setEditingProcedureId] = useState<number | null>(null)

    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
    const [categoryForm, setCategoryForm] = useState<CreateProcedureCategoryPayload>(INITIAL_CATEGORY_FORM)
    const [categoryFormError, setCategoryFormError] = useState<string | null>(null)
    const [categoryFeedback, setCategoryFeedback] = useState<FeedbackState | null>(null)
    const [isSavingCategory, setIsSavingCategory] = useState(false)

    const [isContainerManagerOpen, setIsContainerManagerOpen] = useState(false)
    const [containerForm, setContainerForm] = useState<CreateProcedureContainerPayload>(INITIAL_CONTAINER_FORM)
    const [containerFormError, setContainerFormError] = useState<string | null>(null)
    const [containerFeedback, setContainerFeedback] = useState<FeedbackState | null>(null)
    const [isSavingContainer, setIsSavingContainer] = useState(false)

    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [detailsError, setDetailsError] = useState<string | null>(null)
    const [detailsFeedback, setDetailsFeedback] = useState<FeedbackState | null>(null)
    const [procedureDetails, setProcedureDetails] = useState<ProcedureDetails | null>(null)
    const [detailsId, setDetailsId] = useState<number | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
    const [linkingProcedure, setLinkingProcedure] = useState<ProcedureDetails | null>(null)
    const [linkSelection, setLinkSelection] = useState<LinkSelectionState>({ categoryIds: [], containerIds: [] })
    const [isLinkSaving, setIsLinkSaving] = useState(false)
    const [linkingFeedback, setLinkingFeedback] = useState<FeedbackState | null>(null)
    const [linkCategoryQuery, setLinkCategoryQuery] = useState('')
    const [linkContainerQuery, setLinkContainerQuery] = useState('')
    const [openLinkAfterDetails, setOpenLinkAfterDetails] = useState(false)

    const loadCategories = useCallback(async () => {
        setCategoriesLoading(true)
        try {
            const data = await fetchProcedureCategories({ page: 0, size: 200 })
            setCategories(data.content ?? [])
        } catch (categoryError) {
            console.warn('Unable to load procedure categories', categoryError)
        } finally {
            setCategoriesLoading(false)
        }
    }, [])

    const loadContainers = useCallback(async () => {
        setContainersLoading(true)
        try {
            const data = await fetchProcedureContainers({ page: 0, size: 200 })
            setContainers(data.content ?? [])
        } catch (containerError) {
            console.warn('Unable to load procedure containers', containerError)
        } finally {
            setContainersLoading(false)
        }
    }, [])

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
        void loadCategories()
        void loadContainers()
    }, [loadCategories, loadContainers])

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

    const populateFormFromDetails = useCallback((details: ProcedureDetails) => {
        setFormData({
            systemCode: details.systemCode ?? '',
            code: details.code ?? '',
            nameEn: details.nameEn ?? '',
            nameAr: details.nameAr ?? '',
            unitOfMeasure: details.unitOfMeasure ?? '',
            isSurgical: Boolean(details.isSurgical),
            referencePrice: Number(details.referencePrice ?? 0),
            requiresAuthorization: Boolean(details.requiresAuthorization),
            requiresAnesthesia: Boolean(details.requiresAnesthesia),
            minIntervalDays: Number(details.minIntervalDays ?? 0),
            maxFrequencyPerYear: Number(details.maxFrequencyPerYear ?? 0),
            standardDurationMinutes: Number(details.standardDurationMinutes ?? 0),
            validFrom: details.validFrom ?? '',
            validTo: details.validTo ?? '',
            isActive: Boolean(details.isActive),
            createdBy: details.createdBy ?? '',
            updatedBy: details.updatedBy ?? '',
        })
    }, [])

    const handleAdd = () => {
        setDialogMode('create')
        setEditingProcedureId(null)
        setFormData(INITIAL_FORM_STATE)
        setFormError(null)
        setIsDialogOpen(true)
    }

    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open)
        if (!open) {
            setDialogMode('create')
            setEditingProcedureId(null)
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

        const isEditingMode = dialogMode === 'edit' && editingProcedureId !== null
        setIsSaving(true)
        try {
            const result = isEditingMode
                ? await updateProcedure(editingProcedureId, payload)
                : await createProcedure(payload)

            setFeedback({
                type: 'success',
                message: isEditingMode ? 'Procedure updated successfully.' : 'Procedure created successfully.',
            })
            handleDialogChange(false)

            if (isEditingMode) {
                setProcedureDetails((prev) => {
                    if (prev && result && prev.id === result.id) {
                        return result
                    }
                    return prev
                })
                setDetailsFeedback({ type: 'success', message: 'Procedure updated successfully.' })
                await loadProcedures(page, pageSize, filters)
            } else if (page !== 0) {
                setPage(0)
            } else {
                await loadProcedures(0, pageSize, filters)
            }
        } catch (err) {
            const defaultMessage = isEditingMode
                ? 'Unable to update procedure at this time.'
                : 'Unable to create procedure at this time.'
            setFormError(err instanceof Error ? err.message : defaultMessage)
            setFeedback({
                type: 'error',
                message: isEditingMode ? 'Unable to update procedure.' : 'Unable to create procedure.',
            })
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
        setFilters((prev) => ({ ...prev, containerId: value === 'all' ? null : Number(value) }))
        setPage(0)
    }

    const handleViewDetails = (procedure: ProcedureSummary) => {
        setOpenLinkAfterDetails(false)
        setDetailsId(procedure.id)
        setIsDetailsOpen(true)
    }

    const handleOpenLinkFromRow = (procedure: ProcedureSummary) => {
        setDetailsId(procedure.id)
        setOpenLinkAfterDetails(true)
        setIsDetailsOpen(true)
    }

    const handleCategoryManagerChange = (open: boolean) => {
        setIsCategoryManagerOpen(open)
        if (open) {
            setCategoryFeedback(null)
            setCategoryFormError(null)
            void loadCategories()
        } else {
            setCategoryForm(INITIAL_CATEGORY_FORM)
            setCategoryFormError(null)
            setCategoryFeedback(null)
        }
    }

    const handleContainerManagerChange = (open: boolean) => {
        setIsContainerManagerOpen(open)
        if (open) {
            setContainerFeedback(null)
            setContainerFormError(null)
            void loadContainers()
        } else {
            setContainerForm(INITIAL_CONTAINER_FORM)
            setContainerFormError(null)
            setContainerFeedback(null)
        }
    }

    const handleSaveCategory = async () => {
        setCategoryFormError(null)
        setCategoryFeedback(null)

        const payload: CreateProcedureCategoryPayload = {
            code: categoryForm.code.trim(),
            nameEn: categoryForm.nameEn.trim(),
            nameAr: categoryForm.nameAr.trim(),
            isActive: categoryForm.isActive,
        }

        if (!payload.code || !payload.nameEn || !payload.nameAr) {
            setCategoryFormError('Code, English name, and Arabic name are required.')
            return
        }

        setIsSavingCategory(true)
        try {
            await createProcedureCategory(payload)
            setCategoryFeedback({ type: 'success', message: 'Category created successfully.' })
            setCategoryForm(INITIAL_CATEGORY_FORM)
            await loadCategories()
        } catch (err) {
            setCategoryFormError(err instanceof Error ? err.message : 'Unable to create category at this time.')
            setCategoryFeedback({ type: 'error', message: 'Unable to create category.' })
        } finally {
            setIsSavingCategory(false)
        }
    }

    const handleSaveContainer = async () => {
        setContainerFormError(null)
        setContainerFeedback(null)

        const payload: CreateProcedureContainerPayload = {
            code: containerForm.code.trim(),
            nameEn: containerForm.nameEn.trim(),
            nameAr: containerForm.nameAr.trim(),
            parentId:
                typeof containerForm.parentId === 'number' && !Number.isNaN(containerForm.parentId)
                    ? containerForm.parentId
                    : null,
            isActive: containerForm.isActive,
            createdBy: containerForm.createdBy?.trim() || undefined,
            updatedBy: containerForm.updatedBy?.trim() || undefined,
        }

        if (!payload.code || !payload.nameEn || !payload.nameAr) {
            setContainerFormError('Code, English name, and Arabic name are required.')
            return
        }

        setIsSavingContainer(true)
        try {
            await createProcedureContainer(payload)
            setContainerFeedback({ type: 'success', message: 'Container created successfully.' })
            setContainerForm(INITIAL_CONTAINER_FORM)
            await loadContainers()
        } catch (err) {
            setContainerFormError(err instanceof Error ? err.message : 'Unable to create container at this time.')
            setContainerFeedback({ type: 'error', message: 'Unable to create container.' })
        } finally {
            setIsSavingContainer(false)
        }
    }

    const handleManageLinks = () => {
        if (!procedureDetails) {
            return
        }

        setLinkingProcedure(procedureDetails)
        setLinkSelection({
            categoryIds: procedureDetails.categories.map((category) => category.id),
            containerIds: procedureDetails.containers.map((container) => container.id),
        })
        setLinkCategoryQuery('')
        setLinkContainerQuery('')
        setLinkingFeedback(null)
        setIsLinkDialogOpen(true)
        void loadCategories()
        void loadContainers()
    }

    const handleLinkDialogChange = (open: boolean) => {
        setIsLinkDialogOpen(open)
        if (!open) {
            setLinkingProcedure(null)
            setLinkSelection({ categoryIds: [], containerIds: [] })
            setLinkingFeedback(null)
            setLinkCategoryQuery('')
            setLinkContainerQuery('')
            setOpenLinkAfterDetails(false)
        }
    }

    const toggleLinkCategory = (id: number) => {
        setLinkSelection((prev) => {
            const exists = prev.categoryIds.includes(id)
            return {
                ...prev,
                categoryIds: exists
                    ? prev.categoryIds.filter((value) => value !== id)
                    : [...prev.categoryIds, id],
            }
        })
    }

    const toggleLinkContainer = (id: number) => {
        setLinkSelection((prev) => {
            const exists = prev.containerIds.includes(id)
            return {
                ...prev,
                containerIds: exists
                    ? prev.containerIds.filter((value) => value !== id)
                    : [...prev.containerIds, id],
            }
        })
    }

    const handleSaveLinks = async () => {
        if (!linkingProcedure) {
            return
        }

        setIsLinkSaving(true)
        setLinkingFeedback(null)

        const payload: LinkProcedurePayload = {
            procedureId: linkingProcedure.id,
            categoryIds: linkSelection.categoryIds,
            containerIds: linkSelection.containerIds,
        }

        try {
            const result = await linkProcedureAssociations(payload)

            const resolvedCategories =
                linkSelection.categoryIds.length === 0
                    ? []
                    : linkSelection.categoryIds
                        .map((categoryId) => {
                            const fromList = categories.find((c) => c.id === categoryId)
                            if (fromList) {
                                return {
                                    id: fromList.id,
                                    code: fromList.code,
                                    nameEn: fromList.nameEn,
                                    nameAr: fromList.nameAr,
                                    isActive: fromList.isActive,
                                }
                            }

                            return linkingProcedure.categories.find((c) => c.id === categoryId) ?? null
                        })
                        .filter(notNull)


            const resolvedContainers =
                linkSelection.containerIds.length === 0
                    ? []
                    : linkSelection.containerIds
                        .map((containerId) => {
                            const fromList = containers.find((c) => c.id === containerId)
                            if (fromList) {
                                return {
                                    id: fromList.id,
                                    code: fromList.code,
                                    nameEn: fromList.nameEn,
                                    nameAr: fromList.nameAr,
                                    levelNo: fromList.levelNo,
                                    parentId: fromList.parentId,
                                    parentName: fromList.parentName,
                                }
                            }

                            return linkingProcedure.containers.find((c) => c.id === containerId) ?? null
                        })
                        .filter(notNull)

            const updatedDetails: ProcedureDetails = result
                ? result
                : {
                      ...linkingProcedure,
                      categories: resolvedCategories,
                      containers: resolvedContainers,
                  }

            const successMessage = 'Procedure associations updated successfully.'
            setProcedureDetails((prev) => (prev && prev.id === updatedDetails.id ? updatedDetails : prev))
            setLinkingProcedure(updatedDetails)
            setLinkingFeedback({ type: 'success', message: successMessage })
            setDetailsFeedback({ type: 'success', message: successMessage })
            await loadProcedures(page, pageSize, filters)
        } catch (err) {
            setLinkingFeedback({
                type: 'error',
                message: err instanceof Error ? err.message : 'Unable to update procedure associations.',
            })
        } finally {
            setIsLinkSaving(false)
        }
    }

    const handleEditProcedure = () => {
        if (!procedureDetails) {
            return
        }

        populateFormFromDetails(procedureDetails)
        setDialogMode('edit')
        setEditingProcedureId(procedureDetails.id)
        setFormError(null)
        setFeedback(null)
        setIsDetailsOpen(false)
        setIsDialogOpen(true)
    }

    const handleDeleteProcedure = async () => {
        if (!procedureDetails) {
            return
        }

        const confirmed = window.confirm(
            'Are you sure you want to delete this procedure? This action cannot be undone.',
        )

        if (!confirmed) {
            return
        }

        setIsDeleting(true)
        setDetailsFeedback(null)
        setOpenLinkAfterDetails(false)
        handleLinkDialogChange(false)

        try {
            await deleteProcedure(procedureDetails.id)
            const successMessage = 'Procedure deleted successfully.'
            setFeedback({ type: 'success', message: successMessage })
            setDetailsFeedback({ type: 'success', message: successMessage })
            setIsDetailsOpen(false)
            setProcedureDetails(null)
            setDetailsId(null)

            if (pageMeta.numberOfElements === 1 && page > 0) {
                setPage((prev) => Math.max(prev - 1, 0))
            } else {
                await loadProcedures(page, pageSize, filters)
            }
        } catch (err) {
            setDetailsFeedback({
                type: 'error',
                message: err instanceof Error ? err.message : 'Unable to delete procedure.',
            })
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDetailsOpenChange = (open: boolean) => {
        setIsDetailsOpen(open)
        if (!open) {
            setProcedureDetails(null)
            setDetailsError(null)
            setDetailsId(null)
            setDetailsFeedback(null)
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

                if (openLinkAfterDetails) {
                    setLinkingProcedure(detail)
                    setLinkSelection({
                        categoryIds: detail.categories.map((category) => category.id),
                        containerIds: detail.containers.map((container) => container.id),
                    })
                    setLinkCategoryQuery('')
                    setLinkContainerQuery('')
                    setLinkingFeedback(null)
                    setIsLinkDialogOpen(true)
                    setOpenLinkAfterDetails(false)
                    void loadCategories()
                    void loadContainers()
                }
            } catch (err) {
                setDetailsError(err instanceof Error ? err.message : 'Failed to load procedure details')
            } finally {
                setDetailsLoading(false)
            }
        })()
    }, [
        isDetailsOpen,
        detailsId,
        getProcedureDetails,
        openLinkAfterDetails,
        loadCategories,
        loadContainers,
    ])

    const totalRecordsLabel = isSearching
        ? `${procedures.length} result${procedures.length === 1 ? '' : 's'} found`
        : `${pageMeta.numberOfElements} of ${pageMeta.totalElements} records`

    const filteredLinkCategories = useMemo(() => {
        const query = linkCategoryQuery.trim().toLowerCase()
        if (!query) {
            return categories
        }

        return categories.filter((category) => {
            const values = [category.nameEn, category.code, category.nameAr ?? '']
            return values.some((value) => value.toLowerCase().includes(query))
        })
    }, [categories, linkCategoryQuery])

    const filteredLinkContainers = useMemo(() => {
        const query = linkContainerQuery.trim().toLowerCase()
        if (!query) {
            return containers
        }

        return containers.filter((container) => {
            const values = [container.nameEn, container.code, container.parentName ?? '']
            return values.some((value) => value.toLowerCase().includes(query))
        })
    }, [containers, linkContainerQuery])

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
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleCategoryManagerChange(true)}
                            className="flex items-center gap-2"
                        >
                            <Library className="h-4 w-4" />
                            Manage Categories
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleContainerManagerChange(true)}
                            className="flex items-center gap-2"
                        >
                            <Boxes className="h-4 w-4" />
                            Manage Containers
                        </Button>
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
                            <Label htmlFor="containerFilter">Container</Label>
                            <Select
                                value={
                                    filters.containerId !== null && filters.containerId !== undefined
                                        ? String(filters.containerId)
                                        : 'all'
                                }
                                onValueChange={handleContainerChange}
                            >
                                <SelectTrigger id="containerFilter">
                                    <SelectValue placeholder="All containers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All containers</SelectItem>
                                    {containers.map((container) => (
                                        <SelectItem key={container.id} value={String(container.id)}>
                                            {container.nameEn} ({container.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenLinkFromRow(procedure)}
                                                aria-label={`Manage links for ${procedure.code}`}
                                            >
                                                <Link2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewDetails(procedure)}
                                                aria-label={`View details for ${procedure.code}`}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
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

            <Dialog open={isCategoryManagerOpen} onOpenChange={handleCategoryManagerChange}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Procedure Categories</DialogTitle>
                        <DialogDescription>
                            Review existing categories and add new definitions for procedures mapping.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    {categories.length} category{categories.length === 1 ? '' : 'ies'}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void loadCategories()}
                                    disabled={categoriesLoading}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    Refresh
                                </Button>
                            </div>

                            <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-100 bg-white">
                                {categoriesLoading ? (
                                    <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading categories...
                                    </div>
                                ) : categories.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-500">No categories available.</div>
                                ) : (
                                    <ul className="divide-y divide-gray-100">
                                        {categories.map((category) => (
                                            <li key={category.id} className="p-3 text-sm">
                                                <div className="font-medium text-gray-900">{category.nameEn}</div>
                                                <div className="text-xs text-gray-500">Code: {category.code}</div>
                                                <div className="mt-1 text-xs">
                                                    <span
                                                        className={cn(
                                                            'inline-flex rounded-full px-2 py-0.5',
                                                            category.isActive
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-600',
                                                        )}
                                                    >
                                                        {category.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="categoryCode">Code *</Label>
                                <Input
                                    id="categoryCode"
                                    value={categoryForm.code}
                                    onChange={(event) =>
                                        setCategoryForm((prev) => ({ ...prev, code: event.target.value }))
                                    }
                                    placeholder="Enter category code"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="categoryNameEn">Name (English) *</Label>
                                <Input
                                    id="categoryNameEn"
                                    value={categoryForm.nameEn}
                                    onChange={(event) =>
                                        setCategoryForm((prev) => ({ ...prev, nameEn: event.target.value }))
                                    }
                                    placeholder="Enter English name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="categoryNameAr">Name (Arabic) *</Label>
                                <Input
                                    id="categoryNameAr"
                                    value={categoryForm.nameAr}
                                    onChange={(event) =>
                                        setCategoryForm((prev) => ({ ...prev, nameAr: event.target.value }))
                                    }
                                    placeholder="أدخل الاسم بالعربية"
                                    dir="rtl"
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3">
                                <span className="text-sm font-medium">Active</span>
                                <Switch
                                    checked={categoryForm.isActive}
                                    onCheckedChange={(checked) =>
                                        setCategoryForm((prev) => ({ ...prev, isActive: checked }))
                                    }
                                />
                            </div>

                            {categoryFormError && (
                                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {categoryFormError}
                                </div>
                            )}

                            {categoryFeedback && (
                                <div
                                    className={cn(
                                        'rounded-md border px-3 py-2 text-sm',
                                        categoryFeedback.type === 'success'
                                            ? 'border-green-200 bg-green-50 text-green-800'
                                            : 'border-red-200 bg-red-50 text-red-700',
                                    )}
                                >
                                    {categoryFeedback.message}
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCategoryForm(INITIAL_CATEGORY_FORM)}
                                    disabled={isSavingCategory}
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSaveCategory}
                                    disabled={isSavingCategory}
                                    className="bg-tpa-primary text-white hover:bg-tpa-accent"
                                >
                                    {isSavingCategory ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                                        </span>
                                    ) : (
                                        'Add Category'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isContainerManagerOpen} onOpenChange={handleContainerManagerChange}>
                <DialogContent className="max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>Procedure Containers</DialogTitle>
                        <DialogDescription>
                            Maintain the hierarchical containers used to group procedures.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    {containers.length} container{containers.length === 1 ? '' : 's'}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void loadContainers()}
                                    disabled={containersLoading}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    Refresh
                                </Button>
                            </div>

                            <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-100 bg-white">
                                {containersLoading ? (
                                    <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading containers...
                                    </div>
                                ) : containers.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-500">No containers available.</div>
                                ) : (
                                    <ul className="divide-y divide-gray-100">
                                        {containers.map((container) => (
                                            <li key={container.id} className="p-3 text-sm">
                                                <div className="font-medium text-gray-900">{container.nameEn}</div>
                                                <div className="text-xs text-gray-500">
                                                    Code: {container.code} · Level {container.levelNo}
                                                </div>
                                                {container.parentName && (
                                                    <div className="text-xs text-gray-500">
                                                        Parent: {container.parentName}
                                                    </div>
                                                )}
                                                <div className="mt-1 text-xs">
                                                    <span
                                                        className={cn(
                                                            'inline-flex rounded-full px-2 py-0.5',
                                                            container.isActive
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-600',
                                                        )}
                                                    >
                                                        {container.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="containerCode">Code *</Label>
                                <Input
                                    id="containerCode"
                                    value={containerForm.code}
                                    onChange={(event) =>
                                        setContainerForm((prev) => ({ ...prev, code: event.target.value }))
                                    }
                                    placeholder="Enter container code"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="containerNameEn">Name (English) *</Label>
                                <Input
                                    id="containerNameEn"
                                    value={containerForm.nameEn}
                                    onChange={(event) =>
                                        setContainerForm((prev) => ({ ...prev, nameEn: event.target.value }))
                                    }
                                    placeholder="Enter English name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="containerNameAr">Name (Arabic) *</Label>
                                <Input
                                    id="containerNameAr"
                                    value={containerForm.nameAr}
                                    onChange={(event) =>
                                        setContainerForm((prev) => ({ ...prev, nameAr: event.target.value }))
                                    }
                                    placeholder="أدخل الاسم بالعربية"
                                    dir="rtl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="containerParent">Parent Container</Label>
                                <Select
                                    value={
                                        typeof containerForm.parentId === 'number'
                                            ? String(containerForm.parentId)
                                            : 'none'
                                    }
                                    onValueChange={(value) =>
                                        setContainerForm((prev) => ({
                                            ...prev,
                                            parentId: value === 'none' ? null : Number(value),
                                        }))
                                    }
                                >
                                    <SelectTrigger id="containerParent">
                                        <SelectValue placeholder="No parent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No parent</SelectItem>
                                        {containers.map((container) => (
                                            <SelectItem key={container.id} value={String(container.id)}>
                                                {container.nameEn} ({container.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="containerCreatedBy">Created By</Label>
                                    <Input
                                        id="containerCreatedBy"
                                        value={containerForm.createdBy ?? ''}
                                        onChange={(event) =>
                                            setContainerForm((prev) => ({ ...prev, createdBy: event.target.value }))
                                        }
                                        placeholder="Optional creator"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="containerUpdatedBy">Updated By</Label>
                                    <Input
                                        id="containerUpdatedBy"
                                        value={containerForm.updatedBy ?? ''}
                                        onChange={(event) =>
                                            setContainerForm((prev) => ({ ...prev, updatedBy: event.target.value }))
                                        }
                                        placeholder="Optional editor"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3">
                                <span className="text-sm font-medium">Active</span>
                                <Switch
                                    checked={containerForm.isActive}
                                    onCheckedChange={(checked) =>
                                        setContainerForm((prev) => ({ ...prev, isActive: checked }))
                                    }
                                />
                            </div>

                            {containerFormError && (
                                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {containerFormError}
                                </div>
                            )}

                            {containerFeedback && (
                                <div
                                    className={cn(
                                        'rounded-md border px-3 py-2 text-sm',
                                        containerFeedback.type === 'success'
                                            ? 'border-green-200 bg-green-50 text-green-800'
                                            : 'border-red-200 bg-red-50 text-red-700',
                                    )}
                                >
                                    {containerFeedback.message}
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setContainerForm(INITIAL_CONTAINER_FORM)}
                                    disabled={isSavingContainer}
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSaveContainer}
                                    disabled={isSavingContainer}
                                    className="bg-tpa-primary text-white hover:bg-tpa-accent"
                                >
                                    {isSavingContainer ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                                        </span>
                                    ) : (
                                        'Add Container'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isLinkDialogOpen} onOpenChange={handleLinkDialogChange}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Manage Procedure Links</DialogTitle>
                        <DialogDescription>
                            Link the procedure to the correct categories and containers to control downstream visibility.
                        </DialogDescription>
                    </DialogHeader>

                    {linkingProcedure && (
                        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                            Managing links for <span className="font-semibold">{linkingProcedure.nameEn}</span> ({linkingProcedure.code})
                        </div>
                    )}

                    {linkingFeedback && (
                        <div
                            className={cn(
                                'rounded-md border px-3 py-2 text-sm',
                                linkingFeedback.type === 'success'
                                    ? 'border-green-200 bg-green-50 text-green-800'
                                    : 'border-red-200 bg-red-50 text-red-700',
                            )}
                        >
                            {linkingFeedback.message}
                        </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-700">Categories</h4>
                                <span className="text-xs text-gray-500">
                                    {linkSelection.categoryIds.length} selected
                                </span>
                            </div>
                            <Input
                                placeholder="Search categories"
                                value={linkCategoryQuery}
                                onChange={(event) => setLinkCategoryQuery(event.target.value)}
                            />
                            <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-100 bg-white">
                                {categoriesLoading ? (
                                    <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading categories...
                                    </div>
                                ) : filteredLinkCategories.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-500">No categories match your search.</div>
                                ) : (
                                    <ul className="divide-y divide-gray-100">
                                        {filteredLinkCategories.map((category) => (
                                            <li key={category.id}>
                                                <label className="flex cursor-pointer items-start gap-2 p-3 hover:bg-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1"
                                                        checked={linkSelection.categoryIds.includes(category.id)}
                                                        onChange={() => toggleLinkCategory(category.id)}
                                                    />
                                                    <span className="space-y-1">
                                                        <span className="block text-sm font-medium text-gray-900">
                                                            {category.nameEn}
                                                        </span>
                                                        <span className="block text-xs text-gray-500">{category.code}</span>
                                                    </span>
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-700">Containers</h4>
                                <span className="text-xs text-gray-500">
                                    {linkSelection.containerIds.length} selected
                                </span>
                            </div>
                            <Input
                                placeholder="Search containers"
                                value={linkContainerQuery}
                                onChange={(event) => setLinkContainerQuery(event.target.value)}
                            />
                            <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-100 bg-white">
                                {containersLoading ? (
                                    <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading containers...
                                    </div>
                                ) : filteredLinkContainers.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-500">No containers match your search.</div>
                                ) : (
                                    <ul className="divide-y divide-gray-100">
                                        {filteredLinkContainers.map((container) => (
                                            <li key={container.id}>
                                                <label className="flex cursor-pointer items-start gap-2 p-3 hover:bg-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1"
                                                        checked={linkSelection.containerIds.includes(container.id)}
                                                        onChange={() => toggleLinkContainer(container.id)}
                                                    />
                                                    <span className="space-y-1">
                                                        <span className="block text-sm font-medium text-gray-900">
                                                            {container.nameEn}
                                                        </span>
                                                        <span className="block text-xs text-gray-500">
                                                            {container.code}
                                                            {container.parentName ? ` · ${container.parentName}` : ''}
                                                        </span>
                                                    </span>
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleLinkDialogChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveLinks}
                            disabled={isLinkSaving || !linkingProcedure}
                            className="bg-tpa-primary text-white hover:bg-tpa-accent"
                        >
                            {isLinkSaving ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                                </span>
                            ) : (
                                'Save Links'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

                    {detailsFeedback && (
                        <div
                            className={cn(
                                'rounded-md border px-4 py-3 text-sm',
                                detailsFeedback.type === 'success'
                                    ? 'border-green-200 bg-green-50 text-green-800'
                                    : 'border-red-200 bg-red-50 text-red-700',
                            )}
                        >
                            {detailsFeedback.message}
                        </div>
                    )}

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

                    <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button type="button" variant="outline" onClick={() => handleDetailsOpenChange(false)}>
                                Close
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleManageLinks}
                                disabled={!procedureDetails || detailsLoading}
                                className="flex items-center gap-2"
                            >
                                <Link2 className="h-4 w-4" />
                                Manage Links
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleEditProcedure}
                                disabled={!procedureDetails || detailsLoading}
                                className="flex items-center gap-2"
                            >
                                <PencilLine className="h-4 w-4" />
                                Edit Procedure
                            </Button>
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteProcedure}
                            disabled={!procedureDetails || isDeleting}
                            className="flex items-center gap-2"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            {isDeleting ? 'Deleting...' : 'Delete'}
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

export function notNull<T>(value: T): value is NonNullable<T> {
    return value !== null && value !== undefined
}
