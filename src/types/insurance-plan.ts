export type PlanType = 'CORPORATE' | 'INDIVIDUAL' | 'FAMILY' | 'GROUP' | 'OTHER'
export type PlanCategory = 'PREMIUM' | 'STANDARD' | 'BASIC' | 'ECONOMY' | 'OTHER'

export interface InsurancePlan {
    id: number
    code: string
    nameEn: string
    nameAr: string
    description: string | null
    planType: PlanType
    category: PlanCategory
    isActive: boolean
    effectiveFrom: number | null
    effectiveTo: number | null
    createdAt: number | null
    updatedAt: number | null
}

export interface InsurancePlanPayload {
    code: string
    nameEn: string
    nameAr: string
    description?: string
    planType: PlanType
    category: PlanCategory
}

export interface InsurancePlanUpdatePayload {
    nameEn: string
    nameAr: string
    description?: string
    planType: PlanType
    category: PlanCategory
    isActive: boolean
}

export interface InsurancePlanListResponse {
    content: InsurancePlan[]
    pageable: {
        pageNumber: number
        pageSize: number
        sort: {
            empty: boolean
            sorted: boolean
            unsorted: boolean
        }
        offset: number
        unpaged: boolean
        paged: boolean
    }
    last: boolean
    totalPages: number
    totalElements: number
    first: boolean
    size: number
    number: number
    sort: {
        empty: boolean
        sorted: boolean
        unsorted: boolean
    }
    numberOfElements: number
    empty: boolean
}

export interface InsurancePlanSearchFilters {
    planType?: PlanType
    category?: PlanCategory
    isActive?: boolean
    name?: string
    code?: string
    page?: number
    size?: number
}

