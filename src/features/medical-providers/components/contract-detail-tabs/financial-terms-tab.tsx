'use client'

import { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ProviderContract, ProviderContractUpdatePayload, ReimbursementModel } from '@/types/provider-contract'
import { updateProviderContract } from '@/lib/api/provider-contracts'
import { formatCurrency } from '@/lib/utils'

interface FinancialTermsTabProps {
    contract: ProviderContract
    onUpdate: () => Promise<void>
}

const REIMBURSEMENT_MODELS: ReimbursementModel[] = ['FFS', 'DRG', 'PACKAGED', 'CAPITATION', 'HYBRID']

const NETWORK_TIERS = ['TIER_1', 'TIER_2', 'TIER_3', 'VIP', 'PREMIUM', 'BASIC'] as const

const COPAY_TYPES = ['PERCENT', 'FIXED'] as const

export function FinancialTermsTab({ contract, onUpdate }: FinancialTermsTabProps) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        tpaCommissionPercent: contract.tpaCommissionPercent?.toString() || '',
        tpaCommissionFixed: contract.tpaCommissionFixed?.toString() || '',
        contractDiscountPercent: contract.contractDiscountPercent?.toString() || '',
        contractDiscountFixed: contract.contractDiscountFixed?.toString() || '',
        reimbursementModel: contract.reimbursementModel || 'FFS',
        ppdPercent: contract.ppdPercent?.toString() || '',
        ppdDayLimit: contract.ppdDayLimit?.toString() || '',
        annualCap: contract.annualCap?.toString() || '',
        monthlyCap: contract.monthlyCap?.toString() || '',
        perCaseCap: contract.perCaseCap?.toString() || '',
        vatIncluded: contract.vatIncluded ?? false,
        vatPercent: contract.vatPercent?.toString() || '',
        // Extended fields
        settlementStrategy: contract.settlementStrategy || 'PAYER_TO_PROVIDER',
        deductibleOverride: contract.deductibleOverride?.toString() || '',
        copayOverride: contract.copayOverride?.toString() || '',
        copayType: contract.copayType || '',
        networkTier: contract.networkTier || '',
        currency: contract.currency || 'JOD',
        claimSubmissionDayLimit: contract.claimSubmissionDayLimit?.toString() || '',
        isCashlessAllowed: contract.isCashlessAllowed ?? true,
        isReimbursementAllowed: contract.isReimbursementAllowed ?? true,
    })

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        setSuccess(false)

        try {
            const payload: ProviderContractUpdatePayload = {
                tpaCommissionPercent: formData.tpaCommissionPercent ? Number(formData.tpaCommissionPercent) : null,
                tpaCommissionFixed: formData.tpaCommissionFixed ? Number(formData.tpaCommissionFixed) : null,
                contractDiscountPercent: formData.contractDiscountPercent ? Number(formData.contractDiscountPercent) : null,
                contractDiscountFixed: formData.contractDiscountFixed ? Number(formData.contractDiscountFixed) : null,
                reimbursementModel: formData.reimbursementModel,
                ppdPercent: formData.ppdPercent ? Number(formData.ppdPercent) : null,
                ppdDayLimit: formData.ppdDayLimit ? Number(formData.ppdDayLimit) : null,
                annualCap: formData.annualCap ? Number(formData.annualCap) : null,
                monthlyCap: formData.monthlyCap ? Number(formData.monthlyCap) : null,
                perCaseCap: formData.perCaseCap ? Number(formData.perCaseCap) : null,
                vatIncluded: formData.vatIncluded,
                vatPercent: formData.vatPercent ? Number(formData.vatPercent) : null,
                // Extended fields
                settlementStrategy: formData.settlementStrategy || null,
                deductibleOverride: formData.deductibleOverride ? Number(formData.deductibleOverride) : null,
                copayOverride: formData.copayOverride ? Number(formData.copayOverride) : null,
                copayType: formData.copayType || null,
                networkTier: formData.networkTier || null,
                currency: formData.currency || null,
                claimSubmissionDayLimit: formData.claimSubmissionDayLimit ? Number(formData.claimSubmissionDayLimit) : null,
                isCashlessAllowed: formData.isCashlessAllowed,
                isReimbursementAllowed: formData.isReimbursementAllowed,
            }

            await updateProviderContract(contract.id, payload)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
            await onUpdate()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to save financial terms')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Financial Terms</h2>
                    <p className="text-sm text-gray-600">Configure commission, discounts, caps, and VAT settings</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-tpa-primary hover:bg-tpa-accent">
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    Financial terms saved successfully!
                </div>
            )}

            {/* TPA Commission */}
            <Card>
                <CardHeader>
                    <CardTitle>TPA Commission</CardTitle>
                    <CardDescription>Commission structure for TPA services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tpaCommissionPercent">Commission Percent (%)</Label>
                            <Input
                                id="tpaCommissionPercent"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={formData.tpaCommissionPercent}
                                onChange={(e) => setFormData({ ...formData, tpaCommissionPercent: e.target.value })}
                                placeholder="0.00"
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tpaCommissionFixed">Fixed Commission Amount</Label>
                            <Input
                                id="tpaCommissionFixed"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.tpaCommissionFixed}
                                onChange={(e) => setFormData({ ...formData, tpaCommissionFixed: e.target.value })}
                                placeholder="0.00"
                                disabled={saving}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contractual Discount */}
            <Card>
                <CardHeader>
                    <CardTitle>Contractual Discount</CardTitle>
                    <CardDescription>Discounts applied to contract prices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contractDiscountPercent">Discount Percent (%)</Label>
                            <Input
                                id="contractDiscountPercent"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={formData.contractDiscountPercent}
                                onChange={(e) => setFormData({ ...formData, contractDiscountPercent: e.target.value })}
                                placeholder="0.00"
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contractDiscountFixed">Fixed Discount Amount</Label>
                            <Input
                                id="contractDiscountFixed"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.contractDiscountFixed}
                                onChange={(e) => setFormData({ ...formData, contractDiscountFixed: e.target.value })}
                                placeholder="0.00"
                                disabled={saving}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Reimbursement Model */}
            <Card>
                <CardHeader>
                    <CardTitle>Reimbursement Model</CardTitle>
                    <CardDescription>Payment model for this contract</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="reimbursementModel">Model Type</Label>
                        <Select
                            value={formData.reimbursementModel}
                            onValueChange={(value) => setFormData({ ...formData, reimbursementModel: value as ReimbursementModel })}
                            disabled={saving}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {REIMBURSEMENT_MODELS.map((model) => (
                                    <SelectItem key={model} value={model}>
                                        {model}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Prompt Payment Discount */}
            <Card>
                <CardHeader>
                    <CardTitle>Prompt Payment Discount (PPD)</CardTitle>
                    <CardDescription>Discount for early payment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ppdPercent">PPD Percent (%)</Label>
                            <Input
                                id="ppdPercent"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={formData.ppdPercent}
                                onChange={(e) => setFormData({ ...formData, ppdPercent: e.target.value })}
                                placeholder="0.00"
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ppdDayLimit">Day Limit</Label>
                            <Input
                                id="ppdDayLimit"
                                type="number"
                                min="0"
                                value={formData.ppdDayLimit}
                                onChange={(e) => setFormData({ ...formData, ppdDayLimit: e.target.value })}
                                placeholder="0"
                                disabled={saving}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Caps */}
            <Card>
                <CardHeader>
                    <CardTitle>Financial Caps</CardTitle>
                    <CardDescription>Maximum amounts for different periods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="annualCap">Annual Cap</Label>
                            <Input
                                id="annualCap"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.annualCap}
                                onChange={(e) => setFormData({ ...formData, annualCap: e.target.value })}
                                placeholder="0.00"
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="monthlyCap">Monthly Cap</Label>
                            <Input
                                id="monthlyCap"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.monthlyCap}
                                onChange={(e) => setFormData({ ...formData, monthlyCap: e.target.value })}
                                placeholder="0.00"
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="perCaseCap">Per Case Cap</Label>
                            <Input
                                id="perCaseCap"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.perCaseCap}
                                onChange={(e) => setFormData({ ...formData, perCaseCap: e.target.value })}
                                placeholder="0.00"
                                disabled={saving}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* VAT */}
            <Card>
                <CardHeader>
                    <CardTitle>VAT Settings</CardTitle>
                    <CardDescription>Value Added Tax configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="vatIncluded"
                            checked={formData.vatIncluded}
                            onCheckedChange={(checked) => setFormData({ ...formData, vatIncluded: checked })}
                            disabled={saving}
                        />
                        <Label htmlFor="vatIncluded" className="cursor-pointer">
                            VAT Included in Prices
                        </Label>
                    </div>
                    {formData.vatIncluded && (
                        <div className="space-y-2">
                            <Label htmlFor="vatPercent">VAT Percent (%)</Label>
                            <Input
                                id="vatPercent"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={formData.vatPercent}
                                onChange={(e) => setFormData({ ...formData, vatPercent: e.target.value })}
                                placeholder="0.00"
                                disabled={saving}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Settlement & Currency */}
            <Card>
                <CardHeader>
                    <CardTitle>Settlement & Currency</CardTitle>
                    <CardDescription>Payment settlement strategy and currency settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="settlementStrategy">Settlement Strategy</Label>
                            <Select
                                value={formData.settlementStrategy}
                                onValueChange={(value) => setFormData({ ...formData, settlementStrategy: value })}
                                disabled={saving}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PAYER_TO_PROVIDER">Payer to Provider</SelectItem>
                                    <SelectItem value="PROVIDER_TO_PAYER">Provider to Payer</SelectItem>
                                    <SelectItem value="DIRECT">Direct</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select
                                value={formData.currency}
                                onValueChange={(value) => setFormData({ ...formData, currency: value })}
                                disabled={saving}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="JOD">JOD - Jordanian Dinar</SelectItem>
                                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Network & Tier */}
            <Card>
                <CardHeader>
                    <CardTitle>Network & Tier</CardTitle>
                    <CardDescription>Network tier and related settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="networkTier">Network Tier</Label>
                        <Select
                            value={formData.networkTier || ''}
                            onValueChange={(value) => setFormData({ ...formData, networkTier: value })}
                            disabled={saving}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select network tier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {NETWORK_TIERS.map((tier) => (
                                    <SelectItem key={tier} value={tier}>
                                        {tier}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Deductible & Copay */}
            <Card>
                <CardHeader>
                    <CardTitle>Deductible & Copay</CardTitle>
                    <CardDescription>Override settings for deductible and copay</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="deductibleOverride">Deductible Override</Label>
                            <Input
                                id="deductibleOverride"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.deductibleOverride}
                                onChange={(e) => setFormData({ ...formData, deductibleOverride: e.target.value })}
                                placeholder="0.00"
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="copayOverride">Copay Override</Label>
                            <Input
                                id="copayOverride"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.copayOverride}
                                onChange={(e) => setFormData({ ...formData, copayOverride: e.target.value })}
                                placeholder="0.00"
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="copayType">Copay Type</Label>
                            <Select
                                value={formData.copayType || ''}
                                onValueChange={(value) => setFormData({ ...formData, copayType: value })}
                                disabled={saving}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select copay type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {COPAY_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Claim Submission */}
            <Card>
                <CardHeader>
                    <CardTitle>Claim Submission</CardTitle>
                    <CardDescription>Claim submission limits and payment methods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="claimSubmissionDayLimit">Claim Submission Day Limit</Label>
                        <Input
                            id="claimSubmissionDayLimit"
                            type="number"
                            min="0"
                            value={formData.claimSubmissionDayLimit}
                            onChange={(e) => setFormData({ ...formData, claimSubmissionDayLimit: e.target.value })}
                            placeholder="Number of days"
                            disabled={saving}
                        />
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isCashlessAllowed"
                                checked={formData.isCashlessAllowed}
                                onCheckedChange={(checked) => setFormData({ ...formData, isCashlessAllowed: checked })}
                                disabled={saving}
                            />
                            <Label htmlFor="isCashlessAllowed" className="cursor-pointer">
                                Cashless Allowed
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isReimbursementAllowed"
                                checked={formData.isReimbursementAllowed}
                                onCheckedChange={(checked) => setFormData({ ...formData, isReimbursementAllowed: checked })}
                                disabled={saving}
                            />
                            <Label htmlFor="isReimbursementAllowed" className="cursor-pointer">
                                Reimbursement Allowed
                            </Label>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

