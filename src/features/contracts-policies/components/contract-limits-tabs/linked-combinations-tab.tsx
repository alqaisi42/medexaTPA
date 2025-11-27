'use client'

import { useState, useEffect, useCallback } from 'react'
import { Link2, Plus, Trash2, Loader2, AlertCircle, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LimitCombination, LinkedCombination } from '@/types/contract-limits'

interface LinkedCombinationsTabProps {
  contractId: number
}

export function LinkedCombinationsTab({ contractId }: LinkedCombinationsTabProps) {
  const [combinations, setCombinations] = useState<LimitCombination[]>([])
  const [linkedCombinations, setLinkedCombinations] = useState<LinkedCombination[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null)
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)
  const [linkDescription, setLinkDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Load combinations
      const combinationsResponse = await fetch(`/api/contracts/${contractId}/limits/combinations?size=1000`)
      
      if (!combinationsResponse.ok) {
        throw new Error('Failed to load combinations')
      }

      const combinationsData = await combinationsResponse.json()
      setCombinations(combinationsData.content || [])

      // For now, create mock linked combinations data
      // In a real implementation, this would call the actual API
      const mockLinkedCombinations: LinkedCombination[] = [
        {
          id: 1,
          parentCombinationId: 1,
          childCombinationId: 2,
          contractId,
          linkType: 'DEPENDENCY',
          description: 'Maternity visits depend on general consultation limits'
        }
      ]

      setLinkedCombinations(mockLinkedCombinations)
    } catch (err) {
      console.error('Failed to load data', err)
      setError(err instanceof Error ? err.message : 'Unable to load combinations data')
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleCreateLink = () => {
    setSelectedParentId(null)
    setSelectedChildId(null)
    setLinkDescription('')
    setShowLinkDialog(true)
  }

  const handleSaveLink = async () => {
    if (!selectedParentId || !selectedChildId) {
      setError('Please select both parent and child combinations')
      return
    }

    if (selectedParentId === selectedChildId) {
      setError('Parent and child combinations cannot be the same')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // In a real implementation, this would call the API to create the link
      const newLink: LinkedCombination = {
        id: Date.now(), // Mock ID
        parentCombinationId: selectedParentId,
        childCombinationId: selectedChildId,
        contractId,
        linkType: 'DEPENDENCY',
        description: linkDescription || null
      }

      setLinkedCombinations(prev => [...prev, newLink])
      setShowLinkDialog(false)
    } catch (err) {
      console.error('Failed to create link', err)
      setError(err instanceof Error ? err.message : 'Unable to create combination link')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLink = async (linkId: number) => {
    try {
      // In a real implementation, this would call the API to delete the link
      setLinkedCombinations(prev => prev.filter(link => link.id !== linkId))
    } catch (err) {
      console.error('Failed to delete link', err)
      setError(err instanceof Error ? err.message : 'Unable to delete combination link')
    }
  }

  const getCombinationDescription = (combinationId: number) => {
    const combination = combinations.find(c => c.id === combinationId)
    return combination ? `#${combination.id} - ${combination.description || 'Untitled'}` : `#${combinationId}`
  }

  const getAvailableChildCombinations = () => {
    if (!selectedParentId) return combinations

    // Exclude the selected parent and already linked children
    const existingChildIds = linkedCombinations
      .filter(link => link.parentCombinationId === selectedParentId)
      .map(link => link.childCombinationId)

    return combinations.filter(c => 
      c.id !== selectedParentId && 
      !existingChildIds.includes(c.id!)
    )
  }

  // Build tree structure for visualization
  const buildCombinationTree = () => {
    const parentCombinations = combinations.filter(c => 
      !linkedCombinations.some(link => link.childCombinationId === c.id)
    )

    return parentCombinations.map(parent => ({
      ...parent,
      children: linkedCombinations
        .filter(link => link.parentCombinationId === parent.id)
        .map(link => {
          const child = combinations.find(c => c.id === link.childCombinationId)
          return {
            ...child,
            linkId: link.id,
            linkDescription: link.description
          }
        })
    }))
  }

  const combinationTree = buildCombinationTree()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-100 p-3 text-teal-600">
            <GitBranch className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Combination Details (Links)</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage relationships and dependencies between combinations
            </p>
          </div>
        </div>
        <Button onClick={handleCreateLink} disabled={loading || combinations.length < 2}>
          <Plus className="h-4 w-4 mr-2" />
          Link Combinations
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tree View */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Combination Hierarchy</CardTitle>
          <CardDescription>
            Visual representation of combination relationships and dependencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : combinationTree.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">No Combination Tree</p>
              <p className="text-sm text-gray-500 mb-4">
                {combinations.length < 2
                  ? 'Create at least 2 combinations to start linking them'
                  : 'Link combinations to create hierarchical relationships'}
              </p>
              {combinations.length >= 2 && (
                <Button onClick={handleCreateLink}>
                  <Plus className="h-4 w-4 mr-2" />
                  Link Combinations
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {combinationTree.map(parent => (
                <div key={parent.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <div className="font-medium">
                      #{parent.id} - {parent.description || 'Untitled'}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Priority: {parent.priority}
                    </Badge>
                  </div>
                  
                  {parent.children && parent.children.length > 0 && (
                    <div className="ml-7 space-y-2">
                      {parent.children.map((child: any) => (
                        <div key={child.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <div className="w-3 h-px bg-gray-300"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              #{child.id} - {child.description || 'Untitled'}
                            </div>
                            {child.linkDescription && (
                              <div className="text-xs text-gray-500 mt-1">
                                {child.linkDescription}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLink(child.linkId)}
                            title="Remove Link"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Links Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Combination Links</CardTitle>
          <CardDescription>
            {linkedCombinations.length > 0
              ? `${linkedCombinations.length} link${linkedCombinations.length === 1 ? '' : 's'} configured`
              : 'No combination links found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkedCombinations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No combination links configured
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parent Combination</TableHead>
                    <TableHead>Child Combination</TableHead>
                    <TableHead>Link Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedCombinations.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <div className="font-medium">
                          {getCombinationDescription(link.parentCombinationId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {getCombinationDescription(link.childCombinationId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {link.linkType || 'DEPENDENCY'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={link.description || ''}>
                          {link.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLink(link.id!)}
                          title="Remove Link"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Combinations</DialogTitle>
            <DialogDescription>
              Create a relationship between two combinations. The child combination will depend on the parent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Combination *</Label>
              <Select
                value={selectedParentId?.toString() || ''}
                onValueChange={(value) => {
                  setSelectedParentId(value ? Number(value) : null)
                  setSelectedChildId(null) // Reset child when parent changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent combination..." />
                </SelectTrigger>
                <SelectContent>
                  {combinations.map(combination => (
                    <SelectItem key={combination.id} value={combination.id!.toString()}>
                      #{combination.id} - {combination.description || 'Untitled'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="child">Child Combination *</Label>
              <Select
                value={selectedChildId?.toString() || ''}
                onValueChange={(value) => setSelectedChildId(value ? Number(value) : null)}
                disabled={!selectedParentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select child combination..." />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableChildCombinations().map(combination => (
                    <SelectItem key={combination.id} value={combination.id!.toString()}>
                      #{combination.id} - {combination.description || 'Untitled'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <input
                id="description"
                type="text"
                value={linkDescription}
                onChange={(e) => setLinkDescription(e.target.value)}
                placeholder="Describe the relationship..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveLink} disabled={saving || !selectedParentId || !selectedChildId}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Link'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      {linkedCombinations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{linkedCombinations.length}</div>
              <p className="text-xs text-gray-500">Combination links</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Parent Combinations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(linkedCombinations.map(l => l.parentCombinationId)).size}
              </div>
              <p className="text-xs text-gray-500">Unique parent combinations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Child Combinations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(linkedCombinations.map(l => l.childCombinationId)).size}
              </div>
              <p className="text-xs text-gray-500">Unique child combinations</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
