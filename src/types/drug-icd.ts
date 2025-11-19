import { ICD } from './icd'

export type DrugIcdRelationType = 'INDICATION' | 'CONTRAINDICATION' | 'PRECAUTION'

export interface DrugSummary {
    id: number
    code: string
    genericNameEn: string
    brandNameEn: string
}

export interface DrugIcdRelation {
    id: number
    drug: DrugSummary | null
    icd: ICD | null
    relationType: DrugIcdRelationType
    notes?: string | null
    validFrom?: string | null
    validTo?: string | null
    isActive: boolean
    createdAt?: string | null
    updatedAt?: string | null
}

export interface CreateDrugIcdRelationPayload {
    drugId: number
    icdId: number
    relationType: DrugIcdRelationType
    notes?: string
}

export interface UpdateDrugIcdRelationPayload {
    relationType: DrugIcdRelationType
    notes?: string
}
