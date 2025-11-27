'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Plus,
    Search,
    RefreshCw,
    Eye,
    Edit,
    Trash2,
    FileText,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Users,
    DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plan, PlanSearchFilters } from '@/types/plan'
import { fetchPlans } from '@/lib/api/plans'
import { fetchContract } from '@/lib/api/contracts'
import { cn } from '@/lib/utils'

interface PlansManagementPageProps {
    contractId: number
}

export function PlansManagementPage({ contractId }: PlansManagementPageProps) {
    const router = useRouter()
    const [plans, setPlans] = useState<Plan[]>([])
    const [contractNumber, setContractNumber] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const pageSize = 20

    // Load contract info and plans
    const loadData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            // Load contract info first
            const contract = await fetchContract(contractId)
            setContractNumber(contract.contractNumber)

            // Load plans
            const filters: PlanSearchFilters = {
                contractId,
                page: currentPage,
                size: pageSize,
            }

            if (searchQuery.trim()) {
                filters.planCode = searchQuery.trim()
            }

            const response = await fetchPlans(filters)
            setPlans(response.content)
            setTotalPages(response.totalPages)
            setTotalElements(response.totalElements)
        } catch (err) {
            console.error('Failed to load plans', err)
            setError(err instanceof Error ? err.message : 'Unable to load plans')
        } finally {
            setLoading(false)
        }
    }, [contractId, searchQuery, currentPage])

    useEffect(() => {
        void loadData()
    }, [loadData])

    const handleSearch = () => {
        setCurrentPage(0)
        void loadData()
    }

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
    }

    const handleCreatePlan = () => {
        router.push(`/contracts-policies/contracts/${contractId}/plans/new`)
    }

    const handleViewPlan = (planId: number) => {
        router.push(`/contracts-policies/contracts/${contractId}/plans/${planId}`)
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Contract
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6 text-blue-600" />
                            Plan Management
                        </h1>
                        <p className="text-gray-600 mt-1">Contract: {contractNumber}</p>
                    </div>
                </div>
                <Button onClick={handleCreatePlan}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Plan
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Plans</p>
                                <p className="text-2xl font-bold">{totalElements}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Plans</p>
                                <p className="text-2xl font-bold">{plans.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <FileText className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Limit Buckets</p>
                                <p className="text-2xl font-bold">
                                    {plans.reduce((sum, plan) => sum + plan.limitBucketsCount, 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search plans by code..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch()
                                        }
                                    }}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Button onClick={handleSearch} disabled={loading}>
                            <Search className="h-4 w-4 mr-2" />
                            Search
                        </Button>
                        <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
                            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Plans Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Insurance Plans</CardTitle>
                    <CardDescription>
                        {totalElements > 0
                            ? `${totalElements} plan${totalElements === 1 ? '' : 's'} found`
                            : 'No plans found'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : plans.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium text-gray-900 mb-2">No Plans Found</p>
                            <p className="text-sm text-gray-500 mb-4">
                                {searchQuery
                                    ? 'Try adjusting your search criteria'
                                    : 'Create your first plan to get started'}
                            </p>
                            {!searchQuery && (
                                <Button onClick={handleCreatePlan}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Plan
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Plan Code</TableHead>
                                            <TableHead>Contract Number</TableHead>
                                            <TableHead>Limit Buckets</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {plans.map((plan) => (
                                            <TableRow key={plan.id}>
                                                <TableCell className="font-medium font-mono">
                                                    {plan.planCode}
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    {plan.contractNumber}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-gray-400" />
                                                        <span>{plan.limitBucketsCount} bucket{plan.limitBucketsCount !== 1 ? 's' : ''}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                        Active
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewPlan(plan.id)}
                                                            title="View Plan Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewPlan(plan.id)}
                                                            title="Edit Plan"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                // TODO: Implement delete functionality
                                                            }}
                                                            title="Delete Plan"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-gray-600">
                                        Page {currentPage + 1} of {totalPages} ({totalElements} total)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 0 || loading}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage >= totalPages - 1 || loading}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
