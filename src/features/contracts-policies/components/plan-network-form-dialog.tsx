'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { PlanNetwork, PlanNetworkPayload, PlanNetworkUpdatePayload, TierLevel } from '@/types/plan'
import { Network } from '@/types/network'
import { attachNetworkToPlan, updatePlanNetwork } from '@/lib/api/plans'
import { fetchNetworks } from '@/lib/api/networks'

interface PlanNetworkFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    planId: number
    mode: 'create' | 'edit'
    network?: PlanNetwork | null
    onSaved: () => void
}

export function PlanNetworkFormDialog({
    open,
    onOpenChange,
    planId,
    mode,
    network,
    onSaved,
}: PlanNetworkFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [networks, setNetworks] = useState<Network[]>([])
    const [loadingNetworks, setLoadingNetworks] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        networkId: 0,
        tierLevel: 'TIER_1' as TierLevel,
        networkCopayPenaltyPercent: 0,
        isActive: true,
    })

    // Load available networks
    const loadNetworks = useCallback(async () => {
        setLoadingNetworks(true)
        try {
            const response = await fetchNetworks({ status: 'ACTIVE', size: 1000 })
            setNetworks(response.content)
        } catch (err) {
            console.error('Failed to load networks', err)
        } finally {
            setLoadingNetworks(false)
        }
    }, [])

    useEffect(() => {
        if (open && mode === 'create') {
            void loadNetworks()
        }
    }, [open, mode, loadNetworks])

    // Initialize form data when network changes
    useEffect(() => {
        if (mode === 'edit' && network) {
            setFormData({
                networkId: network.networkId,
                tierLevel: network.tierLevel as TierLevel,
                networkCopayPenaltyPercent: network.networkCopayPenaltyPercent,
                isActive: network.isActive,
            })
        } else {
            // Reset form for create mode
            setFormData({
                networkId: 0,
                tierLevel: 'TIER_1',
                networkCopayPenaltyPercent: 0,
                isActive: true,
            })
        }
        setError(null)
    }, [mode, network, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (mode === 'create') {
                const payload: PlanNetworkPayload = {
                    networkId: formData.networkId,
                    tierLevel: formData.tierLevel,
                    networkCopayPenaltyPercent: formData.networkCopayPenaltyPercent,
                    isActive: formData.isActive,
                }

                await attachNetworkToPlan(planId, payload)
            } else if (mode === 'edit' && network) {
                const payload: PlanNetworkUpdatePayload = {
                    tierLevel: formData.tierLevel,
                    networkCopayPenaltyPercent: formData.networkCopayPenaltyPercent,
                    isActive: formData.isActive,
                }

                await updatePlanNetwork(planId, network.id, payload)
            }

            onSaved()
        } catch (err) {
            console.error('Failed to save plan network', err)
            setError(err instanceof Error ? err.message : 'Unable to save plan network')
        } finally {
            setLoading(false)
        }
    }

    const networkOptions = networks.map(network => ({
        id: network.id,
        label: `${network.code} - ${network.nameEn}`,
        subLabel: network.nameAr || network.description || undefined,
    }))

    const isFormValid = formData.networkId > 0 && formData.networkCopayPenaltyPercent >= 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Add Network to Plan' : 'Edit Plan Network'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'create' 
                            ? 'Attach a provider network to this plan'
                            : 'Update the network configuration for this plan'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Network *</Label>
                        {mode === 'create' ? (
                            <SearchableSelect
                                options={networkOptions}
                                value={formData.networkId || ''}
                                onValueChange={(value) => 
                                    setFormData(prev => ({ 
                                        ...prev, 
                                        networkId: value ? parseInt(value.toString()) : 0 
                                    }))
                                }
                                placeholder="Search and select a network..."
                                emptyMessage="No networks found"
                                loading={loadingNetworks}
                            />
                        ) : (
                            <div className="p-2 border rounded-md bg-gray-50">
                                <span className="font-medium">Network ID: {network?.networkId}</span>
                                <p className="text-xs text-gray-500 mt-1">Network cannot be changed in edit mode</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tierLevel">Tier Level *</Label>
                        <Select 
                            value={formData.tierLevel} 
                            onValueChange={(value: TierLevel) => 
                                setFormData(prev => ({ ...prev, tierLevel: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TIER_1">Tier 1</SelectItem>
                                <SelectItem value="TIER_2">Tier 2</SelectItem>
                                <SelectItem value="TIER_3">Tier 3</SelectItem>
                                <SelectItem value="OUT_OF_NETWORK">Out of Network</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="networkCopayPenaltyPercent">Copay Penalty Percentage *</Label>
                        <Input
                            id="networkCopayPenaltyPercent"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={formData.networkCopayPenaltyPercent}
                            onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                networkCopayPenaltyPercent: parseFloat(e.target.value) || 0 
                            }))}
                            placeholder="e.g., 10.5"
                            required
                        />
                        <p className="text-xs text-gray-500">
                            Additional copay percentage for using this network tier
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => 
                                setFormData(prev => ({ ...prev, isActive: checked }))
                            }
                        />
                        <Label htmlFor="isActive">Active</Label>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !isFormValid}>
                            {loading ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {mode === 'create' ? 'Add Network' : 'Update Network'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
