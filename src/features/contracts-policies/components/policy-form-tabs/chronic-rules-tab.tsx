'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChronicRule } from '@/types/policy'
import { fetchChronicRules } from '@/lib/api/policies'

interface PolicyChronicRulesTabProps {
    policyId: number | null
}

export function PolicyChronicRulesTab({ policyId }: PolicyChronicRulesTabProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<ChronicRule[]>([])

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
            const response = await fetchChronicRules(policyId)
            setData(response.content)
        } catch (err) {
            console.error('Failed to load chronic rules', err)
            setError(err instanceof Error ? err.message : 'Unable to load chronic rules')
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
                    <p className="text-gray-500">Please save the policy first to view chronic rules</p>
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
                        <p className="text-gray-500">No chronic rules configured</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ICD ID</TableHead>
                                <TableHead>Monthly Limit</TableHead>
                                <TableHead>Annual Limit</TableHead>
                                <TableHead>Per Prescription Limit</TableHead>
                                <TableHead>Max Visits Yearly</TableHead>
                                <TableHead>Followup Months</TableHead>
                                <TableHead>Long Term Meds</TableHead>
                                <TableHead>Max Medication Months</TableHead>
                                <TableHead>Requires Preapproval</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((cr) => (
                                <TableRow key={cr.id}>
                                    <TableCell>{cr.icdId || '-'}</TableCell>
                                    <TableCell>{cr.monthlyLimit ?? '-'}</TableCell>
                                    <TableCell>{cr.annualLimit ?? '-'}</TableCell>
                                    <TableCell>{cr.perPrescriptionLimit ?? '-'}</TableCell>
                                    <TableCell>{cr.maxVisitsYearly ?? '-'}</TableCell>
                                    <TableCell>{cr.mandatoryFollowupMonths ?? '-'}</TableCell>
                                    <TableCell>{cr.allowsLongTermMeds ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>{cr.maxMedicationMonthsSupply ?? '-'}</TableCell>
                                    <TableCell>{cr.requiresPreapproval ? 'Yes' : 'No'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}

