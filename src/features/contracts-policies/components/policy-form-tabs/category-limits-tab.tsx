'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CategoryLimit } from '@/types/policy'
import { fetchCategoryLimits } from '@/lib/api/policies'

interface PolicyCategoryLimitsTabProps {
    policyId: number | null
}

export function PolicyCategoryLimitsTab({ policyId }: PolicyCategoryLimitsTabProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<CategoryLimit[]>([])

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
            const response = await fetchCategoryLimits(policyId)
            setData(response.content)
        } catch (err) {
            console.error('Failed to load category limits', err)
            setError(err instanceof Error ? err.message : 'Unable to load category limits')
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
                    <p className="text-gray-500">Please save the policy first to view category limits</p>
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
                        <p className="text-gray-500">No category limits configured</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Service Category</TableHead>
                                <TableHead>Sub Category</TableHead>
                                <TableHead>Yearly Limit</TableHead>
                                <TableHead>Monthly Limit</TableHead>
                                <TableHead>Per Visit Limit</TableHead>
                                <TableHead>Max Visits</TableHead>
                                <TableHead>Copay %</TableHead>
                                <TableHead>Deductible</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((cl) => (
                                <TableRow key={cl.id}>
                                    <TableCell>{cl.serviceCategory || '-'}</TableCell>
                                    <TableCell>{cl.subCategory || '-'}</TableCell>
                                    <TableCell>{cl.yearlyLimit ?? '-'}</TableCell>
                                    <TableCell>{cl.monthlyLimit ?? '-'}</TableCell>
                                    <TableCell>{cl.perVisitLimit ?? '-'}</TableCell>
                                    <TableCell>{cl.maxVisits ?? '-'}</TableCell>
                                    <TableCell>{cl.copayPercent ?? '-'}</TableCell>
                                    <TableCell>{cl.deductibleAmount ?? '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}

