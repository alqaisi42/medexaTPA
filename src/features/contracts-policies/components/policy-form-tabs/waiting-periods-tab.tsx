'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { WaitingPeriod } from '@/types/policy'
import { fetchWaitingPeriods } from '@/lib/api/policies'

interface PolicyWaitingPeriodsTabProps {
    policyId: number | null
}

export function PolicyWaitingPeriodsTab({ policyId }: PolicyWaitingPeriodsTabProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<WaitingPeriod[]>([])

    useEffect(() => {
        if (policyId) {
            loadData()
        } else {
            setData([])
        }
    }, [policyId])

    const loadData = async () => {
        if (!policyId) return
        setLoading(true)
        setError(null)
        try {
            const response = await fetchWaitingPeriods(policyId)
            setData(response.content)
        } catch (err) {
            console.error('Failed to load waiting periods', err)
            setError(err instanceof Error ? err.message : 'Unable to load waiting periods')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!policyId) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <p className="text-gray-500">Please save the policy first to view waiting periods</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {data.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <p className="text-gray-500">No waiting periods configured</p>
                    </CardContent>
                </Card>
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
                            {data.map((wp) => (
                                <TableRow key={wp.id}>
                                    <TableCell>{wp.serviceType || '-'}</TableCell>
                                    <TableCell>{wp.days}</TableCell>
                                    <TableCell>{wp.icdCategoryId || '-'}</TableCell>
                                    <TableCell>{wp.procedureCategoryId || '-'}</TableCell>
                                    <TableCell>{wp.maternityFlag ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>{wp.notes || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}

