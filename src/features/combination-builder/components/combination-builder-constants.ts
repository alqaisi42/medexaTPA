import { formatCurrency } from '@/lib/utils'
import { CombinationType, CreatePricingRulePayload } from '@/types'

export type FactorDataType = 'STRING' | 'NUMBER'

export interface FactorDefinition {
    key: string
    name: string
    dataType: FactorDataType
    allowedValues?: string[]
    description?: string
}

export interface FactorCategory {
    id: string
    title: string
    description: string
    factors: FactorDefinition[]
}

export const SAFE_EMPTY = '__none__' as const

export type DiscountType = 'none' | 'percent' | 'amount'
export type AdjustmentDirection = 'none' | 'increase' | 'decrease'
export type AdjustmentUnit = 'PERCENT' | 'AMOUNT'
export type RuleStatus = 'draft' | 'active'
export type PricingUiMode = 'FIXED' | 'POINT'

export interface RuleFormState {
    name: string
    scope: CombinationType
    status: RuleStatus
    description: string
    stackable: boolean
    pricingMode: PricingUiMode
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
    points: number
    pointValue: number
}

export const FACTOR_CATEGORIES: FactorCategory[] = [
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

export const FACTOR_DEFINITION_LOOKUP = FACTOR_CATEGORIES
    .flatMap(category => category.factors)
    .reduce<Record<string, FactorDefinition>>((accumulator, factor) => {
        accumulator[factor.key] = factor
        return accumulator
    }, {})

export const buildInitialRuleForm = (): RuleFormState => ({
    name: '',
    scope: 'procedure_pricing',
    status: 'draft',
    description: '',
    stackable: true,
    pricingMode: 'FIXED',
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
    points: 0,
    pointValue: 0.35,
})

export const parseFactorValue = (factorKey: string, rawValue: string): unknown => {
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

export const summarizeDiscount = (ruleForm: RuleFormState): string => {
    if (ruleForm.discountType === 'none') return 'No discount applied'
    if (ruleForm.discountType === 'percent') {
        const capText = ruleForm.discountCap ? ` (cap ${formatCurrency(ruleForm.discountCap)})` : ''
        return `${ruleForm.discountValue || 0}% discount${capText}`
    }

    const capText = ruleForm.discountCap ? ` (cap ${formatCurrency(ruleForm.discountCap)})` : ''
    return `${formatCurrency(ruleForm.discountValue || 0)} discount${capText}`
}

export const summarizeAdjustment = (ruleForm: RuleFormState): string => {
    if (ruleForm.adjustmentDirection === 'none') return 'No manual adjustment'
    const unit = ruleForm.adjustmentUnit === 'PERCENT' ? '%' : ' JD'
    const sign = ruleForm.adjustmentDirection === 'increase' ? '+' : '-'
    return `${sign}${ruleForm.adjustmentValue || 0}${unit}`
}

export const summarizeEffectiveness = (ruleForm: RuleFormState): string => {
    return ruleForm.effectiveTo
        ? `${ruleForm.effectiveFrom} → ${ruleForm.effectiveTo}`
        : `Effective from ${ruleForm.effectiveFrom}`
}

export const createPricingPayload = (ruleForm: RuleFormState): CreatePricingRulePayload['pricing'] => {
    return ruleForm.pricingMode === 'POINT'
        ? {
            mode: 'POINTS',
            points: ruleForm.points,
            basePoints: ruleForm.points,
        }
        : {
            mode: 'FIXED',
            fixedPrice: ruleForm.basePrice,
        }
}

export const createDiscountPayload = (ruleForm: RuleFormState): CreatePricingRulePayload['discount'] => {
    const hasPercentDiscount = ruleForm.discountType === 'percent' && ruleForm.discountValue > 0

    if (!hasPercentDiscount) return undefined

    return {
        apply: true,
        logicBlocks: [
            {
                percent: ruleForm.discountValue,
            },
        ],
    }
}

export const createAdjustmentsPayload = (ruleForm: RuleFormState): CreatePricingRulePayload['adjustments'] => {
    const adjustments: NonNullable<CreatePricingRulePayload['adjustments']> = []
    const hasAmountDiscount = ruleForm.discountType === 'amount' && ruleForm.discountValue > 0

    if (hasAmountDiscount) {
        adjustments.push({
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

        adjustments.push({
            type: ruleForm.adjustmentUnit === 'PERCENT' ? 'PERCENT_ADJUSTMENT' : 'AMOUNT_ADJUSTMENT',
            factorKey: 'GLOBAL',
            percent: ruleForm.adjustmentUnit === 'PERCENT' ? signedValue : undefined,
            cases: ruleForm.adjustmentUnit === 'AMOUNT'
                ? { default: signedValue }
                : { default: 'GLOBAL' },
        })
    }

    return adjustments.length > 0 ? adjustments : undefined
}

export const buildConditions = (ruleForm: RuleFormState, factorEntries: [string, string][]) => {
    return factorEntries.map(([factor, value]) => ({
        factor,
        operator: 'EQUALS' as const,
        value: parseFactorValue(factor, value),
    }))
}

export const calculatePricingSummary = (ruleForm: RuleFormState) => {
    const pointConversionPreview = (ruleForm.points || 0) * (ruleForm.pointValue || 0)
    return ruleForm.pricingMode === 'POINT'
        ? `${ruleForm.points || 0} pts ≈ ${formatCurrency(pointConversionPreview)}`
        : formatCurrency(ruleForm.basePrice || 0)
}
