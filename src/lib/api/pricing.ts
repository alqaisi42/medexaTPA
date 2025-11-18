import {
    CreatePeriodDiscountPayload,
    CreatePointRatePayload,
    CreatePricingRulePayload,
    PaginatedResponse,
    PeriodDiscountRecord,
    PointRateRecord,
    PriceListSummary,
    PricingCalculationRequest,
    PricingCalculationResponse,
    PricingFactor,
    PricingRuleResponse,
    UpdatePointRatePayload,
} from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_PRICING_API_BASE_URL?.replace(/\/$/, '')
    ?? process.env.API_BASE_URL?.replace(/\/$/, '')
    ?? ''

function buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>,
) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const base = API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath

    if (!params) {
        return base
    }

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return
        }
        searchParams.append(key, String(value))
    })

    const query = searchParams.toString()
    return query ? `${base}?${query}` : base
}

async function requestJson<T>(
    url: string,
    init: RequestInit,
    errorMessage: string,
): Promise<T> {
    const response = await fetch(url, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init.headers ?? {}),
        },
    })

    if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(text || errorMessage)
    }

    if (response.status === 204) {
        return undefined as unknown as T
    }

    return response.json() as Promise<T>
}

export interface FetchPricingFactorsParams {
    page?: number
    size?: number
}

export async function fetchPricingFactors({
    page = 0,
    size = 100,
}: FetchPricingFactorsParams = {}): Promise<PaginatedResponse<PricingFactor>> {
    const url = buildUrl('/api/pricing/pricing-factors', { page, size })
    return requestJson<PaginatedResponse<PricingFactor>>(url, { method: 'GET' }, 'Failed to load pricing factors')
}

export interface FetchPriceListsParams {
    page?: number
    size?: number
    code?: string
    providerType?: string
    nameEn?: string
}

export async function fetchPriceLists({
    page = 0,
    size = 20,
    code,
    providerType,
    nameEn,
}: FetchPriceListsParams = {}): Promise<PaginatedResponse<PriceListSummary>> {
    const url = buildUrl('/api/pricing/price-lists', {
        page,
        size,
        code,
        providerType,
        nameEn,
    })

    return requestJson<PaginatedResponse<PriceListSummary>>(url, { method: 'GET' }, 'Failed to load price lists')
}

export interface CreatePricingFactorPayload {
    key: string
    nameEn: string
    nameAr?: string
    dataType: string
    allowedValues?: unknown
}

export async function createPricingFactor(
    payload: CreatePricingFactorPayload
): Promise<PricingFactor> {
    const url = buildUrl('/api/pricing/pricing-factors')
    return requestJson<PricingFactor>(
        url,
        {
            method: 'POST',
            body: JSON.stringify(payload),
        },
        'Failed to create pricing factor'
    )
}


export interface FetchPointRatesParams {
    page?: number
    size?: number
    priceListId?: number
    insuranceDegreeId?: number
    validOn?: string
}

export async function fetchPointRates({
    page = 0,
    size = 20,
    priceListId,
    insuranceDegreeId,
    validOn,
}: FetchPointRatesParams = {}): Promise<PaginatedResponse<PointRateRecord>> {
    const url = buildUrl('/api/point-rates', {
        page,
        size,
        priceListId,
        insuranceDegreeId,
        validOn,
    })

    return requestJson<PaginatedResponse<PointRateRecord>>(url, { method: 'GET' }, 'Failed to load point rates')
}

export async function createPointRate(payload: CreatePointRatePayload): Promise<PointRateRecord> {
    const url = buildUrl('/api/point-rates')
    return requestJson<PointRateRecord>(
        url,
        {
            method: 'POST',
            body: JSON.stringify(payload),
        },
        'Failed to create point rate',
    )
}

export async function updatePointRate(id: number, payload: UpdatePointRatePayload): Promise<PointRateRecord> {
    const url = buildUrl(`/api/point-rates/${id}`)
    return requestJson<PointRateRecord>(
        url,
        {
            method: 'PATCH',
            body: JSON.stringify(payload),
        },
        'Failed to update point rate',
    )
}

export interface FetchPricingRulesParams {
    page?: number
    size?: number
    procedureId?: number
    priceListId?: number
}

export async function fetchPricingRules({
    page = 0,
    size = 20,
    procedureId,
    priceListId,
}: FetchPricingRulesParams = {}): Promise<PaginatedResponse<PricingRuleResponse>> {
    const url = buildUrl('/api/pricing/rules', {
        page,
        size,
        procedureId,
        priceListId,
    })

    return requestJson<PaginatedResponse<PricingRuleResponse>>(url, { method: 'GET' }, 'Failed to load pricing rules')
}

export async function createPricingRule(payload: CreatePricingRulePayload): Promise<PricingRuleResponse> {
    const url = buildUrl('/api/pricing/rules')
    return requestJson<PricingRuleResponse>(
        url,
        {
            method: 'POST',
            body: JSON.stringify(payload),
        },
        'Failed to create pricing rule',
    )
}

export interface FetchPeriodDiscountsParams {
    page?: number
    size?: number
    procedureId?: number
    priceListId?: number
}

export async function fetchPeriodDiscounts({
    page = 0,
    size = 20,
    procedureId,
    priceListId,
}: FetchPeriodDiscountsParams = {}): Promise<PaginatedResponse<PeriodDiscountRecord>> {
    const url = buildUrl('/api/pricing/period-discounts', {
        page,
        size,
        procedureId,
        priceListId,
    })

    return requestJson<PaginatedResponse<PeriodDiscountRecord>>(url, { method: 'GET' }, 'Failed to load period discounts')
}

export async function createPeriodDiscount(payload: CreatePeriodDiscountPayload): Promise<PeriodDiscountRecord> {
    const url = buildUrl('/api/pricing/period-discounts')
    return requestJson<PeriodDiscountRecord>(
        url,
        {
            method: 'POST',
            body: JSON.stringify(payload),
        },
        'Failed to create period discount',
    )
}

export async function calculatePricing(payload: PricingCalculationRequest): Promise<PricingCalculationResponse> {
    const url = buildUrl('/api/pricing/calculate')
    return requestJson<PricingCalculationResponse>(
        url,
        {
            method: 'POST',
            body: JSON.stringify(payload),
        },
        'Failed to calculate pricing',
    )
}

