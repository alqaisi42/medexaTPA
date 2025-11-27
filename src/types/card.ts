import { Subscriber } from './subscriber'

export type CardStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'BLOCKED' | 'LOST' | 'REPLACED' | 'CANCELLED' | string

export interface Policy {
    id: number
    policyNumber: string
    policyCode: string | null
    employerId: number | null
    insuranceCompanyId: number | null
    policyType: string | null
    policyCategory: string | null
    startDate: [number, number, number] | string | null
    endDate: [number, number, number] | string | null
    effectiveFrom: [number, number, number] | string | null
    effectiveTo: [number, number, number] | string | null
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
    createdAt: number | string | null
    updatedAt: number | string | null
    cancellationDate: string | null
    terminationReason: string | null
    benefits: Record<string, unknown> | null
    chronicRules: Record<string, unknown> | null
    exclusions: Record<string, unknown> | null
    generalConditions: Record<string, unknown> | null
    maternityRules: Record<string, unknown> | null
    preapprovalRules: Record<string, unknown> | null
    providerExceptions: Record<string, unknown> | null
    rules: Record<string, unknown> | null
    serviceCategoryLimits: Record<string, unknown> | null
    specialLimits: Record<string, unknown> | null
    waitingPeriods: Record<string, unknown> | null
}

export interface Enrollment {
    id: number
    policyId: number
    policy?: Policy
    subscriberId: number
    subscriber?: Subscriber
    payer: number | null
    relationType: string | null
    isHeadOfFamily: boolean
    coverageStart: [number, number, number] | string | null
    coverageEnd: [number, number, number] | string | null
    status: string | null
    createdAt: number | string | null
    updatedAt: number | string | null
}

export interface EnrollmentListResponse {
    content: Enrollment[]
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

export interface EnrollmentSearchFilters {
    policyId?: number
    subscriberId?: number
    page?: number
    size?: number
}

export interface EnrollSubscriberPayload {
    policyId: number
    subscriberId: number
    payer?: number | null
    relationType?: string | null
    coverageStart?: string | null
    coverageEnd?: string | null
}

export interface InsuranceCard {
    id: number
    enrollmentId: number
    enrollment?: Enrollment
    cardNumber: string
    versionNo: number
    status: CardStatus
    issueDate: [number, number, number] | string | null
    expiryDate: [number, number, number] | string | null
    pdfUrl: string | null
    imageUrl: string | null
    createdAt: number | string | null
    updatedAt: number | string | null
}

export interface IssueCardPayload {
    enrollmentId: number
    frontTemplateCode?: string | null
    backTemplateCode?: string | null
}

export interface UpdateCardStatusPayload {
    status: CardStatus
    notes?: string | null
}

export type CardInstructionScopeType = 'GLOBAL' | 'POLICY' | 'ENROLLMENT' | string

export interface CardInstruction {
    id: number
    scopeType: CardInstructionScopeType
    scopeId: number
    language: string
    title: string
    body: string
    priority: number
    isActive: boolean
    effectiveFrom: [number, number, number] | string | null
    effectiveTo: [number, number, number] | string | null
    createdAt: number | string | null
    updatedAt: number | string | null
}

export interface CardInstructionPayload {
    scopeType: CardInstructionScopeType
    scopeId: number
    language: string
    title: string
    body: string
    priority: number
    isActive?: boolean
    effectiveFrom?: string | null
    effectiveTo?: string | null
}

export interface CardInstructionFilters {
    scopeType?: CardInstructionScopeType
    scopeId?: number
    language?: string
}

