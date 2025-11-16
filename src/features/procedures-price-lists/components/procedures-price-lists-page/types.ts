import type {PricingFactor} from '@/types'

export type FactorInputKind = 'text' | 'number' | 'select' | 'date' | 'boolean'

export interface ConditionDraft {
    id: string
    factorKey: string
    operator: string
    value: string | number | boolean | string[] | { min?: string; max?: string }
}

export interface AdjustmentCaseDraft {
    id: string
    caseValue: string
    amount: string
}

export interface PricingTierDraft {
    id: string
    points: string
    condition: ConditionDraft | null
}

export interface ConditionalFixedDraft {
    id: string
    price: string
    conditions: ConditionDraft[]
}

export interface DiscountLogicBlockDraft {
    id: string
    percent: string
    conditions: ConditionDraft[]
}

export interface AdjustmentTierDraft {
    id: string
    value: string
    add: string
    percent: string
}

export interface AdjustmentLogicBlockDraft {
    id: string
    add: string
    addPercent: string
    conditions: ConditionDraft[]
}

export interface AdjustmentDraft {
    id: string
    type: string
    factorKey: string
    percent: string
    cases: AdjustmentCaseDraft[]
    tiers: AdjustmentTierDraft[]
    logicBlocks: AdjustmentLogicBlockDraft[]
}

export interface FactorEntryDraft {
    id: string
    factorKey: string
    value: string | number | boolean | string[]
}

export interface ContextEntryDraft {
    id: string
    key: string
    value: string
}

export interface ConditionMatrixRow {
    id: string
    order: number
    factorLabel: string
    dataType: PricingFactor['dataType'] | '—'
    operatorLabel: string
    valueLabel: string
}
