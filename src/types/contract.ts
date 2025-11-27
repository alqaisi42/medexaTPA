export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'SUSPENDED'

export interface ContractPlan {
    id?: number
    contractId?: number
    planCode: string
    nameEn: string
    nameAr?: string | null
    annualLimitPerMember: number
    annualLimitPerFamily: number
    lifetimeLimitPerMember?: number | null
    isActive: boolean
}

export interface Contract {
    id: number
    contractNumber: string
    payerId: number
    corporateId: number
    tpaBranchId?: number | null
    startDate: [number, number, number] | string // [year, month, day] or ISO string
    endDate: [number, number, number] | string // [year, month, day] or ISO string
    renewalDate?: [number, number, number] | string | null
    currencyCode: string
    totalPremium?: number | null
    status: ContractStatus
    terminationReason?: string | null
    plans: ContractPlan[]
}

export interface ContractPayload {
    contractNumber: string
    payerId: number
    corporateId: number
    tpaBranchId?: number | null
    startDate: string // ISO date string
    endDate: string // ISO date string
    renewalDate?: string | null
    currencyCode: string
    totalPremium?: number | null
    status: ContractStatus
    createdBy?: number | null
    plans: ContractPlan[]
}

export interface ContractUpdatePayload {
    startDate?: string
    endDate?: string
    renewalDate?: string | null
    status?: ContractStatus
    totalPremium?: number | null
    terminationReason?: string | null
}

export interface ContractListResponse {
    success: boolean
    code: number
    data: {
        content: Contract[]
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

export interface ContractResponse {
    success: boolean
    code: number
    message?: string
    data: Contract
    errors?: string[]
    timestamp: string | number
}

export interface ContractPlansResponse {
    success: boolean
    code: number
    data: {
        content: ContractPlan[]
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

export interface ContractSearchFilters {
    payerId?: number
    corporateId?: number
    contractNumber?: string
    status?: ContractStatus
    startDateFrom?: string
    startDateTo?: string
    endDateFrom?: string
    endDateTo?: string
    page?: number
    size?: number
    sortBy?: string
    sortDirection?: 'ASC' | 'DESC'
}
