'use client'

import React, {DragEvent, FormEvent, useEffect, useMemo, useState} from 'react'
import {
    BadgeCheck,
    CircleDot,
    Info,
    Loader2,
    Plus,
    RefreshCcw,
    Trash2,
} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Switch} from '@/components/ui/switch'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {
    calculatePricing,
    createPeriodDiscount,
    createPointRate,
    createPricingFactor,
    createPricingRule,
    fetchPeriodDiscounts,
    fetchPointRates,
    fetchPriceLists,
    fetchPricingFactors,
    fetchPricingRules,
    updatePointRate,
} from '@/lib/api/pricing'
import {searchProcedures} from '@/lib/api/procedures'
import {
    CreatePeriodDiscountPayload,
    CreatePointRatePayload,
    CreatePricingRulePayload,
    PaginatedResponse,
    PeriodDiscountRecord,
    PointRateRecord,
    PriceListSummary,
    PricingCalculationRequest,
    PricingCalculationResponse,
    PricingFactor,
    PricingMode,
    PricingRuleCondition,
    PricingRuleResponse,
    ProcedureSummary,
} from '@/types'
import {cn, formatCurrency, formatDate, generateId} from '@/lib/utils'
import {
    AdjustmentDraft,
    ConditionDraft,
    ConditionalFixedDraft,
    ContextEntryDraft,
    FactorEntryDraft,
    PricingTierDraft,
    DiscountLogicBlockDraft,
    AdjustmentTierDraft,
    AdjustmentLogicBlockDraft,
} from './procedures-price-lists-page/types'
import {
    FACTOR_LABELS,
    buildContextObject,
    buildDefaultCondition,
    buildFactorsObject,
    defaultOperatorForFactor,
    formatConditionValue,
    formatConditionValueDisplay,
    formatPriceListLabel,
    formatProcedureLabel,
    formatRulePricing,
    isRangeValue,
    operatorOptionsForFactor,
    parseAllowedValues,
    parseContextJson,
    parseRuleJson,
    resolveFactorInputKind,
    serializeConditionDraft,
} from './procedures-price-lists-page/helpers'
import {SectionCard} from './procedures-price-lists-page/section-card'
import {RuleConditionsDisplay} from './procedures-price-lists-page/rule-conditions-display'

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

    const [procedureSearchTerm, setProcedureSearchTerm] = useState('')
    const [procedureDropdownOpen, setProcedureDropdownOpen] = useState(false)
    const [procedureOptions, setProcedureOptions] = useState<ProcedureSummary[]>([])
    const [procedureSearchLoading, setProcedureSearchLoading] = useState(false)
    const [procedureSearchError, setProcedureSearchError] = useState<string | null>(null)
    const [selectedProcedure, setSelectedProcedure] = useState<ProcedureSummary | null>(null)

    const [priceListSearchTerm, setPriceListSearchTerm] = useState('')
    const [priceListDropdownOpen, setPriceListDropdownOpen] = useState(false)
    const [priceListOptions, setPriceListOptions] = useState<PriceListSummary[]>([])
    const [priceListSearchLoading, setPriceListSearchLoading] = useState(false)
    const [priceListSearchError, setPriceListSearchError] = useState<string | null>(null)
    const [selectedPriceList, setSelectedPriceList] = useState<PriceListSummary | null>(null)

    const [ruleForm, setRuleForm] = useState({
        procedureId: '',
        priceListId: '',
        priority: '1',
        validFrom: '',
        validTo: '',
        pricingMode: 'FIXED' as PricingMode,
        fixedPrice: '',
        points: '',
        basePoints: '',
        minPoints: '',
        maxPoints: '',
        pointStrategy: '',
        minPrice: '',
        maxPrice: '',
        discountApply: false,
        discountUnit: 'DAY',
        discountValue: '',
    })
    const [ruleConditions, setRuleConditions] = useState<ConditionDraft[]>([])
    const [pricingTiers, setPricingTiers] = useState<PricingTierDraft[]>([])
    const [conditionalFixed, setConditionalFixed] = useState<ConditionalFixedDraft[]>([])
    const [discountLogicBlocks, setDiscountLogicBlocks] = useState<DiscountLogicBlockDraft[]>([])
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
        if (!procedureDropdownOpen) {
            setProcedureSearchLoading(false)
            return
        }

        setProcedureSearchLoading(true)
        setProcedureSearchError(null)

        let cancelled = false
        const handler = setTimeout(() => {
            const term = procedureSearchTerm.trim()
            const filters = term ? {keyword: term} : {}

            searchProcedures({filters, page: 0, size: 10})
                .then(response => {
                    if (cancelled) {
                        return
                    }
                    setProcedureOptions(response.content)
                    setProcedureSearchError(null)
                })
                .catch(error => {
                    if (cancelled) {
                        return
                    }
                    setProcedureOptions([])
                    setProcedureSearchError(error instanceof Error ? error.message : 'Failed to search procedures')
                })
                .finally(() => {
                    if (!cancelled) {
                        setProcedureSearchLoading(false)
                    }
                })
        }, 300)

        return () => {
            cancelled = true
            clearTimeout(handler)
        }
    }, [procedureDropdownOpen, procedureSearchTerm])

    useEffect(() => {
        if (!priceListDropdownOpen) {
            setPriceListSearchLoading(false)
            return
        }

        setPriceListSearchLoading(true)
        setPriceListSearchError(null)

        let cancelled = false
        const handler = setTimeout(() => {
            const term = priceListSearchTerm.trim()

            fetchPriceLists({
                page: 0,
                size: 10,
                code: term || undefined,
                nameEn: term || undefined,
            })
                .then(response => {
                    if (cancelled) {
                        return
                    }
                    setPriceListOptions(response.content)
                    setPriceListSearchError(null)
                })
                .catch(error => {
                    if (cancelled) {
                        return
                    }
                    setPriceListOptions([])
                    setPriceListSearchError(error instanceof Error ? error.message : 'Failed to search price lists')
                })
                .finally(() => {
                    if (!cancelled) {
                        setPriceListSearchLoading(false)
                    }
                })
        }, 300)

        return () => {
            cancelled = true
            clearTimeout(handler)
        }
    }, [priceListDropdownOpen, priceListSearchTerm])

    useEffect(() => {
        let active = true
        setFactorsLoading(true)
        setFactorsError(null)

        fetchPricingFactors({page: 0, size: 200})
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

        fetchPointRates({page: 0, size: 50})
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

        fetchPricingRules({page: 0, size: 50})
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

        fetchPeriodDiscounts({page: 0, size: 50})
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

    const handleProcedureSelect = (procedure: ProcedureSummary) => {
        setSelectedProcedure(procedure)
        setRuleForm(prev => ({
            ...prev,
            procedureId: String(procedure.id),
        }))
        setProcedureDropdownOpen(false)
        setProcedureSearchTerm('')
    }

    const handlePriceListSelect = (priceList: PriceListSummary) => {
        setSelectedPriceList(priceList)
        setRuleForm(prev => ({
            ...prev,
            priceListId: String(priceList.id),
        }))
        setPriceListDropdownOpen(false)
        setPriceListSearchTerm('')
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
                    value: factor && operatorOptionsForFactor(factor)[0]?.requiresRange ? {min: '', max: ''} : '',
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
                    value: selectedOption?.requiresRange ? {
                        min: '',
                        max: ''
                    } : selectedOption?.supportsMultiple ? [] : '',
                }
            }),
        )
    }

    const handleConditionValueChange = (id: string, value: ConditionDraft['value']) => {
        setRuleConditions(prev => prev.map(condition => (condition.id === id ? {...condition, value} : condition)))
    }

    const handleRemoveCondition = (id: string) => {
        setRuleConditions(prev => prev.filter(condition => condition.id !== id))
    }

    const handleAddPricingTier = () => {
        setPricingTiers(prev => [
            ...prev,
            {
                id: generateId(),
                points: '',
                condition: factors.length > 0 ? buildDefaultCondition(factors) : null,
            },
        ])
    }

    const handlePricingTierPointsChange = (id: string, value: string) => {
        setPricingTiers(prev => prev.map(tier => (tier.id === id ? {...tier, points: value} : tier)))
    }

    const handleRemovePricingTier = (id: string) => {
        setPricingTiers(prev => prev.filter(tier => tier.id !== id))
    }

    const handleEnsurePricingTierCondition = (id: string) => {
        setPricingTiers(prev =>
            prev.map(tier =>
                tier.id === id && !tier.condition
                    ? {
                        ...tier,
                        condition: buildDefaultCondition(factors),
                    }
                    : tier,
            ),
        )
    }

    const handlePricingTierConditionFactorChange = (tierId: string, factorKey: string) => {
        setPricingTiers(prev =>
            prev.map(tier => {
                if (tier.id !== tierId) {
                    return tier
                }

                const nextCondition = tier.condition ?? buildDefaultCondition(factors)
                const factor = factors.find(item => item.key === factorKey)
                const defaultOperator = factor ? defaultOperatorForFactor(factor) : nextCondition.operator
                const operatorOptions = factor ? operatorOptionsForFactor(factor) : []
                const operatorConfig = operatorOptions.find(option => option.value === defaultOperator)

                return {
                    ...tier,
                    condition: {
                        ...nextCondition,
                        factorKey,
                        operator: defaultOperator,
                        value: operatorConfig?.requiresRange ? {
                            min: '',
                            max: ''
                        } : operatorConfig?.supportsMultiple ? [] : '',
                    },
                }
            }),
        )
    }

    const handlePricingTierConditionOperatorChange = (tierId: string, operator: string) => {
        setPricingTiers(prev =>
            prev.map(tier => {
                if (tier.id !== tierId || !tier.condition) {
                    return tier
                }

                const factor = factors.find(item => item.key === tier.condition?.factorKey)
                const options = factor ? operatorOptionsForFactor(factor) : []
                const selectedOption = options.find(option => option.value === operator)

                return {
                    ...tier,
                    condition: {
                        ...tier.condition,
                        operator,
                        value: selectedOption?.requiresRange ? {
                            min: '',
                            max: ''
                        } : selectedOption?.supportsMultiple ? [] : '',
                    },
                }
            }),
        )
    }

    const handlePricingTierConditionValueChange = (tierId: string, value: ConditionDraft['value']) => {
        setPricingTiers(prev =>
            prev.map(tier =>
                tier.id === tierId && tier.condition
                    ? {
                        ...tier,
                        condition: {
                            ...tier.condition,
                            value,
                        },
                    }
                    : tier,
            ),
        )
    }

    const handleRemovePricingTierCondition = (tierId: string) => {
        setPricingTiers(prev =>
            prev.map(tier =>
                tier.id === tierId
                    ? {
                        ...tier,
                        condition: null,
                    }
                    : tier,
            ),
        )
    }

    const handleAddConditionalFixed = () => {
        setConditionalFixed(prev => [
            ...prev,
            {
                id: generateId(),
                price: '',
                conditions: [],
            },
        ])
    }

    const handleConditionalFixedPriceChange = (id: string, value: string) => {
        setConditionalFixed(prev => prev.map(entry => (entry.id === id ? {...entry, price: value} : entry)))
    }

    const handleRemoveConditionalFixed = (id: string) => {
        setConditionalFixed(prev => prev.filter(entry => entry.id !== id))
    }

    const handleAddConditionalFixedCondition = (id: string) => {
        setConditionalFixed(prev =>
            prev.map(entry =>
                entry.id === id
                    ? {
                        ...entry,
                        conditions: [...entry.conditions, buildDefaultCondition(factors)],
                    }
                    : entry,
            ),
        )
    }

    const handleConditionalFixedConditionFactorChange = (entryId: string, conditionId: string, factorKey: string) => {
        setConditionalFixed(prev =>
            prev.map(entry => {
                if (entry.id !== entryId) {
                    return entry
                }

                return {
                    ...entry,
                    conditions: entry.conditions.map(condition => {
                        if (condition.id !== conditionId) {
                            return condition
                        }

                        const factor = factors.find(item => item.key === factorKey)
                        const defaultOperator = factor ? defaultOperatorForFactor(factor) : condition.operator
                        const options = factor ? operatorOptionsForFactor(factor) : []
                        const operatorConfig = options.find(option => option.value === defaultOperator)

                        return {
                            ...condition,
                            factorKey,
                            operator: defaultOperator,
                            value: operatorConfig?.requiresRange
                                ? {min: '', max: ''}
                                : operatorConfig?.supportsMultiple
                                    ? []
                                    : '',
                        }
                    }),
                }
            }),
        )
    }

    const handleConditionalFixedConditionOperatorChange = (entryId: string, conditionId: string, operator: string) => {
        setConditionalFixed(prev =>
            prev.map(entry => {
                if (entry.id !== entryId) {
                    return entry
                }

                return {
                    ...entry,
                    conditions: entry.conditions.map(condition => {
                        if (condition.id !== conditionId) {
                            return condition
                        }

                        const factor = factors.find(item => item.key === condition.factorKey)
                        const options = factor ? operatorOptionsForFactor(factor) : []
                        const selected = options.find(option => option.value === operator)

                        return {
                            ...condition,
                            operator,
                            value: selected?.requiresRange ? {min: '', max: ''} : selected?.supportsMultiple ? [] : '',
                        }
                    }),
                }
            }),
        )
    }

    const handleConditionalFixedConditionValueChange = (
        entryId: string,
        conditionId: string,
        value: ConditionDraft['value'],
    ) => {
        setConditionalFixed(prev =>
            prev.map(entry =>
                entry.id === entryId
                    ? {
                        ...entry,
                        conditions: entry.conditions.map(condition =>
                            condition.id === conditionId
                                ? {
                                    ...condition,
                                    value,
                                }
                                : condition,
                        ),
                    }
                    : entry,
            ),
        )
    }

    const handleRemoveConditionalFixedCondition = (entryId: string, conditionId: string) => {
        setConditionalFixed(prev =>
            prev.map(entry =>
                entry.id === entryId
                    ? {
                        ...entry,
                        conditions: entry.conditions.filter(condition => condition.id !== conditionId),
                    }
                    : entry,
            ),
        )
    }

    const handleAddDiscountLogicBlock = () => {
        setDiscountLogicBlocks(prev => [
            ...prev,
            {
                id: generateId(),
                percent: '',
                conditions: [],
            },
        ])
    }

    const handleDiscountLogicBlockPercentChange = (id: string, value: string) => {
        setDiscountLogicBlocks(prev => prev.map(block => (block.id === id ? {...block, percent: value} : block)))
    }

    const handleRemoveDiscountLogicBlock = (id: string) => {
        setDiscountLogicBlocks(prev => prev.filter(block => block.id !== id))
    }

    const handleAddDiscountLogicBlockCondition = (id: string) => {
        setDiscountLogicBlocks(prev =>
            prev.map(block =>
                block.id === id
                    ? {
                        ...block,
                        conditions: [...block.conditions, buildDefaultCondition(factors)],
                    }
                    : block,
            ),
        )
    }

    const handleDiscountLogicBlockConditionFactorChange = (blockId: string, conditionId: string, factorKey: string) => {
        setDiscountLogicBlocks(prev =>
            prev.map(block => {
                if (block.id !== blockId) {
                    return block
                }

                return {
                    ...block,
                    conditions: block.conditions.map(condition => {
                        if (condition.id !== conditionId) {
                            return condition
                        }

                        const factor = factors.find(item => item.key === factorKey)
                        const defaultOperator = factor ? defaultOperatorForFactor(factor) : condition.operator
                        const options = factor ? operatorOptionsForFactor(factor) : []
                        const operatorConfig = options.find(option => option.value === defaultOperator)

                        return {
                            ...condition,
                            factorKey,
                            operator: defaultOperator,
                            value: operatorConfig?.requiresRange
                                ? {min: '', max: ''}
                                : operatorConfig?.supportsMultiple
                                    ? []
                                    : '',
                        }
                    }),
                }
            }),
        )
    }

    const handleDiscountLogicBlockConditionOperatorChange = (
        blockId: string,
        conditionId: string,
        operator: string,
    ) => {
        setDiscountLogicBlocks(prev =>
            prev.map(block => {
                if (block.id !== blockId) {
                    return block
                }

                return {
                    ...block,
                    conditions: block.conditions.map(condition => {
                        if (condition.id !== conditionId) {
                            return condition
                        }

                        const factor = factors.find(item => item.key === condition.factorKey)
                        const options = factor ? operatorOptionsForFactor(factor) : []
                        const selected = options.find(option => option.value === operator)

                        return {
                            ...condition,
                            operator,
                            value: selected?.requiresRange ? {min: '', max: ''} : selected?.supportsMultiple ? [] : '',
                        }
                    }),
                }
            }),
        )
    }

    const handleDiscountLogicBlockConditionValueChange = (
        blockId: string,
        conditionId: string,
        value: ConditionDraft['value'],
    ) => {
        setDiscountLogicBlocks(prev =>
            prev.map(block =>
                block.id === blockId
                    ? {
                        ...block,
                        conditions: block.conditions.map(condition =>
                            condition.id === conditionId
                                ? {
                                    ...condition,
                                    value,
                                }
                                : condition,
                        ),
                    }
                    : block,
            ),
        )
    }

    const handleRemoveDiscountLogicBlockCondition = (blockId: string, conditionId: string) => {
        setDiscountLogicBlocks(prev =>
            prev.map(block =>
                block.id === blockId
                    ? {
                        ...block,
                        conditions: block.conditions.filter(condition => condition.id !== conditionId),
                    }
                    : block,
            ),
        )
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
                tiers: [],
                logicBlocks: [],
            },
        ])
    }

    const handleAdjustmentChange = (id: string, patch: Partial<AdjustmentDraft>) => {
        setRuleAdjustments(prev => prev.map(adjustment => (adjustment.id === id ? {...adjustment, ...patch} : adjustment)))
    }

    const handleAdjustmentCaseChange = (adjustmentId: string, caseId: string, patch: Partial<AdjustmentCaseDraft>) => {
        setRuleAdjustments(prev =>
            prev.map(adjustment => {
                if (adjustment.id !== adjustmentId) {
                    return adjustment
                }

                return {
                    ...adjustment,
                    cases: adjustment.cases.map(entry => (entry.id === caseId ? {...entry, ...patch} : entry)),
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

    const handleAddAdjustmentTier = (adjustmentId: string) => {
        setRuleAdjustments(prev =>
            prev.map(adjustment =>
                adjustment.id === adjustmentId
                    ? {
                        ...adjustment,
                        tiers: [
                            ...adjustment.tiers,
                            {
                                id: generateId(),
                                value: '',
                                add: '',
                                percent: '',
                            },
                        ],
                    }
                    : adjustment,
            ),
        )
    }

    const handleAdjustmentTierChange = (adjustmentId: string, tierId: string, patch: Partial<AdjustmentTierDraft>) => {
        setRuleAdjustments(prev =>
            prev.map(adjustment =>
                adjustment.id === adjustmentId
                    ? {
                        ...adjustment,
                        tiers: adjustment.tiers.map(tier => (tier.id === tierId ? {...tier, ...patch} : tier)),
                    }
                    : adjustment,
            ),
        )
    }

    const handleRemoveAdjustmentTier = (adjustmentId: string, tierId: string) => {
        setRuleAdjustments(prev =>
            prev.map(adjustment =>
                adjustment.id === adjustmentId
                    ? {
                        ...adjustment,
                        tiers: adjustment.tiers.filter(tier => tier.id !== tierId),
                    }
                    : adjustment,
            ),
        )
    }

    const handleAddAdjustmentLogicBlock = (adjustmentId: string) => {
        setRuleAdjustments(prev =>
            prev.map(adjustment =>
                adjustment.id === adjustmentId
                    ? {
                        ...adjustment,
                        logicBlocks: [
                            ...adjustment.logicBlocks,
                            {
                                id: generateId(),
                                add: '',
                                addPercent: '',
                                conditions: [],
                            },
                        ],
                    }
                    : adjustment,
            ),
        )
    }

    const handleAdjustmentLogicBlockChange = (
        adjustmentId: string,
        blockId: string,
        patch: Partial<AdjustmentLogicBlockDraft>,
    ) => {
        setRuleAdjustments(prev =>
            prev.map(adjustment =>
                adjustment.id === adjustmentId
                    ? {
                        ...adjustment,
                        logicBlocks: adjustment.logicBlocks.map(block =>
                            block.id === blockId
                                ? {
                                    ...block,
                                    ...patch,
                                }
                                : block,
                        ),
                    }
                    : adjustment,
            ),
        )
    }

    const handleRemoveAdjustmentLogicBlock = (adjustmentId: string, blockId: string) => {
        setRuleAdjustments(prev =>
            prev.map(adjustment =>
                adjustment.id === adjustmentId
                    ? {
                        ...adjustment,
                        logicBlocks: adjustment.logicBlocks.filter(block => block.id !== blockId),
                    }
                    : adjustment,
            ),
        )
    }

    const handleAddAdjustmentLogicBlockCondition = (adjustmentId: string, blockId: string) => {
        setRuleAdjustments(prev =>
            prev.map(adjustment =>
                adjustment.id === adjustmentId
                    ? {
                        ...adjustment,
                        logicBlocks: adjustment.logicBlocks.map(block =>
                            block.id === blockId
                                ? {
                                    ...block,
                                    conditions: [...block.conditions, buildDefaultCondition(factors)],
                                }
                                : block,
                        ),
                    }
                    : adjustment,
            ),
        )
    }

    const handleAdjustmentLogicBlockConditionFactorChange = (
        adjustmentId: string,
        blockId: string,
        conditionId: string,
        factorKey: string,
    ) => {
        setRuleAdjustments(prev =>
            prev.map(adjustment => {
                if (adjustment.id !== adjustmentId) {
                    return adjustment
                }

                return {
                    ...adjustment,
                    logicBlocks: adjustment.logicBlocks.map(block => {
                        if (block.id !== blockId) {
                            return block
                        }

                        return {
                            ...block,
                            conditions: block.conditions.map(condition => {
                                if (condition.id !== conditionId) {
                                    return condition
                                }

                                const factor = factors.find(item => item.key === factorKey)
                                const defaultOperator = factor ? defaultOperatorForFactor(factor) : condition.operator
                                const options = factor ? operatorOptionsForFactor(factor) : []
                                const operatorConfig = options.find(option => option.value === defaultOperator)

                                return {
                                    ...condition,
                                    factorKey,
                                    operator: defaultOperator,
                                    value: operatorConfig?.requiresRange
                                        ? {min: '', max: ''}
                                        : operatorConfig?.supportsMultiple
                                            ? []
                                            : '',
                                }
                            }),
                        }
                    }),
                }
            }),
        )
    }

    const handleAdjustmentLogicBlockConditionOperatorChange = (
        adjustmentId: string,
        blockId: string,
        conditionId: string,
        operator: string,
    ) => {
        setRuleAdjustments(prev =>
            prev.map(adjustment => {
                if (adjustment.id !== adjustmentId) {
                    return adjustment
                }

                return {
                    ...adjustment,
                    logicBlocks: adjustment.logicBlocks.map(block => {
                        if (block.id !== blockId) {
                            return block
                        }

                        return {
                            ...block,
                            conditions: block.conditions.map(condition => {
                                if (condition.id !== conditionId) {
                                    return condition
                                }

                                const factor = factors.find(item => item.key === condition.factorKey)
                                const options = factor ? operatorOptionsForFactor(factor) : []
                                const selected = options.find(option => option.value === operator)

                                return {
                                    ...condition,
                                    operator,
                                    value: selected?.requiresRange
                                        ? {min: '', max: ''}
                                        : selected?.supportsMultiple
                                            ? []
                                            : '',
                                }
                            }),
                        }
                    }),
                }
            }),
        )
    }

    const handleAdjustmentLogicBlockConditionValueChange = (
        adjustmentId: string,
        blockId: string,
        conditionId: string,
        value: ConditionDraft['value'],
    ) => {
        setRuleAdjustments(prev =>
            prev.map(adjustment =>
                adjustment.id === adjustmentId
                    ? {
                        ...adjustment,
                        logicBlocks: adjustment.logicBlocks.map(block =>
                            block.id === blockId
                                ? {
                                    ...block,
                                    conditions: block.conditions.map(condition =>
                                        condition.id === conditionId
                                            ? {
                                                ...condition,
                                                value,
                                            }
                                            : condition,
                                    ),
                                }
                                : block,
                        ),
                    }
                    : adjustment,
            ),
        )
    }

    const handleRemoveAdjustmentLogicBlockCondition = (
        adjustmentId: string,
        blockId: string,
        conditionId: string,
    ) => {
        setRuleAdjustments(prev =>
            prev.map(adjustment =>
                adjustment.id === adjustmentId
                    ? {
                        ...adjustment,
                        logicBlocks: adjustment.logicBlocks.map(block =>
                            block.id === blockId
                                ? {
                                    ...block,
                                    conditions: block.conditions.filter(condition => condition.id !== conditionId),
                                }
                                : block,
                        ),
                    }
                    : adjustment,
            ),
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
            .map(condition => serializeConditionDraft(condition))

        const pricingTierPayload = pricingTiers
            .filter(tier => tier.points.trim() !== '')
            .map(tier => ({
                points: Number(tier.points),
                condition: tier.condition ? serializeConditionDraft(tier.condition) : undefined,
            }))

        const conditionalFixedPayload = conditionalFixed
            .filter(entry => entry.price.trim() !== '')
            .map(entry => ({
                price: Number(entry.price),
                conditions: entry.conditions.map(serializeConditionDraft),
            }))

        const discountLogicBlocksPayload = discountLogicBlocks
            .filter(block => block.percent.trim() !== '' || block.conditions.length > 0)
            .map(block => ({
                percent: block.percent !== '' ? Number(block.percent) : undefined,
                whenConditions: block.conditions.map(serializeConditionDraft),
            }))

        const payload: CreatePricingRulePayload = {
            procedureId: Number(ruleForm.procedureId),
            priceListId: Number(ruleForm.priceListId),
            priority: Number(ruleForm.priority || '0'),
            validFrom: ruleForm.validFrom,
            validTo: ruleForm.validTo || null,
            conditions,
            pricing: {
                mode: ruleForm.pricingMode,
                fixedPrice: ruleForm.fixedPrice !== '' ? Number(ruleForm.fixedPrice) : undefined,
                points: ruleForm.points !== '' ? Number(ruleForm.points) : undefined,
                basePoints: ruleForm.basePoints !== '' ? Number(ruleForm.basePoints) : undefined,
                minPoints: ruleForm.minPoints !== '' ? Number(ruleForm.minPoints) : undefined,
                maxPoints: ruleForm.maxPoints !== '' ? Number(ruleForm.maxPoints) : undefined,
                pointStrategy: ruleForm.pointStrategy || undefined,
                minPrice: ruleForm.minPrice !== '' ? Number(ruleForm.minPrice) : undefined,
                maxPrice: ruleForm.maxPrice !== '' ? Number(ruleForm.maxPrice) : undefined,
                tiers: pricingTierPayload.length > 0 ? pricingTierPayload : undefined,
                conditionalFixed: conditionalFixedPayload.length > 0 ? conditionalFixedPayload : undefined,
            },
            discount: {
                apply: ruleForm.discountApply,
                period_unit: ruleForm.discountApply ? ruleForm.discountUnit : undefined,
                period_value:
                    ruleForm.discountApply && ruleForm.discountValue !== ''
                        ? Number(ruleForm.discountValue)
                        : undefined,
                logicBlocks:
                    ruleForm.discountApply && discountLogicBlocksPayload.length > 0
                        ? discountLogicBlocksPayload
                        : undefined,
            },
            adjustments: ruleAdjustments.map(adjustment => {
                const cases = adjustment.cases.reduce<Record<string, unknown>>((accumulator, entry) => {
                    const caseKey = entry.caseValue.trim()
                    const rawAmount = entry.amount.trim()

                    if (!caseKey || rawAmount === '') {
                        return accumulator
                    }

                    if (rawAmount.startsWith('{') || rawAmount.startsWith('[')) {
                        try {
                            accumulator[caseKey] = JSON.parse(rawAmount)
                            return accumulator
                        } catch {
                            // fall back to generic parsing
                        }
                    }

                    if (!Number.isNaN(Number(rawAmount))) {
                        accumulator[caseKey] = Number(rawAmount)
                        return accumulator
                    }

                    if (rawAmount.toLowerCase() === 'true' || rawAmount.toLowerCase() === 'false') {
                        accumulator[caseKey] = rawAmount.toLowerCase() === 'true'
                        return accumulator
                    }

                    accumulator[caseKey] = rawAmount
                    return accumulator
                }, {})

                const tiers = adjustment.tiers
                    .filter(tier => tier.value.trim() !== '' || tier.add.trim() !== '' || tier.percent.trim() !== '')
                    .map(tier => ({
                        value: tier.value.trim() || undefined,
                        add: tier.add.trim() !== '' ? Number(tier.add) : undefined,
                        percent: tier.percent.trim() !== '' ? Number(tier.percent) : undefined,
                    }))

                const logicBlocks = adjustment.logicBlocks
                    .filter(block => block.add.trim() !== '' || block.addPercent.trim() !== '' || block.conditions.length > 0)
                    .map(block => ({
                        add: block.add.trim() !== '' ? Number(block.add) : undefined,
                        addPercent: block.addPercent.trim() !== '' ? Number(block.addPercent) : undefined,
                        whenConditions: block.conditions.map(serializeConditionDraft),
                    }))

                return {
                    type: adjustment.type,
                    factorKey: adjustment.factorKey,
                    percent: adjustment.percent ? Number(adjustment.percent) : undefined,
                    cases,
                    tiers: tiers.length > 0 ? tiers : undefined,
                    logicBlocks: logicBlocks.length > 0 ? logicBlocks : undefined,
                }
            }),
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
            setNewFactorForm({key: '', nameEn: '', nameAr: '', dataType: 'TEXT', allowedValues: ''})
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
        fetchPricingFactors({page: 0, size: 200})
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
        setSimulationEntries(prev => prev.map(entry => (entry.id === id ? {...entry, ...patch} : entry)))
    }

    const removeSimulationEntry = (id: string) => {
        setSimulationEntries(prev => prev.filter(entry => entry.id !== id))
    }

    const addPointRateContextEntry = () => {
        setPointRateContextEntries(prev => [...prev, {id: generateId(), key: '', value: ''}])
    }

    const updatePointRateContextEntry = (id: string, patch: Partial<ContextEntryDraft>) => {
        setPointRateContextEntries(prev => prev.map(entry => (entry.id === id ? {...entry, ...patch} : entry)))
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
                    factorLabel: (factor?.nameEn ?? condition.factorKey) || "Select factor",
                    dataType: factor?.dataType ?? '—',
                    operatorLabel,
                    valueLabel: formatConditionValueDisplay(condition, factor),
                }
            }),
        [ruleConditions, factors],
    )

    const pricingStrategySummary = useMemo(() => {
        let summary: string

        if (ruleForm.pricingMode === 'FIXED') {
            const hasValue = ruleForm.fixedPrice !== ''
            summary = hasValue ? formatCurrency(Number(ruleForm.fixedPrice)) : 'Awaiting fixed price'
        } else if (ruleForm.pricingMode === 'POINTS') {
            const hasValue = ruleForm.points !== ''
            summary = hasValue ? `${ruleForm.points} pts × point price` : 'Awaiting points value'
        } else {
            const hasMin = ruleForm.minPrice !== ''
            const hasMax = ruleForm.maxPrice !== ''
            summary = hasMin || hasMax
                ? `${hasMin ? formatCurrency(Number(ruleForm.minPrice)) : '—'} → ${hasMax ? formatCurrency(Number(ruleForm.maxPrice)) : '—'}`
                : 'Awaiting range values'
        }

        const tierCount = pricingTiers.length
        const conditionalCount = conditionalFixed.length

        if (tierCount > 0 || conditionalCount > 0) {
            const badges: string[] = []
            if (tierCount > 0) {
                badges.push(`${tierCount} tier${tierCount > 1 ? 's' : ''}`)
            }
            if (conditionalCount > 0) {
                badges.push(`${conditionalCount} conditional price${conditionalCount > 1 ? 's' : ''}`)
            }
            summary = `${summary} · ${badges.join(' + ')}`
        }

        return summary
    }, [
        ruleForm.pricingMode,
        ruleForm.fixedPrice,
        ruleForm.points,
        ruleForm.minPrice,
        ruleForm.maxPrice,
        pricingTiers.length,
        conditionalFixed.length,
    ])

    const discountSummary = useMemo(() => {
        if (!ruleForm.discountApply) {
            return 'No discount configured'
        }

        const value = ruleForm.discountValue !== '' ? ruleForm.discountValue : '—'
        const unit = ruleForm.discountUnit || 'Unit'
        const logicCount = discountLogicBlocks.length
        const suffix = logicCount > 0 ? ` · ${logicCount} conditional block${logicCount > 1 ? 's' : ''}` : ''
        return `${value} ${unit}${suffix}`
    }, [ruleForm.discountApply, ruleForm.discountUnit, ruleForm.discountValue, discountLogicBlocks.length])

    const adjustmentMatrix = useMemo(
        () =>
            ruleAdjustments.map(adjustment => {
                const factor = factors.find(item => item.key === adjustment.factorKey)
                return {
                    id: adjustment.id,
                    type: adjustment.type,
                    factorLabel: (factor?.nameEn ?? adjustment.factorKey) || "—",
                    percent: adjustment.percent,
                    cases: adjustment.cases.map(entry => ({
                        id: entry.id,
                        caseValue: entry.caseValue || '—',
                        amount: entry.amount || '—',
                    })),
                    tiers: adjustment.tiers,
                    logicBlocks: adjustment.logicBlocks,
                }
            }),
        [ruleAdjustments, factors],
    )

    // @ts-ignore

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-6">
                <h1 className="text-2xl font-semibold text-slate-900">Procedure Pricing Management</h1>
                <p className="text-sm text-slate-600">
                    Build dynamic pricing factors and rules, manage point rates, and simulate pricing outcomes with
                    real-time feedback.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="flex w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                    <TabsTrigger value="rules" className="flex-1 min-w-[120px]">Rules</TabsTrigger>
                    <TabsTrigger value="point-rates" className="flex-1 min-w-[120px]">Point Rates</TabsTrigger>
                    <TabsTrigger value="period-discounts" className="flex-1 min-w-[120px]">Period
                        Discounts</TabsTrigger>
                    <TabsTrigger value="factors" className="flex-1 min-w-[120px]">Factors</TabsTrigger>
                    <TabsTrigger value="simulation" className="flex-1 min-w-[120px]">Simulation</TabsTrigger>
                </TabsList>

                <TabsContent value="rules" className="space-y-6">
                    <Tabs
                        value={rulesView}
                        onValueChange={value => setRulesView(value as 'builder' | 'visualizer' | 'library')}
                        className="space-y-6"
                    >
                        <TabsList
                            className="flex w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
                            <TabsTrigger value="builder" className="flex-1 min-w-[120px]">Builder</TabsTrigger>
                            <TabsTrigger value="visualizer" className="flex-1 min-w-[120px]">Matrix</TabsTrigger>
                            <TabsTrigger value="library" className="flex-1 min-w-[120px]">Listing</TabsTrigger>
                        </TabsList>

                        <TabsContent value="builder" className="space-y-6">
                            <SectionCard
                                title="Dynamic Rule Builder"
                                description="Compose pricing rules through guided steps and instant visual feedback."
                                actions={
                                    <Button variant="outline" size="sm" onClick={refreshPricingRules}
                                            disabled={pricingRulesLoading}>
                                        {pricingRulesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> :
                                            <RefreshCcw className="mr-2 h-4 w-4"/>}
                                        Reload rules
                                    </Button>
                                }
                            >
                                {pricingRulesError ? <p className="text-sm text-red-600">{pricingRulesError}</p> : null}
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="rule-procedure">Procedure</Label>
                                            <div className="relative">
                                                <Input
                                                    id="rule-procedure"
                                                    type="text"
                                                    autoComplete="off"
                                                    placeholder="Search procedure by code or name"
                                                    value={
                                                        procedureDropdownOpen
                                                            ? procedureSearchTerm
                                                            : selectedProcedure
                                                                ? formatProcedureLabel(selectedProcedure)
                                                                : procedureSearchTerm
                                                    }
                                                    onChange={event => {
                                                        const value = event.target.value
                                                        setProcedureSearchTerm(value)
                                                        setProcedureDropdownOpen(true)
                                                        setSelectedProcedure(null)
                                                        setRuleForm(prev =>
                                                            prev.procedureId === ''
                                                                ? prev
                                                                : {
                                                                    ...prev,
                                                                    procedureId: '',
                                                                },
                                                        )
                                                    }}
                                                    onFocus={() => {
                                                        setProcedureDropdownOpen(true)
                                                        setProcedureSearchTerm(prev =>
                                                            prev === '' && selectedProcedure
                                                                ? formatProcedureLabel(selectedProcedure)
                                                                : prev,
                                                        )
                                                    }}
                                                    onBlur={() => {
                                                        setTimeout(() => setProcedureDropdownOpen(false), 150)
                                                    }}
                                                />
                                                {procedureSearchLoading ? (
                                                    <Loader2
                                                        className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400"/>
                                                ) : null}
                                                {procedureDropdownOpen && (
                                                    <div
                                                        className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                                                        {procedureSearchLoading ? (
                                                            <div className="px-3 py-2 text-sm text-slate-500">Searching
                                                                procedures…</div>
                                                        ) : procedureSearchError ? (
                                                            <div
                                                                className="px-3 py-2 text-sm text-red-600">{procedureSearchError}</div>
                                                        ) : procedureOptions.length === 0 ? (
                                                            <div className="px-3 py-2 text-sm text-slate-500">No
                                                                procedures found.</div>
                                                        ) : (
                                                            procedureOptions.map(procedure => (
                                                                <button
                                                                    key={procedure.id}
                                                                    type="button"
                                                                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-slate-100"
                                                                    onMouseDown={event => event.preventDefault()}
                                                                    onClick={() => handleProcedureSelect(procedure)}
                                                                >
                                                                    <span
                                                                        className="text-sm font-medium text-slate-700">
                                                                        {formatProcedureLabel(procedure)}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500">
                                                                        ID: {procedure.id} · System: {procedure.systemCode}
                                                                    </span>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                {selectedProcedure
                                                    ? `${formatProcedureLabel(selectedProcedure)} (ID: ${selectedProcedure.id})`
                                                    : ruleForm.procedureId
                                                        ? `Selected procedure ID: ${ruleForm.procedureId}`
                                                        : 'Type to search and select a procedure.'}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="rule-price-list">Price list</Label>
                                            <div className="relative">
                                                <Input
                                                    id="rule-price-list"
                                                    type="text"
                                                    autoComplete="off"
                                                    placeholder="Search price list by code or name"
                                                    value={
                                                        priceListDropdownOpen
                                                            ? priceListSearchTerm
                                                            : selectedPriceList
                                                                ? formatPriceListLabel(selectedPriceList)
                                                                : priceListSearchTerm
                                                    }
                                                    onChange={event => {
                                                        const value = event.target.value
                                                        setPriceListSearchTerm(value)
                                                        setPriceListDropdownOpen(true)
                                                        setSelectedPriceList(null)
                                                        setRuleForm(prev =>
                                                            prev.priceListId === ''
                                                                ? prev
                                                                : {
                                                                    ...prev,
                                                                    priceListId: '',
                                                                },
                                                        )
                                                    }}
                                                    onFocus={() => {
                                                        setPriceListDropdownOpen(true)
                                                        setPriceListSearchTerm(prev =>
                                                            prev === '' && selectedPriceList
                                                                ? formatPriceListLabel(selectedPriceList)
                                                                : prev,
                                                        )
                                                    }}
                                                    onBlur={() => {
                                                        setTimeout(() => setPriceListDropdownOpen(false), 150)
                                                    }}
                                                />
                                                {priceListSearchLoading ? (
                                                    <Loader2
                                                        className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400"/>
                                                ) : null}
                                                {priceListDropdownOpen && (
                                                    <div
                                                        className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                                                        {priceListSearchLoading ? (
                                                            <div className="px-3 py-2 text-sm text-slate-500">Searching
                                                                price lists…</div>
                                                        ) : priceListSearchError ? (
                                                            <div
                                                                className="px-3 py-2 text-sm text-red-600">{priceListSearchError}</div>
                                                        ) : priceListOptions.length === 0 ? (
                                                            <div className="px-3 py-2 text-sm text-slate-500">No price
                                                                lists found.</div>
                                                        ) : (
                                                            priceListOptions.map(priceList => (
                                                                <button
                                                                    key={priceList.id}
                                                                    type="button"
                                                                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-slate-100"
                                                                    onMouseDown={event => event.preventDefault()}
                                                                    onClick={() => handlePriceListSelect(priceList)}
                                                                >
                                                                    <span
                                                                        className="text-sm font-medium text-slate-700">
                                                                        {formatPriceListLabel(priceList)}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500">
                                                                        ID: {priceList.id}
                                                                        {priceList.regionName ? ` · Region: ${priceList.regionName}` : ''}
                                                                        {` · Valid: ${priceList.validFrom} → ${priceList.validTo ?? 'Open-ended'}`}
                                                                    </span>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                {selectedPriceList
                                                    ? `${formatPriceListLabel(selectedPriceList)} (ID: ${selectedPriceList.id})`
                                                    : ruleForm.priceListId
                                                        ? `Selected price list ID: ${ruleForm.priceListId}`
                                                        : 'Type to search and select a price list.'}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="rule-priority">Priority</Label>
                                            <Input
                                                id="rule-priority"
                                                type="number"
                                                min={0}
                                                value={ruleForm.priority}
                                                onChange={event => setRuleForm(prev => ({
                                                    ...prev,
                                                    priority: event.target.value
                                                }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="rule-valid-from">Valid from</Label>
                                            <Input
                                                id="rule-valid-from"
                                                type="date"
                                                value={ruleForm.validFrom}
                                                onChange={event => setRuleForm(prev => ({
                                                    ...prev,
                                                    validFrom: event.target.value
                                                }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="rule-valid-to">Valid to</Label>
                                            <Input
                                                id="rule-valid-to"
                                                type="date"
                                                value={ruleForm.validTo}
                                                onChange={event => setRuleForm(prev => ({
                                                    ...prev,
                                                    validTo: event.target.value
                                                }))}
                                            />
                                        </div>
                                    </div>
                                    <Tabs defaultValue="conditions" className="space-y-4">
                                        <TabsList
                                            className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-1">
                                            <TabsTrigger value="conditions" className="text-sm">Conditions</TabsTrigger>
                                            <TabsTrigger value="pricing" className="text-sm">Pricing</TabsTrigger>
                                            <TabsTrigger value="adjustments"
                                                         className="text-sm">Adjustments</TabsTrigger>
                                            <TabsTrigger value="discounts" className="text-sm">Discounts</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="conditions" className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-slate-700">Conditions (AND logic)</h3>
                                                <Button type="button" variant="outline" size="sm"
                                                        onClick={handleAddCondition} disabled={factors.length === 0}>
                                                    <Plus className="mr-2 h-4 w-4"/>
                                                    Add condition
                                                </Button>
                                            </div>

                                            {ruleConditions.length === 0 ? (
                                                <p className={infoTextClass}>No conditions yet. Create at least one factor-driven condition.</p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {ruleConditions.map(condition => {
                                                        const factor = factors.find(f => f.key === condition.factorKey) ?? factors[0]
                                                        const options = factor ? operatorOptionsForFactor(factor) : []
                                                        const allowedValues = factor ? parseAllowedValues(factor) : []
                                                        const inputKind = factor ? resolveFactorInputKind(factor, condition.operator) : 'text'
                                                        const selectedOption = options.find(o => o.value === condition.operator)

                                                        return (
                                                            <div key={condition.id}
                                                                 className="rounded-lg border border-slate-200 p-4 shadow-sm">

                                                                {/* Factor + Operator + Delete */}
                                                                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px]">
                                                                    {/* Factor */}
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs uppercase text-slate-500">Factor</Label>
                                                                        <Select
                                                                            value={condition.factorKey}
                                                                            onValueChange={value => handleConditionFactorChange(condition.id, value)}
                                                                        >
                                                                            <SelectTrigger><SelectValue placeholder="Select factor"/></SelectTrigger>
                                                                            <SelectContent>
                                                                                {factors.map(item => (
                                                                                    <SelectItem key={item.key} value={item.key}>{item.nameEn}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>

                                                                    {/* Operator */}
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs uppercase text-slate-500">Operator</Label>
                                                                        <Select
                                                                            value={condition.operator}
                                                                            onValueChange={value => handleConditionOperatorChange(condition.id, value)}
                                                                        >
                                                                            <SelectTrigger><SelectValue placeholder="Select operator"/></SelectTrigger>
                                                                            <SelectContent>
                                                                                {options.map(option => (
                                                                                    <SelectItem key={option.value} value={option.value}>
                                                                                        {option.label}
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>

                                                                    {/* Delete */}
                                                                    <div className="flex items-start justify-end">
                                                                        <Button type="button" variant="ghost" size="icon"
                                                                                className="text-slate-500 hover:text-red-600"
                                                                                onClick={() => handleRemoveCondition(condition.id)}>
                                                                            <Trash2 className="h-4 w-4"/>
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* Value */}
                                                                <div className="mt-4 space-y-2">
                                                                    <Label className="text-xs uppercase text-slate-500">Value</Label>

                                                                    {selectedOption?.requiresRange ? (
                                                                        (() => {
                                                                            const isRange = isRangeValue(condition.value);
                                                                            const minVal = isRange ? condition.value.min ?? "" : "";
                                                                            const maxVal = isRange ? condition.value.max ?? "" : "";

                                                                            return (
                                                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                                                    <Input
                                                                                        type={inputKind === 'date' ? 'date' : 'number'}
                                                                                        placeholder="Min"
                                                                                        value={minVal}
                                                                                        onChange={(event) =>
                                                                                            handleConditionValueChange(condition.id, {
                                                                                                min: event.target.value,
                                                                                                max: maxVal,
                                                                                            })
                                                                                        }
                                                                                    />

                                                                                    <Input
                                                                                        type={inputKind === 'date' ? 'date' : 'number'}
                                                                                        placeholder="Max"
                                                                                        value={maxVal}
                                                                                        onChange={(event) =>
                                                                                            handleConditionValueChange(condition.id, {
                                                                                                min: minVal,
                                                                                                max: event.target.value,
                                                                                            })
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                            );
                                                                        })()
                                                                    )  : selectedOption?.supportsMultiple && allowedValues.length > 0 ? (
                                                                        // MULTI
                                                                        <select
                                                                            multiple
                                                                            className="h-32 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                                                                            value={Array.isArray(condition.value)
                                                                                ? condition.value.map(String)
                                                                                : condition.value
                                                                                    ? [String(condition.value)]
                                                                                    : []}
                                                                            onChange={event =>
                                                                                handleConditionValueChange(
                                                                                    condition.id,
                                                                                    Array.from(event.target.selectedOptions).map(o => o.value)
                                                                                )
                                                                            }
                                                                        >
                                                                            {allowedValues.map(val => (
                                                                                <option key={val} value={val}>{val}</option>
                                                                            ))}
                                                                        </select>
                                                                    ) : inputKind === 'boolean' ? (
                                                                        // BOOLEAN
                                                                        <div className="flex items-center gap-3">
                                                                            <Switch
                                                                                checked={Boolean(condition.value)}
                                                                                onCheckedChange={checked =>
                                                                                    handleConditionValueChange(condition.id, checked)
                                                                                }
                                                                            />
                                                                            <span className="text-sm text-slate-700">
                                        {condition.value ? 'True' : 'False'}
                                    </span>
                                                                        </div>
                                                                    ) : (
                                                                        // TEXT / NUMBER / DATE
                                                                        <Input
                                                                            type={
                                                                                inputKind === 'number'
                                                                                    ? 'number'
                                                                                    : inputKind === 'date'
                                                                                        ? 'date'
                                                                                        : 'text'
                                                                            }
                                                                            value={
                                                                                Array.isArray(condition.value)
                                                                                    ? condition.value.join(',')
                                                                                    : String(condition.value ?? '')
                                                                            }
                                                                            onChange={event =>
                                                                                handleConditionValueChange(condition.id, event.target.value)
                                                                            }
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </TabsContent>
                                        <TabsContent value="pricing" className="space-y-6">
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label>Pricing mode</Label>
                                                    <Select
                                                        value={ruleForm.pricingMode}
                                                        onValueChange={value => setRuleForm(prev => ({
                                                            ...prev,
                                                            pricingMode: value as PricingMode
                                                        }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select mode"/>
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
                                                            onChange={event => setRuleForm(prev => ({
                                                                ...prev,
                                                                points: event.target.value
                                                            }))}
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
                                                            onChange={event => setRuleForm(prev => ({
                                                                ...prev,
                                                                fixedPrice: event.target.value
                                                            }))}
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
                                                                onChange={event => setRuleForm(prev => ({
                                                                    ...prev,
                                                                    minPrice: event.target.value
                                                                }))}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="rule-max">Max price</Label>
                                                            <Input
                                                                id="rule-max"
                                                                type="number"
                                                                value={ruleForm.maxPrice}
                                                                onChange={event => setRuleForm(prev => ({
                                                                    ...prev,
                                                                    maxPrice: event.target.value
                                                                }))}
                                                            />
                                                        </div>
                                                    </>
                                                ) : null}
                                                <div className="space-y-2">
                                                    <Label htmlFor="rule-base-points">Base points (optional)</Label>
                                                    <Input
                                                        id="rule-base-points"
                                                        type="number"
                                                        value={ruleForm.basePoints}
                                                        onChange={event => setRuleForm(prev => ({
                                                            ...prev,
                                                            basePoints: event.target.value
                                                        }))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="rule-min-points">Minimum points (optional)</Label>
                                                    <Input
                                                        id="rule-min-points"
                                                        type="number"
                                                        value={ruleForm.minPoints}
                                                        onChange={event => setRuleForm(prev => ({
                                                            ...prev,
                                                            minPoints: event.target.value
                                                        }))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="rule-max-points">Maximum points (optional)</Label>
                                                    <Input
                                                        id="rule-max-points"
                                                        type="number"
                                                        value={ruleForm.maxPoints}
                                                        onChange={event => setRuleForm(prev => ({
                                                            ...prev,
                                                            maxPoints: event.target.value
                                                        }))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="rule-point-strategy">Point strategy key
                                                        (optional)</Label>
                                                    <Input
                                                        id="rule-point-strategy"
                                                        value={ruleForm.pointStrategy}
                                                        onChange={event => setRuleForm(prev => ({
                                                            ...prev,
                                                            pointStrategy: event.target.value
                                                        }))}
                                                        placeholder="e.g. seasonal-tier"
                                                    />
                                                </div>
                                            </div>

                                            <div
                                                className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-amber-800">Tiered
                                                            point logic</h3>
                                                        <p className="text-xs text-amber-700">
                                                            Add conditional tiers that override the base points when
                                                            criteria match.
                                                        </p>
                                                    </div>
                                                    <Button type="button" size="sm" variant="outline"
                                                            onClick={handleAddPricingTier}>
                                                        <Plus className="mr-2 h-4 w-4"/>
                                                        Add tier
                                                    </Button>
                                                </div>
                                                {pricingTiers.length === 0 ? (
                                                    <p className="text-xs text-amber-700">No tiers defined. The rule
                                                        will use the base configuration.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {pricingTiers.map(tier => {
                                                            const condition = tier.condition
                                                            const factor = condition ? factors.find(item => item.key === condition.factorKey) : undefined
                                                            const allowedValues = factor ? parseAllowedValues(factor) : []
                                                            const inputKind = condition && factor ? resolveFactorInputKind(factor, condition.operator) : 'text'
                                                            const options = factor ? operatorOptionsForFactor(factor) : []
                                                            const selectedOption = condition ? options.find(option => option.value === condition.operator) ?? options[0] : undefined

                                                            return (
                                                                <div key={tier.id}
                                                                     className="space-y-3 rounded-lg border border-amber-300 bg-white p-4">
                                                                    <div
                                                                        className="flex flex-col gap-3 md:flex-row md:items-center">
                                                                        <div className="flex-1 space-y-1">
                                                                            <Label
                                                                                className="text-xs uppercase text-amber-800">Points
                                                                                override</Label>
                                                                            <Input
                                                                                type="number"
                                                                                value={tier.points}
                                                                                onChange={event => handlePricingTierPointsChange(tier.id, event.target.value)}
                                                                                placeholder="Enter tier points"
                                                                            />
                                                                        </div>
                                                                        <div
                                                                            className="flex items-center gap-2 self-start">
                                                                            {condition ? (
                                                                                <Button type="button" variant="outline"
                                                                                        size="sm"
                                                                                        onClick={() => handleRemovePricingTierCondition(tier.id)}>
                                                                                    Remove condition
                                                                                </Button>
                                                                            ) : (
                                                                                <Button type="button" variant="outline"
                                                                                        size="sm"
                                                                                        onClick={() => handleEnsurePricingTierCondition(tier.id)}>
                                                                                    Add condition
                                                                                </Button>
                                                                            )}
                                                                            <Button type="button" variant="ghost"
                                                                                    size="icon"
                                                                                    className="text-amber-700 hover:text-red-600"
                                                                                    onClick={() => handleRemovePricingTier(tier.id)}>
                                                                                <Trash2 className="h-4 w-4"/>
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                    {condition ? (
                                                                        <div
                                                                            className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                                            <div className="grid gap-3 md:grid-cols-3">
                                                                                <div className="space-y-1">
                                                                                    <Label
                                                                                        className="text-[11px] uppercase text-amber-800">Factor</Label>
                                                                                    <Select
                                                                                        value={condition.factorKey}
                                                                                        onValueChange={value => handlePricingTierConditionFactorChange(tier.id, value)}
                                                                                    >
                                                                                        <SelectTrigger>
                                                                                            <SelectValue
                                                                                                placeholder="Select factor"/>
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            {factors.map(item => (
                                                                                                <SelectItem
                                                                                                    key={item.key}
                                                                                                    value={item.key}>
                                                                                                    {item.nameEn}
                                                                                                </SelectItem>
                                                                                            ))}
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <Label
                                                                                        className="text-[11px] uppercase text-amber-800">Operator</Label>
                                                                                    <Select
                                                                                        value={condition.operator}
                                                                                        onValueChange={value => handlePricingTierConditionOperatorChange(tier.id, value)}
                                                                                    >
                                                                                        <SelectTrigger>
                                                                                            <SelectValue
                                                                                                placeholder="Select operator"/>
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            {options.map(option => (
                                                                                                <SelectItem
                                                                                                    key={option.value}
                                                                                                    value={option.value}>
                                                                                                    {option.label}
                                                                                                </SelectItem>
                                                                                            ))}
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <Label
                                                                                        className="text-[11px] uppercase text-amber-800">Value</Label>
                                                                                    {selectedOption?.requiresRange ? (
                                                                                        <div
                                                                                            className="grid grid-cols-2 gap-2">
                                                                                            <Input
                                                                                                type={inputKind === 'date' ? 'date' : 'number'}
                                                                                                placeholder="Min"
                                                                                                value={
                                                                                                    typeof condition.value === 'object' && condition.value !== null && !Array.isArray(condition.value)
                                                                                                        ? (condition.value as {
                                                                                                        min?: string
                                                                                                    }).min ?? ''
                                                                                                        : ''
                                                                                                }
                                                                                                onChange={event => handlePricingTierConditionValueChange(tier.id, {
                                                                                                    min: event.target.value,
                                                                                                    max:
                                                                                                        typeof condition.value === 'object' && condition.value !== null && !Array.isArray(condition.value)
                                                                                                            ? (condition.value as {
                                                                                                            max?: string
                                                                                                        }).max ?? ''
                                                                                                            : '',
                                                                                                })}
                                                                                            />
                                                                                            <Input
                                                                                                type={inputKind === 'date' ? 'date' : 'number'}
                                                                                                placeholder="Max"
                                                                                                value={
                                                                                                    typeof condition.value === 'object' && condition.value !== null && !Array.isArray(condition.value)
                                                                                                        ? (condition.value as {
                                                                                                        max?: string
                                                                                                    }).max ?? ''
                                                                                                        : ''
                                                                                                }
                                                                                                onChange={event => handlePricingTierConditionValueChange(tier.id, {
                                                                                                    min:
                                                                                                        typeof condition.value === 'object' && condition.value !== null && !Array.isArray(condition.value)
                                                                                                            ? (condition.value as {
                                                                                                            min?: string
                                                                                                        }).min ?? ''
                                                                                                            : '',
                                                                                                    max: event.target.value,
                                                                                                })}
                                                                                            />
                                                                                        </div>
                                                                                    ) : selectedOption?.supportsMultiple && allowedValues.length > 0 ? (
                                                                                        <select
                                                                                            multiple
                                                                                            value={Array.isArray(condition.value) ? condition.value.map(String) : condition.value ? [String(condition.value)] : []}
                                                                                            onChange={event => handlePricingTierConditionValueChange(
                                                                                                tier.id,
                                                                                                Array.from(event.target.selectedOptions).map(option => option.value),
                                                                                            )}
                                                                                            className="h-28 w-full rounded-md border border-amber-200 px-3 py-2 text-sm"
                                                                                        >
                                                                                            {allowedValues.map(option => (
                                                                                                <option key={option}
                                                                                                        value={option}>
                                                                                                    {option}
                                                                                                </option>
                                                                                            ))}
                                                                                        </select>
                                                                                    ) : inputKind === 'boolean' ? (
                                                                                        <div
                                                                                            className="flex items-center gap-2">
                                                                                            <Switch
                                                                                                checked={Boolean(condition.value)}
                                                                                                onCheckedChange={checked => handlePricingTierConditionValueChange(tier.id, checked)}
                                                                                            />
                                                                                            <span
                                                                                                className="text-xs text-amber-800">{condition.value ? 'True' : 'False'}</span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <Input
                                                                                            type={inputKind === 'number' ? 'number' : inputKind === 'date' ? 'date' : 'text'}
                                                                                            value={Array.isArray(condition.value) ? condition.value.join(',') : String(condition.value ?? '')}
                                                                                            onChange={event => handlePricingTierConditionValueChange(tier.id, event.target.value)}
                                                                                        />
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-slate-800">Conditional
                                                            fixed pricing</h3>
                                                        <p className="text-xs text-slate-600">
                                                            Define fixed prices that activate only when all nested
                                                            conditions pass.
                                                        </p>
                                                    </div>
                                                    <Button type="button" size="sm" variant="outline"
                                                            onClick={handleAddConditionalFixed}>
                                                        <Plus className="mr-2 h-4 w-4"/>
                                                        Add conditional price
                                                    </Button>
                                                </div>
                                                {conditionalFixed.length === 0 ? (
                                                    <p className="text-xs text-slate-500">No conditional overrides
                                                        added.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {conditionalFixed.map(entry => (
                                                            <div key={entry.id}
                                                                 className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                                                <div
                                                                    className="flex flex-col gap-3 md:flex-row md:items-center">
                                                                    <div className="flex-1 space-y-1">
                                                                        <Label
                                                                            className="text-xs uppercase text-slate-700">Fixed
                                                                            price</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={entry.price}
                                                                            onChange={event => handleConditionalFixedPriceChange(entry.id, event.target.value)}
                                                                            placeholder="Enter price"
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center gap-2 self-start">
                                                                        <Button type="button" variant="outline"
                                                                                size="sm"
                                                                                onClick={() => handleAddConditionalFixedCondition(entry.id)}>
                                                                            Add condition
                                                                        </Button>
                                                                        <Button type="button" variant="ghost"
                                                                                size="icon"
                                                                                className="text-slate-600 hover:text-red-600"
                                                                                onClick={() => handleRemoveConditionalFixed(entry.id)}>
                                                                            <Trash2 className="h-4 w-4"/>
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                {entry.conditions.length === 0 ? (
                                                                    <p className="text-xs text-slate-500">No conditions
                                                                        attached. Override will always apply.</p>
                                                                ) : (
                                                                    <div className="space-y-3">
                                                                        {entry.conditions.map(condition => {
                                                                            const factor = factors.find(item => item.key === condition.factorKey)
                                                                            const allowedValues = factor ? parseAllowedValues(factor) : []
                                                                            const inputKind = factor ? resolveFactorInputKind(factor, condition.operator) : 'text'
                                                                            const options = factor ? operatorOptionsForFactor(factor) : []
                                                                            const selectedOption = options.find(option => option.value === condition.operator)

                                                                            return (
                                                                                <div key={condition.id}
                                                                                     className="space-y-3 rounded-lg border border-white bg-white p-3 shadow-sm">
                                                                                    <div
                                                                                        className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px]">
                                                                                        <div className="space-y-1">
                                                                                            <Label
                                                                                                className="text-[11px] uppercase text-slate-700">Factor</Label>
                                                                                            <Select
                                                                                                value={condition.factorKey}
                                                                                                onValueChange={value => handleConditionalFixedConditionFactorChange(entry.id, condition.id, value)}
                                                                                            >
                                                                                                <SelectTrigger>
                                                                                                    <SelectValue
                                                                                                        placeholder="Select factor"/>
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    {factors.map(item => (
                                                                                                        <SelectItem
                                                                                                            key={item.key}
                                                                                                            value={item.key}>
                                                                                                            {item.nameEn}
                                                                                                        </SelectItem>
                                                                                                    ))}
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        </div>
                                                                                        <div className="space-y-1">
                                                                                            <Label
                                                                                                className="text-[11px] uppercase text-slate-700">Operator</Label>
                                                                                            <Select
                                                                                                value={condition.operator}
                                                                                                onValueChange={value => handleConditionalFixedConditionOperatorChange(entry.id, condition.id, value)}
                                                                                            >
                                                                                                <SelectTrigger>
                                                                                                    <SelectValue
                                                                                                        placeholder="Select operator"/>
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    {options.map(option => (
                                                                                                        <SelectItem
                                                                                                            key={option.value}
                                                                                                            value={option.value}>
                                                                                                            {option.label}
                                                                                                        </SelectItem>
                                                                                                    ))}
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        </div>
                                                                                        <div
                                                                                            className="flex items-start justify-end">
                                                                                            <Button
                                                                                                type="button"
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                className="text-slate-600 hover:text-red-600"
                                                                                                onClick={() => handleRemoveConditionalFixedCondition(entry.id, condition.id)}
                                                                                            >
                                                                                                <Trash2
                                                                                                    className="h-4 w-4"/>
                                                                                            </Button>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="space-y-1">
                                                                                        <Label
                                                                                            className="text-[11px] uppercase text-slate-700">Value</Label>
                                                                                        {selectedOption?.requiresRange ? (
                                                                                            <div
                                                                                                className="grid grid-cols-2 gap-2">
                                                                                                <Input
                                                                                                    type={inputKind === 'date' ? 'date' : 'number'}
                                                                                                    placeholder="Min"
                                                                                                    value={
                                                                                                        typeof condition.value === 'object' && condition.value !== null && !Array.isArray(condition.value)
                                                                                                            ? (condition.value as {
                                                                                                            min?: string
                                                                                                        }).min ?? ''
                                                                                                            : ''
                                                                                                    }
                                                                                                    onChange={event => handleConditionalFixedConditionValueChange(entry.id, condition.id, {
                                                                                                        min: event.target.value,
                                                                                                        max:
                                                                                                            typeof condition.value === 'object' && condition.value !== null && !Array.isArray(condition.value)
                                                                                                                ? (condition.value as {
                                                                                                                max?: string
                                                                                                            }).max ?? ''
                                                                                                                : '',
                                                                                                    })}
                                                                                                />
                                                                                                <Input
                                                                                                    type={inputKind === 'date' ? 'date' : 'number'}
                                                                                                    placeholder="Max"
                                                                                                    value={
                                                                                                        typeof condition.value === 'object' && condition.value !== null && !Array.isArray(condition.value)
                                                                                                            ? (condition.value as {
                                                                                                            max?: string
                                                                                                        }).max ?? ''
                                                                                                            : ''
                                                                                                    }
                                                                                                    onChange={event => handleConditionalFixedConditionValueChange(entry.id, condition.id, {
                                                                                                        min:
                                                                                                            typeof condition.value === 'object' && condition.value !== null && !Array.isArray(condition.value)
                                                                                                                ? (condition.value as {
                                                                                                                min?: string
                                                                                                            }).min ?? ''
                                                                                                                : '',
                                                                                                        max: event.target.value,
                                                                                                    })}
                                                                                                />
                                                                                            </div>
                                                                                        ) : selectedOption?.supportsMultiple && allowedValues.length > 0 ? (
                                                                                            <select
                                                                                                multiple
                                                                                                value={Array.isArray(condition.value) ? condition.value.map(String) : condition.value ? [String(condition.value)] : []}
                                                                                                onChange={event => handleConditionalFixedConditionValueChange(
                                                                                                    entry.id,
                                                                                                    condition.id,
                                                                                                    Array.from(event.target.selectedOptions).map(option => option.value),
                                                                                                )}
                                                                                                className="h-28 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                                                                                            >
                                                                                                {allowedValues.map(option => (
                                                                                                    <option key={option}
                                                                                                            value={option}>
                                                                                                        {option}
                                                                                                    </option>
                                                                                                ))}
                                                                                            </select>
                                                                                        ) : inputKind === 'boolean' ? (
                                                                                            <div
                                                                                                className="flex items-center gap-2">
                                                                                                <Switch
                                                                                                    checked={Boolean(condition.value)}
                                                                                                    onCheckedChange={checked => handleConditionalFixedConditionValueChange(entry.id, condition.id, checked)}
                                                                                                />
                                                                                                <span
                                                                                                    className="text-xs text-slate-700">{condition.value ? 'True' : 'False'}</span>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <Input
                                                                                                type={inputKind === 'number' ? 'number' : inputKind === 'date' ? 'date' : 'text'}
                                                                                                value={Array.isArray(condition.value) ? condition.value.join(',') : String(condition.value ?? '')}
                                                                                                onChange={event => handleConditionalFixedConditionValueChange(entry.id, condition.id, event.target.value)}
                                                                                            />
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="adjustments" className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-slate-700">Adjustments</h3>
                                                <Button type="button" variant="outline" size="sm"
                                                        onClick={handleAddAdjustment}>
                                                    <Plus className="mr-2 h-4 w-4"/>
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
                                                            <div
                                                                key={adjustment.id}
                                                                className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-4"
                                                            >
                                                                {/* ================= HEADER ================= */}
                                                                <div
                                                                    className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px]">
                                                                    <div className="space-y-2">
                                                                        <Label
                                                                            className="text-xs uppercase text-blue-800">Type</Label>
                                                                        <Select
                                                                            value={adjustment.type}
                                                                            onValueChange={value =>
                                                                                handleAdjustmentChange(adjustment.id, {type: value})
                                                                            }
                                                                        >
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Select type"/>
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="ADD">Add</SelectItem>
                                                                                <SelectItem
                                                                                    value="MULTIPLY">Multiply</SelectItem>
                                                                                <SelectItem
                                                                                    value="PERCENT">Percent</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <Label
                                                                            className="text-xs uppercase text-blue-800">Factor</Label>
                                                                        <Select
                                                                            value={adjustment.factorKey}
                                                                            onValueChange={value =>
                                                                                handleAdjustmentChange(adjustment.id, {factorKey: value})
                                                                            }
                                                                        >
                                                                            <SelectTrigger>
                                                                                <SelectValue
                                                                                    placeholder="Select factor"/>
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {factors.map(item => (
                                                                                    <SelectItem key={item.key}
                                                                                                value={item.key}>
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
                                                                            <Trash2 className="h-4 w-4"/>
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* ================= BASIC PERCENT ================= */}
                                                                <div className="grid gap-4 md:grid-cols-2">
                                                                    <div className="space-y-2">
                                                                        <Label
                                                                            className="text-xs uppercase text-blue-800">
                                                                            Percent (optional)
                                                                        </Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={adjustment.percent}
                                                                            onChange={event =>
                                                                                handleAdjustmentChange(adjustment.id, {
                                                                                    percent: event.target.value,
                                                                                })
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* ================= CASES ================= */}
                                                                <div
                                                                    className="space-y-3 pt-2 border-t border-blue-200">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label
                                                                            className="text-xs uppercase text-blue-800">Cases</Label>
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleAddAdjustmentCase(adjustment.id)}
                                                                        >
                                                                            <Plus className="mr-2 h-4 w-4"/>
                                                                            Add case
                                                                        </Button>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        {adjustment.cases.map(caseEntry => (
                                                                            <div
                                                                                key={caseEntry.id}
                                                                                className="flex flex-col gap-2 rounded-md border border-blue-200 bg-white p-3 md:flex-row md:items-center md:gap-3"
                                                                            >
                                                                                <div className="flex-1">
                                                                                    <Label
                                                                                        className="text-[10px] uppercase text-blue-800">
                                                                                        Factor value
                                                                                    </Label>
                                                                                    {allowedValues.length > 0 ? (
                                                                                        <select
                                                                                            value={caseEntry.caseValue}
                                                                                            onChange={event =>
                                                                                                handleAdjustmentCaseChange(
                                                                                                    adjustment.id,
                                                                                                    caseEntry.id,
                                                                                                    {caseValue: event.target.value}
                                                                                                )
                                                                                            }
                                                                                            className="mt-1 w-full rounded-md border border-blue-200 px-3 py-2 text-sm"
                                                                                        >
                                                                                            <option value="">Select
                                                                                                value
                                                                                            </option>
                                                                                            {allowedValues.map(option => (
                                                                                                <option key={option}
                                                                                                        value={option}>
                                                                                                    {option}
                                                                                                </option>
                                                                                            ))}
                                                                                        </select>
                                                                                    ) : (
                                                                                        <Input
                                                                                            value={caseEntry.caseValue}
                                                                                            onChange={event =>
                                                                                                handleAdjustmentCaseChange(
                                                                                                    adjustment.id,
                                                                                                    caseEntry.id,
                                                                                                    {caseValue: event.target.value}
                                                                                                )
                                                                                            }
                                                                                            placeholder="Case value"
                                                                                        />
                                                                                    )}
                                                                                </div>

                                                                                <div className="flex-1">
                                                                                    <Label
                                                                                        className="text-[10px] uppercase text-blue-800">
                                                                                        Value / Amount
                                                                                    </Label>
                                                                                    <Input
                                                                                        type="text"
                                                                                        value={caseEntry.amount}
                                                                                        onChange={event =>
                                                                                            handleAdjustmentCaseChange(
                                                                                                adjustment.id,
                                                                                                caseEntry.id,
                                                                                                {amount: event.target.value}
                                                                                            )
                                                                                        }
                                                                                        placeholder="Number, boolean, or JSON"
                                                                                    />
                                                                                </div>

                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="text-blue-600 hover:text-red-600"
                                                                                    onClick={() =>
                                                                                        handleRemoveAdjustmentCase(
                                                                                            adjustment.id,
                                                                                            caseEntry.id
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <Trash2 className="h-4 w-4"/>
                                                                                </Button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* ================= TIERS ================= */}
                                                                <div
                                                                    className="space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label
                                                                            className="text-xs uppercase text-blue-800">Tiers</Label>
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleAddAdjustmentTier(adjustment.id)}
                                                                        >
                                                                            <Plus className="mr-2 h-4 w-4"/>
                                                                            Add tier
                                                                        </Button>
                                                                    </div>

                                                                    {adjustment.tiers.length === 0 ? (
                                                                        <p className="text-xs text-blue-700">No tiers
                                                                            defined.</p>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {adjustment.tiers.map(tier => (
                                                                                <div
                                                                                    key={tier.id}
                                                                                    className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_40px]"
                                                                                >
                                                                                    <div className="space-y-1">
                                                                                        <Label
                                                                                            className="text-[10px] uppercase text-blue-800">
                                                                                            Value
                                                                                        </Label>
                                                                                        <Input
                                                                                            value={tier.value}
                                                                                            onChange={event =>
                                                                                                handleAdjustmentTierChange(
                                                                                                    adjustment.id,
                                                                                                    tier.id,
                                                                                                    {value: event.target.value}
                                                                                                )
                                                                                            }
                                                                                            placeholder="Match value"
                                                                                        />
                                                                                    </div>

                                                                                    <div className="space-y-1">
                                                                                        <Label
                                                                                            className="text-[10px] uppercase text-blue-800">
                                                                                            Add (amount)
                                                                                        </Label>
                                                                                        <Input
                                                                                            type="number"
                                                                                            value={tier.add}
                                                                                            onChange={event =>
                                                                                                handleAdjustmentTierChange(
                                                                                                    adjustment.id,
                                                                                                    tier.id,
                                                                                                    {add: event.target.value}
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    </div>

                                                                                    <div className="space-y-1">
                                                                                        <Label
                                                                                            className="text-[10px] uppercase text-blue-800">
                                                                                            Add (%)
                                                                                        </Label>
                                                                                        <Input
                                                                                            type="number"
                                                                                            value={tier.percent}
                                                                                            onChange={event =>
                                                                                                handleAdjustmentTierChange(
                                                                                                    adjustment.id,
                                                                                                    tier.id,
                                                                                                    {percent: event.target.value}
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    </div>

                                                                                    <div
                                                                                        className="flex items-center justify-end">
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="text-blue-600 hover:text-red-600"
                                                                                            onClick={() =>
                                                                                                handleRemoveAdjustmentTier(
                                                                                                    adjustment.id,
                                                                                                    tier.id
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <Trash2
                                                                                                className="h-4 w-4"/>
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* ================= LOGIC BLOCKS ================= */}
                                                                <div
                                                                    className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label
                                                                            className="text-xs uppercase text-indigo-800">
                                                                            Logic blocks
                                                                        </Label>
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                handleAddAdjustmentLogicBlock(adjustment.id)
                                                                            }
                                                                        >
                                                                            <Plus className="mr-2 h-4 w-4"/>
                                                                            Add block
                                                                        </Button>
                                                                    </div>

                                                                    {adjustment.logicBlocks.length === 0 ? (
                                                                        <p className="text-xs text-indigo-700">
                                                                            No conditional logic configured.
                                                                        </p>
                                                                    ) : (
                                                                        <div className="space-y-3">
                                                                            {adjustment.logicBlocks.map(block => (
                                                                                <div
                                                                                    key={block.id}
                                                                                    className="space-y-3 rounded-lg border border-indigo-200 bg-white p-3"
                                                                                >
                                                                                    {/* ===== ADD / ADD % ===== */}
                                                                                    <div
                                                                                        className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px]">
                                                                                        <div className="space-y-1">
                                                                                            <Label
                                                                                                className="text-[10px] uppercase text-indigo-800">
                                                                                                Add amount
                                                                                            </Label>
                                                                                            <Input
                                                                                                type="number"
                                                                                                value={block.add}
                                                                                                onChange={event =>
                                                                                                    handleAdjustmentLogicBlockChange(
                                                                                                        adjustment.id,
                                                                                                        block.id,
                                                                                                        {add: event.target.value}
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                        </div>

                                                                                        <div className="space-y-1">
                                                                                            <Label
                                                                                                className="text-[10px] uppercase text-indigo-800">
                                                                                                Add percent
                                                                                            </Label>
                                                                                            <Input
                                                                                                type="number"
                                                                                                value={block.addPercent}
                                                                                                onChange={event =>
                                                                                                    handleAdjustmentLogicBlockChange(
                                                                                                        adjustment.id,
                                                                                                        block.id,
                                                                                                        {
                                                                                                            addPercent:
                                                                                                            event.target.value,
                                                                                                        }
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                        </div>

                                                                                        <div
                                                                                            className="flex items-center justify-end">
                                                                                            <Button
                                                                                                type="button"
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                className="text-indigo-700 hover:text-red-600"
                                                                                                onClick={() =>
                                                                                                    handleRemoveAdjustmentLogicBlock(
                                                                                                        adjustment.id,
                                                                                                        block.id
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                <Trash2
                                                                                                    className="h-4 w-4"/>
                                                                                            </Button>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* ===== CONDITIONS ===== */}
                                                                                    <div
                                                                                        className="flex items-center justify-between">
                                                                                        <p className="text-[11px] uppercase text-indigo-700">
                                                                                            Conditions
                                                                                        </p>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="outline"
                                                                                            size="sm"
                                                                                            onClick={() =>
                                                                                                handleAddAdjustmentLogicBlockCondition(
                                                                                                    adjustment.id,
                                                                                                    block.id
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            Add condition
                                                                                        </Button>
                                                                                    </div>

                                                                                    {block.conditions.length === 0 ? (
                                                                                        <p className="text-xs text-indigo-600">
                                                                                            No conditions specified.
                                                                                        </p>
                                                                                    ) : (
                                                                                        <div className="space-y-3">
                                                                                            {block.conditions.map(condition => {
                                                                                                const factor = factors.find(item => item.key === condition.factorKey)
                                                                                                const allowedValues = factor ? parseAllowedValues(factor) : []
                                                                                                const inputKind = factor ? resolveFactorInputKind(factor, condition.operator) : 'text'
                                                                                                const options = factor ? operatorOptionsForFactor(factor) : []
                                                                                                const selectedOption = options.find(option => option.value === condition.operator)

                                                                                                return (
                                                                                                    <div
                                                                                                        key={condition.id}
                                                                                                        className="space-y-2 rounded-lg border border-indigo-100 bg-indigo-50 p-3"
                                                                                                    >
                                                                                                        {/* === Factor & Operator === */}
                                                                                                        <div
                                                                                                            className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px]">
                                                                                                            <div
                                                                                                                className="space-y-1">
                                                                                                                <Label
                                                                                                                    className="text-[10px] uppercase text-indigo-800">
                                                                                                                    Factor
                                                                                                                </Label>
                                                                                                                <Select
                                                                                                                    value={condition.factorKey}
                                                                                                                    onValueChange={value =>
                                                                                                                        handleAdjustmentLogicBlockConditionFactorChange(
                                                                                                                            adjustment.id,
                                                                                                                            block.id,
                                                                                                                            condition.id,
                                                                                                                            value
                                                                                                                        )
                                                                                                                    }
                                                                                                                >
                                                                                                                    <SelectTrigger>
                                                                                                                        <SelectValue
                                                                                                                            placeholder="Select factor"/>
                                                                                                                    </SelectTrigger>
                                                                                                                    <SelectContent>
                                                                                                                        {factors.map(item => (
                                                                                                                            <SelectItem
                                                                                                                                key={item.key}
                                                                                                                                value={item.key}>
                                                                                                                                {item.nameEn}
                                                                                                                            </SelectItem>
                                                                                                                        ))}
                                                                                                                    </SelectContent>
                                                                                                                </Select>
                                                                                                            </div>

                                                                                                            <div
                                                                                                                className="space-y-1">
                                                                                                                <Label
                                                                                                                    className="text-[10px] uppercase text-indigo-800">
                                                                                                                    Operator
                                                                                                                </Label>
                                                                                                                <Select
                                                                                                                    value={condition.operator}
                                                                                                                    onValueChange={value =>
                                                                                                                        handleAdjustmentLogicBlockConditionOperatorChange(
                                                                                                                            adjustment.id,
                                                                                                                            block.id,
                                                                                                                            condition.id,
                                                                                                                            value
                                                                                                                        )
                                                                                                                    }
                                                                                                                >
                                                                                                                    <SelectTrigger>
                                                                                                                        <SelectValue
                                                                                                                            placeholder="Select operator"/>
                                                                                                                    </SelectTrigger>
                                                                                                                    <SelectContent>
                                                                                                                        {options.map(option => (
                                                                                                                            <SelectItem
                                                                                                                                key={option.value}
                                                                                                                                value={option.value}>
                                                                                                                                {option.label}
                                                                                                                            </SelectItem>
                                                                                                                        ))}
                                                                                                                    </SelectContent>
                                                                                                                </Select>
                                                                                                            </div>

                                                                                                            <div
                                                                                                                className="flex items-start justify-end">
                                                                                                                <Button
                                                                                                                    type="button"
                                                                                                                    variant="ghost"
                                                                                                                    size="icon"
                                                                                                                    className="text-indigo-700 hover:text-red-600"
                                                                                                                    onClick={() =>
                                                                                                                        handleRemoveAdjustmentLogicBlockCondition(
                                                                                                                            adjustment.id,
                                                                                                                            block.id,
                                                                                                                            condition.id
                                                                                                                        )
                                                                                                                    }
                                                                                                                >
                                                                                                                    <Trash2
                                                                                                                        className="h-4 w-4"/>
                                                                                                                </Button>
                                                                                                            </div>
                                                                                                        </div>

                                                                                                        {/* === VALUE INPUT === */}
                                                                                                        <div
                                                                                                            className="space-y-1">
                                                                                                            <Label
                                                                                                                className="text-[10px] uppercase text-indigo-800">
                                                                                                                Value
                                                                                                            </Label>

                                                                                                            {/* RANGE */}
                                                                                                            {selectedOption?.requiresRange ? (
                                                                                                                <div
                                                                                                                    className="grid grid-cols-2 gap-2">
                                                                                                                    <Input
                                                                                                                        type={inputKind === 'date' ? 'date' : 'number'}
                                                                                                                        placeholder="Min"
                                                                                                                        value={
                                                                                                                            typeof condition.value === 'object' &&
                                                                                                                            condition.value !== null &&
                                                                                                                            !Array.isArray(condition.value)
                                                                                                                                ? (condition.value as any).min ?? ''
                                                                                                                                : ''
                                                                                                                        }
                                                                                                                        onChange={event =>
                                                                                                                            handleAdjustmentLogicBlockConditionValueChange(
                                                                                                                                adjustment.id,
                                                                                                                                block.id,
                                                                                                                                condition.id,
                                                                                                                                {
                                                                                                                                    min: event.target.value,
                                                                                                                                    max:
                                                                                                                                        typeof condition.value === 'object' &&
                                                                                                                                        condition.value !== null &&
                                                                                                                                        !Array.isArray(condition.value)
                                                                                                                                            ? (condition.value as any).max ?? ''
                                                                                                                                            : '',
                                                                                                                                }
                                                                                                                            )
                                                                                                                        }
                                                                                                                    />
                                                                                                                    <Input
                                                                                                                        type={inputKind === 'date' ? 'date' : 'number'}
                                                                                                                        placeholder="Max"
                                                                                                                        value={
                                                                                                                            typeof condition.value === 'object' &&
                                                                                                                            condition.value !== null &&
                                                                                                                            !Array.isArray(condition.value)
                                                                                                                                ? (condition.value as any).max ?? ''
                                                                                                                                : ''
                                                                                                                        }
                                                                                                                        onChange={event =>
                                                                                                                            handleAdjustmentLogicBlockConditionValueChange(
                                                                                                                                adjustment.id,
                                                                                                                                block.id,
                                                                                                                                condition.id,
                                                                                                                                {
                                                                                                                                    min:
                                                                                                                                        typeof condition.value === 'object' &&
                                                                                                                                        condition.value !== null &&
                                                                                                                                        !Array.isArray(condition.value)
                                                                                                                                            ? (condition.value as any).min ?? ''
                                                                                                                                            : '',
                                                                                                                                    max: event.target.value,
                                                                                                                                }
                                                                                                                            )
                                                                                                                        }
                                                                                                                    />
                                                                                                                </div>

                                                                                                                /* MULTI SELECT */
                                                                                                            ) : selectedOption?.supportsMultiple &&
                                                                                                            allowedValues.length > 0 ? (
                                                                                                                <select
                                                                                                                    multiple
                                                                                                                    value={
                                                                                                                        Array.isArray(condition.value)
                                                                                                                            ? condition.value.map(String)
                                                                                                                            : condition.value
                                                                                                                                ? [String(condition.value)]
                                                                                                                                : []
                                                                                                                    }
                                                                                                                    onChange={event =>
                                                                                                                        handleAdjustmentLogicBlockConditionValueChange(
                                                                                                                            adjustment.id,
                                                                                                                            block.id,
                                                                                                                            condition.id,
                                                                                                                            Array.from(
                                                                                                                                event.target.selectedOptions
                                                                                                                            ).map(option => option.value)
                                                                                                                        )
                                                                                                                    }
                                                                                                                    className="h-24 w-full rounded-md border border-indigo-200 px-3 py-2 text-sm"
                                                                                                                >
                                                                                                                    {allowedValues.map(option => (
                                                                                                                        <option
                                                                                                                            key={option}
                                                                                                                            value={option}>
                                                                                                                            {option}
                                                                                                                        </option>
                                                                                                                    ))}
                                                                                                                </select>

                                                                                                                /* BOOLEAN */
                                                                                                            ) : inputKind === 'boolean' ? (
                                                                                                                <div
                                                                                                                    className="flex items-center gap-2">
                                                                                                                    <Switch
                                                                                                                        checked={Boolean(condition.value)}
                                                                                                                        onCheckedChange={checked =>
                                                                                                                            handleAdjustmentLogicBlockConditionValueChange(
                                                                                                                                adjustment.id,
                                                                                                                                block.id,
                                                                                                                                condition.id,
                                                                                                                                checked
                                                                                                                            )
                                                                                                                        }
                                                                                                                    />
                                                                                                                    <span
                                                                                                                        className="text-xs text-indigo-800">
                                                                        {condition.value ? 'True' : 'False'}
                                                                    </span>
                                                                                                                </div>

                                                                                                                /* TEXT / NUMBER / DATE */
                                                                                                            ) : (
                                                                                                                <Input
                                                                                                                    type={
                                                                                                                        inputKind === 'number'
                                                                                                                            ? 'number'
                                                                                                                            : inputKind === 'date'
                                                                                                                                ? 'date'
                                                                                                                                : 'text'
                                                                                                                    }
                                                                                                                    value={
                                                                                                                        Array.isArray(condition.value)
                                                                                                                            ? condition.value.join(',')
                                                                                                                            : String(condition.value ?? '')
                                                                                                                    }
                                                                                                                    onChange={event =>
                                                                                                                        handleAdjustmentLogicBlockConditionValueChange(
                                                                                                                            adjustment.id,
                                                                                                                            block.id,
                                                                                                                            condition.id,
                                                                                                                            event.target.value
                                                                                                                        )
                                                                                                                    }
                                                                                                                />
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )
                                                                                            })}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
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
                                                        <p className="text-sm font-semibold text-slate-700">Discount
                                                            configuration</p>
                                                        <p className={infoTextClass}>Enable period-based discounts for
                                                            the rule.</p>
                                                    </div>
                                                    <Switch
                                                        checked={ruleForm.discountApply}
                                                        onCheckedChange={checked => setRuleForm(prev => ({
                                                            ...prev,
                                                            discountApply: checked
                                                        }))}
                                                    />
                                                </div>
                                                {ruleForm.discountApply ? (
                                                    <div className="mt-4 space-y-4">
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="rule-discount-unit">Unit</Label>
                                                                <Input
                                                                    id="rule-discount-unit"
                                                                    value={ruleForm.discountUnit}
                                                                    onChange={event => setRuleForm(prev => ({
                                                                        ...prev,
                                                                        discountUnit: event.target.value
                                                                    }))}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="rule-discount-value">Value</Label>
                                                                <Input
                                                                    id="rule-discount-value"
                                                                    type="number"
                                                                    value={ruleForm.discountValue}
                                                                    onChange={event => setRuleForm(prev => ({
                                                                        ...prev,
                                                                        discountValue: event.target.value
                                                                    }))}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div
                                                            className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-semibold text-emerald-800">Conditional
                                                                        logic blocks</p>
                                                                    <p className="text-xs text-emerald-700">
                                                                        Configure conditional percentages that stack on
                                                                        top of the base discount.
                                                                    </p>
                                                                </div>
                                                                <Button type="button" variant="outline" size="sm"
                                                                        onClick={handleAddDiscountLogicBlock}>
                                                                    <Plus className="mr-2 h-4 w-4"/>
                                                                    Add block
                                                                </Button>
                                                            </div>
                                                            {discountLogicBlocks.length === 0 ? (
                                                                <p className="text-xs text-emerald-700">No conditional
                                                                    blocks defined.</p>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    {discountLogicBlocks.map(block => (
                                                                        <div key={block.id}
                                                                             className="space-y-3 rounded-lg border border-emerald-200 bg-white p-4">
                                                                            <div
                                                                                className="flex flex-col gap-3 md:flex-row md:items-center">
                                                                                <div className="flex-1 space-y-1">
                                                                                    <Label
                                                                                        className="text-xs uppercase text-emerald-800">Percent</Label>
                                                                                    <Input
                                                                                        type="number"
                                                                                        value={block.percent}
                                                                                        onChange={event => handleDiscountLogicBlockPercentChange(block.id, event.target.value)}
                                                                                        placeholder="e.g. 5"
                                                                                    />
                                                                                </div>
                                                                                <div
                                                                                    className="flex items-center gap-2 self-start">
                                                                                    <Button type="button"
                                                                                            variant="outline" size="sm"
                                                                                            onClick={() => handleAddDiscountLogicBlockCondition(block.id)}>
                                                                                        Add condition
                                                                                    </Button>
                                                                                    <Button type="button"
                                                                                            variant="ghost" size="icon"
                                                                                            className="text-emerald-700 hover:text-red-600"
                                                                                            onClick={() => handleRemoveDiscountLogicBlock(block.id)}>
                                                                                        <Trash2 className="h-4 w-4"/>
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                            {block.conditions.length === 0 ? (
                                                                                <p className="text-xs text-emerald-600">Applies
                                                                                    whenever discount is enabled.</p>
                                                                            ) : (
                                                                                <div className="space-y-3">
                                                                                    {block.conditions.map(condition => {
                                                                                        const factor = factors.find(item => item.key === condition.factorKey)
                                                                                        const allowedValues = factor ? parseAllowedValues(factor) : []
                                                                                        const inputKind = factor ? resolveFactorInputKind(factor, condition.operator) : 'text'
                                                                                        const options = factor ? operatorOptionsForFactor(factor) : []
                                                                                        const selectedOption = options.find(option => option.value === condition.operator)

                                                                                        return (
                                                                                            <div key={condition.id}
                                                                                                 className="space-y-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                                                                                                <div
                                                                                                    className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px]">
                                                                                                    <div
                                                                                                        className="space-y-1">
                                                                                                        <Label
                                                                                                            className="text-[11px] uppercase text-emerald-800">Factor</Label>
                                                                                                        <Select
                                                                                                            value={condition.factorKey}
                                                                                                            onValueChange={value => handleDiscountLogicBlockConditionFactorChange(block.id, condition.id, value)}
                                                                                                        >
                                                                                                            <SelectTrigger>
                                                                                                                <SelectValue
                                                                                                                    placeholder="Select factor"/>
                                                                                                            </SelectTrigger>
                                                                                                            <SelectContent>
                                                                                                                {factors.map(item => (
                                                                                                                    <SelectItem
                                                                                                                        key={item.key}
                                                                                                                        value={item.key}>
                                                                                                                        {item.nameEn}
                                                                                                                    </SelectItem>
                                                                                                                ))}
                                                                                                            </SelectContent>
                                                                                                        </Select>
                                                                                                    </div>
                                                                                                    <div
                                                                                                        className="space-y-1">
                                                                                                        <Label
                                                                                                            className="text-[11px] uppercase text-emerald-800">Operator</Label>
                                                                                                        <Select
                                                                                                            value={condition.operator}
                                                                                                            onValueChange={value => handleDiscountLogicBlockConditionOperatorChange(block.id, condition.id, value)}
                                                                                                        >
                                                                                                            <SelectTrigger>
                                                                                                                <SelectValue
                                                                                                                    placeholder="Select operator"/>
                                                                                                            </SelectTrigger>
                                                                                                            <SelectContent>
                                                                                                                {options.map(option => (
                                                                                                                    <SelectItem
                                                                                                                        key={option.value}
                                                                                                                        value={option.value}>
                                                                                                                        {option.label}
                                                                                                                    </SelectItem>
                                                                                                                ))}
                                                                                                            </SelectContent>
                                                                                                        </Select>
                                                                                                    </div>
                                                                                                    <div
                                                                                                        className="flex items-start justify-end">
                                                                                                        <Button
                                                                                                            type="button"
                                                                                                            variant="ghost"
                                                                                                            size="icon"
                                                                                                            className="text-emerald-700 hover:text-red-600"
                                                                                                            onClick={() => handleRemoveDiscountLogicBlockCondition(block.id, condition.id)}
                                                                                                        >
                                                                                                            <Trash2
                                                                                                                className="h-4 w-4"/>
                                                                                                        </Button>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div
                                                                                                    className="space-y-1">
                                                                                                    <Label
                                                                                                        className="text-[11px] uppercase text-emerald-800">Value</Label>
                                                                                                    {selectedOption?.requiresRange ? (
                                                                                                        <div
                                                                                                            className="grid grid-cols-2 gap-2">
                                                                                                            <Input
                                                                                                                type={inputKind === 'date' ? 'date' : 'number'}
                                                                                                                placeholder="Min"
                                                                                                                value={
                                                                                                                    typeof condition.value === 'object' && condition.value !== null && !Array.isArray(condition.value)
                                                                                                                        ? (condition.value as {
                                                                                                                        min?: string
                                                                                                                    }).min ?? ''
                                                                                                                        : ''
                                                                                                                }
                                                                                                                onChange={event => handleDiscountLogicBlockConditionValueChange(block.id, condition.id, {
                                                                                                                    min: event.target.value,
                                                                                                                    max:
                                                                                                                        typeof condition.value === 'object' && condition.value !== null && !Array.isArray(condition.value)
                                                                                                                            ? (condition.value as {
                                                                                                                            max?: string
                                                                                                                        }).max ?? ''
                                                                                                                            : '',
                                                                                                                })}
                                                                                                            />
                                                                                                            <Input
                                                                                                                type={inputKind === 'date' ? 'date' : 'number'}
                                                                                                                placeholder="Max"
                                                                                                                value={
                                                                                                                    typeof condition.value === 'object' && condition.value !== null && !Array.isArray(condition.value)
                                                                                                                        ? (condition.value as {
                                                                                                                        max?: string
                                                                                                                    }).max ?? ''
                                                                                                                        : ''
                                                                                                                }
                                                                                                                onChange={event => handleDiscountLogicBlockConditionValueChange(block.id, condition.id, {
                                                                                                                    min:
                                                                                                                        typeof condition.value === 'object' && condition.value !== null && !Array.isArray(condition.value)
                                                                                                                            ? (condition.value as {
                                                                                                                            min?: string
                                                                                                                        }).min ?? ''
                                                                                                                            : '',
                                                                                                                    max: event.target.value,
                                                                                                                })}
                                                                                                            />
                                                                                                        </div>
                                                                                                    ) : selectedOption?.supportsMultiple && allowedValues.length > 0 ? (
                                                                                                        <select
                                                                                                            multiple
                                                                                                            value={Array.isArray(condition.value) ? condition.value.map(String) : condition.value ? [String(condition.value)] : []}
                                                                                                            onChange={event => handleDiscountLogicBlockConditionValueChange(
                                                                                                                block.id,
                                                                                                                condition.id,
                                                                                                                Array.from(event.target.selectedOptions).map(option => option.value),
                                                                                                            )}
                                                                                                            className="h-24 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm"
                                                                                                        >
                                                                                                            {allowedValues.map(option => (
                                                                                                                <option
                                                                                                                    key={option}
                                                                                                                    value={option}>
                                                                                                                    {option}
                                                                                                                </option>
                                                                                                            ))}
                                                                                                        </select>
                                                                                                    ) : inputKind === 'boolean' ? (
                                                                                                        <div
                                                                                                            className="flex items-center gap-2">
                                                                                                            <Switch
                                                                                                                checked={Boolean(condition.value)}
                                                                                                                onCheckedChange={checked => handleDiscountLogicBlockConditionValueChange(block.id, condition.id, checked)}
                                                                                                            />
                                                                                                            <span
                                                                                                                className="text-xs text-emerald-800">{condition.value ? 'True' : 'False'}</span>
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <Input
                                                                                                            type={inputKind === 'number' ? 'number' : inputKind === 'date' ? 'date' : 'text'}
                                                                                                            value={Array.isArray(condition.value) ? condition.value.join(',') : String(condition.value ?? '')}
                                                                                                            onChange={event => handleDiscountLogicBlockConditionValueChange(block.id, condition.id, event.target.value)}
                                                                                                        />
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        )
                                                                                    })}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
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
                                            {savingRule ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> :
                                                <BadgeCheck className="mr-2 h-4 w-4"/>}
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
                                                            <TableCell
                                                                className="font-medium text-slate-700">{row.order}</TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <span
                                                                        className="font-medium text-slate-800">{row.factorLabel}</span>
                                                                    <span
                                                                        className="text-xs text-slate-500">{row.factorLabel === 'Select factor' ? 'Choose a factor to activate condition' : 'Factor constraint'}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span
                                                                    className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{row.dataType}</span>
                                                            </TableCell>
                                                            <TableCell>{row.operatorLabel}</TableCell>
                                                            <TableCell
                                                                className="text-slate-700">{row.valueLabel}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <p className="p-6 text-sm text-slate-500">Add conditions to populate the
                                                logic matrix.</p>
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
                                        <div
                                            className="rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
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
                                                    <div key={adjustment.id}
                                                         className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                                                        <div
                                                            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                            <div>
                                                                <p className="text-sm font-semibold text-blue-900">{adjustment.factorLabel}</p>
                                                                <p className="text-xs uppercase text-blue-700">{adjustment.type}</p>
                                                            </div>
                                                            {adjustment.percent ? (
                                                                <span
                                                                    className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">{adjustment.percent}%</span>
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
                                                            <p className={infoTextClass}>Add case rows to define
                                                                factor-specific adjustments.</p>
                                                        )}
                                                        {adjustment.tiers.length > 0 ? (
                                                            <div className="mt-3">
                                                                <p className="text-xs font-semibold uppercase text-blue-700">Tiers</p>
                                                                <div className="mt-1 flex flex-wrap gap-2">
                                                                    {adjustment.tiers.map(tier => (
                                                                        <span key={tier.id}
                                                                              className="rounded bg-white px-2 py-1 text-[11px] text-blue-700">
                                                                            {tier.value || '—'} → +{tier.add || 0}{tier.percent ? ` / ${tier.percent}%` : ''}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                        {adjustment.logicBlocks.length > 0 ? (
                                                            <div className="mt-3 space-y-2">
                                                                <p className="text-xs font-semibold uppercase text-blue-700">Logic
                                                                    blocks</p>
                                                                {adjustment.logicBlocks.map(block => (
                                                                    <div key={block.id}
                                                                         className="rounded border border-blue-100 bg-white p-3">
                                                                        <div className="text-[11px] text-blue-700">
                                                                            +{block.add || 0}{block.addPercent ? ` / ${block.addPercent}%` : ''}
                                                                        </div>
                                                                        {block.conditions.length > 0 ? (
                                                                            <div className="mt-1 flex flex-wrap gap-1">
                                                                                {block.conditions.map(condition => (
                                                                                    <span key={condition.id}
                                                                                          className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700">
                                                                                        {condition.factorKey}: {formatConditionValueDisplay(condition)}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-[10px] text-blue-500">Always
                                                                                applies</p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={infoTextClass}>Add adjustments to see how factor cases
                                                translate into price changes.</p>
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
                                    <Button variant="outline" size="sm" onClick={refreshPricingRules}
                                            disabled={pricingRulesLoading}>
                                        {pricingRulesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> :
                                            <RefreshCcw className="mr-2 h-4 w-4"/>}
                                        Refresh
                                    </Button>
                                }
                            >
                                {pricingRulesError ? <p className="text-sm text-red-600">{pricingRulesError}</p> : null}

                                {/* Desktop Table View */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="w-24">Priority</TableHead>
                                                <TableHead>Rule</TableHead>
                                                <TableHead>Pricing</TableHead>
                                                <TableHead>Conditions</TableHead>
                                                <TableHead>Adjustments</TableHead>
                                                <TableHead>Validity</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pricingRules.map(rule => {
                                                const parsed = parseRuleJson(rule)
                                                        return (
                                                    <TableRow
                                                        key={rule.id}
                                                        draggable
                                                        onDragStart={event => handleDragStart(event, rule.id)}
                                                        onDragOver={event => handleDragOver(event, rule.id)}
                                                        onDragEnd={handleDragEnd}
                                                        className={cn('cursor-move transition hover:bg-blue-50', draggedRuleId === rule.id ? 'bg-blue-50' : '')}
                                                    >
                                                        <TableCell className="font-semibold text-slate-800">
                                                            {rule.priority}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col space-y-1.5">
                                                                <div className="flex items-baseline gap-2">
                                                                    <span className="font-semibold text-slate-800">Rule #{rule.id}</span>
                                                                </div>
                                                                <div className="space-y-0.5 text-sm">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span
                                                                            className="text-slate-500 min-w-[70px]">Procedure:</span>
                                                                        <span
                                                                            className="font-medium text-slate-700">{rule.procedureName}</span>
                                                                        <span
                                                                            className="text-xs text-slate-400">(#{rule.procedureId})</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-slate-500 min-w-[70px]">Price List:</span>
                                                                        <span
                                                                            className="font-medium text-slate-700">{rule.priceListName}</span>
                                                                        <span
                                                                            className="text-xs text-slate-400">(#{rule.priceListId})</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                {/* Pricing mode badge */}
                                                                <span
                                                                    className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
        {formatRulePricing(parsed).split(" ")[0]}
    </span>

                                                                {/* Price badge */}
                                                                <span
                                                                    className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-100">
        {formatRulePricing(parsed).split(" ")[1]}
    </span>
                                                            </div>
                                                        </TableCell>

                                                        <TableCell>
                                                            {rule.ruleJson ? (
                                                                <RuleConditionsDisplay ruleJson={rule.ruleJson}/>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 italic">No conditions defined</span>
                                                            )}
                                                        </TableCell>

                                                        <TableCell>
                                                            <div className="space-y-2">
                                                                {parsed?.adjustments && Array.isArray(parsed.adjustments) && parsed.adjustments.length > 0 ? (
                                                                    parsed.adjustments.map((adj: any, idx: number) => {
                                                                        const factorKey = adj.factorKey ?? adj.factor_key

                                                                        // ----- NORMALIZATION -----
                                                                        const rawCases = adj.cases ?? {}
                                                                        const normalizedCases = Array.isArray(rawCases)
                                                                            ? rawCases
                                                                            : typeof rawCases === 'object'
                                                                                ? Object.entries(rawCases).map(([key, val]) => ({
                                                                                    key,
                                                                                    value: val
                                                                                }))
                                                                                : []

                                                                        const normalizedTiers = Array.isArray(adj.tiers)
                                                                            ? adj.tiers
                                                                            : []

                                                                        const normalizedLogicBlocks = Array.isArray(adj.logicBlocks)
                                                                            ? adj.logicBlocks
                                                                            : []

                                                                        return (
                                                                            <div
                                                                                key={idx}
                                                                                className="rounded-md border border-purple-300 bg-purple-50 px-2 py-1 text-xs text-purple-700"
                                                                            >
                                                                                <div className="font-semibold">
                                                                                    {factorKey} → {adj.type}
                                                                                </div>

                                                                                {/* === CASES === */}
                                                                                {normalizedCases.length > 0 && (
                                                                                    <div
                                                                                        className="mt-1 flex flex-wrap gap-1">
                                                                                        {normalizedCases.map((c: any, i: number) => {
                                                                                            const displayValue =
                                                                                                c.value &&
                                                                                                typeof c.value === 'object' &&
                                                                                                !Array.isArray(c.value)
                                                                                                    ? Object.entries(c.value)
                                                                                                        .map(([k, v]) => `${k}: ${v}`)
                                                                                                        .join(', ')
                                                                                                    : String(c.value)

                                                                                            return (
                                                                                                <span
                                                                                                    key={`${factorKey}-case-${i}`}
                                                                                                    className="rounded bg-white px-1.5 py-0.5 text-[10px] border border-purple-300 font-medium"
                                                                                                >
                                            {c.key}: {displayValue}
                                        </span>
                                                                                            )
                                                                                        })}
                                                                                    </div>
                                                                                )}

                                                                                {/* === PERCENT === */}
                                                                                {adj.percent !== null && adj.percent !== undefined && (
                                                                                    <div className="mt-1 text-[10px]">
                                                                                        Percent: <span
                                                                                        className="font-bold">{adj.percent}%</span>
                                                                                    </div>
                                                                                )}

                                                                                {/* === TIERS === */}
                                                                                {normalizedTiers.length > 0 && (
                                                                                    <div className="mt-1 space-y-1">
                                                                                        <div
                                                                                            className="text-[10px] font-semibold uppercase text-purple-700">Tiers
                                                                                        </div>
                                                                                        <div
                                                                                            className="flex flex-wrap gap-1">
                                                                                            {normalizedTiers.map((tier: any, tierIndex: number) => (
                                                                                                <span
                                                                                                    key={`${factorKey}-tier-${tierIndex}`}
                                                                                                    className="rounded bg-white px-1.5 py-0.5 text-[10px] text-purple-700"
                                                                                                >
                                            {tier.value ?? '—'} → +{tier.add ?? 0}
                                                                                                    {tier.percent ? ` / ${tier.percent}%` : ''}
                                        </span>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                {/* === LOGIC BLOCKS === */}
                                                                                {normalizedLogicBlocks.length > 0 && (
                                                                                    <div className="mt-1 space-y-1">
                                                                                        <div
                                                                                            className="text-[10px] font-semibold uppercase text-purple-700">
                                                                                            Logic blocks
                                                                                        </div>
                                                                                        <div className="space-y-1">
                                                                                            {normalizedLogicBlocks.map((block: any, blockIndex: number) => (
                                                                                                <div
                                                                                                    key={`${factorKey}-logic-${blockIndex}`}
                                                                                                    className="rounded border border-purple-200 bg-white px-1.5 py-1"
                                                                                                >
                                                                                                    <div
                                                                                                        className="text-[10px] text-purple-700">
                                                                                                        +{block.add ?? 0}
                                                                                                        {block.addPercent ? ` / ${block.addPercent}%` : ''}
                                                                                                    </div>

                                                                                                    {Array.isArray(block.whenConditions) &&
                                                                                                    block.whenConditions.length > 0 ? (
                                                                                                        <div
                                                                                                            className="mt-1 flex flex-wrap gap-1">
                                                                                                            {block.whenConditions.map(
                                                                                                                (condition: any, conditionIndex: number) => (
                                                                                                                    <span
                                                                                                                        key={`${factorKey}-logic-${blockIndex}-${conditionIndex}`}
                                                                                                                        className="rounded bg-purple-50 px-1 py-0.5 text-[9px] text-purple-700"
                                                                                                                    >
                                                                {condition.factor}:{' '}
                                                                                                                        {formatConditionValue(
                                                                                                                            condition.factor,
                                                                                                                            condition.value
                                                                                                                        )}
                                                            </span>
                                                                                                                )
                                                                                                            )}
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <p className="text-[9px] text-purple-500">Always
                                                                                                            applies</p>
                                                                                                    )}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    })
                                                                ) : (
                                                                    <span className="text-xs text-slate-400 italic">No adjustments</span>
                                                                )}
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

                                {/* Mobile/Tablet Card View */}
                                <div className="lg:hidden space-y-3">
                                    {pricingRules.map(rule => {
                                        const parsed = parseRuleJson(rule)
                                        return (
                                            <div
                                                key={rule.id}
                                                draggable
                                                onDragStart={event => handleDragStart(event, rule.id)}
                                                onDragOver={event => handleDragOver(event, rule.id)}
                                                onDragEnd={handleDragEnd}
                                                className={cn(
                                                    'border rounded-lg p-4 bg-white transition-all touch-manipulation',
                                                    'hover:shadow-md hover:border-blue-300',
                                                    draggedRuleId === rule.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200'
                                                )}
                                            >
                                                {/* Header with Priority and Rule ID */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100">
                                                            <span
                                                                className="text-lg font-bold text-slate-700">{rule.priority}</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-slate-800">Rule
                                                                #{rule.id}</h3>
                                                            <span
                                                                className="inline-block mt-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                                        {formatRulePricing(parsed)}
                                    </span>
                                                        </div>
                                                    </div>
                                                    <svg className="w-5 h-5 text-slate-400 cursor-move md:hidden"
                                                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round"
                                                              strokeWidth={2} d="M4 8h16M4 16h16"/>
                                                    </svg>
                                                </div>

                                                {/* Details Grid */}
                                                <div className="space-y-3">
                                                    {/* Procedure and Price List */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="bg-slate-50 rounded-md p-2">
                                                            <div className="text-xs text-slate-500 mb-0.5">Procedure
                                                            </div>
                                                            <div
                                                                className="font-medium text-sm text-slate-800">{rule.procedureName}</div>
                                                            <div
                                                                className="text-xs text-slate-400">ID: {rule.procedureId}</div>
                                                        </div>
                                                        <div className="bg-slate-50 rounded-md p-2">
                                                            <div className="text-xs text-slate-500 mb-0.5">Price List
                                                            </div>
                                                            <div
                                                                className="font-medium text-sm text-slate-800">{rule.priceListName}</div>
                                                            <div
                                                                className="text-xs text-slate-400">ID: {rule.priceListId}</div>
                                                        </div>
                                                    </div>

                                                    {/* Conditions */}
                                                    <div>
                                                        <div className="text-xs text-slate-500 mb-1.5">Conditions</div>
                                                        {rule.ruleJson ? (
                                                            <RuleConditionsDisplay ruleJson={rule.ruleJson}/>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">No conditions defined</span>
                                                        )}
                                                    </div>


                                                    {/* Validity */}
                                                    {(rule.validFrom || rule.validTo) && (
                                                        <div
                                                            className="flex items-center gap-1.5 text-sm text-slate-600">
                                                            <svg className="w-4 h-4 text-slate-400" fill="none"
                                                                 stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                      strokeWidth={2}
                                                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                                            </svg>
                                                            <span>
                                        {Array.isArray(rule.validFrom) ? rule.validFrom.join('/') : rule.validFrom}
                                                                {rule.validTo ? ` → ${Array.isArray(rule.validTo) ? rule.validTo.join('/') : rule.validTo}` : ''}
                                    </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {pricingRules.length === 0 ?
                                    <p className="mt-4 text-sm text-slate-500 text-center">No rules found.</p> : null}
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
                        <TabsList
                            className="flex w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
                            <TabsTrigger value="listing" className="flex-1 min-w-[120px]">Listing</TabsTrigger>
                            <TabsTrigger value="form" className="flex-1 min-w-[120px]">Editor</TabsTrigger>
                        </TabsList>

                        <TabsContent value="listing" className="space-y-6">
                            <SectionCard
                                title="Point Rates"
                                description="Manage point prices with filtering, card view, and inline editing."
                                actions={
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setPointRatesView('table')}
                                                className={pointRatesView === 'table' ? 'border-blue-500 text-blue-600' : ''}>
                                            Table view
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => setPointRatesView('card')}
                                                className={pointRatesView === 'card' ? 'border-blue-500 text-blue-600' : ''}>
                                            Card view
                                        </Button>
                                        <Button onClick={() => handleOpenPointRateDialog()}>
                                            <Plus className="mr-2 h-4 w-4"/>
                                            Add point rate
                                        </Button>
                                    </div>
                                }
                            >
                                {pointRatesError ? <p className="text-sm text-red-600">{pointRatesError}</p> : null}
                                <div
                                    className="mb-4 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="point-filter-price-list">Price list (context)</Label>
                                        <Input
                                            id="point-filter-price-list"
                                            value={pointRateFilters.priceListId}
                                            onChange={event => setPointRateFilters(prev => ({
                                                ...prev,
                                                priceListId: event.target.value
                                            }))}
                                            placeholder="Context value"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="point-filter-insurance">Insurance degree ID</Label>
                                        <Input
                                            id="point-filter-insurance"
                                            value={pointRateFilters.insuranceDegreeId}
                                            onChange={event => setPointRateFilters(prev => ({
                                                ...prev,
                                                insuranceDegreeId: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="point-filter-date">Valid on</Label>
                                        <Input
                                            id="point-filter-date"
                                            type="date"
                                            value={pointRateFilters.validOn}
                                            onChange={event => setPointRateFilters(prev => ({
                                                ...prev,
                                                validOn: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button variant="outline" className="w-full" onClick={refreshPointRates}
                                                disabled={pointRatesLoading}>
                                            {pointRatesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> :
                                                <RefreshCcw className="mr-2 h-4 w-4"/>}
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
                                                                <span
                                                                    className="font-medium text-slate-800">{rate.insuranceDegree?.nameEn ?? '—'}</span>
                                                                <span
                                                                    className="text-xs text-slate-500">{rate.insuranceDegree?.code}</span>
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
                                                                <Button variant="outline" size="sm"
                                                                        onClick={() => handleOpenPointRateDialog(rate)}>
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
                                            <div key={rate.id}
                                                 className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{rate.insuranceDegree?.nameEn ?? '—'}</p>
                                                        <p className="text-xs text-slate-500">{rate.insuranceDegree?.code ?? '—'}</p>
                                                    </div>
                                                    <span
                                                        className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">{formatCurrency(rate.pointPrice)}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                                    <span>Point range</span>
                                                    <span
                                                        className="text-right">{rate.minPointPrice ?? '—'} → {rate.maxPointPrice ?? '—'}</span>
                                                    <span>Result range</span>
                                                    <span
                                                        className="text-right">{rate.resultMin ?? '—'} → {rate.resultMax ?? '—'}</span>
                                                    <span>Validity</span>
                                                    <span
                                                        className="text-right">{formatDate(rate.validFrom)} → {rate.validTo ? formatDate(rate.validTo) : 'Open-ended'}</span>
                                                </div>
                                                <Button size="sm" variant="outline"
                                                        onClick={() => handleOpenPointRateDialog(rate)}>
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
                                                onChange={event => setPointRateForm(prev => ({
                                                    ...prev,
                                                    insuranceDegreeId: event.target.value
                                                }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="point-price">Point price</Label>
                                            <Input
                                                id="point-price"
                                                type="number"
                                                value={pointRateForm.pointPrice}
                                                onChange={event => setPointRateForm(prev => ({
                                                    ...prev,
                                                    pointPrice: event.target.value
                                                }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="point-min">Min point price</Label>
                                            <Input
                                                id="point-min"
                                                type="number"
                                                value={pointRateForm.minPointPrice}
                                                onChange={event => setPointRateForm(prev => ({
                                                    ...prev,
                                                    minPointPrice: event.target.value
                                                }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="point-max">Max point price</Label>
                                            <Input
                                                id="point-max"
                                                type="number"
                                                value={pointRateForm.maxPointPrice}
                                                onChange={event => setPointRateForm(prev => ({
                                                    ...prev,
                                                    maxPointPrice: event.target.value
                                                }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="point-result-min">Result min</Label>
                                            <Input
                                                id="point-result-min"
                                                type="number"
                                                value={pointRateForm.resultMin}
                                                onChange={event => setPointRateForm(prev => ({
                                                    ...prev,
                                                    resultMin: event.target.value
                                                }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="point-result-max">Result max</Label>
                                            <Input
                                                id="point-result-max"
                                                type="number"
                                                value={pointRateForm.resultMax}
                                                onChange={event => setPointRateForm(prev => ({
                                                    ...prev,
                                                    resultMax: event.target.value
                                                }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="point-valid-from">Valid from</Label>
                                            <Input
                                                id="point-valid-from"
                                                type="date"
                                                value={pointRateForm.validFrom}
                                                onChange={event => setPointRateForm(prev => ({
                                                    ...prev,
                                                    validFrom: event.target.value
                                                }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="point-valid-to">Valid to</Label>
                                            <Input
                                                id="point-valid-to"
                                                type="date"
                                                value={pointRateForm.validTo}
                                                onChange={event => setPointRateForm(prev => ({
                                                    ...prev,
                                                    validTo: event.target.value
                                                }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="point-created-by">Created by</Label>
                                            <Input
                                                id="point-created-by"
                                                value={pointRateForm.createdBy}
                                                onChange={event => setPointRateForm(prev => ({
                                                    ...prev,
                                                    createdBy: event.target.value
                                                }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold text-slate-700">Context</Label>
                                            <Button type="button" variant="outline" size="sm"
                                                    onClick={addPointRateContextEntry}>
                                                <Plus className="mr-2 h-4 w-4"/>
                                                Add context entry
                                            </Button>
                                        </div>
                                        {pointRateContextEntries.length === 0 ? (
                                            <p className={infoTextClass}>Context defines when the point rate applies.
                                                Add key/value pairs to target specific scenarios.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {pointRateContextEntries.map(entry => (
                                                    <div key={entry.id}
                                                         className="flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center md:gap-3">
                                                        <Input
                                                            placeholder="Key"
                                                            value={entry.key}
                                                            onChange={event => updatePointRateContextEntry(entry.id, {key: event.target.value})}
                                                        />
                                                        <Input
                                                            placeholder="Value or JSON"
                                                            value={entry.value}
                                                            onChange={event => updatePointRateContextEntry(entry.id, {value: event.target.value})}
                                                        />
                                                        <Button type="button" variant="ghost" size="icon"
                                                                onClick={() => removePointRateContextEntry(entry.id)}>
                                                            <Trash2 className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={savingPointRate}>
                                            {savingPointRate ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> :
                                                <BadgeCheck className="mr-2 h-4 w-4"/>}
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
                        <TabsList
                            className="flex w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
                            <TabsTrigger value="listing" className="flex-1 min-w-[120px]">Listing</TabsTrigger>
                            <TabsTrigger value="form" className="flex-1 min-w-[120px]">Editor</TabsTrigger>
                        </TabsList>

                        <TabsContent value="listing" className="space-y-6">
                            <SectionCard
                                title="Period Discounts"
                                description="Configure recurring discounts for procedures based on time windows."
                                actions={
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={refreshPeriodDiscounts}
                                                disabled={periodDiscountsLoading}>
                                            {periodDiscountsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> :
                                                <RefreshCcw className="mr-2 h-4 w-4"/>}
                                            Refresh
                                        </Button>
                                        <Button size="sm" onClick={() => setPeriodDiscountsView('form')}>
                                            <Plus className="mr-2 h-4 w-4"/>
                                            New discount
                                        </Button>
                                    </div>
                                }
                            >
                                {periodDiscountsError ?
                                    <p className="text-sm text-red-600">{periodDiscountsError}</p> : null}
                                <div className="space-y-3">
                                    {periodDiscounts.map(discount => (
                                        <div key={discount.id}
                                             className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className="text-sm font-semibold text-slate-800">Discount #{discount.id}</span>
                                                <span
                                                    className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                                                    {discount.discountPct}% for {discount.period} {discount.periodUnit}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-xs text-slate-500">
                                                Valid: {formatDate(discount.validFrom)} → {discount.validTo ? formatDate(discount.validTo) : 'Open-ended'}
                                            </div>
                                        </div>
                                    ))}
                                    {periodDiscounts.length === 0 ?
                                        <p className={infoTextClass}>No discounts found.</p> : null}
                                </div>
                            </SectionCard>
                        </TabsContent>

                        <TabsContent value="form" className="space-y-6">
                            <SectionCard
                                title="Create period discount"
                                description="Set discount intervals before publishing to the list."
                                actions={
                                    <Button variant="outline" size="sm"
                                            onClick={() => setPeriodDiscountsView('listing')}>
                                        Back to listing
                                    </Button>
                                }
                            >
                                <form onSubmit={handleSavePeriodDiscount}
                                      className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="discount-procedure">Procedure ID</Label>
                                        <Input
                                            id="discount-procedure"
                                            type="number"
                                            value={periodDiscountForm.procedureId}
                                            onChange={event => setPeriodDiscountForm(prev => ({
                                                ...prev,
                                                procedureId: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="discount-price-list">Price list ID</Label>
                                        <Input
                                            id="discount-price-list"
                                            type="number"
                                            value={periodDiscountForm.priceListId}
                                            onChange={event => setPeriodDiscountForm(prev => ({
                                                ...prev,
                                                priceListId: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="discount-period">Period</Label>
                                        <Input
                                            id="discount-period"
                                            type="number"
                                            value={periodDiscountForm.period}
                                            onChange={event => setPeriodDiscountForm(prev => ({
                                                ...prev,
                                                period: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="discount-unit">Period unit</Label>
                                        <Input
                                            id="discount-unit"
                                            value={periodDiscountForm.periodUnit}
                                            onChange={event => setPeriodDiscountForm(prev => ({
                                                ...prev,
                                                periodUnit: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="discount-pct">Discount %</Label>
                                        <Input
                                            id="discount-pct"
                                            type="number"
                                            value={periodDiscountForm.discountPct}
                                            onChange={event => setPeriodDiscountForm(prev => ({
                                                ...prev,
                                                discountPct: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="discount-from">Valid from</Label>
                                        <Input
                                            id="discount-from"
                                            type="date"
                                            value={periodDiscountForm.validFrom}
                                            onChange={event => setPeriodDiscountForm(prev => ({
                                                ...prev,
                                                validFrom: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="discount-to">Valid to</Label>
                                        <Input
                                            id="discount-to"
                                            type="date"
                                            value={periodDiscountForm.validTo}
                                            onChange={event => setPeriodDiscountForm(prev => ({
                                                ...prev,
                                                validTo: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="discount-created-by">Created by</Label>
                                        <Input
                                            id="discount-created-by"
                                            value={periodDiscountForm.createdBy}
                                            onChange={event => setPeriodDiscountForm(prev => ({
                                                ...prev,
                                                createdBy: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="flex items-end justify-end">
                                        <Button type="submit" disabled={savingDiscount} className="w-full md:w-auto">
                                            {savingDiscount ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> :
                                                <BadgeCheck className="mr-2 h-4 w-4"/>}
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
                        <TabsList
                            className="flex w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
                            <TabsTrigger value="listing" className="flex-1 min-w-[120px]">Listing</TabsTrigger>
                            <TabsTrigger value="create" className="flex-1 min-w-[120px]">Editor</TabsTrigger>
                        </TabsList>

                        <TabsContent value="listing" className="space-y-6">
                            <SectionCard
                                title="Pricing Factor Library"
                                description="Factors power rule conditions and simulation contexts."
                                actions={
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={refreshFactors}
                                                disabled={factorsLoading}>
                                            {factorsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> :
                                                <RefreshCcw className="mr-2 h-4 w-4"/>}
                                            Refresh
                                        </Button>
                                        <Button size="sm" onClick={() => setFactorsView('create')}>
                                            <Plus className="mr-2 h-4 w-4"/>
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
                                            <span
                                                className="ml-2 rounded bg-slate-200 px-1 text-[10px] uppercase text-slate-600">{factor.dataType}</span>
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
                                            onChange={event => setNewFactorForm(prev => ({
                                                ...prev,
                                                key: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="factor-name-en">Name (English)</Label>
                                        <Input
                                            id="factor-name-en"
                                            placeholder="e.g. Visit Time"
                                            value={newFactorForm.nameEn}
                                            onChange={event => setNewFactorForm(prev => ({
                                                ...prev,
                                                nameEn: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="factor-name-ar">Name (Arabic)</Label>
                                        <Input
                                            id="factor-name-ar"
                                            value={newFactorForm.nameAr}
                                            onChange={event => setNewFactorForm(prev => ({
                                                ...prev,
                                                nameAr: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label>Data type</Label>
                                        <Select
                                            value={newFactorForm.dataType}
                                            onValueChange={value => setNewFactorForm(prev => ({
                                                ...prev,
                                                dataType: value
                                            }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type"/>
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
                                            onChange={event => setNewFactorForm(prev => ({
                                                ...prev,
                                                allowedValues: event.target.value
                                            }))}
                                        />
                                    </div>
                                    {factorCreationError ?
                                        <p className="text-sm text-red-600">{factorCreationError}</p> : null}
                                    <Button type="submit" className="w-full" disabled={creatingFactor}>
                                        {creatingFactor ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> :
                                            <Plus className="mr-2 h-4 w-4"/>}
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
                        <TabsList
                            className="flex w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
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
                                                onChange={event => setSimulationForm(prev => ({
                                                    ...prev,
                                                    procedureId: event.target.value
                                                }))}
                                            />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="sim-price-list">Price list ID</Label>
                                            <Input
                                                id="sim-price-list"
                                                type="number"
                                                value={simulationForm.priceListId}
                                                onChange={event => setSimulationForm(prev => ({
                                                    ...prev,
                                                    priceListId: event.target.value
                                                }))}
                                            />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="sim-insurance-degree">Insurance degree ID</Label>
                                            <Input
                                                id="sim-insurance-degree"
                                                type="number"
                                                value={simulationForm.insuranceDegreeId}
                                                onChange={event => setSimulationForm(prev => ({
                                                    ...prev,
                                                    insuranceDegreeId: event.target.value
                                                }))}
                                            />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="sim-date">Evaluation date</Label>
                                            <Input
                                                id="sim-date"
                                                type="date"
                                                value={simulationForm.date}
                                                onChange={event => setSimulationForm(prev => ({
                                                    ...prev,
                                                    date: event.target.value
                                                }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-slate-700">Dynamic factors</h3>
                                            <Button type="button" variant="outline" size="sm"
                                                    onClick={addSimulationEntry} disabled={factors.length === 0}>
                                                <Plus className="mr-2 h-4 w-4"/>
                                                Add factor
                                            </Button>
                                        </div>

                                        {simulationEntries.length === 0 ? (
                                            <p className={infoTextClass}>No factors selected yet. Add factors to test
                                                conditional pricing logic.</p>
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
                                                        <div key={entry.id}
                                                             className="rounded-lg border border-slate-200 p-4">
                                                            <div
                                                                className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                                                                <div className="flex-1 space-y-2">
                                                                    <Label
                                                                        className="text-xs uppercase text-slate-500">Factor</Label>
                                                                    <Select
                                                                        value={entry.factorKey}
                                                                        onValueChange={value => updateSimulationEntry(entry.id, {factorKey: value})}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select factor"/>
                                                                        </SelectTrigger>
                                                                        <SelectContent>{factorOptions}</SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="flex-1 space-y-2">
                                                                    <Label
                                                                        className="text-xs uppercase text-slate-500">Value</Label>
                                                                    {inputKind === 'boolean' ? (
                                                                        <div
                                                                            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                                                            <Switch
                                                                                checked={Boolean(entry.value)}
                                                                                onCheckedChange={checked => updateSimulationEntry(entry.id, {value: checked})}
                                                                            />
                                                                            <span
                                                                                className="text-sm text-slate-700">{entry.value ? 'True' : 'False'}</span>
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
                                                                            onChange={event => updateSimulationEntry(entry.id, {value: event.target.value})}
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
                                                                    <Trash2 className="h-4 w-4"/>
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
                                        {simulationLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> :
                                            <CircleDot className="mr-2 h-4 w-4"/>}
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
                                            <Button type="button" variant="outline"
                                                    onClick={() => setSimulationView('insights')}>
                                                <Info className="mr-2 h-4 w-4"/>
                                                View breakdown
                                            </Button>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            Rule #{simulationResult.selectedRuleId ?? '—'} ·
                                            Procedure {simulationResult.procedureId} · Price
                                            list {simulationResult.priceListId}
                                        </p>
                                    </div>


                                ) : null}

                                {simulationResult && simulationResult.selectedRule?.conditions && simulationResult.selectedRule.conditions.length > 0 && (
                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                        <div className="flex flex-wrap items-center gap-1 text-xs">
                                            <span className="text-blue-700 font-medium">Applied Conditions:</span>
                                            {simulationResult.selectedRule.conditions.map((cond: any, idx: number) => (
                                                <span key={idx} className="inline-flex items-center">
                    <span className="bg-white px-1.5 py-0.5 rounded border border-blue-300 text-blue-800">
                        {cond.factor} {cond.operator} {
                        typeof cond.value === 'boolean'
                            ? (cond.value ? 'Yes' : 'No')
                            : Array.isArray(cond.value)
                                ? cond.value.join(', ')
                                : String(cond.value)
                    }
                    </span>
                                                    {idx < simulationResult.selectedRule.conditions.length - 1 &&
                                                        <span className="mx-1 text-blue-400">•</span>
                                                    }
                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                                            <summary className="cursor-pointer font-medium text-slate-800">Selected
                                                Rule
                                            </summary>
                                            {simulationResult.selectedRule ? (
                                                <div className="mt-3 space-y-2 text-sm text-slate-700">
                                                    <p>Mode: {simulationResult.selectedRule.pricing.mode}</p>
                                                    {simulationResult.selectedRule.pricing.fixed_price ? (
                                                        <p>Fixed
                                                            price: {formatCurrency(simulationResult.selectedRule.pricing.fixed_price)}</p>
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
                                            <summary className="cursor-pointer font-medium text-slate-800">Condition
                                                Evaluation
                                            </summary>
                                            <div className="mt-3 space-y-2">
                                                {simulationResult.evaluatedRules.map(rule => {
                                                    // Check if this is the selected rule to get its conditions
                                                    const isSelectedRule = rule.ruleId === simulationResult.selectedRuleId;
                                                    const conditions = isSelectedRule && simulationResult.selectedRule?.conditions
                                                        ? simulationResult.selectedRule.conditions
                                                        : [];

                                                    return (
                                                        <div
                                                            key={rule.ruleId}
                                                            className={cn(
                                                                'rounded-md border p-3',
                                                                rule.matched ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
                                                            )}
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                        <span className={cn('font-medium', rule.matched ? 'text-emerald-700' : 'text-rose-700')}>
                            Rule #{rule.ruleId}
                        </span>
                                                                <span className="text-xs uppercase text-slate-500">
                            Priority {rule.priority}
                        </span>
                                                            </div>

                                                            {/* Show matched conditions with badges */}
                                                            {rule.matched && conditions.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    <p className="text-xs text-slate-600 mb-1">Matched
                                                                        Conditions:</p>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {conditions.map((condition: any, idx: number) => {
                                                                            const label = FACTOR_LABELS[condition.factor] || condition.factor;
                                                                            const value = formatConditionValue(condition.factor, condition.value);

                                                                            return (
                                                                                <div key={idx}
                                                                                     className="inline-flex items-center">
                                                                                    {/* Factor badge */}
                                                                                    <span
                                                                                        className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-l text-xs font-medium">
                                                                                        {label}
                                                                                    </span>

                                                                                    {/* Operator badge */}
                                                                                    <span
                                                                                        className="bg-slate-100 text-slate-600 px-1.5 py-0.5 text-xs">
                                                                                        {condition.operator === '=' ? '=' :
                                                                                            condition.operator === 'EQUALS' ? '=' :
                                                                                                condition.operator === '!=' ? '≠' :
                                                                                                    condition.operator === 'NOT_EQUALS' ? '≠' :
                                                                                                        condition.operator === '>' ? '>' :
                                                                                                            condition.operator === 'GREATER_THAN' ? '>' :
                                                                                                                condition.operator === '<' ? '<' :
                                                                                                                    condition.operator === 'LESS_THAN' ? '<' :
                                                                                                                        condition.operator === 'IN' ? 'in' :
                                                                                                                            condition.operator === 'BETWEEN' ? '↔' :
                                                                                                                                condition.operator === 'MIN' ? '≥' :
                                                                                                                                    condition.operator === 'MAX' ? '≤' :
                                                                                                                                        condition.operator}
                                                                                    </span>

                                                                                    {/* Value badge */}
                                                                                    <span
                                                                                        className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-r text-xs font-medium">
                                                                                        {value}
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ) : rule.matched ? (
                                                                <p className="text-xs text-emerald-600">All conditions
                                                                    matched.</p>
                                                            ) : null}

                                                            {/* Show failed conditions */}
                                                            {rule.failedConditions && rule.failedConditions.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    <p className="text-xs text-rose-600 mb-1">Failed
                                                                        conditions:</p>
                                                                    <ul className="text-xs space-y-0.5 text-rose-700">
                                                                        {rule.failedConditions.map((condition, idx) => (
                                                                            <li key={idx}>
                                                                                {formatEvaluationCondition(condition)}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            ) : !rule.matched ? (
                                                                <p className="text-xs text-rose-600">Conditions did not
                                                                    match.</p>
                                                            ) : null}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </details>

                                        <details className="rounded-lg border border-blue-200 bg-blue-50 p-4" open>
                                            <summary className="cursor-pointer font-medium text-blue-900">Point Rate
                                            </summary>
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
                                            <summary className="cursor-pointer font-medium text-blue-900">Discounts
                                            </summary>
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
                                            <summary className="cursor-pointer font-medium text-blue-900">Adjustments
                                            </summary>
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