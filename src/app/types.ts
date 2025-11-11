// ICD Types
export interface ICD {
    id: string
    code: string
    nameEn: string
    nameAr: string
    description?: string
    category: string
    parentIcd?: string
    relatedIcds?: string[]
    status: 'active' | 'inactive'
    notes?: string
    createdAt: Date
    updatedAt: Date
}

export interface ICDRelation {
    id: string
    sourceIcdId: string
    targetIcdId: string
    relationType: 'cause_of' | 'complication_of' | 'synonym_of' | 'related_to'
    notes?: string
}

// Procedure Types
export interface Procedure {
    id: string
    code: string
    nameEn: string
    nameAr: string
    description?: string
    category: ProcedureCategory
    specialty: string
    referencePrice: number
    unitOfMeasure: string
    linkedIcds: string[]
    genderRestriction?: 'male' | 'female' | 'both'
    minAge?: number
    maxAge?: number
    status: 'active' | 'inactive'
    createdAt: Date
    updatedAt: Date
}

export type ProcedureCategory = 'surgery' | 'lab' | 'imaging' | 'consultation' | 'therapy' | 'emergency'

// Lookup Types
export interface LookupType {
    id: string
    type: LookupCategory
    code: string
    nameEn: string
    nameAr: string
    description?: string
    active: boolean
    sortOrder?: number
}

export type LookupCategory =
    | 'procedure_category'
    | 'icd_category'
    | 'relation_type'
    | 'specialty'
    | 'unit'
    | 'price_list'
    | 'factor'
    | 'provider_type'
    | 'insurance_degree'
    | 'gender'
    | 'claim_type'
    | 'visit_type'

// Provider Types
export interface Provider {
    id: string
    code: string
    name: string
    type: 'hospital' | 'clinic' | 'lab' | 'pharmacy'
    networkTier: 'preferred' | 'standard' | 'out_of_network'
    specialties: string[]
    active: boolean
}

// Combination Builder Types
export interface CombinationRule {
    id: string
    type: CombinationType
    factors: CombinationFactor[]
    value: number | string | boolean
    isDefault: boolean
    effectiveDate: Date
    expiryDate?: Date
    priority: number
}

export type CombinationType =
    | 'procedure_pricing'
    | 'authorization_rule'
    | 'limit_rule'
    | 'coverage_rule'

export interface CombinationFactor {
    factorType: string
    factorValue: string | string[]
    operator?: 'equals' | 'contains' | 'between' | 'greater_than' | 'less_than'
}

// Price List Types
export interface PriceList {
    id: string
    name: string
    description: string
    effectiveDate: Date
    expiryDate?: Date
    region?: string
    providerType?: string
    active: boolean
}

export interface PriceListItem {
    id: string
    priceListId: string
    procedureId: string
    providerId?: string
    insuranceDegree?: string
    price: number
    minPrice?: number
    maxPrice?: number
    discountPercentage?: number
}

// Navigation Types
export interface NavigationItem {
    id: string
    label: string
    icon?: string
    path?: string
    children?: NavigationItem[]
    badge?: string | number
    expanded?: boolean
}

// Tab Types
export interface TabItem {
    id: string
    title: string
    component: string
    props?: any
    icon?: string
    closable?: boolean
}

// Form Types
export interface FormField {
    name: string
    label: string
    labelAr?: string
    type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'checkbox' | 'radio' | 'textarea'
    placeholder?: string
    required?: boolean
    options?: SelectOption[]
    validation?: any
    gridColumn?: string
}

export interface SelectOption {
    value: string
    label: string
    labelAr?: string
}