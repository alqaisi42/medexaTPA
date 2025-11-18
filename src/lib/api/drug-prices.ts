import { DrugPrice, DrugPricePayload } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? ''
const API_PREFIX = API_BASE_URL ? '/api/v1' : '/api'
const BASE_PATH = `${API_PREFIX}/drug-prices`

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
    const baseUrl = API_BASE_URL ? `${API_BASE_URL}${finalPath}` : finalPath
    const query = searchParams.toString()

    return query ? `${baseUrl}?${query}` : baseUrl
}

function parseDate(value: unknown): string | null {
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

function normalizeDrugPrice(item: Record<string, unknown>): DrugPrice {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        drugPackId: typeof item['drugPackId'] === 'number' ? item['drugPackId'] : Number(item['drugPackId']) || 0,
        priceListId: typeof item['priceListId'] === 'number' ? item['priceListId'] : Number(item['priceListId']) || 0,
        basePrice: typeof item['basePrice'] === 'number' ? item['basePrice'] : Number(item['basePrice']) || 0,
        pricePerUnit: typeof item['pricePerUnit'] === 'number' ? item['pricePerUnit'] : Number(item['pricePerUnit']) || 0,
        vatPercentage: typeof item['vatPercentage'] === 'number' ? item['vatPercentage'] : Number(item['vatPercentage']) || 0,
        costPrice: typeof item['costPrice'] === 'number' ? item['costPrice'] : Number(item['costPrice']) || null,
        effectiveFrom: parseDate(item['effectiveFrom']),
        effectiveTo: parseDate(item['effectiveTo']),
    }
}

function buildPayload(payload: DrugPricePayload) {
    return {
        ...payload,
        costPrice: payload.costPrice ?? null,
        effectiveFrom: payload.effectiveFrom || null,
        effectiveTo: payload.effectiveTo || null,
    }
}

export async function fetchDrugPricesByPack(drugPackId: number): Promise<DrugPrice[]> {
    const response = await fetch(buildUrl(`/by-pack/${drugPackId}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load prices for pack')
    }

    const data = await response.json()
    if (Array.isArray(data)) {
        return data.map((item) => normalizeDrugPrice(item as Record<string, unknown>))
    }

    return []
}

export async function getActiveDrugPrice(drugPackId: number, priceListId: number): Promise<DrugPrice | null> {
    const response = await fetch(buildUrl('/active', { drugPackId, priceListId }), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load active price')
    }

    const payload = await response.json()
    if (payload && typeof payload === 'object') {
        return normalizeDrugPrice(payload as Record<string, unknown>)
    }

    return null
}

export async function getDrugPriceById(id: number): Promise<DrugPrice> {
    const response = await fetch(buildUrl(`/${id}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load drug price details')
    }

    const payload = await response.json()
    if (payload && typeof payload === 'object') {
        return normalizeDrugPrice(payload as Record<string, unknown>)
    }

    return normalizeDrugPrice({})
}

export async function createDrugPrice(payload: DrugPricePayload): Promise<DrugPrice> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(payload)),
    })

    if (!response.ok) {
        throw new Error('Unable to create price')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizeDrugPrice(body as Record<string, unknown>)
    }

    return normalizeDrugPrice({})
}

export async function updateDrugPrice(id: number, payload: DrugPricePayload): Promise<DrugPrice> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(payload)),
    })

    if (!response.ok) {
        throw new Error('Unable to update price')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizeDrugPrice(body as Record<string, unknown>)
    }

    return normalizeDrugPrice({})
}

export async function deleteDrugPrice(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), { method: 'DELETE' })

    if (!response.ok) {
        throw new Error('Unable to delete price')
    }
}
