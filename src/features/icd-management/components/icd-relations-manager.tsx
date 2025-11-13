'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, LinkIcon, Loader2, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'

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
    createIcdRelation,
    deleteIcdRelation,
    fetchIcdNeighbors,
    fetchIcdRelations,
    fetchIcdRelationsByIcd,
    fetchIcdRelationTypes,
} from '@/lib/api/icd-relations'
import { searchIcds } from '@/lib/api/icd'
import { formatDate } from '@/lib/utils'
import { CreateIcdRelationPayload, ICD, IcdRelation, IcdRelationType } from '@/types'

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

export function IcdRelationsManager() {
    const [feedback, setFeedback] = useState<FeedbackState | null>(null)

    const [relations, setRelations] = useState<IcdRelation[]>([])
    const [relationsPage, setRelationsPage] = useState(0)
    const [relationsPageSize, setRelationsPageSize] = useState(PAGE_SIZE_OPTIONS[0])
    const [relationsMeta, setRelationsMeta] = useState<PageMetadata>({
        totalPages: 0,
        totalElements: 0,
        numberOfElements: 0,
        first: true,
        last: true,
    })
    const [relationsLoading, setRelationsLoading] = useState(false)
    const [relationsError, setRelationsError] = useState<string | null>(null)

    const [icdSearchTerm, setIcdSearchTerm] = useState('')
    const [icdSearchResults, setIcdSearchResults] = useState<ICD[]>([])
    const [isSearchingIcd, setIsSearchingIcd] = useState(false)
    const [icdSearchError, setIcdSearchError] = useState<string | null>(null)
    const [selectedIcd, setSelectedIcd] = useState<ICD | null>(null)

    const [neighbors, setNeighbors] = useState<ICD[]>([])
    const [neighborsLoading, setNeighborsLoading] = useState(false)
    const [neighborsError, setNeighborsError] = useState<string | null>(null)

    const [icdRelations, setIcdRelations] = useState<IcdRelation[]>([])
    const [icdRelationsPage, setIcdRelationsPage] = useState(0)
    const [icdRelationsPageSize, setIcdRelationsPageSize] = useState(PAGE_SIZE_OPTIONS[0])
    const [icdRelationsMeta, setIcdRelationsMeta] = useState<PageMetadata>({
        totalPages: 0,
        totalElements: 0,
        numberOfElements: 0,
        first: true,
        last: true,
    })
    const [icdRelationsLoading, setIcdRelationsLoading] = useState(false)
    const [icdRelationsError, setIcdRelationsError] = useState<string | null>(null)

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)

    const [sourceSearchTerm, setSourceSearchTerm] = useState('')
    const [sourceResults, setSourceResults] = useState<ICD[]>([])
    const [sourceLoading, setSourceLoading] = useState(false)
    const [sourceError, setSourceError] = useState<string | null>(null)
    const [selectedSourceIcd, setSelectedSourceIcd] = useState<ICD | null>(null)

    const [targetSearchTerm, setTargetSearchTerm] = useState('')
    const [targetResults, setTargetResults] = useState<ICD[]>([])
    const [targetLoading, setTargetLoading] = useState(false)
    const [targetError, setTargetError] = useState<string | null>(null)
    const [selectedTargetIcd, setSelectedTargetIcd] = useState<ICD | null>(null)

    const [relationTypes, setRelationTypes] = useState<IcdRelationType[]>([])
    const [relationTypesLoading, setRelationTypesLoading] = useState(false)
    const [relationTypesError, setRelationTypesError] = useState<string | null>(null)
    const [selectedRelationTypeCode, setSelectedRelationTypeCode] = useState('')

    const [note, setNote] = useState('')
    const [effectiveFrom, setEffectiveFrom] = useState('')
    const [effectiveTo, setEffectiveTo] = useState('')

    const [pendingDelete, setPendingDelete] = useState<IcdRelation | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const defaultPageMeta = useMemo<PageMetadata>(
        () => ({
            totalPages: 0,
            totalElements: 0,
            numberOfElements: 0,
            first: true,
            last: true,
        }),
        []
    )

    const handleApiError = useCallback((error: unknown): string => {
        return error instanceof Error ? error.message : 'Unexpected error communicating with ICD relations service'
    }, [])

    const loadRelations = useCallback(
        async (page: number, size: number) => {
            setRelationsLoading(true)
            setRelationsError(null)
            try {
                const response = await fetchIcdRelations({ page, size })
                setRelations(response.content ?? [])
                setRelationsMeta({
                    totalPages: response.totalPages,
                    totalElements: response.totalElements,
                    numberOfElements: response.numberOfElements,
                    first: response.first,
                    last: response.last,
                })
            } catch (error) {
                setRelations([])
                setRelationsMeta(defaultPageMeta)
                setRelationsError(handleApiError(error))
            } finally {
                setRelationsLoading(false)
            }
        },
        [defaultPageMeta, handleApiError]
    )

    const loadSelectedIcdRelations = useCallback(
        async (icd: ICD, page: number, size: number) => {
            setIcdRelationsLoading(true)
            setIcdRelationsError(null)
            try {
                const response = await fetchIcdRelationsByIcd(icd.id, { page, size })
                setIcdRelations(response.content ?? [])
                setIcdRelationsMeta({
                    totalPages: response.totalPages,
                    totalElements: response.totalElements,
                    numberOfElements: response.numberOfElements,
                    first: response.first,
                    last: response.last,
                })
            } catch (error) {
                setIcdRelations([])
                setIcdRelationsMeta(defaultPageMeta)
                setIcdRelationsError(handleApiError(error))
            } finally {
                setIcdRelationsLoading(false)
            }
        },
        [defaultPageMeta, handleApiError]
    )

    const loadNeighbors = useCallback(
        async (icd: ICD) => {
            setNeighborsLoading(true)
            setNeighborsError(null)
            try {
                const neighborResults = await fetchIcdNeighbors(icd.id)
                setNeighbors(neighborResults)
            } catch (error) {
                setNeighbors([])
                setNeighborsError(handleApiError(error))
            } finally {
                setNeighborsLoading(false)
            }
        },
        [handleApiError]
    )

    const refreshSelectedIcdData = useCallback(async () => {
        if (!selectedIcd) {
            return
        }
        await Promise.all([
            loadSelectedIcdRelations(selectedIcd, icdRelationsPage, icdRelationsPageSize),
            loadNeighbors(selectedIcd),
        ])
    }, [selectedIcd, icdRelationsPage, icdRelationsPageSize, loadSelectedIcdRelations, loadNeighbors])

    const searchForIcds = useCallback(
        async (term: string) => {
            const keyword = term.trim()
            if (!keyword) {
                setIcdSearchResults([])
                setIcdSearchError('Enter at least one character to search for ICD codes.')
                return
            }

            setIsSearchingIcd(true)
            setIcdSearchError(null)
            try {
                const results = await searchIcds(keyword)
                setIcdSearchResults(results)
                if (results.length === 0) {
                    setIcdSearchError('No ICD codes matched your search.')
                }
            } catch (error) {
                setIcdSearchResults([])
                setIcdSearchError(handleApiError(error))
            } finally {
                setIsSearchingIcd(false)
            }
        },
        [handleApiError]
    )

    const loadRelationTypes = useCallback(async () => {
        setRelationTypesLoading(true)
        setRelationTypesError(null)
        try {
            const types = await fetchIcdRelationTypes()
            setRelationTypes(types)
        } catch (error) {
            setRelationTypes([])
            setRelationTypesError(handleApiError(error))
        } finally {
            setRelationTypesLoading(false)
        }
    }, [handleApiError])

    const searchSourceIcds = useCallback(
        async (term: string) => {
            const keyword = term.trim()
            if (!keyword) {
                setSourceResults([])
                setSourceError('Enter at least one character to search for ICD codes.')
                return
            }

            setSourceLoading(true)
            setSourceError(null)
            try {
                const results = await searchIcds(keyword)
                setSourceResults(results)
                if (results.length === 0) {
                    setSourceError('No ICD codes matched your search.')
                }
            } catch (error) {
                setSourceResults([])
                setSourceError(handleApiError(error))
            } finally {
                setSourceLoading(false)
            }
        },
        [handleApiError]
    )

    const searchTargetIcds = useCallback(
        async (term: string) => {
            const keyword = term.trim()
            if (!keyword) {
                setTargetResults([])
                setTargetError('Enter at least one character to search for ICD codes.')
                return
            }

            setTargetLoading(true)
            setTargetError(null)
            try {
                const results = await searchIcds(keyword)
                setTargetResults(results)
                if (results.length === 0) {
                    setTargetError('No ICD codes matched your search.')
                }
            } catch (error) {
                setTargetResults([])
                setTargetError(handleApiError(error))
            } finally {
                setTargetLoading(false)
            }
        },
        [handleApiError]
    )

    const openCreateDialog = (source?: ICD) => {
        if (source) {
            setSelectedSourceIcd(source)
            setSourceSearchTerm(`${source.code} ${source.nameEn}`)
        } else {
            setSelectedSourceIcd(null)
            setSourceSearchTerm('')
        }
        setSourceResults([])
        setSourceError(null)
        setSelectedTargetIcd(null)
        setTargetSearchTerm('')
        setTargetResults([])
        setTargetError(null)
        setSelectedRelationTypeCode('')
        setNote('')
        setEffectiveFrom('')
        setEffectiveTo('')
        setIsCreateDialogOpen(true)
        setCreateError(null)
        setFeedback(null)
        if (relationTypes.length === 0) {
            void loadRelationTypes()
        }
    }

    const resetCreateDialog = () => {
        setIsCreateDialogOpen(false)
        setCreateLoading(false)
        setCreateError(null)
        setSourceSearchTerm('')
        setSourceResults([])
        setSourceError(null)
        setSelectedSourceIcd(null)
        setTargetSearchTerm('')
        setTargetResults([])
        setTargetError(null)
        setSelectedTargetIcd(null)
        setSelectedRelationTypeCode('')
        setNote('')
        setEffectiveFrom('')
        setEffectiveTo('')
    }

    const handleCreateRelation = async () => {
        if (!selectedSourceIcd) {
            setCreateError('Select a source ICD code to continue.')
            return
        }
        if (!selectedTargetIcd) {
            setCreateError('Select a target ICD code to continue.')
            return
        }
        if (selectedSourceIcd.id === selectedTargetIcd.id) {
            setCreateError('Source and target ICD codes must be different.')
            return
        }
        if (!selectedRelationTypeCode) {
            setCreateError('Choose a relation type.')
            return
        }
        if (effectiveFrom && effectiveTo && effectiveTo < effectiveFrom) {
            setCreateError('Effective to date cannot be before the effective from date.')
            return
        }

        const payload: CreateIcdRelationPayload = {
            sourceIcdId: selectedSourceIcd.id,
            targetIcdId: selectedTargetIcd.id,
            relationTypeCode: selectedRelationTypeCode,
            note: note.trim() ? note.trim() : undefined,
            effectiveFrom: effectiveFrom || undefined,
            effectiveTo: effectiveTo || undefined,
        }

        setCreateLoading(true)
        setCreateError(null)
        try {
            await createIcdRelation(payload)
            setFeedback({ type: 'success', message: 'Relation created successfully.' })
            resetCreateDialog()
            await Promise.all([loadRelations(relationsPage, relationsPageSize), refreshSelectedIcdData()])
        } catch (error) {
            setCreateError(handleApiError(error))
        } finally {
            setCreateLoading(false)
        }
    }

    const handleDeleteRelation = async () => {
        if (!pendingDelete) {
            return
        }
        setDeleteLoading(true)
        try {
            await deleteIcdRelation(pendingDelete.id)
            setFeedback({ type: 'success', message: 'Relation removed successfully.' })
            setPendingDelete(null)
            await Promise.all([loadRelations(relationsPage, relationsPageSize), refreshSelectedIcdData()])
        } catch (error) {
            setFeedback({ type: 'error', message: handleApiError(error) })
        } finally {
            setDeleteLoading(false)
        }
    }

    const closeDeleteDialog = () => {
        if (deleteLoading) {
            return
        }
        setPendingDelete(null)
    }

    const selectedIcdLabel = selectedIcd ? `${selectedIcd.code} — ${selectedIcd.nameEn}` : 'Choose an ICD code'

    const neighborsSummary = neighbors.map((neighbor) => `${neighbor.code} — ${neighbor.nameEn}`).join(', ')

    useEffect(() => {
        void loadRelations(relationsPage, relationsPageSize)
    }, [relationsPage, relationsPageSize, loadRelations])

    useEffect(() => {
        if (!selectedIcd) {
            setIcdRelations([])
            setNeighbors([])
            setIcdRelationsMeta(defaultPageMeta)
            setNeighborsError(null)
            setIcdRelationsError(null)
            return
        }

        void loadSelectedIcdRelations(selectedIcd, icdRelationsPage, icdRelationsPageSize)
        void loadNeighbors(selectedIcd)
    }, [
        selectedIcd,
        icdRelationsPage,
        icdRelationsPageSize,
        loadSelectedIcdRelations,
        loadNeighbors,
        defaultPageMeta,
    ])

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">ICD Relations Network</h2>
                <p className="text-sm text-gray-600">
                    Explore semantic links between ICD codes to support grouping, authorization, pricing, and fraud
                    strategies.
                </p>
            </div>

            {feedback && (
                <div
                    className={`rounded-md border px-4 py-3 text-sm ${
                        feedback.type === 'success'
                            ? 'border-green-200 bg-green-50 text-green-700'
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
                                aria-label="Search ICD codes"
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <div className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-900">Selected ICD: </span>
                            {selectedIcd ? selectedIcdLabel : 'None'}
                        </div>
                        {selectedIcd && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void refreshSelectedIcdData()}
                                disabled={icdRelationsLoading || neighborsLoading}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> Refresh data
                            </Button>
                        )}
                    </div>
                </div>

                {icdSearchError && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {icdSearchError}
                    </div>
                )}

                {icdSearchResults.length > 0 && (
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
                                {icdSearchResults.map((result) => (
                                    <TableRow key={result.id} className="hover:bg-gray-50">
                                        <TableCell>{result.systemCode}</TableCell>
                                        <TableCell className="font-medium">{result.code}</TableCell>
                                        <TableCell>{result.nameEn}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant={selectedIcd?.id === result.id ? 'default' : 'outline'}
                                                onClick={() => {
                                                    setSelectedIcd(result)
                                                    setFeedback(null)
                                                    setIcdRelationsPage(0)
                                                }}
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

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="bg-white rounded-lg shadow p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Direct Relations</h3>
                            <p className="text-sm text-gray-500">
                                Relations where the selected ICD participates as source or target.
                            </p>
                        </div>
                        <Button
                            onClick={() => openCreateDialog(selectedIcd ?? undefined)}
                            disabled={!selectedIcd}
                            className="bg-tpa-primary hover:bg-tpa-accent"
                        >
                            <LinkIcon className="mr-2 h-4 w-4" /> Link ICDs
                        </Button>
                    </div>

                    {!selectedIcd ? (
                        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-500">
                            Select an ICD code to explore its relation graph.
                        </div>
                    ) : icdRelationsLoading ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading relations...
                        </div>
                    ) : icdRelationsError ? (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {icdRelationsError}
                        </div>
                    ) : icdRelations.length === 0 ? (
                        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-500">
                            No relations found for the selected ICD yet.
                        </div>
                    ) : (
                        <div className="rounded-md border border-gray-200">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Source ICD</TableHead>
                                        <TableHead>Target ICD</TableHead>
                                        <TableHead>Relation Type</TableHead>
                                        <TableHead>Effective</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {icdRelations.map((relation) => (
                                        <TableRow key={relation.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {relation.sourceIcd.code}
                                                </div>
                                                <div className="text-xs text-gray-600">{relation.sourceIcd.nameEn}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {relation.targetIcd.code}
                                                </div>
                                                <div className="text-xs text-gray-600">{relation.targetIcd.nameEn}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {relation.relationType.nameEn || relation.relationType.code}
                                                </div>
                                                <div className="text-xs text-gray-600">{relation.relationType.code}</div>
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-600">
                                                {relation.effectiveFrom && <div>From {formatDate(relation.effectiveFrom)}</div>}
                                                {relation.effectiveTo && <div>To {formatDate(relation.effectiveTo)}</div>}
                                                {!relation.effectiveFrom && !relation.effectiveTo && <div>Not specified</div>}
                                            </TableCell>
                                            <TableCell>
                                                <span className={relation.isActive ? 'text-green-600' : 'text-gray-500'}>
                                                    {relation.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setPendingDelete(relation)}
                                                    disabled={deleteLoading}
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

                    {selectedIcd && icdRelations.length > 0 && (
                        <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIcdRelationsPage((prev) => Math.max(prev - 1, 0))}
                                    disabled={icdRelationsMeta.first || icdRelationsLoading}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIcdRelationsPage((prev) => prev + 1)}
                                    disabled={icdRelationsMeta.last || icdRelationsLoading}
                                >
                                    Next
                                </Button>
                                <span>
                                    Page {icdRelationsPage + 1} of {Math.max(icdRelationsMeta.totalPages, 1)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>
                                    {icdRelationsMeta.numberOfElements} of {icdRelationsMeta.totalElements} records
                                </span>
                                <Select
                                    value={String(icdRelationsPageSize)}
                                    onValueChange={(value) => {
                                        setIcdRelationsPageSize(Number(value))
                                        setIcdRelationsPage(0)
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

                <div className="bg-white rounded-lg shadow p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Connected ICDs</h3>
                            <p className="text-sm text-gray-500">
                                Immediate neighbors discovered through direct relations.
                            </p>
                        </div>
                        {selectedIcd && neighbors.length > 0 && (
                            <div className="rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-600">
                                {neighbors.length} related codes
                            </div>
                        )}
                    </div>

                    {!selectedIcd ? (
                        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-500">
                            Select an ICD to reveal its neighboring codes.
                        </div>
                    ) : neighborsLoading ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading neighbors...
                        </div>
                    ) : neighborsError ? (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {neighborsError}
                        </div>
                    ) : neighbors.length === 0 ? (
                        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-500">
                            This ICD is not linked to any neighbors yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {neighbors.map((neighbor) => (
                                <div
                                    key={neighbor.id}
                                    className="rounded-md border border-gray-200 px-4 py-3 text-sm hover:border-tpa-primary"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-gray-900">{neighbor.code}</div>
                                            <div className="text-gray-600">{neighbor.nameEn}</div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedIcd(neighbor)
                                                setFeedback(null)
                                                setIcdRelationsPage(0)
                                            }}
                                        >
                                            Inspect
                                        </Button>
                                    </div>
                                    {neighbor.systemCode && (
                                        <div className="mt-2 text-xs text-gray-500">System: {neighbor.systemCode}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedIcd && neighbors.length > 0 && (
                        <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                            <span className="font-medium text-gray-900">Quick summary:</span> {neighborsSummary}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">All Relations</h3>
                        <p className="text-sm text-gray-500">
                            Review the complete relations catalogue and maintain the semantic network across ICD codes.
                        </p>
                    </div>
                    <Button className="bg-tpa-primary hover:bg-tpa-accent" onClick={() => openCreateDialog()}>
                        <Plus className="mr-2 h-4 w-4" /> New relation
                    </Button>
                </div>

                {relationsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading relations...
                    </div>
                ) : relationsError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {relationsError}
                    </div>
                ) : relations.length === 0 ? (
                    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-500">
                        No ICD relations recorded yet. Start by linking codes together.
                    </div>
                ) : (
                    <div className="rounded-md border border-gray-200">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Source ICD</TableHead>
                                    <TableHead>Target ICD</TableHead>
                                    <TableHead>Relation Type</TableHead>
                                    <TableHead>Note</TableHead>
                                    <TableHead>Effective</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {relations.map((relation) => (
                                    <TableRow key={relation.id} className="hover:bg-gray-50">
                                        <TableCell>
                                            <div className="text-sm font-medium text-gray-900">{relation.sourceIcd.code}</div>
                                            <div className="text-xs text-gray-600">{relation.sourceIcd.nameEn}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium text-gray-900">{relation.targetIcd.code}</div>
                                            <div className="text-xs text-gray-600">{relation.targetIcd.nameEn}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium text-gray-900">
                                                {relation.relationType.nameEn || relation.relationType.code}
                                            </div>
                                            <div className="text-xs text-gray-600">{relation.relationType.code}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {relation.note ? relation.note : <span className="text-gray-400">—</span>}
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-600">
                                            {relation.effectiveFrom && <div>From {formatDate(relation.effectiveFrom)}</div>}
                                            {relation.effectiveTo && <div>To {formatDate(relation.effectiveTo)}</div>}
                                            {!relation.effectiveFrom && !relation.effectiveTo && <div>Not specified</div>}
                                        </TableCell>
                                        <TableCell>
                                            <span className={relation.isActive ? 'text-green-600' : 'text-gray-500'}>
                                                {relation.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setPendingDelete(relation)}
                                                disabled={deleteLoading}
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

                {relations.length > 0 && (
                    <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRelationsPage((prev) => Math.max(prev - 1, 0))}
                                disabled={relationsMeta.first || relationsLoading}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRelationsPage((prev) => prev + 1)}
                                disabled={relationsMeta.last || relationsLoading}
                            >
                                Next
                            </Button>
                            <span>
                                Page {relationsPage + 1} of {Math.max(relationsMeta.totalPages, 1)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>
                                {relationsMeta.numberOfElements} of {relationsMeta.totalElements} records
                            </span>
                            <Select
                                value={String(relationsPageSize)}
                                onValueChange={(value) => {
                                    setRelationsPageSize(Number(value))
                                    setRelationsPage(0)
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

            <Dialog
                open={isCreateDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        resetCreateDialog()
                    }
                }}
            >
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Create ICD Relation</DialogTitle>
                        <DialogDescription>
                            Define how two ICD codes relate to each other to enrich the semantic network.
                        </DialogDescription>
                    </DialogHeader>

                    {relationTypesError && (
                        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            <AlertCircle className="h-4 w-4" />
                            {relationTypesError}
                        </div>
                    )}

                    {createError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {createError}
                        </div>
                    )}

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="sourceSearch">Source ICD *</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="sourceSearch"
                                        placeholder="Search ICD by code or name"
                                        value={sourceSearchTerm}
                                        onChange={(event) => setSourceSearchTerm(event.target.value)}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => void searchSourceIcds(sourceSearchTerm)}
                                        disabled={sourceLoading}
                                    >
                                        {sourceLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Search
                                            </>
                                        ) : (
                                            'Search'
                                        )}
                                    </Button>
                                </div>
                                {selectedSourceIcd && (
                                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                        Selected: {selectedSourceIcd.code} — {selectedSourceIcd.nameEn}
                                    </div>
                                )}
                                {sourceError && (
                                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                        {sourceError}
                                    </div>
                                )}
                            </div>

                            {sourceResults.length > 0 && (
                                <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sourceResults.map((result) => (
                                                <TableRow key={result.id} className="hover:bg-gray-50">
                                                    <TableCell className="font-medium">{result.code}</TableCell>
                                                    <TableCell>{result.nameEn}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant={selectedSourceIcd?.id === result.id ? 'default' : 'outline'}
                                                            onClick={() => setSelectedSourceIcd(result)}
                                                        >
                                                            {selectedSourceIcd?.id === result.id ? 'Selected' : 'Select'}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="targetSearch">Target ICD *</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="targetSearch"
                                        placeholder="Search ICD by code or name"
                                        value={targetSearchTerm}
                                        onChange={(event) => setTargetSearchTerm(event.target.value)}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => void searchTargetIcds(targetSearchTerm)}
                                        disabled={targetLoading}
                                    >
                                        {targetLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Search
                                            </>
                                        ) : (
                                            'Search'
                                        )}
                                    </Button>
                                </div>
                                {selectedTargetIcd && (
                                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                        Selected: {selectedTargetIcd.code} — {selectedTargetIcd.nameEn}
                                    </div>
                                )}
                                {targetError && (
                                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                        {targetError}
                                    </div>
                                )}
                            </div>

                            {targetResults.length > 0 && (
                                <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {targetResults.map((result) => (
                                                <TableRow key={result.id} className="hover:bg-gray-50">
                                                    <TableCell className="font-medium">{result.code}</TableCell>
                                                    <TableCell>{result.nameEn}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant={selectedTargetIcd?.id === result.id ? 'default' : 'outline'}
                                                            onClick={() => setSelectedTargetIcd(result)}
                                                        >
                                                            {selectedTargetIcd?.id === result.id ? 'Selected' : 'Select'}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="relationType">Relation type *</Label>
                            {relationTypes.length > 0 ? (
                                <Select value={selectedRelationTypeCode} onValueChange={setSelectedRelationTypeCode}>
                                    <SelectTrigger id="relationType">
                                        <SelectValue placeholder="Choose relation type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {relationTypes.map((type) => (
                                            <SelectItem key={type.code} value={type.code}>
                                                {type.code} — {type.nameEn}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <>
                                    <Input
                                        id="relationType"
                                        placeholder={
                                            relationTypesLoading
                                                ? 'Loading relation types...'
                                                : 'Enter relation type code'
                                        }
                                        value={selectedRelationTypeCode}
                                        onChange={(event) => setSelectedRelationTypeCode(event.target.value)}
                                        disabled={relationTypesLoading}
                                    />
                                    <p className="text-xs text-gray-500">
                                        {relationTypesLoading
                                            ? 'Fetching relation types from the service.'
                                            : 'Type the relation type code if the catalogue is unavailable.'}
                                    </p>
                                </>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="note">Note</Label>
                            <textarea
                                id="note"
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-tpa-primary focus:outline-none"
                                placeholder="Optional context or business rule"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="effectiveFrom">Effective from</Label>
                            <Input
                                id="effectiveFrom"
                                type="date"
                                value={effectiveFrom}
                                onChange={(event) => setEffectiveFrom(event.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="effectiveTo">Effective to</Label>
                            <Input
                                id="effectiveTo"
                                type="date"
                                value={effectiveTo}
                                onChange={(event) => setEffectiveTo(event.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={resetCreateDialog} disabled={createLoading}>
                            Cancel
                        </Button>
                        <Button onClick={() => void handleCreateRelation()} disabled={createLoading}>
                            {createLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" /> Create relation
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => (!open ? closeDeleteDialog() : null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remove relation</DialogTitle>
                        <DialogDescription>
                            Confirm to remove the link between these ICD codes. You can re-create the relation later if
                            required.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 text-sm text-gray-600">
                        <p>
                            Source: <span className="font-medium text-gray-900">{pendingDelete?.sourceIcd.code}</span>
                        </p>
                        <p>
                            Target: <span className="font-medium text-gray-900">{pendingDelete?.targetIcd.code}</span>
                        </p>
                        <p>
                            Relation type:{' '}
                            <span className="font-medium text-gray-900">{pendingDelete?.relationType.nameEn}</span>
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeDeleteDialog} disabled={deleteLoading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => void handleDeleteRelation()}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? (
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
