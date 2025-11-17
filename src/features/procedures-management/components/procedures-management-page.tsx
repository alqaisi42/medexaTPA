'use client'

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
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
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Switch} from '@/components/ui/switch'
import {
    CreateProcedureCategoryPayload,
    CreateProcedureContainerPayload,
    CreateProcedurePayload,
    ICD,
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
import {searchIcds} from '@/lib/api/icd'
import {cn, formatCurrency, formatDate} from '@/lib/utils'
import {useAppStore} from '@/store/app-store'

const PAGE_SIZE_OPTIONS = [10, 20, 50]
const BOOLEAN_SELECT_OPTIONS = [
    {label: 'All', value: 'all'},
    {label: 'Yes', value: 'true'},
    {label: 'No', value: 'false'},
]

const CONTAINER_USAGE_PAGE_SIZE = 10

const CLINICAL_SEVERITY_OPTIONS = ['LOW', 'MODERATE', 'HIGH'] as const
const CLINICAL_RISK_OPTIONS = ['MINOR', 'MAJOR', 'COMPLEX'] as const
const ANESTHESIA_LEVEL_OPTIONS = ['NONE', 'LOCAL', 'GENERAL'] as const
const OPERATION_TYPE_OPTIONS = ['OPEN', 'LAP', 'ENDO'] as const
const OPERATION_ROOM_OPTIONS = ['MINOR', 'MEDIUM', 'MAJOR'] as const
const GENDER_OPTIONS = ['ANY', 'M', 'F'] as const
const ICD_VALIDATION_OPTIONS = ['STRICT', 'RELAXED'] as const
const YES_NO_OPTIONS = [
    { label: 'Not specified', value: '' },
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
    clinicalCategory: '',
    subCategory: '',
    bodyRegion: '',
    severityLevel: '',
    riskLevel: '',
    anesthesiaLevel: '',
    operationType: '',
    operationRoomType: '',
    primaryIcdCode: '',
    primarySpecialty: '',
    primaryIcd: '',
    allowedIcds: '',
    forbiddenIcds: '',
    icdValidationMode: '',
    providerType: '',
    minProviderLevel: null,
    surgeonExperienceMinYears: null,
    genderSpecific: '',
    coverageInclusions: '',
    coPayment: null,
    patientShare: null,
    deductible: null,
    maxAllowedAmount: null,
    limitPerVisit: null,
    limitPerYear: null,
    waitingPeriodDays: null,
    requiresInternalReview: null,
    parentId: null,
    bundleParentId: null,
    bundleComponents: '',
    isBundle: null,
    isFollowUp: null,
    followUpDays: null,
    baseCost: null,
    rvu: null,
    consumablesRequired: '',
    equipmentRequired: '',
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
    const [icdSearchTerm, setIcdSearchTerm] = useState('')
    const [icdResults, setIcdResults] = useState<ICD[]>([])
    const [icdDropdownOpen, setIcdDropdownOpen] = useState(false)
    const [icdSearchLoading, setIcdSearchLoading] = useState(false)
    const [icdSearchError, setIcdSearchError] = useState<string | null>(null)
    const icdDropdownRef = useRef<HTMLDivElement | null>(null)
    const [clinicalCategoryQuery, setClinicalCategoryQuery] = useState('')
    const [subCategoryQuery, setSubCategoryQuery] = useState('')
    const [clinicalCategoryDropdownOpen, setClinicalCategoryDropdownOpen] = useState(false)
    const [subCategoryDropdownOpen, setSubCategoryDropdownOpen] = useState(false)
    const clinicalCategoryDropdownRef = useRef<HTMLDivElement | null>(null)
    const subCategoryDropdownRef = useRef<HTMLDivElement | null>(null)

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
    const [detailsTab, setDetailsTab] = useState<'overview' | 'clinical' | 'links'>('overview')
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

    const sortedCategories = useMemo(() => {
        return [...categories].sort((a, b) => {
            const nameA = (a.nameEn || a.code || '').toLowerCase()
            const nameB = (b.nameEn || b.code || '').toLowerCase()
            if (nameA < nameB) {
                return -1
            }
            if (nameA > nameB) {
                return 1
            }
            return 0
        })
    }, [categories])

    const subCategoryCandidates = useMemo(() => {
        return sortedCategories.filter((category) => Number(category.procedureCount) > 0)
    }, [sortedCategories])

    const filteredClinicalCategories = useMemo(() => {
        const term = clinicalCategoryQuery.trim().toLowerCase()
        if (!term) {
            return sortedCategories
        }
        return sortedCategories.filter((category) => {
            const code = (category.code || '').toLowerCase()
            const nameEn = (category.nameEn || '').toLowerCase()
            return code.includes(term) || nameEn.includes(term)
        })
    }, [clinicalCategoryQuery, sortedCategories])

    const filteredSubCategories = useMemo(() => {
        const term = subCategoryQuery.trim().toLowerCase()
        if (!term) {
            return subCategoryCandidates
        }
        return subCategoryCandidates.filter((category) => {
            const code = (category.code || '').toLowerCase()
            const nameEn = (category.nameEn || '').toLowerCase()
            return code.includes(term) || nameEn.includes(term)
        })
    }, [subCategoryCandidates, subCategoryQuery])

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

    useEffect(() => {
        if (!icdDropdownOpen) {
            return
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (icdDropdownRef.current && !icdDropdownRef.current.contains(event.target as Node)) {
                setIcdDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [icdDropdownOpen])

    useEffect(() => {
        if (!clinicalCategoryDropdownOpen && !subCategoryDropdownOpen) {
            return
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (
                clinicalCategoryDropdownRef.current &&
                clinicalCategoryDropdownOpen &&
                !clinicalCategoryDropdownRef.current.contains(event.target as Node)
            ) {
                setClinicalCategoryDropdownOpen(false)
            }

            if (
                subCategoryDropdownRef.current &&
                subCategoryDropdownOpen &&
                !subCategoryDropdownRef.current.contains(event.target as Node)
            ) {
                setSubCategoryDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [clinicalCategoryDropdownOpen, subCategoryDropdownOpen])

    useEffect(() => {
        if (!icdDropdownOpen || icdSearchTerm.trim().length < 2) {
            setIcdResults([])
            setIcdSearchLoading(false)
            setIcdSearchError(null)
            return
        }

        let isCancelled = false
        setIcdSearchLoading(true)
        setIcdSearchError(null)

        const handler = window.setTimeout(() => {
            void (async () => {
                try {
                    const results = await searchIcds(icdSearchTerm.trim())
                    if (!isCancelled) {
                        setIcdResults(results)
                    }
                } catch (err) {
                    if (!isCancelled) {
                        setIcdResults([])
                        setIcdSearchError(
                            err instanceof Error ? err.message : 'Unable to search ICD catalogue right now.',
                        )
                    }
                } finally {
                    if (!isCancelled) {
                        setIcdSearchLoading(false)
                    }
                }
            })()
        }, 400)

        return () => {
            isCancelled = true
            window.clearTimeout(handler)
        }
    }, [icdDropdownOpen, icdSearchTerm])

    useEffect(() => {
        if (!isDialogOpen) {
            setIcdSearchTerm('')
            setIcdResults([])
            setIcdDropdownOpen(false)
            setIcdSearchError(null)
            setClinicalCategoryDropdownOpen(false)
            setSubCategoryDropdownOpen(false)
            setClinicalCategoryQuery('')
            setSubCategoryQuery('')
        }
    }, [isDialogOpen])

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
            clinicalCategory: details.clinicalCategory ?? '',
            subCategory: details.subCategory ?? '',
            bodyRegion: details.bodyRegion ?? '',
            severityLevel: details.severityLevel ?? '',
            riskLevel: details.riskLevel ?? '',
            anesthesiaLevel: details.anesthesiaLevel ?? '',
            operationType: details.operationType ?? '',
            operationRoomType: details.operationRoomType ?? '',
            primaryIcdCode: details.primaryIcdCode ?? '',
            primarySpecialty: details.primarySpecialty ?? '',
            primaryIcd: details.primaryIcd ?? '',
            allowedIcds: details.allowedIcds ?? '',
            forbiddenIcds: details.forbiddenIcds ?? '',
            icdValidationMode: details.icdValidationMode ?? '',
            providerType: details.providerType ?? '',
            minProviderLevel: details.minProviderLevel ?? null,
            surgeonExperienceMinYears: details.surgeonExperienceMinYears ?? null,
            genderSpecific: details.genderSpecific ?? '',
            coverageInclusions: details.coverageInclusions ?? '',
            coPayment: details.coPayment ?? null,
            patientShare: details.patientShare ?? null,
            deductible: details.deductible ?? null,
            maxAllowedAmount: details.maxAllowedAmount ?? null,
            limitPerVisit: details.limitPerVisit ?? null,
            limitPerYear: details.limitPerYear ?? null,
            waitingPeriodDays: details.waitingPeriodDays ?? null,
            requiresInternalReview: details.requiresInternalReview ?? null,
            parentId: details.parentId ?? null,
            bundleParentId: details.bundleParentId ?? null,
            bundleComponents: details.bundleComponents ?? '',
            isBundle: details.isBundle ?? null,
            isFollowUp: details.isFollowUp ?? null,
            followUpDays: details.followUpDays ?? null,
            baseCost: details.baseCost ?? null,
            rvu: details.rvu ?? null,
            consumablesRequired: details.consumablesRequired ?? '',
            equipmentRequired: details.equipmentRequired ?? '',
            validFrom: details.validFrom ?? '',
            validTo: details.validTo ?? '',
            isActive: Boolean(details.isActive),
            createdBy: details.createdBy ?? '',
            updatedBy: details.updatedBy ?? '',
        })
        setIcdSearchTerm(details.primaryIcdCode ?? '')
        setClinicalCategoryQuery(details.clinicalCategory ?? '')
        setSubCategoryQuery(details.subCategory ?? '')
    }, [])

    const handleAdd = () => {
        setDialogMode('create')
        setEditingProcedureId(null)
        setFormData(INITIAL_FORM_STATE)
        setIcdSearchTerm('')
        setClinicalCategoryQuery('')
        setSubCategoryQuery('')
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
            setIcdSearchTerm('')
            setClinicalCategoryQuery('')
            setSubCategoryQuery('')
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
            'minProviderLevel',
            'surgeonExperienceMinYears',
            'coPayment',
            'patientShare',
            'deductible',
            'maxAllowedAmount',
            'limitPerVisit',
            'limitPerYear',
            'waitingPeriodDays',
            'followUpDays',
            'baseCost',
            'rvu',
        ]

        for (const field of numericFields) {
            const value = formData[field]
            if (value === null || value === undefined || value === '') {
                continue
            }
            if (Number.isNaN(Number(value))) {
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
            minProviderLevel:
                formData.minProviderLevel === null || formData.minProviderLevel === undefined
                    ? null
                    : Number(formData.minProviderLevel),
            surgeonExperienceMinYears:
                formData.surgeonExperienceMinYears === null || formData.surgeonExperienceMinYears === undefined
                    ? null
                    : Number(formData.surgeonExperienceMinYears),
            coPayment: formData.coPayment === null ? null : Number(formData.coPayment),
            patientShare: formData.patientShare === null ? null : Number(formData.patientShare),
            deductible: formData.deductible === null ? null : Number(formData.deductible),
            maxAllowedAmount: formData.maxAllowedAmount === null ? null : Number(formData.maxAllowedAmount),
            limitPerVisit: formData.limitPerVisit === null ? null : Number(formData.limitPerVisit),
            limitPerYear: formData.limitPerYear === null ? null : Number(formData.limitPerYear),
            waitingPeriodDays: formData.waitingPeriodDays === null ? null : Number(formData.waitingPeriodDays),
            followUpDays: formData.followUpDays === null ? null : Number(formData.followUpDays),
            baseCost: formData.baseCost === null ? null : Number(formData.baseCost),
            rvu: formData.rvu === null ? null : Number(formData.rvu),
            createdBy: formData.createdBy?.trim() || undefined,
            updatedBy: formData.updatedBy?.trim() || undefined,
        }

        const optionalStringFields: (keyof CreateProcedurePayload)[] = [
            'clinicalCategory',
            'subCategory',
            'bodyRegion',
            'severityLevel',
            'riskLevel',
            'anesthesiaLevel',
            'operationType',
            'operationRoomType',
            'primaryIcdCode',
            'primarySpecialty',
            'primaryIcd',
            'allowedIcds',
            'forbiddenIcds',
            'icdValidationMode',
            'providerType',
            'genderSpecific',
            'coverageInclusions',
            'bundleComponents',
            'consumablesRequired',
            'equipmentRequired',
        ]

        optionalStringFields.forEach((field) => {
            const rawValue = formData[field]
            if (typeof rawValue === 'string') {
                const trimmed = rawValue.trim()
                ;(payload as Record<string, unknown>)[field as string] = trimmed.length > 0 ? trimmed : undefined
            }
        })

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

    const handlePrimaryIcdSelect = (icd: ICD) => {
        setFormData((prev) => ({...prev, primaryIcdCode: icd.code}))
        setIcdSearchTerm(`${icd.code} · ${icd.nameEn}`)
        setIcdDropdownOpen(false)
    }

    const handleClearPrimaryIcd = () => {
        setFormData((prev) => ({...prev, primaryIcdCode: ''}))
        setIcdSearchTerm('')
        setIcdResults([])
    }

    const handleClinicalCategorySelect = (category: ProcedureCategoryRecord) => {
        const label = category.nameEn || category.code || ''
        setFormData((prev) => ({...prev, clinicalCategory: label}))
        setClinicalCategoryQuery(label)
        setClinicalCategoryDropdownOpen(false)
    }

    const handleClearClinicalCategory = () => {
        setFormData((prev) => ({...prev, clinicalCategory: ''}))
        setClinicalCategoryQuery('')
    }

    const handleSubCategorySelect = (category: ProcedureCategoryRecord) => {
        const label = category.nameEn || category.code || ''
        setFormData((prev) => ({...prev, subCategory: label}))
        setSubCategoryQuery(label)
        setSubCategoryDropdownOpen(false)
    }

    const handleClearSubCategory = () => {
        setFormData((prev) => ({...prev, subCategory: ''}))
        setSubCategoryQuery('')
    }

    const handleTabValueChange = (value: string) => {
        if (value === 'procedures' || value === 'categories' || value === 'containers') {
            setActiveTab(value)
        }
    }

    const handleDetailsTabChange = (value: string) => {
        if (value === 'overview' || value === 'clinical' || value === 'links') {
            setDetailsTab(value)
        }
    }

    const handleViewDetails = (procedure: ProcedureSummary) => {
        setOpenLinkAfterDetails(false)
        setDetailsId(procedure.id)
        setDetailsTab('overview')
        setIsDetailsOpen(true)
    }

    const handleOpenLinkFromRow = (procedure: ProcedureSummary) => {
        setDetailsId(procedure.id)
        setOpenLinkAfterDetails(true)
        setDetailsTab('overview')
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
        <div className="space-y-6 px-4 py-6 md:px-8 lg:px-8">
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

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setActiveTab('categories')}
                                        className="flex items-center gap-2"
                                    >
                                        <Library className="h-4 w-4" />
                                        Categories
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setActiveTab('containers')}
                                        className="flex items-center gap-2"
                                    >
                                        <Boxes className="h-4 w-4" />
                                        Containers
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleFilterToggle}
                                        className="flex items-center gap-2"
                                    >
                                        <Filter className="h-4 w-4" />
                                        Filters
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleRefresh}
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCcw className="h-4 w-4" />
                                        Refresh
                                    </Button>
                                </div>

                                <Button
                                    onClick={handleAdd}
                                    className="ml-auto bg-tpa-primary hover:bg-tpa-accent text-white shadow-sm px-4"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
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
            <Dialog open={isLinkDialogOpen} onOpenChange={handleLinkDialogChange}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Manage Procedure Links</DialogTitle>
                        <DialogDescription>
                            {linkingProcedure
                                ? `Update category and container associations for ${linkingProcedure.nameEn} (${linkingProcedure.code}).`
                                : 'Select a procedure to manage its linked categories and containers.'}
                        </DialogDescription>
                    </DialogHeader>

                    {linkingFeedback && (
                        <div
                            className={cn(
                                'rounded-md border px-4 py-3 text-sm',
                                linkingFeedback.type === 'success'
                                    ? 'border-green-200 bg-green-50 text-green-800'
                                    : 'border-red-200 bg-red-50 text-red-700',
                            )}
                        >
                            {linkingFeedback.message}
                        </div>
                    )}

                    {linkingProcedure ? (
                        <div className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-800">Categories</h3>
                                            <p className="text-xs text-gray-500">
                                                Choose the categories that should be associated with this procedure.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => void loadCategories()}
                                            disabled={categoriesLoading}
                                            className="flex items-center gap-2"
                                        >
                                            {categoriesLoading ? (
                                                <>
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    Loading
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCcw className="h-3.5 w-3.5" />
                                                    Refresh
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            placeholder="Search categories..."
                                            value={linkCategoryQuery}
                                            onChange={(event) => setLinkCategoryQuery(event.target.value)}
                                            className="pl-10"
                                        />
                                    </div>

                                    <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200">
                                        {categoriesLoading ? (
                                            <div className="flex h-32 items-center justify-center text-sm text-gray-500">
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading categories...
                                            </div>
                                        ) : filteredLinkCategories.length === 0 ? (
                                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                                                No categories available.
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-100">
                                                {filteredLinkCategories.map((category) => {
                                                    const checked = linkSelection.categoryIds.includes(category.id)
                                                    return (
                                                        <label
                                                            key={category.id}
                                                            className="flex cursor-pointer items-start gap-3 px-4 py-3 text-sm hover:bg-gray-50"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="mt-1 h-4 w-4 rounded border-gray-300"
                                                                checked={checked}
                                                                onChange={() => toggleLinkCategory(category.id)}
                                                                aria-label={`Toggle category ${category.code}`}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-gray-900">
                                                                    {category.nameEn}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    Code: {category.code} · Procedures linked: {category.procedureCount}
                                                                </span>
                                                                {!category.isActive && (
                                                                    <span className="mt-1 inline-flex w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                                                        Inactive
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-800">Containers</h3>
                                            <p className="text-xs text-gray-500">
                                                Link the procedure to the containers it should belong to.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => void loadContainers()}
                                            disabled={containersLoading}
                                            className="flex items-center gap-2"
                                        >
                                            {containersLoading ? (
                                                <>
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    Loading
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCcw className="h-3.5 w-3.5" />
                                                    Refresh
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            placeholder="Search containers..."
                                            value={linkContainerQuery}
                                            onChange={(event) => setLinkContainerQuery(event.target.value)}
                                            className="pl-10"
                                        />
                                    </div>

                                    <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200">
                                        {containersLoading ? (
                                            <div className="flex h-32 items-center justify-center text-sm text-gray-500">
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading containers...
                                            </div>
                                        ) : filteredLinkContainers.length === 0 ? (
                                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                                                No containers available.
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-100">
                                                {filteredLinkContainers.map((container) => {
                                                    const checked = linkSelection.containerIds.includes(container.id)
                                                    return (
                                                        <label
                                                            key={container.id}
                                                            className="flex cursor-pointer items-start gap-3 px-4 py-3 text-sm hover:bg-gray-50"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="mt-1 h-4 w-4 rounded border-gray-300"
                                                                checked={checked}
                                                                onChange={() => toggleLinkContainer(container.id)}
                                                                aria-label={`Toggle container ${container.code}`}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-gray-900">
                                                                    {container.nameEn}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    Code: {container.code} · Level {container.levelNo}
                                                                </span>
                                                                {container.parentName && (
                                                                    <span className="text-xs text-gray-500">
                                                                        Parent: {container.parentName}
                                                                    </span>
                                                                )}
                                                                {!container.isActive && (
                                                                    <span className="mt-1 inline-flex w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                                                        Inactive
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                            Select a procedure to review and update its linked categories and containers.
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleLinkDialogChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => void handleSaveLinks()}
                            disabled={!linkingProcedure || isLinkSaving}
                            className="bg-tpa-primary text-white hover:bg-tpa-accent"
                        >
                            {isLinkSaving ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                                </span>
                            ) : (
                                'Save Changes'
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
                        <div className="flex flex-col gap-4 md:flex-row">
                            <TabsList className="flex h-full w-full flex-col gap-2 rounded-lg bg-gray-50 p-2 md:w-56">
                                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                                <TabsTrigger value="clinical">Clinical Context</TabsTrigger>
                                <TabsTrigger value="pricing">Coverage & Pricing</TabsTrigger>
                                <TabsTrigger value="ownership">Ownership & Audit</TabsTrigger>
                            </TabsList>

                            <div className="flex-1">
                        <TabsContent value="basic" className="space-y-4 pt-2">
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

                        <TabsContent value="clinical" className="space-y-6 pt-4">
                            <p className="text-sm text-gray-500">
                                Capture the clinical framing that helps coders, medical reviewers, and providers understand
                                how the procedure should be positioned. Leave fields blank if they are not applicable.
                            </p>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="clinicalCategory">Clinical Category</Label>
                                    <div className="relative" ref={clinicalCategoryDropdownRef}>
                                        <Input
                                            id="clinicalCategory"
                                            value={clinicalCategoryQuery}
                                            autoComplete="off"
                                            className="pr-12"
                                            onFocus={() => setClinicalCategoryDropdownOpen(true)}
                                            onChange={(event) => {
                                                const value = event.target.value
                                                setClinicalCategoryQuery(value)
                                                setFormData((prev) => ({...prev, clinicalCategory: value}))
                                                setClinicalCategoryDropdownOpen(true)
                                            }}
                                            placeholder="Search procedure categories"
                                            role="combobox"
                                            aria-expanded={clinicalCategoryDropdownOpen}
                                            aria-controls="clinicalCategory-listbox"
                                        />
                                        {formData.clinicalCategory && (
                                            <button
                                                type="button"
                                                onClick={handleClearClinicalCategory}
                                                className="absolute inset-y-0 right-2 text-xs font-medium text-primary"
                                            >
                                                Clear
                                            </button>
                                        )}
                                        {clinicalCategoryDropdownOpen && (
                                            <div
                                                id="clinicalCategory-listbox"
                                                role="listbox"
                                                className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"
                                            >
                                                {categoriesLoading ? (
                                                    <div className="flex items-center px-3 py-2 text-sm text-gray-500">
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Loading categories...
                                                    </div>
                                                ) : filteredClinicalCategories.length === 0 ? (
                                                    <p className="px-3 py-2 text-xs text-gray-500">No categories match this search.</p>
                                                ) : (
                                                    <ul className="max-h-60 overflow-auto py-1 text-sm">
                                                        {filteredClinicalCategories.map((category) => {
                                                            const displayName = category.nameEn || category.code || 'Unnamed category'
                                                            return (
                                                                <li key={category.id}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleClinicalCategorySelect(category)}
                                                                        className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-gray-50"
                                                                    >
                                                                        <span className="font-medium text-gray-900">{displayName}</span>
                                                                        <span className="text-xs text-gray-500">{category.code}</span>
                                                                    </button>
                                                                </li>
                                                            )
                                                        })}
                                                    </ul>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">Sourced from the Procedure Categories catalog.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subCategory">Sub Category</Label>
                                    <div className="relative" ref={subCategoryDropdownRef}>
                                        <Input
                                            id="subCategory"
                                            value={subCategoryQuery}
                                            autoComplete="off"
                                            className="pr-12"
                                            onFocus={() => setSubCategoryDropdownOpen(true)}
                                            onChange={(event) => {
                                                const value = event.target.value
                                                setSubCategoryQuery(value)
                                                setFormData((prev) => ({...prev, subCategory: value}))
                                                setSubCategoryDropdownOpen(true)
                                            }}
                                            placeholder="Search linked sub categories"
                                            role="combobox"
                                            aria-expanded={subCategoryDropdownOpen}
                                            aria-controls="subCategory-listbox"
                                        />
                                        {formData.subCategory && (
                                            <button
                                                type="button"
                                                onClick={handleClearSubCategory}
                                                className="absolute inset-y-0 right-2 text-xs font-medium text-primary"
                                            >
                                                Clear
                                            </button>
                                        )}
                                        {subCategoryDropdownOpen && (
                                            <div
                                                id="subCategory-listbox"
                                                role="listbox"
                                                className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"
                                            >
                                                {categoriesLoading ? (
                                                    <div className="flex items-center px-3 py-2 text-sm text-gray-500">
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Loading sub categories...
                                                    </div>
                                                ) : filteredSubCategories.length === 0 ? (
                                                    <p className="px-3 py-2 text-xs text-gray-500">No linked sub categories found.</p>
                                                ) : (
                                                    <ul className="max-h-60 overflow-auto py-1 text-sm">
                                                        {filteredSubCategories.map((category) => {
                                                            const displayName = category.nameEn || category.code || 'Unnamed category'
                                                            const linkedCount = Number(category.procedureCount) || 0
                                                            return (
                                                                <li key={category.id}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSubCategorySelect(category)}
                                                                        className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-gray-50"
                                                                    >
                                                                        <div className="flex w-full items-center justify-between">
                                                                            <span className="font-medium text-gray-900">{displayName}</span>
                                                                            <span className="text-xs text-gray-500">{linkedCount} linked</span>
                                                                        </div>
                                                                        <span className="text-xs text-gray-500">{category.code}</span>
                                                                    </button>
                                                                </li>
                                                            )
                                                        })}
                                                    </ul>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">Only categories with linked procedures can be tagged as sub categories.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bodyRegion">Body Region</Label>
                                    <Input
                                        id="bodyRegion"
                                        value={formData.bodyRegion ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({...prev, bodyRegion: event.target.value}))
                                        }
                                        placeholder="e.g., Thorax"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="primarySpecialty">Primary Specialty</Label>
                                    <Input
                                        id="primarySpecialty"
                                        value={formData.primarySpecialty ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({...prev, primarySpecialty: event.target.value}))
                                        }
                                        placeholder="Which specialty primarily performs it?"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="severityLevel">Severity Level</Label>
                                    <Select
                                        value={formData.severityLevel || ''}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({...prev, severityLevel: value}))
                                        }
                                    >
                                        <SelectTrigger id="severityLevel">
                                            <SelectValue placeholder="Select severity" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Not specified</SelectItem>
                                            {CLINICAL_SEVERITY_OPTIONS.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="riskLevel">Risk Level</Label>
                                    <Select
                                        value={formData.riskLevel || ''}
                                        onValueChange={(value) => setFormData((prev) => ({...prev, riskLevel: value}))}
                                    >
                                        <SelectTrigger id="riskLevel">
                                            <SelectValue placeholder="Select risk" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Not specified</SelectItem>
                                            {CLINICAL_RISK_OPTIONS.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="anesthesiaLevel">Anesthesia Level</Label>
                                    <Select
                                        value={formData.anesthesiaLevel || ''}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({...prev, anesthesiaLevel: value}))
                                        }
                                    >
                                        <SelectTrigger id="anesthesiaLevel">
                                            <SelectValue placeholder="Select anesthesia" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Not specified</SelectItem>
                                            {ANESTHESIA_LEVEL_OPTIONS.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="operationType">Operation Type</Label>
                                    <Select
                                        value={formData.operationType || ''}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({...prev, operationType: value}))
                                        }
                                    >
                                        <SelectTrigger id="operationType">
                                            <SelectValue placeholder="Select technique" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Not specified</SelectItem>
                                            {OPERATION_TYPE_OPTIONS.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="operationRoomType">Operation Room Type</Label>
                                    <Select
                                        value={formData.operationRoomType || ''}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({...prev, operationRoomType: value}))
                                        }
                                    >
                                        <SelectTrigger id="operationRoomType">
                                            <SelectValue placeholder="Select room size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Not specified</SelectItem>
                                            {OPERATION_ROOM_OPTIONS.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="primaryIcdCode">Primary ICD Code</Label>
                                    <div className="relative" ref={icdDropdownRef}>
                                        <Input
                                            id="primaryIcdCode"
                                            value={icdSearchTerm}
                                            onFocus={() => setIcdDropdownOpen(true)}
                                            onChange={(event) => {
                                                const value = event.target.value
                                                setIcdSearchTerm(value)
                                                setIcdDropdownOpen(true)
                                                if (!value) {
                                                    setFormData((prev) => ({...prev, primaryIcdCode: ''}))
                                                    setIcdResults([])
                                                }
                                            }}
                                            placeholder="Search ICD code or name"
                                            autoComplete="off"
                                            aria-expanded={icdDropdownOpen}
                                        />
                                        {formData.primaryIcdCode && (
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-2 flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
                                                onClick={handleClearPrimaryIcd}
                                            >
                                                Clear
                                            </button>
                                        )}
                                        {icdDropdownOpen && (
                                            <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                                                {icdSearchTerm.trim().length < 2 ? (
                                                    <p className="px-3 py-2 text-xs text-gray-500">
                                                        Type at least two characters to search the ICD catalogue.
                                                    </p>
                                                ) : icdSearchLoading ? (
                                                    <div className="flex items-center px-3 py-2 text-sm text-gray-500">
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                        Searching ICD codes...
                                                    </div>
                                                ) : icdSearchError ? (
                                                    <p className="px-3 py-2 text-xs text-red-600">{icdSearchError}</p>
                                                ) : icdResults.length === 0 ? (
                                                    <p className="px-3 py-2 text-xs text-gray-500">No ICD codes match this search.</p>
                                                ) : (
                                                    <ul className="max-h-60 overflow-auto py-1 text-sm">
                                                        {icdResults.map((icd) => (
                                                            <li key={icd.id}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handlePrimaryIcdSelect(icd)}
                                                                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-gray-50"
                                                                >
                                                                    <span className="font-medium text-gray-900">{icd.code}</span>
                                                                    <span className="text-xs text-gray-500">{icd.nameEn}</span>
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Use the searchable ICD catalogue to guide claim reviewers and pricing teams.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="primaryIcd">Primary ICD Name</Label>
                                    <Input
                                        id="primaryIcd"
                                        value={formData.primaryIcd ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({...prev, primaryIcd: event.target.value}))
                                        }
                                        placeholder="Optional ICD description"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="icdValidationMode">ICD Validation Mode</Label>
                                    <Select
                                        value={formData.icdValidationMode || ''}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({...prev, icdValidationMode: value}))
                                        }
                                    >
                                        <SelectTrigger id="icdValidationMode">
                                            <SelectValue placeholder="Select validation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Not specified</SelectItem>
                                            {ICD_VALIDATION_OPTIONS.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="providerType">Provider Type</Label>
                                    <Input
                                        id="providerType"
                                        value={formData.providerType ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({...prev, providerType: event.target.value}))
                                        }
                                        placeholder="e.g., Surgeon, GP"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="minProviderLevel">Minimum Provider Level</Label>
                                    <Input
                                        id="minProviderLevel"
                                        type="number"
                                        min="0"
                                        value={formData.minProviderLevel ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                minProviderLevel: event.target.value ? Number(event.target.value) : null,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="surgeonExperienceMinYears">Surgeon Experience (years)</Label>
                                    <Input
                                        id="surgeonExperienceMinYears"
                                        type="number"
                                        min="0"
                                        value={formData.surgeonExperienceMinYears ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                surgeonExperienceMinYears: event.target.value ? Number(event.target.value) : null,
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="allowedIcds">Allowed ICDs</Label>
                                    <Textarea
                                        id="allowedIcds"
                                        rows={3}
                                        value={formData.allowedIcds ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({...prev, allowedIcds: event.target.value}))
                                        }
                                        placeholder="JSON array or comma separated values"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="forbiddenIcds">Forbidden ICDs</Label>
                                    <Textarea
                                        id="forbiddenIcds"
                                        rows={3}
                                        value={formData.forbiddenIcds ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({...prev, forbiddenIcds: event.target.value}))
                                        }
                                        placeholder="JSON array or comma separated values"
                                    />
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

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="genderSpecific">Gender Specific</Label>
                                    <Select
                                        value={formData.genderSpecific || ''}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({...prev, genderSpecific: value}))
                                        }
                                    >
                                        <SelectTrigger id="genderSpecific">
                                            <SelectValue placeholder="Any" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {GENDER_OPTIONS.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option === 'ANY' ? 'Any' : option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="coverageInclusions">Coverage Inclusions</Label>
                                    <Textarea
                                        id="coverageInclusions"
                                        rows={3}
                                        value={formData.coverageInclusions ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({...prev, coverageInclusions: event.target.value}))
                                        }
                                        placeholder="JSON array or comma separated list"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="coPayment">Co-Payment (%)</Label>
                                    <Input
                                        id="coPayment"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.coPayment ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                coPayment: event.target.value ? Number(event.target.value) : null,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="patientShare">Patient Share (%)</Label>
                                    <Input
                                        id="patientShare"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.patientShare ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                patientShare: event.target.value ? Number(event.target.value) : null,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="deductible">Deductible</Label>
                                    <Input
                                        id="deductible"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.deductible ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                deductible: event.target.value ? Number(event.target.value) : null,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="maxAllowedAmount">Max Allowed Amount</Label>
                                    <Input
                                        id="maxAllowedAmount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.maxAllowedAmount ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                maxAllowedAmount: event.target.value ? Number(event.target.value) : null,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="limitPerVisit">Limit per Visit</Label>
                                    <Input
                                        id="limitPerVisit"
                                        type="number"
                                        min="0"
                                        value={formData.limitPerVisit ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                limitPerVisit: event.target.value ? Number(event.target.value) : null,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="limitPerYear">Limit per Year</Label>
                                    <Input
                                        id="limitPerYear"
                                        type="number"
                                        min="0"
                                        value={formData.limitPerYear ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                limitPerYear: event.target.value ? Number(event.target.value) : null,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="waitingPeriodDays">Waiting Period (days)</Label>
                                    <Input
                                        id="waitingPeriodDays"
                                        type="number"
                                        min="0"
                                        value={formData.waitingPeriodDays ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                waitingPeriodDays: event.target.value ? Number(event.target.value) : null,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="requiresInternalReview">Requires Internal Review</Label>
                                    <Select
                                        value={formData.requiresInternalReview === null ? '' : String(formData.requiresInternalReview)}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                requiresInternalReview: value === '' ? null : value === 'true',
                                            }))
                                        }
                                    >
                                        <SelectTrigger id="requiresInternalReview">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {YES_NO_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="baseCost">Base Cost</Label>
                                    <Input
                                        id="baseCost"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.baseCost ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                baseCost: event.target.value ? Number(event.target.value) : null,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="rvu">RVU</Label>
                                    <Input
                                        id="rvu"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.rvu ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                rvu: event.target.value ? Number(event.target.value) : null,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bundleParentId">Bundle Parent ID</Label>
                                    <Input
                                        id="bundleParentId"
                                        type="number"
                                        min="0"
                                        value={formData.bundleParentId ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                bundleParentId: event.target.value ? Number(event.target.value) : null,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bundleComponents">Bundle Components</Label>
                                    <Textarea
                                        id="bundleComponents"
                                        rows={3}
                                        value={formData.bundleComponents ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({...prev, bundleComponents: event.target.value}))
                                        }
                                        placeholder="JSON array of component IDs"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="isBundle">Is Bundle</Label>
                                    <Select
                                        value={formData.isBundle === null ? '' : String(formData.isBundle)}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({...prev, isBundle: value === '' ? null : value === 'true'}))
                                        }
                                    >
                                        <SelectTrigger id="isBundle">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {YES_NO_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="isFollowUp">Is Follow Up</Label>
                                    <Select
                                        value={formData.isFollowUp === null ? '' : String(formData.isFollowUp)}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({...prev, isFollowUp: value === '' ? null : value === 'true'}))
                                        }
                                    >
                                        <SelectTrigger id="isFollowUp">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {YES_NO_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="followUpDays">Follow Up Days</Label>
                                    <Input
                                        id="followUpDays"
                                        type="number"
                                        min="0"
                                        value={formData.followUpDays ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                followUpDays: event.target.value ? Number(event.target.value) : null,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="parentId">Parent Procedure ID</Label>
                                    <Input
                                        id="parentId"
                                        type="number"
                                        min="0"
                                        value={formData.parentId ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                parentId: event.target.value ? Number(event.target.value) : null,
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="consumablesRequired">Consumables Required</Label>
                                    <Textarea
                                        id="consumablesRequired"
                                        rows={3}
                                        value={formData.consumablesRequired ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({...prev, consumablesRequired: event.target.value}))
                                        }
                                        placeholder="List consumables or JSON array"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="equipmentRequired">Equipment Required</Label>
                                    <Textarea
                                        id="equipmentRequired"
                                        rows={3}
                                        value={formData.equipmentRequired ?? ''}
                                        onChange={(event) =>
                                            setFormData((prev) => ({...prev, equipmentRequired: event.target.value}))
                                        }
                                        placeholder="List equipment or JSON array"
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
                        <Tabs
                            orientation="vertical"
                            value={detailsTab}
                            onValueChange={handleDetailsTabChange}
                            className="flex flex-col gap-6 md:flex-row"
                        >
                            <TabsList className="!h-auto w-full flex-row gap-2 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-2 text-sm font-medium text-gray-600 md:w-60 md:flex-col">
                                <TabsTrigger
                                    value="overview"
                                    className="w-full justify-start rounded-md text-left data-[state=active]:bg-white data-[state=active]:text-tpa-primary"
                                >
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger
                                    value="clinical"
                                    className="w-full justify-start rounded-md text-left data-[state=active]:bg-white data-[state=active]:text-tpa-primary"
                                >
                                    Clinical Context
                                </TabsTrigger>
                                <TabsTrigger
                                    value="links"
                                    className="w-full justify-start rounded-md text-left data-[state=active]:bg-white data-[state=active]:text-tpa-primary"
                                >
                                    Categories & Containers
                                </TabsTrigger>
                            </TabsList>
                            <div className="flex-1 space-y-6">
                                <TabsContent value="overview" className="mt-0 space-y-6">
                                    <section className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-700">Master Data & Pricing</h4>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <DetailItem label="System Code" value={procedureDetails.systemCode}/>
                                            <DetailItem label="Procedure Code" value={procedureDetails.code}/>
                                            <DetailItem label="Name (EN)" value={procedureDetails.nameEn}/>
                                            <DetailItem label="Name (AR)" value={procedureDetails.nameAr} rtl/>
                                            <DetailItem label="Unit" value={procedureDetails.unitOfMeasure}/>
                                            <DetailItem
                                                label="Reference Price"
                                                value={formatCurrency(procedureDetails.referencePrice)}
                                            />
                                            <DetailItem label="Valid From" value={formatDate(procedureDetails.validFrom)}/>
                                            <DetailItem label="Valid To" value={formatDate(procedureDetails.validTo)}/>
                                            <DetailItem label="Surgical" value={procedureDetails.isSurgical ? 'Yes' : 'No'}/>
                                            <DetailItem
                                                label="Requires Authorization"
                                                value={procedureDetails.requiresAuthorization ? 'Yes' : 'No'}
                                            />
                                            <DetailItem
                                                label="Requires Anesthesia"
                                                value={procedureDetails.requiresAnesthesia ? 'Yes' : 'No'}
                                            />
                                            <DetailItem
                                                label="Min Interval (days)"
                                                value={procedureDetails.minIntervalDays ?? '-'}
                                            />
                                            <DetailItem
                                                label="Max Frequency / year"
                                                value={procedureDetails.maxFrequencyPerYear ?? '-'}
                                            />
                                            <DetailItem
                                                label="Standard Duration (min)"
                                                value={procedureDetails.standardDurationMinutes ?? '-'}
                                            />
                                            <DetailItem label="Created By" value={procedureDetails.createdBy ?? '-'}/>
                                            <DetailItem label="Updated By" value={procedureDetails.updatedBy ?? '-'}/>
                                        </div>
                                    </section>
                                </TabsContent>
                                <TabsContent value="clinical" className="mt-0 space-y-6">
                                    <section className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-700">Clinical Classification</h4>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <DetailItem
                                                label="Clinical Category"
                                                value={procedureDetails.clinicalCategory ?? '-'}
                                            />
                                            <DetailItem label="Sub Category" value={procedureDetails.subCategory ?? '-'}/>
                                            <DetailItem label="Body Region" value={procedureDetails.bodyRegion ?? '-'}/>
                                            <DetailItem label="Primary Specialty" value={procedureDetails.primarySpecialty ?? '-'}/>
                                        </div>
                                    </section>
                                    <section className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-700">Severity & Operating Needs</h4>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <DetailItem label="Severity Level" value={procedureDetails.severityLevel ?? '-'}/>
                                            <DetailItem label="Risk Level" value={procedureDetails.riskLevel ?? '-'}/>
                                            <DetailItem label="Anesthesia Level" value={procedureDetails.anesthesiaLevel ?? '-'}/>
                                            <DetailItem label="Operation Type" value={procedureDetails.operationType ?? '-'}/>
                                            <DetailItem label="Operation Room Type" value={procedureDetails.operationRoomType ?? '-'}/>
                                            <DetailItem label="Primary ICD Code" value={procedureDetails.primaryIcdCode ?? '-'}/>
                                        </div>
                                    </section>
                                </TabsContent>
                                <TabsContent value="links" className="mt-0 space-y-6">
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
                                                                <div className="font-medium text-gray-800">{container.nameEn}</div>
                                                                <div className="text-gray-500">Level {container.levelNo}</div>
                                                                {container.parentName && (
                                                                    <div className="text-gray-500">Parent: {container.parentName}</div>
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
                                </TabsContent>
                            </div>
                        </Tabs>
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
