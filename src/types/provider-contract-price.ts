export type PricingMethod = 'FIXED' | 'POINTS' | 'RANGE' | 'PERCENTAGE' | string

export interface ProcedureInfo {
    id: number
    code: string
    nameEn: string
    nameAr?: string
}

export interface ProviderContractPrice {
    id: number
    providerId: number
    procedureId: number
    price: number
    pricingMethod: PricingMethod
    pointValue: number | null
    minPrice: number | null
    maxPrice: number | null
    copayPercent: number | null
    copayFixed: number | null
    deductible: number
    priceListId: number | null
    effectiveFrom: number[] | string | null
    effectiveTo: number[] | string | null
    notes: string | null
    createdAt: number[] | string | null
    updatedAt: number[] | string | null
    // Procedure information (from nested object in API response)
    procedure?: ProcedureInfo
    // Extended fields from procedure lookup (fallback)
    procedureCode?: string
    procedureName?: string
    procedureNameAr?: string
    procedureCategoryId?: number
    procedureCategoryName?: string
    specialtyId?: number
    specialtyName?: string
}

export interface ProviderContractPricePayload {
    providerId: number
    procedureId: number
    price: number
    pricingMethod: PricingMethod
    pointValue?: number | null
    minPrice?: number | null
    maxPrice?: number | null
    copayPercent?: number | null
    copayFixed?: number | null
    deductible?: number
    priceListId?: number | null
    effectiveFrom?: string
    effectiveTo?: string | null
    notes?: string
}

export interface ProviderContractPriceUpdatePayload {
    price: number
    pricingMethod: PricingMethod
    pointValue?: number | null
    minPrice?: number | null
    maxPrice?: number | null
    copayPercent?: number | null
    copayFixed?: number | null
    deductible?: number
    priceListId?: number | null
    effectiveFrom?: string
    effectiveTo?: string | null
    notes?: string
}

export interface ProviderContractPriceListResponse {
    content: ProviderContractPrice[]
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

export interface ProviderContractPriceSearchFilters {
    providerId?: number
    contractId?: number
    procedureId?: number
    procedureCategoryId?: number
    pricingMethod?: PricingMethod
    specialtyId?: number
    effectiveDate?: string
    page?: number
    size?: number
}

