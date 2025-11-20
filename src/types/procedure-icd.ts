export type ProcedureIcdRelationType = 'INDICATION' | 'PRECAUTION' | 'CONTRAINDICATION' | string
export type ProcedureSeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | string

export interface ProcedureIcdCategorySummary {
    id: number
    code: string
    nameEn: string
    nameAr?: string
}

export interface ProcedureIcdCategoryMapping {
    id: number
    procedureId: number
    relationType: ProcedureIcdRelationType
    createdAt?: number | string
    createdBy?: string | null
    category: ProcedureIcdCategorySummary
}

export interface CreateProcedureIcdCategoryPayload {
    procedureId: number
    icdCategoryId: number
    relationType: ProcedureIcdRelationType
    createdBy?: string
}

export interface IcdProcedureSeverity {
    id: number
    icdCategoryId: number
    procedureId: number
    severityLevel: ProcedureSeverityLevel
    relationType: ProcedureIcdRelationType
    covered: boolean
    requiresPreapproval: boolean
    notes?: string | null
    icdCategory?: ProcedureIcdCategorySummary | null
}

export interface CreateIcdProcedureSeverityPayload {
    icdCategoryId: number
    procedureId: number
    severityLevel: ProcedureSeverityLevel
    relationType: ProcedureIcdRelationType
    covered: boolean
    requiresPreapproval: boolean
    notes?: string | null
}
