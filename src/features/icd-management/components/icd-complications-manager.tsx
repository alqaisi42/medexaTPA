'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2, Plus, Search, Trash2 } from 'lucide-react'

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { createIcdComplication, deleteIcdComplication, fetchIcdComplications } from '@/lib/api/icd-complications'
import { searchIcds } from '@/lib/api/icd'
import { ICD, IcdComplication } from '@/types'

interface FeedbackState {
    type: 'success' | 'error'
    message: string
}

const MIN_AUTOCOMPLETE_CHARS = 2

export function IcdComplicationsManager() {
    const [feedback, setFeedback] = useState<FeedbackState | null>(null)

    const [icdSearchTerm, setIcdSearchTerm] = useState('')
    const [icdSearchResults, setIcdSearchResults] = useState<ICD[]>([])
    const [icdSearchError, setIcdSearchError] = useState<string | null>(null)
    const [isSearchingIcd, setIsSearchingIcd] = useState(false)
    const [selectedSourceIcd, setSelectedSourceIcd] = useState<ICD | null>(null)

    const [complications, setComplications] = useState<IcdComplication[]>([])
    const [complicationsLoading, setComplicationsLoading] = useState(false)
    const [complicationsError, setComplicationsError] = useState<string | null>(null)

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [complicationSearchTerm, setComplicationSearchTerm] = useState('')
    const [complicationResults, setComplicationResults] = useState<ICD[]>([])
    const [complicationSearchError, setComplicationSearchError] = useState<string | null>(null)
    const [complicationSearchLoading, setComplicationSearchLoading] = useState(false)
    const [selectedComplicationIcd, setSelectedComplicationIcd] = useState<ICD | null>(null)
    const [severity, setSeverity] = useState('')
    const [notes, setNotes] = useState('')
    const [createError, setCreateError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [pendingDelete, setPendingDelete] = useState<IcdComplication | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const handleApiError = useCallback((error: unknown) => {
        return error instanceof Error ? error.message : 'Unexpected error communicating with ICD service'
    }, [])

    const loadComplications = useCallback(
        async (icdId: number) => {
            setComplicationsLoading(true)
            setComplicationsError(null)
            try {
                const data = await fetchIcdComplications(icdId)
                setComplications(data)
            } catch (error) {
                setComplications([])
                setComplicationsError(handleApiError(error))
            } finally {
                setComplicationsLoading(false)
            }
        },
        [handleApiError]
    )

    useEffect(() => {
        if (!selectedSourceIcd) {
            setComplications([])
            setComplicationsError(null)
            return
        }
        void loadComplications(selectedSourceIcd.id)
    }, [selectedSourceIcd, loadComplications])

    useEffect(() => {
        const keyword = icdSearchTerm.trim()

        if (!keyword) {
            setIcdSearchResults([])
            setIcdSearchError(null)
            setIsSearchingIcd(false)
            return
        }

        if (keyword.length < MIN_AUTOCOMPLETE_CHARS) {
            setIcdSearchResults([])
            setIcdSearchError(`Type at least ${MIN_AUTOCOMPLETE_CHARS} characters to search.`)
            setIsSearchingIcd(false)
            return
        }

        let ignore = false
        setIsSearchingIcd(true)
        setIcdSearchError(null)

        const debounce = setTimeout(() => {
            void (async () => {
                try {
                    const results = await searchIcds(keyword)
                    if (ignore) return
                    setIcdSearchResults(results.slice(0, 20))
                    if (results.length === 0) {
                        setIcdSearchError('No ICD codes matched this search.')
                    }
                } catch (error) {
                    if (ignore) return
                    setIcdSearchResults([])
                    setIcdSearchError(handleApiError(error))
                } finally {
                    if (!ignore) {
                        setIsSearchingIcd(false)
                    }
                }
            })()
        }, 300)

        return () => {
            ignore = true
            clearTimeout(debounce)
        }
    }, [icdSearchTerm, handleApiError])

    useEffect(() => {
        if (!isCreateDialogOpen) {
            setComplicationResults([])
            setComplicationSearchError(null)
            setComplicationSearchLoading(false)
            return
        }

        const keyword = complicationSearchTerm.trim()

        if (!keyword) {
            setComplicationResults([])
            setComplicationSearchError(null)
            setComplicationSearchLoading(false)
            return
        }

        if (keyword.length < MIN_AUTOCOMPLETE_CHARS) {
            setComplicationResults([])
            setComplicationSearchError(`Type at least ${MIN_AUTOCOMPLETE_CHARS} characters to search.`)
            setComplicationSearchLoading(false)
            return
        }

        let ignore = false
        setComplicationSearchLoading(true)
        setComplicationSearchError(null)

        const debounce = setTimeout(() => {
            void (async () => {
                try {
                    const results = await searchIcds(keyword)
                    if (ignore) return
                    setComplicationResults(results.slice(0, 20))
                    if (results.length === 0) {
                        setComplicationSearchError('No ICD codes matched this search.')
                    }
                } catch (error) {
                    if (ignore) return
                    setComplicationResults([])
                    setComplicationSearchError(handleApiError(error))
                } finally {
                    if (!ignore) {
                        setComplicationSearchLoading(false)
                    }
                }
            })()
        }, 300)

        return () => {
            ignore = true
            clearTimeout(debounce)
        }
    }, [complicationSearchTerm, isCreateDialogOpen, handleApiError])

    const resetCreateDialog = () => {
        setIsCreateDialogOpen(false)
        setComplicationSearchTerm('')
        setComplicationResults([])
        setComplicationSearchError(null)
        setComplicationSearchLoading(false)
        setSelectedComplicationIcd(null)
        setSeverity('')
        setNotes('')
        setCreateError(null)
    }

    const handleCreateComplication = async () => {
        if (!selectedSourceIcd) {
            setCreateError('Select a primary ICD before adding complications.')
            return
        }
        if (!selectedComplicationIcd) {
            setCreateError('Pick a complication ICD to continue.')
            return
        }
        if (selectedComplicationIcd.id === selectedSourceIcd.id) {
            setCreateError('Complication ICD cannot be the same as the source ICD.')
            return
        }

        const severityValue = severity.trim()
        if (severityValue) {
            const parsed = Number(severityValue)
            if (!Number.isFinite(parsed) || parsed < 0) {
                setCreateError('Severity must be a positive number.')
                return
            }
        }

        const payload = {
            sourceIcdId: selectedSourceIcd.id,
            complicationIcdId: selectedComplicationIcd.id,
            severity: severityValue ? Number(severityValue) : undefined,
            notes: notes.trim() || undefined,
        }

        setIsSaving(true)
        setCreateError(null)

        try {
            await createIcdComplication(payload)
            setFeedback({ type: 'success', message: 'Complication added successfully.' })
            resetCreateDialog()
            await loadComplications(selectedSourceIcd.id)
        } catch (error) {
            setCreateError(handleApiError(error))
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteComplication = async () => {
        if (!pendingDelete || !selectedSourceIcd) {
            return
        }

        setDeleteLoading(true)
        try {
            await deleteIcdComplication({
                sourceIcdId: selectedSourceIcd.id,
                complicationIcdId: pendingDelete.complication.id,
            })
            setFeedback({ type: 'success', message: 'Complication removed successfully.' })
            setPendingDelete(null)
            await loadComplications(selectedSourceIcd.id)
        } catch (error) {
            setFeedback({ type: 'error', message: handleApiError(error) })
        } finally {
            setDeleteLoading(false)
        }
    }

    const selectedSourceLabel = useMemo(() => {
        if (!selectedSourceIcd) return 'None selected'
        return `${selectedSourceIcd.code} — ${selectedSourceIcd.nameEn}`
    }, [selectedSourceIcd])

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Complications</h2>
                <p className="text-sm text-gray-600">
                    Link ICD codes to their known complications, capture clinical notes, and grade severity in a single,
                    focused workspace.
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
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Search ICD (autocomplete)</h3>
                        <p className="text-sm text-gray-500">Start typing code or name to choose the primary ICD.</p>
                    </div>
                    {selectedSourceIcd && (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedSourceIcd(null)}>
                            Clear selection
                        </Button>
                    )}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="e.g. I10 or hypertension"
                        value={icdSearchTerm}
                        onChange={(event) => setIcdSearchTerm(event.target.value)}
                        className="pl-9"
                        aria-label="Search ICD catalogue"
                    />
                </div>
                {icdSearchError && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {icdSearchError}
                    </p>
                )}
                {isSearchingIcd && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Searching ICD catalogue...
                    </div>
                )}
                {icdSearchResults.length > 0 && (
                    <div className="max-h-72 overflow-y-auto rounded-md border border-gray-200">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {icdSearchResults.map((result) => (
                                    <TableRow key={result.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">{result.code}</TableCell>
                                        <TableCell>{result.nameEn}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant={selectedSourceIcd?.id === result.id ? 'default' : 'outline'}
                                                onClick={() => {
                                                    setSelectedSourceIcd(result)
                                                    setFeedback(null)
                                                }}
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

            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Linked complications</h3>
                        <p className="text-sm text-gray-500">
                            Selected ICD: <span className="font-medium text-gray-900">{selectedSourceLabel}</span>
                        </p>
                    </div>
                    <Button
                        className="bg-tpa-primary hover:bg-tpa-accent"
                        onClick={() => setIsCreateDialogOpen(true)}
                        disabled={!selectedSourceIcd}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add complication
                    </Button>
                </div>

                {!selectedSourceIcd ? (
                    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-500">
                        Pick a primary ICD on the left to review or add complications.
                    </div>
                ) : complicationsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading complications...
                    </div>
                ) : complicationsError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {complicationsError}
                    </div>
                ) : complications.length === 0 ? (
                    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-500">
                        No complications recorded yet. Use the add button to capture the first one.
                    </div>
                ) : (
                    <div className="rounded-md border border-gray-200">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Complication ICD Code</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead className="text-right">Delete</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {complications.map((complication) => (
                                    <TableRow key={complication.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">{complication.complication.code}</TableCell>
                                        <TableCell>{complication.complication.nameEn}</TableCell>
                                        <TableCell>{complication.severity ?? <span className="text-gray-400">—</span>}</TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {complication.notes ? (
                                                <span className="block max-w-xs truncate">{complication.notes}</span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setPendingDelete(complication)}
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
            </div>

            <Dialog
                open={isCreateDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        resetCreateDialog()
                    } else {
                        setIsCreateDialogOpen(true)
                    }
                }}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Link a complication</DialogTitle>
                        <DialogDescription>
                            Choose the complication ICD, add optional severity, and capture notes that explain the clinical
                            context.
                        </DialogDescription>
                    </DialogHeader>

                    {!selectedSourceIcd && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            Select a primary ICD before adding complications.
                        </div>
                    )}

                    {createError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {createError}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="complicationSearch">Search complication ICD</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    id="complicationSearch"
                                    placeholder="Type to search ICD catalogue"
                                    value={complicationSearchTerm}
                                    onChange={(event) => setComplicationSearchTerm(event.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            {complicationSearchError && (
                                <p className="text-xs text-amber-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {complicationSearchError}
                                </p>
                            )}
                            {complicationSearchLoading && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Searching ICD catalogue...
                                </div>
                            )}
                            {complicationResults.length > 0 && (
                                <div className="max-h-56 overflow-y-auto rounded-md border border-gray-200">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead className="text-right">Select</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {complicationResults.map((result) => (
                                                <TableRow key={result.id} className="hover:bg-gray-50">
                                                    <TableCell className="font-medium">{result.code}</TableCell>
                                                    <TableCell>{result.nameEn}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant={selectedComplicationIcd?.id === result.id ? 'default' : 'outline'}
                                                            onClick={() => setSelectedComplicationIcd(result)}
                                                        >
                                                            {selectedComplicationIcd?.id === result.id ? 'Selected' : 'Select'}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                            {selectedComplicationIcd && (
                                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                    Selected complication: {selectedComplicationIcd.code} — {selectedComplicationIcd.nameEn}
                                </div>
                            )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="severity">Severity (optional)</Label>
                                <Input
                                    id="severity"
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 1-5"
                                    value={severity}
                                    onChange={(event) => setSeverity(event.target.value)}
                                />
                                <p className="text-xs text-gray-500">Use your internal scoring scale or leave blank.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <div className="space-y-2">
                                    <Textarea
                                        id="notes"
                                        rows={3}
                                        placeholder="Capture clarification, guidance, or authorization notes."
                                        value={notes}
                                        onChange={(event) => setNotes(event.target.value)}
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setNotes('')}
                                            disabled={!notes}
                                        >
                                            Clear notes
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={resetCreateDialog} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button onClick={() => void handleCreateComplication()} disabled={isSaving || !selectedSourceIcd}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" /> Add complication
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => (!open ? setPendingDelete(null) : null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete complication</DialogTitle>
                        <DialogDescription>
                            Removing this link will not delete the ICD itself. You can re-add the complication anytime.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 text-sm text-gray-600">
                        <p>
                            Complication:{' '}
                            <span className="font-medium text-gray-900">{pendingDelete?.complication.code}</span>
                        </p>
                        <p>{pendingDelete?.complication.nameEn}</p>
                        {pendingDelete?.notes && (
                            <p className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs">
                                Notes: {pendingDelete.notes}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={deleteLoading}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => void handleDeleteComplication()}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing...
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

