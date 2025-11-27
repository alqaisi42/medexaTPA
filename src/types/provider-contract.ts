export type ReimbursementModel = 'FFS' | 'DRG' | 'PACKAGED' | 'CAPITATION' | 'HYBRID' | string

export interface ProviderContract {
    id: number
    contractCode: string
    nameEn: string
    nameAr: string | null
    providerId: number
    providerName: string | null
    isActive: boolean
    appliesToNetwork: boolean
    effectiveFrom: number | string | null
    effectiveTo: number | string | null
    createdAt: number | string | null
    updatedAt: number | string | null
    // Financial fields
    tpaCommissionPercent: number | null
    tpaCommissionFixed: number | null
    contractDiscountPercent: number | null
    contractDiscountFixed: number | null
    reimbursementModel: ReimbursementModel | null
    ppdPercent: number | null
    ppdDayLimit: number | null
    annualCap: number | null
    monthlyCap: number | null
    perCaseCap: number | null
    vatIncluded: boolean | null
    vatPercent: number | null
    denyPolicy: Record<string, unknown> | null
    // Extended fields
    settlementStrategy: string | null
    deductibleOverride: number | null
    copayOverride: number | null
    copayType: string | null
    networkTier: string | null
    currency: string | null
    claimSubmissionDayLimit: number | null
    isCashlessAllowed: boolean | null
    isReimbursementAllowed: boolean | null
    // Audit fields
    createdBy?: string | null
    updatedBy?: string | null
}

export interface ProviderContractPayload {
    providerId: number
    contractCode: string
    nameEn: string
    nameAr?: string | null
    appliesToNetwork?: boolean
    // Financial fields
    tpaCommissionPercent?: number | null
    tpaCommissionFixed?: number | null
    contractDiscountPercent?: number | null
    contractDiscountFixed?: number | null
    reimbursementModel?: ReimbursementModel
    ppdPercent?: number | null
    ppdDayLimit?: number | null
    annualCap?: number | null
    monthlyCap?: number | null
    perCaseCap?: number | null
    vatIncluded?: boolean
    vatPercent?: number | null
    denyPolicy?: Record<string, unknown> | null
    // Extended fields
    settlementStrategy?: string | null
    deductibleOverride?: number | null
    copayOverride?: number | null
    copayType?: string | null
    networkTier?: string | null
    currency?: string | null
    claimSubmissionDayLimit?: number | null
    isCashlessAllowed?: boolean | null
    isReimbursementAllowed?: boolean | null
    createdBy?: number | null
}

export interface ProviderContractUpdatePayload {
    nameEn?: string | null
    nameAr?: string | null
    isActive?: boolean | null
    appliesToNetwork?: boolean | null
    effectiveFrom?: string | null
    effectiveTo?: string | null
    // Financial fields
    tpaCommissionPercent?: number | null
    tpaCommissionFixed?: number | null
    contractDiscountPercent?: number | null
    contractDiscountFixed?: number | null
    reimbursementModel?: ReimbursementModel | null
    ppdPercent?: number | null
    ppdDayLimit?: number | null
    annualCap?: number | null
    monthlyCap?: number | null
    perCaseCap?: number | null
    vatIncluded?: boolean | null
    vatPercent?: number | null
    denyPolicy?: Record<string, unknown> | null
    // Extended fields
    settlementStrategy?: string | null
    deductibleOverride?: number | null
    copayOverride?: number | null
    copayType?: string | null
    networkTier?: string | null
    currency?: string | null
    claimSubmissionDayLimit?: number | null
    isCashlessAllowed?: boolean | null
    isReimbursementAllowed?: boolean | null
}

export interface ProviderContractListResponse {
    content: ProviderContract[]
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

export interface ProviderContractSearchFilters {
    query?: string
    providerId?: number
    isActive?: boolean
    appliesToNetwork?: boolean
    effectiveFromStart?: string
    effectiveFromEnd?: string
    page?: number
    size?: number
    sortBy?: 'CREATED_AT' | 'UPDATED_AT' | 'CONTRACT_CODE' | 'NAME_EN' | 'PROVIDER'
    sortDirection?: 'ASC' | 'DESC'
}

