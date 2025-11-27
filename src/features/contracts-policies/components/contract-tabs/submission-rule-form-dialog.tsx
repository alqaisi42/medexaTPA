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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield, Network, Clock, AlertTriangle, Target } from 'lucide-react'
import {
  SubmissionRule,
  CreateSubmissionRulePayload,
  UpdateSubmissionRulePayload,
  RULE_TYPES
} from '@/types/submission-rule'

interface FormData {
  ruleType: string
  appliesToInNetwork: boolean
  appliesToOutNetwork: boolean
  appliesToCash: boolean
  requirePreauth: boolean
  waitDays: number
  maxVisitsPerYear?: number
  maxAmountPerYear?: number
  hardBlock: boolean
  notes?: string
}

interface SubmissionRuleFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  contractId: number
  editingRule?: SubmissionRule | null
}

export function SubmissionRuleFormDialog({
  open,
  onClose,
  onSuccess,
  contractId,
  editingRule
}: SubmissionRuleFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    ruleType: '',
    appliesToInNetwork: true,
    appliesToOutNetwork: true,
    appliesToCash: false,
    requirePreauth: false,
    waitDays: 0,
    maxVisitsPerYear: undefined,
    maxAmountPerYear: undefined,
    hardBlock: false,
    notes: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    if (open) {
      if (editingRule) {
        setFormData({
          ruleType: editingRule.ruleType || '',
          appliesToInNetwork: editingRule.appliesToInNetwork,
          appliesToOutNetwork: editingRule.appliesToOutNetwork,
          appliesToCash: editingRule.appliesToCash,
          requirePreauth: editingRule.requirePreauth,
          waitDays: editingRule.waitDays,
          maxVisitsPerYear: editingRule.maxVisitsPerYear || undefined,
          maxAmountPerYear: editingRule.maxAmountPerYear || undefined,
          hardBlock: editingRule.hardBlock,
          notes: editingRule.notes || '',
        })
      } else {
        setFormData({
          ruleType: '',
          appliesToInNetwork: true,
          appliesToOutNetwork: true,
          appliesToCash: false,
          requirePreauth: false,
          waitDays: 0,
          maxVisitsPerYear: undefined,
          maxAmountPerYear: undefined,
          hardBlock: false,
          notes: '',
        })
      }
      setErrors({})
    }
  }, [open, editingRule])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.ruleType) {
      newErrors.ruleType = 'Rule type is required'
    }
    if (formData.waitDays < 0) {
      newErrors.waitDays = 'Wait days must be 0 or greater'
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

      const payload = editingRule
        ? ({
            appliesToInNetwork: formData.appliesToInNetwork,
            appliesToOutNetwork: formData.appliesToOutNetwork,
            appliesToCash: formData.appliesToCash,
            requirePreauth: formData.requirePreauth,
            waitDays: formData.waitDays,
            maxVisitsPerYear: formData.maxVisitsPerYear,
            maxAmountPerYear: formData.maxAmountPerYear,
            hardBlock: formData.hardBlock,
            notes: formData.notes,
          } as UpdateSubmissionRulePayload)
        : ({
            ruleType: formData.ruleType,
            appliesToInNetwork: formData.appliesToInNetwork,
            appliesToOutNetwork: formData.appliesToOutNetwork,
            appliesToCash: formData.appliesToCash,
            requirePreauth: formData.requirePreauth,
            waitDays: formData.waitDays,
            maxVisitsPerYear: formData.maxVisitsPerYear,
            maxAmountPerYear: formData.maxAmountPerYear,
            hardBlock: formData.hardBlock,
            notes: formData.notes,
          } as CreateSubmissionRulePayload)

      const url = editingRule
        ? `/api/contracts/${contractId}/submission-rules/${editingRule.id}`
        : `/api/contracts/${contractId}/submission-rules`

      const method = editingRule ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingRule ? 'update' : 'create'} submission rule`)
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving submission rule:', error)
      alert(`Failed to ${editingRule ? 'update' : 'create'} submission rule`)
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {editingRule ? 'Edit Submission Rule' : 'Create Submission Rule'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rule Scope Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-4 w-4" />
                Rule Scope
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Rule Type *</Label>
                <SearchableSelect
                  options={RULE_TYPES.map(type => ({
                    id: type.value,
                    label: type.label
                  }))}
                  value={formData.ruleType}
                  onValueChange={(value) => handleFieldChange('ruleType', value)}
                  placeholder="Select rule type..."
                  searchPlaceholder="Search types..."
                  disabled={!!editingRule}
                />
                {errors.ruleType && (
                  <p className="text-sm text-red-500">{errors.ruleType}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Applied Networks Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Network className="h-4 w-4" />
                Applied Networks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="appliesToInNetwork"
                    checked={formData.appliesToInNetwork}
                    onCheckedChange={(checked) => 
                      handleFieldChange('appliesToInNetwork', !!checked)
                    }
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="appliesToInNetwork">In-Network</Label>
                    <p className="text-xs text-muted-foreground">
                      Apply to in-network providers
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="appliesToOutNetwork"
                    checked={formData.appliesToOutNetwork}
                    onCheckedChange={(checked) => 
                      handleFieldChange('appliesToOutNetwork', !!checked)
                    }
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="appliesToOutNetwork">Out-of-Network</Label>
                    <p className="text-xs text-muted-foreground">
                      Apply to out-of-network providers
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="appliesToCash"
                    checked={formData.appliesToCash}
                    onCheckedChange={(checked) => 
                      handleFieldChange('appliesToCash', !!checked)
                    }
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="appliesToCash">Cash</Label>
                    <p className="text-xs text-muted-foreground">
                      Apply to cash payments
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preauth & Wait Days Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Preauth & Wait Days
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="waitDays">Wait Days</Label>
                  <Input
                    id="waitDays"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.waitDays}
                    onChange={(e) => handleFieldChange('waitDays', parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of days to wait before service is available
                  </p>
                  {errors.waitDays && (
                    <p className="text-sm text-red-500">{errors.waitDays}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limits & Hard Block Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Limits & Hard Block
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxVisitsPerYear">Max Visits Per Year</Label>
                  <Input
                    id="maxVisitsPerYear"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.maxVisitsPerYear || ''}
                    onChange={(e) => handleFieldChange('maxVisitsPerYear', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of visits allowed per year
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAmountPerYear">Max Amount Per Year</Label>
                  <Input
                    id="maxAmountPerYear"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unlimited"
                    value={formData.maxAmountPerYear || ''}
                    onChange={(e) => handleFieldChange('maxAmountPerYear', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum amount allowed per year
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hardBlock"
                  checked={formData.hardBlock}
                  onCheckedChange={(checked) => 
                    handleFieldChange('hardBlock', !!checked)
                  }
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="hardBlock">Hard Block</Label>
                  <p className="text-xs text-muted-foreground">
                    Completely block this service/category
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or comments..."
                  className="min-h-[80px]"
                  value={formData.notes || ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
