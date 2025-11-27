'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    Shield,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Download,
    RefreshCw,
    Calendar,
    DollarSign,
    Users,
    AlertCircle,
    CheckCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    FileText,
    Heart,
    Pill,
    Glasses,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Policy, PolicySearchFilters } from '@/types/policy'
import { searchPolicies, deletePolicy } from '@/lib/api/policies'
import { cn } from '@/lib/utils'

function formatCurrency(amount: number | null): string {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)
}

function formatDate(date: Policy['startDate'] | Policy['endDate']): string {
    if (!date) return '-'
    if (Array.isArray(date)) {
        return `${date[2]}/${date[1]}/${date[0]}`
    }
    if (typeof date === 'string') {
        return new Date(date).toLocaleDateString()
    }
    return '-'
}

export function PoliciesManagement() {
    const router = useRouter()
    const [policies, setPolicies] = useState<Policy[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [employerIdFilter, setEmployerIdFilter] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
    const [deleting, setDeleting] = useState(false)
    const pageSize = 10

    // Load policies
    const loadPolicies = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const filters: PolicySearchFilters = {
                page: currentPage,
                size: pageSize,
            }

            if (searchQuery.trim()) filters.query = searchQuery.trim()
            if (employerIdFilter.trim()) filters.employerId = Number(employerIdFilter)
            if (statusFilter !== 'all') filters.isActive = statusFilter === 'active'

            const response = await searchPolicies(filters)
            setPolicies(response.content)
            setTotalPages(response.totalPages)
            setTotalElements(response.totalElements)
        } catch (err) {
            console.error('Failed to load policies', err)
            setError(err instanceof Error ? err.message : 'Unable to load policies')
        } finally {
            setLoading(false)
        }
    }, [searchQuery, employerIdFilter, statusFilter, currentPage])

    useEffect(() => {
        void loadPolicies()
    }, [loadPolicies])

    const handleSearch = () => {
        setCurrentPage(0)
        void loadPolicies()
    }

    const handleDeletePolicy = async () => {
        if (!selectedPolicy) return

        setDeleting(true)
        setError(null)
        try {
            await deletePolicy(selectedPolicy.id)
            setShowDeleteDialog(false)
            setSelectedPolicy(null)
            await loadPolicies()
        } catch (err) {
            console.error('Failed to delete policy', err)
            setError(err instanceof Error ? err.message : 'Unable to delete policy')
        } finally {
            setDeleting(false)
        }
    }

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
    }

    const getStatusIcon = (policy: Policy) => {
        if (!policy.isActive) return <Clock className="h-4 w-4 text-gray-400" />
        if (policy.endDate) {
            const endDate = Array.isArray(policy.endDate) 
                ? new Date(policy.endDate[0], policy.endDate[1] - 1, policy.endDate[2])
                : new Date(policy.endDate)
            if (endDate < new Date()) {
                return <AlertCircle className="h-4 w-4 text-amber-500" />
            }
        }
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }

    const getStatusText = (policy: Policy) => {
        if (!policy.isActive) return 'Inactive'
        if (policy.endDate) {
            const endDate = Array.isArray(policy.endDate) 
                ? new Date(policy.endDate[0], policy.endDate[1] - 1, policy.endDate[2])
                : new Date(policy.endDate)
            if (endDate < new Date()) {
                return 'Expired'
            }
        }
        return 'Active'
    }

    const getStatusColor = (policy: Policy) => {
        if (!policy.isActive) return 'bg-gray-100 text-gray-700'
        if (policy.endDate) {
            const endDate = Array.isArray(policy.endDate) 
                ? new Date(policy.endDate[0], policy.endDate[1] - 1, policy.endDate[2])
                : new Date(policy.endDate)
            if (endDate < new Date()) {
                return 'bg-amber-100 text-amber-700'
            }
        }
        return 'bg-green-100 text-green-700'
    }

    const getCoverageIcons = (policy: Policy) => {
        const icons = []
        if (policy.hasMaternity) icons.push(<Heart key="maternity" className="h-3 w-3 text-pink-500" title="Maternity" />)
        if (policy.hasDental) icons.push(<FileText key="dental" className="h-3 w-3 text-blue-500" title="Dental" />)
        if (policy.hasOptical) icons.push(<Glasses key="optical" className="h-3 w-3 text-purple-500" title="Optical" />)
        if (policy.hasPharmacy) icons.push(<Pill key="pharmacy" className="h-3 w-3 text-green-500" title="Pharmacy" />)
        return icons
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="h-6 w-6 text-green-600" />
                        Insurance Policies
                    </h2>
                    <p className="text-gray-600 mt-1">Manage insurance policies and coverage plans</p>
                </div>
                <Button onClick={() => router.push('/contracts-policies/policies/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Policy
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Shield className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Policies</p>
                                <p className="text-2xl font-bold">{totalElements}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active</p>
                                <p className="text-2xl font-bold">
                                    {policies.filter(p => p.isActive).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-100 rounded-lg">
                                <Heart className="h-5 w-5 text-pink-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">With Maternity</p>
                                <p className="text-2xl font-bold">
                                    {policies.filter(p => p.hasMaternity).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                                <p className="text-2xl font-bold">
                                    {policies.filter(p => {
                                        if (!p.endDate) return false
                                        const endDate = Array.isArray(p.endDate) 
                                            ? new Date(p.endDate[0], p.endDate[1] - 1, p.endDate[2])
                                            : new Date(p.endDate)
                                        const thirtyDaysFromNow = new Date()
                                        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
                                        return endDate <= thirtyDaysFromNow && endDate >= new Date()
                                    }).length}
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
                                    placeholder="Search policies by number, code, type..."
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
                        <Input
                            type="number"
                            placeholder="Employer ID"
                            value={employerIdFilter}
                            onChange={(e) => setEmployerIdFilter(e.target.value)}
                            className="w-[150px]"
                        />
                        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleSearch} disabled={loading}>
                            <Search className="h-4 w-4 mr-2" />
                            Search
                        </Button>
                        <Button variant="outline" onClick={() => void loadPolicies()} disabled={loading}>
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

            {/* Policies Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Policies</CardTitle>
                    <CardDescription>
                        {totalElements > 0
                            ? `${totalElements} polic${totalElements === 1 ? 'y' : 'ies'} found`
                            : 'No policies found'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : policies.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium text-gray-900 mb-2">No Policies Found</p>
                            <p className="text-sm text-gray-500 mb-4">
                                {searchQuery || employerIdFilter || statusFilter !== 'all'
                                    ? 'Try adjusting your search criteria'
                                    : 'Create your first policy to get started'}
                            </p>
                            {!searchQuery && !employerIdFilter && statusFilter === 'all' && (
                                <Button onClick={() => router.push('/contracts-policies/policies/new')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Policy
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Policy Number</TableHead>
                                            <TableHead>Type & Category</TableHead>
                                            <TableHead>Employer</TableHead>
                                            <TableHead>Coverage Period</TableHead>
                                            <TableHead>Limits</TableHead>
                                            <TableHead>Coverage</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {policies.map((policy) => (
                                            <TableRow key={policy.id}>
                                                <TableCell className="font-medium font-mono">
                                                    <div>
                                                        <div>{policy.policyNumber}</div>
                                                        {policy.policyCode && (
                                                            <div className="text-sm text-gray-500">{policy.policyCode}</div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{policy.policyType || '-'}</div>
                                                        {policy.policyCategory && (
                                                            <div className="text-sm text-gray-500">{policy.policyCategory}</div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">Employer #{policy.employerId}</div>
                                                    {policy.networkType && (
                                                        <div className="text-sm text-gray-500">{policy.networkType}</div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <div>{formatDate(policy.startDate)}</div>
                                                        <div className="text-gray-500">to {formatDate(policy.endDate)}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <div className="font-medium">
                                                            Global: {formatCurrency(policy.globalLimit)}
                                                        </div>
                                                        {policy.inpatientLimit && (
                                                            <div className="text-gray-500">
                                                                IP: {formatCurrency(policy.inpatientLimit)}
                                                            </div>
                                                        )}
                                                        {policy.outpatientLimit && (
                                                            <div className="text-gray-500">
                                                                OP: {formatCurrency(policy.outpatientLimit)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        {getCoverageIcons(policy)}
                                                        {getCoverageIcons(policy).length === 0 && (
                                                            <span className="text-gray-400 text-sm">Basic</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(policy)}
                                                        <span className={cn(
                                                            'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                                                            getStatusColor(policy)
                                                        )}>
                                                            {getStatusText(policy)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push(`/contracts-policies/policies/${policy.id}`)}
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push(`/contracts-policies/policies/${policy.id}/edit`)}
                                                            title="Edit Policy"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedPolicy(policy)
                                                                setShowDeleteDialog(true)
                                                            }}
                                                            title="Delete Policy"
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Policy</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete policy <strong>{selectedPolicy?.policyNumber}</strong>? This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button onClick={handleDeletePolicy} disabled={deleting} variant="destructive">
                            {deleting ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
