'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Network,
    Plus,
    RefreshCw,
    Edit,
    Trash2,
    AlertCircle,
    Shield,
    Percent,
    Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { PlanNetwork } from '@/types/plan'
import { Network as NetworkType } from '@/types/network'
import { fetchPlanNetworks, detachNetworkFromPlan } from '@/lib/api/plans'
import { fetchNetworks } from '@/lib/api/networks'
import { PlanNetworkFormDialog } from '../plan-network-form-dialog'
import { cn } from '@/lib/utils'

interface PlanNetworksTabProps {
    planId: number
}

export function PlanNetworksTab({ planId }: PlanNetworksTabProps) {
    const [networks, setNetworks] = useState<PlanNetwork[]>([])
    const [networkDetails, setNetworkDetails] = useState<Map<number, NetworkType>>(new Map())
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedNetwork, setSelectedNetwork] = useState<PlanNetwork | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Load plan networks and their details
    const loadNetworks = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetchPlanNetworks(planId)
            if (response.success && response.data) {
                setNetworks(response.data.content)
                
                // Load network details for display
                const networkIds = [...new Set(response.data.content.map(n => n.networkId))]
                const allNetworksResponse = await fetchNetworks({ size: 1000 })
                const networkMap = new Map<number, NetworkType>()
                
                allNetworksResponse.content.forEach(network => {
                    if (networkIds.includes(network.id)) {
                        networkMap.set(network.id, network)
                    }
                })
                
                setNetworkDetails(networkMap)
            }
        } catch (err) {
            console.error('Failed to load plan networks', err)
            setError(err instanceof Error ? err.message : 'Unable to load plan networks')
        } finally {
            setLoading(false)
        }
    }, [planId])

    useEffect(() => {
        void loadNetworks()
    }, [loadNetworks])

    const handleAddNetwork = () => {
        setSelectedNetwork(null)
        setShowCreateDialog(true)
    }

    const handleEditNetwork = (network: PlanNetwork) => {
        setSelectedNetwork(network)
        setShowEditDialog(true)
    }

    const handleDeleteNetwork = async () => {
        if (!selectedNetwork) return

        setDeleting(true)
        setError(null)
        try {
            await detachNetworkFromPlan(planId, selectedNetwork.id)
            setShowDeleteDialog(false)
            setSelectedNetwork(null)
            await loadNetworks()
        } catch (err) {
            console.error('Failed to detach network', err)
            setError(err instanceof Error ? err.message : 'Unable to detach network')
        } finally {
            setDeleting(false)
        }
    }

    const handleNetworkSaved = () => {
        setShowCreateDialog(false)
        setShowEditDialog(false)
        void loadNetworks()
    }

    const getTierColor = (tier: string) => {
        switch (tier.toUpperCase()) {
            case 'TIER_1':
                return 'bg-green-100 text-green-700'
            case 'TIER_2':
                return 'bg-blue-100 text-blue-700'
            case 'TIER_3':
                return 'bg-yellow-100 text-yellow-700'
            case 'OUT_OF_NETWORK':
                return 'bg-red-100 text-red-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    const formatTier = (tier: string) => {
        return tier.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Network className="h-5 w-5 text-blue-600" />
                        Networks
                    </h2>
                    <p className="text-gray-600 mt-1">Manage provider networks for this plan</p>
                </div>
                <Button onClick={handleAddNetwork}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Network
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Network className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Networks</p>
                                <p className="text-2xl font-bold">{networks.length}</p>
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
                                <p className="text-sm font-medium text-gray-600">Active Networks</p>
                                <p className="text-2xl font-bold">
                                    {networks.filter(n => n.isActive).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Layers className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Tier 1 Networks</p>
                                <p className="text-2xl font-bold">
                                    {networks.filter(n => n.tierLevel === 'TIER_1').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Percent className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Penalty</p>
                                <p className="text-2xl font-bold">
                                    {networks.length > 0 
                                        ? Math.round(networks.reduce((sum, n) => sum + n.networkCopayPenaltyPercent, 0) / networks.length)
                                        : 0}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Networks Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Plan Networks</CardTitle>
                    <CardDescription>
                        {networks.length > 0
                            ? `${networks.length} network${networks.length === 1 ? '' : 's'} configured`
                            : 'No networks configured'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : networks.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <Network className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium text-gray-900 mb-2">No Networks Found</p>
                            <p className="text-sm text-gray-500 mb-4">
                                Add networks to define provider coverage tiers and penalties
                            </p>
                            <Button onClick={handleAddNetwork}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Network
                            </Button>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Network</TableHead>
                                            <TableHead>Tier Level</TableHead>
                                            <TableHead>Penalty %</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {networks.map((network) => {
                                            const networkDetail = networkDetails.get(network.networkId)
                                            return (
                                                <TableRow key={network.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">
                                                                {networkDetail ? `${networkDetail.code} - ${networkDetail.nameEn}` : `Network ${network.networkId}`}
                                                            </div>
                                                            {networkDetail?.nameAr && (
                                                                <div className="text-sm text-gray-500" dir="rtl">
                                                                    {networkDetail.nameAr}
                                                                </div>
                                                            )}
                                                            <div className="text-xs text-gray-400 font-mono">
                                                                ID: {network.networkId}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                            <TableCell>
                                                <Badge className={cn('text-xs', getTierColor(network.tierLevel))}>
                                                    {formatTier(network.tierLevel)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Percent className="h-4 w-4 text-gray-400" />
                                                    <span className="font-medium">{network.networkCopayPenaltyPercent}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    'text-xs',
                                                    network.isActive
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                )}>
                                                    {network.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditNetwork(network)}
                                                        title="Edit Network"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedNetwork(network)
                                                            setShowDeleteDialog(true)
                                                        }}
                                                        title="Remove Network"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </div>
                                                </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Network Dialog */}
            <PlanNetworkFormDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                planId={planId}
                mode="create"
                onSaved={handleNetworkSaved}
            />

            {/* Edit Network Dialog */}
            <PlanNetworkFormDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                planId={planId}
                mode="edit"
                network={selectedNetwork}
                onSaved={handleNetworkSaved}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Network</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove network <strong>{selectedNetwork?.networkId}</strong> from this plan? 
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteNetwork} disabled={deleting} variant="destructive">
                            {deleting ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                'Remove'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
