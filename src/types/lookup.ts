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
