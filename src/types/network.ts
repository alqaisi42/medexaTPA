export type NetworkStatus = 'ACTIVE' | 'INACTIVE'
export type NetworkType = 'TIER' | 'GEOGRAPHIC' | 'SPECIALTY' | 'PROGRAM' | 'CONTRACT' | 'OTHER'
export type CoverageType = 'INCLUDED' | 'EXCLUDED' | 'PARTIAL'

export interface Network {
    id: number
    code: string
    nameEn: string
    nameAr: string
    description: string | null
    status: NetworkStatus
    networkType: NetworkType
    effectiveFrom: number | null
    effectiveTo: number | null
    createdAt: number | null
    updatedAt: number | null
}

export interface NetworkPayload {
    code: string
    nameEn: string
    nameAr: string
    description?: string
    networkType: NetworkType
}

export interface NetworkUpdatePayload {
    nameEn: string
    nameAr: string
    description?: string
    networkType: NetworkType
    status: NetworkStatus
    effectiveFrom?: string
    effectiveTo?: string | null
}

export interface NetworkListResponse {
    content: Network[]
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

export interface PlanNetworkMapping {
    id: number
    planId: number
    planCode: string
    planNameEn: string
    networkId: number
    networkCode: string
    networkNameEn: string
    coverageType: CoverageType
    status: NetworkStatus
    effectiveFrom: string | null
    effectiveTo: string | null
    notes: string | null
    createdAt: string | null
    updatedAt: string | null
}

export interface PlanNetworkMappingPayload {
    planId: number
    networkId: number
    coverageType: CoverageType
    effectiveFrom?: string
    effectiveTo?: string | null
    notes?: string
}

export interface PlanNetworkMappingUpdatePayload {
    coverageType: CoverageType
    status: NetworkStatus
    effectiveFrom?: string
    effectiveTo?: string | null
    notes?: string
}

export interface PlanNetworkMappingListResponse {
    content: PlanNetworkMapping[]
    pageable: {
        offset: number
        sort: {
            empty: boolean
            sorted: boolean
            unsorted: boolean
        }
        pageNumber: number
        pageSize: number
        unpaged: boolean
        paged: boolean
    }
    totalPages: number
    totalElements: number
    first: boolean
    last: boolean
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

export interface NetworkSearchFilters {
    status?: NetworkStatus
    name?: string
    networkType?: NetworkType
    page?: number
    size?: number
}

export interface ProviderNetworkMapping {
    id: number
    providerId: number
    providerCode: string
    providerNameEn: string
    networkId: number
    networkCode: string
    networkNameEn: string
    tierCode: string
    status: NetworkStatus
    effectiveFrom: number | null
    effectiveTo: number | null
    notes: string | null
    createdAt: number | null
    updatedAt: number | null
}

export interface ProviderNetworkMappingPayload {
    providerId: number
    networkId: number
    tierCode: string
    effectiveFrom?: string
    effectiveTo?: string | null
    notes?: string
}

export interface ProviderNetworkMappingUpdatePayload {
    tierCode: string
    status: NetworkStatus
    effectiveFrom?: string
    effectiveTo?: string | null
    notes?: string
}

export interface ProviderNetworkMappingListResponse {
    content: ProviderNetworkMapping[]
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

