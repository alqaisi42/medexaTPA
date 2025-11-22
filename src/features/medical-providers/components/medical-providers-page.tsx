'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Building2, RefreshCw, Layers, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProviderOwnership, ProviderPayload, ProviderRecord, ProviderStatus } from '@/types/provider'
import { ProviderType } from '@/types/provider-type'
import { useProviders } from '../hooks/use-providers'
import { fetchProviderTypesLookup } from '@/lib/api/lookups'
import { formatDate } from '@/lib/utils'

const statusOptions: ProviderStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED']
const ownershipOptions: ProviderOwnership[] = ['PRIVATE', 'PUBLIC', 'GOVERNMENT', 'MILITARY']

type ProviderFormState = ProviderPayload & { code: string }

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

export function MedicalProvidersPage() {
    const router = useRouter()
    const { providers, pagination, isLoading, isSaving, error, filters, load, setFilters, create, update, remove, clearError } =
        useProviders(10)

    const [providerTypes, setProviderTypes] = useState<ProviderType[]>([])
    const [providerTypesLoading, setProviderTypesLoading] = useState(false)
    const [providerTypeSearch, setProviderTypeSearch] = useState('')
    const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false)
    const [providerForm, setProviderForm] = useState<ProviderFormState>(emptyProviderForm)
    const [selectedProvider, setSelectedProvider] = useState<ProviderRecord | null>(null)
    const [formError, setFormError] = useState<string | null>(null)

    useEffect(() => {
        clearError()
        void load()
    }, [filters, load, clearError])

    useEffect(() => {
        setProviderTypesLoading(true)
        fetchProviderTypesLookup()
            .then(setProviderTypes)
            .catch((err) => console.error('Failed to load provider types', err))
            .finally(() => setProviderTypesLoading(false))
    }, [])

    const filteredProviderTypes = useMemo(() => {
        const term = providerTypeSearch.toLowerCase().trim()

        if (!term) {
            return providerTypes
        }

        return providerTypes.filter((item) =>
            [item.nameEn, item.nameAr, item.code].some((field) => field.toLowerCase().includes(term)),
        )
    }, [providerTypeSearch, providerTypes])

    const filteredProviders = useMemo(() => providers, [providers])

    const openCreateProvider = () => {
        setSelectedProvider(null)
        setProviderForm(emptyProviderForm)
        setFormError(null)
        setProviderTypeSearch('')
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
        setProviderTypeSearch('')
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
            setProviderTypeSearch('')
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

    const handleOpenDetails = (provider: ProviderRecord) => {
        router.push(`/medical-providers/${provider.id}`)
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold">Medical Providers</h1>
                    <p className="text-gray-600 max-w-3xl">
                        Maintain provider records, status, and licensing details. Click on "Branches" to manage provider branches.
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
                                                <Button variant="outline" size="sm" onClick={() => handleOpenDetails(provider)}>
                                                    <Building2 className="h-4 w-4 mr-2" /> Details
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

            <Dialog
                open={isProviderDialogOpen}
                onOpenChange={(open) => {
                    setIsProviderDialogOpen(open)
                    if (!open) {
                        setProviderTypeSearch('')
                    }
                }}
            >
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
                                onValueChange={(value) => {
                                    setProviderForm((prev) => ({ ...prev, providerTypeId: Number(value) }))
                                    setProviderTypeSearch('')
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Search provider types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <div className="p-2">
                                        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                                            <Search className="h-4 w-4 text-muted-foreground" />
                                            <input
                                                className="h-8 w-full bg-transparent text-sm outline-none"
                                                placeholder="Search by name or code"
                                                value={providerTypeSearch}
                                                onChange={(event) => setProviderTypeSearch(event.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                onKeyDown={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                    {providerTypesLoading && (
                                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading provider types...
                                        </div>
                                    )}
                                    {!providerTypesLoading && filteredProviderTypes.length === 0 && (
                                        <div className="px-3 py-2 text-sm text-gray-500">No provider types found</div>
                                    )}
                                    {!providerTypesLoading &&
                                        filteredProviderTypes.map((type) => (
                                            <SelectItem key={type.id} value={String(type.id)}>
                                                <div className="flex flex-col text-left">
                                                    <span className="text-sm font-medium">{type.nameEn}</span>
                                                    <span className="text-xs text-gray-500">{type.code}</span>
                                                </div>
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
        </div>
    )
}
