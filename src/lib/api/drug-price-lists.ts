import { DrugPriceList, DrugPriceListPayload } from '@/types'

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, '') ?? ''
const API_PREFIX = API_BASE_URL ? '/api/v1' : '/api'
const BASE_PATH = `${API_PREFIX}/drug-price-lists`

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

function normalizePriceList(item: Record<string, unknown>): DrugPriceList {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        code: String(item['code'] ?? ''),
        nameEn: String(item['nameEn'] ?? ''),
        nameAr: String(item['nameAr'] ?? ''),
        currency: String(item['currency'] ?? ''),
        isDefault: Boolean(item['isDefault'] ?? false),
        validFrom: parseDate(item['validFrom']),
        validTo: parseDate(item['validTo']),
    }
}

function buildPayload(payload: DrugPriceListPayload) {
    return {
        ...payload,
        validFrom: payload.validFrom || null,
        validTo: payload.validTo || null,
    }
}

export async function fetchDrugPriceLists(): Promise<DrugPriceList[]> {
    const response = await fetch(buildUrl())

    if (!response.ok) {
        throw new Error('Unable to load price lists')
    }

    const data = await response.json()
    if (Array.isArray(data)) {
        return data.map((item) => normalizePriceList(item as Record<string, unknown>))
    }

    return []
}

export async function getDrugPriceListById(id: number): Promise<DrugPriceList> {
    const response = await fetch(buildUrl(`/${id}`))

    if (!response.ok) {
        throw new Error('Unable to load price list details')
    }

    const payload = await response.json()
    if (payload && typeof payload === 'object') {
        return normalizePriceList(payload as Record<string, unknown>)
    }

    return normalizePriceList({})
}

export async function createDrugPriceList(payload: DrugPriceListPayload): Promise<DrugPriceList> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(payload)),
    })

    if (!response.ok) {
        throw new Error('Unable to create price list')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizePriceList(body as Record<string, unknown>)
    }

    return normalizePriceList({})
}

export async function updateDrugPriceList(id: number, payload: DrugPriceListPayload): Promise<DrugPriceList> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(payload)),
    })

    if (!response.ok) {
        throw new Error('Unable to update price list')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizePriceList(body as Record<string, unknown>)
    }

    return normalizePriceList({})
}

export async function deleteDrugPriceList(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), { method: 'DELETE' })

    if (!response.ok) {
        throw new Error('Unable to delete price list')
    }
}
