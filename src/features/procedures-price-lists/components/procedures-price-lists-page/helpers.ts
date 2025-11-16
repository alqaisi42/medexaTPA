import {formatDate, generateId} from '@/lib/utils'
import type {
    PricingFactor,
    PricingRuleCondition,
    PricingRuleEvaluation,
    PricingRuleResponse,
    PriceListSummary,
    ProcedureSummary,
} from '@/types'
import type {
    ConditionDraft,
    ContextEntryDraft,
    FactorEntryDraft,
    FactorInputKind,
} from './types'

export interface RuleJsonCondition {
    factor: string
    operator: string
    value: unknown
}

export type OperatorOption = {
    value: string
    label: string
    requiresRange?: boolean
    supportsMultiple?: boolean
}

export function parseAllowedValues(factor: PricingFactor): string[] {
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

export function resolveFactorInputKind(factor: PricingFactor, operator?: string): FactorInputKind {
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

export function operatorOptionsForFactor(factor: PricingFactor): OperatorOption[] {
    const inputKind = resolveFactorInputKind(factor)

    if (inputKind === 'number') {
        return [
            {value: 'EQUALS', label: 'Equals'},
            {value: 'NOT_EQUALS', label: 'Not equals'},
            {value: 'GREATER_THAN', label: 'Greater than'},
            {value: 'LESS_THAN', label: 'Less than'},
            {value: 'BETWEEN', label: 'Between', requiresRange: true},
        ]
    }

    if (inputKind === 'date') {
        return [
            {value: 'ON', label: 'On'},
            {value: 'BEFORE', label: 'Before'},
            {value: 'AFTER', label: 'After'},
            {value: 'BETWEEN', label: 'Between', requiresRange: true},
        ]
    }

    if (inputKind === 'boolean') {
        return [
            {value: 'IS_TRUE', label: 'Is true'},
            {value: 'IS_FALSE', label: 'Is false'},
        ]
    }

    if (inputKind === 'select') {
        return [
            {value: 'EQUALS', label: 'Equals'},
            {value: 'NOT_EQUALS', label: 'Not equals'},
            {value: 'IN', label: 'In list', supportsMultiple: true},
            {value: 'NOT_IN', label: 'Not in list', supportsMultiple: true},
        ]
    }

    return [
        {value: 'EQUALS', label: 'Equals'},
        {value: 'NOT_EQUALS', label: 'Not equals'},
        {value: 'CONTAINS', label: 'Contains'},
        {value: 'STARTS_WITH', label: 'Starts with'},
        {value: 'ENDS_WITH', label: 'Ends with'},
    ]
}

export function defaultOperatorForFactor(factor: PricingFactor): string {
    const options = operatorOptionsForFactor(factor)
    return options[0]?.value ?? 'EQUALS'
}

export function formatConditionOperator(operator: string): string {
    const operatorMap: Record<string, string> = {
        '=': 'equals',
        'EQUALS': 'equals',
        '!=': 'not equals',
        'NOT_EQUALS': 'not equals',
        '>': 'greater than',
        'GREATER_THAN': 'greater than',
        '<': 'less than',
        'LESS_THAN': 'less than',
        '>=': 'greater or equal',
        'GREATER_THAN_OR_EQUAL': 'greater or equal',
        '<=': 'less or equal',
        'LESS_THAN_OR_EQUAL': 'less or equal',
        'IN': 'in',
        'NOT_IN': 'not in',
        'BETWEEN': 'between',
        'CONTAINS': 'contains',
        'STARTS_WITH': 'starts with',
        'ENDS_WITH': 'ends with',
    }
    return operatorMap[operator] || operator.toLowerCase()
}

export const FACTOR_LABELS: Record<string, string> = {
    gender: 'Gender',
    patient_age: 'Patient Age',
    visit_time: 'Visit Time',
    specialty_id: 'Specialty ID',
    provider_type: 'Provider Type',
    insurance_degree: 'Insurance Degree',
    doctor_experience_years: 'Doctor Experience',
    clinic_type: 'Clinic Type',
    referral_required: 'Referral Required',
    emergency: 'Emergency',
}

export const OPERATOR_SYMBOLS: Record<string, string> = {
    '=': '=',
    'EQUALS': '=',
    '!=': '≠',
    'NOT_EQUALS': '≠',
    '>': '>',
    'GREATER_THAN': '>',
    '<': '<',
    'LESS_THAN': '<',
    '>=': '≥',
    'GREATER_THAN_OR_EQUAL': '≥',
    '<=': '≤',
    'LESS_THAN_OR_EQUAL': '≤',
    'IN': 'in',
    'NOT_IN': 'not in',
    'BETWEEN': '↔',
    'MIN': '≥',
    'MAX': '≤',
}

const CONDITION_COLORS: Record<string, string> = {
    gender: 'bg-purple-100 text-purple-700 border-purple-200',
    patient_age: 'bg-blue-100 text-blue-700 border-blue-200',
    visit_time: 'bg-orange-100 text-orange-700 border-orange-200',
    insurance_degree: 'bg-green-100 text-green-700 border-green-200',
    specialty_id: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    provider_type: 'bg-teal-100 text-teal-700 border-teal-200',
    doctor_experience_years: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    emergency: 'bg-red-100 text-red-700 border-red-200',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
}

export function getConditionColorClass(factor: string): string {
    return CONDITION_COLORS[factor] || CONDITION_COLORS.default
}

export function parseRuleJson(rule: PricingRuleResponse): Record<string, unknown> | null {
    if (!rule.ruleJson) {
        return null
    }

    try {
        return JSON.parse(rule.ruleJson)
    } catch {
        return null
    }
}

export function formatConditionValue(factor: string, value: unknown): string {
    if (value === null || value === undefined) return '—'

    if (factor === 'gender') {
        return value === 'M' ? 'Male' : value === 'F' ? 'Female' : String(value)
    }
    if (factor === 'visit_time') {
        return value === 'DAY' ? 'Day' : value === 'NIGHT' ? 'Night' : String(value)
    }
    if (factor === 'provider_type') {
        return value === 'clinic' ? 'Clinic' : value === 'hospital' ? 'Hospital' : String(value)
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No'
    }
    if (Array.isArray(value)) {
        if (value.length === 2 && typeof value[0] === 'number') {
            if (factor === 'patient_age') {
                return `${value[0]}-${value[1]} years`
            }
            return `${value[0]}-${value[1]}`
        }
        if (factor === 'insurance_degree') {
            return value.map(v => String(v)).join(', ')
        }
        return value.map(entry => String(entry)).join(', ')
    }

    if (factor === 'doctor_experience_years' && typeof value === 'number') {
        return `${value}+ years`
    }

    return String(value)
}

export function formatProcedureLabel(procedure: ProcedureSummary): string {
    return `${procedure.code} · ${procedure.nameEn}`
}

export function formatPriceListLabel(priceList: PriceListSummary): string {
    const baseLabel = `${priceList.code} · ${priceList.nameEn}`
    return priceList.providerType ? `${baseLabel} (${priceList.providerType})` : baseLabel
}

export function extractRuleConditions(ruleJson: Record<string, unknown> | null): RuleJsonCondition[] {
    if (!ruleJson) {
        return []
    }

    const conditions = ruleJson.conditions
    if (!conditions || !Array.isArray(conditions)) {
        return []
    }

    return conditions.filter((condition): condition is RuleJsonCondition => {
        return Boolean(
            condition &&
            typeof condition === 'object' &&
            'factor' in condition &&
            'operator' in condition,
        )
    })
}

export function formatRulePricing(ruleJson: Record<string, unknown> | null): string {
    if (!ruleJson) return '—'

    const pricing = ruleJson.pricing as Record<string, unknown> | undefined
    if (!pricing) return '—'

    const mode = String(pricing.mode ?? '').toUpperCase()

    const tiers = Array.isArray(pricing.tiers)
        ? (pricing.tiers as Array<Record<string, unknown>>)
        : []

    const conditionalFixedRaw = pricing.conditionalFixed ?? pricing.conditional_fixed ?? []

    const conditionalFixed = Array.isArray(conditionalFixedRaw)
        ? (conditionalFixedRaw as Array<Record<string, unknown>>)
        : []

    let summary: string

    if (mode === 'FIXED') {
        const fixedPrice = pricing.fixedPrice ?? pricing.fixed_price
        summary = `Fixed $${fixedPrice || 0}`
    } else if (mode === 'POINTS') {
        const points = pricing.points ?? pricing.basePoints ?? pricing.base_points ?? 0
        summary = `Points × ${points}`
    } else if (mode === 'RANGE') {
        const minPrice = pricing.minPrice ?? pricing.min_price
        const maxPrice = pricing.maxPrice ?? pricing.max_price
        summary = `Range $${minPrice || 0} - $${maxPrice || '∞'}`
    } else {
        summary = mode || '—'
    }

    const extras: string[] = []

    if (tiers.length > 0) {
        extras.push(`${tiers.length} tier${tiers.length > 1 ? 's' : ''}`)
    }
    if (conditionalFixed.length > 0) {
        extras.push(`${conditionalFixed.length} conditional`)
    }

    return extras.length > 0 ? `${summary} (${extras.join(' · ')})` : summary
}

export function formatConditionValueDisplay(condition: ConditionDraft, factor?: PricingFactor): string {
    const {value} = condition

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

export function serializeConditionDraft(condition: ConditionDraft): PricingRuleCondition {
    let value: unknown = condition.value

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const range = value as { min?: string; max?: string }
        const normalized: { min?: number; max?: number } = {}
        if (range.min !== undefined && range.min !== '') {
            normalized.min = Number(range.min)
        }
        if (range.max !== undefined && range.max !== '') {
            normalized.max = Number(range.max)
        }
        value = normalized
    } else if (Array.isArray(value)) {
        value = value
    } else if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed === '') {
            value = ''
        } else if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                value = JSON.parse(trimmed)
            } catch {
                value = trimmed
            }
        } else if (!Number.isNaN(Number(trimmed)) && condition.operator !== 'CONTAINS') {
            value = Number(trimmed)
        } else if (trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'false') {
            value = trimmed.toLowerCase() === 'true'
        } else {
            value = trimmed
        }
    }

    return {
        factor: condition.factorKey,
        operator: condition.operator,
        value,
    }
}

export function parseContextJson(contextJson?: string | null): ContextEntryDraft[] {
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

export function buildContextObject(entries: ContextEntryDraft[]): Record<string, unknown> | undefined {
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

export function buildFactorsObject(entries: FactorEntryDraft[]): Record<string, unknown> {
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

export function buildDefaultCondition(factors: PricingFactor[], factor?: PricingFactor): ConditionDraft {
    const resolvedFactor = factor ?? factors[0]
    const operator = resolvedFactor ? defaultOperatorForFactor(resolvedFactor) : 'EQUALS'
    const operatorOptions = resolvedFactor ? operatorOptionsForFactor(resolvedFactor) : []
    const operatorConfig = operatorOptions.find(option => option.value === operator) ?? operatorOptions[0]

    let value: ConditionDraft['value'] = ''
    if (operatorConfig?.requiresRange) {
        value = {min: '', max: ''}
    } else if (operatorConfig?.supportsMultiple) {
        value = []
    }

    return {
        id: generateId(),
        factorKey: resolvedFactor?.key ?? '',
        operator,
        value,
    }
}

export function isRangeValue(value: ConditionDraft['value']): value is { min?: string; max?: string } {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function formatEvaluationCondition(
    condition: PricingRuleEvaluation['failedConditions'][number],
): string {
    const factorLabel = FACTOR_LABELS[condition.factor] ?? condition.factor
    const operatorLabel = formatConditionOperator(condition.operator)
    const expectedValue = formatConditionValue(condition.factor, condition.expected)
    const actualValue = formatConditionValue(condition.factor, condition.actual)

    return `${factorLabel} expected ${operatorLabel} ${expectedValue} (actual: ${actualValue})`
}

