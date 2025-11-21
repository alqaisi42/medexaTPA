'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Building2, MapPin, RefreshCw, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ProviderBranchPayload, ProviderOwnership, ProviderPayload, ProviderRecord, ProviderStatus } from '@/types/provider'
import { ProviderType } from '@/types/provider-type'
import { useProviders } from '../hooks/use-providers'
import { useProviderBranches } from '../hooks/use-provider-branches'
import { fetchProviderTypesLookup } from '@/lib/api/lookups'
import { formatDate } from '@/lib/utils'

const statusOptions: ProviderStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED']
const ownershipOptions: ProviderOwnership[] = ['PRIVATE', 'PUBLIC', 'GOVERNMENT', 'MILITARY']
const workingDayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

type ProviderFormState = ProviderPayload & { code: string }

type BranchFormState = ProviderBranchPayload

const emptyProviderForm: ProviderFormState = {
    code: '',
    nameEn: '',
    nameAr: '',
    providerTypeId: 0,
    ownershipType: 'PRIVATE',
    status: 'ACTIVE',
    taxNumber: '',
    licenseNumber: '',
    website: '',
    notes: '',
}

const emptyBranchForm: BranchFormState = {
    providerId: undefined,
    nameEn: '',
    nameAr: '',
    country: '',
    city: '',
    district: '',
    street: '',
    phone: '',
    mobile: '',
    email: '',
    latitude: null,
    longitude: null,
    workingHours: workingDayKeys.reduce<Record<string, string>>((acc, key) => ({ ...acc, [key]: '' }), {}),
    isMain: false,
    isActive: true,
}

export function MedicalProvidersPage() {
    const { providers, pagination, isLoading, isSaving, error, filters, load, setFilters, create, update, remove, clearError } =
        useProviders(10)
    const {
        branches,
        pagination: branchesPagination,
        isLoading: branchesLoading,
        isSaving: branchesSaving,
        error: branchesError,
        load: loadBranches,
        create: createBranch,
        update: updateBranch,
        remove: removeBranch,
        clearError: clearBranchesError,
    } = useProviderBranches(5)

    const [providerTypes, setProviderTypes] = useState<ProviderType[]>([])
    const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false)
    const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false)
    const [providerForm, setProviderForm] = useState<ProviderFormState>(emptyProviderForm)
    const [branchForm, setBranchForm] = useState<BranchFormState>(emptyBranchForm)
    const [selectedProvider, setSelectedProvider] = useState<ProviderRecord | null>(null)
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)
    const [formError, setFormError] = useState<string | null>(null)
    const [branchFormError, setBranchFormError] = useState<string | null>(null)

    useEffect(() => {
        clearError()
        void load()
    }, [filters, load, clearError])

    useEffect(() => {
        fetchProviderTypesLookup()
            .then(setProviderTypes)
            .catch((err) => console.error('Failed to load provider types', err))
    }, [])

    const filteredProviders = useMemo(() => providers, [providers])

    const openCreateProvider = () => {
        setSelectedProvider(null)
        setProviderForm(emptyProviderForm)
        setFormError(null)
        setIsProviderDialogOpen(true)
    }

    const openEditProvider = (provider: ProviderRecord) => {
        setSelectedProvider(provider)
        setProviderForm({
            code: provider.code,
            nameEn: provider.nameEn,
            nameAr: provider.nameAr,
            providerTypeId: provider.providerType.id,
            ownershipType: provider.ownershipType,
            status: provider.status,
            taxNumber: provider.taxNumber ?? '',
            licenseNumber: provider.licenseNumber ?? '',
            website: provider.website ?? '',
            notes: provider.notes ?? '',
        })
        setFormError(null)
        setIsProviderDialogOpen(true)
    }

    const submitProvider = async () => {
        if (!providerForm.nameEn.trim() || !providerForm.nameAr.trim() || !providerForm.providerTypeId) {
            setFormError('English and Arabic names plus provider type are required.')
            return
        }

        try {
            if (selectedProvider) {
                await update(selectedProvider.id, providerForm)
            } else {
                if (!providerForm.code.trim()) {
                    setFormError('Provider code is required for new entries.')
                    return
                }
                await create(providerForm)
            }
            setIsProviderDialogOpen(false)
            setSelectedProvider(null)
            setProviderForm(emptyProviderForm)
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to save provider')
        }
    }

    const confirmDeleteProvider = async (provider: ProviderRecord) => {
        if (!window.confirm(`Delete provider ${provider.nameEn}?`)) return
        try {
            await remove(provider.id)
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to delete provider')
        }
    }

    const handleOpenBranches = (provider: ProviderRecord) => {
        setSelectedProvider(provider)
        setBranchForm({ ...emptyBranchForm, providerId: provider.id, isMain: branches.length === 0 })
        setBranchFormError(null)
        clearBranchesError()
        setIsBranchDialogOpen(true)
        void loadBranches(provider.id, 0)
    }

    const openEditBranch = (branchId: number) => {
        const target = branches.find((branch) => branch.id === branchId)
        if (!target) return

        setSelectedBranchId(branchId)
        setBranchForm({
            providerId: target.providerId,
            nameEn: target.nameEn,
            nameAr: target.nameAr,
            country: target.country,
            city: target.city,
            district: target.district,
            street: target.street,
            phone: target.phone,
            mobile: target.mobile,
            email: target.email,
            latitude: target.latitude,
            longitude: target.longitude,
            workingHours: { ...emptyBranchForm.workingHours, ...target.workingHours },
            isMain: target.isMain,
            isActive: target.isActive,
        })
        setBranchFormError(null)
    }

    const submitBranch = async () => {
        if (!selectedProvider) {
            setBranchFormError('Select a provider first')
            return
        }

        if (!branchForm.nameEn.trim() || !branchForm.nameAr.trim()) {
            setBranchFormError('Branch English and Arabic names are required.')
            return
        }

        try {
            if (selectedBranchId) {
                await updateBranch(selectedBranchId, branchForm)
            } else {
                await createBranch({ ...branchForm, providerId: selectedProvider.id })
            }
            setBranchForm({ ...emptyBranchForm, providerId: selectedProvider.id })
            setSelectedBranchId(null)
            setBranchFormError(null)
        } catch (err) {
            setBranchFormError(err instanceof Error ? err.message : 'Failed to save branch')
        }
    }

    const confirmDeleteBranch = async (branchId: number) => {
        if (!window.confirm('Delete this branch?')) return
        try {
            await removeBranch(branchId)
        } catch (err) {
            setBranchFormError(err instanceof Error ? err.message : 'Failed to delete branch')
        }
    }

    const updateWorkingHour = (day: string, value: string) => {
        setBranchForm((prev) => ({
            ...prev,
            workingHours: { ...prev.workingHours, [day]: value },
        }))
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold">Medical Providers</h1>
                    <p className="text-gray-600 max-w-3xl">
                        Maintain provider records, status, and licensing details. Manage branches with pre-filled edit dialogs to
                        ensure fast updates and consistent data entry.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => load(pagination?.pageNumber ?? 0)} disabled={isLoading}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    <Button onClick={openCreateProvider} className="bg-tpa-primary hover:bg-tpa-accent">
                        <Plus className="h-4 w-4 mr-2" /> New Provider
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name-filter">Search by name</Label>
                        <Input
                            id="name-filter"
                            placeholder="Enter provider name"
                            value={filters.name ?? ''}
                            onChange={(event) => setFilters({ ...filters, name: event.target.value })}
                            className="w-64"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                            value={filters.status ?? ''}
                            onValueChange={(value) => setFilters({ ...filters, status: value as ProviderStatus })}
                        >
                            <SelectTrigger className="w-56">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All statuses</SelectItem>
                                {statusOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>

                <div className="rounded-lg border border-gray-100 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-28">Code</TableHead>
                                <TableHead>Name (EN)</TableHead>
                                <TableHead>Name (AR)</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-center">License</TableHead>
                                <TableHead className="text-center">Updated</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-6 text-center text-gray-500">
                                        Loading providers...
                                    </TableCell>
                                </TableRow>
                            ) : filteredProviders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-6 text-center text-gray-500">
                                        No providers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProviders.map((provider) => (
                                    <TableRow key={provider.id} className="hover:bg-gray-50">
                                        <TableCell className="font-semibold">{provider.code || '-'}</TableCell>
                                        <TableCell>{provider.nameEn}</TableCell>
                                        <TableCell className="text-right">{provider.nameAr}</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-gray-500" />
                                            <div>
                                                <div className="font-medium">{provider.providerType.nameEn}</div>
                                                <div className="text-xs text-gray-500">{provider.providerType.nameAr}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span
                                                className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium ${
                                                    provider.status === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-800'
                                                        : provider.status === 'SUSPENDED'
                                                          ? 'bg-amber-100 text-amber-800'
                                                          : provider.status === 'BLACKLISTED'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                {provider.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-gray-600">
                                            {provider.licenseNumber || '-'}
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-gray-600">
                                            {provider.updatedAt ? formatDate(provider.updatedAt) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                                <Button variant="outline" size="sm" onClick={() => handleOpenBranches(provider)}>
                                                    <Building2 className="h-4 w-4 mr-2" /> Branches
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => openEditProvider(provider)}>
                                                    <Pencil className="h-4 w-4 mr-2" /> Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                    onClick={() => confirmDeleteProvider(provider)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 text-sm text-gray-600">
                        <div>
                            Page {pagination.pageNumber + 1} of {pagination.totalPages} • {pagination.totalElements} providers
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.pageNumber <= 0 || isLoading}
                                onClick={() => load(pagination.pageNumber - 1, pagination.pageSize)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.pageNumber + 1 >= pagination.totalPages || isLoading}
                                onClick={() => load(pagination.pageNumber + 1, pagination.pageSize)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={isProviderDialogOpen} onOpenChange={setIsProviderDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedProvider ? 'Edit Provider' : 'New Provider'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!selectedProvider && (
                            <div className="space-y-2">
                                <Label>Code *</Label>
                                <Input
                                    value={providerForm.code}
                                    onChange={(event) => setProviderForm((prev) => ({ ...prev, code: event.target.value }))}
                                    placeholder="HOSP001"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Name (EN) *</Label>
                            <Input
                                value={providerForm.nameEn}
                                onChange={(event) => setProviderForm((prev) => ({ ...prev, nameEn: event.target.value }))}
                                placeholder="Provider English name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Name (AR) *</Label>
                            <Input
                                value={providerForm.nameAr}
                                onChange={(event) => setProviderForm((prev) => ({ ...prev, nameAr: event.target.value }))}
                                placeholder="الاسم بالعربية"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Provider Type *</Label>
                            <Select
                                value={String(providerForm.providerTypeId || '')}
                                onValueChange={(value) => setProviderForm((prev) => ({ ...prev, providerTypeId: Number(value) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select provider type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {providerTypes.map((type) => (
                                        <SelectItem key={type.id} value={String(type.id)}>
                                            {type.nameEn} ({type.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Ownership</Label>
                            <Select
                                value={providerForm.ownershipType}
                                onValueChange={(value) =>
                                    setProviderForm((prev) => ({ ...prev, ownershipType: value as ProviderOwnership }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Ownership" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ownershipOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={providerForm.status ?? 'ACTIVE'}
                                onValueChange={(value) => setProviderForm((prev) => ({ ...prev, status: value as ProviderStatus }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tax Number</Label>
                            <Input
                                value={providerForm.taxNumber ?? ''}
                                onChange={(event) => setProviderForm((prev) => ({ ...prev, taxNumber: event.target.value }))}
                                placeholder="Tax number"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>License Number</Label>
                            <Input
                                value={providerForm.licenseNumber ?? ''}
                                onChange={(event) => setProviderForm((prev) => ({ ...prev, licenseNumber: event.target.value }))}
                                placeholder="License"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Website</Label>
                            <Input
                                value={providerForm.website ?? ''}
                                onChange={(event) => setProviderForm((prev) => ({ ...prev, website: event.target.value }))}
                                placeholder="https://example.com"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={providerForm.notes ?? ''}
                                onChange={(event) => setProviderForm((prev) => ({ ...prev, notes: event.target.value }))}
                                placeholder="Additional notes"
                                rows={3}
                            />
                        </div>
                    </div>
                    {formError && <p className="text-sm text-red-600">{formError}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsProviderDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submitProvider} disabled={isSaving} className="bg-tpa-primary hover:bg-tpa-accent">
                            {selectedProvider ? 'Update Provider' : 'Create Provider'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
                <DialogContent className="max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>
                            Branches for {selectedProvider?.nameEn} ({selectedProvider?.code})
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        <div className="lg:col-span-3 space-y-3">
                            <div className="rounded-lg border border-gray-100 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name (EN)</TableHead>
                                            <TableHead>Name (AR)</TableHead>
                                            <TableHead className="text-center">Main</TableHead>
                                            <TableHead className="text-center">Active</TableHead>
                                            <TableHead className="text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {branchesLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-6 text-center text-gray-500">
                                                    Loading branches...
                                                </TableCell>
                                            </TableRow>
                                        ) : branches.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-6 text-center text-gray-500">
                                                    No branches found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            branches.map((branch) => (
                                                <TableRow key={branch.id} className="hover:bg-gray-50">
                                                    <TableCell>{branch.nameEn}</TableCell>
                                                    <TableCell className="text-right">{branch.nameAr}</TableCell>
                                                    <TableCell className="text-center">
                                                        {branch.isMain ? (
                                                            <span className="inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-700 px-2 py-1 text-xs">
                                                                Main
                                                            </span>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Switch checked={branch.isActive} disabled />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => openEditBranch(branch.id)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                                onClick={() => confirmDeleteBranch(branch.id)}
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
                            {branchesPagination && branchesPagination.totalPages > 1 && (
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <div>
                                        Page {branchesPagination.pageNumber + 1} of {branchesPagination.totalPages} •{' '}
                                        {branchesPagination.totalElements} branches
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={branchesPagination.pageNumber <= 0 || branchesLoading}
                                            onClick={() =>
                                                selectedProvider &&
                                                loadBranches(selectedProvider.id, branchesPagination.pageNumber - 1, branchesPagination.pageSize)
                                            }
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                                branchesPagination.pageNumber + 1 >= branchesPagination.totalPages || branchesLoading
                                            }
                                            onClick={() =>
                                                selectedProvider &&
                                                loadBranches(selectedProvider.id, branchesPagination.pageNumber + 1, branchesPagination.pageSize)
                                            }
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {branchesError && <p className="text-sm text-red-600">{branchesError}</p>}
                        </div>
                        <div className="lg:col-span-2">
                            <div className="rounded-lg border border-gray-100 p-4 space-y-3 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-lg">{selectedBranchId ? 'Edit Branch' : 'Add Branch'}</h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (!selectedProvider) return
                                            setSelectedBranchId(null)
                                            setBranchForm({ ...emptyBranchForm, providerId: selectedProvider.id })
                                            setBranchFormError(null)
                                        }}
                                    >
                                        Reset
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Name (EN) *</Label>
                                        <Input
                                            value={branchForm.nameEn}
                                            onChange={(event) =>
                                                setBranchForm((prev) => ({ ...prev, nameEn: event.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Name (AR) *</Label>
                                        <Input
                                            value={branchForm.nameAr}
                                            onChange={(event) =>
                                                setBranchForm((prev) => ({ ...prev, nameAr: event.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Country</Label>
                                        <Input
                                            value={branchForm.country}
                                            onChange={(event) =>
                                                setBranchForm((prev) => ({ ...prev, country: event.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Input
                                            value={branchForm.city}
                                            onChange={(event) => setBranchForm((prev) => ({ ...prev, city: event.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>District</Label>
                                        <Input
                                            value={branchForm.district}
                                            onChange={(event) =>
                                                setBranchForm((prev) => ({ ...prev, district: event.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Street</Label>
                                        <Input
                                            value={branchForm.street}
                                            onChange={(event) =>
                                                setBranchForm((prev) => ({ ...prev, street: event.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input
                                            value={branchForm.phone}
                                            onChange={(event) =>
                                                setBranchForm((prev) => ({ ...prev, phone: event.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mobile</Label>
                                        <Input
                                            value={branchForm.mobile}
                                            onChange={(event) =>
                                                setBranchForm((prev) => ({ ...prev, mobile: event.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            value={branchForm.email}
                                            onChange={(event) =>
                                                setBranchForm((prev) => ({ ...prev, email: event.target.value }))
                                            }
                                        />
                                    </div>
                                   <div className="space-y-2">
                                        <Label>Latitude</Label>
                                        <Input
                                            type="number"
                                            value={branchForm.latitude ?? ''}
                                            onChange={(event) => {
                                                const value = event.target.value
                                                setBranchForm((prev) => ({
                                                    ...prev,
                                                    latitude: value === '' ? null : Number(value),
                                                }))
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Longitude</Label>
                                        <Input
                                            type="number"
                                            value={branchForm.longitude ?? ''}
                                            onChange={(event) => {
                                                const value = event.target.value
                                                setBranchForm((prev) => ({
                                                    ...prev,
                                                    longitude: value === '' ? null : Number(value),
                                                }))
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {workingDayKeys.map((day) => (
                                        <div className="space-y-2" key={day}>
                                            <Label className="capitalize">{day}</Label>
                                            <Input
                                                placeholder="08:00-20:00"
                                                value={branchForm.workingHours[day] ?? ''}
                                                onChange={(event) => updateWorkingHour(day, event.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={branchForm.isMain}
                                            onCheckedChange={(checked) =>
                                                setBranchForm((prev) => ({ ...prev, isMain: checked }))
                                            }
                                        />
                                        <Label>Is main branch</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={branchForm.isActive ?? true}
                                            onCheckedChange={(checked) =>
                                                setBranchForm((prev) => ({ ...prev, isActive: checked }))
                                            }
                                        />
                                        <Label>Active</Label>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <MapPin className="h-4 w-4" />
                                        <span>Ensure coordinates and working hours are set for maps & scheduling.</span>
                                    </div>
                                </div>
                                {branchFormError && <p className="text-sm text-red-600">{branchFormError}</p>}
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsBranchDialogOpen(false)}>
                                        Close
                                    </Button>
                                    <Button
                                        onClick={submitBranch}
                                        disabled={branchesSaving || !selectedProvider}
                                        className="bg-tpa-primary hover:bg-tpa-accent"
                                    >
                                        {selectedBranchId ? 'Update Branch' : 'Add Branch'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
