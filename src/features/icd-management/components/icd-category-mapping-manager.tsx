'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { LinkIcon, Loader2, Plus, Search, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
    addIcdToCategory,
    fetchDiagnosisCategories,
    fetchIcdCategoryMappings,
    removeIcdFromCategory,
} from '@/lib/api/diagnosis-categories'
import { formatDate } from '@/lib/utils'
import { DiagnosisCategory, ICD, IcdCategoryMap } from '@/types'
import { searchIcds } from '@/lib/api/icd'

interface PageMetadata {
    totalPages: number
    totalElements: number
    numberOfElements: number
    first: boolean
    last: boolean
}

interface FeedbackState {
    type: 'success' | 'error'
    message: string
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

export function IcdCategoryMappingManager() {
    const [icdSearchTerm, setIcdSearchTerm] = useState('')
    const [icdResults, setIcdResults] = useState<ICD[]>([])
    const [selectedIcd, setSelectedIcd] = useState<ICD | null>(null)
    const [isSearchingIcd, setIsSearchingIcd] = useState(false)
    const [icdSearchError, setIcdSearchError] = useState<string | null>(null)

    const [mappings, setMappings] = useState<IcdCategoryMap[]>([])
    const [mapPage, setMapPage] = useState(0)
    const [mapPageSize, setMapPageSize] = useState(PAGE_SIZE_OPTIONS[0])
    const [mapMeta, setMapMeta] = useState<PageMetadata>({
        totalPages: 0,
        totalElements: 0,
        numberOfElements: 0,
        first: true,
        last: true,
    })
    const [mapLoading, setMapLoading] = useState(false)
    const [mapError, setMapError] = useState<string | null>(null)

    const [feedback, setFeedback] = useState<FeedbackState | null>(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [pendingRemoval, setPendingRemoval] = useState<IcdCategoryMap | null>(null)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [categoryOptions, setCategoryOptions] = useState<DiagnosisCategory[]>([])
    const [categoryOptionsLoading, setCategoryOptionsLoading] = useState(false)
    const [categoryFilter, setCategoryFilter] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

    const searchForIcds = useCallback(
        async (term: string) => {
            const keyword = term.trim()
            if (!keyword) {
                setIcdResults([])
                setIcdSearchError('Enter at least one character to search for ICD codes.')
                return
            }

            setIsSearchingIcd(true)
            setIcdSearchError(null)
            try {
                const results = await searchIcds(keyword)
                setIcdResults(results)
                if (results.length === 0) {
                    setIcdSearchError('No ICD codes matched your search.')
                }
            } catch (err) {
                setIcdResults([])
                setIcdSearchError(err instanceof Error ? err.message : 'Failed to search ICD codes.')
            } finally {
                setIsSearchingIcd(false)
            }
        },
        []
    )

    const loadMappings = useCallback(
        async (icd: ICD, page: number, size: number) => {
            setMapLoading(true)
            setMapError(null)
            try {
                const response = await fetchIcdCategoryMappings({ icdId: icd.id, page, size })
                setMappings(response.content ?? [])
                setMapMeta({
                    totalPages: response.totalPages,
                    totalElements: response.totalElements,
                    numberOfElements: response.numberOfElements,
                    first: response.first,
                    last: response.last,
                })
            } catch (err) {
                setMapError(err instanceof Error ? err.message : 'Failed to load ICD category mappings')
                setMappings([])
                setMapMeta({ totalPages: 0, totalElements: 0, numberOfElements: 0, first: true, last: true })
            } finally {
                setMapLoading(false)
            }
        },
        []
    )

    const refreshMappings = useCallback(async () => {
        if (!selectedIcd) {
            return
        }
        await loadMappings(selectedIcd, mapPage, mapPageSize)
    }, [loadMappings, mapPage, mapPageSize, selectedIcd])

    useEffect(() => {
        if (!selectedIcd) {
            return
        }
        void loadMappings(selectedIcd, mapPage, mapPageSize)
    }, [selectedIcd, mapPage, mapPageSize, loadMappings])

    const handleIcdSelect = (icd: ICD) => {
        setSelectedIcd(icd)
        setFeedback(null)
        setMapPage(0)
        setMapPageSize(PAGE_SIZE_OPTIONS[0])
    }

    const handleRemoveMapping = (mapping: IcdCategoryMap) => {
        setPendingRemoval(mapping)
    }

    const confirmRemoveMapping = async () => {
        if (!pendingRemoval || !selectedIcd) {
            return
        }

        setActionLoading(true)
        setFeedback(null)
        try {
            await removeIcdFromCategory(pendingRemoval.id.categoryId, pendingRemoval.id.icdId)
            setFeedback({ type: 'success', message: 'Mapping removed successfully.' })
            await refreshMappings()
        } catch (err) {
            setFeedback({
                type: 'error',
                message: err instanceof Error ? err.message : 'Failed to remove mapping.',
            })
        } finally {
            setActionLoading(false)
            setPendingRemoval(null)
        }
    }

    const cancelRemoveMapping = () => {
        if (actionLoading) {
            return
        }
        setPendingRemoval(null)
    }

    const filteredCategoryOptions = useMemo(() => {
        if (!categoryFilter.trim()) {
            return categoryOptions
        }
        const lowerFilter = categoryFilter.toLowerCase()
        return categoryOptions.filter((category) =>
            [category.code, category.nameEn, category.nameAr]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(lowerFilter))
        )
    }, [categoryFilter, categoryOptions])

    const openDialog = () => {
        if (!selectedIcd) {
            return
        }

        setIsDialogOpen(true)
        setSelectedCategoryId('')
        setCategoryFilter('')
        if (categoryOptions.length === 0) {
            setCategoryOptionsLoading(true)
            fetchDiagnosisCategories({ page: 0, size: 50 })
                .then((response) => {
                    setCategoryOptions(response.content ?? [])
                })
                .catch((error) => {
                    setFeedback({
                        type: 'error',
                        message:
                            error instanceof Error
                                ? error.message
                                : 'Failed to load diagnosis categories for selection.',
                    })
                })
                .finally(() => setCategoryOptionsLoading(false))
        }
    }

    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open)
        if (!open) {
            setSelectedCategoryId('')
            setCategoryFilter('')
        }
    }

    const handleAddMapping = async () => {
        if (!selectedIcd || !selectedCategoryId) {
            return
        }

        setActionLoading(true)
        setFeedback(null)
        try {
            await addIcdToCategory(Number(selectedCategoryId), selectedIcd.id)
            setFeedback({ type: 'success', message: 'ICD successfully linked to the category.' })
            handleDialogChange(false)
            await refreshMappings()
        } catch (err) {
            setFeedback({
                type: 'error',
                message: err instanceof Error ? err.message : 'Failed to link ICD to the selected category.',
            })
        } finally {
            setActionLoading(false)
        }
    }

    const totalMappingsLabel = `${mapMeta.numberOfElements} of ${mapMeta.totalElements} records`

    return (
        <div className="space-y-6">
            {feedback && (
                <div
                    className={`rounded-md border px-4 py-3 text-sm ${
                        feedback.type === 'success'
                            ? 'border-green-200 bg-green-50 text-green-800'
                            : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                >
                    {feedback.message}
                </div>
            )}

            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search ICD by code or name"
                                value={icdSearchTerm}
                                onChange={(event) => setIcdSearchTerm(event.target.value)}
                                className="pl-10"
                                aria-label="Search ICD codes for mapping"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => void searchForIcds(icdSearchTerm)}
                            disabled={isSearchingIcd}
                        >
                            {isSearchingIcd ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
                                </>
                            ) : (
                                'Search'
                            )}
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <Label className="text-sm font-medium text-gray-600">Selected ICD</Label>
                        <div className="rounded-md border px-3 py-2 text-sm text-gray-700">
                            {selectedIcd ? (
                                <span>
                                    {selectedIcd.code} — {selectedIcd.nameEn}
                                </span>
                            ) : (
                                <span className="text-gray-400">Choose an ICD to manage mappings</span>
                            )}
                        </div>
                    </div>
                </div>

                {icdSearchError && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {icdSearchError}
                    </div>
                )}

                {icdResults.length > 0 && (
                    <div className="rounded-md border border-gray-200">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>System</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {icdResults.map((result) => (
                                    <TableRow key={result.id} className="hover:bg-gray-50">
                                        <TableCell>{result.systemCode}</TableCell>
                                        <TableCell className="font-medium">{result.code}</TableCell>
                                        <TableCell>{result.nameEn}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant={selectedIcd?.id === result.id ? 'default' : 'outline'}
                                                onClick={() => handleIcdSelect(result)}
                                            >
                                                {selectedIcd?.id === result.id ? 'Selected' : 'Select'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Mappings</h3>
                        <p className="text-sm text-gray-500">
                            Link ICD records to curated diagnosis categories for reporting and analytics.
                        </p>
                    </div>
                    <Button
                        onClick={openDialog}
                        disabled={!selectedIcd || actionLoading}
                        className="bg-tpa-primary hover:bg-tpa-accent"
                    >
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Add Mapping
                    </Button>
                </div>

                {!selectedIcd ? (
                    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-500">
                        Search and select an ICD record to review its category associations.
                    </div>
                ) : mapLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading mappings...
                    </div>
                ) : mapError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {mapError}
                    </div>
                ) : mappings.length === 0 ? (
                    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-500">
                        No mappings found for the selected ICD yet.
                    </div>
                ) : (
                    <div className="rounded-md border border-gray-200">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Category Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Effective</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mappings.map((mapping) => (
                                    <TableRow key={`${mapping.id.icdId}-${mapping.id.categoryId}`} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">{mapping.category.code}</TableCell>
                                        <TableCell>{mapping.category.nameEn}</TableCell>
                                        <TableCell className="text-xs text-gray-600">
                                            {mapping.effectiveFrom && <div>From {formatDate(mapping.effectiveFrom)}</div>}
                                            {mapping.effectiveTo && <div>To {formatDate(mapping.effectiveTo)}</div>}
                                            {!mapping.effectiveFrom && !mapping.effectiveTo && <div>Not specified</div>}
                                        </TableCell>
                                        <TableCell>
                                            <span className={mapping.isActive ? 'text-green-600' : 'text-gray-500'}>
                                                {mapping.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveMapping(mapping)}
                                                disabled={actionLoading}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {selectedIcd && mappings.length > 0 && (
                    <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMapPage((prev) => Math.max(prev - 1, 0))}
                                disabled={mapMeta.first || mapLoading}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMapPage((prev) => prev + 1)}
                                disabled={mapMeta.last || mapLoading}
                            >
                                Next
                            </Button>
                            <span>
                                Page {mapPage + 1} of {Math.max(mapMeta.totalPages, 1)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>{totalMappingsLabel}</span>
                            <Select
                                value={String(mapPageSize)}
                                onValueChange={(value) => {
                                    setMapPageSize(Number(value))
                                    setMapPage(0)
                                }}
                            >
                                <SelectTrigger className="w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZE_OPTIONS.map((sizeOption) => (
                                        <SelectItem key={sizeOption} value={String(sizeOption)}>
                                            {sizeOption}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Link ICD to Diagnosis Category</DialogTitle>
                        <DialogDescription>
                            Choose a diagnosis category to associate with {selectedIcd?.code} ({selectedIcd?.nameEn}).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="categoryFilter">Filter categories</Label>
                            <Input
                                id="categoryFilter"
                                placeholder="Type to filter by code or name"
                                value={categoryFilter}
                                onChange={(event) => setCategoryFilter(event.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="categorySelect">Diagnosis Category *</Label>
                            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                <SelectTrigger id="categorySelect">
                                    <SelectValue placeholder={categoryOptionsLoading ? 'Loading categories...' : 'Select category'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryOptionsLoading ? (
                                        <SelectItem value="loading" disabled>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                                        </SelectItem>
                                    ) : filteredCategoryOptions.length === 0 ? (
                                        <SelectItem value="none" disabled>
                                            No categories available
                                        </SelectItem>
                                    ) : (
                                        filteredCategoryOptions.map((category) => (
                                            <SelectItem key={category.id} value={String(category.id)}>
                                                {category.code} — {category.nameEn}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleDialogChange(false)} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddMapping}
                            disabled={!selectedCategoryId || actionLoading}
                            className="bg-tpa-primary hover:bg-tpa-accent"
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Link Category
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(pendingRemoval)} onOpenChange={(open) => !open && cancelRemoveMapping()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remove Mapping</DialogTitle>
                        <DialogDescription>
                            This action will unlink the diagnosis category from the selected ICD. You can re-create the
                            mapping later if needed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p>
                            ICD: <span className="font-medium text-gray-900">{selectedIcd?.code}</span>
                        </p>
                        <p>
                            Category: <span className="font-medium text-gray-900">{pendingRemoval?.category.nameEn}</span>
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={cancelRemoveMapping} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => void confirmRemoveMapping()}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing...
                                </>
                            ) : (
                                'Remove'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
