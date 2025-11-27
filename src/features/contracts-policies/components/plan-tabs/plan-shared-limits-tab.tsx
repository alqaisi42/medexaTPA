'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Users,
    Plus,
    RefreshCw,
    Edit,
    Trash2,
    AlertCircle,
    DollarSign,
    Calendar,
    Shield,
    Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { LimitBucketDetail } from '@/types/plan'
import { fetchPlanLimitBuckets, deleteLimitBucket } from '@/lib/api/plans'
import { LimitBucketFormDialog } from '../limit-bucket-form-dialog'
import { cn } from '@/lib/utils'

interface PlanSharedLimitsTabProps {
    planId: number
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)
}

export function PlanSharedLimitsTab({ planId }: PlanSharedLimitsTabProps) {
    const [buckets, setBuckets] = useState<LimitBucketDetail[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedBucket, setSelectedBucket] = useState<LimitBucketDetail | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Load limit buckets
    const loadBuckets = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetchPlanLimitBuckets(planId)
            if (response.success && response.data) {
                setBuckets(response.data.content)
            }
        } catch (err) {
            console.error('Failed to load limit buckets', err)
            setError(err instanceof Error ? err.message : 'Unable to load limit buckets')
        } finally {
            setLoading(false)
        }
    }, [planId])

    useEffect(() => {
        void loadBuckets()
    }, [loadBuckets])

    const handleCreateBucket = () => {
        setSelectedBucket(null)
        setShowCreateDialog(true)
    }

    const handleEditBucket = (bucket: LimitBucketDetail) => {
        setSelectedBucket(bucket)
        setShowEditDialog(true)
    }

    const handleDeleteBucket = async () => {
        if (!selectedBucket) return

        setDeleting(true)
        setError(null)
        try {
            await deleteLimitBucket(planId, selectedBucket.id)
            setShowDeleteDialog(false)
            setSelectedBucket(null)
            await loadBuckets()
        } catch (err) {
            console.error('Failed to delete limit bucket', err)
            setError(err instanceof Error ? err.message : 'Unable to delete limit bucket')
        } finally {
            setDeleting(false)
        }
    }

    const handleBucketSaved = () => {
        setShowCreateDialog(false)
        setShowEditDialog(false)
        void loadBuckets()
    }

    const getPeriodIcon = (period: string) => {
        switch (period.toUpperCase()) {
            case 'PER_YEAR':
                return <Calendar className="h-4 w-4 text-blue-600" />
            case 'PER_MONTH':
                return <Calendar className="h-4 w-4 text-green-600" />
            case 'LIFETIME':
                return <Shield className="h-4 w-4 text-purple-600" />
            default:
                return <Calendar className="h-4 w-4 text-gray-400" />
        }
    }

    const formatPeriod = (period: string) => {
        return period.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        Shared Limits (Limit Buckets)
                    </h2>
                    <p className="text-gray-600 mt-1">Configure shared limits and limit buckets for this plan</p>
                </div>
                <Button onClick={handleCreateBucket}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Limit Bucket
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Buckets</p>
                                <p className="text-2xl font-bold">{buckets.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Limit Amount</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(buckets.reduce((sum, bucket) => sum + bucket.limitAmount, 0))}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Shield className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Benefits</p>
                                <p className="text-2xl font-bold">
                                    {buckets.reduce((sum, bucket) => sum + bucket.items.length, 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Limit Buckets Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Limit Buckets</CardTitle>
                    <CardDescription>
                        {buckets.length > 0
                            ? `${buckets.length} limit bucket${buckets.length === 1 ? '' : 's'} configured`
                            : 'No limit buckets configured'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : buckets.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium text-gray-900 mb-2">No Limit Buckets Found</p>
                            <p className="text-sm text-gray-500 mb-4">
                                Create limit buckets to group benefits with shared limits
                            </p>
                            <Button onClick={handleCreateBucket}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Bucket
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {buckets.map((bucket) => (
                                <Card key={bucket.id} className="border-l-4 border-l-purple-500">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-base">{bucket.nameEn}</CardTitle>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="h-4 w-4" />
                                                        <span>{formatCurrency(bucket.limitAmount)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {getPeriodIcon(bucket.limitPeriod)}
                                                        <span>{formatPeriod(bucket.limitPeriod)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Shield className="h-4 w-4" />
                                                        <span>{bucket.items.length} benefit{bucket.items.length !== 1 ? 's' : ''}</span>
                                                    </div>
                                                    {bucket.deductFromAnnualLimit && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Deducts from Annual
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditBucket(bucket)}
                                                    title="Edit Bucket"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedBucket(bucket)
                                                        setShowDeleteDialog(true)
                                                    }}
                                                    title="Delete Bucket"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        {bucket.items.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {bucket.items.map((item) => (
                                                    <Badge key={item.id} variant="outline" className="flex items-center gap-1">
                                                        <Tag className="h-3 w-3" />
                                                        {item.benefitName || `Benefit ${item.benefitId}`}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No benefits assigned to this bucket</p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Bucket Dialog */}
            <LimitBucketFormDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                planId={planId}
                mode="create"
                onSaved={handleBucketSaved}
            />

            {/* Edit Bucket Dialog */}
            <LimitBucketFormDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                planId={planId}
                mode="edit"
                bucket={selectedBucket}
                onSaved={handleBucketSaved}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Limit Bucket</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the limit bucket <strong>{selectedBucket?.nameEn}</strong>? 
                            This action cannot be undone and will remove all benefit assignments.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteBucket} disabled={deleting} variant="destructive">
                            {deleting ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
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
