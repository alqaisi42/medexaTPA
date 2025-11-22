'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useProviderDoctors } from '../hooks/use-provider-doctors'
import { fetchDoctors } from '@/lib/api/doctors'
import { Doctor } from '@/types/doctor'
import { ProviderDoctor } from '@/types/provider'

interface ProviderDoctorsTabProps {
    providerId: number
}

const joinTypeOptions = ['FULL_TIME', 'PART_TIME', 'VISITING', 'ON_CALL']

export function ProviderDoctorsTab({ providerId }: ProviderDoctorsTabProps) {
    const { doctors, pagination, isLoading, isSaving, error, load, create, update, remove, clearError } =
        useProviderDoctors(10)
    const [search, setSearch] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [doctorOptions, setDoctorOptions] = useState<SearchableSelectOption[]>([])
    const [doctorsLoading, setDoctorsLoading] = useState(false)
    const [doctorsError, setDoctorsError] = useState<string | null>(null)
    const [formError, setFormError] = useState<string | null>(null)
    const [formState, setFormState] = useState<{ doctorId: string | number | null; joinType: string; notes: string; isActive: boolean }>(
        {
            doctorId: null,
            joinType: '',
            notes: '',
            isActive: true,
        },
    )
    const [editingRecord, setEditingRecord] = useState<ProviderDoctor | null>(null)

    useEffect(() => {
        clearError()
        if (providerId) {
            void load(providerId)
        }
    }, [providerId, load, clearError])

    const loadDoctors = useCallback(async () => {
        setDoctorsLoading(true)
        setDoctorsError(null)
        try {
            // Load a large number of doctors for local filtering
            const response = await fetchDoctors({
                page: 0,
                size: 500,
            })
            const options: SearchableSelectOption[] = response.content.map((doctor: Doctor) => ({
                id: doctor.id,
                label: doctor.nameEn,
                subLabel: `${doctor.code}${doctor.specialtyNameEn ? ` • ${doctor.specialtyNameEn}` : ''}`,
            }))
            setDoctorOptions(options)
        } catch (err) {
            console.error('Failed to load doctors', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to load doctors'
            setDoctorsError(errorMessage)
            setDoctorOptions([])
        } finally {
            setDoctorsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (isDialogOpen) {
            void loadDoctors()
        }
    }, [isDialogOpen, loadDoctors])

    const filteredDoctors = useMemo(() => {
        if (!search.trim()) return doctors
        const term = search.toLowerCase()
        return doctors.filter((item) =>
            [item.doctorCode, item.doctorNameEn, item.doctorNameAr].some((field) => field?.toLowerCase().includes(term)),
        )
    }, [doctors, search])

    const openCreateDialog = () => {
        setEditingRecord(null)
        setFormState({ doctorId: null, joinType: '', notes: '', isActive: true })
        setFormError(null)
        setIsDialogOpen(true)
    }

    const openEditDialog = (record: ProviderDoctor) => {
        setEditingRecord(record)
        setFormState({
            doctorId: record.doctorId,
            joinType: record.joinType ?? '',
            notes: record.notes ?? '',
            isActive: record.isActive,
        })
        setFormError(null)
        setIsDialogOpen(true)
    }

    const handleDialogOpenChange = (open: boolean) => {
        setIsDialogOpen(open)
        if (!open) {
            setEditingRecord(null)
            setFormState({ doctorId: null, joinType: '', notes: '', isActive: true })
            setFormError(null)
        }
    }

    const handleSubmit = async () => {
        if (!formState.doctorId) {
            setFormError('Please select a doctor')
            return
        }

        setFormError(null)
        try {
            if (editingRecord) {
                await update(editingRecord.id, {
                    joinType: formState.joinType || null,
                    notes: formState.notes || null,
                    isActive: formState.isActive,
                })
            } else {
                await create({ doctorId: Number(formState.doctorId), joinType: formState.joinType, notes: formState.notes })
            }
            setIsDialogOpen(false)
            setEditingRecord(null)
            setFormState({ doctorId: null, joinType: '', notes: '', isActive: true })
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Unable to save doctor assignment')
        }
    }

    const handleRemove = async (id: number) => {
        if (!window.confirm('Remove this doctor from the provider?')) return
        try {
            await remove(id)
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Unable to remove doctor')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Search by doctor name or code"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-72"
                    />
                    <Button variant="outline" size="sm" onClick={() => load(providerId)} disabled={isLoading}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    {error && <span className="text-sm text-red-600">{error}</span>}
                    <Button onClick={openCreateDialog} className="bg-tpa-primary hover:bg-tpa-accent">
                        <Plus className="h-4 w-4 mr-2" /> Assign Doctor
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border border-gray-100 overflow-hidden bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-36">Code</TableHead>
                            <TableHead>Name (EN)</TableHead>
                            <TableHead className="text-right">Name (AR)</TableHead>
                            <TableHead>Main Specialty</TableHead>
                            <TableHead className="text-center">Join Type</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-6 text-center text-gray-500">
                                    Loading doctors...
                                </TableCell>
                            </TableRow>
                        ) : filteredDoctors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-6 text-center text-gray-500">
                                    No doctors found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredDoctors.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.doctorCode}</TableCell>
                                    <TableCell>{item.doctorNameEn}</TableCell>
                                    <TableCell className="text-right">{item.doctorNameAr}</TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <div className="font-medium">{item.mainSpecialtyNameEn ?? '-'}</div>
                                            <div className="text-gray-500">{item.mainSpecialtyId ?? '-'}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center text-sm">{item.joinType || '-'}</TableCell>
                                    <TableCell className="text-center">
                                        <span
                                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                item.isActive
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {item.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => handleRemove(item.id)}
                                                disabled={isSaving}
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

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <div>
                        Page {pagination.pageNumber + 1} of {pagination.totalPages} • {pagination.totalElements} doctors
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

            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingRecord ? 'Edit Doctor Assignment' : 'Assign Doctor'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Doctor</Label>
                            <SearchableSelect
                                options={doctorOptions}
                                value={formState.doctorId ?? undefined}
                                onValueChange={(value) => setFormState((prev) => ({ ...prev, doctorId: value }))}
                                placeholder="Search and select a doctor..."
                                disabled={isSaving || Boolean(editingRecord)}
                                loading={doctorsLoading}
                                error={doctorsError || undefined}
                                searchPlaceholder="Search by name, code, or specialty..."
                                emptyMessage="No doctors found"
                            />
                            {doctorsError && <p className="text-sm text-red-600">{doctorsError}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Join Type</Label>
                            <Select
                                value={formState.joinType}
                                onValueChange={(value) => setFormState((prev) => ({ ...prev, joinType: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select join type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Not specified</SelectItem>
                                    {joinTypeOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option.replace('_', ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={formState.notes}
                                onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                                placeholder="Additional notes"
                            />
                        </div>
                        {editingRecord && (
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={formState.isActive}
                                    onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))}
                                />
                                <span className="text-sm">Active</span>
                            </div>
                        )}
                        {formError && <p className="text-sm text-red-600 md:col-span-2">{formError}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSaving || doctorsLoading} className="bg-tpa-primary">
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
