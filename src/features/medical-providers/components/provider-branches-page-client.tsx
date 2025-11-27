'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Building2, MapPin, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { ProviderBranchPayload, ProviderRecord } from '@/types/provider'
import { useProviderBranches } from '../hooks/use-provider-branches'
import { getProvider } from '../services/provider-service'

const workingDayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

type BranchFormState = ProviderBranchPayload

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

interface ProviderBranchesPageClientProps {
    providerId: number
    embedded?: boolean
}

export function ProviderBranchesPageClient({ providerId, embedded = false }: ProviderBranchesPageClientProps) {
    const router = useRouter()
    const {
        branches,
        pagination,
        isLoading,
        isSaving,
        error,
        filters,
        load,
        setFilters,
        create,
        update,
        remove,
        clearError,
    } = useProviderBranches(10)

    const [provider, setProvider] = useState<ProviderRecord | null>(null)
    const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false)
    const [branchForm, setBranchForm] = useState<BranchFormState>(emptyBranchForm)
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)
    const [branchFormError, setBranchFormError] = useState<string | null>(null)
    const [isLoadingProvider, setIsLoadingProvider] = useState(true)

    useEffect(() => {
        if (!providerId || isNaN(providerId) || providerId <= 0) {
            return
        }
        clearError()
        void load(providerId, 0)
        void loadProvider()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [providerId, filters.name])

    const loadProvider = async () => {
        if (!providerId || isNaN(providerId) || providerId <= 0) {
            return
        }
        setIsLoadingProvider(true)
        try {
            const providerData = await getProvider(providerId)
            setProvider(providerData)
        } catch (err) {
            console.error('Failed to load provider', err)
        } finally {
            setIsLoadingProvider(false)
        }
    }

    const openCreateBranch = () => {
        setSelectedBranchId(null)
        setBranchForm({ ...emptyBranchForm, providerId })
        setBranchFormError(null)
        setIsBranchDialogOpen(true)
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
        setIsBranchDialogOpen(true)
    }

    const submitBranch = async () => {
        if (!branchForm.nameEn.trim() || !branchForm.nameAr.trim()) {
            setBranchFormError('Branch English and Arabic names are required.')
            return
        }

        try {
            if (selectedBranchId) {
                await update(selectedBranchId, branchForm)
            } else {
                await create({ ...branchForm, providerId })
            }
            setIsBranchDialogOpen(false)
            setBranchForm({ ...emptyBranchForm, providerId })
            setSelectedBranchId(null)
            setBranchFormError(null)
        } catch (err) {
            setBranchFormError(err instanceof Error ? err.message : 'Failed to save branch')
        }
    }

    const confirmDeleteBranch = async (branchId: number) => {
        if (!window.confirm('Delete this branch?')) return
        try {
            await remove(branchId)
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
        <div className={embedded ? "space-y-6" : "p-6 space-y-6"}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-4">
                    {!embedded && (
                        <Button variant="outline" size="sm" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                    )}
                    <div>
                        <h1 className={embedded ? "text-xl font-bold" : "text-2xl font-bold"}>
                            Branches
                            {provider && (
                                <>
                                    {' '}
                                    - {provider.nameEn} ({provider.code})
                                </>
                            )}
                        </h1>
                        {!embedded && (
                            <p className="text-gray-600 max-w-3xl">
                                Manage branches for this provider. Add, edit, or remove branch locations with their details.
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => load(providerId, pagination?.pageNumber ?? 0)} disabled={isLoading}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    <Button onClick={openCreateBranch} className="bg-tpa-primary hover:bg-tpa-accent">
                        <Plus className="h-4 w-4 mr-2" /> New Branch
                    </Button>
                </div>
            </div>

            {isLoadingProvider && (
                <div className="text-center py-8 text-gray-500">Loading provider information...</div>
            )}

            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="branch-name-filter">Search by name</Label>
                        <Input
                            id="branch-name-filter"
                            placeholder="Enter branch name"
                            value={filters.name ?? ''}
                            onChange={(event) => setFilters({ ...filters, name: event.target.value })}
                            className="w-64"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>

                <div className="rounded-lg border border-gray-100 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name (EN)</TableHead>
                                <TableHead>Name (AR)</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead className="text-center">Main</TableHead>
                                <TableHead className="text-center">Active</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-6 text-center text-gray-500">
                                        Loading branches...
                                    </TableCell>
                                </TableRow>
                            ) : branches.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-6 text-center text-gray-500">
                                        No branches found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                branches.map((branch) => (
                                    <TableRow key={branch.id} className="hover:bg-gray-50">
                                        <TableCell>{branch.nameEn}</TableCell>
                                        <TableCell className="text-right">{branch.nameAr}</TableCell>
                                        <TableCell>
                                            <div className="text-sm text-gray-600">
                                                {branch.city && branch.country ? `${branch.city}, ${branch.country}` : '-'}
                                            </div>
                                        </TableCell>
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
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                                <Button variant="outline" size="sm" onClick={() => openEditBranch(branch.id)}>
                                                    <Pencil className="h-4 w-4 mr-2" /> Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                    onClick={() => confirmDeleteBranch(branch.id)}
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
                            Page {pagination.pageNumber + 1} of {pagination.totalPages} • {pagination.totalElements} branches
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.pageNumber <= 0 || isLoading}
                                onClick={() => load(providerId, pagination.pageNumber - 1, pagination.pageSize)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.pageNumber + 1 >= pagination.totalPages || isLoading}
                                onClick={() => load(providerId, pagination.pageNumber + 1, pagination.pageSize)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedBranchId ? 'Edit Branch' : 'New Branch'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Name (EN) *</Label>
                            <Input
                                value={branchForm.nameEn}
                                onChange={(event) => setBranchForm((prev) => ({ ...prev, nameEn: event.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Name (AR) *</Label>
                            <Input
                                value={branchForm.nameAr}
                                onChange={(event) => setBranchForm((prev) => ({ ...prev, nameAr: event.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Country</Label>
                            <Input
                                value={branchForm.country}
                                onChange={(event) => setBranchForm((prev) => ({ ...prev, country: event.target.value }))}
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
                                onChange={(event) => setBranchForm((prev) => ({ ...prev, district: event.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Street</Label>
                            <Input
                                value={branchForm.street}
                                onChange={(event) => setBranchForm((prev) => ({ ...prev, street: event.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                                value={branchForm.phone}
                                onChange={(event) => setBranchForm((prev) => ({ ...prev, phone: event.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mobile</Label>
                            <Input
                                value={branchForm.mobile}
                                onChange={(event) => setBranchForm((prev) => ({ ...prev, mobile: event.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                value={branchForm.email}
                                onChange={(event) => setBranchForm((prev) => ({ ...prev, email: event.target.value }))}
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
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={branchForm.isMain}
                                onCheckedChange={(checked) => setBranchForm((prev) => ({ ...prev, isMain: checked }))}
                            />
                            <Label>Is main branch</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={branchForm.isActive ?? true}
                                onCheckedChange={(checked) => setBranchForm((prev) => ({ ...prev, isActive: checked }))}
                            />
                            <Label>Active</Label>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <MapPin className="h-4 w-4" />
                            <span>Ensure coordinates and working hours are set for maps & scheduling.</span>
                        </div>
                    </div>
                    {branchFormError && <p className="text-sm text-red-600">{branchFormError}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBranchDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submitBranch} disabled={isSaving} className="bg-tpa-primary hover:bg-tpa-accent">
                            {selectedBranchId ? 'Update Branch' : 'Create Branch'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

