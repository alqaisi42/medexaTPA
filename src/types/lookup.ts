export type LookupCategory =
    | 'uoms'
    | 'service-types'
    | 'service-categories'
    | 'provider-types'
    | 'genders'
    | 'facility-levels'
    | 'currencies'
    | 'countries'
    | 'age-groups'
    | 'benefit'

export interface BaseLookupRecord {
    id: string
    code: string
    nameEn: string
    nameAr: string
}

export interface AgeGroupRecord extends BaseLookupRecord {
    minAgeYears: number | null
    maxAgeYears: number | null
    isActive: boolean
    effectiveFrom: string | null
    effectiveTo: string | null
}

export type LookupRecord = BaseLookupRecord | AgeGroupRecord
