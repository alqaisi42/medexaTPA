'use client'

import React, {useCallback, useEffect, useMemo, useState} from 'react'
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
    Unlink,
} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Switch} from '@/components/ui/switch'
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
    deleteProcedureCategory,
    deleteProcedureContainer,
    fetchProcedureCategories,
    fetchProcedureContainers,
    getProcedureDetails,
    getProceduresByContainerDetails,
    linkProcedureAssociations,
    searchProcedures,
    unlinkProcedureCategory,
    unlinkProcedureContainer,
    updateProcedure,
    updateProcedureCategory,
    updateProcedureContainer,
} from '@/lib/api/procedures'
import {cn, formatCurrency, formatDate} from '@/lib/utils'
import {useAppStore} from '@/store/app-store'

const PAGE_SIZE_OPTIONS = [10, 20, 50]
const BOOLEAN_SELECT_OPTIONS = [
    {label: 'All', value: 'all'},
    {label: 'Yes', value: 'true'},
    {label: 'No', value: 'false'},
]

const CONTAINER_USAGE_PAGE_SIZE = 10

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

    const [activeTab, setActiveTab] = useState<'procedures' | 'categories' | 'containers'>('procedures')
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

    const [categoryForm, setCategoryForm] = useState<CreateProcedureCategoryPayload>(INITIAL_CATEGORY_FORM)
    const [categoryFormError, setCategoryFormError] = useState<string | null>(null)
    const [categoryFeedback, setCategoryFeedback] = useState<FeedbackState | null>(null)
    const [isSavingCategory, setIsSavingCategory] = useState(false)
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
    const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)

    const [containerForm, setContainerForm] = useState<CreateProcedureContainerPayload>(INITIAL_CONTAINER_FORM)
    const [containerFormError, setContainerFormError] = useState<string | null>(null)
    const [containerFeedback, setContainerFeedback] = useState<FeedbackState | null>(null)
    const [isSavingContainer, setIsSavingContainer] = useState(false)
    const [editingContainerId, setEditingContainerId] = useState<number | null>(null)
    const [deletingContainerId, setDeletingContainerId] = useState<number | null>(null)

    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [detailsError, setDetailsError] = useState<string | null>(null)
    const [detailsFeedback, setDetailsFeedback] = useState<FeedbackState | null>(null)
    const [procedureDetails, setProcedureDetails] = useState<ProcedureDetails | null>(null)
    const [detailsId, setDetailsId] = useState<number | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
    const [linkingProcedure, setLinkingProcedure] = useState<ProcedureDetails | null>(null)
    const [linkSelection, setLinkSelection] = useState<LinkSelectionState>({categoryIds: [], containerIds: []})
    const [isLinkSaving, setIsLinkSaving] = useState(false)
    const [linkingFeedback, setLinkingFeedback] = useState<FeedbackState | null>(null)
    const [linkCategoryQuery, setLinkCategoryQuery] = useState('')
    const [linkContainerQuery, setLinkContainerQuery] = useState('')
    const [openLinkAfterDetails, setOpenLinkAfterDetails] = useState(false)

    const [unlinkingCategoryId, setUnlinkingCategoryId] = useState<number | null>(null)
    const [unlinkingContainerId, setUnlinkingContainerId] = useState<number | null>(null)

    const [isContainerUsageOpen, setIsContainerUsageOpen] = useState(false)
    const [containerUsageContainer, setContainerUsageContainer] = useState<ProcedureContainerRecord | null>(null)
    const [containerUsageProcedures, setContainerUsageProcedures] = useState<ProcedureDetails[]>([])
    const [containerUsageLoading, setContainerUsageLoading] = useState(false)
    const [containerUsageError, setContainerUsageError] = useState<string | null>(null)
    const [containerUsagePage, setContainerUsagePage] = useState(0)
    const [containerUsageMeta, setContainerUsageMeta] = useState<PageMetadata>({
        totalPages: 0,
        totalElements: 0,
        numberOfElements: 0,
        first: true,
        last: true,
    })

    const loadCategories = useCallback(async () => {
        setCategoriesLoading(true)
        try {
            const data = await fetchProcedureCategories({page: 0, size: 200})
            const records = data.content ?? []
            setCategories(records)
            setEditingCategoryId((prev) => {
                if (prev !== null && !records.some((item) => item.id === prev)) {
                    setCategoryForm(INITIAL_CATEGORY_FORM)
                    setCategoryFormError(null)
                    setCategoryFeedback(null)
                    return null
                }
                return prev
            })
        } catch (categoryError) {
            console.warn('Unable to load procedure categories', categoryError)
        } finally {
            setCategoriesLoading(false)
        }
    }, [])

    const loadContainers = useCallback(async () => {
        setContainersLoading(true)
        try {
            const data = await fetchProcedureContainers({page: 0, size: 200})
            const records = data.content ?? []
            setContainers(records)
            setEditingContainerId((prev) => {
                if (prev !== null && !records.some((item) => item.id === prev)) {
                    setContainerForm(INITIAL_CONTAINER_FORM)
                    setContainerFormError(null)
                    setContainerFeedback(null)
                    return null
                }
                return prev
            })
            setContainerUsageContainer((prev) => {
                if (!prev) {
                    return prev
                }

                const updated = records.find((item) => item.id === prev.id)
                if (!updated) {
                    setIsContainerUsageOpen(false)
                    setContainerUsageProcedures([])
                    setContainerUsageError(null)
                    setContainerUsageMeta({
                        totalPages: 0,
                        totalElements: 0,
                        numberOfElements: 0,
                        first: true,
                        last: true,
                    })
                    return null
                }

                return updated
            })
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
        if (activeTab === 'categories') {
            setCategoryFeedback(null)
            setCategoryFormError(null)
            void loadCategories()
        } else {
            setCategoryForm(INITIAL_CATEGORY_FORM)
            setCategoryFormError(null)
            setCategoryFeedback(null)
        }
    }, [activeTab, loadCategories])

    useEffect(() => {
        if (activeTab === 'containers') {
            setContainerFeedback(null)
            setContainerFormError(null)
            void loadContainers()
        } else {
            setContainerForm(INITIAL_CONTAINER_FORM)
            setContainerFormError(null)
            setContainerFeedback(null)
        }
    }, [activeTab, loadContainers])

    useEffect(() => {
        const handler = setTimeout(() => {
            const trimmed = searchTerm.trim()
            setFilters((prev) => {
                if (prev.keyword === trimmed) {
                    return prev
                }
                setPage(0)
                return {...prev, keyword: trimmed}
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
                const data = await searchProcedures({filters: activeFilters, page: targetPage, size: targetSize})

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
                setPageMeta({totalPages: 0, totalElements: 0, numberOfElements: 0, first: true, last: true})
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
                setDetailsFeedback({type: 'success', message: 'Procedure updated successfully.'})
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
        setFilters((prev) => ({...prev, [field]: parsedValue}))
        setPage(0)
    }

    const handleCategoryChange = (value: string) => {
        setFilters((prev) => ({...prev, categoryId: value === 'all' ? null : Number(value)}))
        setPage(0)
    }

    const handleValidOnChange = (value: string) => {
        setFilters((prev) => ({...prev, validOn: value}))
        setPage(0)
    }

    const handleMinPriceChange = (value: string) => {
        setFilters((prev) => ({...prev, minPrice: value ? Number(value) : null}))
        setPage(0)
    }

    const handleMaxPriceChange = (value: string) => {
        setFilters((prev) => ({...prev, maxPrice: value ? Number(value) : null}))
        setPage(0)
    }

    const handleSystemCodeChange = (value: string) => {
        setFilters((prev) => ({...prev, systemCode: value}))
        setPage(0)
    }

    const handleContainerChange = (value: string) => {
        setFilters((prev) => ({...prev, containerId: value === 'all' ? null : Number(value)}))
        setPage(0)
    }

    const handleTabValueChange = (value: string) => {
        if (value === 'procedures' || value === 'categories' || value === 'containers') {
            setActiveTab(value)
        }
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

    const handleResetCategoryForm = () => {
        setCategoryForm(INITIAL_CATEGORY_FORM)
        setCategoryFormError(null)
        setEditingCategoryId(null)
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

        const isEditing = editingCategoryId !== null
        const successMessage = isEditing ? 'Category updated successfully.' : 'Category created successfully.'
        const failureMessage = isEditing
            ? 'Unable to update category at this time.'
            : 'Unable to create category at this time.'

        setIsSavingCategory(true)
        try {
            if (isEditing && editingCategoryId !== null) {
                await updateProcedureCategory(editingCategoryId, payload)
            } else {
                await createProcedureCategory(payload)
            }
            setCategoryFeedback({type: 'success', message: successMessage})
            handleResetCategoryForm()
            await loadCategories()
        } catch (err) {
            setCategoryFormError(err instanceof Error ? err.message : failureMessage)
            setCategoryFeedback({type: 'error', message: failureMessage})
        } finally {
            setIsSavingCategory(false)
        }
    }

    const handleEditCategoryRecord = (record: ProcedureCategoryRecord) => {
        setCategoryForm({
            code: record.code,
            nameEn: record.nameEn,
            nameAr: record.nameAr,
            isActive: record.isActive,
        })
        setEditingCategoryId(record.id)
        setCategoryFormError(null)
        setCategoryFeedback(null)
    }

    const handleDeleteCategoryRecord = async (id: number) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this category? Procedures linked to it will no longer reference it.',
        )

        if (!confirmed) {
            return
        }

        setDeletingCategoryId(id)
        setCategoryFeedback(null)
        setCategoryFormError(null)

        try {
            await deleteProcedureCategory(id)
            const successMessage = 'Category deleted successfully.'
            setCategoryFeedback({type: 'success', message: successMessage})
            if (editingCategoryId === id) {
                handleResetCategoryForm()
            }
            await loadCategories()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to delete category at this time.'
            setCategoryFeedback({type: 'error', message})
            setCategoryFormError(message)
        } finally {
            setDeletingCategoryId(null)
        }
    }

    const handleResetContainerForm = () => {
        setContainerForm(INITIAL_CONTAINER_FORM)
        setContainerFormError(null)
        setEditingContainerId(null)
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

        const isEditing = editingContainerId !== null
        const successMessage = isEditing ? 'Container updated successfully.' : 'Container created successfully.'
        const failureMessage = isEditing
            ? 'Unable to update container at this time.'
            : 'Unable to create container at this time.'

        setIsSavingContainer(true)
        try {
            const updatedRecord = isEditing && editingContainerId !== null
                ? await updateProcedureContainer(editingContainerId, payload)
                : null

            if (!isEditing) {
                await createProcedureContainer(payload)
            }

            setContainerFeedback({ type: 'success', message: successMessage })
            handleResetContainerForm()
            await loadContainers()

            if (updatedRecord !== null) {
                setContainerUsageContainer(prev =>
                    prev && prev.id === updatedRecord.id ? updatedRecord : prev
                )
            }
        } catch (err) {
            setContainerFormError(err instanceof Error ? err.message : failureMessage)
            setContainerFeedback({ type: 'error', message: failureMessage })
        } finally {
            setIsSavingContainer(false)
        }

    }

    const handleEditContainerRecord = (record: ProcedureContainerRecord) => {
        setContainerForm({
            code: record.code,
            nameEn: record.nameEn,
            nameAr: record.nameAr,
            parentId: record.parentId ?? null,
            isActive: record.isActive,
            createdBy: '',
            updatedBy: '',
        })
        setEditingContainerId(record.id)
        setContainerFormError(null)
        setContainerFeedback(null)
    }

    const handleDeleteContainerRecord = async (id: number) => {
        const confirmed = window.confirm(
            'Deleting this container will remove its association from all procedures. Do you want to continue?',
        )

        if (!confirmed) {
            return
        }

        setDeletingContainerId(id)
        setContainerFeedback(null)
        setContainerFormError(null)

        try {
            await deleteProcedureContainer(id)
            const successMessage = 'Container deleted successfully.'
            setContainerFeedback({type: 'success', message: successMessage})
            if (editingContainerId === id) {
                handleResetContainerForm()
            }
            setContainerUsageContainer((prev) => {
                if (prev && prev.id === id) {
                    setIsContainerUsageOpen(false)
                    setContainerUsageProcedures([])
                    setContainerUsageError(null)
                    setContainerUsageMeta({
                        totalPages: 0,
                        totalElements: 0,
                        numberOfElements: 0,
                        first: true,
                        last: true,
                    })
                    return null
                }
                return prev
            })
            await loadContainers()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to delete container at this time.'
            setContainerFeedback({type: 'error', message})
            setContainerFormError(message)
        } finally {
            setDeletingContainerId(null)
        }
    }

    const loadContainerUsage = useCallback(
        async (containerId: number, targetPage = 0) => {
            setContainerUsageLoading(true)
            setContainerUsageError(null)

            try {
                const data = await getProceduresByContainerDetails({
                    containerId,
                    page: targetPage,
                    size: CONTAINER_USAGE_PAGE_SIZE,
                })

                setContainerUsageProcedures(data.content ?? [])
                setContainerUsageMeta({
                    totalPages: data.totalPages,
                    totalElements: data.totalElements,
                    numberOfElements: data.numberOfElements,
                    first: data.first,
                    last: data.last,
                })
                setContainerUsagePage(targetPage)
            } catch (err) {
                setContainerUsageProcedures([])
                setContainerUsageMeta({
                    totalPages: 0,
                    totalElements: 0,
                    numberOfElements: 0,
                    first: true,
                    last: true,
                })
                setContainerUsageError(
                    err instanceof Error ? err.message : 'Unable to load container usage at this time.',
                )
            } finally {
                setContainerUsageLoading(false)
            }
        },
        [],
    )

    const handleViewContainerUsage = (record: ProcedureContainerRecord) => {
        setContainerUsageContainer(record)
        setContainerUsageError(null)
        setContainerUsageProcedures([])
        setContainerUsagePage(0)
        setContainerUsageMeta({
            totalPages: 0,
            totalElements: 0,
            numberOfElements: 0,
            first: true,
            last: true,
        })
        setIsContainerUsageOpen(true)
        void loadContainerUsage(record.id, 0)
    }

    const handleContainerUsageDialogChange = (open: boolean) => {
        setIsContainerUsageOpen(open)
        if (!open) {
            setContainerUsageContainer(null)
            setContainerUsageProcedures([])
            setContainerUsageError(null)
            setContainerUsagePage(0)
            setContainerUsageMeta({
                totalPages: 0,
                totalElements: 0,
                numberOfElements: 0,
                first: true,
                last: true,
            })
        }
    }

    const handleContainerUsagePageChange = (direction: 'next' | 'prev') => {
        if (!containerUsageContainer) {
            return
        }

        if (direction === 'next' && containerUsageMeta.last) {
            return
        }

        if (direction === 'prev' && containerUsageMeta.first) {
            return
        }

        const targetPage = direction === 'next' ? containerUsagePage + 1 : Math.max(containerUsagePage - 1, 0)
        void loadContainerUsage(containerUsageContainer.id, targetPage)
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
            setLinkSelection({categoryIds: [], containerIds: []})
            setLinkingFeedback(null)
            setLinkCategoryQuery('')
            setLinkContainerQuery('')
            setOpenLinkAfterDetails(false)
        }
    }

    const handleUnlinkCategoryFromProcedure = async (categoryId: number) => {
        if (!procedureDetails) {
            return
        }

        const confirmed = window.confirm(
            'This will unlink the category from the procedure. Do you want to continue?',
        )

        if (!confirmed) {
            return
        }

        setUnlinkingCategoryId(categoryId)
        setDetailsFeedback(null)

        try {
            await unlinkProcedureCategory(procedureDetails.id, categoryId)
            const successMessage = 'Category unlinked from procedure successfully.'
            setProcedureDetails((prev) => {
                if (!prev) {
                    return prev
                }

                return {
                    ...prev,
                    categories: prev.categories.filter((category) => category.id !== categoryId),
                }
            })
            setLinkingProcedure((prev) => {
                if (prev && prev.id === procedureDetails.id) {
                    return {
                        ...prev,
                        categories: prev.categories.filter((category) => category.id !== categoryId),
                    }
                }
                return prev
            })
            setLinkSelection((prev) => ({
                ...prev,
                categoryIds: prev.categoryIds.filter((id) => id !== categoryId),
            }))
            setDetailsFeedback({type: 'success', message: successMessage})
            await loadProcedures(page, pageSize, filters)
        } catch (err) {
            setDetailsFeedback({
                type: 'error',
                message: err instanceof Error ? err.message : 'Unable to unlink category.',
            })
        } finally {
            setUnlinkingCategoryId(null)
        }
    }

    const handleUnlinkContainerFromProcedure = async (containerId: number) => {
        if (!procedureDetails) {
            return
        }

        const confirmed = window.confirm(
            'This will unlink the container from the procedure. Do you want to continue?',
        )

        if (!confirmed) {
            return
        }

        setUnlinkingContainerId(containerId)
        setDetailsFeedback(null)

        try {
            await unlinkProcedureContainer(procedureDetails.id, containerId)
            const successMessage = 'Container unlinked from procedure successfully.'
            setProcedureDetails((prev) => {
                if (!prev) {
                    return prev
                }

                return {
                    ...prev,
                    containers: prev.containers.filter((container) => container.id !== containerId),
                }
            })
            setLinkingProcedure((prev) => {
                if (prev && prev.id === procedureDetails.id) {
                    return {
                        ...prev,
                        containers: prev.containers.filter((container) => container.id !== containerId),
                    }
                }
                return prev
            })
            setLinkSelection((prev) => ({
                ...prev,
                containerIds: prev.containerIds.filter((id) => id !== containerId),
            }))
            setDetailsFeedback({type: 'success', message: successMessage})
            await loadProcedures(page, pageSize, filters)
            if (containerUsageContainer && containerUsageContainer.id === containerId) {
                void loadContainerUsage(containerId, containerUsagePage)
            }
        } catch (err) {
            setDetailsFeedback({
                type: 'error',
                message: err instanceof Error ? err.message : 'Unable to unlink container.',
            })
        } finally {
            setUnlinkingContainerId(null)
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
            setLinkingFeedback({type: 'success', message: successMessage})
            setDetailsFeedback({type: 'success', message: successMessage})
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
            setFeedback({type: 'success', message: successMessage})
            setDetailsFeedback({type: 'success', message: successMessage})
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

    const availableParentContainers = useMemo(
        () =>
            editingContainerId === null
                ? containers
                : containers.filter((container) => container.id !== editingContainerId),
        [containers, editingContainerId],
    )

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
                <div
                    className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <Info className="h-4 w-4"/>
                    {error}
                </div>
            )}

            <Tabs value={activeTab} onValueChange={handleTabValueChange} className="space-y-4">
                <TabsList className="flex flex-wrap gap-2">
                    <TabsTrigger value="procedures" className="flex items-center gap-2">
                        Procedures
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="flex items-center gap-2">
                        Categories
                    </TabsTrigger>
                    <TabsTrigger value="containers" className="flex items-center gap-2">
                        Containers
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="procedures" className="space-y-4">
                    <div className="bg-white rounded-lg shadow p-4 space-y-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/>
                                    <Input
                                        placeholder="Search by code or name..."
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        className="pl-10"
                                        aria-label="Search procedures"
                                    />
                                </div>

                                <Select value={booleanToSelectValue(filters.isActive)}
                                        onValueChange={handleBooleanFilterChange('isActive')}>
                                    <SelectTrigger className="w-full sm:w-32">
                                        <SelectValue placeholder="Status"/>
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
                                        <SelectValue placeholder="Page size"/>
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
                                    onClick={() => setActiveTab('categories')}
                                    className="flex items-center gap-2"
                                >
                                    <Library className="h-4 w-4"/>
                                    Manage Categories
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setActiveTab('containers')}
                                    className="flex items-center gap-2"
                                >
                                    <Boxes className="h-4 w-4"/>
                                    Manage Containers
                                </Button>
                                <Button type="button" variant="outline" onClick={handleFilterToggle}
                                        className="flex items-center gap-2">
                                    <Filter className="h-4 w-4"/>
                                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                                </Button>
                                <Button type="button" variant="outline" onClick={handleRefresh}
                                        className="flex items-center gap-2">
                                    <RefreshCcw className="h-4 w-4"/>
                                    Refresh
                                </Button>
                                <Button onClick={handleAdd} className="bg-tpa-primary hover:bg-tpa-accent text-white">
                                    <Plus className="h-4 w-4 mr-2"/>
                                    Add Procedure
                                </Button>
                            </div>
                        </div>

                        {showFilters && (
                            <div
                                className="grid grid-cols-1 gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 md:grid-cols-2 lg:grid-cols-3">
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
                                            <SelectValue placeholder="All categories"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={String(category.id)}>
                                                    {category.nameEn} ({category.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="containerFilter">Container</Label>
                                    <Select
                                        value={filters.containerId !== null && filters.containerId !== undefined ? String(filters.containerId) : 'all'}
                                        onValueChange={handleContainerChange}
                                    >
                                        <SelectTrigger id="containerFilter">
                                            <SelectValue placeholder="All containers"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            {containers.map((container) => (
                                                <SelectItem key={container.id} value={String(container.id)}>
                                                    {container.nameEn} ({container.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="minPrice">Min Price</Label>
                                    <Input
                                        id="minPrice"
                                        type="number"
                                        value={filters.minPrice ?? ''}
                                        onChange={(event) => handleMinPriceChange(event.target.value)}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="maxPrice">Max Price</Label>
                                    <Input
                                        id="maxPrice"
                                        type="number"
                                        value={filters.maxPrice ?? ''}
                                        onChange={(event) => handleMaxPriceChange(event.target.value)}
                                        placeholder="0"
                                    />
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
                                    <Label htmlFor="systemCodeFilter">Is Surgical</Label>
                                    <Select
                                        value={booleanToSelectValue(filters.isSurgical)}
                                        onValueChange={handleBooleanFilterChange('isSurgical')}
                                    >
                                        <SelectTrigger id="systemCodeFilter">
                                            <SelectValue placeholder="Any"/>
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
                                            <SelectValue placeholder="Any"/>
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
                                            <SelectValue placeholder="Any"/>
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
                            </div>
                        )}

                        <div className="flex flex-col gap-2 rounded-lg border border-gray-100">
                            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                                <div className="flex flex-col">
                                    <span className="text-xs uppercase text-gray-500">{totalRecordsLabel}</span>
                                    <span className="text-sm text-gray-600">
                                        Page {page + 1} of {Math.max(pageMeta.totalPages, 1)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => void loadProcedures(page, pageSize, filters)}
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCcw className="h-4 w-4"/>
                                        Reload
                                    </Button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <div className="flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300"
                                                        checked={allDisplayedSelected}
                                                        onChange={handleToggleAll}
                                                        aria-label="Select all procedures"
                                                    />
                                                </div>
                                            </TableHead>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Name (EN)</TableHead>
                                            <TableHead>Name (AR)</TableHead>
                                            <TableHead>Unit</TableHead>
                                            <TableHead className="text-right">Reference Price</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-48 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={8}
                                                           className="h-40 text-center text-sm text-gray-500">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin"/> Loading
                                                        procedures...
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : procedures.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8}
                                                           className="h-40 text-center text-sm text-gray-500">
                                                    No procedures found. Try adjusting your search or filters.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            procedures.map((procedure) => (
                                                <TableRow key={procedure.id}>
                                                    <TableCell className="text-center">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-300"
                                                            checked={selectedItems.includes(String(procedure.id))}
                                                            onChange={() => toggleSelectedItem(String(procedure.id))}
                                                            aria-label={`Select procedure ${procedure.code}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell
                                                        className="font-medium text-gray-900">{procedure.code}</TableCell>
                                                    <TableCell>{procedure.nameEn}</TableCell>
                                                    <TableCell dir="rtl">{procedure.nameAr}</TableCell>
                                                    <TableCell>{procedure.unitOfMeasure}</TableCell>
                                                    <TableCell
                                                        className="text-right">{formatCurrency(procedure.referencePrice)}</TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={cn(
                                                                'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                                                                procedure.isActive
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-gray-100 text-gray-600',
                                                            )}
                                                        >
                                                            {procedure.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleOpenLinkFromRow(procedure)}
                                                                aria-label={`Manage links for ${procedure.code}`}
                                                            >
                                                                <Link2 className="h-4 w-4"/>
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleViewDetails(procedure)}
                                                                aria-label={`View details for ${procedure.code}`}
                                                            >
                                                                <Eye className="h-4 w-4"/>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div
                                className="flex flex-col gap-2 border-t border-gray-100 px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
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
                    </div>
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                    <div className="bg-white rounded-lg shadow p-6 space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold text-gray-900">Procedure Categories</h2>
                            <p className="text-sm text-gray-600">
                                Review existing categories and add new definitions for procedures mapping.
                            </p>
                        </div>

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
                                        <RefreshCcw className="h-4 w-4"/>
                                        Refresh
                                    </Button>
                                </div>

                                <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-100 bg-white">
                                    {categoriesLoading ? (
                                        <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Loading categories...
                                        </div>
                                    ) : categories.length === 0 ? (
                                        <div className="p-4 text-sm text-gray-500">No categories available.</div>
                                    ) : (
                                        <ul className="divide-y divide-gray-100">
                                            {categories.map((category) => (
                                                <li key={category.id} className="p-3 text-sm">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div
                                                                className="font-medium text-gray-900">{category.nameEn}</div>
                                                            <div
                                                                className="text-xs text-gray-500">Code: {category.code}</div>
                                                            <div className="text-xs text-gray-500">
                                                                Procedures linked: {category.procedureCount}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEditCategoryRecord(category)}
                                                                aria-label={`Edit category ${category.code}`}
                                                            >
                                                                <PencilLine className="h-4 w-4"/>
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => void handleDeleteCategoryRecord(category.id)}
                                                                disabled={deletingCategoryId === category.id}
                                                                aria-label={`Delete category ${category.code}`}
                                                            >
                                                                {deletingCategoryId === category.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin"/>
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4"/>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 text-xs">
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
                                            setCategoryForm((prev) => ({...prev, code: event.target.value}))
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
                                            setCategoryForm((prev) => ({...prev, nameEn: event.target.value}))
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
                                            setCategoryForm((prev) => ({...prev, nameAr: event.target.value}))
                                        }
                                        placeholder="أدخل الاسم بالعربية"
                                        dir="rtl"
                                    />
                                </div>

                                <div
                                    className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3">
                                    <span className="text-sm font-medium">Active</span>
                                    <Switch
                                        checked={categoryForm.isActive}
                                        onCheckedChange={(checked) =>
                                            setCategoryForm((prev) => ({...prev, isActive: checked}))
                                        }
                                    />
                                </div>

                                {categoryFormError && (
                                    <div
                                        className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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

                                {editingCategoryId && (
                                    <div
                                        className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                                        Editing existing category. Saving will update the linked record.
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleResetCategoryForm}
                                        disabled={isSavingCategory}
                                    >
                                        {editingCategoryId ? 'Cancel' : 'Reset'}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleSaveCategory}
                                        disabled={isSavingCategory}
                                        className="bg-tpa-primary text-white hover:bg-tpa-accent"
                                    >
                                        {isSavingCategory ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin"/> Saving...
                                            </span>
                                        ) : (
                                            editingCategoryId ? 'Save Changes' : 'Add Category'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="containers" className="space-y-4">
                    <div className="bg-white rounded-lg shadow p-6 space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold text-gray-900">Procedure Containers</h2>
                            <p className="text-sm text-gray-600">
                                Maintain the hierarchical containers used to group procedures.
                            </p>
                        </div>

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
                                        <RefreshCcw className="h-4 w-4"/>
                                        Refresh
                                    </Button>
                                </div>

                                <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-100 bg-white">
                                    {containersLoading ? (
                                        <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Loading containers...
                                        </div>
                                    ) : containers.length === 0 ? (
                                        <div className="p-4 text-sm text-gray-500">No containers available.</div>
                                    ) : (
                                        <ul className="divide-y divide-gray-100">
                                            {containers.map((container) => (
                                                <li key={container.id} className="p-3 text-sm">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div
                                                                className="font-medium text-gray-900">{container.nameEn}</div>
                                                            <div className="text-xs text-gray-500">
                                                                Code: {container.code} · Level {container.levelNo}
                                                            </div>
                                                            {container.parentName && (
                                                                <div className="text-xs text-gray-500">
                                                                    Parent: {container.parentName}
                                                                </div>
                                                            )}
                                                            <div className="text-xs text-gray-500">
                                                                Procedures linked: {container.procedureCount} ·
                                                                Children:{' '}
                                                                {container.childCount}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleViewContainerUsage(container)}
                                                                aria-label={`View usage for ${container.code}`}
                                                            >
                                                                <Info className="h-4 w-4"/>
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEditContainerRecord(container)}
                                                                aria-label={`Edit container ${container.code}`}
                                                            >
                                                                <PencilLine className="h-4 w-4"/>
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => void handleDeleteContainerRecord(container.id)}
                                                                disabled={deletingContainerId === container.id}
                                                                aria-label={`Delete container ${container.code}`}
                                                            >
                                                                {deletingContainerId === container.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin"/>
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4"/>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 text-xs">
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
                                            setContainerForm((prev) => ({...prev, code: event.target.value}))
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
                                            setContainerForm((prev) => ({...prev, nameEn: event.target.value}))
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
                                            setContainerForm((prev) => ({...prev, nameAr: event.target.value}))
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
                                            <SelectValue placeholder="No parent"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No parent</SelectItem>
                                            {availableParentContainers.map((container) => (
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
                                                setContainerForm((prev) => ({...prev, createdBy: event.target.value}))
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
                                                setContainerForm((prev) => ({...prev, updatedBy: event.target.value}))
                                            }
                                            placeholder="Optional editor"
                                        />
                                    </div>
                                </div>

                                <div
                                    className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3">
                                    <span className="text-sm font-medium">Active</span>
                                    <Switch
                                        checked={containerForm.isActive}
                                        onCheckedChange={(checked) =>
                                            setContainerForm((prev) => ({...prev, isActive: checked}))
                                        }
                                    />
                                </div>

                                {containerFormError && (
                                    <div
                                        className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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

                                {editingContainerId && (
                                    <div
                                        className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                                        Editing existing container. Saving will update the linked record.
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleResetContainerForm}
                                        disabled={isSavingContainer}
                                    >
                                        {editingContainerId ? 'Cancel' : 'Reset'}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleSaveContainer}
                                        disabled={isSavingContainer}
                                        className="bg-tpa-primary text-white hover:bg-tpa-accent"
                                    >
                                        {isSavingContainer ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin"/> Saving...
                                            </span>
                                        ) : (
                                            editingContainerId ? 'Save Changes' : 'Add Container'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
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
                                            setFormData((prev) => ({...prev, systemCode: event.target.value}))
                                        }
                                        placeholder="Enter system code"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="code">Procedure Code *</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(event) => setFormData((prev) => ({
                                            ...prev,
                                            code: event.target.value
                                        }))}
                                        placeholder="Enter procedure code"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nameEn">Name (English) *</Label>
                                    <Input
                                        id="nameEn"
                                        value={formData.nameEn}
                                        onChange={(event) => setFormData((prev) => ({
                                            ...prev,
                                            nameEn: event.target.value
                                        }))}
                                        placeholder="Enter English name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nameAr">Name (Arabic) *</Label>
                                    <Input
                                        id="nameAr"
                                        value={formData.nameAr}
                                        onChange={(event) => setFormData((prev) => ({
                                            ...prev,
                                            nameAr: event.target.value
                                        }))}
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
                                            setFormData((prev) => ({...prev, unitOfMeasure: event.target.value}))
                                        }
                                        placeholder="e.g., procedure, visit"
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <Switch
                                        id="isActive"
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({...prev, isActive: checked}))
                                        }
                                    />
                                    <Label htmlFor="isActive">Active</Label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Switch
                                        id="isSurgical"
                                        checked={formData.isSurgical}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({...prev, isSurgical: checked}))
                                        }
                                    />
                                    <Label htmlFor="isSurgical">Surgical procedure</Label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Switch
                                        id="requiresAuthorization"
                                        checked={formData.requiresAuthorization}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({...prev, requiresAuthorization: checked}))
                                        }
                                    />
                                    <Label htmlFor="requiresAuthorization">Requires authorization</Label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Switch
                                        id="requiresAnesthesia"
                                        checked={formData.requiresAnesthesia}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({...prev, requiresAnesthesia: checked}))
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
                                            setFormData((prev) => ({
                                                ...prev,
                                                referencePrice: Number(event.target.value)
                                            }))
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
                                            setFormData((prev) => ({
                                                ...prev,
                                                minIntervalDays: Number(event.target.value)
                                            }))
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
                                            setFormData((prev) => ({
                                                ...prev,
                                                maxFrequencyPerYear: Number(event.target.value)
                                            }))
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
                                            setFormData((prev) => ({
                                                ...prev,
                                                standardDurationMinutes: Number(event.target.value)
                                            }))
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
                                            setFormData((prev) => ({...prev, validFrom: event.target.value}))
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
                                            setFormData((prev) => ({...prev, validTo: event.target.value}))
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
                                            setFormData((prev) => ({...prev, createdBy: event.target.value}))
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
                                            setFormData((prev) => ({...prev, updatedBy: event.target.value}))
                                        }
                                        placeholder="Optional last editor"
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">
                                Ownership fields help track who created and last updated the procedure in downstream
                                systems.
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
                                    <Loader2 className="h-4 w-4 animate-spin"/> Saving...
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
                        <DialogDescription>Review the latest information received from the procedures
                            service.</DialogDescription>
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
                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Loading details...
                        </div>
                    ) : detailsError ? (
                        <div
                            className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <Info className="h-4 w-4"/>
                            {detailsError}
                        </div>
                    ) : procedureDetails ? (
                        <div className="space-y-6">
                            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <DetailItem label="System Code" value={procedureDetails.systemCode}/>
                                <DetailItem label="Procedure Code" value={procedureDetails.code}/>
                                <DetailItem label="Name (EN)" value={procedureDetails.nameEn}/>
                                <DetailItem label="Name (AR)" value={procedureDetails.nameAr} rtl/>
                                <DetailItem label="Unit" value={procedureDetails.unitOfMeasure}/>
                                <DetailItem label="Reference Price"
                                            value={formatCurrency(procedureDetails.referencePrice)}/>
                                <DetailItem label="Valid From" value={formatDate(procedureDetails.validFrom)}/>
                                <DetailItem label="Valid To" value={formatDate(procedureDetails.validTo)}/>
                                <DetailItem label="Created By" value={procedureDetails.createdBy ?? '-'}/>
                                <DetailItem label="Updated By" value={procedureDetails.updatedBy ?? '-'}/>
                            </section>

                            <section className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">Categories</h4>
                                <div className="flex flex-wrap gap-2">
                                    {procedureDetails.categories.length === 0 ? (
                                        <span className="text-sm text-gray-500">No categories linked.</span>
                                    ) : (
                                        procedureDetails.categories.map((category) => (
                                            <div
                                                key={`${category.id}-${category.code}`}
                                                className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                                            >
                                                <span>{category.nameEn}</span>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-5 w-5 rounded-full text-blue-700 hover:bg-blue-200 hover:text-blue-900"
                                                    onClick={() => void handleUnlinkCategoryFromProcedure(category.id)}
                                                    disabled={unlinkingCategoryId === category.id}
                                                    aria-label={`Unlink category ${category.code}`}
                                                >
                                                    {unlinkingCategoryId === category.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                                                    ) : (
                                                        <Unlink className="h-3.5 w-3.5"/>
                                                    )}
                                                </Button>
                                            </div>
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
                                            <div
                                                key={`${container.id}-${container.code}`}
                                                className="rounded-lg border border-gray-100 p-3 text-sm"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div
                                                            className="font-medium text-gray-800">{container.nameEn}</div>
                                                        <div className="text-gray-500">Level {container.levelNo}</div>
                                                        {container.parentName && (
                                                            <div
                                                                className="text-gray-500">Parent: {container.parentName}</div>
                                                        )}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                                        onClick={() => void handleUnlinkContainerFromProcedure(container.id)}
                                                        disabled={unlinkingContainerId === container.id}
                                                        aria-label={`Unlink container ${container.code}`}
                                                    >
                                                        {unlinkingContainerId === container.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin"/>
                                                        ) : (
                                                            <Unlink className="h-4 w-4"/>
                                                        )}
                                                    </Button>
                                                </div>
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
                                <Link2 className="h-4 w-4"/>
                                Manage Links
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleEditProcedure}
                                disabled={!procedureDetails || detailsLoading}
                                className="flex items-center gap-2"
                            >
                                <PencilLine className="h-4 w-4"/>
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
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isContainerUsageOpen} onOpenChange={handleContainerUsageDialogChange}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Container Usage</DialogTitle>
                        <DialogDescription>
                            {containerUsageContainer
                                ? `Procedures linked to ${containerUsageContainer.nameEn} (${containerUsageContainer.code}).`
                                : 'Review procedures currently linked to the selected container.'}
                        </DialogDescription>
                    </DialogHeader>

                    {containerUsageError ? (
                        <div
                            className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <Info className="h-4 w-4"/>
                            {containerUsageError}
                        </div>
                    ) : containerUsageLoading ? (
                        <div className="flex h-32 items-center justify-center text-sm text-gray-500">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Loading container usage...
                        </div>
                    ) : containerUsageProcedures.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            No procedures are currently linked to this container.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-xs uppercase tracking-wide text-gray-500">
                                Showing {containerUsageProcedures.length} of {containerUsageMeta.totalElements} procedures
                            </div>
                            <div className="space-y-3">
                                {containerUsageProcedures.map((procedure) => (
                                    <div
                                        key={`${procedure.id}-${procedure.code}`}
                                        className="rounded-lg border border-gray-100 p-4 text-sm"
                                    >
                                        <div
                                            className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <div className="text-base font-semibold text-gray-900">
                                                    {procedure.nameEn}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Code: {procedure.code} · System: {procedure.systemCode}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Reference Price: {formatCurrency(procedure.referencePrice)}
                                            </div>
                                        </div>
                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                            <div>
                                                <div className="text-xs uppercase text-gray-500">Categories</div>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {procedure.categories.length === 0 ? (
                                                        <span className="text-xs text-gray-400">None</span>
                                                    ) : (
                                                        procedure.categories.map((category) => (
                                                            <span
                                                                key={`usage-category-${procedure.id}-${category.id}`}
                                                                className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700"
                                                            >
                                                                {category.nameEn}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase text-gray-500">Containers</div>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {procedure.containers.length === 0 ? (
                                                        <span className="text-xs text-gray-400">None</span>
                                                    ) : (
                                                        procedure.containers.map((linkedContainer) => (
                                                            <span
                                                                key={`usage-container-${procedure.id}-${linkedContainer.id}`}
                                                                className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700"
                                                            >
                                                                {linkedContainer.nameEn}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleContainerUsagePageChange('prev')}
                                disabled={containerUsageMeta.first || containerUsageLoading}
                            >
                                Previous
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleContainerUsagePageChange('next')}
                                disabled={containerUsageMeta.last || containerUsageLoading}
                            >
                                Next
                            </Button>
                            <span>
                                Page {containerUsagePage + 1} of {Math.max(containerUsageMeta.totalPages, 1)}
                            </span>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleContainerUsageDialogChange(false)}
                        >
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

function DetailItem({label, value, rtl = false}: DetailItemProps) {
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
