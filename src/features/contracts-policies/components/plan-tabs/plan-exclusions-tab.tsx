'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Edit, Trash2, Shield, AlertTriangle } from 'lucide-react'
import { PlanExclusion, ExclusionType } from '@/types/plan'
import { fetchPlanExclusions, deletePlanExclusion } from '@/lib/api/plans'
import { PlanExclusionFormDialog } from '../plan-exclusion-form-dialog'

interface PlanExclusionsTabProps {
    planId: number
}

export function PlanExclusionsTab({ planId }: PlanExclusionsTabProps) {
    const [exclusions, setExclusions] = useState<PlanExclusion[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [exclusionTypeFilter, setExclusionTypeFilter] = useState<string>('all')
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
    const [editingExclusion, setEditingExclusion] = useState<PlanExclusion | null>(null)

    const loadExclusions = async () => {
        try {
            setLoading(true)
            const data = await fetchPlanExclusions(planId, {
                exclusionType: exclusionTypeFilter === 'all' ? undefined : exclusionTypeFilter,
                size: 100
            })
            setExclusions(data)
        } catch (error) {
            console.error('Failed to load exclusions:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadExclusions()
    }, [planId, exclusionTypeFilter])

    const handleDeleteExclusion = async (exclusionId: number) => {
        if (!confirm('Are you sure you want to delete this exclusion?')) {
            return
        }

        try {
            await deletePlanExclusion(planId, exclusionId)
            await loadExclusions()
        } catch (error) {
            console.error('Failed to delete exclusion:', error)
            alert('Failed to delete exclusion')
        }
    }

    const handleEditExclusion = (exclusion: PlanExclusion) => {
        setEditingExclusion(exclusion)
        setIsFormDialogOpen(true)
    }

    const handleAddExclusion = () => {
        setEditingExclusion(null)
        setIsFormDialogOpen(true)
    }

    const handleFormClose = () => {
        setIsFormDialogOpen(false)
        setEditingExclusion(null)
        loadExclusions()
    }

    const filteredExclusions = exclusions.filter(exclusion => {
        const matchesSearch = 
            exclusion.codeValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exclusion.description.toLowerCase().includes(searchTerm.toLowerCase())
        
        return matchesSearch
    })

    const getExclusionTypeColor = (type: string) => {
        switch (type) {
            case 'ICD':
                return 'bg-blue-100 text-blue-800'
            case 'CPT':
                return 'bg-green-100 text-green-800'
            case 'DRUG':
                return 'bg-purple-100 text-purple-800'
            case 'PROCEDURE':
                return 'bg-orange-100 text-orange-800'
            case 'SPECIAL_CASE':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const exclusionStats = {
        total: exclusions.length,
        hardBlocks: exclusions.filter(e => e.isHardBlock).length,
        softBlocks: exclusions.filter(e => !e.isHardBlock).length,
        byType: exclusions.reduce((acc, exclusion) => {
            acc[exclusion.exclusionType] = (acc[exclusion.exclusionType] || 0) + 1
            return acc
        }, {} as Record<string, number>)
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Exclusions</p>
                                <p className="text-2xl font-bold">{exclusionStats.total}</p>
                            </div>
                            <Shield className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Hard Blocks</p>
                                <p className="text-2xl font-bold text-red-600">{exclusionStats.hardBlocks}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Soft Blocks</p>
                                <p className="text-2xl font-bold text-orange-600">{exclusionStats.softBlocks}</p>
                            </div>
                            <Shield className="h-8 w-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">ICD Exclusions</p>
                                <p className="text-2xl font-bold text-blue-600">{exclusionStats.byType.ICD || 0}</p>
                            </div>
                            <div className="text-xs text-gray-500">
                                CPT: {exclusionStats.byType.CPT || 0} | Drug: {exclusionStats.byType.DRUG || 0}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle>Plan Exclusions</CardTitle>
                        <Button onClick={handleAddExclusion} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add Exclusion
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search by code or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={exclusionTypeFilter} onValueChange={setExclusionTypeFilter}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="ICD">ICD</SelectItem>
                                <SelectItem value="CPT">CPT</SelectItem>
                                <SelectItem value="DRUG">Drug</SelectItem>
                                <SelectItem value="PROCEDURE">Procedure</SelectItem>
                                <SelectItem value="SPECIAL_CASE">Special Case</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Exclusions Table */}
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Block Type</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            Loading exclusions...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredExclusions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            {searchTerm || exclusionTypeFilter !== 'all' 
                                                ? 'No exclusions match your filters' 
                                                : 'No exclusions found. Add your first exclusion to get started.'
                                            }
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredExclusions.map((exclusion) => (
                                        <TableRow key={exclusion.id}>
                                            <TableCell>
                                                <Badge className={getExclusionTypeColor(exclusion.exclusionType)}>
                                                    {exclusion.exclusionType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {exclusion.codeValue}
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <div className="truncate" title={exclusion.description}>
                                                    {exclusion.description}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={exclusion.isHardBlock ? 'destructive' : 'secondary'}
                                                >
                                                    {exclusion.isHardBlock ? 'Hard Block' : 'Soft Block'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {typeof exclusion.createdAt === 'number' 
                                                    ? new Date(exclusion.createdAt * 1000).toLocaleDateString()
                                                    : new Date(exclusion.createdAt).toLocaleDateString()
                                                }
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditExclusion(exclusion)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteExclusion(exclusion.id)}
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
                </CardContent>
            </Card>

            {/* Form Dialog */}
            <PlanExclusionFormDialog
                open={isFormDialogOpen}
                onClose={handleFormClose}
                planId={planId}
                exclusion={editingExclusion}
            />
        </div>
    )
}