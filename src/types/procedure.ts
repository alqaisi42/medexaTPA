import type { PaginatedResponse } from './api'

export interface ProcedureCategorySummary {
    id: number
    code: string
    nameEn: string
    nameAr?: string
    isActive?: boolean
    mappingActiveFrom?: string
    mappingActiveTo?: string
}

export interface ProcedureContainerSummary {
    id: number
    code: string
    nameEn: string
    nameAr?: string
    levelNo: number
    parentId?: number
    parentName?: string
    isActive?: boolean
    mappingActiveFrom?: string
    mappingActiveTo?: string
}

export interface ProcedureSummary {
    id: number
    systemCode: string
    code: string
    nameEn: string
    nameAr: string
    unitOfMeasure: string
    isSurgical: boolean
    isActive: boolean
    validFrom: string
    validTo: string
    referencePrice: number
    requiresAuthorization: boolean
    requiresAnesthesia: boolean
    minIntervalDays: number
    maxFrequencyPerYear: number
    standardDurationMinutes: number
    clinicalCategory?: string | null
    subCategory?: string | null
    bodyRegion?: string | null
    severityLevel?: string | null
    riskLevel?: string | null
    anesthesiaLevel?: string | null
    operationType?: string | null
    operationRoomType?: string | null
    primaryIcdCode?: string | null
    primarySpecialty?: string | null
    primaryIcd?: string | null
    allowedIcds?: string | null
    forbiddenIcds?: string | null
    icdValidationMode?: string | null
    providerType?: string | null
    minProviderLevel?: number | null
    surgeonExperienceMinYears?: number | null
    genderSpecific?: string | null
    coverageInclusions?: string | null
    coPayment?: number | null
    patientShare?: number | null
    deductible?: number | null
    maxAllowedAmount?: number | null
    limitPerVisit?: number | null
    limitPerYear?: number | null
    waitingPeriodDays?: number | null
    requiresInternalReview?: boolean | null
    parentId?: number | null
    bundleParentId?: number | null
    bundleComponents?: string | null
    isBundle?: boolean | null
    isFollowUp?: boolean | null
    followUpDays?: number | null
    baseCost?: number | null
    rvu?: number | null
    consumablesRequired?: string | null
    equipmentRequired?: string | null
    categories: ProcedureCategorySummary[]
    containers: ProcedureContainerSummary[]
    effectiveFrom?: string
    effectiveTo?: string
    createdAt?: string
    updatedAt?: string
}

export interface ProcedureDetails extends ProcedureSummary {
    createdBy?: string
    updatedBy?: string
}

export interface ProcedureCategoryRecord {
    id: number
    code: string
    nameEn: string
    nameAr: string
    isActive: boolean
    procedureCount: number
    effectiveFrom?: string
    effectiveTo?: string
    createdAt?: string
    updatedAt?: string
}

export interface ProcedureContainerRecord {
    id: number
    code: string
    nameEn: string
    nameAr: string
    levelNo: number
    parentId?: number
    parentName?: string
    isActive: boolean
    procedureCount: number
    childCount: number
    effectiveFrom?: string
    effectiveTo?: string
    createdAt?: string
    updatedAt?: string
}

export interface CreateProcedureCategoryPayload {
    code: string
    nameEn: string
    nameAr: string
    isActive: boolean
}

export interface CreateProcedureContainerPayload {
    code: string
    nameEn: string
    nameAr: string
    parentId?: number | null
    isActive: boolean
    createdBy?: string
    updatedBy?: string
}

export interface LinkProcedurePayload {
    procedureId: number
    categoryIds: number[]
    containerIds: number[]
}

export interface CreateProcedurePayload {
    systemCode: string
    code: string
    nameEn: string
    nameAr: string
    unitOfMeasure: string
    isSurgical: boolean
    referencePrice: number
    requiresAuthorization: boolean
    requiresAnesthesia: boolean
    minIntervalDays: number
    maxFrequencyPerYear: number
    standardDurationMinutes: number
    validFrom: string
    validTo: string
    isActive: boolean
    createdBy?: string
    updatedBy?: string
    clinicalCategory?: string | null
    subCategory?: string | null
    bodyRegion?: string | null
    severityLevel?: string | null
    riskLevel?: string | null
    anesthesiaLevel?: string | null
    operationType?: string | null
    operationRoomType?: string | null
    primaryIcdCode?: string | null
    primarySpecialty?: string | null
    primaryIcd?: string | null
    allowedIcds?: string | null
    forbiddenIcds?: string | null
    icdValidationMode?: string | null
    providerType?: string | null
    minProviderLevel?: number | null
    surgeonExperienceMinYears?: number | null
    genderSpecific?: string | null
    coverageInclusions?: string | null
    coPayment?: number | null
    patientShare?: number | null
    deductible?: number | null
    maxAllowedAmount?: number | null
    limitPerVisit?: number | null
    limitPerYear?: number | null
    waitingPeriodDays?: number | null
    requiresInternalReview?: boolean | null
    parentId?: number | null
    bundleParentId?: number | null
    bundleComponents?: string | null
    isBundle?: boolean | null
    isFollowUp?: boolean | null
    followUpDays?: number | null
    baseCost?: number | null
    rvu?: number | null
    consumablesRequired?: string | null
    equipmentRequired?: string | null
}

export interface ProcedureSearchFilters {
    keyword?: string
    systemCode?: string
    isSurgical?: boolean | null
    requiresAuthorization?: boolean | null
    requiresAnesthesia?: boolean | null
    isActive?: boolean | null
    minPrice?: number | null
    maxPrice?: number | null
    validOn?: string | null
    categoryId?: number | null
    containerId?: number | null
}

export type ProcedureListResponse = PaginatedResponse<ProcedureSummary>
export type ProcedureSearchResponse = PaginatedResponse<ProcedureSummary>
export type ProcedureCategoryResponse = PaginatedResponse<ProcedureCategoryRecord>
export type ProcedureContainerResponse = PaginatedResponse<ProcedureContainerRecord>
export type ProcedureDetailsPaginatedResponse = PaginatedResponse<ProcedureDetails>
