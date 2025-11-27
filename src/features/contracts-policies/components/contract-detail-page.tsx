'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Edit,
    Copy,
    Trash2,
    Ban,
    FileText,
    Calendar,
    DollarSign,
    Building2,
    Users,
    CheckCircle,
    Clock,
    AlertCircle,
    RefreshCw,
    Settings,
    Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Contract } from '@/types/contract'
import { fetchContract, deleteContract, duplicateContract, updateContract, formatDate, fetchContractPlans } from '@/lib/api/contracts'
import { cn } from '@/lib/utils'
import { ContractPricingPoliciesTab } from './contract-tabs/contract-pricing-policies-tab'
import { ContractSubmissionRulesTab } from './contract-tabs/contract-submission-rules-tab'
import { ContractCaseDefinitionsTab } from './contract-tabs/contract-case-definitions-tab'

interface ContractDetailPageProps {
    contractId: number
}

function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)
}

export function ContractDetailPage({ contractId }: ContractDetailPageProps) {
    const router = useRouter()
    const [contract, setContract] = useState<Contract | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [deactivating, setDeactivating] = useState(false)
    const [duplicating, setDuplicating] = useState(false)

    // Load contract details
    const loadContract = async () => {
        setLoading(true)
        setError(null)
        try {
            const contractData = await fetchContract(contractId)
            setContract(contractData)
        } catch (err) {
            console.error('Failed to load contract', err)
            setError(err instanceof Error ? err.message : 'Unable to load contract')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadContract()
    }, [contractId])

    const handleDeleteContract = async () => {
        if (!contract) return

        setDeleting(true)
        setError(null)
        try {
            await deleteContract(contract.id)
            router.push('/contracts-policies?tab=contracts')
        } catch (err) {
            console.error('Failed to delete contract', err)
            setError(err instanceof Error ? err.message : 'Unable to delete contract')
        } finally {
            setDeleting(false)
            setShowDeleteDialog(false)
        }
    }

    const handleDeactivateContract = async () => {
        if (!contract) return

        setDeactivating(true)
        setError(null)
        try {
            await updateContract(contract.id, {
                status: 'TERMINATED',
                terminationReason: 'Deactivated by user'
            })
            await loadContract() // Reload to show updated status
        } catch (err) {
            console.error('Failed to deactivate contract', err)
            setError(err instanceof Error ? err.message : 'Unable to deactivate contract')
        } finally {
            setDeactivating(false)
            setShowDeactivateDialog(false)
        }
    }

    const handleDuplicateContract = async () => {
        if (!contract) return

        setDuplicating(true)
        setError(null)
        try {
            const duplicatedContract = await duplicateContract(contract.id)
            router.push(`/contracts-policies/contracts/${duplicatedContract.id}/edit`)
        } catch (err) {
            console.error('Failed to duplicate contract', err)
            setError(err instanceof Error ? err.message : 'Unable to duplicate contract')
        } finally {
            setDuplicating(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'DRAFT':
                return <Clock className="h-5 w-5 text-blue-500" />
            case 'EXPIRED':
                return <AlertCircle className="h-5 w-5 text-amber-500" />
            case 'TERMINATED':
                return <Ban className="h-5 w-5 text-red-500" />
            case 'SUSPENDED':
                return <Clock className="h-5 w-5 text-gray-500" />
            default:
                return <Clock className="h-5 w-5 text-gray-400" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
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

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            </div>
        )
    }

    if (error || !contract) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </div>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error || 'Contract not found'}</span>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6 text-blue-600" />
                            Contract Details
                        </h1>
                        <p className="text-gray-600 mt-1">{contract.contractNumber}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleDuplicateContract}
                        disabled={duplicating}
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        {duplicating ? 'Duplicating...' : 'Duplicate'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/contracts-policies/contracts/${contract.id}/plans`)}
                    >
                        <Users className="h-4 w-4 mr-2" />
                        Manage Plans
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/contracts-policies/contracts/${contract.id}/limits`)}
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Limits
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/contracts-policies/contracts/${contract.id}/edit`)}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    {contract.status === 'ACTIVE' && (
                        <Button
                            variant="outline"
                            onClick={() => setShowDeactivateDialog(true)}
                        >
                            <Ban className="h-4 w-4 mr-2" />
                            Deactivate
                        </Button>
                    )}
                    <Button
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Contract Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Contract Number</p>
                                <p className="text-lg font-bold">{contract.contractNumber}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Premium</p>
                                <p className="text-lg font-bold">{formatCurrency(contract.totalPremium)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Plans</p>
                                <p className="text-lg font-bold">{contract.plans.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            {getStatusIcon(contract.status)}
                            <div>
                                <p className="text-sm font-medium text-gray-600">Status</p>
                                <span className={cn(
                                    'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                                    getStatusColor(contract.status)
                                )}>
                                    {contract.status}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Contract Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Contract Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Payer ID</p>
                                <p className="text-sm">{contract.payerId}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Corporate ID</p>
                                <p className="text-sm">{contract.corporateId}</p>
                            </div>
                            {contract.tpaBranchId && (
                                <div>
                                    <p className="text-sm font-medium text-gray-600">TPA Branch ID</p>
                                    <p className="text-sm">{contract.tpaBranchId}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-600">Currency</p>
                                <p className="text-sm">{contract.currencyCode}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Contract Period</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Start Date</p>
                                <p className="text-sm">{formatDate(contract.startDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">End Date</p>
                                <p className="text-sm">{formatDate(contract.endDate)}</p>
                            </div>
                            {contract.renewalDate && (
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-600">Renewal Date</p>
                                    <p className="text-sm">{formatDate(contract.renewalDate)}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Contract Management Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Overview & Plans
                    </TabsTrigger>
                    <TabsTrigger value="pricing-policies" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Pricing Policies
                    </TabsTrigger>
                    <TabsTrigger value="submission-rules" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Submission Rules
                    </TabsTrigger>
                    <TabsTrigger value="case-definitions" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Case Definitions
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Plans */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Insurance Plans</CardTitle>
                            <CardDescription>
                                {contract.plans.length} plan{contract.plans.length !== 1 ? 's' : ''} included in this contract
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {contract.plans.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-lg font-medium text-gray-900 mb-2">No Plans</p>
                                    <p className="text-sm text-gray-500">No insurance plans are configured for this contract.</p>
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Plan Code</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Annual Limit (Member)</TableHead>
                                                <TableHead>Annual Limit (Family)</TableHead>
                                                <TableHead>Lifetime Limit</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {contract.plans.map((plan) => (
                                                <TableRow key={plan.id || plan.planCode}>
                                                    <TableCell className="font-medium font-mono">
                                                        {plan.planCode}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{plan.nameEn}</div>
                                                            {plan.nameAr && (
                                                                <div className="text-sm text-gray-500">{plan.nameAr}</div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{formatCurrency(plan.annualLimitPerMember)}</TableCell>
                                                    <TableCell>{formatCurrency(plan.annualLimitPerFamily)}</TableCell>
                                                    <TableCell>{formatCurrency(plan.lifetimeLimitPerMember)}</TableCell>
                                                    <TableCell>
                                                        <span className={cn(
                                                            'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                                                            plan.isActive
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                        )}>
                                                            {plan.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pricing-policies">
                    <ContractPricingPoliciesTab contractId={contract.id} />
                </TabsContent>

                <TabsContent value="submission-rules">
                    <ContractSubmissionRulesTab contractId={contract.id} />
                </TabsContent>

                <TabsContent value="case-definitions">
                    <ContractCaseDefinitionsTab contractId={contract.id} />
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Contract</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete contract <strong>{contract.contractNumber}</strong>? This
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
                            Are you sure you want to deactivate contract <strong>{contract.contractNumber}</strong>? 
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
