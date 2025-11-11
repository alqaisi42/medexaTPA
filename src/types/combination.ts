export type CombinationType =
    | 'procedure_pricing'
    | 'authorization_rule'
    | 'limit_rule'
    | 'coverage_rule'

export interface CombinationFactor {
    factorType: string
    factorValue: string | string[]
    operator?: 'equals' | 'contains' | 'between' | 'greater_than' | 'less_than'
}

export interface CombinationRule {
    id: string
    type: CombinationType
    factors: CombinationFactor[]
    value: number | string | boolean
    isDefault: boolean
    effectiveDate: Date
    expiryDate?: Date
    priority: number
}
