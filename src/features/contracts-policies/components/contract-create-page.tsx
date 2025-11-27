'use client'

import { useState } from 'react'
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
import { ContractPayload, ContractPlan, ContractStatus } from '@/types/contract'
import { createContract } from '@/lib/api/contracts'

export function ContractCreatePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    // Form state
    const [formData, setFormData] = useState<ContractPayload>({
        contractNumber: '',
        payerId: 0,
        corporateId: 0,
        tpaBranchId: undefined,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
        renewalDate: null,
        currencyCode: 'JOD',
        totalPremium: undefined,
        status: 'DRAFT',
        plans: [],
    })

    const handleInputChange = (field: keyof ContractPayload, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleAddPlan = () => {
        const newPlan: ContractPlan = {
            planCode: '',
            nameEn: '',
            nameAr: '',
            annualLimitPerMember: 0,
            annualLimitPerFamily: 0,
            lifetimeLimitPerMember: undefined,
            isActive: true,
        }
        setFormData(prev => ({
            ...prev,
            plans: [...prev.plans, newPlan]
        }))
    }

    const handleUpdatePlan = (index: number, field: keyof ContractPlan, value: any) => {
        setFormData(prev => ({
            ...prev,
            plans: prev.plans.map((plan, i) => 
                i === index ? { ...plan, [field]: value } : plan
            )
        }))
    }

    const handleRemovePlan = (index: number) => {
        setFormData(prev => ({
            ...prev,
            plans: prev.plans.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Validate required fields
            if (!formData.contractNumber || !formData.payerId || !formData.corporateId) {
                throw new Error('Please fill in all required fields')
            }

            if (formData.plans.length === 0) {
                throw new Error('At least one plan is required')
            }

            // Validate plans
            for (let i = 0; i < formData.plans.length; i++) {
                const plan = formData.plans[i]
                if (!plan.planCode || !plan.nameEn) {
                    throw new Error(`Plan ${i + 1}: Plan code and name are required`)
                }
            }

            const contract = await createContract(formData)
            router.push(`/contracts-policies/contracts/${contract.id}`)
        } catch (err) {
            console.error('Failed to create contract', err)
            setError(err instanceof Error ? err.message : 'Unable to create contract')
        } finally {
            setLoading(false)
        }
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
                            Create New Contract
                        </h1>
                        <p className="text-gray-600 mt-1">Create a new insurance contract</p>
                    </div>
                </div>
                <Button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="min-w-[120px]"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Create Contract
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
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Enter the basic contract details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contractNumber">Contract Number *</Label>
                                <Input
                                    id="contractNumber"
                                    value={formData.contractNumber}
                                    onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                                    placeholder="e.g., JAB-2025-001"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select 
                                    value={formData.status} 
                                    onValueChange={(value: ContractStatus) => handleInputChange('status', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DRAFT">Draft</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payerId">Payer ID *</Label>
                                <Input
                                    id="payerId"
                                    type="number"
                                    value={formData.payerId || ''}
                                    onChange={(e) => handleInputChange('payerId', parseInt(e.target.value) || 0)}
                                    placeholder="Enter payer ID"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="corporateId">Corporate ID *</Label>
                                <Input
                                    id="corporateId"
                                    type="number"
                                    value={formData.corporateId || ''}
                                    onChange={(e) => handleInputChange('corporateId', parseInt(e.target.value) || 0)}
                                    placeholder="Enter corporate ID"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tpaBranchId">TPA Branch ID</Label>
                                <Input
                                    id="tpaBranchId"
                                    type="number"
                                    value={formData.tpaBranchId || ''}
                                    onChange={(e) => handleInputChange('tpaBranchId', parseInt(e.target.value) || undefined)}
                                    placeholder="Enter TPA branch ID (optional)"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currencyCode">Currency Code</Label>
                                <Select 
                                    value={formData.currencyCode} 
                                    onValueChange={(value) => handleInputChange('currencyCode', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="JOD">JOD - Jordanian Dinar</SelectItem>
                                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                                        <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contract Period */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contract Period</CardTitle>
                        <CardDescription>Set the contract effective dates</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                    </CardContent>
                </Card>

                {/* Insurance Plans */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Insurance Plans</CardTitle>
                                <CardDescription>Add insurance plans for this contract</CardDescription>
                            </div>
                            <Button type="button" onClick={handleAddPlan} variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Plan
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {formData.plans.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-lg font-medium text-gray-900 mb-2">No Plans Added</p>
                                <p className="text-sm text-gray-500 mb-4">Add at least one insurance plan to continue</p>
                                <Button type="button" onClick={handleAddPlan}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add First Plan
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {formData.plans.map((plan, index) => (
                                    <Card key={index} className="border-l-4 border-l-blue-500">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base">Plan {index + 1}</CardTitle>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemovePlan(index)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Plan Code *</Label>
                                                    <Input
                                                        value={plan.planCode}
                                                        onChange={(e) => handleUpdatePlan(index, 'planCode', e.target.value)}
                                                        placeholder="e.g., GOLD-01"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Name (English) *</Label>
                                                    <Input
                                                        value={plan.nameEn}
                                                        onChange={(e) => handleUpdatePlan(index, 'nameEn', e.target.value)}
                                                        placeholder="e.g., Gold Management Plan"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Name (Arabic)</Label>
                                                    <Input
                                                        value={plan.nameAr || ''}
                                                        onChange={(e) => handleUpdatePlan(index, 'nameAr', e.target.value || undefined)}
                                                        placeholder="Arabic name (optional)"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Annual Limit (Member) *</Label>
                                                    <Input
                                                        type="number"
                                                        value={plan.annualLimitPerMember}
                                                        onChange={(e) => handleUpdatePlan(index, 'annualLimitPerMember', parseInt(e.target.value) || 0)}
                                                        placeholder="50000"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Annual Limit (Family) *</Label>
                                                    <Input
                                                        type="number"
                                                        value={plan.annualLimitPerFamily}
                                                        onChange={(e) => handleUpdatePlan(index, 'annualLimitPerFamily', parseInt(e.target.value) || 0)}
                                                        placeholder="100000"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Lifetime Limit (Member)</Label>
                                                    <Input
                                                        type="number"
                                                        value={plan.lifetimeLimitPerMember || ''}
                                                        onChange={(e) => handleUpdatePlan(index, 'lifetimeLimitPerMember', parseInt(e.target.value) || undefined)}
                                                        placeholder="Optional lifetime limit"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id={`plan-${index}-active`}
                                                    checked={plan.isActive}
                                                    onCheckedChange={(checked) => handleUpdatePlan(index, 'isActive', checked)}
                                                />
                                                <Label htmlFor={`plan-${index}-active`}>Plan is active</Label>
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
