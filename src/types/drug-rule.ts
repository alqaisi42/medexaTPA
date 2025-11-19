export type DrugRuleType = 'AGE_ELIGIBILITY' | 'CONTRAINDICATION' | 'QTY_LIMIT' | 'PRICE_ADJUSTMENT'

export type DrugRuleOperator = 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' | 'IN'

export interface DrugRuleCondition {
    factorCode: string
    operator: DrugRuleOperator
    valueExact: string | null
    valueFrom: string | null
    valueTo: string | null
    values?: string[]
}

export interface DrugRule {
    id: number
    drugPackId: number
    ruleType: DrugRuleType
    priority: number
    maxQuantity: number | null
    adjustmentValue: number | null
    validFrom: string | null
    validTo: string | null
    isActive: boolean
    description: string
    eligibility?: boolean | null
    conditions: DrugRuleCondition[]
}

export interface DrugRulePayload {
    drugPackId: number
    ruleType: DrugRuleType
    priority: number
    maxQuantity: number | null
    adjustmentValue: number | null
    validFrom: string | null
    validTo: string | null
    description: string
    conditions: DrugRuleCondition[]
    eligibility?: boolean | null
}

export interface DrugRuleFactor {
    code: string
    description: string
}

export interface DrugRuleFactorPayload extends DrugRuleFactor {}

export interface DrugRuleEvaluationRequest {
    date: string
    factors: Record<string, string>
}

export interface DrugRuleEvaluationResponse {
    eligible: boolean
    reasons: string[]
    priceAdjustmentValue: number | null
    maxAllowedQuantity: number | null
    appliedRules: string[]
}
