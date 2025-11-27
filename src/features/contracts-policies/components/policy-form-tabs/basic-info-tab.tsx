'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { PolicyPayload } from '@/types/policy'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { LookupRecord } from '@/types/lookup'

interface PolicyBasicInfoTabProps {
    formData: PolicyPayload
    setFormData: (data: PolicyPayload) => void
    isEditing: boolean
    policyTypes: LookupRecord[]
    policyCategories: LookupRecord[]
    pricingModels: LookupRecord[]
    networkTypes: LookupRecord[]
    loadingLookups: boolean
}

export function PolicyBasicInfoTab({
    formData,
    setFormData,
    isEditing,
    policyTypes,
    policyCategories,
    pricingModels,
    networkTypes,
    loadingLookups,
}: PolicyBasicInfoTabProps) {
    return (
        <div className="space-y-6">
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
                        onChange={(e) => setFormData({ ...formData, policyCode: e.target.value || null })}
                        placeholder="Optional policy code"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="employerId">Employer ID *</Label>
                    <Input
                        id="employerId"
                        type="number"
                        value={formData.employerId || ''}
                        onChange={(e) => setFormData({ ...formData, employerId: Number(e.target.value) || 0 })}
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
                                policyType: value ? policyTypes.find((t) => t.id === value)?.code || value : null,
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
                        onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value || null })}
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
                                networkType: value ? networkTypes.find((n) => n.id === value)?.code || value : null,
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
                            onCheckedChange={(checked) => setFormData({ ...formData, hasMaternity: checked })}
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
                            onCheckedChange={(checked) => setFormData({ ...formData, hasPharmacy: checked })}
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
    )
}

