import { ICD } from './icd'

export interface RawDrugSummary {
    id: number
    code: string
    genericNameEn?: string | null
    brandNameEn?: string | null
    generic_name_en?: string | null
    brand_name_en?: string | null
}

export interface RawDrugDetails extends RawDrugSummary {
    genericNameAr?: string | null
    brandNameAr?: string | null
    atcCode?: string | null
    description?: string | null
    isControlled?: boolean | null
    isOtc?: boolean | null
    allowGenericSubstitution?: boolean | null
    validFrom?: string | [number, number, number] | null
    validTo?: string | [number, number, number] | null
    isActive?: boolean | null
    createdAt?: string | number | null
    updatedAt?: string | number | null
    createdBy?: string | null
}

export interface RawIcdDetails {
    id: number
    systemCode?: string | null
    system_code?: string | null
    code?: string | null
    nameEn?: string | null
    name_en?: string | null
    nameAr?: string | null
    name_ar?: string | null
    chapter?: string | null
    block?: string | null
    isBillable?: boolean | null
    validFrom?: string | [number, number, number] | null
    validTo?: string | [number, number, number] | null
    severityLevel?: string | null
    severity_level?: string | null
    isChronic?: boolean | null
    requiresAuthorization?: boolean | null
    standardLosDays?: number | string | null
    isActive?: boolean | null
    complicationRisk?: string | null
    createdAt?: string | number | null
    updatedAt?: string | number | null
    createdBy?: string | null
    updatedBy?: string | null
    effectiveFrom?: string | number | null
    effectiveTo?: string | number | null
}

export interface DrugIcdRelationResponse {
    id: number
    drug: RawDrugDetails | null
    icd: RawIcdDetails | null
    relationType: string
    notes?: string | null
    validFrom?: string | [number, number, number] | null
    validTo?: string | [number, number, number] | null
    isActive?: boolean | null
    createdAt?: string | number | null
    updatedAt?: string | number | null
}

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
