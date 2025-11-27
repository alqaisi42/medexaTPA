'use client'

import { useCallback, useEffect, useState } from 'react'
import {
    Loader2,
    Plus,
    Pencil,
    Trash2,
    Search,
    FileText,
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
    InsurancePlan,
    InsurancePlanPayload,
    InsurancePlanSearchFilters,
    InsurancePlanUpdatePayload,
    PlanType,
    PlanCategory,
} from '@/types/insurance-plan'
import {
    createInsurancePlan,
    deleteInsurancePlan,
    fetchInsurancePlans,
    fetchInsurancePlan,
    updateInsurancePlan,
} from '@/lib/api/insurance-plans'
import { cn } from '@/lib/utils'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

const EMPTY_PAYLOAD: InsurancePlanPayload = {
    code: '',
    nameEn: '',
    nameAr: '',
    description: '',
    planType: 'CORPORATE',
    category: 'STANDARD',
}

export function InsurancePlansTab() {
    const [plans, setPlans] = useState<InsurancePlan[]>([])
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1])
    const [totalPages, setTotalPages] = useState(1)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [planTypeFilter, setPlanTypeFilter] = useState<PlanType | 'ALL'>('ALL')
    const [categoryFilter, setCategoryFilter] = useState<PlanCategory | 'ALL'>('ALL')
    const [statusFilter, setStatusFilter] = useState<'ALL' | boolean>('ALL')

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingPlan, setEditingPlan] = useState<InsurancePlan | null>(null)
    const [formData, setFormData] = useState<InsurancePlanPayload>(EMPTY_PAYLOAD)
    const [formError, setFormError] = useState<string | null>(null)
    const [loadingEditPlan, setLoadingEditPlan] = useState(false)

    const [deleteTarget, setDeleteTarget] = useState<InsurancePlan | null>(null)

    const loadPlans = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const filters: InsurancePlanSearchFilters = {
                page,
                size: pageSize,
            }
            if (planTypeFilter !== 'ALL') {
                filters.planType = planTypeFilter
            }
            if (categoryFilter !== 'ALL') {
                filters.category = categoryFilter
            }
            if (statusFilter !== 'ALL') {
                filters.isActive = statusFilter
            }
            if (searchTerm.trim()) {
                filters.name = searchTerm.trim()
            }

            const response = await fetchInsurancePlans(filters)
            setPlans(response.content)
            setTotalPages(Math.max(response.totalPages || 1, 1))
            setTotalElements(response.totalElements || 0)
        } catch (requestError) {
            console.error(requestError)
            setError(requestError instanceof Error ? requestError.message : 'Unable to load insurance plans')
            setPlans([])
        } finally {
            setLoading(false)
        }
    }, [page, pageSize, planTypeFilter, categoryFilter, statusFilter, searchTerm])

    useEffect(() => {
        void loadPlans()
    }, [loadPlans])

    const handleCreate = () => {
        setEditingPlan(null)
        setFormData(EMPTY_PAYLOAD)
        setFormError(null)
        setIsFormOpen(true)
    }

    const handleEdit = async (plan: InsurancePlan) => {
        setLoadingEditPlan(true)
        setFormError(null)
        try {
            const freshPlan = await fetchInsurancePlan(plan.id)
            setEditingPlan(freshPlan)
            setFormData({
                code: freshPlan.code,
                nameEn: freshPlan.nameEn,
                nameAr: freshPlan.nameAr,
                description: freshPlan.description || '',
                planType: freshPlan.planType,
                category: freshPlan.category,
            })
            setIsFormOpen(true)
        } catch (editError) {
            console.error(editError)
            setFormError(editError instanceof Error ? editError.message : 'Unable to load insurance plan data for editing')
        } finally {
            setLoadingEditPlan(false)
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
            if (editingPlan) {
                const updatePayload: InsurancePlanUpdatePayload = {
                    nameEn: formData.nameEn.trim(),
                    nameAr: formData.nameAr.trim(),
                    description: formData.description?.trim() || undefined,
                    planType: formData.planType,
                    category: formData.category,
                    isActive: editingPlan.isActive,
                }
                await updateInsurancePlan(editingPlan.id, updatePayload)
            } else {
                await createInsurancePlan(formData)
            }
            setIsFormOpen(false)
            await loadPlans()
        } catch (submitError) {
            console.error(submitError)
            setFormError(submitError instanceof Error ? submitError.message : 'Unable to save insurance plan')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeletingId(deleteTarget.id)
        try {
            await deleteInsurancePlan(deleteTarget.id)
            setDeleteTarget(null)
            await loadPlans()
        } catch (deleteError) {
            console.error(deleteError)
            setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete insurance plan')
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
        void loadPlans()
    }

    const actionInProgress = loading || saving || deletingId !== null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-tpa-primary/10 p-3 text-tpa-primary">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Insurance Plans</h2>
                        <p className="text-sm text-gray-600">Manage insurance plans and their configurations.</p>
                    </div>
                </div>
                <Button className="bg-tpa-primary hover:bg-tpa-accent" onClick={handleCreate} disabled={actionInProgress}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Plan
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
                            value={planTypeFilter}
                            onValueChange={(value) => {
                                setPlanTypeFilter(value as PlanType | 'ALL')
                                setPage(0)
                            }}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Plan Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Types</SelectItem>
                                <SelectItem value="CORPORATE">Corporate</SelectItem>
                                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                                <SelectItem value="FAMILY">Family</SelectItem>
                                <SelectItem value="GROUP">Group</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={categoryFilter}
                            onValueChange={(value) => {
                                setCategoryFilter(value as PlanCategory | 'ALL')
                                setPage(0)
                            }}
                        >
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Categories</SelectItem>
                                <SelectItem value="PREMIUM">Premium</SelectItem>
                                <SelectItem value="STANDARD">Standard</SelectItem>
                                <SelectItem value="BASIC">Basic</SelectItem>
                                <SelectItem value="ECONOMY">Economy</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={statusFilter === 'ALL' ? 'ALL' : statusFilter ? 'ACTIVE' : 'INACTIVE'}
                            onValueChange={(value) => {
                                if (value === 'ALL') {
                                    setStatusFilter('ALL')
                                } else {
                                    setStatusFilter(value === 'ACTIVE')
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
                                <TableHead className="w-24">Code</TableHead>
                                <TableHead>Name (EN)</TableHead>
                                <TableHead>Name (AR)</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Description</TableHead>
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
                            ) : plans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                        No insurance plans found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                plans.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell className="font-mono text-sm">{plan.code}</TableCell>
                                        <TableCell className="font-medium">{plan.nameEn}</TableCell>
                                        <TableCell>{plan.nameAr}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                                {plan.planType}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                                {plan.category}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={cn(
                                                    'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                                                    plan.isActive
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700',
                                                )}
                                            >
                                                {plan.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate text-sm text-gray-600">
                                            {plan.description || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(plan)}
                                                    disabled={actionInProgress || loadingEditPlan}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteTarget(plan)}
                                                    disabled={actionInProgress || deletingId === plan.id}
                                                >
                                                    {deletingId === plan.id ? (
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
                            {totalElements} plans
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
                        <DialogTitle>{editingPlan ? 'Edit Insurance Plan' : 'Create New Insurance Plan'}</DialogTitle>
                        <DialogDescription>
                            {editingPlan
                                ? 'Update the insurance plan information below.'
                                : 'Fill in the details to create a new insurance plan.'}
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
                                    placeholder="CORP_PREMIUM"
                                    disabled={!!editingPlan || saving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="planType">Plan Type *</Label>
                                <Select
                                    value={formData.planType}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, planType: value as PlanType })
                                    }
                                    disabled={saving}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CORPORATE">Corporate</SelectItem>
                                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                                        <SelectItem value="FAMILY">Family</SelectItem>
                                        <SelectItem value="GROUP">Group</SelectItem>
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
                                    placeholder="Corporate Premium Plan"
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nameAr">Name (Arabic) *</Label>
                                <Input
                                    id="nameAr"
                                    value={formData.nameAr}
                                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                    placeholder="الخطة المميزة للشركات"
                                    disabled={saving}
                                    dir="rtl"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Category *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, category: value as PlanCategory })
                                    }
                                    disabled={saving}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PREMIUM">Premium</SelectItem>
                                        <SelectItem value="STANDARD">Standard</SelectItem>
                                        <SelectItem value="BASIC">Basic</SelectItem>
                                        <SelectItem value="ECONOMY">Economy</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Plan description..."
                                rows={3}
                                disabled={saving}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={saving || loadingEditPlan}>
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
                        <DialogTitle>Delete Insurance Plan</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to deactivate the insurance plan "{deleteTarget?.nameEn}"? This action
                            cannot be undone.
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

