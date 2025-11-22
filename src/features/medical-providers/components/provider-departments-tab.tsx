'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useProviderDepartments } from '../hooks/use-provider-departments'
import { fetchDepartments } from '@/lib/api/departments'
import { Department } from '@/types/department'

interface ProviderDepartmentsTabProps {
    providerId: number
}

export function ProviderDepartmentsTab({ providerId }: ProviderDepartmentsTabProps) {
    const { departments, pagination, isLoading, isSaving, error, load, create, remove, clearError } =
        useProviderDepartments(10)
    const [search, setSearch] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | number | null>(null)
    const [departmentOptions, setDepartmentOptions] = useState<SearchableSelectOption[]>([])
    const [departmentsLoading, setDepartmentsLoading] = useState(false)
    const [departmentsError, setDepartmentsError] = useState<string | null>(null)
    const [formError, setFormError] = useState<string | null>(null)

    useEffect(() => {
        clearError()
        if (providerId) {
            void load(providerId)
        }
    }, [providerId, load, clearError])

    const loadDepartments = useCallback(async () => {
        setDepartmentsLoading(true)
        setDepartmentsError(null)
        try {
            // Load a large number of departments for local filtering
            const response = await fetchDepartments({
                page: 0,
                size: 500,
            })
            const options: SearchableSelectOption[] = response.content.map((dept) => ({
                id: dept.id,
                label: dept.nameEn,
                subLabel: dept.code,
            }))
            setDepartmentOptions(options)
        } catch (err) {
            console.error('Failed to load departments', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to load departments'
            setDepartmentsError(errorMessage)
            setDepartmentOptions([])
        } finally {
            setDepartmentsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (isDialogOpen) {
            void loadDepartments()
        }
    }, [isDialogOpen, loadDepartments])

    const filteredDepartments = useMemo(() => {
        if (!search.trim()) return departments
        const term = search.toLowerCase()
        return departments.filter((item) =>
            [item.departmentCode, item.nameEn, item.nameAr].some((field) => field.toLowerCase().includes(term)),
        )
    }, [departments, search])

    const handleSubmit = async () => {
        if (!selectedDepartmentId) {
            setFormError('Please choose a department to assign.')
            return
        }

        setFormError(null)
        try {
            await create({ departmentId: Number(selectedDepartmentId) })
            setIsDialogOpen(false)
            setSelectedDepartmentId(null)
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Unable to assign department')
        }
    }

    const handleDialogOpenChange = (open: boolean) => {
        setIsDialogOpen(open)
        if (!open) {
            setSelectedDepartmentId(null)
            setFormError(null)
        }
    }

    const handleRemove = async (id: number) => {
        if (!window.confirm('Remove this department from the provider?')) return
        try {
            await remove(id)
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Unable to remove department')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Search by code or name"
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
                    <Button onClick={() => setIsDialogOpen(true)} className="bg-tpa-primary hover:bg-tpa-accent">
                        <Plus className="h-4 w-4 mr-2" /> Assign Department
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
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center w-32">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-6 text-center text-gray-500">
                                    Loading departments...
                                </TableCell>
                            </TableRow>
                        ) : filteredDepartments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-6 text-center text-gray-500">
                                    No departments found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredDepartments.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.departmentCode}</TableCell>
                                    <TableCell>{item.nameEn}</TableCell>
                                    <TableCell className="text-right">{item.nameAr}</TableCell>
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
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => handleRemove(item.id)}
                                            disabled={isSaving}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
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
                        Page {pagination.pageNumber + 1} of {pagination.totalPages} • {pagination.totalElements} departments
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
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Assign Department</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Department</Label>
                            <SearchableSelect
                                options={departmentOptions}
                                value={selectedDepartmentId ?? undefined}
                                onValueChange={(value) => setSelectedDepartmentId(value)}
                                placeholder="Search and select a department..."
                                disabled={isSaving}
                                loading={departmentsLoading}
                                error={departmentsError || undefined}
                                searchPlaceholder="Search by name or code..."
                                emptyMessage="No departments found"
                            />
                            {departmentsError && <p className="text-sm text-red-600">{departmentsError}</p>}
                        </div>
                        {formError && <p className="text-sm text-red-600">{formError}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSaving || departmentsLoading} className="bg-tpa-primary">
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
