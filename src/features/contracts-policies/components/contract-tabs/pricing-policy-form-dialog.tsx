'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Settings, DollarSign, Calculator, CreditCard } from 'lucide-react'
import {
  PricingPolicy,
  CreatePricingPolicyPayload,
  UpdatePricingPolicyPayload,
  LOCAL_NETWORK_PRICING_MODELS,
  LOCAL_NETWORK_PRICE_BASIS,
  CASH_PRICING_MODELS,
  COINSURANCE_METHODS
} from '@/types/pricing-policy'
import { LookupRecord } from '@/types/lookup'
import { getLookupRecords } from '@/features/lookup-management/services/master-lookup-service'

interface FormData {
  serviceCategoryId: number
  localNetworkPricingModel: string
  localNetworkPriceBasis: string
  cashPricingModel: string
  coinsuranceMethod: string
}

interface PricingPolicyFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  contractId: number
  editingPolicy?: PricingPolicy | null
}

export function PricingPolicyFormDialog({
  open,
  onClose,
  onSuccess,
  contractId,
  editingPolicy
}: PricingPolicyFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [serviceCategories, setServiceCategories] = useState<LookupRecord[]>([])
  const [formData, setFormData] = useState<FormData>({
    serviceCategoryId: 0,
    localNetworkPricingModel: '',
    localNetworkPriceBasis: '',
    cashPricingModel: '',
    coinsuranceMethod: '',
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})

  useEffect(() => {
    if (open) {
      loadServiceCategories()
      if (editingPolicy) {
        setFormData({
          serviceCategoryId: editingPolicy.serviceCategoryId,
          localNetworkPricingModel: editingPolicy.localNetworkPricingModel,
          localNetworkPriceBasis: editingPolicy.localNetworkPriceBasis,
          cashPricingModel: editingPolicy.cashPricingModel || '',
          coinsuranceMethod: editingPolicy.coinsuranceMethod,
        })
      } else {
        setFormData({
          serviceCategoryId: 0,
          localNetworkPricingModel: '',
          localNetworkPriceBasis: '',
          cashPricingModel: '',
          coinsuranceMethod: '',
        })
      }
      setErrors({})
    }
  }, [open, editingPolicy])

  const loadServiceCategories = async () => {
    try {
      const categories = await getLookupRecords('service-categories')
      setServiceCategories(categories)
    } catch (error) {
      console.error('Error loading service categories:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.serviceCategoryId || formData.serviceCategoryId === 0) {
      newErrors.serviceCategoryId = 0 // Using 0 to indicate error
    }
    if (!formData.localNetworkPricingModel) {
      newErrors.localNetworkPricingModel = 'Local network pricing model is required'
    }
    if (!formData.localNetworkPriceBasis) {
      newErrors.localNetworkPriceBasis = 'Local network price basis is required'
    }
    if (!formData.coinsuranceMethod) {
      newErrors.coinsuranceMethod = 'Coinsurance method is required'
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

      const payload = editingPolicy
        ? ({
            serviceCategoryId: formData.serviceCategoryId,
            localNetworkPricingModel: formData.localNetworkPricingModel,
            localNetworkPriceBasis: formData.localNetworkPriceBasis,
            cashPricingModel: formData.cashPricingModel || '',
            coinsuranceMethod: formData.coinsuranceMethod,
          } as UpdatePricingPolicyPayload)
        : ({
            serviceCategoryId: formData.serviceCategoryId,
            localNetworkPricingModel: formData.localNetworkPricingModel,
            localNetworkPriceBasis: formData.localNetworkPriceBasis,
            cashPricingModel: formData.cashPricingModel,
            coinsuranceMethod: formData.coinsuranceMethod,
          } as CreatePricingPolicyPayload)

      const url = editingPolicy
        ? `/api/contracts/${contractId}/pricing-policies/${editingPolicy.id}`
        : `/api/contracts/${contractId}/pricing-policies`

      const method = editingPolicy ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingPolicy ? 'update' : 'create'} pricing policy`)
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving pricing policy:', error)
      alert(`Failed to ${editingPolicy ? 'update' : 'create'} pricing policy`)
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

  const serviceCategoryOptions = serviceCategories.map(category => ({
    id: parseInt(category.id),
    label: category.nameEn || category.code
  }))

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {editingPolicy ? 'Edit Pricing Policy' : 'Create Pricing Policy'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Category Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Service Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Service Category *</Label>
                <SearchableSelect
                  options={serviceCategoryOptions}
                  value={formData.serviceCategoryId}
                  onValueChange={(value) => handleFieldChange('serviceCategoryId', value)}
                  placeholder="Select service category..."
                  searchPlaceholder="Search categories..."
                />
                {errors.serviceCategoryId && (
                  <p className="text-sm text-red-500">Service category is required</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Local Network Pricing Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Local Network Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pricing Model *</Label>
                  <SearchableSelect
                    options={LOCAL_NETWORK_PRICING_MODELS.map(model => ({
                      id: model.value,
                      label: model.label
                    }))}
                    value={formData.localNetworkPricingModel}
                    onValueChange={(value) => handleFieldChange('localNetworkPricingModel', value)}
                    placeholder="Select pricing model..."
                    searchPlaceholder="Search models..."
                  />
                  {errors.localNetworkPricingModel && (
                    <p className="text-sm text-red-500">{errors.localNetworkPricingModel}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Price Basis *</Label>
                  <SearchableSelect
                    options={LOCAL_NETWORK_PRICE_BASIS.map(basis => ({
                      id: basis.value,
                      label: basis.label
                    }))}
                    value={formData.localNetworkPriceBasis}
                    onValueChange={(value) => handleFieldChange('localNetworkPriceBasis', value)}
                    placeholder="Select price basis..."
                    searchPlaceholder="Search basis..."
                  />
                  {errors.localNetworkPriceBasis && (
                    <p className="text-sm text-red-500">{errors.localNetworkPriceBasis}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cash Pricing Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Cash Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Cash Pricing Model</Label>
                <SearchableSelect
                  options={CASH_PRICING_MODELS.map(model => ({
                    id: model.value,
                    label: model.label
                  }))}
                  value={formData.cashPricingModel}
                  onValueChange={(value) => handleFieldChange('cashPricingModel', value)}
                  placeholder="Select cash pricing model (optional)..."
                  searchPlaceholder="Search models..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Coinsurance Logic Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Coinsurance Logic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Coinsurance Method *</Label>
                <SearchableSelect
                  options={COINSURANCE_METHODS.map(method => ({
                    id: method.value,
                    label: method.label
                  }))}
                  value={formData.coinsuranceMethod}
                  onValueChange={(value) => handleFieldChange('coinsuranceMethod', value)}
                  placeholder="Select coinsurance method..."
                  searchPlaceholder="Search methods..."
                />
                {errors.coinsuranceMethod && (
                  <p className="text-sm text-red-500">{errors.coinsuranceMethod}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingPolicy ? 'Update Policy' : 'Create Policy'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
