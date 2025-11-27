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
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { assignDrugCategory, fetchDrugCategories, removeDrugCategory } from '@/lib/api/drug-category-map'
import { fetchCategoriesTree } from '@/lib/api/drug-categories'
import { fetchDrugs } from '@/lib/api/drugs'
import { formatDate } from '@/lib/utils'
import { Drug, DrugCategory, DrugCategoryAssignment, DrugCategoryTreeItem } from '@/types'

interface FeedbackState {
    type: 'success' | 'error'
    message: string
}

// Helper function to flatten category tree
function flattenCategories(tree: DrugCategoryTreeItem[]): DrugCategory[] {
    const result: DrugCategory[] = []
    function traverse(items: DrugCategoryTreeItem[]) {
        for (const item of items) {
            result.push({
                id: item.id,
                code: item.code,
                nameEn: item.nameEn,
                nameAr: item.nameAr,
                parentId: item.parentId,
                level: item.level,
                isActive: item.isActive,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            })
            if (item.children && item.children.length > 0) {
                traverse(item.children)
            }
        }
    }
    traverse(tree)
    return result
}

// Extended assignment with category details
interface DrugCategoryAssignmentWithDetails extends DrugCategoryAssignment {
    category?: DrugCategory
}

export function DrugCategoryMappingManager() {
    const [drugSearchTerm, setDrugSearchTerm] = useState('')
    const [drugResults, setDrugResults] = useState<Drug[]>([])
    const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null)
    const [isSearchingDrug, setIsSearchingDrug] = useState(false)
    const [drugSearchError, setDrugSearchError] = useState<string | null>(null)

    const [mappings, setMappings] = useState<DrugCategoryAssignmentWithDetails[]>([])
    const [mappingsLoading, setMappingsLoading] = useState(false)
    const [mappingsError, setMappingsError] = useState<string | null>(null)

    const [feedback, setFeedback] = useState<FeedbackState | null>(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [pendingRemoval, setPendingRemoval] = useState<DrugCategoryAssignmentWithDetails | null>(null)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [categoryOptions, setCategoryOptions] = useState<DrugCategory[]>([])
    const [categoryOptionsLoading, setCategoryOptionsLoading] = useState(false)
    const [categoryFilter, setCategoryFilter] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
    const [isPrimary, setIsPrimary] = useState(false)
    const [validFrom, setValidFrom] = useState<string>('')
    const [validTo, setValidTo] = useState<string>('')

    const searchForDrugs = useCallback(
        async (term: string) => {
            const keyword = term.trim()
            if (!keyword) {
                setDrugResults([])
                setDrugSearchError('Enter at least one character to search for drugs.')
                return
            }

            setIsSearchingDrug(true)
            setDrugSearchError(null)
            try {
                // Search drugs by fetching and filtering client-side
                // In a real scenario, you might want a dedicated search endpoint
                const response = await fetchDrugs({ page: 0, size: 50 })
                const allDrugs = response.content
                const filtered = allDrugs.filter((drug) => {
                    const searchLower = keyword.toLowerCase()
                    return (
                        drug.code.toLowerCase().includes(searchLower) ||
                        drug.genericNameEn.toLowerCase().includes(searchLower) ||
                        drug.brandNameEn.toLowerCase().includes(searchLower) ||
                        drug.atcCode.toLowerCase().includes(searchLower)
                    )
                })
                setDrugResults(filtered)
                if (filtered.length === 0) {
                    setDrugSearchError('No drugs matched your search.')
                }
            } catch (err) {
                setDrugResults([])
                setDrugSearchError(err instanceof Error ? err.message : 'Failed to search drugs.')
            } finally {
                setIsSearchingDrug(false)
            }
        },
        []
    )

    const loadMappings = useCallback(
        async (drug: Drug) => {
            setMappingsLoading(true)
            setMappingsError(null)
            try {
                const assignments = await fetchDrugCategories(drug.id)
                // Fetch category details for each assignment
                const categoryTree = await fetchCategoriesTree()
                const allCategories = flattenCategories(categoryTree)
                const categoryMap = new Map(allCategories.map((cat) => [cat.id, cat]))

                const mappingsWithDetails: DrugCategoryAssignmentWithDetails[] = assignments.map((assignment) => ({
                    ...assignment,
                    category: categoryMap.get(assignment.categoryId),
                }))

                setMappings(mappingsWithDetails)
            } catch (err) {
                setMappingsError(err instanceof Error ? err.message : 'Failed to load drug category mappings')
                setMappings([])
            } finally {
                setMappingsLoading(false)
            }
        },
        []
    )

    const refreshMappings = useCallback(async () => {
        if (!selectedDrug) {
            return
        }
        await loadMappings(selectedDrug)
    }, [loadMappings, selectedDrug])

    useEffect(() => {
        if (!selectedDrug) {
            return
        }
        void loadMappings(selectedDrug)
    }, [selectedDrug, loadMappings])

    const handleDrugSelect = (drug: Drug) => {
        setSelectedDrug(drug)
        setFeedback(null)
    }

    const handleRemoveMapping = (mapping: DrugCategoryAssignmentWithDetails) => {
        setPendingRemoval(mapping)
    }

    const confirmRemoveMapping = async () => {
        if (!pendingRemoval || !selectedDrug) {
            return
        }

        setActionLoading(true)
        setFeedback(null)
        try {
            await removeDrugCategory(selectedDrug.id, pendingRemoval.categoryId)
            setFeedback({ type: 'success', message: 'Category assignment removed successfully.' })
            await refreshMappings()
        } catch (err) {
            setFeedback({
                type: 'error',
                message: err instanceof Error ? err.message : 'Failed to remove category assignment.',
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
        if (!selectedDrug) {
            return
        }

        setIsDialogOpen(true)
        setSelectedCategoryId('')
        setCategoryFilter('')
        setIsPrimary(false)
        setValidFrom('')
        setValidTo('')
        if (categoryOptions.length === 0) {
            setCategoryOptionsLoading(true)
            fetchCategoriesTree()
                .then((tree) => {
                    const flattened = flattenCategories(tree)
                    setCategoryOptions(flattened.filter((cat) => cat.isActive))
                })
                .catch((error) => {
                    setFeedback({
                        type: 'error',
                        message:
                            error instanceof Error
                                ? error.message
                                : 'Failed to load drug categories for selection.',
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
            setIsPrimary(false)
            setValidFrom('')
            setValidTo('')
        }
    }

    const handleAddMapping = async () => {
        if (!selectedDrug || !selectedCategoryId) {
            return
        }

        setActionLoading(true)
        setFeedback(null)
        try {
            await assignDrugCategory({
                drugId: selectedDrug.id,
                categoryId: Number(selectedCategoryId),
                isPrimary,
                validFrom: validFrom || null,
                validTo: validTo || null,
            })
            setFeedback({ type: 'success', message: 'Category successfully assigned to drug.' })
            handleDialogChange(false)
            await refreshMappings()
        } catch (err) {
            setFeedback({
                type: 'error',
                message: err instanceof Error ? err.message : 'Failed to assign category to drug.',
            })
        } finally {
            setActionLoading(false)
        }
    }

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
                                placeholder="Search drug by code, name, or ATC code"
                                value={drugSearchTerm}
                                onChange={(event) => setDrugSearchTerm(event.target.value)}
                                className="pl-10"
                                aria-label="Search drugs for category mapping"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => void searchForDrugs(drugSearchTerm)}
                            disabled={isSearchingDrug}
                        >
                            {isSearchingDrug ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
                                </>
                            ) : (
                                'Search'
                            )}
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <Label className="text-sm font-medium text-gray-600">Selected Drug</Label>
                        <div className="rounded-md border px-3 py-2 text-sm text-gray-700">
                            {selectedDrug ? (
                                <span>
                                    {selectedDrug.code} — {selectedDrug.genericNameEn || selectedDrug.brandNameEn}
                                </span>
                            ) : (
                                <span className="text-gray-400">Choose a drug to manage category assignments</span>
                            )}
                        </div>
                    </div>
                </div>

                {drugSearchError && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {drugSearchError}
                    </div>
                )}

                {drugResults.length > 0 && (
                    <div className="rounded-md border border-gray-200">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Generic Name</TableHead>
                                    <TableHead>Brand Name</TableHead>
                                    <TableHead>ATC Code</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {drugResults.map((result) => (
                                    <TableRow key={result.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">{result.code}</TableCell>
                                        <TableCell>{result.genericNameEn}</TableCell>
                                        <TableCell>{result.brandNameEn}</TableCell>
                                        <TableCell>{result.atcCode || '—'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant={selectedDrug?.id === result.id ? 'default' : 'outline'}
                                                onClick={() => handleDrugSelect(result)}
                                            >
                                                {selectedDrug?.id === result.id ? 'Selected' : 'Select'}
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
                        <h3 className="text-lg font-semibold">Category Assignments</h3>
                        <p className="text-sm text-gray-500">
                            Assign drug categories to organize and classify drugs for reporting and analytics.
                        </p>
                    </div>
                    <Button
                        onClick={openDialog}
                        disabled={!selectedDrug || actionLoading}
                        className="bg-tpa-primary hover:bg-tpa-accent"
                    >
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Assign Category
                    </Button>
                </div>

                {!selectedDrug ? (
                    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-500">
                        Search and select a drug to review its category assignments.
                    </div>
                ) : mappingsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading assignments...
                    </div>
                ) : mappingsError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {mappingsError}
                    </div>
                ) : mappings.length === 0 ? (
                    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-500">
                        No category assignments found for the selected drug yet.
                    </div>
                ) : (
                    <div className="rounded-md border border-gray-200">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Category Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Primary</TableHead>
                                    <TableHead>Validity</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mappings.map((mapping) => (
                                    <TableRow key={`${mapping.drugId}-${mapping.categoryId}`} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">
                                            {mapping.category?.code || `Category ${mapping.categoryId}`}
                                        </TableCell>
                                        <TableCell>
                                            {mapping.category?.nameEn || 'Unknown category'}
                                        </TableCell>
                                        <TableCell>
                                            {mapping.isPrimary ? (
                                                <span className="text-green-600 font-medium">Primary</span>
                                            ) : (
                                                <span className="text-gray-500">Secondary</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-600">
                                            {mapping.validFrom && <div>From {formatDate(mapping.validFrom)}</div>}
                                            {mapping.validTo && <div>To {formatDate(mapping.validTo)}</div>}
                                            {!mapping.validFrom && !mapping.validTo && <div>Not specified</div>}
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
            </div>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Assign Category to Drug</DialogTitle>
                        <DialogDescription>
                            Choose a drug category to assign to {selectedDrug?.code} ({selectedDrug?.genericNameEn || selectedDrug?.brandNameEn}).
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
                            <Label htmlFor="categorySelect">Drug Category *</Label>
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
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isPrimary"
                                checked={isPrimary}
                                onCheckedChange={setIsPrimary}
                            />
                            <Label htmlFor="isPrimary" className="cursor-pointer">
                                Mark as primary category
                            </Label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="validFrom">Valid From (optional)</Label>
                                <Input
                                    id="validFrom"
                                    type="date"
                                    value={validFrom}
                                    onChange={(event) => setValidFrom(event.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="validTo">Valid To (optional)</Label>
                                <Input
                                    id="validTo"
                                    type="date"
                                    value={validTo}
                                    onChange={(event) => setValidTo(event.target.value)}
                                />
                            </div>
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
                                    Assign Category
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(pendingRemoval)} onOpenChange={(open) => !open && cancelRemoveMapping()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remove Category Assignment</DialogTitle>
                        <DialogDescription>
                            This action will remove the category assignment from the selected drug. You can re-assign it later if needed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p>
                            Drug: <span className="font-medium text-gray-900">{selectedDrug?.code}</span>
                        </p>
                        <p>
                            Category: <span className="font-medium text-gray-900">{pendingRemoval?.category?.nameEn || `Category ${pendingRemoval?.categoryId}`}</span>
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

