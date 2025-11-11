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
