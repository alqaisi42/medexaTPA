export type Gender = 'M' | 'F' | 'O' | string
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | string | null
export type RelationType = 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | string | null
export type EligibilityStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED' | string | null
export type CardStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'BLOCKED' | string | null

export interface Subscriber {
    id: number
    nationalId: string
    fullNameEn: string
    fullNameAr: string | null
    gender: Gender
    dateOfBirth: [number, number, number] | string | null // [year, month, day] or ISO string
    maritalStatus: MaritalStatus
    isAlive: boolean
    deathDate: string | null
    createdAt: number | string | null
    updatedAt: number | string | null
    passportNo: string | null
    insuranceId: string | null
    firstNameEn: string | null
    middleNameEn: string | null
    lastNameEn: string | null
    firstNameAr: string | null
    middleNameAr: string | null
    lastNameAr: string | null
    phoneNumber: string | null
    mobileNumber: string | null
    email: string | null
    country: string | null
    city: string | null
    addressLine: string | null
    employerName: string | null
    employeeNumber: string | null
    nationality: string | null
    employerId: number | null
    relationType: RelationType
    isHeadOfFamily: boolean
    hofId: number | null
    hasChronicConditions: boolean
    hasPreexisting: boolean
    preexistingNotes: string | null
    eligibilityStatus: EligibilityStatus
    eligibilityStart: string | null
    eligibilityEnd: string | null
    currentPolicyId: number | null
    currentEnrollmentId: number | null
    currentCardStatus: CardStatus
    currentCardVersion: number | null
}

export interface SubscriberPayload {
    nationalId: string
    fullNameEn: string
    fullNameAr?: string | null
    gender: Gender
    dateOfBirth: string // ISO date string
    maritalStatus?: MaritalStatus
    isAlive?: boolean
    deathDate?: string | null
    passportNo?: string | null
    insuranceId?: string | null
    firstNameEn?: string | null
    middleNameEn?: string | null
    lastNameEn?: string | null
    firstNameAr?: string | null
    middleNameAr?: string | null
    lastNameAr?: string | null
    phoneNumber?: string | null
    mobileNumber?: string | null
    email?: string | null
    country?: string | null
    city?: string | null
    addressLine?: string | null
    employerName?: string | null
    employeeNumber?: string | null
    nationality?: string | null
    employerId?: number | null
    relationType?: RelationType
    isHeadOfFamily?: boolean
    hofId?: number | null
    hasChronicConditions?: boolean
    hasPreexisting?: boolean
    preexistingNotes?: string | null
    eligibilityStatus?: EligibilityStatus
    eligibilityStart?: string | null
    eligibilityEnd?: string | null
    currentPolicyId?: number | null
    currentEnrollmentId?: number | null
    currentCardStatus?: CardStatus
    currentCardVersion?: number | null
}

export interface SubscriberListResponse {
    content: Subscriber[]
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

export interface SubscriberSearchFilters {
    query?: string
    gender?: Gender
    isAlive?: boolean
    ageMin?: number
    ageMax?: number
    hasActivePolicy?: boolean
    hasActiveCard?: boolean
    page?: number
    size?: number
}

export interface FamilyTreeMember {
    id: number
    fullNameEn: string
    fullNameAr: string | null
    relationType: RelationType
    isHeadOfFamily: boolean
    dateOfBirth: [number, number, number] | string | null
    gender: Gender
    nationalId: string
}

export interface FamilyTreeResponse {
    hof: FamilyTreeMember
    dependents: FamilyTreeMember[]
}
