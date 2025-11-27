'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    Loader2,
    Plus,
    Edit2,
    Trash2,
    Search,
    AlertCircle,
    FileText,
    Calendar,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Subscriber } from '@/types/subscriber'
import { Policy, PolicyPayload, WaitingPeriod } from '@/types/policy'
import {
    searchPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    fetchPolicy,
    fetchWaitingPeriods,
} from '@/lib/api/policies'
import { getLookupRecords } from '@/features/lookup-management/services/master-lookup-service'
import { LookupRecord } from '@/types/lookup'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { cn } from '@/lib/utils'

interface ContractsPoliciesTabProps {
    subscriber: Subscriber
    onUpdate?: () => void
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

export function ContractsPoliciesTab({ subscriber, onUpdate }: ContractsPoliciesTabProps) {
    const [policies, setPolicies] = useState<Policy[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined)
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const pageSize = 10

    // Dialog states
    const [showPolicyDialog, setShowPolicyDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showWaitingPeriodsDialog, setShowWaitingPeriodsDialog] = useState(false)
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
    const [waitingPeriods, setWaitingPeriods] = useState<WaitingPeriod[]>([])
    const [loadingWaitingPeriods, setLoadingWaitingPeriods] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // Form state
    const [formData, setFormData] = useState<PolicyPayload>({
        policyNumber: '',
        policyCode: null,
        employerId: subscriber.employerId || 0,
        insuranceCompanyId: null,
        policyType: null,
        policyCategory: null,
        startDate: null,
        endDate: null,
        effectiveFrom: null,
        effectiveTo: null,
        globalLimit: null,
        inpatientLimit: null,
        outpatientLimit: null,
        pharmacyLimit: null,
        maternityLimit: null,
        dentalLimit: null,
        opticalLimit: null,
        hasMaternity: false,
        hasDental: false,
        hasOptical: false,
        hasPharmacy: false,
        pricingModel: null,
        networkType: null,
        isActive: true,
    })

    // Lookup states
    const [policyTypes, setPolicyTypes] = useState<LookupRecord[]>([])
    const [policyCategories, setPolicyCategories] = useState<LookupRecord[]>([])
    const [pricingModels, setPricingModels] = useState<LookupRecord[]>([])
    const [networkTypes, setNetworkTypes] = useState<LookupRecord[]>([])
    const [serviceTypes, setServiceTypes] = useState<LookupRecord[]>([])
    const [loadingLookups, setLoadingLookups] = useState(false)

    // Load lookups
    useEffect(() => {
        const loadLookups = async () => {
            setLoadingLookups(true)
            try {
                // Note: These lookup categories may need to be adjusted based on your actual API
                // For now, using service-types as a placeholder - adjust as needed
                const [types, categories, models, networks, services] = await Promise.all([
                    getLookupRecords('service-types').catch(() => []),
                    getLookupRecords('service-categories').catch(() => []),
                    getLookupRecords('service-types').catch(() => []),
                    getLookupRecords('service-types').catch(() => []),
                    getLookupRecords('service-types').catch(() => []),
                ])
                setPolicyTypes(types)
                setPolicyCategories(categories)
                setPricingModels(models)
                setNetworkTypes(networks)
                setServiceTypes(services)
            } catch (err) {
                console.error('Failed to load lookups', err)
            } finally {
                setLoadingLookups(false)
            }
        }
        void loadLookups()
    }, [])

    // Load policies
    const loadPolicies = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await searchPolicies({
                query: searchQuery || undefined,
                employerId: subscriber.employerId || undefined,
                isActive: isActiveFilter,
                page: currentPage,
                size: pageSize,
            })
            setPolicies(response.content)
            setTotalPages(response.totalPages)
            setTotalElements(response.totalElements)
        } catch (err) {
            console.error('Failed to load policies', err)
            setError(err instanceof Error ? err.message : 'Unable to load policies')
        } finally {
            setLoading(false)
        }
    }, [searchQuery, subscriber.employerId, isActiveFilter, currentPage])

    useEffect(() => {
        void loadPolicies()
    }, [loadPolicies])

    // Load waiting periods
    const loadWaitingPeriods = useCallback(async (policyId: number) => {
        setLoadingWaitingPeriods(true)
        try {
            const response = await fetchWaitingPeriods(policyId)
            setWaitingPeriods(response.content)
        } catch (err) {
            console.error('Failed to load waiting periods', err)
            setError(err instanceof Error ? err.message : 'Unable to load waiting periods')
        } finally {
            setLoadingWaitingPeriods(false)
        }
    }, [])

    const handleOpenPolicyDialog = (policy?: Policy) => {
        if (policy) {
            setIsEditing(true)
            setSelectedPolicy(policy)
            setFormData({
                policyCode: policy.policyCode,
                employerId: policy.employerId,
                insuranceCompanyId: policy.insuranceCompanyId,
                policyType: policy.policyType,
                policyCategory: policy.policyCategory,
                startDate: Array.isArray(policy.startDate)
                    ? `${policy.startDate[0]}-${String(policy.startDate[1]).padStart(2, '0')}-${String(policy.startDate[2]).padStart(2, '0')}`
                    : policy.startDate || null,
                endDate: Array.isArray(policy.endDate)
                    ? `${policy.endDate[0]}-${String(policy.endDate[1]).padStart(2, '0')}-${String(policy.endDate[2]).padStart(2, '0')}`
                    : policy.endDate || null,
                effectiveFrom: policy.effectiveFrom,
                effectiveTo: policy.effectiveTo,
                globalLimit: policy.globalLimit,
                inpatientLimit: policy.inpatientLimit,
                outpatientLimit: policy.outpatientLimit,
                pharmacyLimit: policy.pharmacyLimit,
                maternityLimit: policy.maternityLimit,
                dentalLimit: policy.dentalLimit,
                opticalLimit: policy.opticalLimit,
                hasMaternity: policy.hasMaternity,
                hasDental: policy.hasDental,
                hasOptical: policy.hasOptical,
                hasPharmacy: policy.hasPharmacy,
                pricingModel: policy.pricingModel,
                networkType: policy.networkType,
                isActive: policy.isActive,
            })
        } else {
            setIsEditing(false)
            setSelectedPolicy(null)
            setFormData({
                policyNumber: '',
                policyCode: null,
                employerId: subscriber.employerId || 0,
                insuranceCompanyId: null,
                policyType: null,
                policyCategory: null,
                startDate: null,
                endDate: null,
                effectiveFrom: null,
                effectiveTo: null,
                globalLimit: null,
                inpatientLimit: null,
                outpatientLimit: null,
                pharmacyLimit: null,
                maternityLimit: null,
                dentalLimit: null,
                opticalLimit: null,
                hasMaternity: false,
                hasDental: false,
                hasOptical: false,
                hasPharmacy: false,
                pricingModel: null,
                networkType: null,
                isActive: true,
            })
        }
        setShowPolicyDialog(true)
    }

    const handleClosePolicyDialog = () => {
        setShowPolicyDialog(false)
        setSelectedPolicy(null)
        setIsEditing(false)
        setError(null)
    }

    const handleSavePolicy = async () => {
        if (!formData.employerId) {
            setError('Employer ID is required')
            return
        }

        setSaving(true)
        setError(null)
        try {
            if (isEditing && selectedPolicy) {
                await updatePolicy(selectedPolicy.id, formData)
            } else {
                await createPolicy(formData)
            }
            setShowPolicyDialog(false)
            await loadPolicies()
            onUpdate?.()
        } catch (err) {
            console.error('Failed to save policy', err)
            setError(err instanceof Error ? err.message : 'Unable to save policy')
        } finally {
            setSaving(false)
        }
    }

    const handleOpenDeleteDialog = (policy: Policy) => {
        setSelectedPolicy(policy)
        setShowDeleteDialog(true)
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
            onUpdate?.()
        } catch (err) {
            console.error('Failed to delete policy', err)
            setError(err instanceof Error ? err.message : 'Unable to delete policy')
        } finally {
            setDeleting(false)
        }
    }

    const handleOpenWaitingPeriodsDialog = async (policy: Policy) => {
        setSelectedPolicy(policy)
        setShowWaitingPeriodsDialog(true)
        await loadWaitingPeriods(policy.id)
    }

    const handleSearch = () => {
        setCurrentPage(0)
        void loadPolicies()
    }

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        Contracts & Policies
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage policies and contracts for {subscriber.fullNameEn}
                    </p>
                </div>
                <Button onClick={() => handleOpenPolicyDialog()} disabled={loading || loadingLookups}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Policy
                </Button>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search policies by number, code..."
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
                        <Select
                            value={isActiveFilter === undefined ? 'all' : isActiveFilter ? 'active' : 'inactive'}
                            onValueChange={(value) => {
                                setIsActiveFilter(value === 'all' ? undefined : value === 'active')
                                setCurrentPage(0)
                            }}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active Only</SelectItem>
                                <SelectItem value="inactive">Inactive Only</SelectItem>
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
                            ? `${totalElements} policy${totalElements === 1 ? '' : 'ies'} found`
                            : 'No policies found'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : policies.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium text-gray-900 mb-2">No Policies Found</p>
                            <p className="text-sm text-gray-500 mb-4">
                                {searchQuery || isActiveFilter !== undefined
                                    ? 'Try adjusting your search criteria'
                                    : 'Create your first policy to get started'}
                            </p>
                            {!searchQuery && isActiveFilter === undefined && (
                                <Button onClick={() => handleOpenPolicyDialog()} disabled={loadingLookups}>
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
                                            <TableHead>Policy Code</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Start Date</TableHead>
                                            <TableHead>End Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {policies.map((policy) => (
                                            <TableRow key={policy.id}>
                                                <TableCell className="font-medium font-mono">
                                                    {policy.policyNumber}
                                                </TableCell>
                                                <TableCell>{policy.policyCode || '-'}</TableCell>
                                                <TableCell>{policy.policyType || '-'}</TableCell>
                                                <TableCell>{policy.policyCategory || '-'}</TableCell>
                                                <TableCell>{formatDate(policy.startDate)}</TableCell>
                                                <TableCell>{formatDate(policy.endDate)}</TableCell>
                                                <TableCell>
                                                    <span
                                                        className={cn(
                                                            'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                                                            policy.isActive
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-700',
                                                        )}
                                                    >
                                                        {policy.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenWaitingPeriodsDialog(policy)}
                                                            title="View Waiting Periods"
                                                        >
                                                            <Calendar className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenPolicyDialog(policy)}
                                                            title="Edit Policy"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenDeleteDialog(policy)}
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

            {/* Policy Form Dialog */}
            <Dialog open={showPolicyDialog} onOpenChange={handleClosePolicyDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Policy' : 'Create New Policy'}</DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? 'Update the policy details below'
                                : 'Fill in the details to create a new policy'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            {!isEditing && (
                                <div className="space-y-2">
                                    <Label htmlFor="policyNumber">Policy Number *</Label>
                                    <Input
                                        id="policyNumber"
                                        value={formData.policyNumber || ''}
                                        onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                                        placeholder="POL-2025-ABC"
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="policyCode">Policy Code</Label>
                                <Input
                                    id="policyCode"
                                    value={formData.policyCode || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, policyCode: e.target.value || null })
                                    }
                                    placeholder="Optional policy code"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="employerId">Employer ID *</Label>
                                <Input
                                    id="employerId"
                                    type="number"
                                    value={formData.employerId || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, employerId: Number(e.target.value) || 0 })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="insuranceCompanyId">Insurance Company ID</Label>
                                <Input
                                    id="insuranceCompanyId"
                                    type="number"
                                    value={formData.insuranceCompanyId || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            insuranceCompanyId: e.target.value ? Number(e.target.value) : null,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="policyType">Policy Type</Label>
                                <SearchableSelect
                                    options={policyTypes.map((item) => ({
                                        id: item.id,
                                        label: item.nameEn,
                                        subLabel: item.code,
                                    }))}
                                    value={formData.policyType || undefined}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            policyType: value
                                                ? policyTypes.find((t) => t.id === value)?.code || value
                                                : null,
                                        })
                                    }
                                    placeholder="Select policy type..."
                                    searchPlaceholder="Search policy types..."
                                    emptyMessage="No policy types found"
                                    loading={loadingLookups}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="policyCategory">Policy Category</Label>
                                <SearchableSelect
                                    options={policyCategories.map((item) => ({
                                        id: item.id,
                                        label: item.nameEn,
                                        subLabel: item.code,
                                    }))}
                                    value={formData.policyCategory || undefined}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            policyCategory: value
                                                ? policyCategories.find((c) => c.id === value)?.code || value
                                                : null,
                                        })
                                    }
                                    placeholder="Select policy category..."
                                    searchPlaceholder="Search policy categories..."
                                    emptyMessage="No policy categories found"
                                    loading={loadingLookups}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate || ''}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value || null })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate || ''}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value || null })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="effectiveFrom">Effective From</Label>
                                <Input
                                    id="effectiveFrom"
                                    type="date"
                                    value={formData.effectiveFrom || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, effectiveFrom: e.target.value || null })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="effectiveTo">Effective To</Label>
                                <Input
                                    id="effectiveTo"
                                    type="date"
                                    value={formData.effectiveTo || ''}
                                    onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value || null })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pricingModel">Pricing Model</Label>
                                <SearchableSelect
                                    options={pricingModels.map((item) => ({
                                        id: item.id,
                                        label: item.nameEn,
                                        subLabel: item.code,
                                    }))}
                                    value={formData.pricingModel || undefined}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            pricingModel: value
                                                ? pricingModels.find((m) => m.id === value)?.code || value
                                                : null,
                                        })
                                    }
                                    placeholder="Select pricing model..."
                                    searchPlaceholder="Search pricing models..."
                                    emptyMessage="No pricing models found"
                                    loading={loadingLookups}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="networkType">Network Type</Label>
                                <SearchableSelect
                                    options={networkTypes.map((item) => ({
                                        id: item.id,
                                        label: item.nameEn,
                                        subLabel: item.code,
                                    }))}
                                    value={formData.networkType || undefined}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            networkType: value
                                                ? networkTypes.find((n) => n.id === value)?.code || value
                                                : null,
                                        })
                                    }
                                    placeholder="Select network type..."
                                    searchPlaceholder="Search network types..."
                                    emptyMessage="No network types found"
                                    loading={loadingLookups}
                                />
                            </div>
                        </div>

                        {/* Limits */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Limits</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="globalLimit">Global Limit</Label>
                                    <Input
                                        id="globalLimit"
                                        type="number"
                                        value={formData.globalLimit || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                globalLimit: e.target.value ? Number(e.target.value) : null,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="inpatientLimit">Inpatient Limit</Label>
                                    <Input
                                        id="inpatientLimit"
                                        type="number"
                                        value={formData.inpatientLimit || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                inpatientLimit: e.target.value ? Number(e.target.value) : null,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="outpatientLimit">Outpatient Limit</Label>
                                    <Input
                                        id="outpatientLimit"
                                        type="number"
                                        value={formData.outpatientLimit || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                outpatientLimit: e.target.value ? Number(e.target.value) : null,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pharmacyLimit">Pharmacy Limit</Label>
                                    <Input
                                        id="pharmacyLimit"
                                        type="number"
                                        value={formData.pharmacyLimit || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                pharmacyLimit: e.target.value ? Number(e.target.value) : null,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maternityLimit">Maternity Limit</Label>
                                    <Input
                                        id="maternityLimit"
                                        type="number"
                                        value={formData.maternityLimit || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                maternityLimit: e.target.value ? Number(e.target.value) : null,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dentalLimit">Dental Limit</Label>
                                    <Input
                                        id="dentalLimit"
                                        type="number"
                                        value={formData.dentalLimit || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                dentalLimit: e.target.value ? Number(e.target.value) : null,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="opticalLimit">Optical Limit</Label>
                                    <Input
                                        id="opticalLimit"
                                        type="number"
                                        value={formData.opticalLimit || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                opticalLimit: e.target.value ? Number(e.target.value) : null,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Service Flags */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Service Coverage</h3>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="hasMaternity"
                                        checked={formData.hasMaternity || false}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, hasMaternity: checked })
                                        }
                                    />
                                    <Label htmlFor="hasMaternity">Maternity</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="hasDental"
                                        checked={formData.hasDental || false}
                                        onCheckedChange={(checked) => setFormData({ ...formData, hasDental: checked })}
                                    />
                                    <Label htmlFor="hasDental">Dental</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="hasOptical"
                                        checked={formData.hasOptical || false}
                                        onCheckedChange={(checked) => setFormData({ ...formData, hasOptical: checked })}
                                    />
                                    <Label htmlFor="hasOptical">Optical</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="hasPharmacy"
                                        checked={formData.hasPharmacy || false}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, hasPharmacy: checked })
                                        }
                                    />
                                    <Label htmlFor="hasPharmacy">Pharmacy</Label>
                                </div>
                            </div>
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center gap-2">
                            <Switch
                                id="isActive"
                                checked={formData.isActive ?? true}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                            <Label htmlFor="isActive">Active</Label>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={handleClosePolicyDialog} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSavePolicy} disabled={saving || loadingLookups} className="min-w-[120px]">
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                isEditing ? 'Update Policy' : 'Create Policy'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Waiting Periods Dialog */}
            <Dialog open={showWaitingPeriodsDialog} onOpenChange={setShowWaitingPeriodsDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Waiting Periods</DialogTitle>
                        <DialogDescription>
                            Waiting periods for policy: <strong>{selectedPolicy?.policyNumber}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {loadingWaitingPeriods ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ) : waitingPeriods.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-lg font-medium text-gray-900 mb-2">No Waiting Periods</p>
                                <p className="text-sm text-gray-500">No waiting periods configured for this policy.</p>
                            </div>
                        ) : (
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Service Type</TableHead>
                                            <TableHead>Days</TableHead>
                                            <TableHead>ICD Category</TableHead>
                                            <TableHead>Procedure Category</TableHead>
                                            <TableHead>Maternity Flag</TableHead>
                                            <TableHead>Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {waitingPeriods.map((wp) => (
                                            <TableRow key={wp.id}>
                                                <TableCell>{wp.serviceType || '-'}</TableCell>
                                                <TableCell>{wp.days}</TableCell>
                                                <TableCell>{wp.icdCategoryId || '-'}</TableCell>
                                                <TableCell>{wp.procedureCategoryId || '-'}</TableCell>
                                                <TableCell>
                                                    {wp.maternityFlag ? (
                                                        <span className="text-green-600">Yes</span>
                                                    ) : (
                                                        <span className="text-gray-400">No</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{wp.notes || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowWaitingPeriodsDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

