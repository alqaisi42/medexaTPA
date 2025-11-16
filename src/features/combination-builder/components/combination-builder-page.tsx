'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Download,
    Upload,
    Grid3X3,
    Copy,
    Calculator,
    ChevronsUpDown,
    X,
    Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
    CombinationRule,
    CombinationType,
    CombinationFactor,
    CreatePricingRulePayload,
    PriceListSummary,
    ProcedureSummary,
} from '@/types'
import { generateId, formatCurrency } from '@/lib/utils'
import { createPricingRule, fetchPriceLists } from '@/lib/api/pricing'
import { searchProcedures } from '@/lib/api/procedures'
import {
    formatPriceListLabel,
    formatProcedureLabel,
} from '@/features/procedures-price-lists/components/procedures-price-lists-page/helpers'

type FactorDataType = 'STRING' | 'NUMBER'

interface FactorDefinition {
    key: string
    name: string
    dataType: FactorDataType
    allowedValues?: string[]
    description?: string
}

interface FactorCategory {
    id: string
    title: string
    description: string
    factors: FactorDefinition[]
}

type DiscountType = 'none' | 'percent' | 'amount'
type AdjustmentDirection = 'none' | 'increase' | 'decrease'
type AdjustmentUnit = 'PERCENT' | 'AMOUNT'
type RuleStatus = 'draft' | 'active'

interface RuleFormState {
    name: string
    scope: CombinationType
    status: RuleStatus
    description: string
    stackable: boolean
    discountType: DiscountType
    discountValue: number
    discountCap?: number
    adjustmentDirection: AdjustmentDirection
    adjustmentUnit: AdjustmentUnit
    adjustmentValue: number
    effectiveFrom: string
    effectiveTo?: string
    factors: Record<string, string>
    priceListId?: number
    procedureId?: number
    priority: number
    basePrice: number
}

const FACTOR_CATEGORIES: FactorCategory[] = [
    {
        id: 'patient',
        title: 'Patient Factors',
        description: 'Demographics and eligibility attributes',
        factors: [
            { key: 'patient_age', name: 'Patient Age', dataType: 'NUMBER', description: 'Use ranges like 0-18' },
            { key: 'gender', name: 'Gender', dataType: 'STRING', allowedValues: ['M', 'F'] },
            { key: 'insurance_degree', name: 'Insurance Degree', dataType: 'STRING', allowedValues: ['GOLD', 'SILVER', 'BRONZE', 'PLATINUM'] },
            { key: 'member_type', name: 'Member Type', dataType: 'STRING', allowedValues: ['HOF', 'DEPENDENT'] },
            { key: 'relation_degree', name: 'Relation Degree', dataType: 'STRING', allowedValues: ['SON', 'WIFE', 'FATHER', 'MOTHER'] },
            { key: 'chronic_status', name: 'Chronic Condition', dataType: 'STRING', allowedValues: ['YES', 'NO'] },
            { key: 'pregnancy_status', name: 'Pregnancy Status', dataType: 'STRING', allowedValues: ['YES', 'NO'] },
            { key: 'disability_level', name: 'Disability Level', dataType: 'STRING', allowedValues: ['NONE', 'MILD', 'SEVERE'] },
            { key: 'loyalty_score', name: 'Loyalty Score', dataType: 'NUMBER' }
        ]
    },
    {
        id: 'provider',
        title: 'Provider Factors',
        description: 'Facility attributes and network grouping',
        factors: [
            { key: 'provider_type', name: 'Provider Type', dataType: 'STRING', allowedValues: ['clinic', 'hospital', 'lab', 'radiology'] },
            { key: 'specialty_id', name: 'Specialty ID', dataType: 'NUMBER' },
            { key: 'provider_level', name: 'Provider Level', dataType: 'STRING', allowedValues: ['A', 'B', 'C'] },
            { key: 'provider_region', name: 'Provider Region', dataType: 'STRING', allowedValues: ['AMMAN', 'IRBID', 'AQABA'] },
            { key: 'provider_network_tier', name: 'Provider Network Tier', dataType: 'STRING', allowedValues: ['IN_NETWORK', 'OUT_NETWORK'] },
            { key: 'facility_experience_years', name: 'Facility Experience (Years)', dataType: 'NUMBER' },
            { key: 'facility_licensing_grade', name: 'Facility Licensing Grade', dataType: 'STRING', allowedValues: ['GRADE_1', 'GRADE_2'] }
        ]
    },
    {
        id: 'doctor',
        title: 'Doctor Factors',
        description: 'Physician experience and profile',
        factors: [
            { key: 'doctor_experience_years', name: 'Doctor Experience Years', dataType: 'NUMBER' },
            { key: 'doctor_title', name: 'Doctor Title', dataType: 'STRING', allowedValues: ['CONSULTANT', 'SPECIALIST', 'GP'] },
            { key: 'doctor_gender', name: 'Doctor Gender', dataType: 'STRING', allowedValues: ['M', 'F'] },
            { key: 'doctor_rating', name: 'Doctor Rating', dataType: 'NUMBER' },
            { key: 'doctor_shift', name: 'Doctor Shift', dataType: 'STRING', allowedValues: ['DAY', 'NIGHT'] }
        ]
    },
    {
        id: 'visit',
        title: 'Visit Factors',
        description: 'Visit metadata and channels',
        factors: [
            { key: 'visit_time', name: 'Visit Time', dataType: 'STRING', allowedValues: ['DAY', 'NIGHT'] },
            { key: 'visit_day', name: 'Visit Day', dataType: 'STRING', allowedValues: ['WEEKDAY', 'WEEKEND', 'HOLIDAY'] },
            { key: 'visit_type', name: 'Visit Type', dataType: 'STRING', allowedValues: ['NEW', 'FOLLOWUP'] },
            { key: 'visit_channel', name: 'Visit Channel', dataType: 'STRING', allowedValues: ['WALK_IN', 'ONLINE', 'PHONE'] },
            { key: 'visit_duration', name: 'Visit Duration (minutes)', dataType: 'NUMBER' }
        ]
    },
    {
        id: 'policy',
        title: 'Policy & Insurance',
        description: 'Coverage, co-pay and deductibles',
        factors: [
            { key: 'policy_type', name: 'Policy Type', dataType: 'STRING', allowedValues: ['VIP', 'CORPORATE', 'INDIVIDUAL'] },
            { key: 'coverage_type', name: 'Coverage Type', dataType: 'STRING', allowedValues: ['FULL', 'PARTIAL', 'EXCLUDED'] },
            { key: 'co_pay_percent', name: 'Co-Pay Percentage', dataType: 'NUMBER' },
            { key: 'has_preapproval', name: 'Preapproval Required', dataType: 'STRING', allowedValues: ['YES', 'NO'] },
            { key: 'policy_age_limit', name: 'Policy Age Limit', dataType: 'NUMBER' },
            { key: 'deductible_amount', name: 'Deductible Amount', dataType: 'NUMBER' }
        ]
    },
    {
        id: 'procedure',
        title: 'Procedure / CPT / ICD',
        description: 'Clinical grouping, severity and complexity',
        factors: [
            { key: 'procedure_group', name: 'Procedure Group', dataType: 'STRING', allowedValues: ['CONSULTATION', 'SURGERY', 'LAB', 'RAD'] },
            { key: 'cpt_level', name: 'CPT Complexity Level', dataType: 'STRING', allowedValues: ['LOW', 'MED', 'HIGH'] },
            { key: 'icd_category', name: 'ICD Category', dataType: 'STRING' },
            { key: 'connected_icd_count', name: 'Connected ICD Count', dataType: 'NUMBER' },
            { key: 'severity_level', name: 'Severity Level', dataType: 'STRING', allowedValues: ['NORMAL', 'MODERATE', 'CRITICAL'] }
        ]
    },
    {
        id: 'location',
        title: 'Location',
        description: 'Geography and zoning',
        factors: [
            { key: 'city', name: 'City', dataType: 'STRING' },
            { key: 'governorate', name: 'Governorate', dataType: 'STRING' },
            { key: 'zone', name: 'Zone', dataType: 'STRING', allowedValues: ['URBAN', 'RURAL'] }
        ]
    },
    {
        id: 'time',
        title: 'Time Factors',
        description: 'Calendar and seasonal impact',
        factors: [
            { key: 'day_of_week', name: 'Day of Week', dataType: 'STRING', allowedValues: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] },
            { key: 'season', name: 'Season', dataType: 'STRING', allowedValues: ['WINTER', 'SPRING', 'SUMMER', 'AUTUMN'] },
            { key: 'holiday_flag', name: 'Holiday Flag', dataType: 'STRING', allowedValues: ['YES', 'NO'] }
        ]
    },
    {
        id: 'claim',
        title: 'Claim Factors',
        description: 'Utilization and financial history',
        factors: [
            { key: 'claim_type', name: 'Claim Type', dataType: 'STRING', allowedValues: ['OPD', 'ER', 'IPD'] },
            { key: 'claim_amount', name: 'Claim Amount', dataType: 'NUMBER' },
            { key: 'claim_frequency', name: 'Claim Frequency', dataType: 'NUMBER' },
            { key: 'claim_previous_rejections', name: 'Previous Rejections', dataType: 'NUMBER' }
        ]
    },
    {
        id: 'advanced',
        title: 'Advanced & AI Factors',
        description: 'Future-ready risk scores and utilization signals',
        factors: [
            { key: 'ai_risk_score', name: 'AI Risk Score', dataType: 'NUMBER' },
            { key: 'doctor_ai_score', name: 'Doctor AI Score', dataType: 'NUMBER' },
            { key: 'patient_risk_level', name: 'Patient Risk Level', dataType: 'STRING', allowedValues: ['LOW', 'MED', 'HIGH'] },
            { key: 'utilization_score', name: 'Utilization Score', dataType: 'NUMBER' },
            { key: 'fraud_score', name: 'Fraud Score', dataType: 'NUMBER' },
            { key: 'travel_distance_km', name: 'Distance to Provider (KM)', dataType: 'NUMBER' },
            { key: 'queue_load', name: 'Queue Load', dataType: 'NUMBER' },
            { key: 'peak_time_flag', name: 'Peak-Time Flag', dataType: 'STRING', allowedValues: ['YES', 'NO'] }
        ]
    }
]

const FACTOR_DEFINITION_LOOKUP = FACTOR_CATEGORIES
    .flatMap(category => category.factors)
    .reduce<Record<string, FactorDefinition>>((accumulator, factor) => {
        accumulator[factor.key] = factor
        return accumulator
    }, {})

const buildInitialRuleForm = (): RuleFormState => ({
    name: '',
    scope: 'procedure_pricing',
    status: 'draft',
    description: '',
    stackable: true,
    discountType: 'none',
    discountValue: 0,
    discountCap: undefined,
    adjustmentDirection: 'none',
    adjustmentUnit: 'PERCENT',
    adjustmentValue: 0,
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: undefined,
    factors: {},
    priceListId: undefined,
    procedureId: undefined,
    priority: 1,
    basePrice: 0,
})

export function CombinationBuilderPage() {
    const [combinations, setCombinations] = useState<CombinationRule[]>([])
    const [filteredCombinations, setFilteredCombinations] = useState<CombinationRule[]>([])
    const [selectedCombination, setSelectedCombination] = useState<CombinationRule | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [combinationType, setCombinationType] = useState<CombinationType>('procedure_pricing')
    const [isMatrixView, setIsMatrixView] = useState(false)

    // Combination Form State
    const [formData, setFormData] = useState<Partial<CombinationRule>>({
        type: 'procedure_pricing',
        factors: [],
        value: 0,
        isDefault: false,
        effectiveDate: new Date(),
        priority: 1
    })

    const ANY_OPTION_VALUE = 'any'

    const [selectedFactors, setSelectedFactors] = useState<{
        provider?: string
        procedure?: string
        insuranceDegree?: string
        icd?: string
        gender?: string
        ageRange?: string
    }>({})

    const [ruleForm, setRuleForm] = useState<RuleFormState>(buildInitialRuleForm)
    const [activeRuleDesignerTab, setActiveRuleDesignerTab] = useState<'general' | 'factors' | 'financials' | 'summary'>('general')
    const [isCreatingRule, setIsCreatingRule] = useState(false)
    const [selectedPriceList, setSelectedPriceList] = useState<PriceListSummary | null>(null)
    const [selectedProcedure, setSelectedProcedure] = useState<ProcedureSummary | null>(null)
    const [priceListDropdownOpen, setPriceListDropdownOpen] = useState(false)
    const [priceListSearchTerm, setPriceListSearchTerm] = useState('')
    const [priceListOptions, setPriceListOptions] = useState<PriceListSummary[]>([])
    const [priceListSearchLoading, setPriceListSearchLoading] = useState(false)
    const [priceListSearchError, setPriceListSearchError] = useState<string | null>(null)
    const [procedureDropdownOpen, setProcedureDropdownOpen] = useState(false)
    const [procedureSearchTerm, setProcedureSearchTerm] = useState('')
    const [procedureOptions, setProcedureOptions] = useState<ProcedureSummary[]>([])
    const [procedureSearchLoading, setProcedureSearchLoading] = useState(false)
    const [procedureSearchError, setProcedureSearchError] = useState<string | null>(null)
    const priceListDropdownRef = useRef<HTMLDivElement | null>(null)
    const procedureDropdownRef = useRef<HTMLDivElement | null>(null)

    const updateSelectedFactor = <K extends keyof typeof selectedFactors>(
        factor: K,
        value: string
    ) => {
        setSelectedFactors(prev => {
            const next = { ...prev }

            if (value === ANY_OPTION_VALUE) {
                delete next[factor]
            } else {
                next[factor] = value
            }

            return next
        })
    }

    const handleRuleFactorChange = (key: string, value: string) => {
        setRuleForm(prev => ({
            ...prev,
            factors: {
                ...prev.factors,
                [key]: value
            }
        }))
    }

    const handleRuleFieldChange = <K extends keyof RuleFormState>(field: K, value: RuleFormState[K]) => {
        setRuleForm(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handlePriceListSelect = (priceList: PriceListSummary) => {
        handleRuleFieldChange('priceListId', priceList.id)
        setSelectedPriceList(priceList)
        setPriceListDropdownOpen(false)
    }

    const handleProcedureSelect = (procedure: ProcedureSummary) => {
        handleRuleFieldChange('procedureId', procedure.id)
        setSelectedProcedure(procedure)
        setProcedureDropdownOpen(false)
    }

    const clearPriceListSelection = () => {
        handleRuleFieldChange('priceListId', undefined)
        setSelectedPriceList(null)
    }

    const clearProcedureSelection = () => {
        handleRuleFieldChange('procedureId', undefined)
        setSelectedProcedure(null)
    }

    const resetRuleForm = () => {
        setRuleForm(buildInitialRuleForm())
        setSelectedPriceList(null)
        setSelectedProcedure(null)
        setPriceListSearchTerm('')
        setProcedureSearchTerm('')
        setActiveRuleDesignerTab('general')
    }

    const renderFactorInputControl = (factor: FactorDefinition) => {
        const value = ruleForm.factors[factor.key] ?? ''

        if (factor.allowedValues && factor.allowedValues.length > 0) {
            return (
                <Select
                    value={value}
                    onValueChange={(selected) => handleRuleFactorChange(factor.key, selected)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">Not Set</SelectItem>
                        {factor.allowedValues.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        }

        return (
            <Input
                type={factor.dataType === 'NUMBER' ? 'number' : 'text'}
                value={value}
                placeholder={factor.dataType === 'NUMBER' ? 'Enter numeric value' : 'Type value'}
                onChange={(e) => handleRuleFactorChange(factor.key, e.target.value)}
            />
        )
    }

    const parseFactorValue = (factorKey: string, rawValue: string): unknown => {
        const definition = FACTOR_DEFINITION_LOOKUP[factorKey]

        if (!rawValue) {
            return rawValue
        }

        if (definition?.dataType === 'NUMBER') {
            const numericValue = Number(rawValue)
            return Number.isNaN(numericValue) ? rawValue : numericValue
        }

        const trimmed = rawValue.trim()
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                return JSON.parse(trimmed)
            } catch {
                return trimmed
            }
        }

        return trimmed
    }

    const filledRuleFactors = Object.entries(ruleForm.factors).filter(([, value]) => value)

    const discountSummary = ruleForm.discountType === 'none'
        ? 'No discount applied'
        : ruleForm.discountType === 'percent'
            ? `${ruleForm.discountValue || 0}% discount${ruleForm.discountCap ? ` (cap ${formatCurrency(ruleForm.discountCap)})` : ''}`
            : `${formatCurrency(ruleForm.discountValue || 0)} discount${ruleForm.discountCap ? ` (cap ${formatCurrency(ruleForm.discountCap)})` : ''}`

    const adjustmentSummary = ruleForm.adjustmentDirection === 'none'
        ? 'No manual adjustment'
        : `${ruleForm.adjustmentDirection === 'increase' ? '+' : '-'}${ruleForm.adjustmentValue || 0}${ruleForm.adjustmentUnit === 'PERCENT' ? '%' : ' JD'}`

    const effectiveRangeSummary = ruleForm.effectiveTo
        ? `${ruleForm.effectiveFrom} → ${ruleForm.effectiveTo}`
        : `Effective from ${ruleForm.effectiveFrom}`

    const canCreateRule = Boolean(
        ruleForm.name.trim() &&
        ruleForm.priceListId &&
        ruleForm.procedureId &&
        filledRuleFactors.length > 0 &&
        ruleForm.basePrice >= 0,
    )

    const handleCreateRule = async () => {
        if (!ruleForm.priceListId || !ruleForm.procedureId) {
            alert('Please select both a price list and a procedure to continue')
            setActiveRuleDesignerTab('general')
            return
        }

        if (filledRuleFactors.length === 0) {
            alert('Add at least one factor value to build this rule context')
            setActiveRuleDesignerTab('factors')
            return
        }

        const conditions = filledRuleFactors.map(([factor, value]) => ({
            factor,
            operator: 'EQUALS',
            value: parseFactorValue(factor, value),
        }))

        const hasPercentDiscount = ruleForm.discountType === 'percent' && ruleForm.discountValue > 0
        const hasAmountDiscount = ruleForm.discountType === 'amount' && ruleForm.discountValue > 0

        const discountPayload: CreatePricingRulePayload['discount'] = hasPercentDiscount
            ? {
                apply: true,
                logicBlocks: [
                    {
                        percent: ruleForm.discountValue,
                    },
                ],
            }
            : undefined

        const adjustmentsPayload: NonNullable<CreatePricingRulePayload['adjustments']> = []

        if (hasAmountDiscount) {
            adjustmentsPayload.push({
                type: 'FLAT_DISCOUNT',
                factorKey: 'GLOBAL',
                cases: {
                    default: -Math.abs(ruleForm.discountValue),
                    ...(ruleForm.discountCap ? { cap: ruleForm.discountCap } : {}),
                },
            })
        }

        if (ruleForm.adjustmentDirection !== 'none' && ruleForm.adjustmentValue > 0) {
            const signedValue = ruleForm.adjustmentDirection === 'decrease'
                ? -Math.abs(ruleForm.adjustmentValue)
                : Math.abs(ruleForm.adjustmentValue)

            adjustmentsPayload.push({
                type: ruleForm.adjustmentUnit === 'PERCENT' ? 'PERCENT_ADJUSTMENT' : 'AMOUNT_ADJUSTMENT',
                factorKey: 'GLOBAL',
                percent: ruleForm.adjustmentUnit === 'PERCENT' ? signedValue : undefined,
                cases: ruleForm.adjustmentUnit === 'AMOUNT'
                    ? { default: signedValue }
                    : { default: 'GLOBAL' },
            })
        }

        const payload: CreatePricingRulePayload = {
            procedureId: ruleForm.procedureId,
            priceListId: ruleForm.priceListId,
            priority: ruleForm.priority,
            validFrom: ruleForm.effectiveFrom,
            validTo: ruleForm.effectiveTo ?? null,
            conditions,
            pricing: {
                mode: 'FIXED',
                fixedPrice: ruleForm.basePrice,
            },
            discount: discountPayload,
            adjustments: adjustmentsPayload.length > 0 ? adjustmentsPayload : undefined,
        }

        try {
            setIsCreatingRule(true)
            await createPricingRule(payload)
            alert('Pricing rule created successfully')
            setActiveRuleDesignerTab('summary')
            resetRuleForm()
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Unable to create pricing rule')
        } finally {
            setIsCreatingRule(false)
        }
    }

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
                    if (cancelled) return
                    setPriceListOptions(response.content)
                })
                .catch(error => {
                    if (cancelled) return
                    setPriceListOptions([])
                    setPriceListSearchError(
                        error instanceof Error ? error.message : 'Failed to load price lists'
                    )
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
        if (!procedureDropdownOpen) {
            setProcedureSearchLoading(false)
            return
        }

        setProcedureSearchLoading(true)
        setProcedureSearchError(null)

        let cancelled = false
        const handler = setTimeout(() => {
            const term = procedureSearchTerm.trim()

            searchProcedures({
                filters: term ? { keyword: term } : {},
                page: 0,
                size: 10,
            })
                .then(response => {
                    if (cancelled) return
                    setProcedureOptions(response.content)
                })
                .catch(error => {
                    if (cancelled) return
                    setProcedureOptions([])
                    setProcedureSearchError(
                        error instanceof Error ? error.message : 'Failed to load procedures'
                    )
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
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node

            if (
                priceListDropdownRef.current &&
                !priceListDropdownRef.current.contains(target)
            ) {
                setPriceListDropdownOpen(false)
            }

            if (
                procedureDropdownRef.current &&
                !procedureDropdownRef.current.contains(target)
            ) {
                setProcedureDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Sample data
    useEffect(() => {
        const sampleData: CombinationRule[] = [
            {
                id: '1',
                type: 'procedure_pricing',
                factors: [
                    { factorType: 'provider', factorValue: 'Islamic Hospital - Amman' },
                    { factorType: 'procedure', factorValue: '2964' },
                    { factorType: 'insurance_degree', factorValue: 'Third Degree' }
                ],
                value: 30.000,
                isDefault: false,
                effectiveDate: new Date('2025-06-15'),
                priority: 1
            },
            {
                id: '2',
                type: 'procedure_pricing',
                factors: [
                    { factorType: 'provider', factorValue: 'Shmeisani Hospital' },
                    { factorType: 'procedure', factorValue: '2964' },
                    { factorType: 'insurance_degree', factorValue: 'Second Degree' }
                ],
                value: 35.500,
                isDefault: false,
                effectiveDate: new Date('2025-06-15'),
                priority: 1
            },
            {
                id: '3',
                type: 'procedure_pricing',
                factors: [
                    { factorType: 'provider', factorValue: 'The Arab Medical Center Hospital' },
                    { factorType: 'procedure', factorValue: '2964' },
                    { factorType: 'insurance_degree', factorValue: 'First Degree' }
                ],
                value: 45.500,
                isDefault: false,
                effectiveDate: new Date('2025-06-15'),
                priority: 1
            },
            {
                id: '4',
                type: 'authorization_rule',
                factors: [
                    { factorType: 'procedure', factorValue: '17476' },
                    { factorType: 'icd', factorValue: 'S62.0' }
                ],
                value: true, // Auth required
                isDefault: false,
                effectiveDate: new Date('2025-01-01'),
                priority: 2
            },
            {
                id: '5',
                type: 'limit_rule',
                factors: [
                    { factorType: 'procedure', factorValue: '80061' },
                    { factorType: 'insurance_degree', factorValue: 'Bronze' }
                ],
                value: 2, // Max 2 per year
                isDefault: false,
                effectiveDate: new Date('2025-01-01'),
                priority: 3
            }
        ]
        setCombinations(sampleData)
        setFilteredCombinations(sampleData)
    }, [])

    // Filter combinations
    useEffect(() => {
        let filtered = combinations.filter(c => c.type === combinationType)

        if (searchTerm) {
            filtered = filtered.filter(combination =>
                combination.factors.some(f =>
                    f.factorValue.toString().toLowerCase().includes(searchTerm.toLowerCase())
                )
            )
        }

        setFilteredCombinations(filtered)
    }, [searchTerm, combinationType, combinations])

    const handleAdd = () => {
        setIsEditMode(false)
        setFormData({
            type: combinationType,
            factors: [],
            value: 0,
            isDefault: false,
            effectiveDate: new Date(),
            priority: 1
        })
        setSelectedFactors({})
        setIsDialogOpen(true)
    }

    const handleEdit = (combination: CombinationRule) => {
        setIsEditMode(true)
        setSelectedCombination(combination)
        setFormData(combination)

        // Parse factors back to selected factors
        const factors: Record<string, string> = {}
        combination.factors.forEach(f => {
            factors[f.factorType] = String(f.factorValue)
        })
        setSelectedFactors(factors)

        setIsDialogOpen(true)
    }

    const handleDelete = (combination: CombinationRule) => {
        if (confirm('Are you sure you want to delete this combination?')) {
            setCombinations(prev => prev.filter(c => c.id !== combination.id))
        }
    }

    const handleSave = () => {
        const factors: CombinationFactor[] = Object.entries(selectedFactors)
            .filter(([, value]) => value)
            .map(([type, value]) => ({
                factorType: type,
                factorValue: value as string
            }))

        if (factors.length === 0) {
            alert('Please select at least one factor')
            return
        }

        const newCombination: CombinationRule = {
            ...formData as CombinationRule,
            id: isEditMode ? selectedCombination!.id : generateId(),
            factors,
            type: combinationType
        }

        if (isEditMode) {
            setCombinations(prev => prev.map(c =>
                c.id === selectedCombination!.id ? newCombination : c
            ))
        } else {
            setCombinations(prev => [...prev, newCombination])
        }

        setIsDialogOpen(false)
    }

    const generateCrossProduct = () => {
        // This would generate all possible combinations
        alert('Cross-product generation would create all possible combinations based on selected factors')
    }

    const renderFactorPills = (factors: CombinationFactor[]) => {
        return factors.map((factor, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs mr-1">
        {factor.factorType}: {factor.factorValue}
      </span>
        ))
    }

    const renderValue = (combination: CombinationRule) => {
        switch (combination.type) {
            case 'procedure_pricing':
                return formatCurrency(combination.value as number)
            case 'authorization_rule':
                return combination.value ? 'Required' : 'Not Required'
            case 'limit_rule':
                return `${combination.value} per year`
            case 'coverage_rule':
                return `${combination.value}%`
            default:
                return combination.value
        }
    }

    // Sample data for dropdowns
    const providers = [
        'Islamic Hospital - Amman',
        'Shmeisani Hospital',
        'The Arab Medical Center Hospital',
        'Jordan Hospital',
        'Al-Khalidi Medical Center'
    ]

    const procedures = [
        { code: '2964', name: 'Doctor Examination' },
        { code: '17476', name: 'Short Arm Cast' },
        { code: '17457', name: 'Metacarpal Fracture MUA' },
        { code: '80061', name: 'Lipid Panel' },
        { code: '71020', name: 'Chest X-Ray' }
    ]

    const insuranceDegrees = ['First Degree', 'Second Degree', 'Third Degree', 'Private Degree']

    const icds = ['S62.0', 'S62.1', 'S62.3', 'E78.0', 'J18.9']

    return (
        <div className="p-6 space-y-6">
            <Tabs defaultValue="combinations" className="space-y-6">
                <TabsList className="grid w-full max-w-2xl grid-cols-2">
                    <TabsTrigger value="combinations">Combination Builder</TabsTrigger>
                    <TabsTrigger value="rule_designer">Rule Designer</TabsTrigger>
                </TabsList>

                <TabsContent value="combinations" className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold mb-1">Combination Builder</h1>
                        <p className="text-gray-600">Define dynamic rules and pricing combinations using cross-product matrix</p>
                    </div>

                    {/* Combination Type Selector */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                                <div className="flex items-center gap-3">
                                    <Grid3X3 className="h-6 w-6 text-tpa-primary" />
                                    <span className="font-semibold text-gray-800">Combination Type</span>
                                </div>
                                <Select value={combinationType} onValueChange={(value) => setCombinationType(value as CombinationType)}>
                                    <SelectTrigger className="w-full md:w-64">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="procedure_pricing">Procedure Pricing</SelectItem>
                                        <SelectItem value="authorization_rule">Authorization Rules</SelectItem>
                                        <SelectItem value="limit_rule">Limit Rules</SelectItem>
                                        <SelectItem value="coverage_rule">Coverage Rules</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsMatrixView(!isMatrixView)}
                                >
                                    <Calculator className="h-4 w-4 mr-2" />
                                    {isMatrixView ? 'Table View' : 'Matrix View'}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={generateCrossProduct}
                                >
                                    <Grid3X3 className="h-4 w-4 mr-2" />
                                    Generate Cross Product
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search combinations..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 w-64"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button variant="outline" size="sm">
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                                <Button onClick={handleAdd} className="bg-tpa-primary hover:bg-tpa-accent">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Combination
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Data View */}
                    {!isMatrixView ? (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <input type="checkbox" className="rounded" />
                                        </TableHead>
                                        <TableHead>Factors</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead>Default</TableHead>
                                        <TableHead>Effective Date</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCombinations.map((combination) => (
                                        <TableRow key={combination.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                <input type="checkbox" className="rounded" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {renderFactorPills(combination.factors)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {renderValue(combination)}
                                            </TableCell>
                                            <TableCell>
                                                {combination.isDefault && (
                                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                                                        Default
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(combination.effectiveDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>{combination.priority}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(combination)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(combination)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        // Matrix View
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="overflow-auto">
                                <table className="min-w-full border">
                                    <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border p-2 text-left">Provider</th>
                                        <th className="border p-2 text-left">Procedure</th>
                                        <th className="border p-2 text-center">First Degree</th>
                                        <th className="border p-2 text-center">Second Degree</th>
                                        <th className="border p-2 text-center">Third Degree</th>
                                        <th className="border p-2 text-center">Private Degree</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {providers.slice(0, 3).map(provider => (
                                        procedures.slice(0, 3).map(procedure => (
                                            <tr key={`${provider}-${procedure.code}`} className="hover:bg-gray-50">
                                                <td className="border p-2">{provider}</td>
                                                <td className="border p-2">{procedure.code} - {procedure.name}</td>
                                                {insuranceDegrees.map(degree => {
                                                    const combination = combinations.find(c =>
                                                        c.factors.some(f => f.factorValue === provider) &&
                                                        c.factors.some(f => f.factorValue === procedure.code) &&
                                                        c.factors.some(f => f.factorValue === degree)
                                                    )
                                                    return (
                                                        <td key={degree} className="border p-2 text-center">
                                                            {combination ? formatCurrency(combination.value as number) : '-'}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 text-sm text-gray-600">
                                <p>Matrix view shows cross-product of selected factors. Click cells to edit values directly.</p>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="rule_designer" className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm uppercase tracking-wide text-gray-500">Fixed Factors</p>
                                <h2 className="text-2xl font-semibold">Dynamic Rule Designer</h2>
                                <p className="text-gray-600 text-sm">Use the master factor list to build underwriting, pricing and compliance logic with discounts & adjustments.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button variant="outline" onClick={resetRuleForm} disabled={isCreatingRule}>Reset</Button>
                                <Button variant="outline" disabled>Save Draft</Button>
                                <Button
                                    className="bg-tpa-primary hover:bg-tpa-accent"
                                    onClick={handleCreateRule}
                                    disabled={!canCreateRule || isCreatingRule}
                                >
                                    {isCreatingRule ? 'Creating…' : 'Create Rule'}
                                </Button>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Active Factors</p>
                                <p className="text-3xl font-bold text-tpa-primary">{filledRuleFactors.length}</p>
                                <p className="text-xs text-gray-500">Across {FACTOR_CATEGORIES.length} dimensions</p>
                            </div>
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Price List</p>
                                <p className="text-lg font-semibold text-gray-800">
                                    {selectedPriceList ? formatPriceListLabel(selectedPriceList) : 'Select price list'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {selectedPriceList?.providerType ?? selectedPriceList?.regionName ?? '—'}
                                </p>
                            </div>
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Procedure</p>
                                <p className="text-lg font-semibold text-gray-800">
                                    {selectedProcedure ? formatProcedureLabel(selectedProcedure) : 'Select procedure'}
                                </p>
                            </div>
                        </div>

                        <Tabs value={activeRuleDesignerTab} onValueChange={setActiveRuleDesignerTab} className="mt-6 space-y-6">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="general">General</TabsTrigger>
                                <TabsTrigger value="factors">Factors</TabsTrigger>
                                <TabsTrigger value="financials">Financials</TabsTrigger>
                                <TabsTrigger value="summary">Summary</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Rule Name</Label>
                                        <Input
                                            placeholder="e.g. VIP maternity pricing"
                                            value={ruleForm.name}
                                            onChange={(e) => handleRuleFieldChange('name', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Rule Scope</Label>
                                        <Select
                                            value={ruleForm.scope}
                                            onValueChange={(value) => handleRuleFieldChange('scope', value as CombinationType)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="procedure_pricing">Procedure Pricing</SelectItem>
                                                <SelectItem value="authorization_rule">Authorization</SelectItem>
                                                <SelectItem value="limit_rule">Limits</SelectItem>
                                                <SelectItem value="coverage_rule">Coverage</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={ruleForm.status}
                                            onValueChange={(value) => handleRuleFieldChange('status', value as RuleStatus)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="active">Active</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Price List</Label>
                                        <div className="relative" ref={priceListDropdownRef}>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex w-full items-center justify-between gap-3 pr-12 text-left"
                                                onClick={() => {
                                                    setPriceListDropdownOpen(prev => !prev)
                                                    setProcedureDropdownOpen(false)
                                                }}
                                            >
                                                <div className="flex min-w-0 flex-col text-left">
                                                    <span className="truncate text-sm font-medium text-gray-900">
                                                        {selectedPriceList
                                                            ? formatPriceListLabel(selectedPriceList)
                                                            : 'Search price lists'}
                                                    </span>
                                                    <span className="truncate text-xs text-gray-500">
                                                        {selectedPriceList?.providerType
                                                            ?? 'Type to filter by name, code, or provider type'}
                                                    </span>
                                                </div>
                                                <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                                            </Button>
                                            {ruleForm.priceListId && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear price list"
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-gray-600"
                                                    onClick={(event) => {
                                                        event.stopPropagation()
                                                        clearPriceListSelection()
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                            {priceListDropdownOpen && (
                                                <div className="absolute left-0 right-0 z-20 mt-2 rounded-lg border border-gray-200 bg-white shadow-xl">
                                                    <div className="border-b border-gray-100 p-2">
                                                        <Input
                                                            autoFocus
                                                            placeholder="Search price lists..."
                                                            value={priceListSearchTerm}
                                                            onChange={(e) => setPriceListSearchTerm(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="max-h-64 overflow-y-auto">
                                                        {priceListSearchLoading ? (
                                                            <div className="flex items-center justify-center gap-2 p-4 text-sm text-gray-500">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                Loading price lists…
                                                            </div>
                                                        ) : priceListSearchError ? (
                                                            <div className="p-4 text-sm text-red-500">{priceListSearchError}</div>
                                                        ) : priceListOptions.length === 0 ? (
                                                            <div className="p-4 text-sm text-gray-500">No price lists found</div>
                                                        ) : (
                                                            <ul className="divide-y divide-gray-100">
                                                                {priceListOptions.map(option => (
                                                                    <li key={option.id}>
                                                                        <button
                                                                            type="button"
                                                                            className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-gray-50"
                                                                            onClick={() => handlePriceListSelect(option)}
                                                                        >
                                                                            <span className="text-sm font-medium text-gray-900">
                                                                                {formatPriceListLabel(option)}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">
                                                                                {(option.regionName || option.providerType || '—')}
                                                                                {' · Valid '}
                                                                                {option.validFrom
                                                                                    ? new Date(option.validFrom).toLocaleDateString()
                                                                                    : '—'}
                                                                                {' → '}
                                                                                {option.validTo
                                                                                    ? new Date(option.validTo).toLocaleDateString()
                                                                                    : '—'}
                                                                            </span>
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Procedure</Label>
                                        <div className="relative" ref={procedureDropdownRef}>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex w-full items-center justify-between gap-3 pr-12 text-left"
                                                onClick={() => {
                                                    setProcedureDropdownOpen(prev => !prev)
                                                    setPriceListDropdownOpen(false)
                                                }}
                                            >
                                                <div className="flex min-w-0 flex-col text-left">
                                                    <span className="truncate text-sm font-medium text-gray-900">
                                                        {selectedProcedure
                                                            ? formatProcedureLabel(selectedProcedure)
                                                            : 'Search procedures'}
                                                    </span>
                                                    <span className="truncate text-xs text-gray-500">
                                                        {selectedProcedure?.unitOfMeasure
                                                            ?? 'Type to filter by code, name, or system code'}
                                                    </span>
                                                </div>
                                                <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                                            </Button>
                                            {ruleForm.procedureId && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear procedure"
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-gray-600"
                                                    onClick={(event) => {
                                                        event.stopPropagation()
                                                        clearProcedureSelection()
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                            {procedureDropdownOpen && (
                                                <div className="absolute left-0 right-0 z-20 mt-2 rounded-lg border border-gray-200 bg-white shadow-xl">
                                                    <div className="border-b border-gray-100 p-2">
                                                        <Input
                                                            autoFocus
                                                            placeholder="Search procedures..."
                                                            value={procedureSearchTerm}
                                                            onChange={(e) => setProcedureSearchTerm(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="max-h-64 overflow-y-auto">
                                                        {procedureSearchLoading ? (
                                                            <div className="flex items-center justify-center gap-2 p-4 text-sm text-gray-500">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                Loading procedures…
                                                            </div>
                                                        ) : procedureSearchError ? (
                                                            <div className="p-4 text-sm text-red-500">{procedureSearchError}</div>
                                                        ) : procedureOptions.length === 0 ? (
                                                            <div className="p-4 text-sm text-gray-500">No procedures found</div>
                                                        ) : (
                                                            <ul className="divide-y divide-gray-100">
                                                                {procedureOptions.map(option => (
                                                                    <li key={option.id}>
                                                                        <button
                                                                            type="button"
                                                                            className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-gray-50"
                                                                            onClick={() => handleProcedureSelect(option)}
                                                                        >
                                                                            <span className="text-sm font-medium text-gray-900">
                                                                                {formatProcedureLabel(option)}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">
                                                                                {option.systemCode}
                                                                                {' · '}
                                                                                {option.unitOfMeasure}
                                                                                {' · Ref '}
                                                                                {formatCurrency(option.referencePrice)}
                                                                            </span>
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Base Price (JD)</Label>
                                        <Input
                                            type="number"
                                            value={ruleForm.basePrice}
                                            onChange={(e) => handleRuleFieldChange('basePrice', Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Priority</Label>
                                        <Input
                                            type="number"
                                            value={ruleForm.priority}
                                            onChange={(e) => handleRuleFieldChange('priority', Number(e.target.value))}
                                            placeholder="1"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Effective From</Label>
                                        <Input
                                            type="date"
                                            value={ruleForm.effectiveFrom}
                                            onChange={(e) => handleRuleFieldChange('effectiveFrom', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Effective To</Label>
                                        <Input
                                            type="date"
                                            value={ruleForm.effectiveTo ?? ''}
                                            onChange={(e) => handleRuleFieldChange('effectiveTo', e.target.value || undefined)}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                                    <Switch
                                        id="stackable"
                                        checked={ruleForm.stackable}
                                        onCheckedChange={(checked) => handleRuleFieldChange('stackable', checked)}
                                    />
                                    <div>
                                        <Label htmlFor="stackable" className="font-medium">Allow stacking with other discounts</Label>
                                        <p className="text-sm text-gray-500">Enable when this rule should be evaluated with other adjustments.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Description & Rationale</Label>
                                    <textarea
                                        className="w-full rounded-md border border-gray-200 bg-white p-3 text-sm focus:border-tpa-primary focus:outline-none"
                                        rows={3}
                                        placeholder="Document the logic, approvals or notes..."
                                        value={ruleForm.description}
                                        onChange={(e) => handleRuleFieldChange('description', e.target.value)}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="factors" className="space-y-6">
                                {FACTOR_CATEGORIES.map(category => (
                                    <div key={category.id} className="space-y-3">
                                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-800">{category.title}</h3>
                                                <p className="text-sm text-gray-500">{category.description}</p>
                                            </div>
                                            <span className="text-xs uppercase tracking-wide text-gray-400">{category.factors.length} fields</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            {category.factors.map(factor => (
                                                <div key={factor.key} className="space-y-2 rounded-lg border border-gray-100 p-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-sm font-medium text-gray-700">{factor.name}</Label>
                                                        <span className="text-[11px] uppercase text-gray-400">{factor.dataType}</span>
                                                    </div>
                                                    {renderFactorInputControl(factor)}
                                                    {factor.description && (
                                                        <p className="text-xs text-gray-500">{factor.description}</p>
                                                    )}
                                                    <p className="text-[11px] font-mono text-gray-400">{factor.key}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <div className="border-t pt-4">
                                    <Label className="text-sm text-gray-600">Selected Factors</Label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {filledRuleFactors.length === 0 && (
                                            <span className="text-sm text-gray-500">No factors selected yet.</span>
                                        )}
                                        {filledRuleFactors.map(([type, value]) => (
                                            <span key={type} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                                {type}: {value}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="financials" className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label>Discount Type</Label>
                                        <Select
                                            value={ruleForm.discountType}
                                            onValueChange={(value) => handleRuleFieldChange('discountType', value as DiscountType)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Discount</SelectItem>
                                                <SelectItem value="percent">Percentage</SelectItem>
                                                <SelectItem value="amount">Fixed Amount</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Discount Value</Label>
                                        <Input
                                            type="number"
                                            value={ruleForm.discountValue}
                                            disabled={ruleForm.discountType === 'none'}
                                            onChange={(e) => handleRuleFieldChange('discountValue', Number(e.target.value))}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Discount Cap</Label>
                                        <Input
                                            type="number"
                                            value={ruleForm.discountCap ?? ''}
                                            disabled={ruleForm.discountType === 'none'}
                                            onChange={(e) => handleRuleFieldChange('discountCap', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Stacking</Label>
                                        <div className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600">
                                            {ruleForm.stackable ? 'Stackable with other rules' : 'Evaluated independently'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label>Adjustment Direction</Label>
                                        <Select
                                            value={ruleForm.adjustmentDirection}
                                            onValueChange={(value) => handleRuleFieldChange('adjustmentDirection', value as AdjustmentDirection)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Adjustment</SelectItem>
                                                <SelectItem value="increase">Increase</SelectItem>
                                                <SelectItem value="decrease">Decrease</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Adjustment Unit</Label>
                                        <Select
                                            value={ruleForm.adjustmentUnit}
                                            onValueChange={(value) => handleRuleFieldChange('adjustmentUnit', value as AdjustmentUnit)}
                                            disabled={ruleForm.adjustmentDirection === 'none'}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PERCENT">Percent</SelectItem>
                                                <SelectItem value="AMOUNT">Amount</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Adjustment Value</Label>
                                        <Input
                                            type="number"
                                            value={ruleForm.adjustmentValue}
                                            disabled={ruleForm.adjustmentDirection === 'none'}
                                            onChange={(e) => handleRuleFieldChange('adjustmentValue', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Effective Window</Label>
                                        <div className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600">
                                            {effectiveRangeSummary}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="summary" className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="rounded-lg border border-gray-100 p-4">
                                        <p className="text-xs uppercase tracking-wide text-gray-400">Discount Strategy</p>
                                        <p className="text-lg font-semibold text-gray-800">{discountSummary}</p>
                                    </div>
                                    <div className="rounded-lg border border-gray-100 p-4">
                                        <p className="text-xs uppercase tracking-wide text-gray-400">Adjustment</p>
                                        <p className="text-lg font-semibold text-gray-800">{adjustmentSummary}</p>
                                    </div>
                                    <div className="rounded-lg border border-gray-100 p-4">
                                        <p className="text-xs uppercase tracking-wide text-gray-400">Timeline</p>
                                        <p className="text-lg font-semibold text-gray-800">{effectiveRangeSummary}</p>
                                    </div>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Factor</TableHead>
                                            <TableHead>Key</TableHead>
                                            <TableHead>Value</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filledRuleFactors.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-sm text-gray-500">
                                                    No factor values selected yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {filledRuleFactors.map(([key, value]) => {
                                            const factor = FACTOR_CATEGORIES.flatMap(category => category.factors).find(f => f.key === key)
                                            return (
                                                <TableRow key={key}>
                                                    <TableCell>{factor?.name ?? key}</TableCell>
                                                    <TableCell className="font-mono text-xs text-gray-500">{key}</TableCell>
                                                    <TableCell className="font-medium text-gray-900">{value}</TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                        </Tabs>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditMode ? 'Edit Combination' : 'Add New Combination'}
                        </DialogTitle>
                        <DialogDescription>
                            Define factors and values for this combination rule
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="factors" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="factors">Factors</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="factors" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="provider">Provider</Label>
                                    <Select
                                        value={selectedFactors.provider ?? ANY_OPTION_VALUE}
                                        onValueChange={(value) => updateSelectedFactor('provider', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ANY_OPTION_VALUE}>Any</SelectItem>
                                            {providers.map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="procedure">Procedure</Label>
                                    <Select
                                        value={selectedFactors.procedure ?? ANY_OPTION_VALUE}
                                        onValueChange={(value) => updateSelectedFactor('procedure', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select procedure" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ANY_OPTION_VALUE}>Any</SelectItem>
                                            {procedures.map(p => (
                                                <SelectItem key={p.code} value={p.code}>
                                                    {p.code} - {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="insuranceDegree">Insurance Degree</Label>
                                    <Select
                                        value={selectedFactors.insuranceDegree ?? ANY_OPTION_VALUE}
                                        onValueChange={(value) => updateSelectedFactor('insuranceDegree', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select degree" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ANY_OPTION_VALUE}>Any</SelectItem>
                                            {insuranceDegrees.map(d => (
                                                <SelectItem key={d} value={d}>{d}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="icd">ICD Code</Label>
                                    <Select
                                        value={selectedFactors.icd ?? ANY_OPTION_VALUE}
                                        onValueChange={(value) => updateSelectedFactor('icd', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select ICD" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ANY_OPTION_VALUE}>Any</SelectItem>
                                            {icds.map(icd => (
                                                <SelectItem key={icd} value={icd}>{icd}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select
                                        value={selectedFactors.gender ?? ANY_OPTION_VALUE}
                                        onValueChange={(value) => updateSelectedFactor('gender', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ANY_OPTION_VALUE}>Any</SelectItem>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ageRange">Age Range</Label>
                                    <Select
                                        value={selectedFactors.ageRange ?? ANY_OPTION_VALUE}
                                        onValueChange={(value) => updateSelectedFactor('ageRange', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select age range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ANY_OPTION_VALUE}>Any</SelectItem>
                                            <SelectItem value="0-18">0-18 years</SelectItem>
                                            <SelectItem value="19-35">19-35 years</SelectItem>
                                            <SelectItem value="36-60">36-60 years</SelectItem>
                                            <SelectItem value="60+">60+ years</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <Label className="text-sm text-gray-600">Selected Factors:</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {Object.entries(selectedFactors)
                                        .filter(([, value]) => value)
                                        .map(([type, value]) => (
                                            <span key={type} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {type}: {value}
                      </span>
                                        ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="value">
                                        {combinationType === 'procedure_pricing' ? 'Price' :
                                            combinationType === 'authorization_rule' ? 'Authorization Required' :
                                                combinationType === 'limit_rule' ? 'Limit Value' :
                                                    'Coverage Percentage'}
                                    </Label>
                                    {combinationType === 'authorization_rule' ? (
                                        <Select
                                            value={formData.value?.toString()}
                                            onValueChange={(value) => setFormData({ ...formData, value: value === 'true' })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="true">Required</SelectItem>
                                                <SelectItem value="false">Not Required</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            id="value"
                                            type="number"
                                            value={formData.value as number}
                                            onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                            placeholder="0.00"
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Input
                                        id="priority"
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                        placeholder="1"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="effectiveDate">Effective Date</Label>
                                    <Input
                                        id="effectiveDate"
                                        type="date"
                                        value={formData.effectiveDate ? new Date(formData.effectiveDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setFormData({ ...formData, effectiveDate: new Date(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                                    <Input
                                        id="expiryDate"
                                        type="date"
                                        value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value ? new Date(e.target.value) : undefined })}
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isDefault"
                                        checked={formData.isDefault}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, isDefault: checked })
                                        }
                                    />
                                    <Label htmlFor="isDefault">Set as Default</Label>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="bg-tpa-primary hover:bg-tpa-accent">
                            {isEditMode ? 'Update' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
