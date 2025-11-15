'use client'

import React, { DragEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import {
    BadgeCheck,
    CircleDot,
    Info,
    Loader2,
    Plus,
    RefreshCcw,
    Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    calculatePricing,
    createPeriodDiscount,
    createPointRate,
    createPricingFactor,
    createPricingRule,
    fetchPeriodDiscounts,
    fetchPointRates,
    fetchPricingFactors,
    fetchPricingRules,
    updatePointRate,
} from '@/lib/api/pricing'
import {
    CreatePeriodDiscountPayload,
    CreatePointRatePayload,
    CreatePricingRulePayload,
    PaginatedResponse,
    PeriodDiscountRecord,
    PointRateRecord,
    PricingCalculationRequest,
    PricingCalculationResponse,
    PricingFactor,
    PricingMode,
    PricingRuleCondition,
    PricingRuleResponse,
} from '@/types'
import { cn, formatCurrency, formatDate, generateId } from '@/lib/utils'

type FactorInputKind = 'text' | 'number' | 'select' | 'date' | 'boolean'

interface ConditionDraft {
    id: string
    factorKey: string
    operator: string
    value: string | number | boolean | string[] | { min?: string; max?: string }
}

interface AdjustmentCaseDraft {
    id: string
    caseValue: string
    amount: string
}

interface AdjustmentDraft {
    id: string
    type: string
    factorKey: string
    percent: string
    cases: AdjustmentCaseDraft[]
}

interface FactorEntryDraft {
    id: string
    factorKey: string
    value: string | number | boolean | string[]
}

interface ContextEntryDraft {
    id: string
    key: string
    value: string
}

function parseAllowedValues(factor: PricingFactor): string[] {
    if (!factor.allowedValues) {
        return []
    }

    try {
        const parsed = JSON.parse(factor.allowedValues)
        if (Array.isArray(parsed)) {
            return parsed.map(value => String(value))
        }
    } catch {
        // Fall back to comma separated parsing
    }

    return factor.allowedValues
        .split(',')
        .map(value => value.trim())
        .filter(Boolean)
}

function resolveFactorInputKind(factor: PricingFactor, operator?: string): FactorInputKind {
    const allowedValues = parseAllowedValues(factor)

    if (factor.dataType === 'BOOLEAN') {
        return 'boolean'
    }

    if (factor.dataType === 'DATE') {
        return 'date'
    }

    if (allowedValues.length > 0 && operator !== 'BETWEEN') {
        return 'select'
    }

    if (factor.dataType === 'NUMBER' || factor.dataType === 'DECIMAL' || factor.dataType === 'INTEGER') {
        return 'number'
    }

    if (factor.dataType === 'TEXT') {
        return 'text'
    }

    if (factor.dataType === 'STRING') {
        return allowedValues.length > 0 ? 'select' : 'text'
    }

    if (factor.dataType === 'SELECT') {
        return 'select'
    }

    return 'text'
}

type OperatorOption = {
    value: string
    label: string
    requiresRange?: boolean
    supportsMultiple?: boolean
}

function operatorOptionsForFactor(factor: PricingFactor): OperatorOption[] {
    const inputKind = resolveFactorInputKind(factor)

    if (inputKind === 'number') {
        return [
            { value: 'EQUALS', label: 'Equals' },
            { value: 'NOT_EQUALS', label: 'Not equals' },
            { value: 'GREATER_THAN', label: 'Greater than' },
            { value: 'LESS_THAN', label: 'Less than' },
            { value: 'BETWEEN', label: 'Between', requiresRange: true },
        ]
    }

    if (inputKind === 'date') {
        return [
            { value: 'ON', label: 'On' },
            { value: 'BEFORE', label: 'Before' },
            { value: 'AFTER', label: 'After' },
            { value: 'BETWEEN', label: 'Between', requiresRange: true },
        ]
    }

    if (inputKind === 'boolean') {
        return [
            { value: 'IS_TRUE', label: 'Is true' },
            { value: 'IS_FALSE', label: 'Is false' },
        ]
    }

    if (inputKind === 'select') {
        return [
            { value: 'EQUALS', label: 'Equals' },
            { value: 'NOT_EQUALS', label: 'Not equals' },
            { value: 'IN', label: 'In list', supportsMultiple: true },
            { value: 'NOT_IN', label: 'Not in list', supportsMultiple: true },
        ]
    }

    return [
        { value: 'EQUALS', label: 'Equals' },
        { value: 'NOT_EQUALS', label: 'Not equals' },
        { value: 'CONTAINS', label: 'Contains' },
        { value: 'STARTS_WITH', label: 'Starts with' },
        { value: 'ENDS_WITH', label: 'Ends with' },
    ]
}

function defaultOperatorForFactor(factor: PricingFactor): string {
    const options = operatorOptionsForFactor(factor)
    return options[0]?.value ?? 'EQUALS'
}

function parseRuleJson(rule: PricingRuleResponse): Record<string, unknown> | null {
    if (!rule.ruleJson) {
        return null
    }

    try {
        return JSON.parse(rule.ruleJson)
    } catch {
        return null
    }
}

function extractRuleConditions(ruleJson: Record<string, unknown> | null): string[] {
    if (!ruleJson) {
        return []
    }

    const conditions = ruleJson.conditions
    if (!conditions || typeof conditions !== 'object') {
        return []
    }

    return Object.entries(conditions as Record<string, unknown>).map(([factor, value]) => {
        if (typeof value === 'object' && value !== null) {
            if ('between' in (value as Record<string, unknown>)) {
                const between = (value as Record<string, unknown>).between as unknown[]
                return `${factor} between ${between?.[0]} and ${between?.[1]}`
            }
            if ('min' in (value as Record<string, unknown>) || 'max' in (value as Record<string, unknown>)) {
                const min = (value as Record<string, unknown>).min
                const max = (value as Record<string, unknown>).max
                return `${factor} ${min !== undefined ? `>= ${min}` : ''} ${max !== undefined ? `<= ${max}` : ''}`.trim()
            }
            if ('in' in (value as Record<string, unknown>)) {
                const list = (value as Record<string, unknown>).in as unknown[]
                return `${factor} in [${list?.join(', ')}]`
            }
        }

        return `${factor} = ${String(value)}`
    })
}

function formatRulePricing(ruleJson: Record<string, unknown> | null): string {
    if (!ruleJson) {
        return '—'
    }

    const basePrice = ruleJson.base_price as Record<string, unknown> | undefined
    if (!basePrice) {
        return '—'
    }

    const mode = String(basePrice.mode ?? '').toUpperCase()
    if (mode === 'FIXED') {
        return `Fixed ${basePrice.value}`
    }
    if (mode === 'POINTS') {
        return `Points × ${basePrice.points}`
    }
    if (mode === 'RANGE') {
        return `Range ${basePrice.min ?? '—'} - ${basePrice.max ?? '—'}`
    }

    return mode || '—'
}

function formatConditionValueDisplay(condition: ConditionDraft, factor?: PricingFactor): string {
    const { value } = condition

    if (typeof value === 'boolean') {
        return value ? 'True' : 'False'
    }

    if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : '—'
    }

    if (value && typeof value === 'object') {
        const range = value as { min?: string; max?: string }
        if (range.min && range.max) {
            return `${range.min} → ${range.max}`
        }
        if (range.min) {
            return `≥ ${range.min}`
        }
        if (range.max) {
            return `≤ ${range.max}`
        }
        return JSON.stringify(value)
    }

    if (value === undefined || value === null || value === '') {
        return '—'
    }

    if (factor?.dataType === 'DATE') {
        try {
            return formatDate(String(value))
        } catch {
            return String(value)
        }
    }

    return String(value)
}

function parseContextJson(contextJson?: string | null): ContextEntryDraft[] {
    if (!contextJson) {
        return []
    }

    try {
        const parsed = JSON.parse(contextJson) as Record<string, unknown>
        return Object.entries(parsed).map(([key, value]) => ({
            id: generateId(),
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''),
        }))
    } catch {
        return []
    }
}

function buildContextObject(entries: ContextEntryDraft[]): Record<string, unknown> | undefined {
    const result: Record<string, unknown> = {}
    entries.forEach(entry => {
        if (!entry.key) {
            return
        }

        const trimmed = entry.value.trim()
        if (!trimmed) {
            return
        }

        try {
            result[entry.key] = JSON.parse(trimmed)
        } catch {
            result[entry.key] = trimmed
        }
    })

    return Object.keys(result).length > 0 ? result : undefined
}

function buildFactorsObject(entries: FactorEntryDraft[]): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    entries.forEach(entry => {
        if (!entry.factorKey) {
            return
        }

        if (Array.isArray(entry.value)) {
            result[entry.factorKey] = entry.value
        } else if (typeof entry.value === 'string') {
            const trimmed = entry.value.trim()
            if (trimmed) {
                result[entry.factorKey] = trimmed
            }
        } else {
            result[entry.factorKey] = entry.value
        }
    })

    return result
}

function formatEvaluationCondition({ factor, operator, expected, actual }: { factor: string; operator: string; expected: unknown; actual: unknown }): string {
    return `${factor} ${operator.toLowerCase()} (expected: ${JSON.stringify(expected)}, actual: ${JSON.stringify(actual)})`
}

const SectionCard: React.FC<React.PropsWithChildren<{ title: string; description?: string; actions?: React.ReactNode }>> = ({ title, description, actions, children }) => (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                {description ? <p className="text-sm text-slate-500">{description}</p> : null}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
        <div className="px-6 py-5">{children}</div>
    </section>
)

const infoTextClass = 'text-sm text-slate-500'

export function ProceduresPriceListsPage() {
    const [factors, setFactors] = useState<PricingFactor[]>([])
    const [factorsLoading, setFactorsLoading] = useState(false)
    const [factorsError, setFactorsError] = useState<string | null>(null)

    const [pointRates, setPointRates] = useState<PointRateRecord[]>([])
    const [pointRatesLoading, setPointRatesLoading] = useState(false)
    const [pointRatesError, setPointRatesError] = useState<string | null>(null)
    const [pointRatesView, setPointRatesView] = useState<'table' | 'card'>('table')
    const [pointRateFilters, setPointRateFilters] = useState({
        priceListId: '',
        insuranceDegreeId: '',
        validOn: '',
    })

    const [editingPointRate, setEditingPointRate] = useState<PointRateRecord | null>(null)
    const [pointRateForm, setPointRateForm] = useState({
        insuranceDegreeId: '',
        pointPrice: '',
        minPointPrice: '',
        maxPointPrice: '',
        resultMin: '',
        resultMax: '',
        validFrom: '',
        validTo: '',
        createdBy: '',
    })
    const [pointRateContextEntries, setPointRateContextEntries] = useState<ContextEntryDraft[]>([])
    const [savingPointRate, setSavingPointRate] = useState(false)

    const [pricingRules, setPricingRules] = useState<PricingRuleResponse[]>([])
    const [pricingRulesLoading, setPricingRulesLoading] = useState(false)
    const [pricingRulesError, setPricingRulesError] = useState<string | null>(null)
    const [draggedRuleId, setDraggedRuleId] = useState<number | null>(null)

    const [periodDiscounts, setPeriodDiscounts] = useState<PeriodDiscountRecord[]>([])
    const [periodDiscountsLoading, setPeriodDiscountsLoading] = useState(false)
    const [periodDiscountsError, setPeriodDiscountsError] = useState<string | null>(null)

    const [simulationEntries, setSimulationEntries] = useState<FactorEntryDraft[]>([])
    const [simulationForm, setSimulationForm] = useState({
        procedureId: '',
        priceListId: '',
        insuranceDegreeId: '',
        date: '',
    })
    const [simulationLoading, setSimulationLoading] = useState(false)
    const [simulationError, setSimulationError] = useState<string | null>(null)
    const [simulationResult, setSimulationResult] = useState<PricingCalculationResponse | null>(null)

    const [ruleForm, setRuleForm] = useState({
        procedureId: '',
        priceListId: '',
        priority: '1',
        validFrom: '',
        validTo: '',
        pricingMode: 'FIXED' as PricingMode,
        fixedPrice: '',
        points: '',
        minPrice: '',
        maxPrice: '',
        discountApply: false,
        discountUnit: 'DAY',
        discountValue: '',
    })
    const [ruleConditions, setRuleConditions] = useState<ConditionDraft[]>([])
    const [ruleAdjustments, setRuleAdjustments] = useState<AdjustmentDraft[]>([])
    const [savingRule, setSavingRule] = useState(false)

    const [newFactorForm, setNewFactorForm] = useState({
        key: '',
        nameEn: '',
        nameAr: '',
        dataType: 'TEXT',
        allowedValues: '',
    })
    const [creatingFactor, setCreatingFactor] = useState(false)
    const [factorCreationError, setFactorCreationError] = useState<string | null>(null)

    const [periodDiscountForm, setPeriodDiscountForm] = useState({
        procedureId: '',
        priceListId: '',
        period: '',
        periodUnit: 'DAY',
        discountPct: '',
        validFrom: '',
        validTo: '',
        createdBy: '',
    })
    const [savingDiscount, setSavingDiscount] = useState(false)

    const [activeTab, setActiveTab] = useState<'rules' | 'point-rates' | 'period-discounts' | 'factors' | 'simulation'>('rules')
    const [rulesView, setRulesView] = useState<'builder' | 'visualizer' | 'library'>('builder')
    const [pointRatesViewTab, setPointRatesViewTab] = useState<'listing' | 'form'>('listing')
    const [periodDiscountsView, setPeriodDiscountsView] = useState<'listing' | 'form'>('listing')
    const [factorsView, setFactorsView] = useState<'listing' | 'create'>('listing')
    const [simulationView, setSimulationView] = useState<'setup' | 'insights'>('setup')

    useEffect(() => {
        let active = true
        setFactorsLoading(true)
        setFactorsError(null)

        fetchPricingFactors({ page: 0, size: 200 })
            .then(response => {
                if (!active) return
                setFactors(response.content)
                setRuleConditions(prev => {
                    if (response.content.length === 0) {
                        return []
                    }

                    if (prev.length > 0) {
                        return prev
                    }

                    const defaultFactor = response.content[0]
                    return [
                        {
                            id: generateId(),
                            factorKey: defaultFactor.key,
                            operator: defaultOperatorForFactor(defaultFactor),
                            value: '',
                        },
                    ]
                })
            })
            .catch(error => {
                if (!active) return
                setFactorsError(error instanceof Error ? error.message : 'Unable to load factors')
            })
            .finally(() => {
                if (!active) return
                setFactorsLoading(false)
            })

        return () => {
            active = false
        }
    }, [])

    useEffect(() => {
        refreshPointRates()
    }, [])

    useEffect(() => {
        refreshPricingRules()
        refreshPeriodDiscounts()
    }, [])

    const refreshPointRates = () => {
        let active = true
        setPointRatesLoading(true)
        setPointRatesError(null)

        fetchPointRates({ page: 0, size: 50 })
            .then(response => {
                if (!active) return
                setPointRates(response.content)
            })
            .catch(error => {
                if (!active) return
                setPointRatesError(error instanceof Error ? error.message : 'Unable to load point rates')
            })
            .finally(() => {
                if (!active) return
                setPointRatesLoading(false)
            })

        return () => {
            active = false
        }
    }

    const refreshPricingRules = () => {
        let active = true
        setPricingRulesLoading(true)
        setPricingRulesError(null)

        fetchPricingRules({ page: 0, size: 50 })
            .then(response => {
                if (!active) return
                setPricingRules(response.content)
            })
            .catch(error => {
                if (!active) return
                setPricingRulesError(error instanceof Error ? error.message : 'Unable to load pricing rules')
            })
            .finally(() => {
                if (!active) return
                setPricingRulesLoading(false)
            })

        return () => {
            active = false
        }
    }

    const refreshPeriodDiscounts = () => {
        let active = true
        setPeriodDiscountsLoading(true)
        setPeriodDiscountsError(null)

        fetchPeriodDiscounts({ page: 0, size: 50 })
            .then(response => {
                if (!active) return
                setPeriodDiscounts(response.content)
            })
            .catch(error => {
                if (!active) return
                setPeriodDiscountsError(error instanceof Error ? error.message : 'Unable to load period discounts')
            })
            .finally(() => {
                if (!active) return
                setPeriodDiscountsLoading(false)
            })

        return () => {
            active = false
        }
    }

    const filteredPointRates = useMemo(() => {
        return pointRates.filter(rate => {
            if (pointRateFilters.priceListId && String(rate.context ?? '') !== pointRateFilters.priceListId) {
                return false
            }
            if (
                pointRateFilters.insuranceDegreeId &&
                String(rate.insuranceDegree?.id ?? '') !== pointRateFilters.insuranceDegreeId
            ) {
                return false
            }
            if (pointRateFilters.validOn) {
                const validOn = new Date(pointRateFilters.validOn)
                const from = new Date(rate.validFrom)
                const to = rate.validTo ? new Date(rate.validTo) : null
                if (Number.isFinite(validOn.getTime())) {
                    if (validOn < from) {
                        return false
                    }
                    if (to && validOn > to) {
                        return false
                    }
                }
            }
            return true
        })
    }, [pointRates, pointRateFilters])

    const handleAddCondition = () => {
        const firstFactor = factors[0]
        setRuleConditions(prev => [
            ...prev,
            {
                id: generateId(),
                factorKey: firstFactor?.key ?? '',
                operator: firstFactor ? defaultOperatorForFactor(firstFactor) : 'EQUALS',
                value: '',
            },
        ])
    }

    const handleConditionFactorChange = (id: string, factorKey: string) => {
        setRuleConditions(prev =>
            prev.map(condition => {
                if (condition.id !== id) {
                    return condition
                }
                const factor = factors.find(item => item.key === factorKey)
                const defaultOperator = factor ? defaultOperatorForFactor(factor) : condition.operator
                return {
                    ...condition,
                    factorKey,
                    operator: defaultOperator,
                    value: factor && operatorOptionsForFactor(factor)[0]?.requiresRange ? { min: '', max: '' } : '',
                }
            }),
        )
    }

    const handleConditionOperatorChange = (id: string, operator: string) => {
        setRuleConditions(prev =>
            prev.map(condition => {
                if (condition.id !== id) {
                    return condition
                }

                const factor = factors.find(item => item.key === condition.factorKey)
                const options = factor ? operatorOptionsForFactor(factor) : []
                const selectedOption = options.find(option => option.value === operator)

                return {
                    ...condition,
                    operator,
                    value: selectedOption?.requiresRange ? { min: '', max: '' } : selectedOption?.supportsMultiple ? [] : '',
                }
            }),
        )
    }

    const handleConditionValueChange = (id: string, value: ConditionDraft['value']) => {
        setRuleConditions(prev => prev.map(condition => (condition.id === id ? { ...condition, value } : condition)))
    }

    const handleRemoveCondition = (id: string) => {
        setRuleConditions(prev => prev.filter(condition => condition.id !== id))
    }

    const handleAddAdjustment = () => {
        setRuleAdjustments(prev => [
            ...prev,
            {
                id: generateId(),
                type: 'ADD',
                factorKey: factors[0]?.key ?? '',
                percent: '',
                cases: [
                    {
                        id: generateId(),
                        caseValue: '',
                        amount: '',
                    },
                ],
            },
        ])
    }

    const handleAdjustmentChange = (id: string, patch: Partial<AdjustmentDraft>) => {
        setRuleAdjustments(prev => prev.map(adjustment => (adjustment.id === id ? { ...adjustment, ...patch } : adjustment)))
    }

    const handleAdjustmentCaseChange = (adjustmentId: string, caseId: string, patch: Partial<AdjustmentCaseDraft>) => {
        setRuleAdjustments(prev =>
            prev.map(adjustment => {
                if (adjustment.id !== adjustmentId) {
                    return adjustment
                }

                return {
                    ...adjustment,
                    cases: adjustment.cases.map(entry => (entry.id === caseId ? { ...entry, ...patch } : entry)),
                }
            }),
        )
    }

    const handleAddAdjustmentCase = (adjustmentId: string) => {
        setRuleAdjustments(prev =>
            prev.map(adjustment => {
                if (adjustment.id !== adjustmentId) {
                    return adjustment
                }

                return {
                    ...adjustment,
                    cases: [
                        ...adjustment.cases,
                        {
                            id: generateId(),
                            caseValue: '',
                            amount: '',
                        },
                    ],
                }
            }),
        )
    }

    const handleRemoveAdjustment = (id: string) => {
        setRuleAdjustments(prev => prev.filter(adjustment => adjustment.id !== id))
    }

    const handleRemoveAdjustmentCase = (adjustmentId: string, caseId: string) => {
        setRuleAdjustments(prev =>
            prev.map(adjustment => {
                if (adjustment.id !== adjustmentId) {
                    return adjustment
                }

                return {
                    ...adjustment,
                    cases: adjustment.cases.filter(entry => entry.id !== caseId),
                }
            }),
        )
    }

    const handleOpenPointRateDialog = (rate?: PointRateRecord) => {
        if (rate) {
            setEditingPointRate(rate)
            setPointRateForm({
                insuranceDegreeId: String(rate.insuranceDegree?.id ?? ''),
                pointPrice: String(rate.pointPrice ?? ''),
                minPointPrice: rate.minPointPrice !== null && rate.minPointPrice !== undefined ? String(rate.minPointPrice) : '',
                maxPointPrice: rate.maxPointPrice !== null && rate.maxPointPrice !== undefined ? String(rate.maxPointPrice) : '',
                resultMin: rate.resultMin !== null && rate.resultMin !== undefined ? String(rate.resultMin) : '',
                resultMax: rate.resultMax !== null && rate.resultMax !== undefined ? String(rate.resultMax) : '',
                validFrom: rate.validFrom ?? '',
                validTo: rate.validTo ?? '',
                createdBy: rate.createdBy ?? '',
            })
            setPointRateContextEntries(parseContextJson(rate.contextJson))
        } else {
            setEditingPointRate(null)
            setPointRateForm({
                insuranceDegreeId: '',
                pointPrice: '',
                minPointPrice: '',
                maxPointPrice: '',
                resultMin: '',
                resultMax: '',
                validFrom: '',
                validTo: '',
                createdBy: '',
            })
            setPointRateContextEntries([])
        }

        setPointRatesViewTab('form')
    }

    const handleClosePointRateDialog = () => {
        setPointRatesViewTab('listing')
    }

    const handleSavePointRate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const payload: CreatePointRatePayload = {
            insuranceDegreeId: Number(pointRateForm.insuranceDegreeId),
            pointPrice: Number(pointRateForm.pointPrice),
            minPointPrice: pointRateForm.minPointPrice ? Number(pointRateForm.minPointPrice) : undefined,
            maxPointPrice: pointRateForm.maxPointPrice ? Number(pointRateForm.maxPointPrice) : undefined,
            resultMin: pointRateForm.resultMin ? Number(pointRateForm.resultMin) : undefined,
            resultMax: pointRateForm.resultMax ? Number(pointRateForm.resultMax) : undefined,
            validFrom: pointRateForm.validFrom,
            validTo: pointRateForm.validTo || undefined,
            createdBy: pointRateForm.createdBy || undefined,
            context: buildContextObject(pointRateContextEntries),
        }

        if (!payload.insuranceDegreeId || !payload.pointPrice || !payload.validFrom) {
            alert('Insurance degree, point price, and valid from are required')
            return
        }

        try {
            setSavingPointRate(true)
            if (editingPointRate) {
                await updatePointRate(editingPointRate.id, payload)
            } else {
                await createPointRate(payload)
            }
            handleClosePointRateDialog()
            refreshPointRates()
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Unable to save point rate')
        } finally {
            setSavingPointRate(false)
        }
    }

    const handleSaveRule = async () => {
        if (!ruleForm.procedureId || !ruleForm.priceListId || !ruleForm.validFrom) {
            alert('Procedure, price list, and valid from date are required')
            return
        }

        if (ruleConditions.length === 0) {
            alert('At least one condition is required')
            return
        }

        const conditions: PricingRuleCondition[] = ruleConditions
            .filter(condition => condition.factorKey)
            .map(condition => {
                let value: unknown = condition.value

                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    const range = value as { min?: string; max?: string }
                    value = {
                        min: range.min ? Number(range.min) : undefined,
                        max: range.max ? Number(range.max) : undefined,
                    }
                } else if (Array.isArray(value)) {
                    value = value
                } else if (typeof value === 'string') {
                    const trimmed = value.trim()
                    if (trimmed === '') {
                        value = ''
                    } else if (!Number.isNaN(Number(trimmed)) && condition.operator !== 'CONTAINS') {
                        value = Number(trimmed)
                    } else {
                        value = trimmed
                    }
                }

                return {
                    factor: condition.factorKey,
                    operator: condition.operator,
                    value,
                }
            })

        const payload: CreatePricingRulePayload = {
            procedureId: Number(ruleForm.procedureId),
            priceListId: Number(ruleForm.priceListId),
            priority: Number(ruleForm.priority || '0'),
            validFrom: ruleForm.validFrom,
            validTo: ruleForm.validTo || null,
            conditions,
            pricing: {
                mode: ruleForm.pricingMode,
                fixed_price: ruleForm.pricingMode === 'FIXED' ? Number(ruleForm.fixedPrice || 0) : undefined,
                points: ruleForm.pricingMode === 'POINTS' ? Number(ruleForm.points || 0) : undefined,
                min_price: ruleForm.pricingMode === 'RANGE' ? Number(ruleForm.minPrice || 0) : undefined,
                max_price: ruleForm.pricingMode === 'RANGE' ? Number(ruleForm.maxPrice || 0) : undefined,
            },
            discount: {
                apply: ruleForm.discountApply,
                period_unit: ruleForm.discountApply ? ruleForm.discountUnit : undefined,
                period_value: ruleForm.discountApply ? Number(ruleForm.discountValue || 0) : undefined,
            },
            adjustments: ruleAdjustments.map(adjustment => ({
                type: adjustment.type,
                factor_key: adjustment.factorKey,
                percent: adjustment.percent ? Number(adjustment.percent) : undefined,
                cases: adjustment.cases.reduce<Record<string, number>>((accumulator, entry) => {
                    if (entry.caseValue && entry.amount) {
                        accumulator[entry.caseValue] = Number(entry.amount)
                    }
                    return accumulator
                }, {}),
            })),
        }

        try {
            setSavingRule(true)
            await createPricingRule(payload)
            refreshPricingRules()
            alert('Pricing rule saved successfully')
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Unable to save pricing rule')
        } finally {
            setSavingRule(false)
        }
    }

    const handleCreateFactor = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!newFactorForm.key || !newFactorForm.nameEn) {
            setFactorCreationError('Key and English name are required')
            return
        }

        let allowedValuesParsed: unknown
        if (newFactorForm.allowedValues) {
            try {
                allowedValuesParsed = JSON.parse(newFactorForm.allowedValues)
            } catch {
                setFactorCreationError('Allowed values must be valid JSON (e.g. ["DAY", "NIGHT"])')
                return
            }
        }

        const payload = {
            key: newFactorForm.key,
            nameEn: newFactorForm.nameEn,
            nameAr: newFactorForm.nameAr || undefined,
            dataType: newFactorForm.dataType,
            allowedValues: allowedValuesParsed,
        }

        try {
            setFactorCreationError(null)
            setCreatingFactor(true)
            await createPricingFactor(payload)
            setNewFactorForm({ key: '', nameEn: '', nameAr: '', dataType: 'TEXT', allowedValues: '' })
            refreshFactors()
            setFactorsView('listing')
        } catch (error) {
            setFactorCreationError(error instanceof Error ? error.message : 'Unable to create factor')
        } finally {
            setCreatingFactor(false)
        }
    }

    const refreshFactors = () => {
        setFactorsLoading(true)
        setFactorsError(null)
        fetchPricingFactors({ page: 0, size: 200 })
            .then((response: PaginatedResponse<PricingFactor>) => {
                setFactors(response.content)
            })
            .catch(error => {
                setFactorsError(error instanceof Error ? error.message : 'Unable to refresh factors')
            })
            .finally(() => setFactorsLoading(false))
    }

    const handleSimulationSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!simulationForm.procedureId || !simulationForm.priceListId || !simulationForm.insuranceDegreeId || !simulationForm.date) {
            setSimulationError('Procedure, price list, insurance degree, and date are required for simulation')
            return
        }

        const payload: PricingCalculationRequest = {
            procedureId: Number(simulationForm.procedureId),
            priceListId: Number(simulationForm.priceListId),
            insuranceDegreeId: Number(simulationForm.insuranceDegreeId),
            date: simulationForm.date,
            factors: buildFactorsObject(simulationEntries),
        }

        try {
            setSimulationError(null)
            setSimulationLoading(true)
            const result = await calculatePricing(payload)
            setSimulationResult(result)
            setSimulationView('insights')
        } catch (error) {
            setSimulationError(error instanceof Error ? error.message : 'Unable to calculate pricing')
            setSimulationResult(null)
        } finally {
            setSimulationLoading(false)
        }
    }

    const handleSavePeriodDiscount = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (
            !periodDiscountForm.procedureId ||
            !periodDiscountForm.priceListId ||
            !periodDiscountForm.period ||
            !periodDiscountForm.discountPct ||
            !periodDiscountForm.validFrom
        ) {
            alert('All required fields must be provided to create a period discount')
            return
        }

        const payload: CreatePeriodDiscountPayload = {
            procedureId: Number(periodDiscountForm.procedureId),
            priceListId: Number(periodDiscountForm.priceListId),
            period: Number(periodDiscountForm.period),
            periodUnit: periodDiscountForm.periodUnit,
            discountPct: Number(periodDiscountForm.discountPct),
            validFrom: periodDiscountForm.validFrom,
            validTo: periodDiscountForm.validTo || undefined,
            createdBy: periodDiscountForm.createdBy || undefined,
        }

        try {
            setSavingDiscount(true)
            await createPeriodDiscount(payload)
            refreshPeriodDiscounts()
            setPeriodDiscountsView('listing')
            alert('Period discount saved successfully')
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Unable to save period discount')
        } finally {
            setSavingDiscount(false)
        }
    }

    const handleDragStart = (event: DragEvent<HTMLDivElement>, id: number) => {
        event.dataTransfer.effectAllowed = 'move'
        setDraggedRuleId(id)
    }

    const handleDragOver = (event: DragEvent<HTMLDivElement>, id: number) => {
        event.preventDefault()
        if (draggedRuleId === null || draggedRuleId === id) {
            return
        }

        setPricingRules(prev => {
            const sourceIndex = prev.findIndex(rule => rule.id === draggedRuleId)
            const targetIndex = prev.findIndex(rule => rule.id === id)
            if (sourceIndex === -1 || targetIndex === -1) {
                return prev
            }

            const reordered = [...prev]
            const [moved] = reordered.splice(sourceIndex, 1)
            reordered.splice(targetIndex, 0, moved)
            return reordered
        })
    }

    const handleDragEnd = () => {
        setDraggedRuleId(null)
    }

    const addSimulationEntry = () => {
        setSimulationEntries(prev => [
            ...prev,
            {
                id: generateId(),
                factorKey: factors[0]?.key ?? '',
                value: '',
            },
        ])
    }

    const updateSimulationEntry = (id: string, patch: Partial<FactorEntryDraft>) => {
        setSimulationEntries(prev => prev.map(entry => (entry.id === id ? { ...entry, ...patch } : entry)))
    }

    const removeSimulationEntry = (id: string) => {
        setSimulationEntries(prev => prev.filter(entry => entry.id !== id))
    }

    const addPointRateContextEntry = () => {
        setPointRateContextEntries(prev => [...prev, { id: generateId(), key: '', value: '' }])
    }

    const updatePointRateContextEntry = (id: string, patch: Partial<ContextEntryDraft>) => {
        setPointRateContextEntries(prev => prev.map(entry => (entry.id === id ? { ...entry, ...patch } : entry)))
    }

    const removePointRateContextEntry = (id: string) => {
        setPointRateContextEntries(prev => prev.filter(entry => entry.id !== id))
    }

    const ruleMatrix = useMemo(
        () =>
            ruleConditions.map((condition, index) => {
                const factor = factors.find(item => item.key === condition.factorKey)
                const operatorLabel = factor
                    ? operatorOptionsForFactor(factor).find(option => option.value === condition.operator)?.label ??
                      condition.operator
                    : condition.operator

                return {
                    id: condition.id,
                    order: index + 1,
                    factorLabel: factor?.nameEn ?? condition.factorKey || 'Select factor',
                    dataType: factor?.dataType ?? '—',
                    operatorLabel,
                    valueLabel: formatConditionValueDisplay(condition, factor),
                }
            }),
        [ruleConditions, factors],
    )

    const pricingStrategySummary = useMemo(() => {
        if (ruleForm.pricingMode === 'FIXED') {
            const hasValue = ruleForm.fixedPrice !== ''
            return hasValue ? formatCurrency(Number(ruleForm.fixedPrice)) : 'Awaiting fixed price'
        }

        if (ruleForm.pricingMode === 'POINTS') {
            const hasValue = ruleForm.points !== ''
            return hasValue ? `${ruleForm.points} pts × point price` : 'Awaiting points value'
        }

        const hasMin = ruleForm.minPrice !== ''
        const hasMax = ruleForm.maxPrice !== ''
        if (hasMin || hasMax) {
            return `${hasMin ? formatCurrency(Number(ruleForm.minPrice)) : '—'} → ${hasMax ? formatCurrency(Number(ruleForm.maxPrice)) : '—'}`
        }

        return 'Awaiting range values'
    }, [ruleForm.pricingMode, ruleForm.fixedPrice, ruleForm.points, ruleForm.minPrice, ruleForm.maxPrice])

    const discountSummary = useMemo(() => {
        if (!ruleForm.discountApply) {
            return 'No discount configured'
        }

        const value = ruleForm.discountValue !== '' ? ruleForm.discountValue : '—'
        const unit = ruleForm.discountUnit || 'Unit'
        return `${value} ${unit}`
    }, [ruleForm.discountApply, ruleForm.discountUnit, ruleForm.discountValue])

    const adjustmentMatrix = useMemo(
        () =>
            ruleAdjustments.map(adjustment => {
                const factor = factors.find(item => item.key === adjustment.factorKey)
                return {
                    id: adjustment.id,
                    type: adjustment.type,
                    factorLabel: factor?.nameEn ?? adjustment.factorKey || '—',
                    percent: adjustment.percent,
                    cases: adjustment.cases.map(entry => ({
                        id: entry.id,
                        caseValue: entry.caseValue || '—',
                        amount: entry.amount || '—',
                    })),
                }
            }),
        [ruleAdjustments, factors],
    )

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-6">
                <h1 className="text-2xl font-semibold text-slate-900">Procedure Pricing Management</h1>
                <p className="text-sm text-slate-600">
                    Build dynamic pricing factors and rules, manage point rates, and simulate pricing outcomes with real-time feedback.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="flex w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                    <TabsTrigger value="rules" className="flex-1 min-w-[120px]">Rules</TabsTrigger>
                    <TabsTrigger value="point-rates" className="flex-1 min-w-[120px]">Point Rates</TabsTrigger>
                    <TabsTrigger value="period-discounts" className="flex-1 min-w-[120px]">Period Discounts</TabsTrigger>
                    <TabsTrigger value="factors" className="flex-1 min-w-[120px]">Factors</TabsTrigger>
                    <TabsTrigger value="simulation" className="flex-1 min-w-[120px]">Simulation</TabsTrigger>
                </TabsList>

                <TabsContent value="rules" className="space-y-6">
                    <Tabs
                        value={rulesView}
                        onValueChange={value => setRulesView(value as 'builder' | 'visualizer' | 'library')}
                        className="space-y-6"
                    >
                        <TabsList className="flex w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
                            <TabsTrigger value="builder" className="flex-1 min-w-[120px]">Builder</TabsTrigger>
                            <TabsTrigger value="visualizer" className="flex-1 min-w-[120px]">Matrix</TabsTrigger>
                            <TabsTrigger value="library" className="flex-1 min-w-[120px]">Listing</TabsTrigger>
                        </TabsList>

                        <TabsContent value="builder" className="space-y-6">
                        <SectionCard
                                                    title="Dynamic Rule Builder"
                                                    description="Compose pricing rules through guided steps and instant visual feedback."
                                                    actions={
                                                        <Button variant="outline" size="sm" onClick={refreshPricingRules} disabled={pricingRulesLoading}>
                                                            {pricingRulesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                                                            Reload rules
                                                        </Button>
                                                    }
                                                >
                                                    {pricingRulesError ? <p className="text-sm text-red-600">{pricingRulesError}</p> : null}
                                                    <div className="space-y-6">
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="rule-procedure">Procedure ID</Label>
                                                                <Input
                                                                    id="rule-procedure"
                                                                    type="number"
                                                                    value={ruleForm.procedureId}
                                                                    onChange={event => setRuleForm(prev => ({ ...prev, procedureId: event.target.value }))}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="rule-price-list">Price list ID</Label>
                                                                <Input
                                                                    id="rule-price-list"
                                                                    type="number"
                                                                    value={ruleForm.priceListId}
                                                                    onChange={event => setRuleForm(prev => ({ ...prev, priceListId: event.target.value }))}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="rule-priority">Priority</Label>
                                                                <Input
                                                                    id="rule-priority"
                                                                    type="number"
                                                                    min={0}
                                                                    value={ruleForm.priority}
                                                                    onChange={event => setRuleForm(prev => ({ ...prev, priority: event.target.value }))}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="rule-valid-from">Valid from</Label>
                                                                <Input
                                                                    id="rule-valid-from"
                                                                    type="date"
                                                                    value={ruleForm.validFrom}
                                                                    onChange={event => setRuleForm(prev => ({ ...prev, validFrom: event.target.value }))}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="rule-valid-to">Valid to</Label>
                                                                <Input
                                                                    id="rule-valid-to"
                                                                    type="date"
                                                                    value={ruleForm.validTo}
                                                                    onChange={event => setRuleForm(prev => ({ ...prev, validTo: event.target.value }))}
                                                                />
                                                            </div>
                                                        </div>
                                                        <Tabs defaultValue="conditions" className="space-y-4">
                                                            <TabsList className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-1">
                                                                <TabsTrigger value="conditions" className="text-sm">Conditions</TabsTrigger>
                                                                <TabsTrigger value="pricing" className="text-sm">Pricing</TabsTrigger>
                                                                <TabsTrigger value="adjustments" className="text-sm">Adjustments</TabsTrigger>
                                                                <TabsTrigger value="discounts" className="text-sm">Discounts</TabsTrigger>
                                                            </TabsList>

                                                            <TabsContent value="conditions" className="space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <h3 className="text-sm font-semibold text-slate-700">Conditions (AND logic)</h3>
                                                                    <Button type="button" variant="outline" size="sm" onClick={handleAddCondition} disabled={factors.length === 0}>
                                                                        <Plus className="mr-2 h-4 w-4" />
                                                                        Add condition
                                                                    </Button>
                                                                </div>
                                                                {ruleConditions.length === 0 ? (
                                                                    <p className={infoTextClass}>No conditions yet. Create at least one factor-driven condition.</p>
                                                                ) : (
                                                                    <div className="space-y-4">
                                                                        {ruleConditions.map(condition => {
                                                                            const factor = factors.find(item => item.key === condition.factorKey) ?? factors[0]
                                                                            const options = factor ? operatorOptionsForFactor(factor) : []
                                                                            const allowedValues = factor ? parseAllowedValues(factor) : []
                                                                            const inputKind = factor ? resolveFactorInputKind(factor, condition.operator) : 'text'
                                                                            const selectedOption = options.find(option => option.value === condition.operator)

                                                                            return (
                                                                                <div key={condition.id} className="rounded-lg border border-slate-200 p-4 shadow-sm">
                                                                                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px]">
                                                                                        <div className="space-y-2">
                                                                                            <Label className="text-xs uppercase text-slate-500">Factor</Label>
                                                                                            <Select
                                                                                                value={condition.factorKey}
                                                                                                onValueChange={value => handleConditionFactorChange(condition.id, value)}
                                                                                            >
                                                                                                <SelectTrigger>
                                                                                                    <SelectValue placeholder="Select factor" />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    {factors.map(item => (
                                                                                                        <SelectItem key={item.key} value={item.key}>
                                                                                                            {item.nameEn}
                                                                                                        </SelectItem>
                                                                                                    ))}
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                            <Label className="text-xs uppercase text-slate-500">Operator</Label>
                                                                                            <Select
                                                                                                value={condition.operator}
                                                                                                onValueChange={value => handleConditionOperatorChange(condition.id, value)}
                                                                                            >
                                                                                                <SelectTrigger>
                                                                                                    <SelectValue placeholder="Select operator" />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    {options.map(option => (
                                                                                                        <SelectItem key={option.value} value={option.value}>
                                                                                                            {option.label}
                                                                                                        </SelectItem>
                                                                                                    ))}
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        </div>
                                                                                        <div className="flex items-start justify-end">
                                                                                            <Button
                                                                                                type="button"
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                className="text-slate-500 hover:text-red-600"
                                                                                                onClick={() => handleRemoveCondition(condition.id)}
                                                                                            >
                                                                                                <Trash2 className="h-4 w-4" />
                                                                                            </Button>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="mt-4 space-y-2">
                                                                                        <Label className="text-xs uppercase text-slate-500">Value</Label>
                                                                                        {selectedOption?.requiresRange ? (
                                                                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                                                                <Input
                                                                                                    type={inputKind === 'date' ? 'date' : 'number'}
                                                                                                    placeholder="Min"
                                                                                                    value={
                                                                                                        typeof condition.value === 'object' &&
                                                                                                        condition.value !== null &&
                                                                                                        !Array.isArray(condition.value)
                                                                                                            ? (condition.value as { min?: string }).min ?? ''
                                                                                                            : ''
                                                                                                    }
                                                                                                    onChange={event =>
                                                                                                        handleConditionValueChange(condition.id, {
                                                                                                            min: event.target.value,
                                                                                                            max:
                                                                                                                typeof condition.value === 'object' &&
                                                                                                                condition.value !== null &&
                                                                                                                !Array.isArray(condition.value)
                                                                                                                    ? (condition.value as { max?: string }).max ?? ''
                                                                                                                    : '',
                                                                                                        })
                                                                                                    }
                                                                                                />
                                                                                                <Input
                                                                                                    type={inputKind === 'date' ? 'date' : 'number'}
                                                                                                    placeholder="Max"
                                                                                                    value={
                                                                                                        typeof condition.value === 'object' &&
                                                                                                        condition.value !== null &&
                                                                                                        !Array.isArray(condition.value)
                                                                                                            ? (condition.value as { max?: string }).max ?? ''
                                                                                                            : ''
                                                                                                    }
                                                                                                    onChange={event =>
                                                                                                        handleConditionValueChange(condition.id, {
                                                                                                            min:
                                                                                                                typeof condition.value === 'object' &&
                                                                                                                condition.value !== null &&
                                                                                                                !Array.isArray(condition.value)
                                                                                                                    ? (condition.value as { min?: string }).min ?? ''
                                                                                                                    : '',
                                                                                                            max: event.target.value,
                                                                                                        })
                                                                                                    }
                                                                                                />
                                                                                            </div>
                                                                                        ) : selectedOption?.supportsMultiple && allowedValues.length > 0 ? (
                                                                                            <select
                                                                                                multiple
                                                                                                value={Array.isArray(condition.value) ? condition.value.map(String) : condition.value ? [String(condition.value)] : []}
                                                                                                onChange={event =>
                                                                                                    handleConditionValueChange(
                                                                                                        condition.id,
                                                                                                        Array.from(event.target.selectedOptions).map(option => option.value),
                                                                                                    )
                                                                                                }
                                                                                                className="h-32 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                                                                                            >
                                                                                                {allowedValues.map(option => (
                                                                                                    <option key={option} value={option}>
                                                                                                        {option}
                                                                                                    </option>
                                                                                                ))}
                                                                                            </select>
                                                                                        ) : inputKind === 'boolean' ? (
                                                                                            <div className="flex items-center gap-3">
                                                                                                <Switch
                                                                                                    checked={Boolean(condition.value)}
                                                                                                    onCheckedChange={checked => handleConditionValueChange(condition.id, checked)}
                                                                                                />
                                                                                                <span className="text-sm text-slate-700">{condition.value ? 'True' : 'False'}</span>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <Input
                                                                                                type={inputKind === 'number' ? 'number' : inputKind === 'date' ? 'date' : 'text'}
                                                                                                value={Array.isArray(condition.value) ? condition.value.join(',') : String(condition.value ?? '')}
                                                                                                onChange={event => handleConditionValueChange(condition.id, event.target.value)}
                                                                                            />
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </TabsContent>
                                                            <TabsContent value="pricing" className="space-y-4">
                                                                <div className="grid gap-4 md:grid-cols-2">
                                                                    <div className="space-y-2">
                                                                        <Label>Pricing mode</Label>
                                                                        <Select
                                                                            value={ruleForm.pricingMode}
                                                                            onValueChange={value => setRuleForm(prev => ({ ...prev, pricingMode: value as PricingMode }))}
                                                                        >
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Select mode" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="FIXED">Fixed</SelectItem>
                                                                                <SelectItem value="POINTS">Points</SelectItem>
                                                                                <SelectItem value="RANGE">Range</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    {ruleForm.pricingMode === 'POINTS' ? (
                                                                        <div className="space-y-2">
                                                                            <Label htmlFor="rule-points">Points</Label>
                                                                            <Input
                                                                                id="rule-points"
                                                                                type="number"
                                                                                value={ruleForm.points}
                                                                                onChange={event => setRuleForm(prev => ({ ...prev, points: event.target.value }))}
                                                                            />
                                                                        </div>
                                                                    ) : null}
                                                                    {ruleForm.pricingMode === 'FIXED' ? (
                                                                        <div className="space-y-2">
                                                                            <Label htmlFor="rule-fixed">Fixed price</Label>
                                                                            <Input
                                                                                id="rule-fixed"
                                                                                type="number"
                                                                                value={ruleForm.fixedPrice}
                                                                                onChange={event => setRuleForm(prev => ({ ...prev, fixedPrice: event.target.value }))}
                                                                            />
                                                                        </div>
                                                                    ) : null}
                                                                    {ruleForm.pricingMode === 'RANGE' ? (
                                                                        <>
                                                                            <div className="space-y-2">
                                                                                <Label htmlFor="rule-min">Min price</Label>
                                                                                <Input
                                                                                    id="rule-min"
                                                                                    type="number"
                                                                                    value={ruleForm.minPrice}
                                                                                    onChange={event => setRuleForm(prev => ({ ...prev, minPrice: event.target.value }))}
                                                                                />
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <Label htmlFor="rule-max">Max price</Label>
                                                                                <Input
                                                                                    id="rule-max"
                                                                                    type="number"
                                                                                    value={ruleForm.maxPrice}
                                                                                    onChange={event => setRuleForm(prev => ({ ...prev, maxPrice: event.target.value }))}
                                                                                />
                                                                            </div>
                                                                        </>
                                                                    ) : null}
                                                                </div>
                                                            </TabsContent>

                                                            <TabsContent value="adjustments" className="space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <h3 className="text-sm font-semibold text-slate-700">Adjustments</h3>
                                                                    <Button type="button" variant="outline" size="sm" onClick={handleAddAdjustment}>
                                                                        <Plus className="mr-2 h-4 w-4" />
                                                                        Add adjustment
                                                                    </Button>
                                                                </div>
                                                                {ruleAdjustments.length === 0 ? (
                                                                    <p className={infoTextClass}>No adjustments defined.</p>
                                                                ) : (
                                                                    <div className="space-y-4">
                                                                        {ruleAdjustments.map(adjustment => {
                                                                            const factor = factors.find(item => item.key === adjustment.factorKey)
                                                                            const allowedValues = factor ? parseAllowedValues(factor) : []
                                                                            return (
                                                                                <div key={adjustment.id} className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                                                                                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px]">
                                                                                        <div className="space-y-2">
                                                                                            <Label className="text-xs uppercase text-blue-800">Type</Label>
                                                                                            <Select
                                                                                                value={adjustment.type}
                                                                                                onValueChange={value => handleAdjustmentChange(adjustment.id, { type: value })}
                                                                                            >
                                                                                                <SelectTrigger>
                                                                                                    <SelectValue placeholder="Select type" />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    <SelectItem value="ADD">Add</SelectItem>
                                                                                                    <SelectItem value="MULTIPLY">Multiply</SelectItem>
                                                                                                    <SelectItem value="PERCENT">Percent</SelectItem>
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                            <Label className="text-xs uppercase text-blue-800">Factor</Label>
                                                                                            <Select
                                                                                                value={adjustment.factorKey}
                                                                                                onValueChange={value => handleAdjustmentChange(adjustment.id, { factorKey: value })}
                                                                                            >
                                                                                                <SelectTrigger>
                                                                                                    <SelectValue placeholder="Select factor" />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    {factors.map(item => (
                                                                                                        <SelectItem key={item.key} value={item.key}>
                                                                                                            {item.nameEn}
                                                                                                        </SelectItem>
                                                                                                    ))}
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        </div>
                                                                                        <div className="flex items-start justify-end">
                                                                                            <Button
                                                                                                type="button"
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                className="text-blue-600 hover:text-red-600"
                                                                                                onClick={() => handleRemoveAdjustment(adjustment.id)}
                                                                                            >
                                                                                                <Trash2 className="h-4 w-4" />
                                                                                            </Button>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="grid gap-4 md:grid-cols-2">
                                                                                        <div className="space-y-2">
                                                                                            <Label className="text-xs uppercase text-blue-800">Percent (optional)</Label>
                                                                                            <Input
                                                                                                type="number"
                                                                                                value={adjustment.percent}
                                                                                                onChange={event => handleAdjustmentChange(adjustment.id, { percent: event.target.value })}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="mt-4 space-y-3">
                                                                                        <div className="flex items-center justify-between">
                                                                                            <Label className="text-xs uppercase text-blue-800">Cases</Label>
                                                                                            <Button type="button" variant="outline" size="sm" onClick={() => handleAddAdjustmentCase(adjustment.id)}>
                                                                                                <Plus className="mr-2 h-4 w-4" />
                                                                                                Add case
                                                                                            </Button>
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                            {adjustment.cases.map(caseEntry => (
                                                                                                <div key={caseEntry.id} className="flex flex-col gap-2 rounded-md border border-blue-200 bg-white p-3 md:flex-row md:items-center md:gap-3">
                                                                                                    <div className="flex-1">
                                                                                                        <Label className="text-[10px] uppercase text-blue-800">Factor value</Label>
                                                                                                        {allowedValues.length > 0 ? (
                                                                                                            <select
                                                                                                                value={caseEntry.caseValue}
                                                                                                                onChange={event => handleAdjustmentCaseChange(adjustment.id, caseEntry.id, { caseValue: event.target.value })}
                                                                                                                className="mt-1 w-full rounded-md border border-blue-200 px-3 py-2 text-sm"
                                                                                                            >
                                                                                                                <option value="">Select value</option>
                                                                                                                {allowedValues.map(option => (
                                                                                                                    <option key={option} value={option}>
                                                                                                                        {option}
                                                                                                                    </option>
                                                                                                                ))}
                                                                                                            </select>
                                                                                                        ) : (
                                                                                                            <Input
                                                                                                                value={caseEntry.caseValue}
                                                                                                                onChange={event => handleAdjustmentCaseChange(adjustment.id, caseEntry.id, { caseValue: event.target.value })}
                                                                                                                placeholder="Case value"
                                                                                                            />
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <div className="flex-1">
                                                                                                        <Label className="text-[10px] uppercase text-blue-800">Amount</Label>
                                                                                                        <Input
                                                                                                            type="number"
                                                                                                            value={caseEntry.amount}
                                                                                                            onChange={event => handleAdjustmentCaseChange(adjustment.id, caseEntry.id, { amount: event.target.value })}
                                                                                                        />
                                                                                                    </div>
                                                                                                    <Button
                                                                                                        type="button"
                                                                                                        variant="ghost"
                                                                                                        size="icon"
                                                                                                        className="text-blue-600 hover:text-red-600"
                                                                                                        onClick={() => handleRemoveAdjustmentCase(adjustment.id, caseEntry.id)}
                                                                                                    >
                                                                                                        <Trash2 className="h-4 w-4" />
                                                                                                    </Button>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </TabsContent>

                                                            <TabsContent value="discounts" className="space-y-4">
                                                                <div className="rounded-lg border border-slate-200 p-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <div>
                                                                            <p className="text-sm font-semibold text-slate-700">Discount configuration</p>
                                                                            <p className={infoTextClass}>Enable period-based discounts for the rule.</p>
                                                                        </div>
                                                                        <Switch
                                                                            checked={ruleForm.discountApply}
                                                                            onCheckedChange={checked => setRuleForm(prev => ({ ...prev, discountApply: checked }))}
                                                                        />
                                                                    </div>
                                                                    {ruleForm.discountApply ? (
                                                                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                                                                            <div className="space-y-2">
                                                                                <Label htmlFor="rule-discount-unit">Unit</Label>
                                                                                <Input
                                                                                    id="rule-discount-unit"
                                                                                    value={ruleForm.discountUnit}
                                                                                    onChange={event => setRuleForm(prev => ({ ...prev, discountUnit: event.target.value }))}
                                                                                />
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <Label htmlFor="rule-discount-value">Value</Label>
                                                                                <Input
                                                                                    id="rule-discount-value"
                                                                                    type="number"
                                                                                    value={ruleForm.discountValue}
                                                                                    onChange={event => setRuleForm(prev => ({ ...prev, discountValue: event.target.value }))}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </TabsContent>
                                                        </Tabs>
                                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                                            <h3 className="text-sm font-semibold text-slate-700">Rule snapshot</h3>
                                                            <div className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                                                                <div>
                                                                    <p className="text-xs uppercase text-slate-500">Pricing mode</p>
                                                                    <p className="font-medium">{ruleForm.pricingMode}</p>
                                                                    <p className="text-xs text-slate-500">{pricingStrategySummary}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs uppercase text-slate-500">Discount</p>
                                                                    <p className="font-medium">{discountSummary}</p>
                                                                    <p className="text-xs text-slate-500">{ruleForm.discountApply ? 'Applied when conditions match' : 'Disabled'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs uppercase text-slate-500">Priority</p>
                                                                    <p className="font-medium">#{ruleForm.priority || '—'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs uppercase text-slate-500">Validity window</p>
                                                                    <p className="font-medium">{ruleForm.validFrom || '—'} → {ruleForm.validTo || 'Open-ended'}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end">
                                                            <Button onClick={handleSaveRule} disabled={savingRule}>
                                                                {savingRule ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
                                                                Save rule
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </SectionCard>
                                                
                        </TabsContent>

                        <TabsContent value="visualizer" className="space-y-6">
                        <SectionCard
                                                    title="Rule Matrix Visualizer"
                                                    description="Follow the relationship between factors, operators, and pricing outcomes."
                                                >
                                                    <div className="space-y-5">
                                                        <div className="overflow-hidden rounded-xl border border-slate-200">
                                                            {ruleMatrix.length > 0 ? (
                                                                <Table>
                                                                    <TableHeader className="bg-slate-50">
                                                                        <TableRow>
                                                                            <TableHead className="w-12">#</TableHead>
                                                                            <TableHead>Factor</TableHead>
                                                                            <TableHead>Data type</TableHead>
                                                                            <TableHead>Operator</TableHead>
                                                                            <TableHead>Expected value</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {ruleMatrix.map(row => (
                                                                            <TableRow key={row.id}>
                                                                                <TableCell className="font-medium text-slate-700">{row.order}</TableCell>
                                                                                <TableCell>
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-medium text-slate-800">{row.factorLabel}</span>
                                                                                        <span className="text-xs text-slate-500">{row.factorLabel === 'Select factor' ? 'Choose a factor to activate condition' : 'Factor constraint'}</span>
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{row.dataType}</span>
                                                                                </TableCell>
                                                                                <TableCell>{row.operatorLabel}</TableCell>
                                                                                <TableCell className="text-slate-700">{row.valueLabel}</TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            ) : (
                                                                <p className="p-6 text-sm text-slate-500">Add conditions to populate the logic matrix.</p>
                                                            )}
                                                        </div>

                                                        <div className="grid gap-3 md:grid-cols-2">
                                                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                                                <p className="text-xs uppercase text-blue-700">Pricing mode</p>
                                                                <p className="text-lg font-semibold text-blue-900">{ruleForm.pricingMode}</p>
                                                                <p className="text-sm text-blue-800">{pricingStrategySummary}</p>
                                                            </div>
                                                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                                                <p className="text-xs uppercase text-emerald-700">Discount window</p>
                                                                <p className="text-lg font-semibold text-emerald-900">{ruleForm.discountApply ? 'Active' : 'Disabled'}</p>
                                                                <p className="text-sm text-emerald-800">{discountSummary}</p>
                                                            </div>
                                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                                                                <div className="grid gap-3 sm:grid-cols-2">
                                                                    <div>
                                                                        <p className="text-xs uppercase text-slate-500">Priority</p>
                                                                        <p className="text-base font-semibold text-slate-800">{ruleForm.priority || '—'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs uppercase text-slate-500">Validity window</p>
                                                                        <p className="text-base font-semibold text-slate-800">{ruleForm.validFrom || '—'} → {ruleForm.validTo || 'Open-ended'}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h3 className="text-sm font-semibold text-slate-700">Adjustment matrix</h3>
                                                            {adjustmentMatrix.length > 0 ? (
                                                                <div className="mt-3 space-y-4">
                                                                    {adjustmentMatrix.map(adjustment => (
                                                                        <div key={adjustment.id} className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                                                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                                                <div>
                                                                                    <p className="text-sm font-semibold text-blue-900">{adjustment.factorLabel}</p>
                                                                                    <p className="text-xs uppercase text-blue-700">{adjustment.type}</p>
                                                                                </div>
                                                                                {adjustment.percent ? (
                                                                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">{adjustment.percent}%</span>
                                                                                ) : null}
                                                                            </div>
                                                                            {adjustment.cases.length > 0 ? (
                                                                                <div className="mt-3 overflow-x-auto">
                                                                                    <Table>
                                                                                        <TableHeader>
                                                                                            <TableRow>
                                                                                                <TableHead>Factor value</TableHead>
                                                                                                <TableHead>Amount</TableHead>
                                                                                            </TableRow>
                                                                                        </TableHeader>
                                                                                        <TableBody>
                                                                                            {adjustment.cases.map(caseEntry => (
                                                                                                <TableRow key={caseEntry.id}>
                                                                                                    <TableCell>{caseEntry.caseValue}</TableCell>
                                                                                                    <TableCell>{caseEntry.amount}</TableCell>
                                                                                                </TableRow>
                                                                                            ))}
                                                                                        </TableBody>
                                                                                    </Table>
                                                                                </div>
                                                                            ) : (
                                                                                <p className={infoTextClass}>Add case rows to define factor-specific adjustments.</p>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className={infoTextClass}>Add adjustments to see how factor cases translate into price changes.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </SectionCard>


                        </TabsContent>

                        <TabsContent value="library" className="space-y-6">
                        <SectionCard
                                                title="Rule Library"
                                                description="Existing rules grouped by priority. Drag rows to reorder priority visually."
                                                actions={
                                                    <Button variant="outline" size="sm" onClick={refreshPricingRules} disabled={pricingRulesLoading}>
                                                        {pricingRulesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                                                        Refresh
                                                    </Button>
                                                }
                                            >
                                                {pricingRulesError ? <p className="text-sm text-red-600">{pricingRulesError}</p> : null}
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader className="bg-slate-50">
                                                            <TableRow>
                                                                <TableHead className="w-24">Priority</TableHead>
                                                                <TableHead>Rule</TableHead>
                                                                <TableHead>Pricing</TableHead>
                                                                <TableHead>Conditions</TableHead>
                                                                <TableHead>Validity</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {pricingRules.map(rule => {
                                                                const parsed = parseRuleJson(rule)
                                                                const conditions = extractRuleConditions(parsed)
                                                                return (
                                                                    <TableRow
                                                                        key={rule.id}
                                                                        draggable
                                                                        onDragStart={event => handleDragStart(event, rule.id)}
                                                                        onDragOver={event => handleDragOver(event, rule.id)}
                                                                        onDragEnd={handleDragEnd}
                                                                        className={cn('cursor-move transition hover:bg-blue-50', draggedRuleId === rule.id ? 'bg-blue-50' : '')}
                                                                    >
                                                                        <TableCell className="font-semibold text-slate-800">{rule.priority}</TableCell>
                                                                        <TableCell>
                                                                            <div className="flex flex-col">
                                                                                <span className="font-semibold text-slate-800">Rule #{rule.id}</span>
                                                                                <span className="text-xs text-slate-500">Procedure {rule.procedureId} · Price list {rule.priceListId}</span>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">{formatRulePricing(parsed)}</span>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {conditions.map(condition => (
                                                                                    <span key={condition} className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                                                                        {condition}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="text-sm text-slate-600">
                                                                            {Array.isArray(rule.validFrom) ? rule.validFrom.join('/') : rule.validFrom}
                                                                            {rule.validTo ? ` → ${Array.isArray(rule.validTo) ? rule.validTo.join('/') : rule.validTo}` : ''}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                                {pricingRules.length === 0 ? <p className="mt-4 text-sm text-slate-500">No rules found.</p> : null}
                                            </SectionCard>

                        </TabsContent>
                    </Tabs>
                </TabsContent>
                <TabsContent value="point-rates" className="space-y-6">
                    <Tabs
                        value={pointRatesViewTab}
                        onValueChange={value => setPointRatesViewTab(value as 'listing' | 'form')}
                        className="space-y-6"
                    >
                        <TabsList className="flex w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
                            <TabsTrigger value="listing" className="flex-1 min-w-[120px]">Listing</TabsTrigger>
                            <TabsTrigger value="form" className="flex-1 min-w-[120px]">Editor</TabsTrigger>
                        </TabsList>

                        <TabsContent value="listing" className="space-y-6">
                        <SectionCard
                                                title="Point Rates"
                                                description="Manage point prices with filtering, card view, and inline editing."
                                                actions={
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => setPointRatesView('table')} className={pointRatesView === 'table' ? 'border-blue-500 text-blue-600' : ''}>
                                                            Table view
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => setPointRatesView('card')} className={pointRatesView === 'card' ? 'border-blue-500 text-blue-600' : ''}>
                                                            Card view
                                                        </Button>
                                                        <Button onClick={() => handleOpenPointRateDialog()}>
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Add point rate
                                                        </Button>
                                                    </div>
                                                }
                                            >
                                                {pointRatesError ? <p className="text-sm text-red-600">{pointRatesError}</p> : null}
                                                <div className="mb-4 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="point-filter-price-list">Price list (context)</Label>
                                                        <Input
                                                            id="point-filter-price-list"
                                                            value={pointRateFilters.priceListId}
                                                            onChange={event => setPointRateFilters(prev => ({ ...prev, priceListId: event.target.value }))}
                                                            placeholder="Context value"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="point-filter-insurance">Insurance degree ID</Label>
                                                        <Input
                                                            id="point-filter-insurance"
                                                            value={pointRateFilters.insuranceDegreeId}
                                                            onChange={event => setPointRateFilters(prev => ({ ...prev, insuranceDegreeId: event.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="point-filter-date">Valid on</Label>
                                                        <Input
                                                            id="point-filter-date"
                                                            type="date"
                                                            value={pointRateFilters.validOn}
                                                            onChange={event => setPointRateFilters(prev => ({ ...prev, validOn: event.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="flex items-end">
                                                        <Button variant="outline" className="w-full" onClick={refreshPointRates} disabled={pointRatesLoading}>
                                                            {pointRatesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                                                            Refresh
                                                        </Button>
                                                    </div>
                                                </div>
                                                {pointRatesView === 'table' ? (
                                                    <div className="overflow-x-auto">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>ID</TableHead>
                                                                    <TableHead>Insurance degree</TableHead>
                                                                    <TableHead>Point price</TableHead>
                                                                    <TableHead>Range</TableHead>
                                                                    <TableHead>Result range</TableHead>
                                                                    <TableHead>Validity</TableHead>
                                                                    <TableHead className="text-right">Actions</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {filteredPointRates.map(rate => (
                                                                    <TableRow key={rate.id}>
                                                                        <TableCell>{rate.id}</TableCell>
                                                                        <TableCell>
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium text-slate-800">{rate.insuranceDegree?.nameEn ?? '—'}</span>
                                                                                <span className="text-xs text-slate-500">{rate.insuranceDegree?.code}</span>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>{formatCurrency(rate.pointPrice)}</TableCell>
                                                                        <TableCell>
                                                                            {rate.minPointPrice ?? '—'} → {rate.maxPointPrice ?? '—'}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {rate.resultMin ?? '—'} → {rate.resultMax ?? '—'}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {formatDate(rate.validFrom)} → {rate.validTo ? formatDate(rate.validTo) : 'Open-ended'}
                                                                        </TableCell>
                                                                        <TableCell className="text-right">
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                <Button variant="outline" size="sm" onClick={() => handleOpenPointRateDialog(rate)}>
                                                                                    Edit
                                                                                </Button>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                        {filteredPointRates.map(rate => (
                                                            <div key={rate.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-slate-900">{rate.insuranceDegree?.nameEn ?? '—'}</p>
                                                                        <p className="text-xs text-slate-500">{rate.insuranceDegree?.code ?? '—'}</p>
                                                                    </div>
                                                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">{formatCurrency(rate.pointPrice)}</span>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                                                    <span>Point range</span>
                                                                    <span className="text-right">{rate.minPointPrice ?? '—'} → {rate.maxPointPrice ?? '—'}</span>
                                                                    <span>Result range</span>
                                                                    <span className="text-right">{rate.resultMin ?? '—'} → {rate.resultMax ?? '—'}</span>
                                                                    <span>Validity</span>
                                                                    <span className="text-right">{formatDate(rate.validFrom)} → {rate.validTo ? formatDate(rate.validTo) : 'Open-ended'}</span>
                                                                </div>
                                                                <Button size="sm" variant="outline" onClick={() => handleOpenPointRateDialog(rate)}>
                                                                    Edit point rate
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                                        </SectionCard>

                        </TabsContent>

                        <TabsContent value="form" className="space-y-6">
                            <SectionCard
                                title={editingPointRate ? 'Edit point rate' : 'New point rate'}
                                description="Define the context and price bounds for a single point rate."
                                actions={
                                    <Button variant="outline" size="sm" onClick={handleClosePointRateDialog}>
                                        Back to listing
                                    </Button>
                                }
                            >
                        <form onSubmit={handleSavePointRate} className="space-y-4">
                                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="point-degree">Insurance degree ID</Label>
                                                                <Input
                                                                    id="point-degree"
                                                                    type="number"
                                                                    value={pointRateForm.insuranceDegreeId}
                                                                    onChange={event => setPointRateForm(prev => ({ ...prev, insuranceDegreeId: event.target.value }))}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="point-price">Point price</Label>
                                                                <Input
                                                                    id="point-price"
                                                                    type="number"
                                                                    value={pointRateForm.pointPrice}
                                                                    onChange={event => setPointRateForm(prev => ({ ...prev, pointPrice: event.target.value }))}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="point-min">Min point price</Label>
                                                                <Input
                                                                    id="point-min"
                                                                    type="number"
                                                                    value={pointRateForm.minPointPrice}
                                                                    onChange={event => setPointRateForm(prev => ({ ...prev, minPointPrice: event.target.value }))}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="point-max">Max point price</Label>
                                                                <Input
                                                                    id="point-max"
                                                                    type="number"
                                                                    value={pointRateForm.maxPointPrice}
                                                                    onChange={event => setPointRateForm(prev => ({ ...prev, maxPointPrice: event.target.value }))}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="point-result-min">Result min</Label>
                                                                <Input
                                                                    id="point-result-min"
                                                                    type="number"
                                                                    value={pointRateForm.resultMin}
                                                                    onChange={event => setPointRateForm(prev => ({ ...prev, resultMin: event.target.value }))}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="point-result-max">Result max</Label>
                                                                <Input
                                                                    id="point-result-max"
                                                                    type="number"
                                                                    value={pointRateForm.resultMax}
                                                                    onChange={event => setPointRateForm(prev => ({ ...prev, resultMax: event.target.value }))}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="point-valid-from">Valid from</Label>
                                                                <Input
                                                                    id="point-valid-from"
                                                                    type="date"
                                                                    value={pointRateForm.validFrom}
                                                                    onChange={event => setPointRateForm(prev => ({ ...prev, validFrom: event.target.value }))}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="point-valid-to">Valid to</Label>
                                                                <Input
                                                                    id="point-valid-to"
                                                                    type="date"
                                                                    value={pointRateForm.validTo}
                                                                    onChange={event => setPointRateForm(prev => ({ ...prev, validTo: event.target.value }))}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="point-created-by">Created by</Label>
                                                                <Input
                                                                    id="point-created-by"
                                                                    value={pointRateForm.createdBy}
                                                                    onChange={event => setPointRateForm(prev => ({ ...prev, createdBy: event.target.value }))}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-sm font-semibold text-slate-700">Context</Label>
                                                                <Button type="button" variant="outline" size="sm" onClick={addPointRateContextEntry}>
                                                                    <Plus className="mr-2 h-4 w-4" />
                                                                    Add context entry
                                                                </Button>
                                                            </div>
                                                            {pointRateContextEntries.length === 0 ? (
                                                                <p className={infoTextClass}>Context defines when the point rate applies. Add key/value pairs to target specific scenarios.</p>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {pointRateContextEntries.map(entry => (
                                                                        <div key={entry.id} className="flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center md:gap-3">
                                                                            <Input
                                                                                placeholder="Key"
                                                                                value={entry.key}
                                                                                onChange={event => updatePointRateContextEntry(entry.id, { key: event.target.value })}
                                                                            />
                                                                            <Input
                                                                                placeholder="Value or JSON"
                                                                                value={entry.value}
                                                                                onChange={event => updatePointRateContextEntry(entry.id, { value: event.target.value })}
                                                                            />
                                                                            <Button type="button" variant="ghost" size="icon" onClick={() => removePointRateContextEntry(entry.id)}>
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex justify-end">
                                                            <Button type="submit" disabled={savingPointRate}>
                                                                {savingPointRate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
                                                                Save point rate
                                                            </Button>
                                                        </div>
                                                    </form>
                            </SectionCard>
                        </TabsContent>
                    </Tabs>
                </TabsContent>
                <TabsContent value="period-discounts" className="space-y-6">
                    <Tabs
                        value={periodDiscountsView}
                        onValueChange={value => setPeriodDiscountsView(value as 'listing' | 'form')}
                        className="space-y-6"
                    >
                        <TabsList className="flex w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
                            <TabsTrigger value="listing" className="flex-1 min-w-[120px]">Listing</TabsTrigger>
                            <TabsTrigger value="form" className="flex-1 min-w-[120px]">Editor</TabsTrigger>
                        </TabsList>

                        <TabsContent value="listing" className="space-y-6">
                            <SectionCard
                                title="Period Discounts"
                                description="Configure recurring discounts for procedures based on time windows."
                                actions={
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={refreshPeriodDiscounts} disabled={periodDiscountsLoading}>
                                            {periodDiscountsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                                            Refresh
                                        </Button>
                                        <Button size="sm" onClick={() => setPeriodDiscountsView('form')}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            New discount
                                        </Button>
                                    </div>
                                }
                            >
                                {periodDiscountsError ? <p className="text-sm text-red-600">{periodDiscountsError}</p> : null}
                                <div className="space-y-3">
                                    {periodDiscounts.map(discount => (
                                        <div key={discount.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-slate-800">Discount #{discount.id}</span>
                                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                                                    {discount.discountPct}% for {discount.period} {discount.periodUnit}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-xs text-slate-500">
                                                Valid: {formatDate(discount.validFrom)} → {discount.validTo ? formatDate(discount.validTo) : 'Open-ended'}
                                            </div>
                                        </div>
                                    ))}
                                    {periodDiscounts.length === 0 ? <p className={infoTextClass}>No discounts found.</p> : null}
                                </div>
                            </SectionCard>
                        </TabsContent>

                        <TabsContent value="form" className="space-y-6">
                            <SectionCard
                                title="Create period discount"
                                description="Set discount intervals before publishing to the list."
                                actions={
                                    <Button variant="outline" size="sm" onClick={() => setPeriodDiscountsView('listing')}>
                                        Back to listing
                                    </Button>
                                }
                            >
                        <form onSubmit={handleSavePeriodDiscount} className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="discount-procedure">Procedure ID</Label>
                                                        <Input
                                                            id="discount-procedure"
                                                            type="number"
                                                            value={periodDiscountForm.procedureId}
                                                            onChange={event => setPeriodDiscountForm(prev => ({ ...prev, procedureId: event.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="discount-price-list">Price list ID</Label>
                                                        <Input
                                                            id="discount-price-list"
                                                            type="number"
                                                            value={periodDiscountForm.priceListId}
                                                            onChange={event => setPeriodDiscountForm(prev => ({ ...prev, priceListId: event.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="discount-period">Period</Label>
                                                        <Input
                                                            id="discount-period"
                                                            type="number"
                                                            value={periodDiscountForm.period}
                                                            onChange={event => setPeriodDiscountForm(prev => ({ ...prev, period: event.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="discount-unit">Period unit</Label>
                                                        <Input
                                                            id="discount-unit"
                                                            value={periodDiscountForm.periodUnit}
                                                            onChange={event => setPeriodDiscountForm(prev => ({ ...prev, periodUnit: event.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="discount-pct">Discount %</Label>
                                                        <Input
                                                            id="discount-pct"
                                                            type="number"
                                                            value={periodDiscountForm.discountPct}
                                                            onChange={event => setPeriodDiscountForm(prev => ({ ...prev, discountPct: event.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="discount-from">Valid from</Label>
                                                        <Input
                                                            id="discount-from"
                                                            type="date"
                                                            value={periodDiscountForm.validFrom}
                                                            onChange={event => setPeriodDiscountForm(prev => ({ ...prev, validFrom: event.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="discount-to">Valid to</Label>
                                                        <Input
                                                            id="discount-to"
                                                            type="date"
                                                            value={periodDiscountForm.validTo}
                                                            onChange={event => setPeriodDiscountForm(prev => ({ ...prev, validTo: event.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="discount-created-by">Created by</Label>
                                                        <Input
                                                            id="discount-created-by"
                                                            value={periodDiscountForm.createdBy}
                                                            onChange={event => setPeriodDiscountForm(prev => ({ ...prev, createdBy: event.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="flex items-end justify-end">
                                                        <Button type="submit" disabled={savingDiscount} className="w-full md:w-auto">
                                                            {savingDiscount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
                                                            Save discount
                                                        </Button>
                                                    </div>
                                                </form>
                            </SectionCard>
                        </TabsContent>
                    </Tabs>
                </TabsContent>
                <TabsContent value="factors" className="space-y-6">
                    <Tabs
                        value={factorsView}
                        onValueChange={value => setFactorsView(value as 'listing' | 'create')}
                        className="space-y-6"
                    >
                        <TabsList className="flex w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
                            <TabsTrigger value="listing" className="flex-1 min-w-[120px]">Listing</TabsTrigger>
                            <TabsTrigger value="create" className="flex-1 min-w-[120px]">Editor</TabsTrigger>
                        </TabsList>

                        <TabsContent value="listing" className="space-y-6">
                            <SectionCard
                                title="Pricing Factor Library"
                                description="Factors power rule conditions and simulation contexts."
                                actions={
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={refreshFactors} disabled={factorsLoading}>
                                            {factorsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                                            Refresh
                                        </Button>
                                        <Button size="sm" onClick={() => setFactorsView('create')}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            New factor
                                        </Button>
                                    </div>
                                }
                            >
                                {factorsError ? <p className="text-sm text-red-600">{factorsError}</p> : null}
                        <div className="flex flex-wrap gap-2">
                                                    {factors.map(factor => (
                                                        <span
                                                            key={factor.id}
                                                            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                                                        >
                                                            {factor.nameEn}
                                                            <span className="ml-2 rounded bg-slate-200 px-1 text-[10px] uppercase text-slate-600">{factor.dataType}</span>
                                                        </span>
                                                    ))}
                                                </div>
                            </SectionCard>
                        </TabsContent>

                        <TabsContent value="create" className="space-y-6">
                            <SectionCard
                                title="Create pricing factor"
                                description="Add new contextual variables to drive pricing logic."
                                actions={
                                    <Button variant="outline" size="sm" onClick={() => setFactorsView('listing')}>
                                        Back to listing
                                    </Button>
                                }
                            >
                        <form onSubmit={handleCreateFactor} className="mt-6 space-y-4">
                                                    <div className="grid gap-3">
                                                        <Label htmlFor="factor-key">Key</Label>
                                                        <Input
                                                            id="factor-key"
                                                            placeholder="e.g. visit_time"
                                                            value={newFactorForm.key}
                                                            onChange={event => setNewFactorForm(prev => ({ ...prev, key: event.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="grid gap-3">
                                                        <Label htmlFor="factor-name-en">Name (English)</Label>
                                                        <Input
                                                            id="factor-name-en"
                                                            placeholder="e.g. Visit Time"
                                                            value={newFactorForm.nameEn}
                                                            onChange={event => setNewFactorForm(prev => ({ ...prev, nameEn: event.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="grid gap-3">
                                                        <Label htmlFor="factor-name-ar">Name (Arabic)</Label>
                                                        <Input
                                                            id="factor-name-ar"
                                                            value={newFactorForm.nameAr}
                                                            onChange={event => setNewFactorForm(prev => ({ ...prev, nameAr: event.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="grid gap-3">
                                                        <Label>Data type</Label>
                                                        <Select
                                                            value={newFactorForm.dataType}
                                                            onValueChange={value => setNewFactorForm(prev => ({ ...prev, dataType: value }))}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="TEXT">Text</SelectItem>
                                                                <SelectItem value="NUMBER">Number</SelectItem>
                                                                <SelectItem value="SELECT">Select</SelectItem>
                                                                <SelectItem value="DATE">Date</SelectItem>
                                                                <SelectItem value="BOOLEAN">Boolean</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid gap-3">
                                                        <Label htmlFor="factor-values">Allowed values (JSON array, optional)</Label>
                                                        <Input
                                                            id="factor-values"
                                                            placeholder='["DAY", "NIGHT"]'
                                                            value={newFactorForm.allowedValues}
                                                            onChange={event => setNewFactorForm(prev => ({ ...prev, allowedValues: event.target.value }))}
                                                        />
                                                    </div>
                                                    {factorCreationError ? <p className="text-sm text-red-600">{factorCreationError}</p> : null}
                                                    <Button type="submit" className="w-full" disabled={creatingFactor}>
                                                        {creatingFactor ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                                        Create factor
                                                    </Button>
                                                </form>
                            </SectionCard>
                        </TabsContent>
                    </Tabs>
                </TabsContent>
                <TabsContent value="simulation" className="space-y-6">
                    <Tabs
                        value={simulationView}
                        onValueChange={value => setSimulationView(value as 'setup' | 'insights')}
                        className="space-y-6"
                    >
                        <TabsList className="flex w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
                            <TabsTrigger value="setup" className="flex-1 min-w-[120px]">Setup</TabsTrigger>
                            <TabsTrigger value="insights" className="flex-1 min-w-[120px]">Insights</TabsTrigger>
                        </TabsList>

                        <TabsContent value="setup" className="space-y-6">
                            <SectionCard
                                title="Simulation Context"
                                description="Prepare factor values before running a pricing simulation."
                            >
                        <form onSubmit={handleSimulationSubmit} className="space-y-5">
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <div className="grid gap-3">
                                                            <Label htmlFor="sim-procedure">Procedure ID</Label>
                                                            <Input
                                                                id="sim-procedure"
                                                                type="number"
                                                                value={simulationForm.procedureId}
                                                                onChange={event => setSimulationForm(prev => ({ ...prev, procedureId: event.target.value }))}
                                                            />
                                                        </div>
                                                        <div className="grid gap-3">
                                                            <Label htmlFor="sim-price-list">Price list ID</Label>
                                                            <Input
                                                                id="sim-price-list"
                                                                type="number"
                                                                value={simulationForm.priceListId}
                                                                onChange={event => setSimulationForm(prev => ({ ...prev, priceListId: event.target.value }))}
                                                            />
                                                        </div>
                                                        <div className="grid gap-3">
                                                            <Label htmlFor="sim-insurance-degree">Insurance degree ID</Label>
                                                            <Input
                                                                id="sim-insurance-degree"
                                                                type="number"
                                                                value={simulationForm.insuranceDegreeId}
                                                                onChange={event => setSimulationForm(prev => ({ ...prev, insuranceDegreeId: event.target.value }))}
                                                            />
                                                        </div>
                                                        <div className="grid gap-3">
                                                            <Label htmlFor="sim-date">Evaluation date</Label>
                                                            <Input
                                                                id="sim-date"
                                                                type="date"
                                                                value={simulationForm.date}
                                                                onChange={event => setSimulationForm(prev => ({ ...prev, date: event.target.value }))}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="text-sm font-semibold text-slate-700">Dynamic factors</h3>
                                                            <Button type="button" variant="outline" size="sm" onClick={addSimulationEntry} disabled={factors.length === 0}>
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                Add factor
                                                            </Button>
                                                        </div>

                                                        {simulationEntries.length === 0 ? (
                                                            <p className={infoTextClass}>No factors selected yet. Add factors to test conditional pricing logic.</p>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                {simulationEntries.map(entry => {
                                                                    const factor = factors.find(item => item.key === entry.factorKey) ?? factors[0]
                                                                    const factorOptions = factors.map(item => (
                                                                        <SelectItem key={item.key} value={item.key}>
                                                                            {item.nameEn}
                                                                        </SelectItem>
                                                                    ))
                                                                    const allowedValues = factor ? parseAllowedValues(factor) : []
                                                                    const inputKind = factor ? resolveFactorInputKind(factor) : 'text'

                                                                    return (
                                                                        <div key={entry.id} className="rounded-lg border border-slate-200 p-4">
                                                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                                                                                <div className="flex-1 space-y-2">
                                                                                    <Label className="text-xs uppercase text-slate-500">Factor</Label>
                                                                                    <Select
                                                                                        value={entry.factorKey}
                                                                                        onValueChange={value => updateSimulationEntry(entry.id, { factorKey: value })}
                                                                                    >
                                                                                        <SelectTrigger>
                                                                                            <SelectValue placeholder="Select factor" />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>{factorOptions}</SelectContent>
                                                                                    </Select>
                                                                                </div>
                                                                                <div className="flex-1 space-y-2">
                                                                                    <Label className="text-xs uppercase text-slate-500">Value</Label>
                                                                                    {inputKind === 'boolean' ? (
                                                                                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                                                                            <Switch
                                                                                                checked={Boolean(entry.value)}
                                                                                                onCheckedChange={checked => updateSimulationEntry(entry.id, { value: checked })}
                                                                                            />
                                                                                            <span className="text-sm text-slate-700">{entry.value ? 'True' : 'False'}</span>
                                                                                        </div>
                                                                                    ) : inputKind === 'select' && allowedValues.length > 0 ? (
                                                                                        <select
                                                                                            multiple
                                                                                            value={Array.isArray(entry.value) ? entry.value.map(String) : entry.value ? [String(entry.value)] : []}
                                                                                            onChange={event =>
                                                                                                updateSimulationEntry(entry.id, {
                                                                                                    value: Array.from(event.target.selectedOptions).map(option => option.value),
                                                                                                })
                                                                                            }
                                                                                            className="h-28 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                                                                                        >
                                                                                            {allowedValues.map(option => (
                                                                                                <option key={option} value={option}>
                                                                                                    {option}
                                                                                                </option>
                                                                                            ))}
                                                                                        </select>
                                                                                    ) : (
                                                                                        <Input
                                                                                            type={inputKind === 'number' ? 'number' : inputKind === 'date' ? 'date' : 'text'}
                                                                                            value={Array.isArray(entry.value) ? entry.value.join(', ') : String(entry.value ?? '')}
                                                                                            onChange={event => updateSimulationEntry(entry.id, { value: event.target.value })}
                                                                                        />
                                                                                    )}
                                                                                </div>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="mt-6 text-slate-500 hover:text-red-600"
                                                                                    onClick={() => removeSimulationEntry(entry.id)}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {simulationError ? <p className="text-sm text-red-600">{simulationError}</p> : null}

                                                    <Button type="submit" className="w-full" disabled={simulationLoading}>
                                                        {simulationLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CircleDot className="mr-2 h-4 w-4" />}
                                                        Run simulation
                                                    </Button>
                                                </form>

                                {simulationResult ? (
                                    <div className="mt-6 space-y-4 rounded-lg border border-slate-200 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs uppercase text-slate-500">Final price</p>
                                                <p className="text-2xl font-semibold text-slate-900">{formatCurrency(simulationResult.price)}</p>
                                            </div>
                                            <Button type="button" variant="outline" onClick={() => setSimulationView('insights')}>
                                                <Info className="mr-2 h-4 w-4" />
                                                View breakdown
                                            </Button>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            Rule #{simulationResult.selectedRuleId ?? '—'} · Procedure {simulationResult.procedureId} · Price list {simulationResult.priceListId}
                                        </p>
                                    </div>
                                ) : null}
                            </SectionCard>
                        </TabsContent>

                        <TabsContent value="insights" className="space-y-6">
                            <SectionCard
                                title="Simulation Insights"
                                description="Analyze how rules, rates, and discounts produced the quoted price."
                            >
                                {simulationResult ? (
                                    <div className="space-y-3">
                                        <details className="rounded-lg border border-slate-200 p-4" open>
                                            <summary className="cursor-pointer font-medium text-slate-800">Selected Rule</summary>
                                            {simulationResult.selectedRule ? (
                                                <div className="mt-3 space-y-2 text-sm text-slate-700">
                                                    <p>Mode: {simulationResult.selectedRule.pricing.mode}</p>
                                                    {simulationResult.selectedRule.pricing.fixed_price ? (
                                                        <p>Fixed price: {formatCurrency(simulationResult.selectedRule.pricing.fixed_price)}</p>
                                                    ) : null}
                                                    {simulationResult.selectedRule.pricing.points ? (
                                                        <p>Points: {simulationResult.selectedRule.pricing.points}</p>
                                                    ) : null}
                                                    {simulationResult.selectedRule.pricing.min_price || simulationResult.selectedRule.pricing.max_price ? (
                                                        <p>
                                                            Range: {simulationResult.selectedRule.pricing.min_price ?? '—'} - {simulationResult.selectedRule.pricing.max_price ?? '—'}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <p className={infoTextClass}>No rule matched.</p>
                                            )}
                                        </details>

                                        <details className="rounded-lg border border-slate-200 p-4" open>
                                            <summary className="cursor-pointer font-medium text-slate-800">Condition Evaluation</summary>
                                            <div className="mt-3 space-y-2">
                                                {simulationResult.evaluatedRules.map(rule => (
                                                    <div key={rule.ruleId} className={cn('rounded-md border p-3 text-sm', rule.matched ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700')}>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium">Rule #{rule.ruleId}</span>
                                                            <span className="text-xs uppercase">Priority {rule.priority}</span>
                                                        </div>
                                                        {rule.failedConditions.length ? (
                                                            <ul className="mt-2 list-disc space-y-1 pl-5">
                                                                {rule.failedConditions.map(condition => (
                                                                    <li key={`${condition.factor}-${condition.operator}`}>{formatEvaluationCondition(condition)}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="mt-2 text-xs">All conditions matched.</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </details>

                                        <details className="rounded-lg border border-blue-200 bg-blue-50 p-4" open>
                                            <summary className="cursor-pointer font-medium text-blue-900">Point Rate</summary>
                                            {simulationResult.pointRateUsed ? (
                                                <div className="mt-3 text-sm text-blue-900">
                                                    <p>Point price: {simulationResult.pointRateUsed.pointPrice}</p>
                                                    <p>Valid: {formatDate(simulationResult.pointRateUsed.validFrom)} → {simulationResult.pointRateUsed.validTo ? formatDate(simulationResult.pointRateUsed.validTo) : 'Open-ended'}</p>
                                                </div>
                                            ) : (
                                                <p className="mt-3 text-sm text-blue-800">No point rate applied.</p>
                                            )}
                                        </details>

                                        <details className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                            <summary className="cursor-pointer font-medium text-blue-900">Discounts</summary>
                                            {simulationResult.discountApplied ? (
                                                <div className="mt-3 text-sm text-blue-900">
                                                    <p>Discount ID: {simulationResult.discountApplied.discountId}</p>
                                                    <p>Percent: {simulationResult.discountApplied.pct}%</p>
                                                    <p>
                                                        Period: {simulationResult.discountApplied.period} {simulationResult.discountApplied.unit}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="mt-3 text-sm text-blue-800">No discount applied.</p>
                                            )}
                                        </details>

                                        <details className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                            <summary className="cursor-pointer font-medium text-blue-900">Adjustments</summary>
                                            {simulationResult.adjustmentsApplied && simulationResult.adjustmentsApplied.length > 0 ? (
                                                <ul className="mt-3 space-y-2 text-sm text-blue-900">
                                                    {simulationResult.adjustmentsApplied.map((adjustment, index) => (
                                                        <li key={`${adjustment.factorKey}-${index}`}>
                                                            {adjustment.factorKey} → {adjustment.caseMatched}: {formatCurrency(adjustment.amount)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="mt-3 text-sm text-blue-800">No adjustments applied.</p>
                                            )}
                                        </details>
                                    </div>
                                ) : (
                                    <p className={infoTextClass}>Run a simulation to view pricing insights.</p>
                                )}
                            </SectionCard>
                        </TabsContent>
                    </Tabs>
                </TabsContent>
            </Tabs>
        </div>
    )
}
