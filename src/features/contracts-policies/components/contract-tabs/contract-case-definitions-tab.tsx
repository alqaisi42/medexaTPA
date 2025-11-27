'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Plus, Search, Edit, Trash2, FileText, Filter, Shield, Clock, Star } from 'lucide-react'
import { CaseDefinition, CaseDefinitionListResponse, PROVIDER_TYPES, VISIT_TYPES } from '@/types/case-definition'
import { CaseDefinitionFormDialog } from './case-definition-form-dialog'

interface ContractCaseDefinitionsTabProps {
  contractId: number
}

export function ContractCaseDefinitionsTab({ contractId }: ContractCaseDefinitionsTabProps) {
  const [caseDefinitions, setCaseDefinitions] = useState<CaseDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCase, setEditingCase] = useState<CaseDefinition | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [filters, setFilters] = useState({
    providerType: '',
    visitType: '',
    requirePreauth: false,
    allowExclusive: false,
    isActive: true
  })

  const fetchCaseDefinitions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contracts/${contractId}/case-definitions?page=${page}&size=20`)
      if (!response.ok) throw new Error('Failed to fetch case definitions')
      
      const data: CaseDefinitionListResponse = await response.json()
      setCaseDefinitions(data.data.content)
      setTotalPages(data.data.totalPages)
    } catch (error) {
      console.error('Error fetching case definitions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCaseDefinitions()
  }, [contractId, page])

  const handleDelete = async (caseId: number) => {
    if (!confirm('Are you sure you want to delete this case definition?')) return

    try {
      const response = await fetch(`/api/contracts/${contractId}/case-definitions/${caseId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete case definition')
      
      await fetchCaseDefinitions()
    } catch (error) {
      console.error('Error deleting case definition:', error)
      alert('Failed to delete case definition')
    }
  }

  const handleEdit = (caseDefinition: CaseDefinition) => {
    setEditingCase(caseDefinition)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingCase(null)
  }

  const handleFormSuccess = () => {
    fetchCaseDefinitions()
    handleFormClose()
  }

  const getCaseScope = (caseDefinition: CaseDefinition) => {
    if (caseDefinition.benefitId && caseDefinition.benefitNameEn) {
      return { type: 'Benefit', name: caseDefinition.benefitNameEn }
    }
    if (caseDefinition.categoryId && caseDefinition.categoryNameEn) {
      return { type: 'Category', name: caseDefinition.categoryNameEn }
    }
    if (caseDefinition.procedureId) {
      return { type: 'Procedure', name: `Procedure ID: ${caseDefinition.procedureId}` }
    }
    if (caseDefinition.icdId) {
      return { type: 'ICD', name: `ICD ID: ${caseDefinition.icdId}` }
    }
    return { type: 'General', name: 'All Services' }
  }

  const formatProviderType = (type: string) => {
    const provider = PROVIDER_TYPES.find(p => p.value === type)
    return provider?.label || type.replace(/_/g, ' ')
  }

  const formatVisitType = (type: string) => {
    const visit = VISIT_TYPES.find(v => v.value === type)
    return visit?.label || type.replace(/_/g, ' ')
  }

  const filteredCaseDefinitions = caseDefinitions.filter(caseDefinition => {
    const scope = getCaseScope(caseDefinition)
    const matchesSearch = 
      caseDefinition.caseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseDefinition.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseDefinition.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scope.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilters = 
      (!filters.providerType || caseDefinition.providerType === filters.providerType) &&
      (!filters.visitType || caseDefinition.visitType === filters.visitType) &&
      (!filters.requirePreauth || caseDefinition.requirePreauth) &&
      (!filters.allowExclusive || caseDefinition.allowExclusive) &&
      (!filters.isActive || caseDefinition.isActive)

    return matchesSearch && matchesFilters
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading case definitions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Case Definitions</h2>
          <p className="text-muted-foreground">
            Define medical case classifications for contract benefits, procedures, and ICDs
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Case
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider Type</label>
              <SearchableSelect
                options={[
                  { id: '', label: 'All Provider Types' },
                  ...PROVIDER_TYPES.map(type => ({ id: type.value, label: type.label }))
                ]}
                value={filters.providerType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, providerType: value as string }))}
                placeholder="All Provider Types"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Visit Type</label>
              <SearchableSelect
                options={[
                  { id: '', label: 'All Visit Types' },
                  ...VISIT_TYPES.map(type => ({ id: type.value, label: type.label }))
                ]}
                value={filters.visitType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, visitType: value as string }))}
                placeholder="All Visit Types"
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="requirePreauth"
                checked={filters.requirePreauth}
                onChange={(e) => setFilters(prev => ({ ...prev, requirePreauth: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="requirePreauth" className="text-sm font-medium">
                Requires Preauth
              </label>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="allowExclusive"
                checked={filters.allowExclusive}
                onChange={(e) => setFilters(prev => ({ ...prev, allowExclusive: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="allowExclusive" className="text-sm font-medium">
                Allow Exclusive
              </label>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={filters.isActive}
                onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active Only
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Case Definitions ({filteredCaseDefinitions.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCaseDefinitions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Case Definitions</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || Object.values(filters).some(Boolean) 
                  ? 'No cases match your search or filter criteria.' 
                  : 'Get started by creating your first case definition.'}
              </p>
              {!searchTerm && !Object.values(filters).some(Boolean) && (
                <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Case
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Provider Type</TableHead>
                    <TableHead>Visit Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCaseDefinitions.map((caseDefinition) => {
                    const scope = getCaseScope(caseDefinition)
                    
                    return (
                      <TableRow key={caseDefinition.id}>
                        <TableCell className="font-mono font-medium">
                          {caseDefinition.caseCode}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{caseDefinition.nameEn}</div>
                            {caseDefinition.nameAr && (
                              <div className="text-sm text-muted-foreground">{caseDefinition.nameAr}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{scope.name}</div>
                            <Badge variant="outline" className="text-xs">
                              {scope.type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {formatProviderType(caseDefinition.providerType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatVisitType(caseDefinition.visitType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="font-medium">{caseDefinition.priority}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {caseDefinition.requirePreauth && (
                              <Badge variant="default" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Preauth
                              </Badge>
                            )}
                            {caseDefinition.allowExclusive && (
                              <Badge variant="destructive" className="text-xs">
                                Exclusive
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={caseDefinition.isActive ? "default" : "secondary"}>
                            {caseDefinition.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(caseDefinition)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(caseDefinition.id)}
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

      <CaseDefinitionFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        contractId={contractId}
        editingCase={editingCase}
      />
    </div>
  )
}
