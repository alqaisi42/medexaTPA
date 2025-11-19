'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

import { searchIcds } from '@/lib/api/icd'
import {
    createDrugIcdRelation,
    deleteDrugIcdRelation,
    fetchDrugIcdRelations,
    updateDrugIcdRelation,
} from '@/lib/api/drug-icd-relations'
import {
    CreateDrugIcdRelationPayload,
    DrugIcdRelation,
    DrugIcdRelationType,
    ICD,
    UpdateDrugIcdRelationPayload,
} from '@/types'
import { cn } from '@/lib/utils'

const RELATION_TYPE_OPTIONS: { value: DrugIcdRelationType; label: string; helper: string }[] = [
    { value: 'INDICATION', label: 'Indication', helper: 'Drug treats or manages the ICD.' },
    {
        value: 'CONTRAINDICATION',
        label: 'Contraindication',
        helper: 'Drug should not be used when the ICD is present.',
    },
    { value: 'PRECAUTION', label: 'Precaution', helper: 'Requires caution or monitoring with this ICD.' },
]

const RELATION_BADGE_STYLES: Record<DrugIcdRelationType, string> = {
    INDICATION: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    CONTRAINDICATION: 'bg-red-50 text-red-700 border border-red-100',
    PRECAUTION: 'bg-amber-50 text-amber-700 border border-amber-100',
}

type RelationDialogMode = 'create' | 'edit'

interface DrugIcdRelationsPanelProps {
    drugId: number
}

export function DrugIcdRelationsPanel({ drugId }: DrugIcdRelationsPanelProps) {
    const [relations, setRelations] = useState<DrugIcdRelation[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogMode, setDialogMode] = useState<RelationDialogMode>('create')
    const [activeRelation, setActiveRelation] = useState<DrugIcdRelation | null>(null)
    const [dialogError, setDialogError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<DrugIcdRelation | null>(null)
    const [deleting, setDeleting] = useState(false)

    const loadRelations = useCallback(async () => {
        if (!drugId) return
        setLoading(true)
        setError(null)
        try {
            const data = await fetchDrugIcdRelations(drugId)
            setRelations(data)
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : 'Unable to load ICD relations for this drug.',
            )
        } finally {
            setLoading(false)
        }
    }, [drugId])

    useEffect(() => {
        void loadRelations()
    }, [loadRelations])

    useEffect(() => {
        if (!feedback) return
        const timer = setTimeout(() => setFeedback(null), 5000)
        return () => clearTimeout(timer)
    }, [feedback])

    const handleDialogOpenChange = (open: boolean) => {
        setDialogOpen(open)
        if (!open) {
            setDialogError(null)
            setActiveRelation(null)
        }
    }

    const handleCreateRelation = useCallback(
        async (payload: CreateDrugIcdRelationPayload) => {
            setSubmitting(true)
            setDialogError(null)
            try {
                await createDrugIcdRelation(payload)
                setDialogOpen(false)
                setActiveRelation(null)
                setFeedback({ type: 'success', message: 'ICD linked to the drug successfully.' })
                await loadRelations()
            } catch (createError) {
                setDialogError(
                    createError instanceof Error
                        ? createError.message
                        : 'Unable to link ICD to the selected drug.',
                )
            } finally {
                setSubmitting(false)
            }
        },
        [loadRelations],
    )

    const handleUpdateRelation = useCallback(
        async (payload: UpdateDrugIcdRelationPayload) => {
            if (!activeRelation) return
            setSubmitting(true)
            setDialogError(null)
            try {
                await updateDrugIcdRelation(activeRelation.id, payload)
                setDialogOpen(false)
                setActiveRelation(null)
                setFeedback({ type: 'success', message: 'ICD relation updated successfully.' })
                await loadRelations()
            } catch (updateError) {
                setDialogError(
                    updateError instanceof Error
                        ? updateError.message
                        : 'Unable to update this ICD relation.',
                )
            } finally {
                setSubmitting(false)
            }
        },
        [activeRelation, loadRelations],
    )

    const handleDeleteRelation = useCallback(async () => {
        if (!deleteTarget) return
        setDeleting(true)
        setFeedback(null)
        try {
            await deleteDrugIcdRelation(deleteTarget.id)
            setDeleteTarget(null)
            setFeedback({ type: 'success', message: 'ICD relation removed.' })
            await loadRelations()
        } catch (deleteError) {
            setFeedback({
                type: 'error',
                message:
                    deleteError instanceof Error
                        ? deleteError.message
                        : 'Unable to remove this ICD relation.',
            })
        } finally {
            setDeleting(false)
        }
    }, [deleteTarget, loadRelations])

    const openCreateDialog = () => {
        setDialogMode('create')
        setActiveRelation(null)
        setDialogOpen(true)
    }

    const openEditDialog = (relation: DrugIcdRelation) => {
        setDialogMode('edit')
        setActiveRelation(relation)
        setDialogOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h3 className="text-lg font-semibold">ICD Relations</h3>
                    <p className="text-sm text-gray-600">
                        Map indications, contraindications, and precautions for this drug.
                    </p>
                </div>
                <Button className="bg-tpa-primary hover:bg-tpa-accent" onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" /> Link ICD
                </Button>
            </div>

            {feedback && (
                <div
                    className={cn(
                        'rounded-md border px-3 py-2 text-sm',
                        feedback.type === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-red-200 bg-red-50 text-red-800',
                    )}
                >
                    {feedback.message}
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" /> {error}
                </div>
            )}

            <div className="rounded-lg border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ICD</TableHead>
                            <TableHead>Relation</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="py-6 text-center text-sm text-gray-500">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Loading ICD relations...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : relations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="py-6 text-center text-sm text-gray-500">
                                    No ICD relations recorded for this drug yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            relations.map((relation) => (
                                <TableRow key={relation.id} className="align-top">
                                    <TableCell>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-900">
                                                {relation.icd?.code?.trim() ||
                                                    'Unknown ICD'}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {relation.icd?.nameEn?.trim() ||
                                                    'ICD metadata unavailable'}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <RelationBadge type={relation.relationType} />
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm text-gray-700 whitespace-pre-line">
                                            {relation.notes?.trim() ? relation.notes : '—'}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditDialog(relation)}
                                                aria-label="Edit ICD relation"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleteTarget(relation)}
                                                aria-label="Delete ICD relation"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <DrugIcdRelationDialog
                open={dialogOpen}
                onOpenChange={handleDialogOpenChange}
                mode={dialogMode}
                drugId={drugId}
                relation={activeRelation}
                submitting={submitting}
                error={dialogError}
                onCreate={handleCreateRelation}
                onUpdate={handleUpdateRelation}
            />

            <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove ICD relation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this ICD mapping? You can recreate it later if needed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1 rounded-md border bg-gray-50 p-3 text-sm text-gray-700">
                        <p>
                            ICD:{' '}
                            <span className="font-semibold">{deleteTarget?.icd?.code || 'Unknown ICD'}</span>
                        </p>
                        <p>Relation: {deleteTarget?.relationType || '—'}</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => void handleDeleteRelation()} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

interface RelationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: RelationDialogMode
    drugId: number
    relation: DrugIcdRelation | null
    submitting: boolean
    error: string | null
    onCreate: (payload: CreateDrugIcdRelationPayload) => Promise<void>
    onUpdate: (payload: UpdateDrugIcdRelationPayload) => Promise<void>
}

interface RelationFormState {
    selectedIcd: ICD | null
    relationType: DrugIcdRelationType
    notes: string
    icdQuery: string
}

function createInitialFormState(): RelationFormState {
    return {
        selectedIcd: null,
        relationType: 'INDICATION',
        notes: '',
        icdQuery: '',
    }
}

function DrugIcdRelationDialog({
    open,
    onOpenChange,
    mode,
    drugId,
    relation,
    submitting,
    error,
    onCreate,
    onUpdate,
}: RelationDialogProps) {
    const [formState, setFormState] = useState<RelationFormState>(createInitialFormState())
    const [icdResults, setIcdResults] = useState<ICD[]>([])
    const [searchError, setSearchError] = useState<string | null>(null)
    const [searching, setSearching] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)

    useEffect(() => {
        if (!open) return

        if (mode === 'edit' && relation) {
            setFormState({
                selectedIcd: relation.icd,
                relationType: relation.relationType,
                notes: relation.notes ?? '',
                icdQuery: relation.icd ? `${relation.icd.code} — ${relation.icd.nameEn}` : '',
            })
        } else {
            setFormState(createInitialFormState())
        }
        setIcdResults([])
        setSearchError(null)
        setLocalError(null)
    }, [open, mode, relation])

    const handleSearch = async (event: React.FormEvent) => {
        event.preventDefault()
        const term = formState.icdQuery.trim()
        if (term.length < 2) {
            setSearchError('Enter at least two characters to search the ICD catalogue.')
            setIcdResults([])
            return
        }

        setSearchError(null)
        setSearching(true)
        try {
            const results = await searchIcds(term)
            setIcdResults(results)
            if (results.length === 0) {
                setSearchError('No ICD codes matched your search query.')
            }
        } catch (searchErr) {
            setSearchError(
                searchErr instanceof Error ? searchErr.message : 'Unable to search the ICD catalogue right now.',
            )
        } finally {
            setSearching(false)
        }
    }

    const handleSelectIcd = (icd: ICD) => {
        setFormState((prev) => ({
            ...prev,
            selectedIcd: icd,
            icdQuery: `${icd.code} — ${icd.nameEn}`,
        }))
        setIcdResults([])
        setSearchError(null)
    }

    const handleSubmit = async () => {
        setLocalError(null)
        if (mode === 'create') {
            if (!formState.selectedIcd) {
                setLocalError('Select an ICD to continue.')
                return
            }
            await onCreate({
                drugId,
                icdId: formState.selectedIcd.id,
                relationType: formState.relationType,
                notes: formState.notes.trim() ? formState.notes.trim() : undefined,
            })
            return
        }

        if (!relation) {
            setLocalError('Missing ICD relation to update.')
            return
        }

        await onUpdate({
            relationType: formState.relationType,
            notes: formState.notes.trim() ? formState.notes.trim() : undefined,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'edit' ? 'Update ICD relation' : 'Link ICD to drug'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'edit'
                            ? 'Adjust the clinical relationship between the drug and the selected ICD.'
                            : 'Search the ICD catalogue and link it to this drug as an indication, contraindication, or precaution.'}
                    </DialogDescription>
                </DialogHeader>

                {mode === 'create' && (
                    <form className="space-y-2" onSubmit={(event) => void handleSearch(event)}>
                        <Label htmlFor="icd-search">Search ICD *</Label>
                        <div className="flex gap-2">
                            <Input
                                id="icd-search"
                                placeholder="Enter ICD code or name"
                                value={formState.icdQuery}
                                onChange={(event) =>
                                    setFormState((prev) => ({ ...prev, icdQuery: event.target.value }))
                                }
                            />
                            <Button type="submit" variant="outline" disabled={searching}>
                                {searching ? (
                                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="mr-1 h-4 w-4" />
                                )}
                                Search
                            </Button>
                        </div>
                        {searchError && <p className="text-sm text-red-600">{searchError}</p>}
                        {icdResults.length > 0 && (
                            <div className="max-h-48 overflow-y-auto rounded-md border">
                                {icdResults.map((icd) => (
                                    <button
                                        type="button"
                                        key={icd.id}
                                        className="flex w-full flex-col items-start gap-1 border-b px-3 py-2 text-left last:border-b-0 hover:bg-gray-50"
                                        onClick={() => handleSelectIcd(icd)}
                                    >
                                        <span className="text-sm font-semibold text-gray-900">{icd.code}</span>
                                        <span className="text-xs text-gray-600">{icd.nameEn}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </form>
                )}

                <div className="space-y-2 rounded-md border bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-600">Selected ICD</p>
                    {formState.selectedIcd ? (
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-semibold text-gray-900">{formState.selectedIcd.code}</p>
                                <p className="text-sm text-gray-700">{formState.selectedIcd.nameEn}</p>
                            </div>
                            {mode === 'create' && (
                                <Button
                                    variant="link"
                                    type="button"
                                    onClick={() =>
                                        setFormState((prev) => ({ ...prev, selectedIcd: null, icdQuery: '' }))
                                    }
                                >
                                    Change
                                </Button>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">
                            {mode === 'edit'
                                ? 'The linked ICD record is missing. Save to relink if needed.'
                                : 'Search and pick an ICD to continue.'}
                        </p>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="relation-type">Relation Type *</Label>
                        <Select
                            value={formState.relationType}
                            onValueChange={(value: DrugIcdRelationType) =>
                                setFormState((prev) => ({ ...prev, relationType: value }))
                            }
                        >
                            <SelectTrigger id="relation-type">
                                <SelectValue placeholder="Select relation type" />
                            </SelectTrigger>
                            <SelectContent>
                                {RELATION_TYPE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        <div>
                                            <p className="text-sm font-medium">{option.label}</p>
                                            <p className="text-xs text-muted-foreground">{option.helper}</p>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="relation-notes">Notes</Label>
                        <Textarea
                            id="relation-notes"
                            placeholder="Add clinical notes or usage guidance"
                            value={formState.notes}
                            onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                            rows={4}
                        />
                    </div>
                </div>

                {(localError || error) && (
                    <p className="text-sm text-red-600">{localError || error}</p>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-tpa-primary hover:bg-tpa-accent"
                        onClick={() => void handleSubmit()}
                        disabled={submitting || (mode === 'create' && !formState.selectedIcd)}
                    >
                        {submitting ? 'Saving...' : mode === 'edit' ? 'Update relation' : 'Link ICD'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function RelationBadge({ type }: { type: DrugIcdRelationType }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide',
                RELATION_BADGE_STYLES[type],
            )}
        >
            {type.toLowerCase().replace(/^(.)/, (match) => match.toUpperCase())}
        </span>
    )
}
