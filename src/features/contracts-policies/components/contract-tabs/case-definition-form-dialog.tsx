'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, Target, Building, Calendar, Shield, Star } from 'lucide-react'
import {
  CaseDefinition,
  CreateCaseDefinitionPayload,
  UpdateCaseDefinitionPayload,
  PROVIDER_TYPES,
  VISIT_TYPES
} from '@/types/case-definition'
import { fetchMasterBenefits } from '@/lib/api/plans'
import { fetchProcedureCategories } from '@/lib/api/procedures'
import { MasterBenefit } from '@/types/plan'
import { ProcedureCategoryRecord } from '@/types/procedure'

interface FormData {
  caseCode: string
  nameEn: string
  nameAr: string
  scopeType: string
  benefitId?: number
  categoryId?: number
  procedureId?: number
  icdId?: number
  providerType: string
  visitType: string
  requirePreauth: boolean
  allowExclusive: boolean
  priority: number
  isActive: boolean
}

interface CaseDefinitionFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  contractId: number
  editingCase?: CaseDefinition | null
}

export function CaseDefinitionFormDialog({
  open,
  onClose,
  onSuccess,
  contractId,
  editingCase
}: CaseDefinitionFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [benefits, setBenefits] = useState<MasterBenefit[]>([])
  const [categories, setCategories] = useState<ProcedureCategoryRecord[]>([])
  const [formData, setFormData] = useState<FormData>({
    caseCode: '',
    nameEn: '',
    nameAr: '',
    scopeType: '',
    benefitId: undefined,
    categoryId: undefined,
    procedureId: undefined,
    icdId: undefined,
    providerType: '',
    visitType: '',
    requirePreauth: false,
    allowExclusive: false,
    priority: 1,
    isActive: true,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    if (open) {
      loadLookupData()
      if (editingCase) {
        const scopeType = editingCase.benefitId ? 'benefit' : 
                         editingCase.categoryId ? 'category' :
                         editingCase.procedureId ? 'procedure' :
                         editingCase.icdId ? 'icd' : ''

        setFormData({
          caseCode: editingCase.caseCode,
          nameEn: editingCase.nameEn,
          nameAr: editingCase.nameAr,
          scopeType,
          benefitId: editingCase.benefitId,
          categoryId: editingCase.categoryId,
          procedureId: editingCase.procedureId,
          icdId: editingCase.icdId,
          providerType: editingCase.providerType,
          visitType: editingCase.visitType,
          requirePreauth: editingCase.requirePreauth,
          allowExclusive: editingCase.allowExclusive,
          priority: editingCase.priority,
          isActive: editingCase.isActive,
        })
      } else {
        setFormData({
          caseCode: '',
          nameEn: '',
          nameAr: '',
          scopeType: '',
          benefitId: undefined,
          categoryId: undefined,
          procedureId: undefined,
          icdId: undefined,
          providerType: '',
          visitType: '',
          requirePreauth: false,
          allowExclusive: false,
          priority: 1,
          isActive: true,
        })
      }
      setErrors({})
    }
  }, [open, editingCase])

  const loadLookupData = async () => {
    try {
      const [benefitsData, categoriesData] = await Promise.all([
        fetchMasterBenefits({ page: 0, size: 100 }),
        fetchProcedureCategories({ page: 0, size: 100 })
      ])

      setBenefits(benefitsData.data.content)
      setCategories(categoriesData.data.content)
    } catch (error) {
      console.error('Error loading lookup data:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.caseCode) {
      newErrors.caseCode = 'Case code is required'
    }
    if (!formData.nameEn) {
      newErrors.nameEn = 'English name is required'
    }
    if (!formData.providerType) {
      newErrors.providerType = 'Provider type is required'
    }
    if (!formData.visitType) {
      newErrors.visitType = 'Visit type is required'
    }
    if (formData.priority < 1) {
      newErrors.priority = 'Priority must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      const payload = editingCase
        ? ({
            nameEn: formData.nameEn,
            nameAr: formData.nameAr,
            benefitId: formData.scopeType === 'benefit' ? formData.benefitId : undefined,
            categoryId: formData.scopeType === 'category' ? formData.categoryId : undefined,
            procedureId: formData.scopeType === 'procedure' ? formData.procedureId : undefined,
            icdId: formData.scopeType === 'icd' ? formData.icdId : undefined,
            providerType: formData.providerType,
            visitType: formData.visitType,
            requirePreauth: formData.requirePreauth,
            allowExclusive: formData.allowExclusive,
            priority: formData.priority,
            isActive: formData.isActive,
          } as UpdateCaseDefinitionPayload)
        : ({
            caseCode: formData.caseCode,
            nameEn: formData.nameEn,
            nameAr: formData.nameAr,
            benefitId: formData.scopeType === 'benefit' ? formData.benefitId : undefined,
            categoryId: formData.scopeType === 'category' ? formData.categoryId : undefined,
            procedureId: formData.scopeType === 'procedure' ? formData.procedureId : undefined,
            icdId: formData.scopeType === 'icd' ? formData.icdId : undefined,
            providerType: formData.providerType,
            visitType: formData.visitType,
            requirePreauth: formData.requirePreauth,
            allowExclusive: formData.allowExclusive,
            priority: formData.priority,
            isActive: formData.isActive,
          } as CreateCaseDefinitionPayload)

      const url = editingCase
        ? `/api/contracts/${contractId}/case-definitions/${editingCase.id}`
        : `/api/contracts/${contractId}/case-definitions`

      const method = editingCase ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingCase ? 'update' : 'create'} case definition`)
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving case definition:', error)
      alert(`Failed to ${editingCase ? 'update' : 'create'} case definition`)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleScopeTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      scopeType: value,
      // Clear other scope fields when scope type changes
      benefitId: undefined,
      categoryId: undefined,
      procedureId: undefined,
      icdId: undefined,
    }))
  }

  const getScopeOptions = () => {
    switch (formData.scopeType) {
      case 'benefit':
        return benefits.map(benefit => ({
          id: benefit.id,
          label: `${benefit.code} - ${benefit.nameEn}`
        }))
      case 'category':
        return categories.map(category => ({
          id: category.id,
          label: category.nameEn
        }))
      default:
        return []
    }
  }

  const getScopeFieldName = (): keyof FormData | null => {
    switch (formData.scopeType) {
      case 'benefit': return 'benefitId'
      case 'category': return 'categoryId'
      case 'procedure': return 'procedureId'
      case 'icd': return 'icdId'
      default: return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {editingCase ? 'Edit Case Definition' : 'Create Case Definition'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="caseCode">Case Code *</Label>
                  <Input
                    id="caseCode"
                    value={formData.caseCode}
                    onChange={(e) => handleFieldChange('caseCode', e.target.value)}
                    placeholder="e.g., CASE_001"
                    disabled={!!editingCase}
                  />
                  {errors.caseCode && (
                    <p className="text-sm text-red-500">{errors.caseCode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    value={formData.priority}
                    onChange={(e) => handleFieldChange('priority', parseInt(e.target.value) || 1)}
                    placeholder="1"
                  />
                  {errors.priority && (
                    <p className="text-sm text-red-500">{errors.priority}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nameEn">Name (English) *</Label>
                  <Input
                    id="nameEn"
                    value={formData.nameEn}
                    onChange={(e) => handleFieldChange('nameEn', e.target.value)}
                    placeholder="Case definition name"
                  />
                  {errors.nameEn && (
                    <p className="text-sm text-red-500">{errors.nameEn}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nameAr">Name (Arabic)</Label>
                  <Input
                    id="nameAr"
                    value={formData.nameAr}
                    onChange={(e) => handleFieldChange('nameAr', e.target.value)}
                    placeholder="اسم تعريف الحالة"
                    dir="rtl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Case Scope */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-4 w-4" />
                Case Scope
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Scope Type</Label>
                <SearchableSelect
                  options={[
                    { id: 'benefit', label: 'Benefit' },
                    { id: 'category', label: 'Category' },
                    { id: 'procedure', label: 'Procedure' },
                    { id: 'icd', label: 'ICD' }
                  ]}
                  value={formData.scopeType}
                  onValueChange={handleScopeTypeChange}
                  placeholder="Select scope type..."
                  disabled={!!editingCase}
                />
              </div>

              {formData.scopeType && formData.scopeType !== 'procedure' && formData.scopeType !== 'icd' && (
                <div className="space-y-2">
                  <Label>{formData.scopeType.charAt(0).toUpperCase() + formData.scopeType.slice(1)}</Label>
                  <SearchableSelect
                    options={getScopeOptions()}
                    value={formData[getScopeFieldName()!] as number}
                    onValueChange={(value) => handleFieldChange(getScopeFieldName()!, value)}
                    placeholder={`Select ${formData.scopeType}...`}
                    disabled={!!editingCase}
                  />
                </div>
              )}

              {formData.scopeType === 'procedure' && (
                <div className="space-y-2">
                  <Label htmlFor="procedureId">Procedure ID</Label>
                  <Input
                    id="procedureId"
                    type="number"
                    placeholder="Enter procedure ID..."
                    value={formData.procedureId || ''}
                    onChange={(e) => handleFieldChange('procedureId', e.target.value ? parseInt(e.target.value) : undefined)}
                    disabled={!!editingCase}
                  />
                </div>
              )}

              {formData.scopeType === 'icd' && (
                <div className="space-y-2">
                  <Label htmlFor="icdId">ICD ID</Label>
                  <Input
                    id="icdId"
                    type="number"
                    placeholder="Enter ICD ID..."
                    value={formData.icdId || ''}
                    onChange={(e) => handleFieldChange('icdId', e.target.value ? parseInt(e.target.value) : undefined)}
                    disabled={!!editingCase}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Provider & Visit Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-4 w-4" />
                Provider & Visit Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider Type *</Label>
                  <SearchableSelect
                    options={PROVIDER_TYPES.map(type => ({
                      id: type.value,
                      label: type.label
                    }))}
                    value={formData.providerType}
                    onValueChange={(value) => handleFieldChange('providerType', value)}
                    placeholder="Select provider type..."
                  />
                  {errors.providerType && (
                    <p className="text-sm text-red-500">{errors.providerType}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Visit Type *</Label>
                  <SearchableSelect
                    options={VISIT_TYPES.map(type => ({
                      id: type.value,
                      label: type.label
                    }))}
                    value={formData.visitType}
                    onValueChange={(value) => handleFieldChange('visitType', value)}
                    placeholder="Select visit type..."
                  />
                  {errors.visitType && (
                    <p className="text-sm text-red-500">{errors.visitType}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flags & Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Flags & Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requirePreauth"
                    checked={formData.requirePreauth}
                    onCheckedChange={(checked) => 
                      handleFieldChange('requirePreauth', !!checked)
                    }
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="requirePreauth">Require Preauthorization</Label>
                    <p className="text-xs text-muted-foreground">
                      Require preauth before service delivery
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowExclusive"
                    checked={formData.allowExclusive}
                    onCheckedChange={(checked) => 
                      handleFieldChange('allowExclusive', !!checked)
                    }
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="allowExclusive">Allow Exclusive</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow exclusive provider arrangements
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => 
                      handleFieldChange('isActive', !!checked)
                    }
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="isActive">Active</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable this case definition
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingCase ? 'Update Case' : 'Create Case'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
