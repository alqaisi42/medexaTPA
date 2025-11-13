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

export interface ApiResponse<T> {
    success: boolean
    code: number
    message: string
    data?: T
    errors?: string[]
    timestamp: string
}

export interface PaginatedResponse<T> {
    totalPages: number
    totalElements: number
    first: boolean
    last: boolean
    size: number
    content: T[]
    number: number
    sort?: {
        empty: boolean
        sorted: boolean
        unsorted: boolean
    }
    numberOfElements: number
    pageable?: {
        offset: number
        pageNumber: number
        pageSize: number
        paged: boolean
        unpaged: boolean
        sort?: {
            empty: boolean
            sorted: boolean
            unsorted: boolean
        }
    }
    empty: boolean
}

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
