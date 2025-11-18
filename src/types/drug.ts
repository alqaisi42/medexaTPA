export interface Drug {
    id: number
    code: string
    genericNameEn: string
    genericNameAr: string
    brandNameEn: string
    brandNameAr: string
    atcCode: string
    description: string
    isControlled: boolean
    isOtc: boolean
    allowGenericSubstitution: boolean
    validFrom: string | null
    validTo: string | null
    isActive: boolean
    createdAt: string | null
    updatedAt: string | null
    createdBy: string
}

export interface DrugPayload {
    code: string
    genericNameEn: string
    genericNameAr: string
    brandNameEn: string
    brandNameAr: string
    atcCode: string
    description: string
    isControlled: boolean
    isOtc: boolean
    allowGenericSubstitution: boolean
    validFrom: string | null
    validTo: string | null
    isActive: boolean
}
