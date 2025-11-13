import type { ApiResponse, PaginatedResponse } from './api'

export interface ICD {
    id: number
    systemCode: string
    code: string
    nameEn: string
    nameAr: string
    chapter: string
    block: string
    isBillable: boolean
    validFrom: string
    validTo: string
    severityLevel: string
    isChronic: boolean
    requiresAuthorization: boolean
    standardLosDays: number
    isActive: boolean
    complicationRisk?: string
    createdAt?: string
    updatedAt?: string
    createdBy?: string
    updatedBy?: string
    effectiveFrom?: string
    effectiveTo?: string
}

export type { ApiResponse, PaginatedResponse }

export interface IcdPayload {
    systemCode: string
    code: string
    nameEn: string
    nameAr: string
    chapter: string
    block: string
    isBillable: boolean
    validFrom: string
    validTo: string
    severityLevel: string
    isChronic: boolean
    requiresAuthorization: boolean
    standardLosDays: number
    isActive: boolean
}
