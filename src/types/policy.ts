export interface Policy {
    id: number
    policyNumber: string
    policyCode: string | null
    employerId: number
    insuranceCompanyId: number | null
    policyType: string | null
    policyCategory: string | null
    startDate: [number, number, number] | string | null // [year, month, day] or ISO string
    endDate: [number, number, number] | string | null // [year, month, day] or ISO string
    effectiveFrom: string | null
    effectiveTo: string | null
    globalLimit: number | null
    inpatientLimit: number | null
    outpatientLimit: number | null
    pharmacyLimit: number | null
    maternityLimit: number | null
    dentalLimit: number | null
    opticalLimit: number | null
    hasMaternity: boolean
    hasDental: boolean
    hasOptical: boolean
    hasPharmacy: boolean
    pricingModel: string | null
    networkType: string | null
    isActive: boolean
}

export interface PolicyPayload {
    policyNumber?: string
    policyCode?: string | null
    employerId: number
    insuranceCompanyId?: number | null
    policyType?: string | null
    policyCategory?: string | null
    startDate?: string | null // ISO date string
    endDate?: string | null // ISO date string
    effectiveFrom?: string | null // ISO date string
    effectiveTo?: string | null // ISO date string
    globalLimit?: number | null
    inpatientLimit?: number | null
    outpatientLimit?: number | null
    pharmacyLimit?: number | null
    maternityLimit?: number | null
    dentalLimit?: number | null
    opticalLimit?: number | null
    hasMaternity?: boolean
    hasDental?: boolean
    hasOptical?: boolean
    hasPharmacy?: boolean
    pricingModel?: string | null
    networkType?: string | null
    isActive?: boolean
}

export interface PolicyListResponse {
    content: Policy[]
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

export interface PolicySearchFilters {
    query?: string
    employerId?: number
    isActive?: boolean
    page?: number
    size?: number
}

export interface WaitingPeriod {
    id: number
    policyId: number
    serviceType: string | null
    days: number
    icdCategoryId: number | null
    procedureCategoryId: number | null
    maternityFlag: boolean
    notes: string | null
}

export interface WaitingPeriodListResponse {
    content: WaitingPeriod[]
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

// Special Limits
export interface SpecialLimit {
    id: number
    policyId: number
    serviceType: string | null
    limitType: string | null
    limitAmount: number | null
    maxVisits: number | null
    deductibleAmount: number | null
    copayPercent: number | null
    icdId: number | null
    procedureId: number | null
    procedureCategoryId: number | null
    notes: string | null
}

export interface SpecialLimitListResponse {
    content: SpecialLimit[]
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

// Provider Exceptions
export interface ProviderException {
    id: number
    policyId: number
    providerId: number
    serviceType: string | null
    procedureId: number | null
    icdId: number | null
    overrideCopayPercent: number | null
    overrideDeductibleAmount: number | null
    overrideLimitAmount: number | null
    overrideReimbursementModel: string | null
    isAllowed: boolean
    exceptionType: string | null
    notes: string | null
}

export interface ProviderExceptionListResponse {
    content: ProviderException[]
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

// Preapproval Rules
export interface PreapprovalRule {
    id: number
    policyId: number
    serviceType: string | null
    procedureId: number | null
    icdId: number | null
    providerTypeId: number | null
    claimType: string | null
    requiresPreapproval: boolean
    notes: string | null
}

export interface PreapprovalRuleListResponse {
    content: PreapprovalRule[]
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

// Maternity Rules
export interface MaternityRule {
    id: number
    policyId: number
    waitingDays: number | null
    requiresMarriage: boolean
    coversNormalDelivery: boolean
    coversCSection: boolean
    coversComplications: boolean
    coversIvf: boolean
    perPregnancyLimit: number | null
    annualLimit: number | null
    maxPregnancies: number | null
    requiresPreapproval: boolean
    newbornCoverageDays: number | null
    pricingModel: string | null
    packagePrice: number | null
    notes: string | null
}

export interface MaternityRulePayload {
    policyId: number
    waitingDays?: number | null
    requiresMarriage?: boolean
    coversNormalDelivery?: boolean
    coversCSection?: boolean
    coversComplications?: boolean
    coversIvf?: boolean
    perPregnancyLimit?: number | null
    annualLimit?: number | null
    maxPregnancies?: number | null
    requiresPreapproval?: boolean
    newbornCoverageDays?: number | null
    pricingModel?: string | null
    packagePrice?: number | null
    notes?: string | null
}

// General Conditions
export interface GeneralCondition {
    id: number
    policyId: number
    minAgeYears: number | null
    maxAgeYears: number | null
    allowDependentsAfterHofDeath: boolean
    newbornGraceDays: number | null
    coverageScope: string | null
    isInternationalCoverage: boolean
    defaultCopayPercent: number | null
    defaultDeductibleAmount: number | null
    defaultCoinsurancePercent: number | null
    annualLimit: number | null
    lifetimeLimit: number | null
    familyLimit: number | null
    gracePeriodDays: number | null
    maxClaimsPerDay: number | null
    minGapBetweenVisitsDays: number | null
    autoApproveChronic: boolean
    autoApproveMaternityFollowups: boolean
    termsEn: string | null
    termsAr: string | null
}

export interface GeneralConditionPayload {
    policyId: number
    minAgeYears?: number | null
    maxAgeYears?: number | null
    allowDependentsAfterHofDeath?: boolean
    newbornGraceDays?: number | null
    coverageScope?: string | null
    isInternationalCoverage?: boolean
    defaultCopayPercent?: number | null
    defaultDeductibleAmount?: number | null
    defaultCoinsurancePercent?: number | null
    annualLimit?: number | null
    lifetimeLimit?: number | null
    familyLimit?: number | null
    gracePeriodDays?: number | null
    maxClaimsPerDay?: number | null
    minGapBetweenVisitsDays?: number | null
    autoApproveChronic?: boolean
    autoApproveMaternityFollowups?: boolean
    termsEn?: string | null
    termsAr?: string | null
}

// Exclusions
export interface Exclusion {
    id: number
    policyId: number
    code: string | null
    description: string | null
    exclusionType: string | null
    icdId: number | null
    procedureId: number | null
    isGlobal: boolean
}

export interface ExclusionListResponse {
    content: Exclusion[]
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

// Chronic Rules
export interface ChronicRule {
    id: number
    policyId: number
    icdId: number | null
    monthlyLimit: number | null
    annualLimit: number | null
    perPrescriptionLimit: number | null
    maxVisitsYearly: number | null
    mandatoryFollowupMonths: number | null
    allowsLongTermMeds: boolean
    maxMedicationMonthsSupply: number | null
    requiresPreapproval: boolean
    notes: string | null
}

export interface ChronicRulePayload {
    policyId: number
    icdId: number | null
    monthlyLimit?: number | null
    annualLimit?: number | null
    perPrescriptionLimit?: number | null
    maxVisitsYearly?: number | null
    mandatoryFollowupMonths?: number | null
    allowsLongTermMeds?: boolean
    maxMedicationMonthsSupply?: number | null
    requiresPreapproval?: boolean
    notes?: string | null
}

export interface ChronicRuleListResponse {
    content: ChronicRule[]
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

// Category Limits
export interface CategoryLimit {
    id: number
    policyId: number
    serviceCategory: string | null
    subCategory: string | null
    yearlyLimit: number | null
    monthlyLimit: number | null
    perVisitLimit: number | null
    maxVisits: number | null
    copayPercent: number | null
    deductibleAmount: number | null
    notes: string | null
}

export interface CategoryLimitListResponse {
    content: CategoryLimit[]
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

