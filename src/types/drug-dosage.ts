import { DrugRuleCondition } from './drug-rule'

export type DosageRuleCondition = DrugRuleCondition

export interface DosageRuleFrequency {
    frequencyCode: string
    timesPerDay: number | null
    intervalHours: number | null
    timingNotes: string | null
    specialInstructions: string | null
}

export interface DosageRule {
    id: number
    drugPackId: number
    ruleName: string
    dosageAmount: number
    dosageUnit: string
    notes: string | null
    priority: number
    validFrom: string | null
    validTo: string | null
    isActive: boolean
    conditions: DosageRuleCondition[]
    frequencies: DosageRuleFrequency[]
}

export interface DosageRulePayload {
    drugPackId: number
    ruleName: string
    dosageAmount: number
    dosageUnit: string
    notes: string | null
    priority: number
    validFrom: string | null
    validTo: string | null
    conditions: DosageRuleCondition[]
    frequencies: DosageRuleFrequency[]
}

export interface DosageRecommendationRequest {
    date: string
    factors: Record<string, string>
}

export interface DosageRecommendationResponse {
    foundRule: boolean
    ruleId: number | null
    ruleName: string
    priority: number | null
    dosageAmount: number | null
    dosageUnit: string | null
    notes: string | null
    frequencies: DosageRuleFrequency[]
    reasons: string[]
}

export interface DrugDecisionPricingSummary {
    baseUnitPrice: number | null
    baseTotalPrice: number | null
    finalUnitPrice: number | null
    finalTotalPrice: number | null
    adjustmentValue: number | null
    requestedQuantity: number | null
    maxAllowedQuantity: number | null
    quantityAfterEnforcement: number | null
}

export interface DrugDecisionEvaluationRequest {
    drugPackId: number
    priceListId: number
    requestedQuantity: number
    factors: Record<string, string>
    requestedDate: string
}

export interface DrugDecisionEvaluationResponse {
    eligible: boolean
    reasons: string[]
    pricing: DrugDecisionPricingSummary | null
    dosage: DosageRecommendationResponse | null
    warnings: string[]
    clinicalNotes: string[]
}
