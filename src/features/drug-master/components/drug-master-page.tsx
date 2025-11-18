'use client'

import { type ComponentType, useCallback, useEffect, useMemo, useState } from 'react'
import {
    BadgeCheck,
    CalendarRange,
    Eye,
    Filter,
    Layers,
    Loader2,
    Pencil,
    Pill,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, formatDate } from '@/lib/utils'
import { createDrug, deleteDrug, fetchDrugs, getDrugById, updateDrug } from '@/lib/api/drugs'
import { createDrugForm, deleteDrugForm, fetchDrugForms, updateDrugForm } from '@/lib/api/drug-forms'
import { Drug, DrugForm, DrugFormPayload, DrugPayload } from '@/types'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const EMPTY_FORM: DrugPayload = {
    code: '',
    genericNameEn: '',
    genericNameAr: '',
    brandNameEn: '',
    brandNameAr: '',
    atcCode: '',
    description: '',
    isControlled: false,
    isOtc: false,
    allowGenericSubstitution: false,
    validFrom: null,
    validTo: null,
    isActive: true,
}

interface FilterState {
    status: 'all' | 'active' | 'inactive'
    otc: 'all' | 'yes' | 'no'
    controlled: 'all' | 'yes' | 'no'
    substitution: 'all' | 'yes' | 'no'
}

const INITIAL_FILTERS: FilterState = {
    status: 'all',
    otc: 'all',
    controlled: 'all',
    substitution: 'all',
}

export function DrugMasterPage() {
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])
    const [totalPages, setTotalPages] = useState(1)
    const [drugs, setDrugs] = useState<Drug[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingDrug, setEditingDrug] = useState<Drug | null>(null)
    const [formError, setFormError] = useState<string | null>(null)

    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Drug | null>(null)

    const loadDrugs = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetchDrugs({ page, size: pageSize })
            setDrugs(response.content)
            setTotalPages(Math.max(response.totalPages || 1, 1))
        } catch (requestError) {
            console.error(requestError)
            setError(requestError instanceof Error ? requestError.message : 'Unable to load drugs')
            setDrugs([])
        } finally {
            setLoading(false)
        }
    }, [page, pageSize])

    useEffect(() => {
        void loadDrugs()
    }, [loadDrugs])

    const filteredDrugs = useMemo(() => {
        return drugs.filter((drug) => {
            const term = searchTerm.trim().toLowerCase()
            const matchesSearch = term
                ? [drug.code, drug.genericNameEn, drug.brandNameEn, drug.atcCode]
                      .filter(Boolean)
                      .some((value) => value.toLowerCase().includes(term))
                : true

            const matchesStatus =
                filters.status === 'all' || (filters.status === 'active' ? drug.isActive : !drug.isActive)
            const matchesOtc = filters.otc === 'all' || drug.isOtc === (filters.otc === 'yes')
            const matchesControlled =
                filters.controlled === 'all' || drug.isControlled === (filters.controlled === 'yes')
            const matchesSubstitution =
                filters.substitution === 'all' || drug.allowGenericSubstitution === (filters.substitution === 'yes')

            return matchesSearch && matchesStatus && matchesOtc && matchesControlled && matchesSubstitution
        })
    }, [drugs, searchTerm, filters])

    const handleCreate = () => {
        setEditingDrug(null)
        setFormError(null)
        setIsFormOpen(true)
    }

    const handleEdit = (drug: Drug) => {
        setEditingDrug(drug)
        setFormError(null)
        setIsFormOpen(true)
    }

    const handleSubmit = async (payload: DrugPayload) => {
        setSaving(true)
        setFormError(null)

        try {
            if (editingDrug) {
                await updateDrug(editingDrug.id, payload)
            } else {
                await createDrug(payload)
            }
            setIsFormOpen(false)
            await loadDrugs()
        } catch (submitError) {
            console.error(submitError)
            setFormError(submitError instanceof Error ? submitError.message : 'Unable to save drug')
        } finally {
            setSaving(false)
        }
    }

    const handleViewDetails = async (drug: Drug) => {
        setSelectedDrug(drug)
        setIsDetailsOpen(true)
        try {
            const fresh = await getDrugById(drug.id)
            setSelectedDrug(fresh)
        } catch (detailsError) {
            console.error(detailsError)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeletingId(deleteTarget.id)
        try {
            await deleteDrug(deleteTarget.id)
            setDeleteTarget(null)
            setIsDetailsOpen(false)
            await loadDrugs()
        } catch (deleteError) {
            console.error(deleteError)
            setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete drug')
        } finally {
            setDeletingId(null)
        }
    }

    const actionInProgress = loading || saving || deletingId !== null

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-tpa-primary/10 p-3 text-tpa-primary">
                        <Pill className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Drug Master</h1>
                        <p className="text-sm text-gray-600">Maintain the core attributes of all drugs in the system.</p>
                    </div>
                </div>
                <Button className="bg-tpa-primary hover:bg-tpa-accent" onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Drug
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-4 lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-lg">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                className="pl-9"
                                placeholder="Search by code, generic or brand name"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </div>
                        <Filter className="h-4 w-4 text-gray-400" />
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="font-medium">Status</span>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value as FilterState['status'] }))}
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="font-medium">OTC</span>
                            <Select
                                value={filters.otc}
                                onValueChange={(value) => setFilters((prev) => ({ ...prev, otc: value as FilterState['otc'] }))}
                            >
                                <SelectTrigger className="w-28">
                                    <SelectValue placeholder="OTC" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="font-medium">Controlled</span>
                            <Select
                                value={filters.controlled}
                                onValueChange={(value) =>
                                    setFilters((prev) => ({ ...prev, controlled: value as FilterState['controlled'] }))
                                }
                            >
                                <SelectTrigger className="w-28">
                                    <SelectValue placeholder="Controlled" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="font-medium">Substitution</span>
                            <Select
                                value={filters.substitution}
                                onValueChange={(value) =>
                                    setFilters((prev) => ({ ...prev, substitution: value as FilterState['substitution'] }))
                                }
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Substitution" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="yes">Allowed</SelectItem>
                                    <SelectItem value="no">Not allowed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>

                <div className="bg-white rounded-lg shadow p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Layers className="h-4 w-4" />
                        <span className="font-medium">Page Size</span>
                        <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                            <SelectTrigger className="w-24">
                                <SelectValue placeholder="Size" />
                            </SelectTrigger>
                            <SelectContent>
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size} rows
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Page {page + 1}</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)}>
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page + 1 >= totalPages || loading}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-32">Code</TableHead>
                            <TableHead>Generic Name</TableHead>
                            <TableHead>Brand Name</TableHead>
                            <TableHead className="w-32">ATC</TableHead>
                            <TableHead className="w-48">Flags</TableHead>
                            <TableHead className="w-40 text-center">Validity</TableHead>
                            <TableHead className="w-24 text-center">Status</TableHead>
                            <TableHead className="w-32 text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="py-6 text-center text-sm text-gray-500">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Loading drugs...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredDrugs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="py-6 text-center text-sm text-gray-500">
                                    No drugs found for the selected filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredDrugs.map((drug) => (
                                <TableRow key={drug.id} className="hover:bg-gray-50">
                                    <TableCell className="font-medium">{drug.code || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{drug.genericNameEn || '-'}</span>
                                            <span className="text-sm text-gray-500" dir="rtl">
                                                {drug.genericNameAr || '-'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{drug.brandNameEn || '-'}</span>
                                            <span className="text-sm text-gray-500" dir="rtl">
                                                {drug.brandNameAr || '-'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{drug.atcCode || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-2">
                                            {drug.isOtc && (
                                                <span className="rounded-full bg-green-100 text-green-800 px-2 py-1 text-xs font-medium">
                                                    OTC
                                                </span>
                                            )}
                                            {drug.isControlled && (
                                                <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-1 text-xs font-medium">
                                                    Controlled
                                                </span>
                                            )}
                                            {drug.allowGenericSubstitution ? (
                                                <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-1 text-xs font-medium">
                                                    Substitution allowed
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-1 text-xs font-medium">
                                                    No substitution
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center text-sm">
                                        {drug.validFrom ? formatDate(drug.validFrom) : '—'}
                                        <span className="block text-gray-500">
                                            {drug.validTo ? formatDate(drug.validTo) : 'Open-ended'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span
                                            className={cn(
                                                'inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium',
                                                drug.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-700',
                                            )}
                                        >
                                            {drug.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="outline" size="icon" onClick={() => handleViewDetails(drug)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" onClick={() => handleEdit(drug)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => setDeleteTarget(drug)}
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

            <DrugFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSubmit={handleSubmit}
                loading={saving}
                error={formError}
                onError={setFormError}
                initialValues={editingDrug ? mapDrugToPayload(editingDrug) : EMPTY_FORM}
                mode={editingDrug ? 'edit' : 'create'}
            />

            <DrugDetailsSheet
                drug={selectedDrug}
                open={isDetailsOpen}
                onOpenChange={(open) => {
                    setIsDetailsOpen(open)
                    if (!open) {
                        setSelectedDrug(null)
                    }
                }}
                onEdit={() => {
                    if (selectedDrug) {
                        handleEdit(selectedDrug)
                        setIsDetailsOpen(false)
                    }
                }}
                onDeleteRequest={(drug) => setDeleteTarget(drug)}
                deleting={deletingId !== null}
            />

            <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Drug</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {deleteTarget?.code ?? 'this drug'}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={actionInProgress}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={actionInProgress}>
                            {actionInProgress ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

interface DrugFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (payload: DrugPayload) => Promise<void>
    loading: boolean
    error: string | null
    onError: (message: string | null) => void
    initialValues: DrugPayload
    mode: 'create' | 'edit'
}

function DrugFormDialog({ open, onOpenChange, onSubmit, loading, error, onError, initialValues, mode }: DrugFormDialogProps) {
    const [formState, setFormState] = useState<DrugPayload>(initialValues)
    const dialogKey = `${mode}-${initialValues.code}-${open ? 'open' : 'closed'}`

    const handleChange = (field: keyof DrugPayload, value: string | boolean | null) => {
        onError(null)
        setFormState((prev) => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        onError(null)
        if (!formState.code.trim() || !formState.genericNameEn.trim()) {
            return onError('Code and generic English name are required.')
        }
        await onSubmit({
            ...formState,
            code: formState.code.trim(),
            genericNameEn: formState.genericNameEn.trim(),
            genericNameAr: formState.genericNameAr.trim(),
            brandNameEn: formState.brandNameEn.trim(),
            brandNameAr: formState.brandNameAr.trim(),
            atcCode: formState.atcCode.trim(),
            description: formState.description.trim(),
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange} key={dialogKey}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? 'Update drug' : 'Add drug'}</DialogTitle>
                    <DialogDescription>
                        Provide the base attributes required to maintain the drug master data.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Code *</Label>
                        <Input
                            id="code"
                            value={formState.code}
                            onChange={(event) => handleChange('code', event.target.value.toUpperCase())}
                            placeholder="DRG-0001"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="atc">ATC Code</Label>
                        <Input
                            id="atc"
                            value={formState.atcCode}
                            onChange={(event) => handleChange('atcCode', event.target.value)}
                            placeholder="N02BE01"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="generic-en">Generic Name (EN) *</Label>
                        <Input
                            id="generic-en"
                            value={formState.genericNameEn}
                            onChange={(event) => handleChange('genericNameEn', event.target.value)}
                            placeholder="Paracetamol"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="generic-ar">Generic Name (AR)</Label>
                        <Input
                            id="generic-ar"
                            value={formState.genericNameAr}
                            onChange={(event) => handleChange('genericNameAr', event.target.value)}
                            placeholder="الاسم العلمي"
                            dir="rtl"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="brand-en">Brand Name (EN)</Label>
                        <Input
                            id="brand-en"
                            value={formState.brandNameEn}
                            onChange={(event) => handleChange('brandNameEn', event.target.value)}
                            placeholder="Panadol"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="brand-ar">Brand Name (AR)</Label>
                        <Input
                            id="brand-ar"
                            value={formState.brandNameAr}
                            onChange={(event) => handleChange('brandNameAr', event.target.value)}
                            placeholder="الاسم التجاري"
                            dir="rtl"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formState.description}
                            onChange={(event) => handleChange('description', event.target.value)}
                            rows={3}
                            placeholder="Clinical description and usage notes"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Flags</Label>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="otc"
                                    checked={formState.isOtc}
                                    onCheckedChange={(checked) => handleChange('isOtc', checked)}
                                />
                                <Label htmlFor="otc">OTC</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="controlled"
                                    checked={formState.isControlled}
                                    onCheckedChange={(checked) => handleChange('isControlled', checked)}
                                />
                                <Label htmlFor="controlled">Controlled</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="substitution"
                                    checked={formState.allowGenericSubstitution}
                                    onCheckedChange={(checked) => handleChange('allowGenericSubstitution', checked)}
                                />
                                <Label htmlFor="substitution">Allow substitution</Label>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="valid-from">Valid From</Label>
                        <Input
                            id="valid-from"
                            type="date"
                            value={formState.validFrom ?? ''}
                            onChange={(event) => handleChange('validFrom', event.target.value || null)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="valid-to">Valid To</Label>
                        <Input
                            id="valid-to"
                            type="date"
                            value={formState.validTo ?? ''}
                            onChange={(event) => handleChange('validTo', event.target.value || null)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="active"
                                checked={formState.isActive}
                                onCheckedChange={(checked) => handleChange('isActive', checked)}
                            />
                            <Label htmlFor="active">Active</Label>
                        </div>
                    </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => void handleSave()}
                        className="bg-tpa-primary hover:bg-tpa-accent"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : mode === 'edit' ? 'Update drug' : 'Create drug'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const EMPTY_DRUG_FORM: DrugFormPayload = {
    drugId: 0,
    dosageForm: '',
    route: '',
    strengthValue: 0,
    strengthUnit: '',
    isDefaultForm: false,
    validFrom: null,
    validTo: null,
    isActive: true,
}

interface DrugFormsPanelProps {
    drugId: number
}

function DrugFormsPanel({ drugId }: DrugFormsPanelProps) {
    const [forms, setForms] = useState<DrugForm[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formError, setFormError] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingForm, setEditingForm] = useState<DrugForm | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<DrugForm | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const loadForms = useCallback(async () => {
        if (!drugId) return
        setLoading(true)
        setError(null)
        try {
            const data = await fetchDrugForms(drugId)
            setForms(data)
        } catch (requestError) {
            console.error(requestError)
            setError(requestError instanceof Error ? requestError.message : 'Unable to load drug forms')
            setForms([])
        } finally {
            setLoading(false)
        }
    }, [drugId])

    useEffect(() => {
        void loadForms()
    }, [loadForms])

    const handleCreate = () => {
        setEditingForm(null)
        setFormError(null)
        setDialogOpen(true)
    }

    const handleEdit = (form: DrugForm) => {
        setEditingForm(form)
        setFormError(null)
        setDialogOpen(true)
    }

    const handleSubmit = async (payload: DrugFormPayload) => {
        setSaving(true)
        setFormError(null)
        try {
            if (editingForm) {
                await updateDrugForm(editingForm.id, payload)
            } else {
                await createDrugForm(payload)
            }
            setDialogOpen(false)
            await loadForms()
        } catch (submitError) {
            console.error(submitError)
            setFormError(submitError instanceof Error ? submitError.message : 'Unable to save drug form')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeletingId(deleteTarget.id)
        try {
            await deleteDrugForm(deleteTarget.id)
            setDeleteTarget(null)
            await loadForms()
        } catch (deleteError) {
            console.error(deleteError)
            setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete drug form')
        } finally {
            setDeletingId(null)
        }
    }

    const initialValues = editingForm ? mapDrugFormToPayload(editingForm, drugId) : { ...EMPTY_DRUG_FORM, drugId }
    const actionInProgress = saving || deletingId !== null

    return (
        <div className="bg-gray-50 border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <p className="text-sm font-semibold text-gray-800">Dosage Forms</p>
                    <p className="text-xs text-gray-600">Manage available strengths and routes for this drug.</p>
                </div>
                <Button size="sm" className="bg-tpa-primary hover:bg-tpa-accent" onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" /> Add Form
                </Button>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="bg-white rounded-md shadow border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Dosage Form</TableHead>
                            <TableHead>Route</TableHead>
                            <TableHead>Strength</TableHead>
                            <TableHead className="text-center">Default</TableHead>
                            <TableHead className="text-center">Validity</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-6 text-sm text-gray-500">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Loading forms...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : forms.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-6 text-sm text-gray-500">
                                    No dosage forms defined yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            forms.map((form) => (
                                <TableRow key={form.id} className="hover:bg-gray-50">
                                    <TableCell className="font-medium">{form.dosageForm || '—'}</TableCell>
                                    <TableCell>{form.route || '—'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold">{form.strengthValue || '—'}</span>
                                            <span className="text-sm text-gray-600">{form.strengthUnit || ''}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {form.isDefaultForm ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 px-2 py-1 text-xs font-semibold">
                                                <BadgeCheck className="h-3 w-3" /> Default
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-500">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center text-sm">
                                        {form.validFrom ? formatDate(form.validFrom) : '—'}
                                        <span className="block text-gray-500">
                                            {form.validTo ? formatDate(form.validTo) : 'Open-ended'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span
                                            className={cn(
                                                'inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold',
                                                form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700',
                                            )}
                                        >
                                            {form.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="outline" size="icon" onClick={() => handleEdit(form)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="destructive" size="icon" onClick={() => setDeleteTarget(form)}>
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

            <DrugFormEditorDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                loading={saving}
                error={formError}
                onError={setFormError}
                initialValues={initialValues}
                mode={editingForm ? 'edit' : 'create'}
            />

            <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Form</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the {deleteTarget?.dosageForm ?? 'form'} entry? This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={actionInProgress}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={actionInProgress}>
                            {actionInProgress ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

interface DrugFormEditorDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (payload: DrugFormPayload) => Promise<void>
    loading: boolean
    error: string | null
    onError: (message: string | null) => void
    initialValues: DrugFormPayload
    mode: 'create' | 'edit'
}

function DrugFormEditorDialog({
    open,
    onOpenChange,
    onSubmit,
    loading,
    error,
    onError,
    initialValues,
    mode,
}: DrugFormEditorDialogProps) {
    const [formState, setFormState] = useState<DrugFormPayload>(initialValues)
    const dialogKey = `${mode}-${initialValues.drugId}-${open ? 'open' : 'closed'}`

    const handleChange = (field: keyof DrugFormPayload, value: string | number | boolean | null) => {
        onError(null)
        setFormState((prev) => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        onError(null)
        if (!formState.dosageForm.trim() || !formState.route.trim() || !formState.strengthUnit.trim()) {
            return onError('Dosage form, route, and strength unit are required.')
        }
        if (!Number.isFinite(formState.strengthValue) || formState.strengthValue <= 0) {
            return onError('Strength value must be greater than zero.')
        }

        await onSubmit({
            ...formState,
            dosageForm: formState.dosageForm.trim(),
            route: formState.route.trim(),
            strengthUnit: formState.strengthUnit.trim(),
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange} key={dialogKey}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? 'Update form' : 'Add form'}</DialogTitle>
                    <DialogDescription>Define the dosage form, route, and strength for this drug.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="dosage-form">Dosage Form *</Label>
                        <Input
                            id="dosage-form"
                            value={formState.dosageForm}
                            onChange={(event) => handleChange('dosageForm', event.target.value.toUpperCase())}
                            placeholder="TAB / CAP / SYRUP"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="route">Route *</Label>
                        <Input
                            id="route"
                            value={formState.route}
                            onChange={(event) => handleChange('route', event.target.value.toUpperCase())}
                            placeholder="ORAL / IV / IM"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="strength-value">Strength Value *</Label>
                        <Input
                            id="strength-value"
                            type="number"
                            min="0"
                            value={formState.strengthValue}
                            onChange={(event) => handleChange('strengthValue', Number(event.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="strength-unit">Strength Unit *</Label>
                        <Input
                            id="strength-unit"
                            value={formState.strengthUnit}
                            onChange={(event) => handleChange('strengthUnit', event.target.value.toUpperCase())}
                            placeholder="MG / ML"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="form-valid-from">Valid From</Label>
                        <Input
                            id="form-valid-from"
                            type="date"
                            value={formState.validFrom ?? ''}
                            onChange={(event) => handleChange('validFrom', event.target.value || null)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="form-valid-to">Valid To</Label>
                        <Input
                            id="form-valid-to"
                            type="date"
                            value={formState.validTo ?? ''}
                            onChange={(event) => handleChange('validTo', event.target.value || null)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Flags</Label>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="default-form"
                                    checked={formState.isDefaultForm}
                                    onCheckedChange={(checked) => handleChange('isDefaultForm', checked)}
                                />
                                <Label htmlFor="default-form">Default form</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="form-active"
                                    checked={formState.isActive}
                                    onCheckedChange={(checked) => handleChange('isActive', checked)}
                                />
                                <Label htmlFor="form-active">Active</Label>
                            </div>
                        </div>
                    </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => void handleSave()}
                        className="bg-tpa-primary hover:bg-tpa-accent"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : mode === 'edit' ? 'Update form' : 'Create form'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface DrugDetailsSheetProps {
    drug: Drug | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit: () => void
    onDeleteRequest: (drug: Drug) => void
    deleting: boolean
}

function DrugDetailsSheet({ drug, open, onOpenChange, onEdit, onDeleteRequest, deleting }: DrugDetailsSheetProps) {
    if (!drug) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
                <SheetHeader className="space-y-1">
                    <SheetTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5 text-tpa-primary" /> {drug.genericNameEn || 'Drug details'}
                    </SheetTitle>
                    <SheetDescription>Review the master data for this drug.</SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="overview" className="mt-6">
                    <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="forms">Forms</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <DetailItem label="Code" value={drug.code} />
                            <DetailItem label="ATC Code" value={drug.atcCode || '—'} />
                            <DetailItem label="Generic (EN)" value={drug.genericNameEn || '—'} />
                            <DetailItem label="Generic (AR)" value={drug.genericNameAr || '—'} rtl />
                            <DetailItem label="Brand (EN)" value={drug.brandNameEn || '—'} />
                            <DetailItem label="Brand (AR)" value={drug.brandNameAr || '—'} rtl />
                            <DetailItem
                                label="Validity"
                                value={`${drug.validFrom ? formatDate(drug.validFrom) : '—'} → ${
                                    drug.validTo ? formatDate(drug.validTo) : 'Open-ended'
                                }`}
                            />
                            <DetailItem label="Created By" value={drug.createdBy || '—'} />
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500">Flags</p>
                            <div className="flex flex-wrap gap-2">
                                {drug.isOtc && (
                                    <Badge icon={BadgeCheck} label="OTC" className="bg-green-100 text-green-800" />
                                )}
                                {drug.isControlled && (
                                    <Badge icon={ShieldCheck} label="Controlled" className="bg-amber-100 text-amber-800" />
                                )}
                                {drug.allowGenericSubstitution ? (
                                    <Badge icon={Layers} label="Substitution allowed" className="bg-blue-100 text-blue-800" />
                                ) : (
                                    <Badge icon={Layers} label="No substitution" className="bg-gray-100 text-gray-700" />
                                )}
                                <Badge
                                    icon={CalendarRange}
                                    label={drug.isActive ? 'Active' : 'Inactive'}
                                    className={drug.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500">Description</p>
                            <p className="rounded-md border bg-gray-50 p-3 text-sm text-gray-700">
                                {drug.description || 'No description provided'}
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="forms" className="mt-4">
                        <DrugFormsPanel drugId={drug.id} />
                    </TabsContent>
                </Tabs>

                <div className="mt-6 flex items-center justify-between gap-3">
                    <Button variant="outline" onClick={onEdit}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button variant="destructive" onClick={() => onDeleteRequest(drug)} disabled={deleting}>
                        <Trash2 className="h-4 w-4 mr-2" /> {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

function DetailItem({ label, value, rtl = false }: { label: string; value: string; rtl?: boolean }) {
    return (
        <div className="flex flex-col space-y-1">
            <span className="text-xs font-semibold text-gray-500">{label}</span>
            <span className={cn('text-sm text-gray-800', rtl && 'text-right')} dir={rtl ? 'rtl' : undefined}>
                {value}
            </span>
        </div>
    )
}

function Badge({
    label,
    icon: Icon,
    className,
}: {
    label: string
    icon: ComponentType<{ className?: string }>
    className?: string
}) {
    return (
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold', className)}>
            <Icon className="h-3 w-3" />
            {label}
        </span>
    )
}

function mapDrugFormToPayload(form: DrugForm, drugId: number): DrugFormPayload {
    return {
        drugId,
        dosageForm: form.dosageForm,
        route: form.route,
        strengthValue: form.strengthValue,
        strengthUnit: form.strengthUnit,
        isDefaultForm: form.isDefaultForm,
        validFrom: form.validFrom,
        validTo: form.validTo,
        isActive: form.isActive,
    }
}

function mapDrugToPayload(drug: Drug): DrugPayload {
    return {
        code: drug.code,
        genericNameEn: drug.genericNameEn,
        genericNameAr: drug.genericNameAr,
        brandNameEn: drug.brandNameEn,
        brandNameAr: drug.brandNameAr,
        atcCode: drug.atcCode,
        description: drug.description,
        isControlled: drug.isControlled,
        isOtc: drug.isOtc,
        allowGenericSubstitution: drug.allowGenericSubstitution,
        validFrom: drug.validFrom,
        validTo: drug.validTo,
        isActive: drug.isActive,
    }
}
