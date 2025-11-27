'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, DollarSign, Settings } from 'lucide-react'
import { PricingPolicy, PricingPolicyListResponse } from '@/types/pricing-policy'
import { PricingPolicyFormDialog } from './pricing-policy-form-dialog'

interface ContractPricingPoliciesTabProps {
  contractId: number
}

export function ContractPricingPoliciesTab({ contractId }: ContractPricingPoliciesTabProps) {
  const [policies, setPolicies] = useState<PricingPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<PricingPolicy | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchPolicies = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contracts/${contractId}/pricing-policies?page=${page}&size=20`)
      if (!response.ok) throw new Error('Failed to fetch pricing policies')
      
      const data: PricingPolicyListResponse = await response.json()
      setPolicies(data.data.content)
      setTotalPages(data.data.totalPages)
    } catch (error) {
      console.error('Error fetching pricing policies:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [contractId, page])

  const handleDelete = async (policyId: number) => {
    if (!confirm('Are you sure you want to delete this pricing policy?')) return

    try {
      const response = await fetch(`/api/contracts/${contractId}/pricing-policies/${policyId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete pricing policy')
      
      await fetchPolicies()
    } catch (error) {
      console.error('Error deleting pricing policy:', error)
      alert('Failed to delete pricing policy')
    }
  }

  const handleEdit = (policy: PricingPolicy) => {
    setEditingPolicy(policy)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingPolicy(null)
  }

  const handleFormSuccess = () => {
    fetchPolicies()
    handleFormClose()
  }

  const filteredPolicies = policies.filter(policy =>
    policy.serviceCategoryNameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.localNetworkPricingModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.coinsuranceMethod.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatPricingModel = (model: string) => {
    return model.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatCoinsuranceMethod = (method: string) => {
    return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading pricing policies...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pricing Policies</h2>
          <p className="text-muted-foreground">
            Manage pricing models and coinsurance methods for different service categories
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Pricing Policy
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing Policies ({filteredPolicies.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPolicies.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pricing Policies</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No policies match your search criteria.' : 'Get started by creating your first pricing policy.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Pricing Policy
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Category</TableHead>
                    <TableHead>Local Network Pricing</TableHead>
                    <TableHead>Price Basis</TableHead>
                    <TableHead>Cash Pricing</TableHead>
                    <TableHead>Coinsurance Method</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPolicies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">
                        {policy.serviceCategoryNameEn}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatPricingModel(policy.localNetworkPricingModel)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {policy.localNetworkPriceBasis.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {policy.cashPricingModel ? (
                          <Badge variant="secondary">
                            {formatPricingModel(policy.cashPricingModel)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {formatCoinsuranceMethod(policy.coinsuranceMethod)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(policy)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(policy.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PricingPolicyFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        contractId={contractId}
        editingPolicy={editingPolicy}
      />
    </div>
  )
}
