export interface DrugPriceList {
    id: number
    code: string
    nameEn: string
    nameAr: string
    currency: string
    isDefault: boolean
    validFrom: string | null
    validTo: string | null
}

export interface DrugPriceListPayload {
    code: string
    nameEn: string
    nameAr: string
    currency: string
    isDefault: boolean
    validFrom: string | null
    validTo: string | null
}

export interface DrugPrice {
    id: number
    drugPackId: number
    priceListId: number
    basePrice: number
    pricePerUnit: number
    vatPercentage: number
    costPrice: number | null
    effectiveFrom: string | null
    effectiveTo: string | null
}

export interface DrugPricePayload {
    drugPackId: number
    priceListId: number
    basePrice: number
    pricePerUnit: number
    vatPercentage: number
    costPrice: number | null
    effectiveFrom: string | null
    effectiveTo: string | null
}
