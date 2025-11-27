export interface CaseDefinition {
  id: number
  contractId: number
  caseCode: string
  nameEn: string
  nameAr: string
  benefitId?: number
  benefitNameEn?: string
  categoryId?: number
  categoryNameEn?: string
  procedureId?: number
  icdId?: number
  providerType: string
  visitType: string
  requirePreauth: boolean
  allowExclusive: boolean
  priority: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCaseDefinitionPayload {
  caseCode: string
  nameEn: string
  nameAr: string
  benefitId?: number
  categoryId?: number
  procedureId?: number
  icdId?: number
  providerType: string
  visitType: string
  requirePreauth: boolean
  allowExclusive: boolean
  priority: number
  isActive: boolean
}

export interface UpdateCaseDefinitionPayload {
  nameEn: string
  nameAr: string
  benefitId?: number
  categoryId?: number
  procedureId?: number
  icdId?: number
  providerType: string
  visitType: string
  requirePreauth: boolean
  allowExclusive: boolean
  priority: number
  isActive: boolean
}

export interface CaseDefinitionListResponse {
  success: boolean
  code: number
  message?: string
  data: {
    totalElements: number
    totalPages: number
    first: boolean
    last: boolean
    size: number
    content: CaseDefinition[]
    number: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    numberOfElements: number
    pageable: {
      offset: number
      sort: {
        empty: boolean
        sorted: boolean
        unsorted: boolean
      }
      paged: boolean
      pageSize: number
      pageNumber: number
      unpaged: boolean
    }
    empty: boolean
  }
  errors?: string[]
  timestamp: string
}

export interface CaseDefinitionResponse {
  success: boolean
  code: number
  message?: string
  data: CaseDefinition
  errors?: string[]
  timestamp: string
}

// Enums for dropdown options
export const PROVIDER_TYPES = [
  { value: 'CLINIC', label: 'Clinic' },
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'PHARMACY', label: 'Pharmacy' },
  { value: 'LAB', label: 'Laboratory' },
  { value: 'RADIOLOGY', label: 'Radiology' },
  { value: 'DENTAL', label: 'Dental' },
  { value: 'OPTICAL', label: 'Optical' },
  { value: 'PHYSIOTHERAPY', label: 'Physiotherapy' },
  { value: 'HOME_CARE', label: 'Home Care' }
] as const

export const VISIT_TYPES = [
  { value: 'OUTPATIENT', label: 'Outpatient' },
  { value: 'INPATIENT', label: 'Inpatient' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'DAYCARE', label: 'Day Care' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'FOLLOW_UP', label: 'Follow Up' },
  { value: 'PREVENTIVE', label: 'Preventive' },
  { value: 'DIAGNOSTIC', label: 'Diagnostic' }
] as const

export const CASE_SCOPES = [
  { value: 'benefit', label: 'Benefit' },
  { value: 'category', label: 'Category' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'icd', label: 'ICD' }
] as const
