export interface SubmissionRule {
  id: number
  contractId: number
  ruleType: string | null
  benefitId: number | null
  benefitNameEn: string | null
  categoryId: number | null
  categoryNameEn: string | null
  procedureId: number | null
  icdId: number | null
  drugId: number | null
  appliesToInNetwork: boolean
  appliesToOutNetwork: boolean
  appliesToCash: boolean
  requirePreauth: boolean
  waitDays: number
  maxVisitsPerYear: number | null
  maxAmountPerYear: number | null
  hardBlock: boolean
  notes: string | null
  createdAt: number
}

export interface CreateSubmissionRulePayload {
  ruleType: string
  benefitId?: number
  categoryId?: number
  procedureId?: number
  icdId?: number
  drugId?: number
  appliesToInNetwork: boolean
  appliesToOutNetwork: boolean
  appliesToCash: boolean
  requirePreauth: boolean
  waitDays: number
  maxVisitsPerYear?: number
  maxAmountPerYear?: number
  hardBlock: boolean
  notes?: string
}

export interface UpdateSubmissionRulePayload {
  appliesToInNetwork: boolean
  appliesToOutNetwork: boolean
  appliesToCash: boolean
  requirePreauth: boolean
  waitDays: number
  maxVisitsPerYear?: number
  maxAmountPerYear?: number
  hardBlock: boolean
  notes?: string
}

export interface SubmissionRuleListResponse {
  success: boolean
  code: number
  data: {
    content: SubmissionRule[]
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

export interface SubmissionRuleResponse {
  success: boolean
  code: number
  message?: string
  data: SubmissionRule
  errors?: string[]
  timestamp: string
}

// Enums for dropdown options
export const RULE_TYPES = [
  { value: 'BENEFIT', label: 'Benefit' },
  { value: 'CATEGORY', label: 'Category' },
  { value: 'PROCEDURE', label: 'Procedure' },
  { value: 'ICD', label: 'ICD' },
  { value: 'DRUG', label: 'Drug' }
] as const

export const RULE_SCOPES = [
  { value: 'benefit', label: 'Benefit' },
  { value: 'category', label: 'Category' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'icd', label: 'ICD' },
  { value: 'drug', label: 'Drug' }
] as const
