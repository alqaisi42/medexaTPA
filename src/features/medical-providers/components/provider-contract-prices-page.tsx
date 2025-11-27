'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Loader2,
    Plus,
    Pencil,
    Trash2,
    Search,
    DollarSign,
    Filter,
    Calendar,
    ArrowLeft,
    Calculator,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PricingPreviewTab } from './pricing-preview-tab'
import {
    ProviderContractPrice,
    ProviderContractPricePayload,
    ProviderContractPriceSearchFilters,
    ProviderContractPriceUpdatePayload,
    PricingMethod,
} from '@/types/provider-contract-price'
import {
    createProviderContractPrice,
    deleteProviderContractPrice,
    fetchProviderContractPrices,
    fetchProviderContractPrice,
    updateProviderContractPrice,
} from '@/lib/api/provider-contract-prices'
import { searchProcedures } from '@/lib/api/procedures'
import { fetchProcedureCategories } from '@/lib/api/procedures'
import { getSpecialties } from '@/features/specialties/services/specialty-service'
import { fetchPointRates } from '@/lib/api/pricing'
import { ProcedureSummary } from '@/types'
import { ProcedureCategoryRecord } from '@/types'
import { Specialty } from '@/types/specialty'
import { PointRateRecord } from '@/types/pricing'
import { cn, formatCurrency } from '@/lib/utils'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

const PRICING_METHODS: PricingMethod[] = ['FIXED', 'POINTS', 'RANGE', 'PERCENTAGE']

const EMPTY_PAYLOAD: ProviderContractPricePayload = {
    providerId: 0,
    procedureId: 0,
    price: 0,
    pricingMethod: 'FIXED',
    pointValue: null,
    minPrice: null,
    maxPrice: null,
    copayPercent: null,
    copayFixed: null,
    deductible: 0,
    priceListId: null,
    effectiveFrom: undefined,
    effectiveTo: null,
    notes: '',
}

interface ProviderContractPricesPageProps {
    contractId?: number
    providerId?: number
}

export function ProviderContractPricesPage({ contractId, providerId: propProviderId }: ProviderContractPricesPageProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const urlProviderId = searchParams.get('providerId')
    const urlContractId = searchParams.get('contractId')
    
    const effectiveProviderId = propProviderId || (urlProviderId ? Number(urlProviderId) : undefined)
    const effectiveContractId = contractId || (urlContractId ? Number(urlContractId) : undefined)

    // Also try to get providerId from contract if we have contractId but not providerId
    // This would require fetching the contract, but for now we'll rely on the URL param

    const [prices, setPrices] = useState<ProviderContractPrice[]>([])
    const [procedures, setProcedures] = useState<ProcedureSummary[]>([])
    const [categories, setCategories] = useState<ProcedureCategoryRecord[]>([])
    const [specialties, setSpecialties] = useState<Specialty[]>([])
    const [pointRates, setPointRates] = useState<PointRateRecord[]>([])
    const [loadingProcedures, setLoadingProcedures] = useState(false)
    const [loadingPointRates, setLoadingPointRates] = useState(false)
    const [selectedPointRateId, setSelectedPointRateId] = useState<number | null>(null)
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1])
    const [totalPages, setTotalPages] = useState(1)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [procedureSearchTerm, setProcedureSearchTerm] = useState('')
    const [procedureCategoryFilter, setProcedureCategoryFilter] = useState<number | null>(null)
    const [pricingMethodFilter, setPricingMethodFilter] = useState<PricingMethod | 'ALL'>('ALL')
    const [specialtyFilter, setSpecialtyFilter] = useState<number | null>(null)
    const [effectiveDateFilter, setEffectiveDateFilter] = useState<string>('')

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingPrice, setEditingPrice] = useState<ProviderContractPrice | null>(null)
    const [formData, setFormData] = useState<ProviderContractPricePayload>(EMPTY_PAYLOAD)
    const [formError, setFormError] = useState<string | null>(null)
    const [loadingEditPrice, setLoadingEditPrice] = useState(false)

    const [deleteTarget, setDeleteTarget] = useState<ProviderContractPrice | null>(null)

    // Load procedures, categories, and specialties
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingProcedures(true)
                const [categoriesResponse, specialtiesResponse] = await Promise.all([
                    fetchProcedureCategories({ page: 0, size: 1000 }),
                    getSpecialties(),
                ])
                setCategories(categoriesResponse.content || [])
                setSpecialties(specialtiesResponse)
            } catch (err) {
                console.error('Failed to load data', err)
            } finally {
                setLoadingProcedures(false)
            }
        }
        void loadData()
    }, [])

    // Search procedures when search term changes
    useEffect(() => {
        if (!procedureSearchTerm.trim() || procedureSearchTerm.length < 2) {
            setProcedures([])
            return
        }

        const searchTimeout = setTimeout(async () => {
            try {
                const response = await searchProcedures({
                    filters: { keyword: procedureSearchTerm },
                    page: 0,
                    size: 50,
                })
                setProcedures(response.content || [])
            } catch (err) {
                console.error('Failed to search procedures', err)
                setProcedures([])
            }
        }, 300)

        return () => clearTimeout(searchTimeout)
    }, [procedureSearchTerm])

    // Load point rates when pricing method is POINTS
    useEffect(() => {
        if (formData.pricingMethod !== 'POINTS' || !isFormOpen) {
            setPointRates([])
            setSelectedPointRateId(null)
            return
        }

        const loadPointRates = async () => {
            setLoadingPointRates(true)
            try {
                const response = await fetchPointRates({
                    page: 0,
                    size: 100,
                })
                setPointRates(response.content || [])
            } catch (err) {
                console.error('Failed to load point rates', err)
                setPointRates([])
            } finally {
                setLoadingPointRates(false)
            }
        }

        void loadPointRates()
    }, [formData.pricingMethod, isFormOpen])

    // Calculate price when point rate or point value changes (for POINTS method)
    useEffect(() => {
        if (formData.pricingMethod === 'POINTS' && selectedPointRateId && formData.pointValue !== null && formData.pointValue !== undefined) {
            const selectedRate = pointRates.find((rate) => rate.id === selectedPointRateId)
            if (selectedRate && formData.pointValue !== null && formData.pointValue !== undefined) {
                const calculatedPrice = selectedRate.pointPrice * formData.pointValue
                setFormData((prev) => ({ ...prev, price: calculatedPrice }))
            }
        }
    }, [selectedPointRateId, formData.pointValue, formData.pricingMethod, pointRates])

    const loadPrices = useCallback(async () => {
        if (!effectiveProviderId) {
            setPrices([])
            return
        }

        setLoading(true)
        setError(null)
        try {
            const filters: ProviderContractPriceSearchFilters = {
                providerId: effectiveProviderId,
                page,
                size: pageSize,
            }
            if (effectiveContractId) {
                filters.contractId = effectiveContractId
            }
            if (procedureCategoryFilter) {
                filters.procedureCategoryId = procedureCategoryFilter
            }
            if (pricingMethodFilter !== 'ALL') {
                filters.pricingMethod = pricingMethodFilter
            }
            if (specialtyFilter) {
                filters.specialtyId = specialtyFilter
            }
            if (effectiveDateFilter) {
                filters.effectiveDate = effectiveDateFilter
            }

            const response = await fetchProviderContractPrices(filters)
            setPrices(response.content)
            setTotalPages(Math.max(response.totalPages || 1, 1))
            setTotalElements(response.totalElements || 0)
        } catch (requestError) {
            console.error(requestError)
            setError(requestError instanceof Error ? requestError.message : 'Unable to load provider contract prices')
            setPrices([])
        } finally {
            setLoading(false)
        }
    }, [effectiveProviderId, effectiveContractId, page, pageSize, procedureCategoryFilter, pricingMethodFilter, specialtyFilter, effectiveDateFilter])

    useEffect(() => {
        void loadPrices()
    }, [loadPrices])

    const handleCreate = () => {
        if (!effectiveProviderId) {
            setError('Provider ID is required')
            return
        }
        setEditingPrice(null)
        setSelectedPointRateId(null)
        setFormData({
            ...EMPTY_PAYLOAD,
            providerId: effectiveProviderId,
        })
        setFormError(null)
        setIsFormOpen(true)
    }

    const handleEdit = async (price: ProviderContractPrice) => {
        setLoadingEditPrice(true)
        setFormError(null)
        try {
            const freshPrice = await fetchProviderContractPrice(price.id)
            setEditingPrice(freshPrice)
            
            // Reset point rate selection
            setSelectedPointRateId(null)
            
            // Try to fetch procedure details to show in search
            if (freshPrice.procedureId) {
                try {
                    const procResponse = await searchProcedures({
                        filters: { keyword: String(freshPrice.procedureId) },
                        page: 0,
                        size: 1,
                    })
                    const proc = procResponse.content?.find((p) => p.id === freshPrice.procedureId)
                    if (proc) {
                        setProcedureSearchTerm(proc.nameEn)
                        setProcedures([proc])
                    } else {
                        setProcedureSearchTerm(freshPrice.procedureName || `Procedure ${freshPrice.procedureId}`)
                    }
                } catch (err) {
                    console.error('Failed to fetch procedure details', err)
                    setProcedureSearchTerm(freshPrice.procedureName || `Procedure ${freshPrice.procedureId}`)
                }
            }
            
            const effectiveFromDate = Array.isArray(freshPrice.effectiveFrom)
                ? `${freshPrice.effectiveFrom[0]}-${String(freshPrice.effectiveFrom[1]).padStart(2, '0')}-${String(freshPrice.effectiveFrom[2]).padStart(2, '0')}`
                : typeof freshPrice.effectiveFrom === 'string' 
                    ? freshPrice.effectiveFrom.slice(0, 10)
                    : ''
            
            const effectiveToDate = Array.isArray(freshPrice.effectiveTo)
                ? `${freshPrice.effectiveTo[0]}-${String(freshPrice.effectiveTo[1]).padStart(2, '0')}-${String(freshPrice.effectiveTo[2]).padStart(2, '0')}`
                : typeof freshPrice.effectiveTo === 'string'
                    ? freshPrice.effectiveTo.slice(0, 10)
                    : null

            setFormData({
                providerId: freshPrice.providerId,
                procedureId: freshPrice.procedureId,
                price: freshPrice.price,
                pricingMethod: freshPrice.pricingMethod,
                pointValue: freshPrice.pointValue,
                minPrice: freshPrice.minPrice,
                maxPrice: freshPrice.maxPrice,
                copayPercent: freshPrice.copayPercent,
                copayFixed: freshPrice.copayFixed,
                deductible: freshPrice.deductible,
                priceListId: freshPrice.priceListId,
                effectiveFrom: effectiveFromDate || undefined,
                effectiveTo: effectiveToDate,
                notes: freshPrice.notes || '',
            })
            setIsFormOpen(true)
        } catch (editError) {
            console.error(editError)
            setFormError(editError instanceof Error ? editError.message : 'Unable to load price data for editing')
        } finally {
            setLoadingEditPrice(false)
        }
    }

    const handleSubmit = async () => {
        if (!formData.procedureId || !formData.providerId) {
            setFormError('Procedure and Provider are required')
            return
        }
        
        // Validate POINTS pricing method requirements
        if (formData.pricingMethod === 'POINTS') {
            if (!selectedPointRateId) {
                setFormError('Point Rate is required for POINTS pricing method')
                return
            }
            if (formData.pointValue === null || formData.pointValue === undefined || formData.pointValue <= 0) {
                setFormError('Point Value must be greater than 0 for POINTS pricing method')
                return
            }
            if (formData.price <= 0) {
                setFormError('Price must be calculated. Please select a point rate and enter point value.')
                return
            }
        }
        
        if (formData.price < 0) {
            setFormError('Price must be non-negative')
            return
        }

        setSaving(true)
        setFormError(null)

        try {
            if (editingPrice) {
                const updatePayload: ProviderContractPriceUpdatePayload = {
                    price: formData.price,
                    pricingMethod: formData.pricingMethod,
                    pointValue: formData.pointValue || null,
                    minPrice: formData.minPrice || null,
                    maxPrice: formData.maxPrice || null,
                    copayPercent: formData.copayPercent || null,
                    copayFixed: formData.copayFixed || null,
                    deductible: formData.deductible || 0,
                    priceListId: formData.priceListId || null,
                    effectiveFrom: formData.effectiveFrom,
                    effectiveTo: formData.effectiveTo,
                    notes: formData.notes || undefined,
                }
                await updateProviderContractPrice(editingPrice.id, updatePayload)
            } else {
                await createProviderContractPrice(formData)
            }
            setIsFormOpen(false)
            setSelectedPointRateId(null)
            await loadPrices()
        } catch (submitError) {
            console.error(submitError)
            setFormError(submitError instanceof Error ? submitError.message : 'Unable to save provider contract price')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeletingId(deleteTarget.id)
        try {
            await deleteProviderContractPrice(deleteTarget.id)
            setDeleteTarget(null)
            await loadPrices()
        } catch (deleteError) {
            console.error(deleteError)
            setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete provider contract price')
        } finally {
            setDeletingId(null)
        }
    }

    const handlePageChange = (newPage: number) => {
        setPage(newPage)
    }

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize)
        setPage(0)
    }

    const formatDateArray = (dateArray: number[] | string | null): string => {
        if (!dateArray) return '-'
        if (Array.isArray(dateArray) && dateArray.length >= 3) {
            const [year, month, day] = dateArray
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        }
        if (typeof dateArray === 'string') {
            return dateArray.slice(0, 10)
        }
        return '-'
    }

    const actionInProgress = loading || saving || deletingId !== null

    if (!effectiveProviderId) {
        return (
            <div className="p-6 space-y-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    Provider ID is required to view contract prices.
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => router.push('/provider-contracts')}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <div className="rounded-lg bg-tpa-primary/10 p-3 text-tpa-primary">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Provider Contract Prices</h1>
                        <p className="text-sm text-gray-600">Manage pricing for procedures under this contract.</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="prices" className="bg-white rounded-lg shadow border border-gray-100">
                <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="prices" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Contract Prices
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Pricing Preview
                    </TabsTrigger>
                </TabsList>
                <div className="p-6">
                    <TabsContent value="prices" className="mt-0 space-y-4">
                        <div className="flex justify-end">
                            <Button className="bg-tpa-primary hover:bg-tpa-accent" onClick={handleCreate} disabled={actionInProgress}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Price
                            </Button>
                        </div>
                        <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <div className="min-w-[200px]">
                            <SearchableSelect
                                options={categories.map((cat) => ({
                                    id: cat.id,
                                    label: cat.nameEn,
                                    subLabel: cat.code,
                                }))}
                                value={procedureCategoryFilter || undefined}
                                onValueChange={(value) => {
                                    setProcedureCategoryFilter(value ? Number(value) : null)
                                    setPage(0)
                                }}
                                placeholder="All Categories"
                                searchPlaceholder="Search categories..."
                                emptyMessage="No categories found"
                            />
                        </div>
                        <Select
                            value={pricingMethodFilter}
                            onValueChange={(value) => {
                                setPricingMethodFilter(value as PricingMethod | 'ALL')
                                setPage(0)
                            }}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Pricing Method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Methods</SelectItem>
                                {PRICING_METHODS.map((method) => (
                                    <SelectItem key={method} value={method}>
                                        {method}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="min-w-[200px]">
                            <SearchableSelect
                                options={specialties.map((spec) => ({
                                    id: spec.id,
                                    label: spec.nameEn,
                                    subLabel: spec.code,
                                }))}
                                value={specialtyFilter || undefined}
                                onValueChange={(value) => {
                                    setSpecialtyFilter(value ? Number(value) : null)
                                    setPage(0)
                                }}
                                placeholder="All Specialties"
                                searchPlaceholder="Search specialties..."
                                emptyMessage="No specialties found"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <Input
                                type="date"
                                placeholder="Effective Date"
                                value={effectiveDateFilter}
                                onChange={(e) => {
                                    setEffectiveDateFilter(e.target.value)
                                    setPage(0)
                                }}
                                className="w-40"
                            />
                        </div>
                        <Button variant="outline" onClick={() => {
                            setPage(0)
                            void loadPrices()
                        }} disabled={loading}>
                            <Search className="h-4 w-4 mr-2" />
                            Search
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-24">Procedure Code</TableHead>
                                <TableHead>Procedure Name</TableHead>
                                <TableHead className="w-32">Pricing Method</TableHead>
                                <TableHead className="w-24">Price</TableHead>
                                <TableHead className="w-24">Point Value</TableHead>
                                <TableHead className="w-24">Min Price</TableHead>
                                <TableHead className="w-24">Max Price</TableHead>
                                <TableHead className="w-24">Copay %</TableHead>
                                <TableHead className="w-24">Copay Fixed</TableHead>
                                <TableHead className="w-24">Deductible</TableHead>
                                <TableHead>Effective From</TableHead>
                                <TableHead>Effective To</TableHead>
                                <TableHead className="w-32 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={13} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                    </TableCell>
                                </TableRow>
                            ) : prices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                                        No prices found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                prices.map((price) => {
                                    const procedureCode = price.procedure?.code || price.procedureCode || `PROC-${price.procedureId}`
                                    const procedureNameEn = price.procedure?.nameEn || price.procedureName || `Procedure ${price.procedureId}`
                                    const procedureNameAr = price.procedure?.nameAr || price.procedureNameAr
                                    
                                    return (
                                    <TableRow key={price.id}>
                                        <TableCell className="font-mono text-sm">
                                            {procedureCode}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="space-y-1">
                                                <div className="text-gray-900">{procedureNameEn}</div>
                                                {procedureNameAr && (
                                                    <div className="text-sm text-gray-600" dir="rtl">
                                                        {procedureNameAr}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                                {price.pricingMethod}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-medium">{formatCurrency(price.price)}</TableCell>
                                        <TableCell className="text-sm">
                                            {price.pointValue !== null ? price.pointValue : '-'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {price.minPrice !== null ? formatCurrency(price.minPrice) : '-'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {price.maxPrice !== null ? formatCurrency(price.maxPrice) : '-'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {price.copayPercent !== null ? `${price.copayPercent}%` : '-'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {price.copayFixed !== null ? formatCurrency(price.copayFixed) : '-'}
                                        </TableCell>
                                        <TableCell className="text-sm">{formatCurrency(price.deductible)}</TableCell>
                                        <TableCell className="text-sm">{formatDateArray(price.effectiveFrom)}</TableCell>
                                        <TableCell className="text-sm">{formatDateArray(price.effectiveTo)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(price)}
                                                    disabled={actionInProgress || loadingEditPrice}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteTarget(price)}
                                                    disabled={actionInProgress || deletingId === price.id}
                                                >
                                                    {deletingId === price.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    )}
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

                {totalElements > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of{' '}
                            {totalElements} prices
                        </div>
                        <div className="flex items-center gap-2">
                            <Select
                                value={String(pageSize)}
                                onValueChange={(value) => handlePageSizeChange(Number(value))}
                            >
                                <SelectTrigger className="w-20">
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
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(0)}
                                    disabled={page === 0 || loading}
                                >
                                    First
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 0 || loading}
                                >
                                    Previous
                                </Button>
                                <span className="px-3 py-1 text-sm">
                                    Page {page + 1} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= totalPages - 1 || loading}
                                >
                                    Next
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(totalPages - 1)}
                                    disabled={page >= totalPages - 1 || loading}
                                >
                                    Last
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                        </div>
                    </TabsContent>
                    <TabsContent value="preview" className="mt-0">
                        <PricingPreviewTab providerId={effectiveProviderId} contractId={effectiveContractId} />
                    </TabsContent>
                </div>
            </Tabs>

            {/* Create/Edit Dialog */}
            <Dialog 
                open={isFormOpen} 
                onOpenChange={(open) => {
                    setIsFormOpen(open)
                    if (!open) {
                        // Reset form state when dialog closes
                        setSelectedPointRateId(null)
                        setProcedureSearchTerm('')
                        setFormError(null)
                    }
                }}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingPrice ? 'Edit Provider Contract Price' : 'Create New Provider Contract Price'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingPrice
                                ? 'Update the price information below.'
                                : 'Fill in the details to create a new price entry.'}
                        </DialogDescription>
                    </DialogHeader>
                    {formError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {formError}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="procedureId">Procedure *</Label>
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Search procedures by code or name..."
                                        value={procedureSearchTerm}
                                        onChange={(e) => setProcedureSearchTerm(e.target.value)}
                                        disabled={saving || !!editingPrice}
                                    />
                                    {procedureSearchTerm && procedures.length > 0 && (
                                        <div className="border rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg z-10">
                                            {procedures.slice(0, 20).map((proc) => {
                                                const categoryNames = proc.categories?.map(cat => cat.nameEn).filter(Boolean).join(', ') || 'No Category'
                                                return (
                                                    <div
                                                        key={proc.id}
                                                        className={cn(
                                                            'p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 transition-colors',
                                                            formData.procedureId === proc.id && 'bg-blue-50 border-blue-200',
                                                        )}
                                                        onClick={() => {
                                                            if (!editingPrice) {
                                                                setFormData({ ...formData, procedureId: proc.id })
                                                                setProcedureSearchTerm(proc.nameEn)
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-gray-900 truncate">{proc.nameEn}</div>
                                                                {proc.nameAr && (
                                                                    <div className="text-xs text-gray-600 mt-0.5" dir="rtl">{proc.nameAr}</div>
                                                                )}
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-xs font-mono text-gray-500">{proc.code}</span>
                                                                    {proc.systemCode && (
                                                                        <>
                                                                            <span className="text-xs text-gray-400">•</span>
                                                                            <span className="text-xs text-gray-500">{proc.systemCode}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="mt-1.5">
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                                                        {categoryNames}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {formData.procedureId === proc.id && (
                                                                <div className="flex-shrink-0">
                                                                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            {procedures.length > 20 && (
                                                <div className="p-2 text-xs text-gray-500 text-center bg-gray-50">
                                                    Showing first 20 results. Refine your search for more.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {formData.procedureId > 0 && (
                                    <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                                        Selected: {procedures.find((p) => p.id === formData.procedureId)?.nameEn || `Procedure ${formData.procedureId}`}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pricingMethod">Pricing Method *</Label>
                                <Select
                                    value={formData.pricingMethod}
                                    onValueChange={(value) => {
                                        const newMethod = value as PricingMethod
                                        setFormData({ 
                                            ...formData, 
                                            pricingMethod: newMethod,
                                            // Reset point-related fields when switching away from POINTS
                                            ...(newMethod !== 'POINTS' ? { pointValue: null, price: 0 } : {}),
                                        })
                                        if (newMethod !== 'POINTS') {
                                            setSelectedPointRateId(null)
                                        }
                                    }}
                                    disabled={saving}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRICING_METHODS.map((method) => (
                                            <SelectItem key={method} value={method}>
                                                {method}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Point Rate Selection (only for POINTS method) */}
                        {formData.pricingMethod === 'POINTS' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                    <Label className="text-sm font-semibold text-blue-900">
                                        Point-Based Pricing Configuration
                                    </Label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="pointRate">Point Rate *</Label>
                                        {loadingPointRates ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading point rates...
                                            </div>
                                        ) : (
                                            <SearchableSelect
                                                options={pointRates.map((rate) => ({
                                                    id: rate.id,
                                                    label: rate.insuranceDegree
                                                        ? `${rate.insuranceDegree.nameEn} - ${formatCurrency(rate.pointPrice)}/point`
                                                        : `Rate: ${formatCurrency(rate.pointPrice)}/point`,
                                                    subLabel: rate.insuranceDegree
                                                        ? `ID: ${rate.insuranceDegree.code}`
                                                        : `ID: ${rate.id}`,
                                                }))}
                                                value={selectedPointRateId || undefined}
                                                onValueChange={(value) => {
                                                    const rateId = value ? Number(value) : null
                                                    setSelectedPointRateId(rateId)
                                                    if (rateId && formData.pointValue !== null && formData.pointValue !== undefined) {
                                                        const selectedRate = pointRates.find((r) => r.id === rateId)
                                                        if (selectedRate) {
                                                            const calculatedPrice = selectedRate.pointPrice * formData.pointValue
                                                            setFormData((prev) => ({ ...prev, price: calculatedPrice }))
                                                        }
                                                    }
                                                }}
                                                placeholder="Select point rate..."
                                                searchPlaceholder="Search point rates..."
                                                emptyMessage="No point rates found"
                                            />
                                        )}
                                        {selectedPointRateId && (
                                            <div className="text-xs text-gray-600 mt-1">
                                                {(() => {
                                                    const rate = pointRates.find((r) => r.id === selectedPointRateId)
                                                    return rate
                                                        ? `Rate: ${formatCurrency(rate.pointPrice)} per point`
                                                        : ''
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pointValue">Point Value *</Label>
                                        <Input
                                            id="pointValue"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.pointValue || ''}
                                            onChange={(e) => {
                                                const pointValue = e.target.value ? Number(e.target.value) : null
                                                setFormData({
                                                    ...formData,
                                                    pointValue,
                                                })
                                                // Calculate price if point rate is selected
                                                if (selectedPointRateId && pointValue !== null) {
                                                    const selectedRate = pointRates.find((r) => r.id === selectedPointRateId)
                                                    if (selectedRate) {
                                                        const calculatedPrice = selectedRate.pointPrice * pointValue
                                                        setFormData((prev) => ({ ...prev, price: calculatedPrice }))
                                                    }
                                                }
                                            }}
                                            placeholder="Enter point value"
                                            disabled={saving}
                                        />
                                        <div className="text-xs text-gray-500">
                                            Enter the number of points for this procedure
                                        </div>
                                    </div>
                                </div>
                                {selectedPointRateId && formData.pointValue !== null && formData.pointValue !== undefined && formData.pointValue > 0 && (
                                    <div className="bg-white border border-blue-300 rounded p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Calculated Price:</span>
                                            <span className="text-lg font-bold text-blue-700">
                                                {formatCurrency(formData.price)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {(() => {
                                                const rate = pointRates.find((r) => r.id === selectedPointRateId)
                                                return rate
                                                    ? `${formatCurrency(rate.pointPrice)} × ${formData.pointValue} points = ${formatCurrency(formData.price)}`
                                                    : ''
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">
                                    Price {formData.pricingMethod === 'POINTS' ? '(Auto-calculated)' : '*'}
                                </Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    value={formData.price || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, price: Number(e.target.value) || 0 })
                                    }
                                    placeholder="0.00"
                                    disabled={saving || formData.pricingMethod === 'POINTS'}
                                    className={formData.pricingMethod === 'POINTS' ? 'bg-gray-100 cursor-not-allowed' : ''}
                                />
                                {formData.pricingMethod === 'POINTS' && (
                                    <div className="text-xs text-gray-500">
                                        Price is automatically calculated from point rate × point value
                                    </div>
                                )}
                            </div>
                            {formData.pricingMethod !== 'POINTS' && (
                                <div className="space-y-2">
                                    <Label htmlFor="pointValue">Point Value</Label>
                                    <Input
                                        id="pointValue"
                                        type="number"
                                        step="0.01"
                                        value={formData.pointValue || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                pointValue: e.target.value ? Number(e.target.value) : null,
                                            })
                                        }
                                        placeholder="Optional"
                                        disabled={saving}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="deductible">Deductible</Label>
                                <Input
                                    id="deductible"
                                    type="number"
                                    step="0.01"
                                    value={formData.deductible || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, deductible: Number(e.target.value) || 0 })
                                    }
                                    placeholder="0.00"
                                    disabled={saving}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="minPrice">Min Price</Label>
                                <Input
                                    id="minPrice"
                                    type="number"
                                    step="0.01"
                                    value={formData.minPrice || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            minPrice: e.target.value ? Number(e.target.value) : null,
                                        })
                                    }
                                    placeholder="Optional"
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxPrice">Max Price</Label>
                                <Input
                                    id="maxPrice"
                                    type="number"
                                    step="0.01"
                                    value={formData.maxPrice || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            maxPrice: e.target.value ? Number(e.target.value) : null,
                                        })
                                    }
                                    placeholder="Optional"
                                    disabled={saving}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="copayPercent">Copay Percent (%)</Label>
                                <Input
                                    id="copayPercent"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={formData.copayPercent || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            copayPercent: e.target.value ? Number(e.target.value) : null,
                                        })
                                    }
                                    placeholder="Optional"
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="copayFixed">Copay Fixed</Label>
                                <Input
                                    id="copayFixed"
                                    type="number"
                                    step="0.01"
                                    value={formData.copayFixed || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            copayFixed: e.target.value ? Number(e.target.value) : null,
                                        })
                                    }
                                    placeholder="Optional"
                                    disabled={saving}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="effectiveFrom">Effective From</Label>
                                <Input
                                    id="effectiveFrom"
                                    type="date"
                                    value={formData.effectiveFrom || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, effectiveFrom: e.target.value || undefined })
                                    }
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="effectiveTo">Effective To</Label>
                                <Input
                                    id="effectiveTo"
                                    type="date"
                                    value={formData.effectiveTo || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, effectiveTo: e.target.value || null })
                                    }
                                    disabled={saving}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional notes..."
                                rows={3}
                                disabled={saving}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={saving || loadingEditPrice}>
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Provider Contract Price</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this price entry? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deletingId !== null}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deletingId !== null}>
                            {deletingId !== null ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

