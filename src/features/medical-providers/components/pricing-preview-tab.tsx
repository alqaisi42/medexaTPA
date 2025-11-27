'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calculator, Loader2, CheckCircle2, XCircle, Info, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// Badge component - using inline style instead
import { SearchableSelect } from '@/components/ui/searchable-select'
import { calculatePricing, fetchPriceLists, fetchPricingFactors } from '@/lib/api/pricing'
import { searchProcedures } from '@/lib/api/procedures'
import { fetchPointRates } from '@/lib/api/pricing'
import { PricingCalculationRequest, PricingCalculationResponse, InsuranceDegreeSummary, PriceListSummary, PricingFactor, PricingFactorDataType } from '@/types/pricing'
import { ProcedureSummary } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PricingPreviewTabProps {
    providerId?: number
    contractId?: number
}

export function PricingPreviewTab({ providerId, contractId }: PricingPreviewTabProps) {
    const [procedureSearchTerm, setProcedureSearchTerm] = useState('')
    const [procedures, setProcedures] = useState<ProcedureSummary[]>([])
    const [selectedProcedure, setSelectedProcedure] = useState<ProcedureSummary | null>(null)
    const [priceLists, setPriceLists] = useState<PriceListSummary[]>([])
    const [insuranceDegrees, setInsuranceDegrees] = useState<InsuranceDegreeSummary[]>([])
    const [pricingFactors, setPricingFactors] = useState<PricingFactor[]>([])
    const [loadingPriceLists, setLoadingPriceLists] = useState(false)
    const [loadingInsuranceDegrees, setLoadingInsuranceDegrees] = useState(false)
    const [loadingFactors, setLoadingFactors] = useState(false)
    
    const [formData, setFormData] = useState({
        procedureId: '',
        priceListId: '',
        insuranceDegreeId: '',
        date: new Date().toISOString().split('T')[0],
        factors: {} as Record<string, unknown>,
    })
    
    const [factorEntries, setFactorEntries] = useState<Array<{ 
        factorId: number | null
        factorKey: string
        value: string
        dataType: PricingFactorDataType
        allowedValues: string[] | null
    }>>([])
    const [calculationResult, setCalculationResult] = useState<PricingCalculationResponse | null>(null)
    const [calculating, setCalculating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load price lists
    useEffect(() => {
        const loadPriceLists = async () => {
            setLoadingPriceLists(true)
            try {
                const response = await fetchPriceLists({ page: 0, size: 100 })
                setPriceLists(response.content || [])
            } catch (err) {
                console.error('Failed to load price lists', err)
            } finally {
                setLoadingPriceLists(false)
            }
        }
        void loadPriceLists()
    }, [])

    // Load insurance degrees from point rates (they contain insurance degree info)
    useEffect(() => {
        const loadInsuranceDegrees = async () => {
            setLoadingInsuranceDegrees(true)
            try {
                const response = await fetchPointRates({ page: 0, size: 1000 })
                const degreesMap = new Map<number, InsuranceDegreeSummary>()
                response.content?.forEach((rate) => {
                    if (rate.insuranceDegree) {
                        degreesMap.set(rate.insuranceDegree.id, rate.insuranceDegree)
                    }
                })
                setInsuranceDegrees(Array.from(degreesMap.values()))
            } catch (err) {
                console.error('Failed to load insurance degrees', err)
            } finally {
                setLoadingInsuranceDegrees(false)
            }
        }
        void loadInsuranceDegrees()
    }, [])

    // Load pricing factors
    useEffect(() => {
        const loadFactors = async () => {
            setLoadingFactors(true)
            try {
                const response = await fetchPricingFactors({ page: 0, size: 200 })
                setPricingFactors(response.content || [])
            } catch (err) {
                console.error('Failed to load pricing factors', err)
            } finally {
                setLoadingFactors(false)
            }
        }
        void loadFactors()
    }, [])

    // Search procedures
    useEffect(() => {
        if (!procedureSearchTerm.trim() || procedureSearchTerm.length < 2) {
            setProcedures([])
            return
        }

        const searchTimeout = setTimeout(async () => {
            try {
                const response = await searchProcedures({
                    filters: { keyword: procedureSearchTerm },
                    page: 0,
                    size: 50,
                })
                setProcedures(response.content || [])
            } catch (err) {
                console.error('Failed to search procedures', err)
                setProcedures([])
            }
        }, 300)

        return () => clearTimeout(searchTimeout)
    }, [procedureSearchTerm])

    const handleCalculate = async () => {
        if (!formData.procedureId || !formData.priceListId || !formData.insuranceDegreeId || !formData.date) {
            setError('Procedure, Price List, Insurance Degree, and Date are required')
            return
        }

        setCalculating(true)
        setError(null)
        setCalculationResult(null)

        try {
            const factors: Record<string, unknown> = {}
            factorEntries.forEach((entry) => {
                if (entry.factorKey && entry.value) {
                    let processedValue: unknown = entry.value
                    
                    // Process value based on data type
                    if (entry.dataType === 'NUMBER' || entry.dataType === 'INTEGER' || entry.dataType === 'DECIMAL') {
                        const numValue = Number(entry.value)
                        processedValue = isNaN(numValue) ? entry.value : numValue
                    } else if (entry.dataType === 'BOOLEAN') {
                        processedValue = entry.value === 'true' || entry.value === '1' || entry.value.toLowerCase() === 'yes'
                    } else if (entry.dataType === 'DATE') {
                        processedValue = entry.value // Keep as string for date
                    }
                    
                    factors[entry.factorKey] = processedValue
                }
            })

            const payload: PricingCalculationRequest = {
                procedureId: Number(formData.procedureId),
                priceListId: Number(formData.priceListId),
                insuranceDegreeId: Number(formData.insuranceDegreeId),
                date: formData.date,
                factors,
            }

            const result = await calculatePricing(payload)
            setCalculationResult(result)
            setError(null)
        } catch (calcError) {
            console.error(calcError)
            let errorMessage = 'Unable to calculate pricing'
            
            if (calcError instanceof Error) {
                // Clean the error message - remove any JSON artifacts
                let cleanMessage = calcError.message
                
                // Remove JSON-like strings that might have leaked through
                cleanMessage = cleanMessage.replace(/\{[\s\S]*"message"[\s\S]*\}/g, '')
                cleanMessage = cleanMessage.replace(/^[\s\S]*"message"\s*:\s*"([^"]+)"[\s\S]*$/, '$1')
                cleanMessage = cleanMessage.trim()
                
                // If message looks like raw JSON, use fallback
                if (cleanMessage.startsWith('{') || cleanMessage.startsWith('[')) {
                    cleanMessage = 'Unable to calculate pricing'
                }
                
                errorMessage = cleanMessage || 'Unable to calculate pricing'
                
                // Provide helpful guidance for common errors
                if (errorMessage.includes('No pricing rule found') || errorMessage.includes('pricing rule')) {
                    errorMessage = 'No pricing rule found for the selected procedure, price list, and insurance degree combination. Please ensure pricing rules are configured for this combination.'
                } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                    errorMessage = 'One or more of the selected items (procedure, price list, or insurance degree) was not found. Please verify your selections.'
                } else if (errorMessage.includes('400') || errorMessage.includes('invalid')) {
                    errorMessage = 'Invalid input parameters. Please check all required fields are filled correctly.'
                } else if (errorMessage.length > 200) {
                    // If message is too long (might be JSON), use fallback
                    errorMessage = 'Unable to calculate pricing. Please verify all inputs are correct.'
                }
            }
            
            setError(errorMessage)
            setCalculationResult(null)
        } finally {
            setCalculating(false)
        }
    }

    const addFactorEntry = () => {
        setFactorEntries([...factorEntries, { 
            factorId: null,
            factorKey: '',
            value: '',
            dataType: 'TEXT' as PricingFactorDataType,
            allowedValues: null,
        }])
    }

    const removeFactorEntry = (index: number) => {
        setFactorEntries(factorEntries.filter((_, i) => i !== index))
    }

    const updateFactorEntry = (index: number, factorId: number | null) => {
        const updated = [...factorEntries]
        if (factorId) {
            const factor = pricingFactors.find(f => f.id === factorId)
            if (factor) {
                // Parse allowed values - handle comma-separated strings
                let allowedValues: string[] | null = null
                if (factor.allowedValues) {
                    try {
                        // Try parsing as JSON array first
                        const parsed = JSON.parse(factor.allowedValues)
                        if (Array.isArray(parsed)) {
                            allowedValues = parsed.map(v => String(v).trim()).filter(Boolean)
                        } else {
                            // If not JSON array, treat as comma-separated string
                            allowedValues = factor.allowedValues.split(',').map(v => v.trim()).filter(Boolean)
                        }
                    } catch {
                        // If JSON parse fails, treat as comma-separated string
                        allowedValues = factor.allowedValues.split(',').map(v => v.trim()).filter(Boolean)
                    }
                    
                    // If no valid values after parsing, set to null
                    if (allowedValues.length === 0) {
                        allowedValues = null
                    }
                }
                
                updated[index] = {
                    factorId: factor.id,
                    factorKey: factor.key,
                    value: '',
                    dataType: factor.dataType,
                    allowedValues,
                }
            }
        } else {
            updated[index] = {
                factorId: null,
                factorKey: '',
                value: '',
                dataType: 'TEXT' as PricingFactorDataType,
                allowedValues: null,
            }
        }
        setFactorEntries(updated)
    }

    const updateFactorValue = (index: number, value: string) => {
        const updated = [...factorEntries]
        updated[index] = { ...updated[index], value }
        setFactorEntries(updated)
    }

    const getValueInputType = (dataType: PricingFactorDataType): string => {
        switch (dataType) {
            case 'NUMBER':
            case 'INTEGER':
            case 'DECIMAL':
                return 'number'
            case 'DATE':
                return 'date'
            default:
                return 'text'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-tpa-primary/10 p-3 text-tpa-primary">
                    <Calculator className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">Pricing Engine Preview</h2>
                    <p className="text-sm text-gray-600">Calculate and preview pricing for procedures</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Input Parameters</CardTitle>
                        <CardDescription>Enter the required information to calculate pricing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Procedure Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="procedure">Procedure *</Label>
                            <div className="space-y-2">
                                <Input
                                    placeholder="Search procedures by code or name..."
                                    value={procedureSearchTerm}
                                    onChange={(e) => setProcedureSearchTerm(e.target.value)}
                                    disabled={calculating}
                                />
                                {procedureSearchTerm && procedures.length > 0 && (
                                    <div className="border rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg z-10">
                                        {procedures.slice(0, 20).map((proc) => {
                                            const categoryNames = proc.categories?.map(cat => cat.nameEn).filter(Boolean).join(', ') || 'No Category'
                                            return (
                                                <div
                                                    key={proc.id}
                                                    className={cn(
                                                        'p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0',
                                                        formData.procedureId === String(proc.id) && 'bg-blue-50',
                                                    )}
                                                    onClick={() => {
                                                        setFormData({ ...formData, procedureId: String(proc.id) })
                                                        setSelectedProcedure(proc)
                                                        setProcedureSearchTerm(proc.nameEn)
                                                    }}
                                                >
                                                    <div className="font-medium">{proc.nameEn}</div>
                                                    {proc.nameAr && (
                                                        <div className="text-xs text-gray-600 mt-0.5" dir="rtl">{proc.nameAr}</div>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs font-mono text-gray-500">{proc.code}</span>
                                                        {proc.systemCode && (
                                                            <>
                                                                <span className="text-xs text-gray-400">•</span>
                                                                <span className="text-xs text-gray-500">{proc.systemCode}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="mt-1.5">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                                            {categoryNames}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                            {selectedProcedure && (
                                <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                                    Selected: {selectedProcedure.nameEn} ({selectedProcedure.code})
                                </div>
                            )}
                        </div>

                        {/* Price List */}
                        <div className="space-y-2">
                            <Label htmlFor="priceListId">Price List *</Label>
                            {loadingPriceLists ? (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading price lists...
                                </div>
                            ) : (
                                <Select
                                    value={formData.priceListId}
                                    onValueChange={(value) => setFormData({ ...formData, priceListId: value })}
                                    disabled={calculating}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select price list" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priceLists.map((list) => (
                                            <SelectItem key={list.id} value={String(list.id)}>
                                                {list.nameEn} ({list.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Insurance Degree */}
                        <div className="space-y-2">
                            <Label htmlFor="insuranceDegreeId">Insurance Degree *</Label>
                            {loadingInsuranceDegrees ? (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading insurance degrees...
                                </div>
                            ) : (
                                <Select
                                    value={formData.insuranceDegreeId}
                                    onValueChange={(value) => setFormData({ ...formData, insuranceDegreeId: value })}
                                    disabled={calculating}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select insurance degree" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {insuranceDegrees.map((degree) => (
                                            <SelectItem key={degree.id} value={String(degree.id)}>
                                                {degree.nameEn} ({degree.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <Label htmlFor="date">Date *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                disabled={calculating}
                            />
                        </div>

                        {/* Member Details / Factors */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Member Details (Factors)</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addFactorEntry}
                                    disabled={calculating || loadingFactors}
                                >
                                    Add Factor
                                </Button>
                            </div>
                            {loadingFactors ? (
                                <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading pricing factors...
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {factorEntries.map((entry, index) => {
                                        const selectedFactor = entry.factorId 
                                            ? pricingFactors.find(f => f.id === entry.factorId)
                                            : null
                                        
                                        return (
                                            <div key={index} className="border rounded-lg p-3 bg-gray-50 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1">
                                                        <Label className="text-xs text-gray-600 mb-1 block">Factor</Label>
                                                        <SearchableSelect
                                                            options={pricingFactors.map((factor) => ({
                                                                id: factor.id,
                                                                label: factor.nameEn,
                                                                subLabel: `${factor.key} (${factor.dataType})`,
                                                            }))}
                                                            value={entry.factorId || undefined}
                                                            onValueChange={(value) => {
                                                                updateFactorEntry(index, value ? Number(value) : null)
                                                            }}
                                                            placeholder="Select a factor..."
                                                            searchPlaceholder="Search factors..."
                                                            emptyMessage="No factors found"
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFactorEntry(index)}
                                                        disabled={calculating}
                                                        className="mt-6"
                                                    >
                                                        ×
                                                    </Button>
                                                </div>
                                                {entry.factorKey && (
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-gray-600">
                                                            Value {selectedFactor && `(${selectedFactor.dataType})`}
                                                        </Label>
                                                        {/* Show dropdown if factor has allowed values (for SELECT, STRING with options, etc.) */}
                                                        {entry.allowedValues && entry.allowedValues.length > 0 ? (
                                                            <Select
                                                                value={entry.value}
                                                                onValueChange={(value) => updateFactorValue(index, value)}
                                                                disabled={calculating}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select value" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {entry.allowedValues.map((val) => (
                                                                        <SelectItem key={val} value={val}>
                                                                            {val}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : entry.dataType === 'BOOLEAN' ? (
                                                            <Select
                                                                value={entry.value}
                                                                onValueChange={(value) => updateFactorValue(index, value)}
                                                                disabled={calculating}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select true/false" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="true">True</SelectItem>
                                                                    <SelectItem value="false">False</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        ) : entry.dataType === 'SELECT' ? (
                                                            <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                                                                This factor requires allowed values to be configured. Please select a different factor or configure allowed values for this factor.
                                                            </div>
                                                        ) : (
                                                            <Input
                                                                type={getValueInputType(entry.dataType)}
                                                                placeholder={
                                                                    entry.dataType === 'STRING' || entry.dataType === 'TEXT'
                                                                        ? 'Enter text value'
                                                                        : entry.dataType === 'DATE'
                                                                        ? 'Select date'
                                                                        : `Enter ${entry.dataType.toLowerCase()} value`
                                                                }
                                                                value={entry.value}
                                                                onChange={(e) => updateFactorValue(index, e.target.value)}
                                                                disabled={calculating}
                                                            />
                                                        )}
                                                        {selectedFactor?.nameAr && (
                                                            <div className="text-xs text-gray-500 mt-1" dir="rtl">
                                                                {selectedFactor.nameAr}
                                                            </div>
                                                        )}
                                                        {entry.allowedValues && entry.allowedValues.length > 0 && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {entry.allowedValues.length} option{entry.allowedValues.length !== 1 ? 's' : ''} available
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                    {factorEntries.length === 0 && (
                                        <div className="text-sm text-gray-500 italic text-center py-4 border border-dashed rounded-lg">
                                            No factors added (optional)
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="font-semibold text-red-900 mb-1">Calculation Error</div>
                                        <div className="text-sm text-red-700">{error}</div>
                                        {error.includes('No pricing rule found') && (
                                            <div className="mt-3 text-xs text-red-600 bg-red-100 p-2 rounded">
                                                <strong>Tip:</strong> Pricing rules need to be configured in the Procedures Price Lists section before you can calculate pricing for a procedure.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleCalculate}
                            disabled={calculating || !formData.procedureId || !formData.priceListId || !formData.insuranceDegreeId}
                            className="w-full bg-tpa-primary hover:bg-tpa-accent"
                        >
                            {calculating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Calculating...
                                </>
                            ) : (
                                <>
                                    <Calculator className="h-4 w-4 mr-2" />
                                    Calculate Pricing
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Results Display */}
                <Card>
                    <CardHeader>
                        <CardTitle>Calculation Results</CardTitle>
                        <CardDescription>Pricing engine calculation output</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!calculationResult ? (
                            <div className="text-center py-12 text-gray-500">
                                <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p>Enter parameters and click "Calculate Pricing" to see results</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Final Price */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">Final Price</div>
                                            <div className="text-3xl font-bold text-blue-700 mt-1">
                                                {formatCurrency(calculationResult.finalPrice)}
                                            </div>
                                        </div>
                                        {calculationResult.covered ? (
                                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                                        ) : (
                                            <XCircle className="h-10 w-10 text-red-600" />
                                        )}
                                    </div>
                                </div>

                                {/* Coverage Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={cn(
                                        "p-3 rounded-lg border",
                                        calculationResult.covered ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                                    )}>
                                        <div className="text-sm font-medium text-gray-600">Covered</div>
                                        <div className={cn(
                                            "text-lg font-semibold mt-1",
                                            calculationResult.covered ? "text-green-700" : "text-red-700"
                                        )}>
                                            {calculationResult.covered ? 'Yes' : 'No'}
                                        </div>
                                        {calculationResult.coverageReason && (
                                            <div className="text-xs text-gray-600 mt-1">{calculationResult.coverageReason}</div>
                                        )}
                                    </div>
                                    <div className={cn(
                                        "p-3 rounded-lg border",
                                        calculationResult.requiresPreapproval ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"
                                    )}>
                                        <div className="text-sm font-medium text-gray-600">Pre-approval</div>
                                        <div className={cn(
                                            "text-lg font-semibold mt-1",
                                            calculationResult.requiresPreapproval ? "text-yellow-700" : "text-gray-700"
                                        )}>
                                            {calculationResult.requiresPreapproval ? 'Required' : 'Not Required'}
                                        </div>
                                        {calculationResult.preapprovalReason && (
                                            <div className="text-xs text-gray-600 mt-1">{calculationResult.preapprovalReason}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Selected Rule */}
                                {calculationResult.selectedRule && (
                                    <div className="border rounded-lg p-4 bg-gray-50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Info className="h-4 w-4 text-blue-600" />
                                            <div className="font-semibold">Selected Rule</div>
                                            {calculationResult.selectedRuleId && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
                                                    ID: {calculationResult.selectedRuleId}
                                                </span>
                                            )}
                                        </div>
                                        {calculationResult.selectionReason && (
                                            <div className="text-sm text-gray-600 mb-2">{calculationResult.selectionReason}</div>
                                        )}
                                        <div className="text-sm space-y-1">
                                            {calculationResult.selectedRule.conditions?.map((cond, idx) => (
                                                <div key={idx} className="text-gray-600">
                                                    {cond.factor}: {String(cond.value)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Contract Override */}
                                {calculationResult.overridePriceListId && (
                                    <div className="border border-yellow-300 rounded-lg p-4 bg-yellow-50">
                                        <div className="flex items-center gap-2 mb-1">
                                            <AlertCircle className="h-4 w-4 text-yellow-700" />
                                            <div className="font-semibold text-yellow-900">Contract Override</div>
                                        </div>
                                        <div className="text-sm text-yellow-800">
                                            Using price list ID: {calculationResult.overridePriceListId}
                                        </div>
                                    </div>
                                )}

                                {/* Adjustments */}
                                {calculationResult.adjustmentsApplied && calculationResult.adjustmentsApplied.length > 0 && (
                                    <div className="border rounded-lg p-4">
                                        <div className="font-semibold mb-2">Adjustments Applied</div>
                                        <div className="space-y-2">
                                            {calculationResult.adjustmentsApplied.map((adj, idx) => (
                                                <div key={idx} className="text-sm bg-blue-50 p-2 rounded">
                                                    <div className="font-medium">{adj.type} - {adj.factorKey}</div>
                                                    <div className="text-gray-600">Case: {adj.caseMatched}</div>
                                                    <div className="text-blue-700 font-semibold">
                                                        Amount: {formatCurrency(adj.amount)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Discounts */}
                                {calculationResult.discountApplied && (
                                    <div className="border rounded-lg p-4 bg-green-50">
                                        <div className="font-semibold mb-2 text-green-900">Discount Applied</div>
                                        <div className="text-sm space-y-1">
                                            <div>Percentage: {calculationResult.discountApplied.pct}%</div>
                                            <div>Period: {calculationResult.discountApplied.period} {calculationResult.discountApplied.unit}</div>
                                            <div className="text-green-700 font-semibold">
                                                Discount ID: {calculationResult.discountApplied.discountId}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Deductible */}
                                {calculationResult.deductibleApplied !== null && calculationResult.deductibleApplied > 0 && (
                                    <div className="border rounded-lg p-4 bg-orange-50">
                                        <div className="font-semibold mb-1 text-orange-900">Deductible Applied</div>
                                        <div className="text-lg font-bold text-orange-700">
                                            {formatCurrency(calculationResult.deductibleApplied)}
                                        </div>
                                    </div>
                                )}

                                {/* Point Rate Used */}
                                {calculationResult.pointRateUsed && (
                                    <div className="border rounded-lg p-4 bg-purple-50">
                                        <div className="font-semibold mb-2 text-purple-900">Point Rate Used</div>
                                        <div className="text-sm space-y-1">
                                            <div>Point Price: {formatCurrency(calculationResult.pointRateUsed.pointPrice)}</div>
                                            {calculationResult.pointRateUsed.insuranceDegree && (
                                                <div>Insurance Degree: {calculationResult.pointRateUsed.insuranceDegree.nameEn}</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

