'use client'

import { useState } from 'react'
import { Pencil, CheckCircle2, XCircle, Calendar, Building2, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// Badge component - using inline style instead
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ProviderContract, ProviderContractUpdatePayload } from '@/types/provider-contract'
import { updateProviderContract } from '@/lib/api/provider-contracts'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface ContractInfoTabProps {
    contract: ProviderContract
    onUpdate: () => Promise<void>
}

export function ContractInfoTab({ contract, onUpdate }: ContractInfoTabProps) {
    const router = useRouter()
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isActivateOpen, setIsActivateOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        nameEn: contract.nameEn,
        nameAr: contract.nameAr || '',
        appliesToNetwork: contract.appliesToNetwork,
        effectiveFrom: contract.effectiveFrom
            ? typeof contract.effectiveFrom === 'string'
                ? contract.effectiveFrom.slice(0, 10)
                : new Date(contract.effectiveFrom * 1000).toISOString().split('T')[0]
            : '',
        effectiveTo: contract.effectiveTo
            ? typeof contract.effectiveTo === 'string'
                ? contract.effectiveTo.slice(0, 10)
                : new Date(contract.effectiveTo * 1000).toISOString().split('T')[0]
            : '',
    })

    const formatDate = (value: number | string | null): string => {
        if (!value) return '-'
        if (typeof value === 'string') {
            return new Date(value).toLocaleDateString()
        }
        return new Date(value * 1000).toLocaleDateString()
    }

    const handleEdit = () => {
        setFormData({
            nameEn: contract.nameEn,
            nameAr: contract.nameAr || '',
            appliesToNetwork: contract.appliesToNetwork,
            effectiveFrom: contract.effectiveFrom
                ? typeof contract.effectiveFrom === 'string'
                    ? contract.effectiveFrom.slice(0, 10)
                    : new Date(contract.effectiveFrom * 1000).toISOString().split('T')[0]
                : '',
            effectiveTo: contract.effectiveTo
                ? typeof contract.effectiveTo === 'string'
                    ? contract.effectiveTo.slice(0, 10)
                    : new Date(contract.effectiveTo * 1000).toISOString().split('T')[0]
                : '',
        })
        setError(null)
        setIsEditOpen(true)
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        try {
            const payload: ProviderContractUpdatePayload = {
                nameEn: formData.nameEn,
                nameAr: formData.nameAr || null,
                appliesToNetwork: formData.appliesToNetwork,
                effectiveFrom: formData.effectiveFrom || undefined,
                effectiveTo: formData.effectiveTo || null,
            }
            await updateProviderContract(contract.id, payload)
            setIsEditOpen(false)
            await onUpdate()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to update contract')
        } finally {
            setSaving(false)
        }
    }

    const handleToggleActive = async () => {
        setSaving(true)
        setError(null)
        try {
            await updateProviderContract(contract.id, { isActive: !contract.isActive })
            setIsActivateOpen(false)
            await onUpdate()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to update contract status')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Contract Information</h2>
                    <p className="text-sm text-gray-600">Basic contract details and settings</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleEdit}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    <Button
                        variant={contract.isActive ? 'destructive' : 'default'}
                        onClick={() => setIsActivateOpen(true)}
                    >
                        {contract.isActive ? (
                            <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Deactivate
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Activate
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-sm text-gray-600">Contract Code</Label>
                            <div className="font-mono text-lg font-semibold mt-1">{contract.contractCode}</div>
                        </div>
                        <div>
                            <Label className="text-sm text-gray-600">Name (English)</Label>
                            <div className="text-lg font-medium mt-1">{contract.nameEn}</div>
                        </div>
                        <div>
                            <Label className="text-sm text-gray-600">Name (Arabic)</Label>
                            <div className="text-lg font-medium mt-1" dir="rtl">
                                {contract.nameAr || '-'}
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm text-gray-600">Provider</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{contract.providerName || 'N/A'}</span>
                                {contract.providerId && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.push(`/medical-providers/${contract.providerId}`)}
                                    >
                                        View Provider
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Status & Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-sm text-gray-600">Status</Label>
                            <div className="mt-1">
                                <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        contract.isActive
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {contract.isActive ? (
                                        <>
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Active
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Inactive
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm text-gray-600">Applies to Network</Label>
                            <div className="mt-1">
                                <span
                                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                        contract.appliesToNetwork
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {contract.appliesToNetwork ? (
                                        <>
                                            <Link2 className="h-3 w-3 mr-1" />
                                            Yes
                                        </>
                                    ) : (
                                        'No'
                                    )}
                                </span>
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm text-gray-600">Effective From</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{formatDate(contract.effectiveFrom)}</span>
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm text-gray-600">Effective To</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{formatDate(contract.effectiveTo)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Extended Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm text-gray-600">Settlement Strategy</Label>
                                <div className="text-lg font-medium mt-1">{contract.settlementStrategy || '-'}</div>
                            </div>
                            <div>
                                <Label className="text-sm text-gray-600">Currency</Label>
                                <div className="text-lg font-medium mt-1">{contract.currency || '-'}</div>
                            </div>
                            <div>
                                <Label className="text-sm text-gray-600">Network Tier</Label>
                                <div className="text-lg font-medium mt-1">{contract.networkTier || '-'}</div>
                            </div>
                            <div>
                                <Label className="text-sm text-gray-600">Claim Submission Day Limit</Label>
                                <div className="text-lg font-medium mt-1">{contract.claimSubmissionDayLimit ?? '-'}</div>
                            </div>
                            <div>
                                <Label className="text-sm text-gray-600">Deductible Override</Label>
                                <div className="text-lg font-medium mt-1">
                                    {contract.deductibleOverride !== null && contract.deductibleOverride !== undefined
                                        ? formatCurrency(contract.deductibleOverride)
                                        : '-'}
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm text-gray-600">Copay Override</Label>
                                <div className="text-lg font-medium mt-1">
                                    {contract.copayOverride !== null && contract.copayOverride !== undefined
                                        ? formatCurrency(contract.copayOverride)
                                        : '-'}
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm text-gray-600">Copay Type</Label>
                                <div className="text-lg font-medium mt-1">{contract.copayType || '-'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 pt-2">
                            <div>
                                <Label className="text-sm text-gray-600">Cashless Allowed</Label>
                                <div className="mt-1">
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            contract.isCashlessAllowed
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {contract.isCashlessAllowed ? (
                                            <>
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Yes
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-3 w-3 mr-1" />
                                                No
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm text-gray-600">Reimbursement Allowed</Label>
                                <div className="mt-1">
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            contract.isReimbursementAllowed
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {contract.isReimbursementAllowed ? (
                                            <>
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Yes
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-3 w-3 mr-1" />
                                                No
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Contract Information</DialogTitle>
                        <DialogDescription>Update the basic contract details</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nameEn">Name (English) *</Label>
                            <Input
                                id="nameEn"
                                value={formData.nameEn}
                                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nameAr">Name (Arabic)</Label>
                            <Input
                                id="nameAr"
                                value={formData.nameAr}
                                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                disabled={saving}
                                dir="rtl"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="appliesToNetwork"
                                checked={formData.appliesToNetwork}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, appliesToNetwork: checked })
                                }
                                disabled={saving}
                            />
                            <Label htmlFor="appliesToNetwork" className="cursor-pointer">
                                Applies to Network
                            </Label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="effectiveFrom">Effective From</Label>
                                <Input
                                    id="effectiveFrom"
                                    type="date"
                                    value={formData.effectiveFrom}
                                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="effectiveTo">Effective To</Label>
                                <Input
                                    id="effectiveTo"
                                    type="date"
                                    value={formData.effectiveTo}
                                    onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                                    disabled={saving}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Activate/Deactivate Dialog */}
            <Dialog open={isActivateOpen} onOpenChange={setIsActivateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {contract.isActive ? 'Deactivate Contract' : 'Activate Contract'}
                        </DialogTitle>
                        <DialogDescription>
                            {contract.isActive
                                ? 'Are you sure you want to deactivate this contract?'
                                : 'Are you sure you want to activate this contract?'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsActivateOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button
                            variant={contract.isActive ? 'destructive' : 'default'}
                            onClick={handleToggleActive}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : contract.isActive ? (
                                'Deactivate'
                            ) : (
                                'Activate'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

