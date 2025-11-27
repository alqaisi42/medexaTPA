'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Loader2,
    Plus,
    Pencil,
    Trash2,
    Search,
    FileText,
    Eye,
    Filter,
    Calendar,
    BarChart3,
    ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProviderDashboardTab } from './provider-dashboard-tab'
import {
    ProviderContract,
    ProviderContractPayload,
    ProviderContractSearchFilters,
    ProviderContractUpdatePayload,
} from '@/types/provider-contract'
import {
    createProviderContract,
    deleteProviderContract,
    fetchProviderContracts,
    fetchProviderContract,
    updateProviderContract,
} from '@/lib/api/provider-contracts'
import { listProviders } from '../services/provider-service'
import { ProviderRecord } from '@/types/provider'
import { cn } from '@/lib/utils'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

const EMPTY_PAYLOAD: ProviderContractPayload = {
    contractCode: '',
    nameEn: '',
    nameAr: null,
    providerId: 0,
    appliesToNetwork: false,
    // Extended fields with defaults
    settlementStrategy: 'PAYER_TO_PROVIDER',
    currency: 'JOD',
    isCashlessAllowed: true,
    isReimbursementAllowed: true,
}

// Form state type (nameAr as string for input, includes all financial fields)
type FormDataState = ProviderContractPayload & { nameAr: string }

export function ProviderContractsPage() {
    const router = useRouter()
    const [contracts, setContracts] = useState<ProviderContract[]>([])
    const [providers, setProviders] = useState<ProviderRecord[]>([])
    const [loadingProviders, setLoadingProviders] = useState(false)
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1])
    const [totalPages, setTotalPages] = useState(1)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [searchTerm, setSearchTerm] = useState('')
    const [providerFilter, setProviderFilter] = useState<number | null>(null)
    const [isActiveFilter, setIsActiveFilter] = useState<'ALL' | boolean>('ALL')
    const [appliesToNetworkFilter, setAppliesToNetworkFilter] = useState<'ALL' | boolean>('ALL')
    const [effectiveFromStart, setEffectiveFromStart] = useState<string>('')
    const [effectiveFromEnd, setEffectiveFromEnd] = useState<string>('')
    const [sortBy, setSortBy] = useState<'CREATED_AT' | 'UPDATED_AT' | 'CONTRACT_CODE' | 'NAME_EN' | 'PROVIDER'>('CREATED_AT')
    const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC')

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingContract, setEditingContract] = useState<ProviderContract | null>(null)
    const [formData, setFormData] = useState<FormDataState>({
        ...EMPTY_PAYLOAD,
        nameAr: '',
    })
    const [formError, setFormError] = useState<string | null>(null)
    const [loadingEditContract, setLoadingEditContract] = useState(false)

    const [deleteTarget, setDeleteTarget] = useState<ProviderContract | null>(null)

    // Load providers for selection
    useEffect(() => {
        const loadProviders = async () => {
            try {
                setLoadingProviders(true)
                const response = await listProviders({ page: 0, size: 1000 })
                setProviders(response.content)
            } catch (err) {
                console.error('Failed to load providers', err)
            } finally {
                setLoadingProviders(false)
            }
        }
        void loadProviders()
    }, [])

    const loadContracts = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const filters: ProviderContractSearchFilters = {
                page,
                size: pageSize,
                sortBy,
                sortDirection,
            }
            if (searchTerm.trim()) {
                filters.query = searchTerm.trim()
            }
            if (providerFilter) {
                filters.providerId = providerFilter
            }
            if (isActiveFilter !== 'ALL') {
                filters.isActive = isActiveFilter
            }
            if (appliesToNetworkFilter !== 'ALL') {
                filters.appliesToNetwork = appliesToNetworkFilter
            }
            if (effectiveFromStart) {
                filters.effectiveFromStart = new Date(effectiveFromStart + 'T00:00:00Z').toISOString()
            }
            if (effectiveFromEnd) {
                filters.effectiveFromEnd = new Date(effectiveFromEnd + 'T23:59:59Z').toISOString()
            }

            const response = await fetchProviderContracts(filters)
            setContracts(response.content)
            setTotalPages(Math.max(response.totalPages || 1, 1))
            setTotalElements(response.totalElements || 0)
        } catch (requestError) {
            console.error(requestError)
            setError(requestError instanceof Error ? requestError.message : 'Unable to load provider contracts')
            setContracts([])
        } finally {
            setLoading(false)
        }
    }, [page, pageSize, searchTerm, providerFilter, isActiveFilter, appliesToNetworkFilter, effectiveFromStart, effectiveFromEnd, sortBy, sortDirection])

    useEffect(() => {
        void loadContracts()
    }, [loadContracts])

    const handleCreate = () => {
        setEditingContract(null)
        setFormData({
            contractCode: '',
            nameEn: '',
            nameAr: '',
            providerId: 0,
            appliesToNetwork: false,
            // Financial fields (optional in create)
            tpaCommissionPercent: null,
            tpaCommissionFixed: null,
            contractDiscountPercent: null,
            contractDiscountFixed: null,
            reimbursementModel: 'FFS',
            ppdPercent: null,
            ppdDayLimit: null,
            annualCap: null,
            monthlyCap: null,
            perCaseCap: null,
            vatIncluded: false,
            vatPercent: null,
            denyPolicy: null,
            // Extended fields with defaults
            settlementStrategy: 'PAYER_TO_PROVIDER',
            deductibleOverride: null,
            copayOverride: null,
            copayType: null,
            networkTier: null,
            currency: 'JOD',
            claimSubmissionDayLimit: null,
            isCashlessAllowed: true,
            isReimbursementAllowed: true,
        })
        setFormError(null)
        setIsFormOpen(true)
    }

    const handleEdit = async (contract: ProviderContract) => {
        setLoadingEditContract(true)
        setFormError(null)
        try {
            const freshContract = await fetchProviderContract(contract.id)
            setEditingContract(freshContract)
            setFormData({
                contractCode: freshContract.contractCode,
                nameEn: freshContract.nameEn,
                nameAr: freshContract.nameAr || '',
                providerId: freshContract.providerId,
                appliesToNetwork: freshContract.appliesToNetwork,
            })
            setIsFormOpen(true)
        } catch (editError) {
            console.error(editError)
            setFormError(editError instanceof Error ? editError.message : 'Unable to load contract data for editing')
        } finally {
            setLoadingEditContract(false)
        }
    }

    const handleSubmit = async () => {
        if (!formData.contractCode.trim() || !formData.nameEn.trim() || !formData.providerId) {
            setFormError('Contract code, English name, and provider are required')
            return
        }

        setSaving(true)
        setFormError(null)

        try {
            if (editingContract) {
                const updatePayload: ProviderContractUpdatePayload = {
                    nameEn: formData.nameEn.trim(),
                    nameAr: formData.nameAr?.trim() || null,
                    isActive: editingContract.isActive,
                    appliesToNetwork: formData.appliesToNetwork,
                    effectiveFrom: editingContract.effectiveFrom 
                        ? typeof editingContract.effectiveFrom === 'string'
                            ? editingContract.effectiveFrom
                            : new Date(editingContract.effectiveFrom * 1000).toISOString()
                        : undefined,
                    effectiveTo: editingContract.effectiveTo 
                        ? typeof editingContract.effectiveTo === 'string'
                            ? editingContract.effectiveTo
                            : new Date(editingContract.effectiveTo * 1000).toISOString()
                        : null,
                }
                await updateProviderContract(editingContract.id, updatePayload)
                setIsFormOpen(false)
                await loadContracts()
            } else {
                const newContract = await createProviderContract({
                    ...formData,
                    nameAr: formData.nameAr?.trim() || null,
                })
                setIsFormOpen(false)
                // Redirect to detail page after creation
                router.push(`/provider-contracts/${newContract.id}`)
            }
        } catch (submitError) {
            console.error(submitError)
            setFormError(submitError instanceof Error ? submitError.message : 'Unable to save provider contract')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeletingId(deleteTarget.id)
        try {
            await deleteProviderContract(deleteTarget.id)
            setDeleteTarget(null)
            await loadContracts()
        } catch (deleteError) {
            console.error(deleteError)
            setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete provider contract')
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

    const handleViewPrices = (contract: ProviderContract) => {
        router.push(`/provider-contracts/${contract.id}/prices?providerId=${contract.providerId}`)
    }

    const handleViewDetail = (contract: ProviderContract) => {
        router.push(`/provider-contracts/${contract.id}`)
    }

    const actionInProgress = loading || saving || deletingId !== null

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-tpa-primary/10 p-3 text-tpa-primary">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Provider Contracts</h1>
                        <p className="text-sm text-gray-600">Manage provider contracts and their configurations.</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="contracts" className="bg-white rounded-lg shadow border border-gray-100">
                <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="contracts" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Contracts
                    </TabsTrigger>
                </TabsList>
                <div className="p-6">
                    <TabsContent value="dashboard" className="mt-0">
                        <ProviderDashboardTab providerId={providerFilter || undefined} />
                    </TabsContent>
                    <TabsContent value="contracts" className="mt-0 space-y-4">
                        <div className="flex justify-end">
                            <Button className="bg-tpa-primary hover:bg-tpa-accent" onClick={handleCreate} disabled={actionInProgress}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Contract
                            </Button>
                        </div>
                        <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            className="pl-9"
                            placeholder="Search by code or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setPage(0)
                                    void loadContracts()
                                }
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <div className="min-w-[250px]">
                            <SearchableSelect
                                options={providers.map((provider) => ({
                                    id: provider.id,
                                    label: provider.nameEn,
                                    subLabel: `${provider.code} - ${provider.providerType.nameEn}`,
                                }))}
                                value={providerFilter || undefined}
                                onValueChange={(value) => {
                                    setProviderFilter(value ? Number(value) : null)
                                    setPage(0)
                                }}
                                placeholder="All Providers"
                                searchPlaceholder="Search providers..."
                                emptyMessage="No providers found"
                                loading={loadingProviders}
                            />
                        </div>
                        <Select
                            value={isActiveFilter === 'ALL' ? 'ALL' : isActiveFilter ? 'ACTIVE' : 'INACTIVE'}
                            onValueChange={(value) => {
                                if (value === 'ALL') {
                                    setIsActiveFilter('ALL')
                                } else {
                                    setIsActiveFilter(value === 'ACTIVE')
                                }
                                setPage(0)
                            }}
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={appliesToNetworkFilter === 'ALL' ? 'ALL' : appliesToNetworkFilter ? 'YES' : 'NO'}
                            onValueChange={(value) => {
                                if (value === 'ALL') {
                                    setAppliesToNetworkFilter('ALL')
                                } else {
                                    setAppliesToNetworkFilter(value === 'YES')
                                }
                                setPage(0)
                            }}
                        >
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Applies to Network" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All</SelectItem>
                                <SelectItem value="YES">Yes</SelectItem>
                                <SelectItem value="NO">No</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <Input
                                type="date"
                                placeholder="From"
                                value={effectiveFromStart}
                                onChange={(e) => {
                                    setEffectiveFromStart(e.target.value)
                                    setPage(0)
                                }}
                                className="w-36"
                            />
                            <Input
                                type="date"
                                placeholder="To"
                                value={effectiveFromEnd}
                                onChange={(e) => {
                                    setEffectiveFromEnd(e.target.value)
                                    setPage(0)
                                }}
                                className="w-36"
                            />
                        </div>
                        <Select
                            value={`${sortBy}_${sortDirection}`}
                            onValueChange={(value) => {
                                const [by, dir] = value.split('_')
                                setSortBy(by as typeof sortBy)
                                setSortDirection(dir as typeof sortDirection)
                                setPage(0)
                            }}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CREATED_AT_DESC">Created Date (Newest)</SelectItem>
                                <SelectItem value="CREATED_AT_ASC">Created Date (Oldest)</SelectItem>
                                <SelectItem value="UPDATED_AT_DESC">Updated Date (Newest)</SelectItem>
                                <SelectItem value="UPDATED_AT_ASC">Updated Date (Oldest)</SelectItem>
                                <SelectItem value="CONTRACT_CODE_ASC">Contract Code (A-Z)</SelectItem>
                                <SelectItem value="CONTRACT_CODE_DESC">Contract Code (Z-A)</SelectItem>
                                <SelectItem value="NAME_EN_ASC">Name (A-Z)</SelectItem>
                                <SelectItem value="NAME_EN_DESC">Name (Z-A)</SelectItem>
                                <SelectItem value="PROVIDER_ASC">Provider (A-Z)</SelectItem>
                                <SelectItem value="PROVIDER_DESC">Provider (Z-A)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => {
                            setPage(0)
                            void loadContracts()
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
                                <TableHead className="w-32">Contract Code</TableHead>
                                <TableHead>Name (EN)</TableHead>
                                <TableHead>Name (AR)</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead className="w-24">Active</TableHead>
                                <TableHead className="w-32">Applies to Network</TableHead>
                                <TableHead>Effective From</TableHead>
                                <TableHead>Effective To</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="w-40 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                    </TableCell>
                                </TableRow>
                            ) : contracts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                                        No contracts found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                contracts.map((contract) => (
                                    <TableRow 
                                        key={contract.id}
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => handleViewDetail(contract)}
                                    >
                                        <TableCell className="font-mono text-sm">{contract.contractCode}</TableCell>
                                        <TableCell className="font-medium">{contract.nameEn}</TableCell>
                                        <TableCell>{contract.nameAr || '-'}</TableCell>
                                        <TableCell className="text-sm text-gray-600">{contract.providerName || '-'}</TableCell>
                                        <TableCell>
                                            <span
                                                className={cn(
                                                    'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                                                    contract.isActive
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700',
                                                )}
                                            >
                                                {contract.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={cn(
                                                    'inline-flex px-2 py-1 rounded text-xs font-medium',
                                                    contract.appliesToNetwork
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-gray-100 text-gray-700',
                                                )}
                                            >
                                                {contract.appliesToNetwork ? 'Yes' : 'No'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {contract.effectiveFrom
                                                ? typeof contract.effectiveFrom === 'string'
                                                    ? new Date(contract.effectiveFrom).toLocaleDateString()
                                                    : new Date(contract.effectiveFrom * 1000).toLocaleDateString()
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {contract.effectiveTo
                                                ? typeof contract.effectiveTo === 'string'
                                                    ? new Date(contract.effectiveTo).toLocaleDateString()
                                                    : new Date(contract.effectiveTo * 1000).toLocaleDateString()
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {contract.createdAt
                                                ? typeof contract.createdAt === 'string'
                                                    ? new Date(contract.createdAt).toLocaleDateString()
                                                    : new Date(contract.createdAt * 1000).toLocaleDateString()
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewPrices(contract)}
                                                    disabled={actionInProgress}
                                                    title="View Prices"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(contract)}
                                                    disabled={actionInProgress || loadingEditContract}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteTarget(contract)}
                                                    disabled={actionInProgress || deletingId === contract.id}
                                                >
                                                    {deletingId === contract.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {totalElements > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of{' '}
                            {totalElements} contracts
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
                </div>
            </Tabs>

            {/* Create/Edit Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingContract ? 'Edit Provider Contract' : 'Create New Provider Contract'}
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div>
                                {editingContract ? (
                                    <p>Update the contract information below. For financial terms, visit the contract detail page by clicking on the contract row or the View Details button.</p>
                                ) : (
                                    <>
                                        <p className="mb-2">Fill in the basic details to create a new provider contract. After creation, you will be redirected to the <strong>Contract Detail Page</strong> where you can configure:</p>
                                        <ul className="list-disc list-inside text-sm space-y-1">
                                            <li>Financial Terms (Commission, Discounts, Caps, VAT)</li>
                                            <li>Contract Prices (Procedure pricing)</li>
                                            <li>Deny Policies (JSON configuration)</li>
                                        </ul>
                                    </>
                                )}
                            </div>
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
                                <Label htmlFor="contractCode">Contract Code *</Label>
                                <Input
                                    id="contractCode"
                                    value={formData.contractCode}
                                    onChange={(e) => setFormData({ ...formData, contractCode: e.target.value })}
                                    placeholder="CNT_2025_001"
                                    disabled={!!editingContract || saving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="providerId">Provider *</Label>
                                <SearchableSelect
                                    options={providers.map((provider) => ({
                                        id: provider.id,
                                        label: provider.nameEn,
                                        subLabel: `${provider.code} - ${provider.providerType.nameEn}`,
                                    }))}
                                    value={formData.providerId || undefined}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, providerId: value ? Number(value) : 0 })
                                    }
                                    placeholder="Select a provider..."
                                    searchPlaceholder="Search providers..."
                                    emptyMessage="No providers found"
                                    disabled={saving || !!editingContract}
                                    loading={loadingProviders}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nameEn">Name (English) *</Label>
                                <Input
                                    id="nameEn"
                                    value={formData.nameEn}
                                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                    placeholder="Jordan Hospital Contract"
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nameAr">Name (Arabic)</Label>
                                <Input
                                    id="nameAr"
                                    value={formData.nameAr || ''}
                                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                    placeholder="عقد مستشفى الأردن"
                                    disabled={saving}
                                    dir="rtl"
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="appliesToNetwork"
                                checked={formData.appliesToNetwork}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, appliesToNetwork: checked })
                                }
                                disabled={saving}
                            />
                            <Label htmlFor="appliesToNetwork" className="cursor-pointer">
                                Applies to Network
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={saving || loadingEditContract}>
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
                        <DialogTitle>Delete Provider Contract</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to deactivate the contract "{deleteTarget?.nameEn}"? This action cannot be
                            undone.
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

