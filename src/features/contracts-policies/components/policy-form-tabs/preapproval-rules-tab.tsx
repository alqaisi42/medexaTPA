'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PreapprovalRule } from '@/types/policy'
import { fetchPreapprovalRules } from '@/lib/api/policies'

interface PolicyPreapprovalRulesTabProps {
    policyId: number | null
}

export function PolicyPreapprovalRulesTab({ policyId }: PolicyPreapprovalRulesTabProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<PreapprovalRule[]>([])

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
            const response = await fetchPreapprovalRules(policyId)
            setData(response.content)
        } catch (err) {
            console.error('Failed to load preapproval rules', err)
            setError(err instanceof Error ? err.message : 'Unable to load preapproval rules')
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
                    <p className="text-gray-500">Please save the policy first to view preapproval rules</p>
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
                        <p className="text-gray-500">No preapproval rules configured</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Service Type</TableHead>
                                <TableHead>Procedure ID</TableHead>
                                <TableHead>ICD ID</TableHead>
                                <TableHead>Provider Type ID</TableHead>
                                <TableHead>Claim Type</TableHead>
                                <TableHead>Requires Preapproval</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((pr) => (
                                <TableRow key={pr.id}>
                                    <TableCell>{pr.serviceType || '-'}</TableCell>
                                    <TableCell>{pr.procedureId || '-'}</TableCell>
                                    <TableCell>{pr.icdId || '-'}</TableCell>
                                    <TableCell>{pr.providerTypeId || '-'}</TableCell>
                                    <TableCell>{pr.claimType || '-'}</TableCell>
                                    <TableCell>{pr.requiresPreapproval ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>{pr.notes || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}

