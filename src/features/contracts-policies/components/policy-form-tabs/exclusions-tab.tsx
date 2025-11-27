'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Exclusion } from '@/types/policy'
import { fetchExclusions } from '@/lib/api/policies'

interface PolicyExclusionsTabProps {
    policyId: number | null
}

export function PolicyExclusionsTab({ policyId }: PolicyExclusionsTabProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<Exclusion[]>([])

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
            const response = await fetchExclusions(policyId)
            setData(response.content)
        } catch (err) {
            console.error('Failed to load exclusions', err)
            setError(err instanceof Error ? err.message : 'Unable to load exclusions')
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
                    <p className="text-gray-500">Please save the policy first to view exclusions</p>
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
                        <p className="text-gray-500">No exclusions configured</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Exclusion Type</TableHead>
                                <TableHead>ICD ID</TableHead>
                                <TableHead>Procedure ID</TableHead>
                                <TableHead>Is Global</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((ex) => (
                                <TableRow key={ex.id}>
                                    <TableCell>{ex.code || '-'}</TableCell>
                                    <TableCell>{ex.description || '-'}</TableCell>
                                    <TableCell>{ex.exclusionType || '-'}</TableCell>
                                    <TableCell>{ex.icdId || '-'}</TableCell>
                                    <TableCell>{ex.procedureId || '-'}</TableCell>
                                    <TableCell>{ex.isGlobal ? 'Yes' : 'No'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}

