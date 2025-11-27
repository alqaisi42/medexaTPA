export interface PricingPolicy {
  id: number
  contractId: number
  serviceCategoryId: number
  serviceCategoryNameEn: string
  localNetworkPricingModel: string
  localNetworkPriceBasis: string
  cashPricingModel: string | null
  coinsuranceMethod: string
  createdAt: number
}

export interface CreatePricingPolicyPayload {
  serviceCategoryId: number
  localNetworkPricingModel: string
  localNetworkPriceBasis: string
  cashPricingModel?: string
  coinsuranceMethod: string
}

export interface UpdatePricingPolicyPayload {
  serviceCategoryId: number
  localNetworkPricingModel: string
  localNetworkPriceBasis: string
  cashPricingModel: string
  coinsuranceMethod: string
}

export interface PricingPolicyListResponse {
  success: boolean
  code: number
  data: {
    content: PricingPolicy[]
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

export interface PricingPolicyResponse {
  success: boolean
  code: number
  message?: string
  data: PricingPolicy
  errors?: string[]
  timestamp: string
}

// Enums for dropdown options
export const LOCAL_NETWORK_PRICING_MODELS = [
  { value: 'FIXED_PRICE', label: 'Fixed Price' },
  { value: 'LIST_PRICE_MINUS_DISCOUNT', label: 'List Price Minus Discount' },
  { value: 'LOWER_OF_COST_OR_LIST', label: 'Lower of Cost or List' },
  { value: 'PERCENTAGE_OF_BILLED', label: 'Percentage of Billed' }
] as const

export const LOCAL_NETWORK_PRICE_BASIS = [
  { value: 'MIN_MARKET_PRICE', label: 'Min Market Price' },
  { value: 'Pub_Price', label: 'Published Price' },
  { value: 'NEGOTIATED_RATE', label: 'Negotiated Rate' },
  { value: 'STANDARD_RATE', label: 'Standard Rate' }
] as const

export const CASH_PRICING_MODELS = [
  { value: 'UP_TO_LIMIT', label: 'Up to Limit' },
  { value: 'FIXED_AMOUNT', label: 'Fixed Amount' },
  { value: 'PERCENTAGE_OF_BILLED', label: 'Percentage of Billed' },
  { value: 'NO_COVERAGE', label: 'No Coverage' }
] as const

export const COINSURANCE_METHODS = [
  { value: 'DEDUCT_THEN_CALC', label: 'Deduct Then Calculate' },
  { value: 'PERCENTAGE_THEN_DEDUCTIBLE', label: 'Percentage Then Deductible' },
  { value: 'CALC_THEN_DEDUCT', label: 'Calculate Then Deduct' },
  { value: 'NO_COINSURANCE', label: 'No Coinsurance' }
] as const
