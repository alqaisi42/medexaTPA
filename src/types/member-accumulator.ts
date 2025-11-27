export interface MemberAccumulator {
  id: number
  enrollmentId: number
  planId: number
  benefitId: number
  benefitNameEn: string
  usageYear: number
  usedAmount: number
  usedVisits: number
  lastUpdated: number
}

export interface MemberAccumulatorWithLimits extends MemberAccumulator {
  planNameEn?: string
  limitAmount?: number
  limitVisits?: number
  remainingAmount?: number
  remainingVisits?: number
}

export interface ApplyUsagePayload {
  planId: number
  benefitId: number
  amountDelta: number
  visitsDelta: number
  serviceDate: string
}

export interface MemberAccumulatorListResponse {
  success: boolean
  code: number
  data: {
    content: MemberAccumulator[]
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

export interface MemberAccumulatorResponse {
  success: boolean
  code: number
  data: MemberAccumulator
  timestamp: number
}

export interface ApplyUsageResponse {
  success: boolean
  code: number
  message?: string
  data: MemberAccumulator
  errors?: string[]
  timestamp: string
}

export interface AccumulatorSearchParams {
  enrollmentId: number
  year: number
  planId?: number
  page?: number
  size?: number
}

export interface SingleAccumulatorParams {
  enrollmentId: number
  planId: number
  benefitId: number
  year: number
}
