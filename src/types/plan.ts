// Plan Types
export interface Plan {
    id: number
    planCode: string
    contractNumber: string
    limitBucketsCount: number
}

export interface PlanDetail {
    id: number
    contractId: number
    planCode: string
    nameEn: string
    annualLimitPerMember: number
    limitBuckets: LimitBucket[]
}

export interface PlanPayload {
    contractId: number
    planCode: string
    nameEn: string
    annualLimitPerMember: number
    limitBuckets: LimitBucketPayload[]
}

export interface LimitBucket {
    id?: number
    nameEn: string
    limitAmount: number
    benefitIds: number[]
    medicalBasketIds: number[]
}

export interface LimitBucketPayload {
    nameEn: string
    limitAmount: number
    benefitIds: number[]
    medicalBasketIds: number[]
}

export interface PlanListResponse {
    content: Plan[]
    pageable: {
        pageNumber: number
        pageSize: number
        sort: {
            empty: boolean
            sorted: boolean
            unsorted: boolean
        }
        offset: number
        paged: boolean
        unpaged: boolean
    }
    last: boolean
    totalElements: number
    totalPages: number
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

export interface PlanSearchFilters {
    contractId?: number
    planCode?: string
    page?: number
    size?: number
}

// Benefit Types
export interface PlanBenefit {
    id: number
    planId: number
    benefitId: number
    benefitCode: string
    benefitNameEn: string
    coverage: BenefitCoverage
    limits: BenefitLimits
    copay: BenefitCopay
    rules: BenefitRules
}

export interface BenefitCoverage {
    coverageStatus: string
    waitingPeriodDays: number
    genderScope: string
    minAgeMonths: number | null
    maxAgeMonths: number | null
    maxAgeYears: number | null
    subscriberEligibilityType: string
    coverPreExisting: boolean
    preExistingBasis: string
    usageFlags: {
        copay: boolean
        limit: boolean
        coverage: boolean
    } | null
    isCoverageDriver: boolean
    isExclusionDriver: boolean
}

export interface BenefitLimits {
    limitAmount: number | null
    limitPeriod: string
    amountLimitScope: string
    sessionLimit: number | null
    limitInNetwork: number | null
    limitOutNetwork: number | null
    isLimitDriver: boolean
}

export interface BenefitCopay {
    copayType: string | null
    copayValue: number | null
    minCopayAmount: number | null
    maxCopayAmount: number | null
    copayInNetwork: number | null
    copayOutNetwork: number | null
}

export interface BenefitRules {
    requiresPreauth: boolean
    preauthThresholdAmount: number | null
    subscriberEligibilityType: string
    coverPreExisting: boolean
    isCoverageDriver: boolean
    isExclusionDriver: boolean
    isLimitDriver: boolean
    preExistingBasis: string
    usageFlags: {
        copay: boolean
        limit: boolean
        coverage: boolean
    }
    basketId: number | null
    requiredDoctorSpecialtyId: number | null
    frequencyValue: number | null
    frequencyUnit: string | null
    frequencyDuration: number | null
    linkToCaseType: string | null
}

export interface PlanBenefitPayload {
    benefitId: number
    coverage: BenefitCoverage
    limits: BenefitLimits
    copay: BenefitCopay
    rules: BenefitRules
}

export interface PlanBenefitUpdatePayload {
    benefitId: number
    coverage: BenefitCoverage
    limits: BenefitLimits
    copay: BenefitCopay
    rules: BenefitRules
}

export interface PlanBenefitListResponse {
    success: boolean
    code: number
    data: {
        content: PlanBenefit[]
        pageable: {
            pageNumber: number
            pageSize: number
            sort: {
                empty: boolean
                sorted: boolean
                unsorted: boolean
            }
            offset: number
            paged: boolean
            unpaged: boolean
        }
        last: boolean
        totalElements: number
        totalPages: number
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
    timestamp: number
}

export interface PlanBenefitResponse {
    success: boolean
    code: number
    message?: string
    data: PlanBenefit
    errors?: string[]
    timestamp: string | number
}

// Master Benefit Types
export interface MasterBenefit {
    id: number
    code: string
    nameEn: string
    nameAr: string
    categoryId: number
    categoryNameEn: string
    isActive: boolean
}

export interface MasterBenefitPayload {
    code: string
    nameEn: string
    nameAr?: string
    categoryId: number
    isActive: boolean
}

export interface MasterBenefitUpdatePayload {
    nameEn?: string
    nameAr?: string
    categoryId?: number
    isActive?: boolean
}

export interface MasterBenefitListResponse {
    success: boolean
    code: number
    data: {
        content: MasterBenefit[]
        pageable: {
            pageNumber: number
            pageSize: number
            sort: {
                empty: boolean
                sorted: boolean
                unsorted: boolean
            }
            offset: number
            paged: boolean
            unpaged: boolean
        }
        last: boolean
        totalElements: number
        totalPages: number
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
    timestamp: number
}

export interface MasterBenefitResponse {
    success: boolean
    code: number
    message?: string
    data: MasterBenefit
    errors?: string[]
    timestamp: string | number
}

// Benefit Mapping Types
export interface BenefitMapping {
    id: number
    benefitId: number
    procedureId: number | null
    icdId: number | null
    drugId: number | null
    isRequired: boolean
    notes: string | null
}

export interface BenefitMappingPayload {
    procedureId?: number | null
    icdId?: number | null
    drugId?: number | null
    isRequired: boolean
    notes?: string | null
}

export interface BenefitMappingListResponse {
    success: boolean
    code: number
    message?: string
    data: BenefitMapping[]
    errors?: string[]
    timestamp: string
}

export interface BenefitMappingResponse {
    success: boolean
    code: number
    message?: string
    data: BenefitMapping
    errors?: string[]
    timestamp: string
}

// Limit Bucket Types
export interface LimitBucketItem {
    id?: number
    benefitId?: number | null
    benefitName?: string
    medicalBasket?: MedicalBasket | null
    procedureId?: number | null
    drugId?: number | null
}

export interface MedicalBasket {
    id: number
    code: string
    nameEn: string
    nameAr: string
    isActive: boolean
    effectiveFrom: string
    effectiveTo: string
    createdAt: string
    updatedAt: string
}

export interface LimitBucketDetail {
    id: number
    planId: number
    nameEn: string
    limitAmount: number
    limitPeriod: string
    deductFromAnnualLimit: boolean
    items: LimitBucketItem[]
}

export interface LimitBucketPayload {
    nameEn: string
    limitAmount: number
    limitPeriod: string
    deductFromAnnualLimit: boolean
    items: LimitBucketItemPayload[]
}

export interface LimitBucketItemPayload {
    benefitId?: number | null
    medicalBasket?: string | null
    procedureId?: number | null
    drugId?: number | null
}

export interface LimitBucketListResponse {
    success: boolean
    code: number
    data: {
        content: LimitBucketDetail[]
        pageable: {
            pageNumber: number
            pageSize: number
            sort: {
                empty: boolean
                sorted: boolean
                unsorted: boolean
            }
            offset: number
            paged: boolean
            unpaged: boolean
        }
        last: boolean
        totalElements: number
        totalPages: number
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
    timestamp: number
}

export interface LimitBucketResponse {
    success: boolean
    code: number
    message?: string
    data: LimitBucketDetail
    errors?: string[]
    timestamp: string | number
}

// Plan Network Types
export interface PlanNetwork {
    id: number
    planId: number
    networkId: number
    tierLevel: string
    networkCopayPenaltyPercent: number
    isActive: boolean
}

export interface PlanNetworkPayload {
    networkId: number
    tierLevel: string
    networkCopayPenaltyPercent: number
    isActive: boolean
}

export interface PlanNetworkUpdatePayload {
    tierLevel: string
    networkCopayPenaltyPercent: number
    isActive: boolean
}

export interface PlanNetworkListResponse {
    success: boolean
    code: number
    data: {
        content: PlanNetwork[]
        pageable: {
            pageNumber: number
            pageSize: number
            sort: {
                empty: boolean
                sorted: boolean
                unsorted: boolean
            }
            offset: number
            paged: boolean
            unpaged: boolean
        }
        last: boolean
        totalElements: number
        totalPages: number
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
    timestamp: number
}

export interface PlanNetworkResponse {
    success: boolean
    code: number
    message?: string
    data: PlanNetwork
    errors?: string[]
    timestamp: string | number
}

// Plan Exclusion Types
export interface PlanExclusion {
    id: number
    planId: number
    exclusionType: string
    codeValue: string
    description: string
    isHardBlock: boolean
    createdAt: number | string
}

export interface PlanExclusionPayload {
    exclusionType: string
    codeValue: string
    description: string
    isHardBlock: boolean
}

export interface PlanExclusionUpdatePayload {
    description: string
    isHardBlock: boolean
}

export interface PlanExclusionListResponse {
    success: boolean
    code: number
    data: {
        content: PlanExclusion[]
        pageable: {
            pageNumber: number
            pageSize: number
            sort: {
                empty: boolean
                sorted: boolean
                unsorted: boolean
            }
            offset: number
            paged: boolean
            unpaged: boolean
        }
        last: boolean
        totalElements: number
        totalPages: number
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
    timestamp: number
}

export interface PlanExclusionResponse {
    success: boolean
    code: number
    message?: string
    data: PlanExclusion
    errors?: string[]
    timestamp: string | number
}

// Plan Reinsurance Types
export interface PlanReinsurance {
    id: number
    planId: number
    treatyId: number
    treatyCode: string | null
    treatyNameEn: string
    retentionLimit: number
    cededPercentage: number
    priorityOrder: number
}

export interface PlanReinsurancePayload {
    treatyId: number
    retentionLimit: number
    cededPercentage: number
    priorityOrder: number
}

export interface PlanReinsuranceUpdatePayload {
    retentionLimit: number
    cededPercentage: number
    priorityOrder: number
}

export interface PlanReinsuranceListResponse {
    success: boolean
    code: number
    data: {
        content: PlanReinsurance[]
        pageable: {
            pageNumber: number
            pageSize: number
            sort: {
                empty: boolean
                sorted: boolean
                unsorted: boolean
            }
            offset: number
            paged: boolean
            unpaged: boolean
        }
        last: boolean
        totalElements: number
        totalPages: number
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
    timestamp: number
}

export interface PlanReinsuranceResponse {
    success: boolean
    code: number
    message?: string
    data: PlanReinsurance
    errors?: string[]
    timestamp: string | number
}

// Enums and Constants
export type CoverageStatus = 'COVERED' | 'NOT_COVERED' | 'EXCLUDED'
export type GenderScope = 'MALE' | 'FEMALE' | 'BOTH'
export type SubscriberEligibilityType = 'ALL' | 'SUBSCRIBER_ONLY' | 'DEPENDENTS_ONLY'
export type PreExistingBasis = 'JOINING_DATE' | 'POLICY_START' | 'NEVER'
export type LimitPeriod = 'PER_YEAR' | 'PER_MONTH' | 'PER_VISIT' | 'LIFETIME' | 'PER_CASE'
export type CopayType = 'FIXED' | 'PERCENTAGE' | 'NONE'
export type FrequencyUnit = 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS'
export type TierLevel = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'OUT_OF_NETWORK'
export type ExclusionType = 'ICD' | 'CPT' | 'DRUG' | 'PROCEDURE' | 'SPECIAL_CASE'
