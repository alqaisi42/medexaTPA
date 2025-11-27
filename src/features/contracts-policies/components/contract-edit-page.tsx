'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    FileText,
    AlertCircle,
    RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Contract, ContractUpdatePayload, ContractPlan, ContractStatus } from '@/types/contract'
import { fetchContract, updateContract } from '@/lib/api/contracts'

interface ContractEditPageProps {
    contractId: number
}

export function ContractEditPage({ contractId }: ContractEditPageProps) {
    const router = useRouter()
    const [contract, setContract] = useState<Contract | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    // Form state - we'll only allow editing certain fields for now
    const [formData, setFormData] = useState<ContractUpdatePayload>({
        startDate: '',
        endDate: '',
        renewalDate: null,
        status: 'DRAFT',
        totalPremium: undefined,
        terminationReason: null,
    })

    // Load contract details
    const loadContract = async () => {
        setLoading(true)
        setError(null)
        try {
            const contractData = await fetchContract(contractId)
            setContract(contractData)
            
            // Helper function to convert date to ISO string
            const dateToISOString = (date: [number, number, number] | string | null): string => {
                if (!date) return ''
                if (Array.isArray(date)) {
                    return new Date(date[0], date[1] - 1, date[2]).toISOString().split('T')[0]
                }
                if (typeof date === 'string') {
                    return new Date(date).toISOString().split('T')[0]
                }
                return ''
            }
            
            // Initialize form data with current contract values
            setFormData({
                startDate: dateToISOString(contractData.startDate),
                endDate: dateToISOString(contractData.endDate),
                renewalDate: dateToISOString(contractData.renewalDate),
                status: contractData.status,
                totalPremium: contractData.totalPremium || undefined,
                terminationReason: contractData.terminationReason || null,
            })
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

    const handleInputChange = (field: keyof ContractUpdatePayload, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            // Validate required fields
            if (!formData.startDate || !formData.endDate) {
                throw new Error('Start date and end date are required')
            }

            // Prepare update payload - only send fields that have changed
            const updatePayload: ContractUpdatePayload = {}
            
            if (formData.startDate) updatePayload.startDate = formData.startDate
            if (formData.endDate) updatePayload.endDate = formData.endDate
            if (formData.renewalDate) updatePayload.renewalDate = formData.renewalDate
            if (formData.status) updatePayload.status = formData.status
            if (formData.totalPremium !== undefined) updatePayload.totalPremium = formData.totalPremium
            if (formData.terminationReason) updatePayload.terminationReason = formData.terminationReason

            const updatedContract = await updateContract(contractId, updatePayload)
            router.push(`/contracts-policies/contracts/${updatedContract.id}`)
        } catch (err) {
            console.error('Failed to update contract', err)
            setError(err instanceof Error ? err.message : 'Unable to update contract')
        } finally {
            setSaving(false)
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

    if (error && !contract) {
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
                            Edit Contract
                        </h1>
                        <p className="text-gray-600 mt-1">{contract?.contractNumber}</p>
                    </div>
                </div>
                <Button 
                    onClick={handleSubmit}
                    disabled={saving}
                    className="min-w-[120px]"
                >
                    {saving ? (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contract Information (Read-only) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contract Information</CardTitle>
                        <CardDescription>Basic contract details (read-only)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Contract Number</Label>
                                <Input value={contract?.contractNumber || ''} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Currency Code</Label>
                                <Input value={contract?.currencyCode || ''} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Payer ID</Label>
                                <Input value={contract?.payerId || ''} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Corporate ID</Label>
                                <Input value={contract?.corporateId || ''} disabled />
                            </div>
                            {contract?.tpaBranchId && (
                                <div className="space-y-2">
                                    <Label>TPA Branch ID</Label>
                                    <Input value={contract.tpaBranchId} disabled />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Editable Fields */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contract Details</CardTitle>
                        <CardDescription>Update contract dates, status, and premium</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select 
                                    value={formData.status || ''} 
                                    onValueChange={(value: ContractStatus) => handleInputChange('status', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DRAFT">Draft</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                        <SelectItem value="TERMINATED">Terminated</SelectItem>
                                        <SelectItem value="EXPIRED">Expired</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="totalPremium">Total Premium</Label>
                                <Input
                                    id="totalPremium"
                                    type="number"
                                    step="0.01"
                                    value={formData.totalPremium || ''}
                                    onChange={(e) => handleInputChange('totalPremium', parseFloat(e.target.value) || undefined)}
                                    placeholder="Enter total premium amount"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date *</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date *</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="renewalDate">Renewal Date</Label>
                                <Input
                                    id="renewalDate"
                                    type="date"
                                    value={formData.renewalDate || ''}
                                    onChange={(e) => handleInputChange('renewalDate', e.target.value || null)}
                                />
                            </div>
                        </div>

                        {(formData.status === 'TERMINATED' || formData.status === 'SUSPENDED') && (
                            <div className="space-y-2">
                                <Label htmlFor="terminationReason">Termination/Suspension Reason</Label>
                                <Input
                                    id="terminationReason"
                                    value={formData.terminationReason || ''}
                                    onChange={(e) => handleInputChange('terminationReason', e.target.value || null)}
                                    placeholder="Enter reason for termination or suspension"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Insurance Plans (Read-only for now) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Insurance Plans</CardTitle>
                        <CardDescription>
                            Current plans (read-only). Plan modifications require separate management.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!contract?.plans || contract.plans.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-lg font-medium text-gray-900 mb-2">No Plans</p>
                                <p className="text-sm text-gray-500">No insurance plans are configured for this contract.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {contract.plans.map((plan, index) => (
                                    <Card key={plan.id || index} className="border-l-4 border-l-blue-500">
                                        <CardContent className="pt-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Plan Code</Label>
                                                    <Input value={plan.planCode} disabled />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Name (English)</Label>
                                                    <Input value={plan.nameEn} disabled />
                                                </div>
                                                {plan.nameAr && (
                                                    <div className="space-y-2">
                                                        <Label>Name (Arabic)</Label>
                                                        <Input value={plan.nameAr} disabled />
                                                    </div>
                                                )}
                                                <div className="space-y-2">
                                                    <Label>Annual Limit (Member)</Label>
                                                    <Input value={plan.annualLimitPerMember.toLocaleString()} disabled />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Annual Limit (Family)</Label>
                                                    <Input value={plan.annualLimitPerFamily.toLocaleString()} disabled />
                                                </div>
                                                {plan.lifetimeLimitPerMember && (
                                                    <div className="space-y-2">
                                                        <Label>Lifetime Limit (Member)</Label>
                                                        <Input value={plan.lifetimeLimitPerMember.toLocaleString()} disabled />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2 mt-4">
                                                <Switch checked={plan.isActive} disabled />
                                                <Label>Plan is {plan.isActive ? 'active' : 'inactive'}</Label>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}
