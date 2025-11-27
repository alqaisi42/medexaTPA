'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Search, Edit, Trash2, Shield, Clock, AlertTriangle, Filter } from 'lucide-react'
import { SubmissionRule, SubmissionRuleListResponse } from '@/types/submission-rule'
import { SubmissionRuleFormDialog } from './submission-rule-form-dialog'

interface ContractSubmissionRulesTabProps {
  contractId: number
}

export function ContractSubmissionRulesTab({ contractId }: ContractSubmissionRulesTabProps) {
  const [rules, setRules] = useState<SubmissionRule[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<SubmissionRule | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [filters, setFilters] = useState({
    requirePreauth: false,
    hardBlock: false,
    hasWaitDays: false,
    hasVisitLimits: false
  })

  const fetchRules = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contracts/${contractId}/submission-rules?page=${page}&size=20`)
      if (!response.ok) throw new Error('Failed to fetch submission rules')
      
      const data: SubmissionRuleListResponse = await response.json()
      setRules(data.data.content)
      setTotalPages(data.data.totalPages)
    } catch (error) {
      console.error('Error fetching submission rules:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [contractId, page])

  const handleDelete = async (ruleId: number) => {
    if (!confirm('Are you sure you want to delete this submission rule?')) return

    try {
      const response = await fetch(`/api/contracts/${contractId}/submission-rules/${ruleId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete submission rule')
      
      await fetchRules()
    } catch (error) {
      console.error('Error deleting submission rule:', error)
      alert('Failed to delete submission rule')
    }
  }

  const handleEdit = (rule: SubmissionRule) => {
    setEditingRule(rule)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingRule(null)
  }

  const handleFormSuccess = () => {
    fetchRules()
    handleFormClose()
  }

  const getRuleScope = (rule: SubmissionRule) => {
    if (rule.benefitId && rule.benefitNameEn) return { type: 'Benefit', name: rule.benefitNameEn }
    if (rule.categoryId && rule.categoryNameEn) return { type: 'Category', name: rule.categoryNameEn }
    if (rule.procedureId) return { type: 'Procedure', name: `Procedure ID: ${rule.procedureId}` }
    if (rule.icdId) return { type: 'ICD', name: `ICD ID: ${rule.icdId}` }
    if (rule.drugId) return { type: 'Drug', name: `Drug ID: ${rule.drugId}` }
    return { type: 'General', name: 'All Services' }
  }

  const getNetworkBadges = (rule: SubmissionRule) => {
    const networks = []
    if (rule.appliesToInNetwork) networks.push('In-Network')
    if (rule.appliesToOutNetwork) networks.push('Out-Network')
    if (rule.appliesToCash) networks.push('Cash')
    return networks
  }

  const filteredRules = rules.filter(rule => {
    const scope = getRuleScope(rule)
    const matchesSearch = 
      scope.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scope.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rule.notes && rule.notes.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilters = 
      (!filters.requirePreauth || rule.requirePreauth) &&
      (!filters.hardBlock || rule.hardBlock) &&
      (!filters.hasWaitDays || rule.waitDays > 0) &&
      (!filters.hasVisitLimits || rule.maxVisitsPerYear !== null)

    return matchesSearch && matchesFilters
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading submission rules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Submission Rules</h2>
          <p className="text-muted-foreground">
            Configure preauthorization, waiting periods, and submission requirements
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requirePreauth"
                checked={filters.requirePreauth}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, requirePreauth: !!checked }))
                }
              />
              <label htmlFor="requirePreauth" className="text-sm font-medium">
                Requires Preauth
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hardBlock"
                checked={filters.hardBlock}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, hardBlock: !!checked }))
                }
              />
              <label htmlFor="hardBlock" className="text-sm font-medium">
                Hard Block
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasWaitDays"
                checked={filters.hasWaitDays}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, hasWaitDays: !!checked }))
                }
              />
              <label htmlFor="hasWaitDays" className="text-sm font-medium">
                Has Wait Days
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasVisitLimits"
                checked={filters.hasVisitLimits}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, hasVisitLimits: !!checked }))
                }
              />
              <label htmlFor="hasVisitLimits" className="text-sm font-medium">
                Has Visit Limits
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Submission Rules ({filteredRules.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRules.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Submission Rules</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || Object.values(filters).some(Boolean) 
                  ? 'No rules match your search or filter criteria.' 
                  : 'Get started by creating your first submission rule.'}
              </p>
              {!searchTerm && !Object.values(filters).some(Boolean) && (
                <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Rule
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Scope</TableHead>
                    <TableHead>Applied Networks</TableHead>
                    <TableHead>Preauth</TableHead>
                    <TableHead>Wait Days</TableHead>
                    <TableHead>Visit Limits</TableHead>
                    <TableHead>Hard Block</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule) => {
                    const scope = getRuleScope(rule)
                    const networks = getNetworkBadges(rule)
                    
                    return (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{scope.name}</div>
                            <Badge variant="outline" className="text-xs">
                              {scope.type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {networks.map(network => (
                              <Badge key={network} variant="secondary" className="text-xs">
                                {network}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {rule.requirePreauth ? (
                            <Badge variant="default" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Required
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {rule.waitDays > 0 ? (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {rule.waitDays} days
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {rule.maxVisitsPerYear ? (
                            <span className="text-sm font-medium">
                              {rule.maxVisitsPerYear}/year
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unlimited</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {rule.hardBlock ? (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Blocked
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(rule)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(rule.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
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

      <SubmissionRuleFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        contractId={contractId}
        editingRule={editingRule}
      />
    </div>
  )
}
