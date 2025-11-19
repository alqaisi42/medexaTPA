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

export interface DrugIcdRelationFlatIcdFields {
    icdId?: number | string | null
    icd_id?: number | string | null
    icdSystemCode?: string | null
    icd_system_code?: string | null
    icdCode?: string | null
    icd_code?: string | null
    icdNameEn?: string | null
    icd_name_en?: string | null
    icdNameAr?: string | null
    icd_name_ar?: string | null
    icdChapter?: string | null
    icd_chapter?: string | null
    icdBlock?: string | null
    icd_block?: string | null
    icdIsBillable?: boolean | null
    icd_is_billable?: boolean | null
    icdValidFrom?: string | [number, number, number] | null
    icd_valid_from?: string | [number, number, number] | null
    icdValidTo?: string | [number, number, number] | null
    icd_valid_to?: string | [number, number, number] | null
    icdSeverityLevel?: string | null
    icd_severity_level?: string | null
    icdIsChronic?: boolean | null
    icd_is_chronic?: boolean | null
    icdRequiresAuthorization?: boolean | null
    icd_requires_authorization?: boolean | null
    icdStandardLosDays?: number | string | null
    icd_standard_los_days?: number | string | null
    icdIsActive?: boolean | null
    icd_is_active?: boolean | null
    icdComplicationRisk?: string | null
    icd_complication_risk?: string | null
    icdCreatedAt?: string | number | null
    icd_created_at?: string | number | null
    icdUpdatedAt?: string | number | null
    icd_updated_at?: string | number | null
    icdCreatedBy?: string | null
    icd_created_by?: string | null
    icdUpdatedBy?: string | null
    icd_updated_by?: string | null
    icdEffectiveFrom?: string | number | null
    icd_effective_from?: string | number | null
    icdEffectiveTo?: string | number | null
    icd_effective_to?: string | number | null
}

export type DrugIcdRelationApiRecord = DrugIcdRelationResponse & DrugIcdRelationFlatIcdFields

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
    icdCodeDisplay?: string | null
    icdNameDisplay?: string | null
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
