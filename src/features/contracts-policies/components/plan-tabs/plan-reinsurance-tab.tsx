'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, Shield, TrendingUp, DollarSign, Hash } from 'lucide-react'
import { PlanReinsurance } from '@/types/plan'
import { fetchPlanReinsurance, detachPlanReinsurance } from '@/lib/api/plans'
import { PlanReinsuranceFormDialog } from '../plan-reinsurance-form-dialog'

interface PlanReinsuranceTabProps {
    planId: number
}

export function PlanReinsuranceTab({ planId }: PlanReinsuranceTabProps) {
    const [reinsurances, setReinsurances] = useState<PlanReinsurance[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
    const [editingReinsurance, setEditingReinsurance] = useState<PlanReinsurance | null>(null)

    const loadReinsurances = async () => {
        try {
            setLoading(true)
            const data = await fetchPlanReinsurance(planId, { size: 100 })
            setReinsurances(data)
        } catch (error) {
            console.error('Failed to load reinsurances:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadReinsurances()
    }, [planId])

    const handleDetachReinsurance = async (treatyId: number) => {
        if (!confirm('Are you sure you want to detach this reinsurance treaty?')) {
            return
        }

        try {
            await detachPlanReinsurance(planId, treatyId)
            await loadReinsurances()
        } catch (error) {
            console.error('Failed to detach reinsurance:', error)
            alert('Failed to detach reinsurance treaty')
        }
    }

    const handleEditReinsurance = (reinsurance: PlanReinsurance) => {
        setEditingReinsurance(reinsurance)
        setIsFormDialogOpen(true)
    }

    const handleAttachReinsurance = () => {
        setEditingReinsurance(null)
        setIsFormDialogOpen(true)
    }

    const handleFormClose = () => {
        setIsFormDialogOpen(false)
        setEditingReinsurance(null)
        loadReinsurances()
    }

    const filteredReinsurances = reinsurances.filter(reinsurance => {
        const matchesSearch = 
            reinsurance.treatyNameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (reinsurance.treatyCode && reinsurance.treatyCode.toLowerCase().includes(searchTerm.toLowerCase()))
        
        return matchesSearch
    })

    const reinsuranceStats = {
        total: reinsurances.length,
        totalRetention: reinsurances.reduce((sum, r) => sum + r.retentionLimit, 0),
        avgCededPercentage: reinsurances.length > 0 
            ? reinsurances.reduce((sum, r) => sum + r.cededPercentage, 0) / reinsurances.length 
            : 0,
        highestPriority: reinsurances.length > 0 
            ? Math.max(...reinsurances.map(r => r.priorityOrder)) 
            : 0
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const getPriorityColor = (priority: number) => {
        if (priority === 1) return 'bg-green-100 text-green-800'
        if (priority <= 3) return 'bg-blue-100 text-blue-800'
        if (priority <= 5) return 'bg-yellow-100 text-yellow-800'
        return 'bg-red-100 text-red-800'
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Treaties</p>
                                <p className="text-2xl font-bold">{reinsuranceStats.total}</p>
                            </div>
                            <Shield className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Retention</p>
                                <p className="text-2xl font-bold">{formatCurrency(reinsuranceStats.totalRetention)}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Ceded %</p>
                                <p className="text-2xl font-bold">{reinsuranceStats.avgCededPercentage.toFixed(1)}%</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Max Priority</p>
                                <p className="text-2xl font-bold">{reinsuranceStats.highestPriority}</p>
                            </div>
                            <Hash className="h-8 w-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle>Reinsurance Treaties</CardTitle>
                        <Button onClick={handleAttachReinsurance} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Attach Treaty
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search by treaty name or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Reinsurance Table */}
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Treaty Name</TableHead>
                                    <TableHead>Treaty Code</TableHead>
                                    <TableHead>Retention Limit</TableHead>
                                    <TableHead>Ceded %</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            Loading reinsurance treaties...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredReinsurances.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            {searchTerm 
                                                ? 'No treaties match your search' 
                                                : 'No reinsurance treaties attached. Attach your first treaty to get started.'
                                            }
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredReinsurances
                                        .sort((a, b) => a.priorityOrder - b.priorityOrder)
                                        .map((reinsurance) => (
                                            <TableRow key={reinsurance.id}>
                                                <TableCell className="font-medium">
                                                    {reinsurance.treatyNameEn}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {reinsurance.treatyCode || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {formatCurrency(reinsurance.retentionLimit)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{reinsurance.cededPercentage}%</span>
                                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className="bg-blue-600 h-2 rounded-full" 
                                                                style={{ width: `${Math.min(reinsurance.cededPercentage, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getPriorityColor(reinsurance.priorityOrder)}>
                                                        Priority {reinsurance.priorityOrder}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditReinsurance(reinsurance)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDetachReinsurance(reinsurance.treatyId)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Priority Information */}
                    {reinsurances.length > 0 && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">Priority Order:</h4>
                            <p className="text-sm text-blue-800">
                                Treaties are processed in priority order (1 = highest priority). 
                                Lower priority treaties only apply after higher priority treaties reach their limits.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Form Dialog */}
            <PlanReinsuranceFormDialog
                open={isFormDialogOpen}
                onClose={handleFormClose}
                planId={planId}
                reinsurance={editingReinsurance}
            />
        </div>
    )
}