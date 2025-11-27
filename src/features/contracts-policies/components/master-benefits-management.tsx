'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Plus,
    Search,
    RefreshCw,
    Edit,
    Trash2,
    Shield,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Settings,
    Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MasterBenefit } from '@/types/plan'
import { fetchMasterBenefits, deleteMasterBenefit } from '@/lib/api/plans'
import { MasterBenefitFormDialog } from './master-benefit-form-dialog'
import { BenefitMappingDialog } from './benefit-mapping-dialog'
import { cn } from '@/lib/utils'

export function MasterBenefitsManagement() {
    const [benefits, setBenefits] = useState<MasterBenefit[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showMappingDialog, setShowMappingDialog] = useState(false)
    const [selectedBenefit, setSelectedBenefit] = useState<MasterBenefit | null>(null)
    const [deleting, setDeleting] = useState(false)
    const pageSize = 20

    // Load master benefits
    const loadBenefits = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetchMasterBenefits(currentPage, pageSize)
            if (response.success && response.data) {
                setBenefits(response.data.content)
                setTotalPages(response.data.totalPages)
                setTotalElements(response.data.totalElements)
            }
        } catch (err) {
            console.error('Failed to load master benefits', err)
            setError(err instanceof Error ? err.message : 'Unable to load master benefits')
        } finally {
            setLoading(false)
        }
    }, [currentPage])

    useEffect(() => {
        void loadBenefits()
    }, [loadBenefits])

    const handleSearch = () => {
        setCurrentPage(0)
        void loadBenefits()
    }

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
    }

    const handleCreateBenefit = () => {
        setSelectedBenefit(null)
        setShowCreateDialog(true)
    }

    const handleEditBenefit = (benefit: MasterBenefit) => {
        setSelectedBenefit(benefit)
        setShowEditDialog(true)
    }

    const handleDeleteBenefit = async () => {
        if (!selectedBenefit) return

        setDeleting(true)
        setError(null)
        try {
            await deleteMasterBenefit(selectedBenefit.id)
            setShowDeleteDialog(false)
            setSelectedBenefit(null)
            await loadBenefits()
        } catch (err) {
            console.error('Failed to delete benefit', err)
            setError(err instanceof Error ? err.message : 'Unable to delete benefit')
        } finally {
            setDeleting(false)
        }
    }

    const handleManageMapping = (benefit: MasterBenefit) => {
        setSelectedBenefit(benefit)
        setShowMappingDialog(true)
    }

    const handleBenefitSaved = () => {
        setShowCreateDialog(false)
        setShowEditDialog(false)
        void loadBenefits()
    }

    const filteredBenefits = benefits.filter(benefit =>
        benefit.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        benefit.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (benefit.nameAr && benefit.nameAr.toLowerCase().includes(searchQuery.toLowerCase())) ||
        benefit.categoryNameEn.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="h-6 w-6 text-blue-600" />
                        Master Benefits
                    </h2>
                    <p className="text-gray-600 mt-1">Manage the master catalog of insurance benefits</p>
                </div>
                <Button onClick={handleCreateBenefit}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Benefit
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Shield className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Benefits</p>
                                <p className="text-2xl font-bold">{totalElements}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Shield className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Benefits</p>
                                <p className="text-2xl font-bold">
                                    {benefits.filter(b => b.isActive).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Tag className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Categories</p>
                                <p className="text-2xl font-bold">
                                    {new Set(benefits.map(b => b.categoryId)).size}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Settings className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Inactive Benefits</p>
                                <p className="text-2xl font-bold">
                                    {benefits.filter(b => !b.isActive).length}
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
                                    placeholder="Search benefits by code, name, or category..."
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
                        <Button variant="outline" onClick={() => void loadBenefits()} disabled={loading}>
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

            {/* Benefits Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Master Benefits</CardTitle>
                    <CardDescription>
                        {totalElements > 0
                            ? `${totalElements} benefit${totalElements === 1 ? '' : 's'} found`
                            : 'No benefits found'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : filteredBenefits.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium text-gray-900 mb-2">No Benefits Found</p>
                            <p className="text-sm text-gray-500 mb-4">
                                {searchQuery
                                    ? 'Try adjusting your search criteria'
                                    : 'Create your first master benefit to get started'}
                            </p>
                            {!searchQuery && (
                                <Button onClick={handleCreateBenefit}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Benefit
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Name (English)</TableHead>
                                            <TableHead>Name (Arabic)</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredBenefits.map((benefit) => (
                                            <TableRow key={benefit.id}>
                                                <TableCell className="font-medium font-mono">
                                                    {benefit.code}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{benefit.nameEn}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-gray-600">
                                                        {benefit.nameAr || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="h-4 w-4 text-gray-400" />
                                                        <span>{benefit.categoryNameEn}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                                                        benefit.isActive
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                    )}>
                                                        {benefit.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleManageMapping(benefit)}
                                                            title="Manage Mapping"
                                                        >
                                                            <Settings className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditBenefit(benefit)}
                                                            title="Edit Benefit"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedBenefit(benefit)
                                                                setShowDeleteDialog(true)
                                                            }}
                                                            title="Delete Benefit"
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

            {/* Create Benefit Dialog */}
            <MasterBenefitFormDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                mode="create"
                onSaved={handleBenefitSaved}
            />

            {/* Edit Benefit Dialog */}
            <MasterBenefitFormDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                mode="edit"
                benefit={selectedBenefit}
                onSaved={handleBenefitSaved}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Master Benefit</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete benefit <strong>{selectedBenefit?.code}</strong>? 
                            This action cannot be undone and may affect existing plans that use this benefit.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteBenefit} disabled={deleting} variant="destructive">
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

            {/* Benefit Mapping Dialog */}
            <BenefitMappingDialog
                open={showMappingDialog}
                onOpenChange={setShowMappingDialog}
                benefit={selectedBenefit}
            />
        </div>
    )
}
