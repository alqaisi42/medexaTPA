'use client'

import { useCallback, useEffect, useState } from 'react'
import {
    Loader2,
    Plus,
    Pencil,
    Trash2,
    Search,
    Link2,
    Network as NetworkIcon,
    FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
    PlanNetworkMapping,
    PlanNetworkMappingPayload,
    PlanNetworkMappingUpdatePayload,
    CoverageType,
    NetworkStatus,
} from '@/types/network'
import {
    createPlanNetworkMapping,
    deletePlanNetworkMapping,
    fetchPlanNetworksByNetwork,
    fetchPlanNetworksByPlan,
    updatePlanNetworkMapping,
} from '@/lib/api/plan-networks'
import { fetchNetworks } from '@/lib/api/networks'
import { fetchInsurancePlans } from '@/lib/api/insurance-plans'
import { Network } from '@/types/network'
import { InsurancePlan } from '@/types/insurance-plan'
import { cn } from '@/lib/utils'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

const EMPTY_PAYLOAD: PlanNetworkMappingPayload = {
    planId: 0,
    networkId: 0,
    coverageType: 'INCLUDED',
    effectiveFrom: undefined,
    effectiveTo: null,
    notes: '',
}

export function PlanNetworkMappingTab() {
    const [activeView, setActiveView] = useState<'by-network' | 'by-plan'>('by-network')
    const [mappings, setMappings] = useState<PlanNetworkMapping[]>([])
    const [networks, setNetworks] = useState<Network[]>([])
    const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>([])
    const [loadingPlans, setLoadingPlans] = useState(false)
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1])
    const [totalPages, setTotalPages] = useState(1)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<NetworkStatus | 'ALL'>('ALL')

    // For by-network view
    const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null)
    const [networkSearchTerm, setNetworkSearchTerm] = useState('')

    // For by-plan view
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingMapping, setEditingMapping] = useState<PlanNetworkMapping | null>(null)
    const [formData, setFormData] = useState<PlanNetworkMappingPayload>(EMPTY_PAYLOAD)
    const [formError, setFormError] = useState<string | null>(null)

    const [deleteTarget, setDeleteTarget] = useState<PlanNetworkMapping | null>(null)

    // Load networks and insurance plans for selection
    useEffect(() => {
        const loadData = async () => {
            try {
                const [networksResponse, plansResponse] = await Promise.all([
                    fetchNetworks({ page: 0, size: 1000 }),
                    fetchInsurancePlans({ page: 0, size: 1000 }),
                ])
                setNetworks(networksResponse.content)
                setInsurancePlans(plansResponse.content)
            } catch (err) {
                console.error('Failed to load data', err)
            } finally {
                setLoadingPlans(false)
            }
        }
        setLoadingPlans(true)
        void loadData()
    }, [])

    const loadMappings = useCallback(async () => {
        if (activeView === 'by-network' && !selectedNetworkId) {
            setMappings([])
            return
        }
        if (activeView === 'by-plan' && !selectedPlanId) {
            setMappings([])
            return
        }

        setLoading(true)
        setError(null)
        try {
            let response
            if (activeView === 'by-network') {
                response = await fetchPlanNetworksByNetwork({
                    networkId: selectedNetworkId!,
                    status: statusFilter !== 'ALL' ? statusFilter : undefined,
                    page,
                    size: pageSize,
                })
            } else {
                response = await fetchPlanNetworksByPlan({
                    planId: selectedPlanId!,
                    status: statusFilter !== 'ALL' ? statusFilter : undefined,
                    page,
                    size: pageSize,
                })
            }
            setMappings(response.content)
            setTotalPages(Math.max(response.totalPages || 1, 1))
            setTotalElements(response.totalElements || 0)
        } catch (requestError) {
            console.error(requestError)
            setError(requestError instanceof Error ? requestError.message : 'Unable to load plan-network mappings')
            setMappings([])
        } finally {
            setLoading(false)
        }
    }, [activeView, selectedNetworkId, selectedPlanId, statusFilter, page, pageSize])

    useEffect(() => {
        void loadMappings()
    }, [loadMappings])

    const handleCreate = () => {
        setEditingMapping(null)
        setFormData({
            ...EMPTY_PAYLOAD,
            networkId: activeView === 'by-network' && selectedNetworkId ? selectedNetworkId : 0,
            planId: activeView === 'by-plan' && selectedPlanId ? selectedPlanId : 0,
        })
        setFormError(null)
        setIsFormOpen(true)
    }

    const handleEdit = (mapping: PlanNetworkMapping) => {
        setEditingMapping(mapping)
        setFormData({
            planId: mapping.planId,
            networkId: mapping.networkId,
            coverageType: mapping.coverageType,
            effectiveFrom: mapping.effectiveFrom || undefined,
            effectiveTo: mapping.effectiveTo || null,
            notes: mapping.notes || '',
        })
        setFormError(null)
        setIsFormOpen(true)
    }

    const handleSubmit = async () => {
        if (!formData.planId || !formData.networkId) {
            setFormError('Plan ID and Network ID are required')
            return
        }

        setSaving(true)
        setFormError(null)

        try {
            if (editingMapping) {
                const updatePayload: PlanNetworkMappingUpdatePayload = {
                    coverageType: formData.coverageType,
                    status: editingMapping.status,
                    effectiveFrom: formData.effectiveFrom,
                    effectiveTo: formData.effectiveTo,
                    notes: formData.notes || undefined,
                }
                await updatePlanNetworkMapping(editingMapping.id, updatePayload)
            } else {
                await createPlanNetworkMapping(formData)
            }
            setIsFormOpen(false)
            await loadMappings()
        } catch (submitError) {
            console.error(submitError)
            setFormError(submitError instanceof Error ? submitError.message : 'Unable to save plan-network mapping')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeletingId(deleteTarget.id)
        try {
            await deletePlanNetworkMapping(deleteTarget.id)
            setDeleteTarget(null)
            await loadMappings()
        } catch (deleteError) {
            console.error(deleteError)
            setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete plan-network mapping')
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

    const handleViewChange = (value: string) => {
        if (value === 'by-network' || value === 'by-plan') {
            setActiveView(value)
            setPage(0)
            setSelectedNetworkId(null)
            setSelectedPlanId(null)
        }
    }

    const filteredNetworks = networks.filter((n) =>
        networkSearchTerm
            ? n.nameEn.toLowerCase().includes(networkSearchTerm.toLowerCase()) ||
              n.code.toLowerCase().includes(networkSearchTerm.toLowerCase())
            : true,
    )

    const actionInProgress = loading || saving || deletingId !== null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-tpa-primary/10 p-3 text-tpa-primary">
                        <Link2 className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Plan-Network Mapping</h2>
                        <p className="text-sm text-gray-600">Link insurance plans to provider networks.</p>
                    </div>
                </div>
                <Button
                    className="bg-tpa-primary hover:bg-tpa-accent"
                    onClick={handleCreate}
                    disabled={
                        actionInProgress ||
                        (activeView === 'by-network' && !selectedNetworkId) ||
                        (activeView === 'by-plan' && !selectedPlanId)
                    }
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Mapping
                </Button>
            </div>

            <Tabs value={activeView} onValueChange={handleViewChange} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="by-network" className="flex items-center gap-2">
                        <NetworkIcon className="h-4 w-4" />
                        By Network
                    </TabsTrigger>
                    <TabsTrigger value="by-plan" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        By Plan
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="by-network" className="space-y-4">
                    <div className="bg-white rounded-lg shadow border border-gray-100 p-4 space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <Label>Select Network</Label>
                                <div className="relative mt-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        className="pl-9"
                                        placeholder="Search networks..."
                                        value={networkSearchTerm}
                                        onChange={(e) => setNetworkSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <Label>Network</Label>
                                <Select
                                    value={selectedNetworkId?.toString() || ''}
                                    onValueChange={(value) => {
                                        setSelectedNetworkId(value ? Number(value) : null)
                                        setPage(0)
                                    }}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select a network" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredNetworks.map((network) => (
                                            <SelectItem key={network.id} value={network.id.toString()}>
                                                {network.code} - {network.nameEn}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label>Status</Label>
                                <Select
                                    value={statusFilter}
                                    onValueChange={(value) => {
                                        setStatusFilter(value as NetworkStatus | 'ALL')
                                        setPage(0)
                                    }}
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="by-plan" className="space-y-4">
                    <div className="bg-white rounded-lg shadow border border-gray-100 p-4 space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex-1 min-w-[300px]">
                                <Label>Select Plan</Label>
                                <SearchableSelect
                                    options={insurancePlans.map((plan) => ({
                                        id: plan.id,
                                        label: plan.nameEn,
                                        subLabel: `${plan.code} - ${plan.planType} / ${plan.category}`,
                                    }))}
                                    value={selectedPlanId || undefined}
                                    onValueChange={(value) => {
                                        setSelectedPlanId(value ? Number(value) : null)
                                        setPage(0)
                                    }}
                                    placeholder="Search and select a plan..."
                                    searchPlaceholder="Search by code, name, type, or category..."
                                    emptyMessage="No plans found"
                                    loading={loadingPlans}
                                    className="mt-1"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Label>Status</Label>
                                <Select
                                    value={statusFilter}
                                    onValueChange={(value) => {
                                        setStatusFilter(value as NetworkStatus | 'ALL')
                                        setPage(0)
                                    }}
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {((activeView === 'by-network' && selectedNetworkId) ||
                (activeView === 'by-plan' && selectedPlanId)) && (
                <div className="bg-white rounded-lg shadow border border-gray-100 p-4 space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {activeView === 'by-network' ? (
                                        <>
                                            <TableHead>Plan Code</TableHead>
                                            <TableHead>Plan Name</TableHead>
                                        </>
                                    ) : (
                                        <>
                                            <TableHead>Network Code</TableHead>
                                            <TableHead>Network Name</TableHead>
                                        </>
                                    )}
                                    <TableHead>Coverage Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Effective From</TableHead>
                                    <TableHead>Effective To</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead className="w-32 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                        </TableCell>
                                    </TableRow>
                                ) : mappings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                            No mappings found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    mappings.map((mapping) => (
                                        <TableRow key={mapping.id}>
                                            {activeView === 'by-network' ? (
                                                <>
                                                    <TableCell className="font-mono text-sm">
                                                        {mapping.planCode}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{mapping.planNameEn}</TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell className="font-mono text-sm">
                                                        {mapping.networkCode}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {mapping.networkNameEn}
                                                    </TableCell>
                                                </>
                                            )}
                                            <TableCell>
                                                <span
                                                    className={cn(
                                                        'inline-flex px-2 py-1 rounded text-xs font-medium',
                                                        mapping.coverageType === 'INCLUDED'
                                                            ? 'bg-green-100 text-green-700'
                                                            : mapping.coverageType === 'EXCLUDED'
                                                              ? 'bg-red-100 text-red-700'
                                                              : 'bg-yellow-100 text-yellow-700',
                                                    )}
                                                >
                                                    {mapping.coverageType}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={cn(
                                                        'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                                                        mapping.status === 'ACTIVE'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-700',
                                                    )}
                                                >
                                                    {mapping.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {mapping.effectiveFrom
                                                    ? new Date(mapping.effectiveFrom).toLocaleDateString()
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {mapping.effectiveTo
                                                    ? new Date(mapping.effectiveTo).toLocaleDateString()
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate text-sm text-gray-600">
                                                {mapping.notes || '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(mapping)}
                                                        disabled={actionInProgress}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeleteTarget(mapping)}
                                                        disabled={actionInProgress || deletingId === mapping.id}
                                                    >
                                                        {deletingId === mapping.id ? (
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
                                {totalElements} mappings
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
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingMapping ? 'Edit Plan-Network Mapping' : 'Create Plan-Network Mapping'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingMapping
                                ? 'Update the mapping information below.'
                                : 'Link an insurance plan to a provider network.'}
                        </DialogDescription>
                    </DialogHeader>
                    {formError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {formError}
                        </div>
                    )}
                    <div className="space-y-4">
                        {!editingMapping && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="planId">Plan *</Label>
                                    <SearchableSelect
                                        options={insurancePlans.map((plan) => ({
                                            id: plan.id,
                                            label: plan.nameEn,
                                            subLabel: `${plan.code} - ${plan.planType} / ${plan.category}`,
                                        }))}
                                        value={formData.planId || undefined}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, planId: value ? Number(value) : 0 })
                                        }
                                        placeholder="Search and select a plan..."
                                        searchPlaceholder="Search by code, name, type, or category..."
                                        emptyMessage="No plans found"
                                        disabled={saving || activeView === 'by-plan'}
                                        loading={loadingPlans}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="networkId">Network *</Label>
                                    <Select
                                        value={formData.networkId?.toString() || ''}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, networkId: Number(value) || 0 })
                                        }
                                        disabled={saving || activeView === 'by-network'}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select network" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {networks.map((network) => (
                                                <SelectItem key={network.id} value={network.id.toString()}>
                                                    {network.code} - {network.nameEn}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                        {editingMapping && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Plan</Label>
                                    <Input value={`${editingMapping.planCode} - ${editingMapping.planNameEn}`} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label>Network</Label>
                                    <Input
                                        value={`${editingMapping.networkCode} - ${editingMapping.networkNameEn}`}
                                        disabled
                                    />
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="coverageType">Coverage Type *</Label>
                                <Select
                                    value={formData.coverageType}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, coverageType: value as CoverageType })
                                    }
                                    disabled={saving}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INCLUDED">Included</SelectItem>
                                        <SelectItem value="EXCLUDED">Excluded</SelectItem>
                                        <SelectItem value="PARTIAL">Partial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="effectiveFrom">Effective From</Label>
                                <Input
                                    id="effectiveFrom"
                                    type="datetime-local"
                                    value={
                                        formData.effectiveFrom
                                            ? new Date(formData.effectiveFrom).toISOString().slice(0, 16)
                                            : ''
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            effectiveFrom: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                                        })
                                    }
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="effectiveTo">Effective To</Label>
                                <Input
                                    id="effectiveTo"
                                    type="datetime-local"
                                    value={
                                        formData.effectiveTo
                                            ? new Date(formData.effectiveTo).toISOString().slice(0, 16)
                                            : ''
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            effectiveTo: e.target.value ? new Date(e.target.value).toISOString() : null,
                                        })
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
                        <Button onClick={handleSubmit} disabled={saving}>
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
                        <DialogTitle>Delete Plan-Network Mapping</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to deactivate this mapping? This action cannot be undone.
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

