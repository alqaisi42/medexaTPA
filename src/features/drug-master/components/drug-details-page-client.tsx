'use client'

import { type ComponentType, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BadgeCheck, CalendarRange, Layers, Loader2, Pencil, Pill, ShieldCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DrugFormsPanel, DrugFormDialog, mapDrugToPayload } from './drug-master-page'
import { DrugIcdRelationsPanel } from './drug-icd-relations-panel'
import { cn, formatDate } from '@/lib/utils'
import { deleteDrug, getDrugById, updateDrug } from '@/lib/api/drugs'
import type { Drug, DrugPayload } from '@/types'

interface DrugDetailsPageClientProps {
    drugId: number
}

export function DrugDetailsPageClient({ drugId }: DrugDetailsPageClientProps) {
    const router = useRouter()
    const [drug, setDrug] = useState<Drug | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editOpen, setEditOpen] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const loadDrug = useCallback(async () => {
        if (!drugId) return
        setLoading(true)
        setError(null)
        try {
            const data = await getDrugById(drugId)
            setDrug(data)
        } catch (requestError) {
            console.error(requestError)
            setError(requestError instanceof Error ? requestError.message : 'Unable to load drug details')
            setDrug(null)
        } finally {
            setLoading(false)
        }
    }, [drugId])

    useEffect(() => {
        void loadDrug()
    }, [loadDrug])

    const handleEditSubmit = async (payload: DrugPayload) => {
        if (!drug) return
        setSaving(true)
        setFormError(null)
        try {
            await updateDrug(drug.id, payload)
            setEditOpen(false)
            await loadDrug()
        } catch (submitError) {
            console.error(submitError)
            setFormError(submitError instanceof Error ? submitError.message : 'Unable to update drug')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!drug) return
        setDeleting(true)
        try {
            await deleteDrug(drug.id)
            setDeleteDialogOpen(false)
            router.push('/drug-master')
        } catch (deleteError) {
            console.error(deleteError)
            setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete drug')
        } finally {
            setDeleting(false)
        }
    }

    const headerActions = useMemo(() => {
        if (!drug) return null
        return (
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
            </div>
        )
    }, [drug])

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" className="px-0 text-gray-600 hover:text-gray-900" onClick={() => router.push('/drug-master')}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to list
                    </Button>
                    <div className="rounded-lg bg-tpa-primary/10 p-3 text-tpa-primary">
                        <Pill className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{drug?.genericNameEn || 'Drug details'}</h1>
                        <p className="text-sm text-gray-600">Deep dive into the configuration of this drug.</p>
                    </div>
                </div>
                {headerActions}
            </div>

            {loading && (
                <div className="flex items-center gap-2 rounded-lg border bg-white p-4 text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading drug data...
                </div>
            )}

            {error && !loading && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}

            {drug && !loading && (
                <div className="space-y-6">
                    <Tabs defaultValue="overview" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="forms">Forms</TabsTrigger>
                            <TabsTrigger value="icds">ICDs</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                                <DetailItem label="Code" value={drug.code} />
                                <DetailItem label="ATC Code" value={drug.atcCode || '—'} />
                                <DetailItem label="Generic (EN)" value={drug.genericNameEn || '—'} />
                                <DetailItem label="Generic (AR)" value={drug.genericNameAr || '—'} rtl />
                                <DetailItem label="Brand (EN)" value={drug.brandNameEn || '—'} />
                                <DetailItem label="Brand (AR)" value={drug.brandNameAr || '—'} rtl />
                                <DetailItem
                                    label="Validity"
                                    value={`${drug.validFrom ? formatDate(drug.validFrom) : '—'} → ${drug.validTo ? formatDate(drug.validTo) : 'Open-ended'}`}
                                />
                                <DetailItem label="Created By" value={drug.createdBy || '—'} />
                            </div>

                            <div className="space-y-2 mt-6">
                                <p className="text-xs font-medium text-gray-500">Flags</p>
                                <div className="flex flex-wrap gap-2">
                                    {drug.isOtc && (
                                        <Badge icon={BadgeCheck} label="OTC" className="bg-green-100 text-green-800" />
                                    )}
                                    {drug.isControlled && (
                                        <Badge icon={ShieldCheck} label="Controlled" className="bg-amber-100 text-amber-800" />
                                    )}
                                    {drug.allowGenericSubstitution ? (
                                        <Badge icon={Layers} label="Substitution allowed" className="bg-blue-100 text-blue-800" />
                                    ) : (
                                        <Badge icon={Layers} label="No substitution" className="bg-gray-100 text-gray-700" />
                                    )}
                                    <Badge
                                        icon={CalendarRange}
                                        label={drug.isActive ? 'Active' : 'Inactive'}
                                        className={drug.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 mt-6">
                                <p className="text-xs font-medium text-gray-500">Description</p>
                                <p className="rounded-md border bg-gray-50 p-3 text-sm text-gray-700">
                                    {drug.description || 'No description provided'}
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="forms">
                            <DrugFormsPanel drugId={drug.id} />
                        </TabsContent>

                        <TabsContent value="icds">
                            <DrugIcdRelationsPanel drugId={drug.id} />
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {drug && (
                <>
                    <DrugFormDialog
                        open={editOpen}
                        onOpenChange={(open) => {
                            setEditOpen(open)
                            if (!open) {
                                setFormError(null)
                            }
                        }}
                        onSubmit={handleEditSubmit}
                        loading={saving}
                        error={formError}
                        onError={setFormError}
                        initialValues={mapDrugToPayload(drug)}
                        mode="edit"
                    />

                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Drug</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete {drug.code}? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    )
}

function DetailItem({ label, value, rtl = false }: { label: string; value: string; rtl?: boolean }) {
    return (
        <div className="flex flex-col space-y-1">
            <span className="text-xs font-semibold text-gray-500">{label}</span>
            <span className={cn('text-sm text-gray-800', rtl && 'text-right')} dir={rtl ? 'rtl' : undefined}>
                {value}
            </span>
        </div>
    )
}

function Badge({
    label,
    icon: Icon,
    className,
}: {
    label: string
    icon: ComponentType<{ className?: string }>
    className?: string
}) {
    return (
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold', className)}>
            <Icon className="h-3 w-3" />
            {label}
        </span>
    )
}

