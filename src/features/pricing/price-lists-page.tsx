'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatDate } from '@/lib/utils'
import {
    createDrugPriceList,
    deleteDrugPriceList,
    fetchDrugPriceLists,
    updateDrugPriceList,
} from '@/lib/api/drug-price-lists'
import { DrugPriceList, DrugPriceListPayload } from '@/types'

const EMPTY_PRICE_LIST: DrugPriceListPayload = {
    code: '',
    nameEn: '',
    nameAr: '',
    currency: 'USD',
    isDefault: false,
    validFrom: null,
    validTo: null,
}

const CURRENCIES = ['USD', 'EUR', 'JOD', 'SAR', 'AED', 'EGP']

export function PriceListsPage() {
    const [priceLists, setPriceLists] = useState<DrugPriceList[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dialogError, setDialogError] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<DrugPriceList | null>(null)
    const [editing, setEditing] = useState<DrugPriceList | null>(null)

    const loadLists = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchDrugPriceLists()
            setPriceLists(data)
        } catch (requestError) {
            console.error(requestError)
            setError(requestError instanceof Error ? requestError.message : 'Unable to load price lists')
            setPriceLists([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadLists()
    }, [loadLists])

    const initialValues = useMemo<DrugPriceListPayload>(() => {
        if (editing) {
            return {
                code: editing.code,
                nameEn: editing.nameEn,
                nameAr: editing.nameAr,
                currency: editing.currency || 'USD',
                isDefault: editing.isDefault,
                validFrom: editing.validFrom,
                validTo: editing.validTo,
            }
        }
        return { ...EMPTY_PRICE_LIST }
    }, [editing])

    const handleSubmit = async (payload: DrugPriceListPayload) => {
        setSaving(true)
        setDialogError(null)
        try {
            if (!payload.code.trim() || !payload.nameEn.trim()) {
                setDialogError('Code and English name are required')
                return
            }

            if (editing) {
                await updateDrugPriceList(editing.id, payload)
            } else {
                await createDrugPriceList(payload)
            }
            setDialogOpen(false)
            await loadLists()
        } catch (submitError) {
            console.error(submitError)
            setDialogError(submitError instanceof Error ? submitError.message : 'Unable to save price list')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setSaving(true)
        try {
            await deleteDrugPriceList(deleteTarget.id)
            setDeleteTarget(null)
            await loadLists()
        } catch (deleteError) {
            console.error(deleteError)
            setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete price list')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Drug Price Lists</h1>
                        <p className="text-sm text-gray-600">Manage list definitions, currencies, validity, and defaults.</p>
                    </div>
                    <Button
                        className="bg-tpa-primary hover:bg-tpa-accent"
                        onClick={() => {
                            setEditing(null)
                            setDialogError(null)
                            setDialogOpen(true)
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" /> Add Price List
                    </Button>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="rounded-lg border bg-white">
                <div className="flex items-center justify-between px-4 py-2 border-b text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> Pricing catalogs
                    </div>
                    {loading && (
                        <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                        </div>
                    )}
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name (EN)</TableHead>
                            <TableHead>Name (AR)</TableHead>
                            <TableHead className="text-center">Currency</TableHead>
                            <TableHead className="text-center">Validity</TableHead>
                            <TableHead className="text-center">Default</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {priceLists.length === 0 && !loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-6">
                                    No price lists defined yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            priceLists.map((list) => (
                                <TableRow key={list.id} className="hover:bg-gray-50">
                                    <TableCell className="font-semibold">{list.code || '—'}</TableCell>
                                    <TableCell>{list.nameEn || '—'}</TableCell>
                                    <TableCell>{list.nameAr || '—'}</TableCell>
                                    <TableCell className="text-center">{list.currency || '—'}</TableCell>
                                    <TableCell className="text-center text-sm">
                                        {list.validFrom ? formatDate(list.validFrom) : '—'}
                                        <span className="block text-gray-500">{list.validTo ? formatDate(list.validTo) : 'Open-ended'}</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span
                                            className={cn(
                                                'inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold',
                                                list.isDefault ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700',
                                            )}
                                        >
                                            {list.isDefault ? 'Default' : '—'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setEditing(list)
                                                    setDialogError(null)
                                                    setDialogOpen(true)
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button variant="destructive" size="icon" onClick={() => setDeleteTarget(list)}>
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

            <PriceListDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (!open) {
                        setEditing(null)
                    }
                }}
                onSubmit={handleSubmit}
                loading={saving}
                error={dialogError}
                initialValues={initialValues}
                mode={editing ? 'edit' : 'create'}
            />

            <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete price list</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {deleteTarget?.code ?? 'this price list'}? This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => void handleDelete()} disabled={saving}>
                            {saving ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

interface PriceListDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (payload: DrugPriceListPayload) => Promise<void>
    loading: boolean
    error: string | null
    initialValues: DrugPriceListPayload
    mode: 'create' | 'edit'
}

function PriceListDialog({ open, onOpenChange, onSubmit, loading, error, initialValues, mode }: PriceListDialogProps) {
    const [formState, setFormState] = useState<DrugPriceListPayload>(initialValues)

    useEffect(() => {
        setFormState(initialValues)
    }, [initialValues])

    const handleChange = (field: keyof DrugPriceListPayload, value: string | boolean | null) => {
        setFormState((prev) => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        if (!formState.code.trim() || !formState.nameEn.trim()) {
            return
        }
        await onSubmit({
            ...formState,
            code: formState.code.trim().toUpperCase(),
            nameEn: formState.nameEn.trim(),
            nameAr: formState.nameAr.trim(),
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? 'Update price list' : 'Add price list'}</DialogTitle>
                    <DialogDescription>Configure pricing catalogs and currencies for packs.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="pl-code">Code *</Label>
                        <Input
                            id="pl-code"
                            value={formState.code}
                            onChange={(event) => handleChange('code', event.target.value)}
                            placeholder="PL-2025"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pl-currency">Currency *</Label>
                        <Select value={formState.currency} onValueChange={(value) => handleChange('currency', value)}>
                            <SelectTrigger id="pl-currency">
                                <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map((currency) => (
                                    <SelectItem key={currency} value={currency}>
                                        {currency}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pl-name-en">Name (EN) *</Label>
                        <Input
                            id="pl-name-en"
                            value={formState.nameEn}
                            onChange={(event) => handleChange('nameEn', event.target.value)}
                            placeholder="Standard Price List"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pl-name-ar">Name (AR)</Label>
                        <Input
                            id="pl-name-ar"
                            value={formState.nameAr}
                            onChange={(event) => handleChange('nameAr', event.target.value)}
                            placeholder="الأسعار"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pl-valid-from">Valid From</Label>
                        <Input
                            id="pl-valid-from"
                            type="date"
                            value={formState.validFrom ?? ''}
                            onChange={(event) => handleChange('validFrom', event.target.value || null)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pl-valid-to">Valid To</Label>
                        <Input
                            id="pl-valid-to"
                            type="date"
                            value={formState.validTo ?? ''}
                            onChange={(event) => handleChange('validTo', event.target.value || null)}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Flags</Label>
                        <div className="flex items-center gap-3">
                            <Switch
                                id="pl-default"
                                checked={formState.isDefault}
                                onCheckedChange={(checked) => handleChange('isDefault', checked)}
                            />
                            <Label htmlFor="pl-default" className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Set as default list
                            </Label>
                        </div>
                    </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button className="bg-tpa-primary hover:bg-tpa-accent" onClick={() => void handleSave()} disabled={loading}>
                        {loading ? 'Saving...' : mode === 'edit' ? 'Update' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
