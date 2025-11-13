'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Download, Upload, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { formatDate, cn } from '@/lib/utils'
import { LookupCategory, LookupRecord, AgeGroupRecord } from '@/types'
import { useMasterLookups } from '../hooks/use-master-lookups'
import type { CreateLookupPayload } from '../services/master-lookup-service'

type LookupFormState = CreateLookupPayload

interface LookupTableColumn {
    id: string
    header: string
    className?: string
    cell: (item: LookupRecord) => React.ReactNode
}

interface LookupCategoryConfig {
    value: LookupCategory
    label: string
    singularLabel: string
    description: string
    searchableFields: string[]
    columns: LookupTableColumn[]
    createInitialFormState: () => LookupFormState
}

const baseLookupColumns: LookupTableColumn[] = [
    {
        id: 'code',
        header: 'Code',
        className: 'w-32 font-medium',
        cell: (item) => item.code || '-',
    },
    {
        id: 'nameEn',
        header: 'Name (EN)',
        cell: (item) => item.nameEn || '-',
    },
    {
        id: 'nameAr',
        header: 'Name (AR)',
        className: 'text-right',
        cell: (item) => item.nameAr || '-',
    },
]

const ageGroupColumns: LookupTableColumn[] = [
    {
        id: 'code',
        header: 'Code',
        className: 'w-24 font-medium',
        cell: (item) => item.code || '-',
    },
    {
        id: 'nameEn',
        header: 'Name (EN)',
        cell: (item) => item.nameEn || '-',
    },
    {
        id: 'nameAr',
        header: 'Name (AR)',
        className: 'text-right',
        cell: (item) => item.nameAr || '-',
    },
    {
        id: 'minAgeYears',
        header: 'Min Age',
        className: 'w-24 text-center',
        cell: (item) => (isAgeGroupRecord(item) && item.minAgeYears !== null ? item.minAgeYears : '-'),
    },
    {
        id: 'maxAgeYears',
        header: 'Max Age',
        className: 'w-24 text-center',
        cell: (item) => (isAgeGroupRecord(item) && item.maxAgeYears !== null ? item.maxAgeYears : '-'),
    },
    {
        id: 'effectiveFrom',
        header: 'Effective From',
        className: 'w-32 text-center',
        cell: (item) =>
            isAgeGroupRecord(item) && item.effectiveFrom ? formatDate(item.effectiveFrom) : '-',
    },
    {
        id: 'effectiveTo',
        header: 'Effective To',
        className: 'w-32 text-center',
        cell: (item) =>
            isAgeGroupRecord(item) && item.effectiveTo ? formatDate(item.effectiveTo) : '-',
    },
    {
        id: 'isActive',
        header: 'Status',
        className: 'w-28 text-center',
        cell: (item) =>
            isAgeGroupRecord(item) ? (
                <span
                    className={cn(
                        'inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium',
                        item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
                    )}
                >
                    {item.isActive ? 'Active' : 'Inactive'}
                </span>
            ) : (
                '-'
            ),
    },
]

const createDefaultFormState = (): LookupFormState => ({
    code: '',
    nameEn: '',
    nameAr: '',
})

const createAgeGroupFormState = (): LookupFormState => ({
    code: '',
    nameEn: '',
    nameAr: '',
    minAgeYears: 0,
    maxAgeYears: 0,
    isActive: true,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: null,
})

const lookupCategoryConfigs: LookupCategoryConfig[] = [
    {
        value: 'uoms',
        label: 'Units of Measure',
        singularLabel: 'Unit of Measure',
        description: 'Standard units used across the application',
        searchableFields: ['code', 'nameEn', 'nameAr'],
        columns: baseLookupColumns,
        createInitialFormState: createDefaultFormState,
    },
    {
        value: 'service-types',
        label: 'Service Types',
        singularLabel: 'Service Type',
        description: 'Categories describing the type of healthcare service',
        searchableFields: ['code', 'nameEn', 'nameAr'],
        columns: baseLookupColumns,
        createInitialFormState: createDefaultFormState,
    },
    {
        value: 'service-categories',
        label: 'Service Categories',
        singularLabel: 'Service Category',
        description: 'Groups for classifying offered services',
        searchableFields: ['code', 'nameEn', 'nameAr'],
        columns: baseLookupColumns,
        createInitialFormState: createDefaultFormState,
    },
    {
        value: 'provider-types',
        label: 'Provider Types',
        singularLabel: 'Provider Type',
        description: 'Types of medical providers available in the network',
        searchableFields: ['code', 'nameEn', 'nameAr'],
        columns: baseLookupColumns,
        createInitialFormState: createDefaultFormState,
    },
    {
        value: 'genders',
        label: 'Genders',
        singularLabel: 'Gender',
        description: 'Gender values referenced across records',
        searchableFields: ['code', 'nameEn', 'nameAr'],
        columns: baseLookupColumns,
        createInitialFormState: createDefaultFormState,
    },
    {
        value: 'facility-levels',
        label: 'Facility Levels',
        singularLabel: 'Facility Level',
        description: 'Facility levels for accreditation and pricing rules',
        searchableFields: ['code', 'nameEn', 'nameAr'],
        columns: baseLookupColumns,
        createInitialFormState: createDefaultFormState,
    },
    {
        value: 'currencies',
        label: 'Currencies',
        singularLabel: 'Currency',
        description: 'Supported currencies for pricing and reporting',
        searchableFields: ['code', 'nameEn', 'nameAr'],
        columns: baseLookupColumns,
        createInitialFormState: createDefaultFormState,
    },
    {
        value: 'countries',
        label: 'Countries',
        singularLabel: 'Country',
        description: 'Country references for locations and regulations',
        searchableFields: ['code', 'nameEn', 'nameAr'],
        columns: baseLookupColumns,
        createInitialFormState: createDefaultFormState,
    },
    {
        value: 'age-groups',
        label: 'Age Groups',
        singularLabel: 'Age Group',
        description: 'Defined age groups used in eligibility and pricing rules',
        searchableFields: ['code', 'nameEn', 'nameAr'],
        columns: ageGroupColumns,
        createInitialFormState: createAgeGroupFormState,
    },
]

export function LookupManagementPage() {
    const [selectedCategory, setSelectedCategory] = useState<LookupCategory>(lookupCategoryConfigs[0].value)
    const { records, isLoading, fetchError, loadRecords, createRecord, isSaving, clearError } =
        useMasterLookups()
    const isSubmitting = isSaving
    const [searchTerm, setSearchTerm] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState<LookupFormState>(lookupCategoryConfigs[0].createInitialFormState())
    const [formError, setFormError] = useState<string | null>(null)

    const categoryConfig = useMemo(
        () => lookupCategoryConfigs.find((config) => config.value === selectedCategory),
        [selectedCategory],
    )

    const columns = categoryConfig?.columns ?? []
    const columnCount = Math.max(columns.length, 1)

    useEffect(() => {
        clearError()
        void loadRecords(selectedCategory)
        setFormData(categoryConfig?.createInitialFormState() ?? createDefaultFormState())
        setFormError(null)
        setSearchTerm('')
    }, [selectedCategory, categoryConfig, loadRecords, clearError])

    const filteredLookups = useMemo(() => {
        if (!searchTerm) {
            return records
        }

        const term = searchTerm.toLowerCase()
        const fields = categoryConfig?.searchableFields ?? []

        return records.filter((record) => {
            return fields.some((field) => {
                // @ts-ignore
                const value = (record as Record<string, unknown>)[field]

                if (typeof value === 'string') {
                    return value.toLowerCase().includes(term)
                }

                if (typeof value === 'number') {
                    return value.toString().includes(term)
                }

                return false
            })
        })
    }, [records, searchTerm, categoryConfig])

    const handleAdd = () => {
        setFormData(categoryConfig?.createInitialFormState() ?? createDefaultFormState())
        setFormError(null)
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        if (!formData.code.trim() || !formData.nameEn.trim() || !formData.nameAr.trim()) {
            setFormError('Code, English name, and Arabic name are required.')
            return
        }

        if (selectedCategory === 'age-groups') {
            if (formData.minAgeYears === null || formData.minAgeYears === undefined) {
                setFormError('Minimum age is required for age groups.')
                return
            }

            if (formData.maxAgeYears === null || formData.maxAgeYears === undefined) {
                setFormError('Maximum age is required for age groups.')
                return
            }

            if (formData.maxAgeYears < formData.minAgeYears) {
                setFormError('Maximum age must be greater than or equal to minimum age.')
                return
            }
        }

        setFormError(null)

        try {
            await createRecord(selectedCategory, formData)
            setIsDialogOpen(false)
            setFormData(categoryConfig?.createInitialFormState() ?? createDefaultFormState())
        } catch (error) {
            console.error('Failed to save lookup record', error)
            setFormError(error instanceof Error ? error.message : 'Failed to save lookup record')
        }
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Lookup Management</h1>
                <p className="text-gray-600">Manage master data values used across the platform</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Database className="h-6 w-6 text-tpa-primary" />
                        <div>
                            <h2 className="text-lg font-semibold">{categoryConfig?.label}</h2>
                            <p className="text-sm text-gray-600">{categoryConfig?.description}</p>
                        </div>
                    </div>
                    <Select
                        value={selectedCategory}
                        onValueChange={(value) => setSelectedCategory(value as LookupCategory)}
                    >
                        <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {lookupCategoryConfigs.map((config) => (
                                <SelectItem key={config.value} value={config.value}>
                                    {config.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={`Search ${categoryConfig?.label.toLowerCase() ?? 'lookup values'}...`}
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="pl-10 w-64"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Import
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button
                            onClick={handleAdd}
                            className="bg-tpa-primary hover:bg-tpa-accent"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add {categoryConfig?.singularLabel}
                        </Button>
                    </div>
                </div>
                {fetchError && (
                    <p className="mt-4 text-sm text-red-600">{fetchError}</p>
                )}
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead key={column.id} className={column.className}>
                                    {column.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columnCount} className="py-6 text-center text-sm text-gray-500">
                                    Loading {categoryConfig?.label.toLowerCase() ?? 'lookup values'}...
                                </TableCell>
                            </TableRow>
                        ) : filteredLookups.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columnCount} className="py-6 text-center text-sm text-gray-500">
                                    {fetchError
                                        ? 'Unable to load lookup values at the moment.'
                                        : `No ${categoryConfig?.label.toLowerCase()} found`}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLookups.map((lookup) => (
                                <TableRow key={lookup.id} className="hover:bg-gray-50">
                                    {columns.map((column) => (
                                        <TableCell key={column.id} className={column.className}>
                                            {column.cell(lookup)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add {categoryConfig?.singularLabel}</DialogTitle>
                        <DialogDescription>
                            Provide the details below to create a new {categoryConfig?.singularLabel.toLowerCase()} entry.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Code *</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            code: event.target.value.toUpperCase(),
                                        }))
                                    }
                                    placeholder="Enter code"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nameEn">Name (English) *</Label>
                                <Input
                                    id="nameEn"
                                    value={formData.nameEn}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            nameEn: event.target.value,
                                        }))
                                    }
                                    placeholder="Enter English name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nameAr">Name (Arabic) *</Label>
                                <Input
                                    id="nameAr"
                                    value={formData.nameAr}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            nameAr: event.target.value,
                                        }))
                                    }
                                    placeholder="أدخل الاسم بالعربية"
                                    dir="rtl"
                                />
                            </div>

                            {selectedCategory === 'age-groups' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="minAgeYears">Minimum Age (years) *</Label>
                                        <Input
                                            id="minAgeYears"
                                            type="number"
                                            min={0}
                                            value={formData.minAgeYears ?? ''}
                                            onChange={(event) =>
                                                setFormData((previous) => ({
                                                    ...previous,
                                                    minAgeYears:
                                                        event.target.value === ''
                                                            ? null
                                                            : Number(event.target.value),
                                                }))
                                            }
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxAgeYears">Maximum Age (years) *</Label>
                                        <Input
                                            id="maxAgeYears"
                                            type="number"
                                            min={0}
                                            value={formData.maxAgeYears ?? ''}
                                            onChange={(event) =>
                                                setFormData((previous) => ({
                                                    ...previous,
                                                    maxAgeYears:
                                                        event.target.value === ''
                                                            ? null
                                                            : Number(event.target.value),
                                                }))
                                            }
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="effectiveFrom">Effective From</Label>
                                        <Input
                                            id="effectiveFrom"
                                            type="date"
                                            value={formData.effectiveFrom ?? ''}
                                            onChange={(event) =>
                                                setFormData((previous) => ({
                                                    ...previous,
                                                    effectiveFrom: event.target.value || null,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="effectiveTo">Effective To</Label>
                                        <Input
                                            id="effectiveTo"
                                            type="date"
                                            value={formData.effectiveTo ?? ''}
                                            onChange={(event) =>
                                                setFormData((previous) => ({
                                                    ...previous,
                                                    effectiveTo: event.target.value || null,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="isActive"
                                            checked={formData.isActive ?? true}
                                            onCheckedChange={(checked) =>
                                                setFormData((previous) => ({
                                                    ...previous,
                                                    isActive: checked,
                                                }))
                                            }
                                        />
                                        <Label htmlFor="isActive">Active</Label>
                                    </div>
                                </>
                            )}
                        </div>

                        {formError && <p className="text-sm text-red-600">{formError}</p>}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="bg-tpa-primary hover:bg-tpa-accent"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function isAgeGroupRecord(record: LookupRecord): record is AgeGroupRecord {
    return 'minAgeYears' in record
}
