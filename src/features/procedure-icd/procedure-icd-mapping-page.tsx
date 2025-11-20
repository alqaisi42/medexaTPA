'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Link2, Loader2, Plus, Shield, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
    createIcdProcedureSeverity,
    createProcedureIcdCategoryMapping,
    deleteProcedureIcdCategoryMapping,
    fetchIcdProcedureSeverities,
    fetchProcedureIcdCategoryMappings,
} from '@/lib/api/procedure-icd'
import {
    CreateIcdProcedureSeverityPayload,
    CreateProcedureIcdCategoryPayload,
    IcdProcedureSeverity,
    ProcedureIcdCategoryMapping,
    ProcedureIcdRelationType,
    ProcedureSeverityLevel,
} from '@/types'
import { cn } from '@/lib/utils'

const RELATION_TYPES: ProcedureIcdRelationType[] = ['INDICATION', 'PRECAUTION', 'CONTRAINDICATION']
const SEVERITY_LEVELS: ProcedureSeverityLevel[] = ['LOW', 'MEDIUM', 'HIGH']

interface FeedbackState {
    type: 'success' | 'error'
    message: string
}

export function ProcedureIcdMappingPage() {
    const [procedureIdInput, setProcedureIdInput] = useState('')
    const [activeProcedureId, setActiveProcedureId] = useState<number | null>(null)

    const [categoryMappings, setCategoryMappings] = useState<ProcedureIcdCategoryMapping[]>([])
    const [severities, setSeverities] = useState<IcdProcedureSeverity[]>([])

    const [loadingMappings, setLoadingMappings] = useState(false)
    const [loadingSeverities, setLoadingSeverities] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    const [feedback, setFeedback] = useState<FeedbackState | null>(null)

    const [mappingForm, setMappingForm] = useState<CreateProcedureIcdCategoryPayload>({
        procedureId: 0,
        icdCategoryId: 0,
        relationType: RELATION_TYPES[0],
        createdBy: 'system',
    })

    const [severityForm, setSeverityForm] = useState<CreateIcdProcedureSeverityPayload>({
        procedureId: 0,
        icdCategoryId: 0,
        severityLevel: SEVERITY_LEVELS[0],
        relationType: RELATION_TYPES[0],
        covered: true,
        requiresPreapproval: false,
        notes: '',
    })

    const filteredSeverities = useMemo(() => {
        if (!activeProcedureId) {
            return []
        }
        return severities.filter((item) => item.procedureId === activeProcedureId)
    }, [activeProcedureId, severities])

    const loadMappings = useCallback(
        async (procedureId: number) => {
            setLoadingMappings(true)
            try {
                const data = await fetchProcedureIcdCategoryMappings(procedureId)
                setCategoryMappings(data)
            } catch (error) {
                setFeedback({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Failed to load ICD category mappings.',
                })
                setCategoryMappings([])
            } finally {
                setLoadingMappings(false)
            }
        },
        [],
    )

    const loadSeverities = useCallback(async () => {
        setLoadingSeverities(true)
        try {
            const data = await fetchIcdProcedureSeverities()
            setSeverities(data)
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to load ICD procedure severities.',
            })
            setSeverities([])
        } finally {
            setLoadingSeverities(false)
        }
    }, [])

    const refreshData = useCallback(
        async (procedureId: number) => {
            setFeedback(null)
            setActiveProcedureId(procedureId)
            setMappingForm((prev) => ({ ...prev, procedureId }))
            setSeverityForm((prev) => ({ ...prev, procedureId }))
            await Promise.all([loadMappings(procedureId), loadSeverities()])
        },
        [loadMappings, loadSeverities],
    )

    useEffect(() => {
        if (!activeProcedureId) {
            return
        }

        setMappingForm((prev) => ({ ...prev, procedureId: activeProcedureId }))
        setSeverityForm((prev) => ({ ...prev, procedureId: activeProcedureId }))
    }, [activeProcedureId])

    const handleLoadProcedure = async () => {
        const parsedId = Number.parseInt(procedureIdInput, 10)
        if (Number.isNaN(parsedId) || parsedId <= 0) {
            setFeedback({ type: 'error', message: 'Enter a valid procedure identifier to continue.' })
            return
        }

        await refreshData(parsedId)
    }

    const handleCreateMapping = async () => {
        if (!mappingForm.procedureId || !mappingForm.icdCategoryId) {
            setFeedback({ type: 'error', message: 'Procedure and ICD category are required.' })
            return
        }

        setActionLoading(true)
        setFeedback(null)
        try {
            await createProcedureIcdCategoryMapping(mappingForm)
            await loadMappings(mappingForm.procedureId)
            setFeedback({ type: 'success', message: 'ICD category mapping created successfully.' })
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to create ICD category mapping.',
            })
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteMapping = async (mappingId: number) => {
        setActionLoading(true)
        setFeedback(null)
        try {
            await deleteProcedureIcdCategoryMapping(mappingId)
            if (activeProcedureId) {
                await loadMappings(activeProcedureId)
            }
            setFeedback({ type: 'success', message: 'Mapping removed successfully.' })
        } catch (error) {
            setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Failed to delete mapping.' })
        } finally {
            setActionLoading(false)
        }
    }

    const handleCreateSeverity = async () => {
        if (!severityForm.procedureId || !severityForm.icdCategoryId) {
            setFeedback({ type: 'error', message: 'Procedure and ICD category are required.' })
            return
        }

        setActionLoading(true)
        setFeedback(null)
        try {
            await createIcdProcedureSeverity(severityForm)
            await loadSeverities()
            setFeedback({ type: 'success', message: 'Severity rule saved successfully.' })
        } catch (error) {
            setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Failed to save severity.' })
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold">ICD Category ↔ Procedure Mapping</h1>
                <p className="text-gray-600">
                    Link procedures to ICD categories and capture severity rules in a single streamlined workspace.
                </p>
            </div>

            {feedback && (
                <div
                    className={cn(
                        'flex items-center gap-3 rounded-md border p-3 text-sm',
                        feedback.type === 'success'
                            ? 'border-green-200 bg-green-50 text-green-800'
                            : 'border-red-200 bg-red-50 text-red-800',
                    )}
                >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{feedback.message}</span>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Select a procedure</CardTitle>
                    <CardDescription>
                        Enter a procedure identifier to load its ICD category mappings and severity definitions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="space-y-2 sm:flex-1">
                        <Label htmlFor="procedure-id">Procedure ID</Label>
                        <Input
                            id="procedure-id"
                            value={procedureIdInput}
                            onChange={(event) => setProcedureIdInput(event.target.value)}
                            placeholder="e.g. 61"
                            type="number"
                            min={1}
                        />
                    </div>
                    <Button onClick={handleLoadProcedure} disabled={loadingMappings || loadingSeverities}>
                        {loadingMappings || loadingSeverities ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading
                            </>
                        ) : (
                            <>
                                <SearchIcon />
                                Load details
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="flex flex-col">
                    <CardHeader className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Link2 className="h-5 w-5" />
                            ICD category mapping
                        </CardTitle>
                        <CardDescription>Track how this procedure relates to ICD categories.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {!activeProcedureId ? (
                            <p className="text-sm text-gray-600">Select a procedure to view its mappings.</p>
                        ) : (
                            <div className="overflow-x-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Relation</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Code</TableHead>
                                            <TableHead className="w-[80px] text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingMappings ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Loading mappings...
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : categoryMappings.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                                                    No mappings found for this procedure.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            categoryMappings.map((mapping) => (
                                                <TableRow key={mapping.id}>
                                                    <TableCell className="font-medium">{mapping.relationType}</TableCell>
                                                    <TableCell>
                                                        <div className="font-semibold">{mapping.category.nameEn}</div>
                                                        <div className="text-xs text-gray-500">{mapping.category.nameAr}</div>
                                                    </TableCell>
                                                    <TableCell>{mapping.category.code}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            disabled={actionLoading}
                                                            onClick={() => handleDeleteMapping(mapping.id)}
                                                            title="Remove mapping"
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
                        )}

                        <div className="grid gap-4 rounded-md border bg-muted/50 p-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="mapping-procedure-id">Procedure ID</Label>
                                <Input
                                    id="mapping-procedure-id"
                                    type="number"
                                    min={1}
                                    value={mappingForm.procedureId || ''}
                                    onChange={(event) =>
                                        setMappingForm((prev) => ({
                                            ...prev,
                                            procedureId: Number(event.target.value),
                                        }))
                                    }
                                    placeholder="e.g. 61"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mapping-icd-category">ICD Category ID</Label>
                                <Input
                                    id="mapping-icd-category"
                                    type="number"
                                    min={1}
                                    value={mappingForm.icdCategoryId || ''}
                                    onChange={(event) =>
                                        setMappingForm((prev) => ({
                                            ...prev,
                                            icdCategoryId: Number(event.target.value),
                                        }))
                                    }
                                    placeholder="e.g. 1"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Relation type</Label>
                                <Select
                                    value={mappingForm.relationType}
                                    onValueChange={(value) =>
                                        setMappingForm((prev) => ({ ...prev, relationType: value as ProcedureIcdRelationType }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select relation" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {RELATION_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mapping-created-by">Created by</Label>
                                <Input
                                    id="mapping-created-by"
                                    value={mappingForm.createdBy ?? ''}
                                    onChange={(event) =>
                                        setMappingForm((prev) => ({
                                            ...prev,
                                            createdBy: event.target.value,
                                        }))
                                    }
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button onClick={handleCreateMapping} disabled={actionLoading || !activeProcedureId}>
                            {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Save mapping
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            ICD procedure severity
                        </CardTitle>
                        <CardDescription>Capture coverage, approval, and notes for ICD relationships.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {!activeProcedureId ? (
                            <p className="text-sm text-gray-600">Select a procedure to review severity rules.</p>
                        ) : (
                            <div className="overflow-x-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Relation</TableHead>
                                            <TableHead>Severity</TableHead>
                                            <TableHead>Coverage</TableHead>
                                            <TableHead>Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingSeverities ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Loading severities...
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredSeverities.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                                                    No severity rules found for this procedure.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredSeverities.map((severity) => (
                                                <TableRow key={severity.id}>
                                                    <TableCell className="font-medium">{severity.relationType}</TableCell>
                                                    <TableCell>{severity.severityLevel}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span
                                                                className={cn(
                                                                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                                                                    severity.covered
                                                                        ? 'bg-emerald-100 text-emerald-800'
                                                                        : 'bg-rose-100 text-rose-800',
                                                                )}
                                                            >
                                                                {severity.covered ? 'Covered' : 'Not covered'}
                                                            </span>
                                                            {severity.requiresPreapproval && (
                                                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                                                    Preapproval required
                                                                </span>
                                                            )}
                                                        </div>
                                                        {severity.icdCategory && (
                                                            <div className="mt-1 text-xs text-gray-500">
                                                                {severity.icdCategory.code} · {severity.icdCategory.nameEn}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="max-w-xs text-sm text-gray-700">
                                                        {severity.notes || '—'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <div className="grid gap-4 rounded-md border bg-muted/50 p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="severity-procedure-id">Procedure ID</Label>
                                    <Input
                                        id="severity-procedure-id"
                                        type="number"
                                        min={1}
                                        value={severityForm.procedureId || ''}
                                        onChange={(event) =>
                                            setSeverityForm((prev) => ({
                                                ...prev,
                                                procedureId: Number(event.target.value),
                                            }))
                                        }
                                        placeholder="e.g. 61"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="severity-icd-category">ICD Category ID</Label>
                                    <Input
                                        id="severity-icd-category"
                                        type="number"
                                        min={1}
                                        value={severityForm.icdCategoryId || ''}
                                        onChange={(event) =>
                                            setSeverityForm((prev) => ({
                                                ...prev,
                                                icdCategoryId: Number(event.target.value),
                                            }))
                                        }
                                        placeholder="e.g. 1"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Relation type</Label>
                                    <Select
                                        value={severityForm.relationType}
                                        onValueChange={(value) =>
                                            setSeverityForm((prev) => ({
                                                ...prev,
                                                relationType: value as ProcedureIcdRelationType,
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select relation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {RELATION_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Severity level</Label>
                                    <Select
                                        value={severityForm.severityLevel}
                                        onValueChange={(value) =>
                                            setSeverityForm((prev) => ({
                                                ...prev,
                                                severityLevel: value as ProcedureSeverityLevel,
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select severity" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SEVERITY_LEVELS.map((level) => (
                                                <SelectItem key={level} value={level}>
                                                    {level}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
                                    <div>
                                        <Label className="text-sm">Covered</Label>
                                        <p className="text-xs text-gray-500">Is the procedure allowed for this ICD?</p>
                                    </div>
                                    <Switch
                                        checked={severityForm.covered}
                                        onCheckedChange={(checked) =>
                                            setSeverityForm((prev) => ({
                                                ...prev,
                                                covered: checked,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
                                    <div>
                                        <Label className="text-sm">Preapproval</Label>
                                        <p className="text-xs text-gray-500">Requires payer approval before performing.</p>
                                    </div>
                                    <Switch
                                        checked={severityForm.requiresPreapproval}
                                        onCheckedChange={(checked) =>
                                            setSeverityForm((prev) => ({
                                                ...prev,
                                                requiresPreapproval: checked,
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="severity-notes">Notes</Label>
                                <Textarea
                                    id="severity-notes"
                                    value={severityForm.notes ?? ''}
                                    onChange={(event) =>
                                        setSeverityForm((prev) => ({
                                            ...prev,
                                            notes: event.target.value,
                                        }))
                                    }
                                    placeholder="Provide clinical guidance or payer notes"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button onClick={handleCreateSeverity} disabled={actionLoading || !activeProcedureId}>
                            {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Save severity
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

function SearchIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
}
