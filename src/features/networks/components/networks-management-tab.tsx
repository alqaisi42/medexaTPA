'use client'

import { useCallback, useEffect, useState } from 'react'
import {
    Loader2,
    Plus,
    Pencil,
    Trash2,
    Search,
    Network as NetworkIcon,
    Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
    Network,
    NetworkPayload,
    NetworkSearchFilters,
    NetworkStatus,
    NetworkType,
    NetworkUpdatePayload,
} from '@/types/network'
import {
    createNetwork,
    deleteNetwork,
    fetchNetworks,
    fetchNetwork,
    updateNetwork,
} from '@/lib/api/networks'
import { cn } from '@/lib/utils'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

const EMPTY_PAYLOAD: NetworkPayload = {
    code: '',
    nameEn: '',
    nameAr: '',
    description: '',
    networkType: 'TIER',
}

export function NetworksManagementTab() {
    const [networks, setNetworks] = useState<Network[]>([])
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1])
    const [totalPages, setTotalPages] = useState(1)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<NetworkStatus | 'ALL'>('ALL')
    const [networkTypeFilter, setNetworkTypeFilter] = useState<NetworkType | 'ALL'>('ALL')

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingNetwork, setEditingNetwork] = useState<Network | null>(null)
    const [formData, setFormData] = useState<NetworkPayload>(EMPTY_PAYLOAD)
    const [formError, setFormError] = useState<string | null>(null)
    const [loadingEditNetwork, setLoadingEditNetwork] = useState(false)

    const [deleteTarget, setDeleteTarget] = useState<Network | null>(null)

    const loadNetworks = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const filters: NetworkSearchFilters = {
                page,
                size: pageSize,
            }
            if (statusFilter !== 'ALL') {
                filters.status = statusFilter
            }
            if (searchTerm.trim()) {
                filters.name = searchTerm.trim()
            }
            if (networkTypeFilter !== 'ALL') {
                filters.networkType = networkTypeFilter
            }

            const response = await fetchNetworks(filters)
            setNetworks(response.content)
            setTotalPages(Math.max(response.totalPages || 1, 1))
            setTotalElements(response.totalElements || 0)
        } catch (requestError) {
            console.error(requestError)
            setError(requestError instanceof Error ? requestError.message : 'Unable to load networks')
            setNetworks([])
        } finally {
            setLoading(false)
        }
    }, [page, pageSize, statusFilter, searchTerm, networkTypeFilter])

    useEffect(() => {
        void loadNetworks()
    }, [loadNetworks])

    const handleCreate = () => {
        setEditingNetwork(null)
        setFormData(EMPTY_PAYLOAD)
        setFormError(null)
        setIsFormOpen(true)
    }

    const handleEdit = async (network: Network) => {
        setLoadingEditNetwork(true)
        setFormError(null)
        try {
            const freshNetwork = await fetchNetwork(network.id)
            setEditingNetwork(freshNetwork)
            setFormData({
                code: freshNetwork.code,
                nameEn: freshNetwork.nameEn,
                nameAr: freshNetwork.nameAr,
                description: freshNetwork.description || '',
                networkType: freshNetwork.networkType,
            })
            setIsFormOpen(true)
        } catch (editError) {
            console.error(editError)
            setFormError(editError instanceof Error ? editError.message : 'Unable to load network data for editing')
        } finally {
            setLoadingEditNetwork(false)
        }
    }

    const handleSubmit = async () => {
        if (!formData.code.trim() || !formData.nameEn.trim() || !formData.nameAr.trim()) {
            setFormError('Code, English name, and Arabic name are required')
            return
        }

        setSaving(true)
        setFormError(null)

        try {
            if (editingNetwork) {
                const updatePayload: NetworkUpdatePayload = {
                    nameEn: formData.nameEn.trim(),
                    nameAr: formData.nameAr.trim(),
                    description: formData.description?.trim() || undefined,
                    networkType: formData.networkType,
                    status: editingNetwork.status,
                    effectiveFrom: editingNetwork.effectiveFrom ? new Date(editingNetwork.effectiveFrom * 1000).toISOString() : undefined,
                    effectiveTo: editingNetwork.effectiveTo ? new Date(editingNetwork.effectiveTo * 1000).toISOString() : null,
                }
                await updateNetwork(editingNetwork.id, updatePayload)
            } else {
                await createNetwork(formData)
            }
            setIsFormOpen(false)
            await loadNetworks()
        } catch (submitError) {
            console.error(submitError)
            setFormError(submitError instanceof Error ? submitError.message : 'Unable to save network')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeletingId(deleteTarget.id)
        try {
            await deleteNetwork(deleteTarget.id)
            setDeleteTarget(null)
            await loadNetworks()
        } catch (deleteError) {
            console.error(deleteError)
            setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete network')
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

    const handleSearch = () => {
        setPage(0)
        void loadNetworks()
    }

    const actionInProgress = loading || saving || deletingId !== null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-tpa-primary/10 p-3 text-tpa-primary">
                        <NetworkIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Networks</h2>
                        <p className="text-sm text-gray-600">Manage provider networks and their configurations.</p>
                    </div>
                </div>
                <Button className="bg-tpa-primary hover:bg-tpa-accent" onClick={handleCreate} disabled={actionInProgress}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Network
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-100 p-4 space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            className="pl-9"
                            placeholder="Search by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch()
                                }
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => {
                                setStatusFilter(value as NetworkStatus | 'ALL')
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
                            value={networkTypeFilter}
                            onValueChange={(value) => {
                                setNetworkTypeFilter(value as NetworkType | 'ALL')
                                setPage(0)
                            }}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Types</SelectItem>
                                <SelectItem value="TIER">Tier</SelectItem>
                                <SelectItem value="GEOGRAPHIC">Geographic</SelectItem>
                                <SelectItem value="SPECIALTY">Specialty</SelectItem>
                                <SelectItem value="PROGRAM">Program</SelectItem>
                                <SelectItem value="CONTRACT">Contract</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={handleSearch} disabled={loading}>
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
                                <TableHead className="w-20">Code</TableHead>
                                <TableHead>Name (EN)</TableHead>
                                <TableHead>Name (AR)</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-32 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                    </TableCell>
                                </TableRow>
                            ) : networks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        No networks found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                networks.map((network) => (
                                    <TableRow key={network.id}>
                                        <TableCell className="font-mono text-sm">{network.code}</TableCell>
                                        <TableCell className="font-medium">{network.nameEn}</TableCell>
                                        <TableCell>{network.nameAr}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                                {network.networkType}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={cn(
                                                    'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                                                    network.status === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700',
                                                )}
                                            >
                                                {network.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate text-sm text-gray-600">
                                            {network.description || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(network)}
                                                    disabled={actionInProgress || loadingEditNetwork}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteTarget(network)}
                                                    disabled={actionInProgress || deletingId === network.id}
                                                >
                                                    {deletingId === network.id ? (
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
                            {totalElements} networks
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

            {/* Create/Edit Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingNetwork ? 'Edit Network' : 'Create New Network'}</DialogTitle>
                        <DialogDescription>
                            {editingNetwork
                                ? 'Update the network information below.'
                                : 'Fill in the details to create a new network.'}
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
                                <Label htmlFor="code">Code *</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="NET_GOLD"
                                    disabled={!!editingNetwork || saving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="networkType">Network Type *</Label>
                                <Select
                                    value={formData.networkType}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, networkType: value as NetworkType })
                                    }
                                    disabled={saving}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TIER">Tier</SelectItem>
                                        <SelectItem value="GEOGRAPHIC">Geographic</SelectItem>
                                        <SelectItem value="SPECIALTY">Specialty</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nameEn">Name (English) *</Label>
                                <Input
                                    id="nameEn"
                                    value={formData.nameEn}
                                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                    placeholder="Gold Network"
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nameAr">Name (Arabic) *</Label>
                                <Input
                                    id="nameAr"
                                    value={formData.nameAr}
                                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                    placeholder="شبكة الذهبية"
                                    disabled={saving}
                                    dir="rtl"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Network description..."
                                rows={3}
                                disabled={saving}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={saving || loadingEditNetwork}>
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
                        <DialogTitle>Delete Network</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to deactivate the network "{deleteTarget?.nameEn}"? This action cannot be
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

