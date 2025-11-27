'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, FileText, AlertCircle, Calendar, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Subscriber } from '@/types/subscriber'
import { Policy, WaitingPeriod } from '@/types/policy'
import { fetchPoliciesBySubscriber, fetchWaitingPeriods } from '@/lib/api/policies'
import { cn } from '@/lib/utils'

interface SubscriberPoliciesTabProps {
    subscriber: Subscriber
    onUpdate?: () => void
}

function formatDate(date: Policy['startDate'] | Policy['endDate']): string {
    if (!date) return '-'
    if (Array.isArray(date)) {
        return `${date[2]}/${date[1]}/${date[0]}`
    }
    if (typeof date === 'string') {
        return new Date(date).toLocaleDateString()
    }
    return '-'
}

export function SubscriberPoliciesTab({ subscriber, onUpdate }: SubscriberPoliciesTabProps) {
    const [policies, setPolicies] = useState<Policy[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showWaitingPeriodsDialog, setShowWaitingPeriodsDialog] = useState(false)
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
    const [waitingPeriods, setWaitingPeriods] = useState<WaitingPeriod[]>([])
    const [loadingWaitingPeriods, setLoadingWaitingPeriods] = useState(false)

    const loadPolicies = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchPoliciesBySubscriber(subscriber.id)
            setPolicies(data)
        } catch (err) {
            console.error('Failed to load policies', err)
            setError(err instanceof Error ? err.message : 'Unable to load policies')
        } finally {
            setLoading(false)
        }
    }, [subscriber.id])

    useEffect(() => {
        void loadPolicies()
    }, [loadPolicies])

    const loadWaitingPeriods = useCallback(async (policyId: number) => {
        setLoadingWaitingPeriods(true)
        try {
            const response = await fetchWaitingPeriods(policyId)
            setWaitingPeriods(response.content)
        } catch (err) {
            console.error('Failed to load waiting periods', err)
            setError(err instanceof Error ? err.message : 'Unable to load waiting periods')
        } finally {
            setLoadingWaitingPeriods(false)
        }
    }, [])

    const handleOpenWaitingPeriodsDialog = async (policy: Policy) => {
        setSelectedPolicy(policy)
        setShowWaitingPeriodsDialog(true)
        await loadWaitingPeriods(policy.id)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        Policies
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Policies associated with {subscriber.fullNameEn}
                    </p>
                </div>
                <Button variant="outline" onClick={() => void loadPolicies()} disabled={loading}>
                    <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Policies Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Policies</CardTitle>
                    <CardDescription>
                        {policies.length > 0
                            ? `${policies.length} policy${policies.length === 1 ? '' : 'ies'} found`
                            : 'No policies found for this subscriber'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : policies.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium text-gray-900 mb-2">No Policies Found</p>
                            <p className="text-sm text-gray-500">
                                This subscriber does not have any associated policies.
                            </p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Policy Number</TableHead>
                                        <TableHead>Policy Code</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {policies.map((policy) => (
                                        <TableRow key={policy.id}>
                                            <TableCell className="font-medium font-mono">
                                                {policy.policyNumber}
                                            </TableCell>
                                            <TableCell>{policy.policyCode || '-'}</TableCell>
                                            <TableCell>{policy.policyType || '-'}</TableCell>
                                            <TableCell>{policy.policyCategory || '-'}</TableCell>
                                            <TableCell>{formatDate(policy.startDate)}</TableCell>
                                            <TableCell>{formatDate(policy.endDate)}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={cn(
                                                        'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                                                        policy.isActive
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-700',
                                                    )}
                                                >
                                                    {policy.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenWaitingPeriodsDialog(policy)}
                                                    title="View Waiting Periods"
                                                >
                                                    <Calendar className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Waiting Periods Dialog */}
            <Dialog open={showWaitingPeriodsDialog} onOpenChange={setShowWaitingPeriodsDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Waiting Periods</DialogTitle>
                        <DialogDescription>
                            Waiting periods for policy: <strong>{selectedPolicy?.policyNumber}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {loadingWaitingPeriods ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ) : waitingPeriods.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-lg font-medium text-gray-900 mb-2">No Waiting Periods</p>
                                <p className="text-sm text-gray-500">No waiting periods configured for this policy.</p>
                            </div>
                        ) : (
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Service Type</TableHead>
                                            <TableHead>Days</TableHead>
                                            <TableHead>ICD Category</TableHead>
                                            <TableHead>Procedure Category</TableHead>
                                            <TableHead>Maternity Flag</TableHead>
                                            <TableHead>Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {waitingPeriods.map((wp) => (
                                            <TableRow key={wp.id}>
                                                <TableCell>{wp.serviceType || '-'}</TableCell>
                                                <TableCell>{wp.days}</TableCell>
                                                <TableCell>{wp.icdCategoryId || '-'}</TableCell>
                                                <TableCell>{wp.procedureCategoryId || '-'}</TableCell>
                                                <TableCell>
                                                    {wp.maternityFlag ? (
                                                        <span className="text-green-600">Yes</span>
                                                    ) : (
                                                        <span className="text-gray-400">No</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{wp.notes || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowWaitingPeriodsDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

