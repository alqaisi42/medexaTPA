'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SpecialLimit } from '@/types/policy'
import { fetchSpecialLimits } from '@/lib/api/policies'

interface PolicySpecialLimitsTabProps {
    policyId: number | null
}

export function PolicySpecialLimitsTab({ policyId }: PolicySpecialLimitsTabProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<SpecialLimit[]>([])

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
            const response = await fetchSpecialLimits(policyId)
            setData(response.content)
        } catch (err) {
            console.error('Failed to load special limits', err)
            setError(err instanceof Error ? err.message : 'Unable to load special limits')
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
                    <p className="text-gray-500">Please save the policy first to view special limits</p>
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
                        <p className="text-gray-500">No special limits configured</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Service Type</TableHead>
                                <TableHead>Limit Type</TableHead>
                                <TableHead>Limit Amount</TableHead>
                                <TableHead>Max Visits</TableHead>
                                <TableHead>Deductible</TableHead>
                                <TableHead>Copay %</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((sl) => (
                                <TableRow key={sl.id}>
                                    <TableCell>{sl.serviceType || '-'}</TableCell>
                                    <TableCell>{sl.limitType || '-'}</TableCell>
                                    <TableCell>{sl.limitAmount ?? '-'}</TableCell>
                                    <TableCell>{sl.maxVisits ?? '-'}</TableCell>
                                    <TableCell>{sl.deductibleAmount ?? '-'}</TableCell>
                                    <TableCell>{sl.copayPercent ?? '-'}</TableCell>
                                    <TableCell>{sl.notes || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}

