'use client'

import { useState } from 'react'
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
import { Activity, DollarSign, Calendar, User } from 'lucide-react'
import { MemberAccumulatorWithLimits, ApplyUsagePayload } from '@/types/member-accumulator'

interface ApplyUsageDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  accumulator: MemberAccumulatorWithLimits
}

export function ApplyUsageDialog({
  open,
  onClose,
  onSuccess,
  accumulator
}: ApplyUsageDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amountDelta: 0,
    visitsDelta: 0,
    serviceDate: new Date().toISOString().split('T')[0]
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.amountDelta === 0 && formData.visitsDelta === 0) {
      newErrors.general = 'At least one of Amount Delta or Visits Delta must be greater than 0'
    }
    if (!formData.serviceDate) {
      newErrors.serviceDate = 'Service date is required'
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

      const payload: ApplyUsagePayload = {
        planId: accumulator.planId,
        benefitId: accumulator.benefitId,
        amountDelta: formData.amountDelta,
        visitsDelta: formData.visitsDelta,
        serviceDate: formData.serviceDate
      }

      const response = await fetch(`/api/enrollments/${accumulator.enrollmentId}/accumulators/apply-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to apply usage')
      }

      onSuccess()
    } catch (error) {
      console.error('Error applying usage:', error)
      alert('Failed to apply usage')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field] || errors.general) {
      setErrors(prev => ({ ...prev, [field]: undefined, general: undefined }))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const newUsedAmount = accumulator.usedAmount + formData.amountDelta
  const newUsedVisits = accumulator.usedVisits + formData.visitsDelta
  const newRemainingAmount = accumulator.limitAmount ? Math.max(0, accumulator.limitAmount - newUsedAmount) : undefined
  const newRemainingVisits = accumulator.limitVisits ? Math.max(0, accumulator.limitVisits - newUsedVisits) : undefined

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Apply Usage - {accumulator.benefitNameEn}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Accumulator Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Enrollment ID</p>
                  <p className="font-medium">{accumulator.enrollmentId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Plan ID</p>
                  <p className="font-medium">{accumulator.planId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Used Amount</p>
                  <p className="font-medium">{formatCurrency(accumulator.usedAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Used Visits</p>
                  <p className="font-medium">{accumulator.usedVisits}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Remaining Amount</p>
                  <p className="font-medium">
                    {accumulator.remainingAmount !== undefined 
                      ? formatCurrency(accumulator.remainingAmount)
                      : 'Unlimited'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Remaining Visits</p>
                  <p className="font-medium">
                    {accumulator.remainingVisits !== undefined 
                      ? accumulator.remainingVisits.toString()
                      : 'Unlimited'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Application Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Apply New Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.general && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amountDelta">Amount Delta</Label>
                  <Input
                    id="amountDelta"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amountDelta}
                    onChange={(e) => handleFieldChange('amountDelta', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Amount to add to current usage
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitsDelta">Visits Delta</Label>
                  <Input
                    id="visitsDelta"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.visitsDelta}
                    onChange={(e) => handleFieldChange('visitsDelta', parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of visits to add
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceDate">Service Date *</Label>
                  <Input
                    id="serviceDate"
                    type="date"
                    value={formData.serviceDate}
                    onChange={(e) => handleFieldChange('serviceDate', e.target.value)}
                  />
                  {errors.serviceDate && (
                    <p className="text-sm text-red-500">{errors.serviceDate}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {(formData.amountDelta > 0 || formData.visitsDelta > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Preview After Application
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">New Used Amount</p>
                    <p className="font-medium text-blue-600">{formatCurrency(newUsedAmount)}</p>
                    {formData.amountDelta > 0 && (
                      <p className="text-xs text-green-600">+{formatCurrency(formData.amountDelta)}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">New Used Visits</p>
                    <p className="font-medium text-blue-600">{newUsedVisits}</p>
                    {formData.visitsDelta > 0 && (
                      <p className="text-xs text-green-600">+{formData.visitsDelta}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">New Remaining Amount</p>
                    <p className={`font-medium ${newRemainingAmount !== undefined && newRemainingAmount < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {newRemainingAmount !== undefined 
                        ? formatCurrency(newRemainingAmount)
                        : 'Unlimited'
                      }
                    </p>
                    {newRemainingAmount !== undefined && newRemainingAmount < 0 && (
                      <p className="text-xs text-red-600">Exceeds limit!</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">New Remaining Visits</p>
                    <p className={`font-medium ${newRemainingVisits !== undefined && newRemainingVisits < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {newRemainingVisits !== undefined 
                        ? newRemainingVisits.toString()
                        : 'Unlimited'
                      }
                    </p>
                    {newRemainingVisits !== undefined && newRemainingVisits < 0 && (
                      <p className="text-xs text-red-600">Exceeds limit!</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Applying...' : 'Apply Usage'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
