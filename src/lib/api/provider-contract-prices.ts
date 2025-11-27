import {
    ProviderContractPrice,
    ProviderContractPriceListResponse,
    ProviderContractPricePayload,
    ProviderContractPriceSearchFilters,
    ProviderContractPriceUpdatePayload,
} from '@/types/provider-contract-price'

const BASE_PATH = '/api/provider-contract-prices'

function buildUrl(path: string = '', params?: Record<string, string | number | boolean | null | undefined>) {
    const searchParams = new URLSearchParams()

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                return
            }
            searchParams.set(key, String(value))
        })
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const finalPath = `${BASE_PATH}${normalizedPath === '/' ? '' : normalizedPath}`
    const query = searchParams.toString()

    return query ? `${finalPath}?${query}` : finalPath
}

function parseDateArray(value: unknown): string | null {
    if (Array.isArray(value) && value.length >= 3) {
        const [year, month, day] = value
        if (typeof year === 'number' && typeof month === 'number' && typeof day === 'number') {
            const monthString = `${month}`.padStart(2, '0')
            const dayString = `${day}`.padStart(2, '0')
            return `${year}-${monthString}-${dayString}`
        }
    }
    if (typeof value === 'string' && value.trim().length > 0) {
        return value.slice(0, 10)
    }
    return null
}

function parseTimestampArray(value: unknown): number[] | null {
    if (Array.isArray(value) && value.length >= 3) {
        return value.map((v) => (typeof v === 'number' ? v : Number(v) || 0))
    }
    return null
}

function normalizeProviderContractPrice(item: Record<string, unknown>): ProviderContractPrice {
    // Extract procedure info from nested object if available
    const procedureObj = item['procedure'] as Record<string, unknown> | undefined
    const procedureId = typeof item['procedureId'] === 'number' ? item['procedureId'] : Number(item['procedureId']) || 0
    
    // Build procedure info from nested object or fallback to flat fields
    let procedure: ProviderContractPrice['procedure'] | undefined
    if (procedureObj && typeof procedureObj === 'object') {
        procedure = {
            id: typeof procedureObj['id'] === 'number' ? procedureObj['id'] : Number(procedureObj['id']) || procedureId,
            code: procedureObj['code'] ? String(procedureObj['code']) : '',
            nameEn: procedureObj['nameEn'] ? String(procedureObj['nameEn']) : '',
            nameAr: procedureObj['nameAr'] ? String(procedureObj['nameAr']) : undefined,
        }
    }

    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        providerId: typeof item['providerId'] === 'number' ? item['providerId'] : Number(item['providerId']) || 0,
        procedureId,
        price: typeof item['price'] === 'number' ? item['price'] : Number(item['price']) || 0,
        pricingMethod: String(item['pricingMethod'] ?? 'FIXED'),
        pointValue: item['pointValue'] !== null && item['pointValue'] !== undefined ? Number(item['pointValue']) : null,
        minPrice: item['minPrice'] !== null && item['minPrice'] !== undefined ? Number(item['minPrice']) : null,
        maxPrice: item['maxPrice'] !== null && item['maxPrice'] !== undefined ? Number(item['maxPrice']) : null,
        copayPercent: item['copayPercent'] !== null && item['copayPercent'] !== undefined ? Number(item['copayPercent']) : null,
        copayFixed: item['copayFixed'] !== null && item['copayFixed'] !== undefined ? Number(item['copayFixed']) : null,
        deductible: typeof item['deductible'] === 'number' ? item['deductible'] : Number(item['deductible']) || 0,
        priceListId: item['priceListId'] !== null && item['priceListId'] !== undefined ? Number(item['priceListId']) : null,
        effectiveFrom: parseTimestampArray(item['effectiveFrom']) || parseDateArray(item['effectiveFrom']),
        effectiveTo: parseTimestampArray(item['effectiveTo']) || parseDateArray(item['effectiveTo']),
        notes: item['notes'] ? String(item['notes']) : null,
        createdAt: parseTimestampArray(item['createdAt']) || parseDateArray(item['createdAt']),
        updatedAt: parseTimestampArray(item['updatedAt']) || parseDateArray(item['updatedAt']),
        procedure,
        // Fallback fields for backward compatibility
        procedureCode: procedure?.code || (item['procedureCode'] ? String(item['procedureCode']) : undefined),
        procedureName: procedure?.nameEn || (item['procedureName'] ? String(item['procedureName']) : undefined),
        procedureNameAr: procedure?.nameAr || (item['procedureNameAr'] ? String(item['procedureNameAr']) : undefined),
        procedureCategoryId: item['procedureCategoryId'] ? Number(item['procedureCategoryId']) : undefined,
        procedureCategoryName: item['procedureCategoryName'] ? String(item['procedureCategoryName']) : undefined,
        specialtyId: item['specialtyId'] ? Number(item['specialtyId']) : undefined,
        specialtyName: item['specialtyName'] ? String(item['specialtyName']) : undefined,
    }
}

export async function fetchProviderContractPrices(
    filters: ProviderContractPriceSearchFilters = {},
): Promise<ProviderContractPriceListResponse> {
    const { page = 0, size = 20, ...restFilters } = filters
    const params: Record<string, string | number> = { page, size }

    if (restFilters.providerId) params.providerId = restFilters.providerId
    if (restFilters.contractId) params.contractId = restFilters.contractId
    if (restFilters.procedureId) params.procedureId = restFilters.procedureId
    if (restFilters.procedureCategoryId) params.procedureCategoryId = restFilters.procedureCategoryId
    if (restFilters.pricingMethod) params.pricingMethod = restFilters.pricingMethod
    if (restFilters.specialtyId) params.specialtyId = restFilters.specialtyId
    if (restFilters.effectiveDate) params.effectiveDate = restFilters.effectiveDate

    const response = await fetch(buildUrl('', params), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load provider contract prices')
    }

    const data = await response.json() as { content: unknown[] } & Omit<ProviderContractPriceListResponse, 'content'>
    return {
        ...data,
        content: data.content.map((item) => normalizeProviderContractPrice(item as Record<string, unknown>)),
    }
}

export async function fetchProviderContractPrice(id: number): Promise<ProviderContractPrice> {
    const response = await fetch(buildUrl(`/${id}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load provider contract price')
    }

    const data = await response.json()
    return normalizeProviderContractPrice(data)
}

export async function createProviderContractPrice(payload: ProviderContractPricePayload): Promise<ProviderContractPrice> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to create provider contract price')
    }

    const data = await response.json()
    return normalizeProviderContractPrice(data)
}

export async function updateProviderContractPrice(
    id: number,
    payload: ProviderContractPriceUpdatePayload,
): Promise<ProviderContractPrice> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to update provider contract price')
    }

    const data = await response.json()
    return normalizeProviderContractPrice(data)
}

export async function deleteProviderContractPrice(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to delete provider contract price')
    }
}

