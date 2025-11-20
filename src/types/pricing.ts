import type { PaginatedResponse } from './api'

export type PricingFactorDataType =
    | 'TEXT'
    | 'NUMBER'
    | 'SELECT'
    | 'DATE'
    | 'BOOLEAN'
    | 'STRING'
    | 'DECIMAL'
    | 'INTEGER'

export interface PricingFactor {
    id: number
    key: string
    nameEn: string
    nameAr?: string | null
    dataType: PricingFactorDataType
    allowedValues: string | null
}

export interface PricingRuleCondition {
    factor: string
    operator: string
    value: unknown
}

export type PricingMode = 'FIXED' | 'POINTS' | 'RANGE' | (string & {})

export interface PricingRulePricingTier {
    points?: number | null
    condition?: PricingRuleCondition | null
}

export interface PricingRuleConditionalFixedPrice {
    price: number
    conditions?: PricingRuleCondition[]
}

export interface PricingRulePricing {
    mode: PricingMode
    fixedPrice?: number | null
    basePoints?: number | null
    minPoints?: number | null
    maxPoints?: number | null
    pointStrategy?: string | null
    points?: number | null
    tiers?: PricingRulePricingTier[]
    minPrice?: number | null
    maxPrice?: number | null
    conditionalFixed?: PricingRuleConditionalFixedPrice[]
}

export interface PricingRuleDiscountLogicBlock {
    percent?: number | null
    whenConditions?: PricingRuleCondition[]
}

export interface PricingRuleDiscount {
    apply: boolean
    period_unit?: string | null
    period_value?: number | null
    logicBlocks?: PricingRuleDiscountLogicBlock[]
}

export interface PricingRuleAdjustmentCaseMap {
    [caseValue: string]: unknown
}

export interface PricingRuleAdjustmentTier {
    value?: string | null
    add?: number | null
    percent?: number | null
}

export interface PricingRuleAdjustmentLogicBlock {
    whenConditions?: PricingRuleCondition[]
    add?: number | null
    addPercent?: number | null
}

export interface PricingRuleAdjustment {
    type: string
    factorKey: string
    cases: PricingRuleAdjustmentCaseMap
    percent?: number | null
    tiers?: PricingRuleAdjustmentTier[]
    logicBlocks?: PricingRuleAdjustmentLogicBlock[]
}

export interface PricingRuleResponse {
    id: number
    procedureId: number
    procedureName: string
    priceListName: string
    priceListId: number
    priority: number
    ruleJson: string
    validFrom: string | number[]
    validTo: string | number[] | null
}

export interface PriceListSummary {
    id: number
    code: string
    nameEn: string
    providerType: string
    isDefault: boolean
    validFrom: string
    validTo: string | null
    regionName?: string | null
}

export type PriceListResponse = PaginatedResponse<PriceListSummary>

export interface CreatePricingRulePayload {
    procedureId: number
    priceListId: number
    priority: number
    validFrom: string
    validTo?: string | null
    conditions: PricingRuleCondition[]
    pricing: PricingRulePricing
    discount?: PricingRuleDiscount
    adjustments?: PricingRuleAdjustment[]
}

export interface InsuranceDegreeSummary {
    id: number
    code: string
    nameEn: string
    nameAr: string | null
    isActive: boolean
    createdAt?: string
    updatedAt?: string
    effectiveFrom?: string
    effectiveTo?: string | null
}

export interface PointRateRecord {
    id: number
    context: number | null
    insuranceDegree: InsuranceDegreeSummary | null
    pointPrice: number
    minPointPrice: number | null
    maxPointPrice: number | null
    resultMin: number | null
    resultMax: number | null
    validFrom: string
    validTo: string | null
    contextJson?: string | null
    createdAt?: string
    updatedAt?: string
    createdBy?: string
    updatedBy?: string
}

export interface CreatePointRatePayload {
    insuranceDegreeId: number
    pointPrice: number
    minPointPrice?: number | null
    maxPointPrice?: number | null
    resultMin?: number | null
    resultMax?: number | null
    validFrom: string
    validTo?: string | null
    context?: Record<string, unknown>
    createdBy?: string
}

export type UpdatePointRatePayload = Partial<CreatePointRatePayload>

export interface PeriodDiscountRecord {
    id: number
    procedure: {
        id: number
        systemCode: string
        code: string
        nameEn: string
        nameAr: string
        unitOfMeasure?: string
        isSurgical?: boolean
        isActive?: boolean
        validFrom?: string
        validTo?: string | null
        referencePrice?: number
        requiresAuthorization?: boolean
        minIntervalDays?: number
        maxFrequencyPerYear?: number
        requiresAnesthesia?: boolean
        standardDurationMinutes?: number
        createdAt?: string
        updatedAt?: string
        createdBy?: string
        updatedBy?: string
        effectiveFrom?: string
        effectiveTo?: string | null
    }
    context: number | null
    period: number
    periodUnit: string
    discountPct: number
    validFrom: string
    validTo: string | null
    createdAt?: string
    updatedAt?: string
    createdBy?: string
    updatedBy?: string
}

export interface CreatePeriodDiscountPayload {
    procedureId: number
    priceListId: number
    period: number
    periodUnit: string
    discountPct: number
    validFrom: string
    validTo?: string | null
    createdBy?: string
}

export interface PricingCalculationRequest {
    procedureId: number
    priceListId: number
    insuranceDegreeId: number
    factors: Record<string, unknown>
    date: string
}

export interface PricingConditionEvaluation {
    factor: string
    operator: string
    value: unknown
}

export interface PricingRuleSummary {
    conditions: PricingConditionEvaluation[]
    pricing: PricingRulePricing & { fixed_price?: number; points?: number; min_price?: number; max_price?: number }
    discount?: PricingRuleDiscount & { period_unit?: string; period_value?: number }
    adjustments?: PricingRuleAdjustment[]
}

export interface PricingRuleEvaluation {
    ruleId: number
    priority: number
    matched: boolean
    failedConditions: {
        factor: string
        operator: string
        expected: unknown
        actual: unknown
    }[]
}

export interface PricingCalculationResponse {
    procedureId: number
    priceListId: number
    insuranceDegreeId: number | null
    date: string
    finalPrice: number
    covered: boolean
    coverageReason: string | null
    requiresPreapproval: boolean
    preapprovalReason: string | null
    deductibleApplied: number | null
    overridePriceListId: number | null
    selectedRuleId: number | null
    selectedRule: PricingRuleSummary | null
    evaluatedRules: PricingRuleEvaluation[]
    pointRateUsed: PointRateRecord | null
    discountApplied?: {
        discountId: number
        pct: number
        period: number
        unit: string
    } | null
    adjustmentsApplied?: {
        type: string
        factorKey: string
        caseMatched: string
        amount: number
    }[]
    selectionReason?: string | null
}

