'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { 
  LimitCombination, 
  LimitCombinationPayload, 
  AmountLimit, 
  CountLimit, 
  FrequencyLimit, 
  CoInsurance,
  LimitScope,
  NetworkScope,
  LimitPeriod,
  FrequencyUnit,
  FrequencyAppliesTo,
  CashScope,
  InsuranceDegree
} from '@/types/contract-limits'

interface LimitCombinationFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId: number
  combination?: LimitCombination | null
  isEditing: boolean
  onSuccess: () => void
}

const initialFormData: LimitCombinationPayload = {
  regionId: null,
  subscriberTypeId: null,
  subscriberId: null,
  claimTypeId: null,
  serviceTypeId: null,
  mpTypeId: null,
  networkId: null,
  insuranceDegree: null,
  coverageType: null,
  icdBasketId: null,
  icdId: null,
  hcpcsBasketId: null,
  procedureId: null,
  drugBasketId: null,
  drugId: null,
  doctorSpecialtyId: null,
  description: null,
  priority: 1,
  amounts: [],
  counts: [],
  frequencies: [],
  coInsurances: []
}

export function LimitCombinationFormDrawer({
  open,
  onOpenChange,
  contractId,
  combination,
  isEditing,
  onSuccess
}: LimitCombinationFormDrawerProps) {
  const [formData, setFormData] = useState<LimitCombinationPayload>(initialFormData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (isEditing && combination) {
        setFormData({
          regionId: combination.regionId,
          subscriberTypeId: combination.subscriberTypeId,
          subscriberId: combination.subscriberId,
          claimTypeId: combination.claimTypeId,
          serviceTypeId: combination.serviceTypeId,
          mpTypeId: combination.mpTypeId,
          networkId: combination.networkId,
          insuranceDegree: combination.insuranceDegree,
          coverageType: combination.coverageType,
          icdBasketId: combination.icdBasketId,
          icdId: combination.icdId,
          hcpcsBasketId: combination.hcpcsBasketId,
          procedureId: combination.procedureId,
          drugBasketId: combination.drugBasketId,
          drugId: combination.drugId,
          doctorSpecialtyId: combination.doctorSpecialtyId,
          description: combination.description,
          priority: combination.priority,
          amounts: combination.amounts || [],
          counts: combination.counts || [],
          frequencies: combination.frequencies || [],
          coInsurances: combination.coInsurances || []
        })
      } else {
        setFormData(initialFormData)
      }
      setError(null)
    }
  }, [open, isEditing, combination])

  const handleSave = async () => {
    if (!formData.description?.trim()) {
      setError('Description is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const url = isEditing && combination
        ? `/api/contracts/${contractId}/limits/combinations/${combination.id}`
        : `/api/contracts/${contractId}/limits/combinations`

      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save combination')
      }

      onSuccess()
    } catch (err) {
      console.error('Failed to save combination', err)
      setError(err instanceof Error ? err.message : 'Unable to save combination')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      onOpenChange(false)
    }
  }

  // Amount Limits handlers
  const addAmountLimit = () => {
    setFormData(prev => ({
      ...prev,
      amounts: [
        ...(prev.amounts || []),
        {
          scope: LimitScope.INDIVIDUAL_CONTRACT,
          networkScope: NetworkScope.IN,
          amount: 0,
          limitPeriod: LimitPeriod.PER_YEAR
        }
      ]
    }))
  }

  const updateAmountLimit = (index: number, field: keyof AmountLimit, value: any) => {
    setFormData(prev => ({
      ...prev,
      amounts: prev.amounts?.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ) || []
    }))
  }

  const removeAmountLimit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amounts: prev.amounts?.filter((_, i) => i !== index) || []
    }))
  }

  // Count Limits handlers
  const addCountLimit = () => {
    setFormData(prev => ({
      ...prev,
      counts: [
        ...(prev.counts || []),
        {
          scope: LimitScope.INDIVIDUAL_VISIT,
          networkScope: NetworkScope.IN,
          countLimit: 1,
          limitPeriod: LimitPeriod.PER_YEAR
        }
      ]
    }))
  }

  const updateCountLimit = (index: number, field: keyof CountLimit, value: any) => {
    setFormData(prev => ({
      ...prev,
      counts: prev.counts?.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ) || []
    }))
  }

  const removeCountLimit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      counts: prev.counts?.filter((_, i) => i !== index) || []
    }))
  }

  // Frequency Limits handlers
  const addFrequencyLimit = () => {
    setFormData(prev => ({
      ...prev,
      frequencies: [
        ...(prev.frequencies || []),
        {
          freqValue: 1,
          freqUnit: FrequencyUnit.DAY,
          freqOver: null,
          appliesTo: FrequencyAppliesTo.VISIT
        }
      ]
    }))
  }

  const updateFrequencyLimit = (index: number, field: keyof FrequencyLimit, value: any) => {
    setFormData(prev => ({
      ...prev,
      frequencies: prev.frequencies?.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ) || []
    }))
  }

  const removeFrequencyLimit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      frequencies: prev.frequencies?.filter((_, i) => i !== index) || []
    }))
  }

  // Co-Insurance handlers
  const addCoInsurance = () => {
    setFormData(prev => ({
      ...prev,
      coInsurances: [
        ...(prev.coInsurances || []),
        {
          networkScope: NetworkScope.IN,
          cashScope: CashScope.CASH,
          deductible: 0,
          copayPercent: 0,
          maxCopayVisit: null,
          maxCopayClaim: null,
          deductibleCopayMin: null,
          deductibleCopayMax: null
        }
      ]
    }))
  }

  const updateCoInsurance = (index: number, field: keyof CoInsurance, value: any) => {
    setFormData(prev => ({
      ...prev,
      coInsurances: prev.coInsurances?.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ) || []
    }))
  }

  const removeCoInsurance = (index: number) => {
    setFormData(prev => ({
      ...prev,
      coInsurances: prev.coInsurances?.filter((_, i) => i !== index) || []
    }))
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? 'Edit Limit Combination' : 'Add New Limit Combination'}
          </SheetTitle>
          <SheetDescription>
            Configure the combination criteria and associated limits
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this combination..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select
                    value={formData.regionId?.toString() || ''}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      regionId: value ? Number(value) : null 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {/* TODO: Load regions from API */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subscriber Type</Label>
                  <Select
                    value={formData.subscriberTypeId?.toString() || ''}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      subscriberTypeId: value ? Number(value) : null 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {/* TODO: Load subscriber types from API */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Insurance Degree</Label>
                  <Select
                    value={formData.insuranceDegree || ''}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      insuranceDegree: value || null 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select degree..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value={InsuranceDegree.FIRST}>First</SelectItem>
                      <SelectItem value={InsuranceDegree.SECOND}>Second</SelectItem>
                      <SelectItem value={InsuranceDegree.THIRD}>Third</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limits Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Limits Configuration</CardTitle>
              <CardDescription>
                Configure amount, count, frequency, and co-insurance limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="amounts" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="amounts">
                    Amount Limits
                    {formData.amounts && formData.amounts.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {formData.amounts.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="counts">
                    Count Limits
                    {formData.counts && formData.counts.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {formData.counts.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="frequencies">
                    Frequency
                    {formData.frequencies && formData.frequencies.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {formData.frequencies.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="coinsurance">
                    Co-Insurance
                    {formData.coInsurances && formData.coInsurances.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {formData.coInsurances.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="amounts" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Amount Limits</h4>
                    <Button size="sm" onClick={addAmountLimit}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Amount Limit
                    </Button>
                  </div>
                  {formData.amounts?.map((amount, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                          <Label>Scope</Label>
                          <Select
                            value={amount.scope}
                            onValueChange={(value) => updateAmountLimit(index, 'scope', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(LimitScope).map(scope => (
                                <SelectItem key={scope} value={scope}>{scope}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Network</Label>
                          <Select
                            value={amount.networkScope}
                            onValueChange={(value) => updateAmountLimit(index, 'networkScope', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(NetworkScope).map(scope => (
                                <SelectItem key={scope} value={scope}>{scope}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Amount</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={amount.amount}
                            onChange={(e) => updateAmountLimit(index, 'amount', Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Period</Label>
                          <div className="flex items-center gap-2">
                            <Select
                              value={amount.limitPeriod}
                              onValueChange={(value) => updateAmountLimit(index, 'limitPeriod', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(LimitPeriod).map(period => (
                                  <SelectItem key={period} value={period}>{period}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAmountLimit(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="counts" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Count Limits</h4>
                    <Button size="sm" onClick={addCountLimit}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Count Limit
                    </Button>
                  </div>
                  {formData.counts?.map((count, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                          <Label>Scope</Label>
                          <Select
                            value={count.scope}
                            onValueChange={(value) => updateCountLimit(index, 'scope', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(LimitScope).map(scope => (
                                <SelectItem key={scope} value={scope}>{scope}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Network</Label>
                          <Select
                            value={count.networkScope}
                            onValueChange={(value) => updateCountLimit(index, 'networkScope', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(NetworkScope).map(scope => (
                                <SelectItem key={scope} value={scope}>{scope}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Count</Label>
                          <Input
                            type="number"
                            min="1"
                            value={count.countLimit}
                            onChange={(e) => updateCountLimit(index, 'countLimit', Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Period</Label>
                          <div className="flex items-center gap-2">
                            <Select
                              value={count.limitPeriod}
                              onValueChange={(value) => updateCountLimit(index, 'limitPeriod', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(LimitPeriod).map(period => (
                                  <SelectItem key={period} value={period}>{period}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCountLimit(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="frequencies" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Frequency Limits</h4>
                    <Button size="sm" onClick={addFrequencyLimit}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Frequency Limit
                    </Button>
                  </div>
                  {formData.frequencies?.map((freq, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                          <Label>Value</Label>
                          <Input
                            type="number"
                            min="1"
                            value={freq.freqValue}
                            onChange={(e) => updateFrequencyLimit(index, 'freqValue', Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unit</Label>
                          <Select
                            value={freq.freqUnit}
                            onValueChange={(value) => updateFrequencyLimit(index, 'freqUnit', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(FrequencyUnit).map(unit => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Applies To</Label>
                          <Select
                            value={freq.appliesTo}
                            onValueChange={(value) => updateFrequencyLimit(index, 'appliesTo', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(FrequencyAppliesTo).map(applies => (
                                <SelectItem key={applies} value={applies}>{applies}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Actions</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFrequencyLimit(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="coinsurance" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Co-Insurance Rules</h4>
                    <Button size="sm" onClick={addCoInsurance}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Co-Insurance
                    </Button>
                  </div>
                  {formData.coInsurances?.map((coIns, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Network Scope</Label>
                          <Select
                            value={coIns.networkScope}
                            onValueChange={(value) => updateCoInsurance(index, 'networkScope', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(NetworkScope).map(scope => (
                                <SelectItem key={scope} value={scope}>{scope}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Cash Scope</Label>
                          <Select
                            value={coIns.cashScope}
                            onValueChange={(value) => updateCoInsurance(index, 'cashScope', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(CashScope).map(scope => (
                                <SelectItem key={scope} value={scope}>{scope}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Deductible</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={coIns.deductible}
                            onChange={(e) => updateCoInsurance(index, 'deductible', Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Copay %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={coIns.copayPercent}
                            onChange={(e) => updateCoInsurance(index, 'copayPercent', Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Copay (Visit)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={coIns.maxCopayVisit || ''}
                            onChange={(e) => updateCoInsurance(index, 'maxCopayVisit', e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Actions</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCoInsurance(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              isEditing ? 'Update Combination' : 'Create Combination'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
