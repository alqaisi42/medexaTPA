// Contract Limits Types

export interface AmountLimit {
  id?: number
  scope: LimitScope
  networkScope: NetworkScope
  amount: number
  limitPeriod: LimitPeriod
}

export interface CountLimit {
  id?: number
  scope: LimitScope
  networkScope: NetworkScope
  countLimit: number
  limitPeriod: LimitPeriod
}

export interface FrequencyLimit {
  id?: number
  freqValue: number
  freqUnit: FrequencyUnit
  freqOver?: number | null
  appliesTo: FrequencyAppliesTo
}

export interface CoInsurance {
  id?: number
  networkScope: NetworkScope
  cashScope: CashScope
  deductible: number
  copayPercent: number
  maxCopayVisit?: number | null
  maxCopayClaim?: number | null
  deductibleCopayMin?: number | null
  deductibleCopayMax?: number | null
}

export interface LimitCombination {
  id?: number
  contractId: number
  regionId?: number | null
  subscriberTypeId?: number | null
  subscriberId?: number | null
  claimTypeId?: number | null
  serviceTypeId?: number | null
  mpTypeId?: number | null
  networkId?: number | null
  insuranceDegree?: string | null
  coverageType?: string | null
  icdBasketId?: number | null
  icdId?: number | null
  hcpcsBasketId?: number | null
  procedureId?: number | null
  drugBasketId?: number | null
  drugId?: number | null
  doctorSpecialtyId?: number | null
  description?: string | null
  priority: number
  amounts?: AmountLimit[]
  counts?: CountLimit[]
  frequencies?: FrequencyLimit[]
  coInsurances?: CoInsurance[]
}

export interface LimitCombinationPayload {
  regionId?: number | null
  subscriberTypeId?: number | null
  subscriberId?: number | null
  claimTypeId?: number | null
  serviceTypeId?: number | null
  mpTypeId?: number | null
  networkId?: number | null
  insuranceDegree?: string | null
  coverageType?: string | null
  icdBasketId?: number | null
  icdId?: number | null
  hcpcsBasketId?: number | null
  procedureId?: number | null
  drugBasketId?: number | null
  drugId?: number | null
  doctorSpecialtyId?: number | null
  description?: string | null
  priority: number
  amounts?: AmountLimit[]
  counts?: CountLimit[]
  frequencies?: FrequencyLimit[]
  coInsurances?: CoInsurance[]
}

export interface LimitCombinationListResponse {
  content: LimitCombination[]
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

// Enums
export enum LimitScope {
  GROUP_CONTRACT = 'GROUP_CONTRACT',
  INDIVIDUAL_CONTRACT = 'INDIVIDUAL_CONTRACT',
  INDIVIDUAL_CASE = 'INDIVIDUAL_CASE',
  INDIVIDUAL_VISIT = 'INDIVIDUAL_VISIT',
  INDIVIDUAL_CLAIM = 'INDIVIDUAL_CLAIM',
  VISIT = 'VISIT',
  CLAIM = 'CLAIM'
}

export enum NetworkScope {
  IN = 'IN',
  OUT = 'OUT',
  IN_OUT = 'IN_OUT'
}

export enum LimitPeriod {
  PER_YEAR = 'PER_YEAR',
  PER_CASE = 'PER_CASE',
  PER_VISIT = 'PER_VISIT',
  PER_CLAIM = 'PER_CLAIM',
  PER_MONTH = 'PER_MONTH',
  PER_DAY = 'PER_DAY'
}

export enum FrequencyUnit {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR'
}

export enum FrequencyAppliesTo {
  VISIT = 'VISIT',
  CLAIM = 'CLAIM',
  SERVICE = 'SERVICE'
}

export enum CashScope {
  CASH = 'CASH',
  NON_CASH = 'NON_CASH',
  BOTH = 'BOTH'
}

export enum InsuranceDegree {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  THIRD = 'THIRD'
}

// Filter interfaces
export interface LimitCombinationFilters {
  regionId?: number
  subscriberTypeId?: number
  networkId?: number
  claimTypeId?: number
  serviceTypeId?: number
  icdBasketId?: number
  drugBasketId?: number
  doctorSpecialtyId?: number
  priorityMin?: number
  priorityMax?: number
  page?: number
  size?: number
}

// Advanced Coverage Conditions (Tab 6)
export interface AdvancedCoverageCondition {
  id?: number
  contractId: number
  regionId?: number | null
  insuranceDegree?: InsuranceDegree | null
  subscriberTypeId?: number | null
  subscriberOldNew?: 'OLD' | 'NEW' | null
  serviceTypeId?: number | null
  claimTypeId?: number | null
  mpTypeId?: number | null
  providerId?: number | null
  icdBasketId?: number | null
  procedureId?: number | null
  drugBasketId?: number | null
  doctorSpecialtyId?: number | null
  overrideLimitAmount?: number | null
  overrideCopayPercent?: number | null
  overrideFrequency?: string | null // JSON string
  priority: number
  isActive?: boolean
}

// Linked Combinations (Tab 7)
export interface LinkedCombination {
  id?: number
  parentCombinationId: number
  childCombinationId: number
  contractId: number
  linkType?: string | null
  description?: string | null
}

// Lookup types for dropdowns
export interface Region {
  id: number
  code: string
  nameEn: string
  nameAr?: string
}

export interface SubscriberType {
  id: number
  code: string
  nameEn: string
  nameAr?: string
}

export interface ClaimType {
  id: number
  code: string
  nameEn: string
  nameAr?: string
}

export interface ServiceType {
  id: number
  code: string
  nameEn: string
  nameAr?: string
}

export interface MPType {
  id: number
  code: string
  nameEn: string
  nameAr?: string
}

export interface ICDBasket {
  id: number
  code: string
  nameEn: string
  nameAr?: string
}

export interface DrugBasket {
  id: number
  code: string
  nameEn: string
  nameAr?: string
}

export interface DoctorSpecialty {
  id: number
  code: string
  nameEn: string
  nameAr?: string
}
