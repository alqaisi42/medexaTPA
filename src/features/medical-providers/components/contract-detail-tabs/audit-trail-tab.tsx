'use client'

import { Calendar, User, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ProviderContract } from '@/types/provider-contract'

interface AuditTrailTabProps {
    contract: ProviderContract
}

export function AuditTrailTab({ contract }: AuditTrailTabProps) {
    const formatDateTime = (value: number | string | null): string => {
        if (!value) return '-'
        const date = typeof value === 'string' ? new Date(value) : new Date(value * 1000)
        return date.toLocaleString()
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">Audit Trail</h2>
                <p className="text-sm text-gray-600">Contract creation and modification history</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Creation Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-sm text-gray-600">Created At</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>{formatDateTime(contract.createdAt)}</span>
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm text-gray-600">Created By</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <User className="h-4 w-4 text-gray-400" />
                                <span>{contract.createdBy || 'System'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Last Update Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-sm text-gray-600">Updated At</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>{formatDateTime(contract.updatedAt)}</span>
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm text-gray-600">Updated By</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <User className="h-4 w-4 text-gray-400" />
                                <span>{contract.updatedBy || 'System'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

