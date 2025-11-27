'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    Building2,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Copy,
    RefreshCw,
    Calendar,
    DollarSign,
    Shield,
    AlertCircle,
    CheckCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    Ban,
    FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Contract, ContractSearchFilters, ContractStatus } from '@/types/contract'
import { fetchContracts, deleteContract, duplicateContract, updateContract, formatDate } from '@/lib/api/contracts'
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

export function ContractsManagement() {
    const router = useRouter()
    const [contracts, setContracts] = useState<Contract[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [payerIdFilter, setPayerIdFilter] = useState<string>('')
    const [corporateIdFilter, setCorporateIdFilter] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all')
    const [effectiveFromFilter, setEffectiveFromFilter] = useState<string>('')
    const [effectiveToFilter, setEffectiveToFilter] = useState<string>('')
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [deactivating, setDeactivating] = useState(false)
    const [duplicating, setDuplicating] = useState(false)
    const pageSize = 20

    // Load contracts
    const loadContracts = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const filters: ContractSearchFilters = {
                page: currentPage,
                size: pageSize,
            }

            if (searchQuery.trim()) filters.contractNumber = searchQuery.trim()
            if (payerIdFilter.trim()) filters.payerId = Number(payerIdFilter)
            if (corporateIdFilter.trim()) filters.corporateId = Number(corporateIdFilter)
            if (statusFilter !== 'all') filters.status = statusFilter as ContractStatus
            if (effectiveFromFilter) filters.startDateFrom = effectiveFromFilter
            if (effectiveToFilter) filters.endDateTo = effectiveToFilter

            const response = await fetchContracts(filters)
            setContracts(response.data.content)
            setTotalPages(response.data.totalPages)
            setTotalElements(response.data.totalElements)
        } catch (err) {
            console.error('Failed to load contracts', err)
            setError(err instanceof Error ? err.message : 'Unable to load contracts')
        } finally {
            setLoading(false)
        }
    }, [searchQuery, payerIdFilter, corporateIdFilter, statusFilter, effectiveFromFilter, effectiveToFilter, currentPage])

    useEffect(() => {
        void loadContracts()
    }, [loadContracts])

    const handleSearch = () => {
        setCurrentPage(0)
        void loadContracts()
    }

    const handleDeleteContract = async () => {
        if (!selectedContract) return

        setDeleting(true)
        setError(null)
        try {
            await deleteContract(selectedContract.id)
            setShowDeleteDialog(false)
            setSelectedContract(null)
            await loadContracts()
        } catch (err) {
            console.error('Failed to delete contract', err)
            setError(err instanceof Error ? err.message : 'Unable to delete contract')
        } finally {
            setDeleting(false)
        }
    }

    const handleDeactivateContract = async () => {
        if (!selectedContract) return

        setDeactivating(true)
        setError(null)
        try {
            // Update contract status to TERMINATED or SUSPENDED
            // For now, we'll use a simple approach - you might want to show a form to select termination reason
            await updateContract(selectedContract.id, {
                status: 'TERMINATED',
                terminationReason: 'Deactivated by user'
            })
            setShowDeactivateDialog(false)
            setSelectedContract(null)
            await loadContracts()
        } catch (err) {
            console.error('Failed to deactivate contract', err)
            setError(err instanceof Error ? err.message : 'Unable to deactivate contract')
        } finally {
            setDeactivating(false)
        }
    }

    const handleDuplicateContract = async (contract: Contract) => {
        setDuplicating(true)
        setError(null)
        try {
            console.log('Duplicating contract:', contract.id)
            const duplicatedContract = await duplicateContract(contract.id)
            console.log('Contract duplicated successfully:', duplicatedContract.id)
            await loadContracts()
            // Navigate to edit the duplicated contract
            router.push(`/contracts-policies/contracts/${duplicatedContract.id}/edit`)
        } catch (err) {
            console.error('Failed to duplicate contract', err)
            const errorMessage = err instanceof Error ? err.message : 'Unable to duplicate contract'
            setError(`Duplication failed: ${errorMessage}`)
        } finally {
            setDuplicating(false)
        }
    }

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
    }

    const getStatusIcon = (contract: Contract) => {
        switch (contract.status) {
            case 'ACTIVE':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'DRAFT':
                return <Clock className="h-4 w-4 text-blue-500" />
            case 'EXPIRED':
                return <AlertCircle className="h-4 w-4 text-amber-500" />
            case 'TERMINATED':
                return <Ban className="h-4 w-4 text-red-500" />
            case 'SUSPENDED':
                return <Clock className="h-4 w-4 text-gray-500" />
            default:
                return <Clock className="h-4 w-4 text-gray-400" />
        }
    }

    const getStatusColor = (contract: Contract) => {
        switch (contract.status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-700'
            case 'DRAFT':
                return 'bg-blue-100 text-blue-700'
            case 'EXPIRED':
                return 'bg-amber-100 text-amber-700'
            case 'TERMINATED':
                return 'bg-red-100 text-red-700'
            case 'SUSPENDED':
                return 'bg-gray-100 text-gray-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6 text-blue-600" />
                        Contract Management
                    </h2>
                    <p className="text-gray-600 mt-1">Manage insurance contracts and agreements</p>
                </div>
                <Button onClick={() => router.push('/contracts-policies/contracts/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Contract
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Contracts</p>
                                <p className="text-2xl font-bold">{totalElements}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active</p>
                                <p className="text-2xl font-bold">
                                    {contracts.filter(c => c.status === 'ACTIVE').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Clock className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Draft</p>
                                <p className="text-2xl font-bold">
                                    {contracts.filter(c => c.status === 'DRAFT').length}
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
                                    {contracts.filter(c => {
                                        if (!c.endDate) return false
                                        const endDate = Array.isArray(c.endDate) 
                                            ? new Date(c.endDate[0], c.endDate[1] - 1, c.endDate[2])
                                            : new Date(c.endDate)
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
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex-1 min-w-[300px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by contract code, provider, or company..."
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
                            <Button variant="outline" onClick={() => void loadContracts()} disabled={loading}>
                                <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                                Refresh
                            </Button>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-4 flex-wrap">
                            <Input
                                type="number"
                                placeholder="Payer ID"
                                value={payerIdFilter}
                                onChange={(e) => setPayerIdFilter(e.target.value)}
                                className="w-[120px]"
                            />
                            <Input
                                type="number"
                                placeholder="Corporate ID"
                                value={corporateIdFilter}
                                onChange={(e) => setCorporateIdFilter(e.target.value)}
                                className="w-[140px]"
                            />
                            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                    <SelectItem value="EXPIRED">Expired</SelectItem>
                                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                placeholder="Effective From"
                                value={effectiveFromFilter}
                                onChange={(e) => setEffectiveFromFilter(e.target.value)}
                                className="w-[160px]"
                            />
                            <Input
                                type="date"
                                placeholder="Effective To"
                                value={effectiveToFilter}
                                onChange={(e) => setEffectiveToFilter(e.target.value)}
                                className="w-[160px]"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Contracts Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Contracts</CardTitle>
                    <CardDescription>
                        {totalElements > 0
                            ? `${totalElements} contract${totalElements === 1 ? '' : 's'} found`
                            : 'No contracts found'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : contracts.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium text-gray-900 mb-2">No Contracts Found</p>
                            <p className="text-sm text-gray-500 mb-4">
                                {searchQuery || payerIdFilter || corporateIdFilter || statusFilter !== 'all' || effectiveFromFilter || effectiveToFilter
                                    ? 'Try adjusting your search criteria'
                                    : 'Create your first contract to get started'}
                            </p>
                            {!searchQuery && !payerIdFilter && !corporateIdFilter && statusFilter === 'all' && !effectiveFromFilter && !effectiveToFilter && (
                                <Button onClick={() => router.push('/contracts-policies/contracts/new')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Contract
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Contract Number</TableHead>
                                            <TableHead>Payer / Corporate</TableHead>
                                            <TableHead>Effective From</TableHead>
                                            <TableHead>Effective To</TableHead>
                                            <TableHead>Premium</TableHead>
                                            <TableHead>Plans</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {contracts.map((contract) => (
                                            <TableRow key={contract.id}>
                                                <TableCell className="font-medium font-mono">
                                                    <div>
                                                        <div>{contract.contractNumber}</div>
                                                        <div className="text-sm text-gray-500">{contract.currencyCode}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">Payer #{contract.payerId}</div>
                                                        <div className="text-sm text-gray-500">Corporate #{contract.corporateId}</div>
                                                        {contract.tpaBranchId && (
                                                            <div className="text-xs text-gray-400">Branch #{contract.tpaBranchId}</div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {formatDate(contract.startDate)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {formatDate(contract.endDate)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {contract.totalPremium ? (
                                                            <div className="font-medium">
                                                                {formatCurrency(contract.totalPremium)}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <div className="font-medium">{contract.plans.length} plan{contract.plans.length !== 1 ? 's' : ''}</div>
                                                        {contract.plans.length > 0 && (
                                                            <div className="text-gray-500 truncate max-w-[120px]">
                                                                {contract.plans[0].nameEn}
                                                                {contract.plans.length > 1 && ` +${contract.plans.length - 1} more`}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(contract)}
                                                        <span className={cn(
                                                            'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                                                            getStatusColor(contract)
                                                        )}>
                                                            {contract.status}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push(`/contracts-policies/contracts/${contract.id}`)}
                                                            title="View Contract"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDuplicateContract(contract)}
                                                            title="Duplicate Contract"
                                                            disabled={duplicating}
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                        {contract.status === 'ACTIVE' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedContract(contract)
                                                                    setShowDeactivateDialog(true)
                                                                }}
                                                                title="Deactivate Contract"
                                                            >
                                                                <Ban className="h-4 w-4 text-amber-600" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedContract(contract)
                                                                setShowDeleteDialog(true)
                                                            }}
                                                            title="Delete Contract"
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
                        <DialogTitle>Delete Contract</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete contract <strong>{selectedContract?.contractNumber}</strong>? This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteContract} disabled={deleting} variant="destructive">
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

            {/* Deactivate Confirmation Dialog */}
            <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deactivate Contract</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to deactivate contract <strong>{selectedContract?.contractNumber}</strong>? 
                            This will set the contract status to terminated.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeactivateDialog(false)} disabled={deactivating}>
                            Cancel
                        </Button>
                        <Button onClick={handleDeactivateContract} disabled={deactivating} variant="destructive">
                            {deactivating ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Deactivating...
                                </>
                            ) : (
                                'Deactivate'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
