import { Drug, DrugPayload, PaginatedResponse } from '@/types'

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, '') ?? ''
const API_PREFIX = API_BASE_URL ? '/api/v1' : '/api'
const BASE_PATH = `${API_PREFIX}/drugs`

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

function parseDateTime(value: unknown): string | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return new Date(value * 1000).toISOString()
    }

    if (typeof value === 'string' && value.trim().length > 0) {
        return value
    }

    return null
}

function normalizeDrug(item: Record<string, unknown>): Drug {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        code: String(item['code'] ?? ''),
        genericNameEn: String(item['genericNameEn'] ?? item['generic_name_en'] ?? ''),
        genericNameAr: String(item['genericNameAr'] ?? item['generic_name_ar'] ?? ''),
        brandNameEn: String(item['brandNameEn'] ?? item['brand_name_en'] ?? ''),
        brandNameAr: String(item['brandNameAr'] ?? item['brand_name_ar'] ?? ''),
        atcCode: String(item['atcCode'] ?? item['atc_code'] ?? ''),
        description: String(item['description'] ?? ''),
        isControlled: Boolean(item['isControlled'] ?? item['controlled']),
        isOtc: Boolean(item['isOtc'] ?? item['otc']),
        allowGenericSubstitution: Boolean(item['allowGenericSubstitution'] ?? item['allow_substitution']),
        validFrom: parseDate(item['validFrom']),
        validTo: parseDate(item['validTo']),
        isActive: Boolean(item['isActive'] ?? true),
        createdAt: parseDateTime(item['createdAt']),
        updatedAt: parseDateTime(item['updatedAt']),
        createdBy: String(item['createdBy'] ?? ''),
    }
}

function buildPayload(payload: DrugPayload) {
    return {
        ...payload,
        validFrom: payload.validFrom || null,
        validTo: payload.validTo || null,
    }
}

export interface FetchDrugsParams {
    page?: number
    size?: number
}

export async function fetchDrugs(params: FetchDrugsParams = {}): Promise<PaginatedResponse<Drug>> {
    const { page = 0, size = 10 } = params
    const response = await fetch(buildUrl('', { page, size }), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load drugs')
    }

    const data: PaginatedResponse<Record<string, unknown>> = await response.json()
    return {
        ...data,
        content: Array.isArray(data.content) ? data.content.map((item) => normalizeDrug(item)) : [],
    }
}

export async function getDrugById(id: number): Promise<Drug> {
    const url = buildUrl(`/${id}`)
    const response = await fetch(url, { cache: 'no-store' })

    if (!response.ok) {
        let errorMessage = 'Unable to load drug details'
        try {
            const errorData = await response.json()
            if (errorData && typeof errorData === 'object' && 'message' in errorData) {
                errorMessage = String(errorData.message)
            }
        } catch {
            // If response is not JSON, use status text
            errorMessage = response.statusText || `HTTP ${response.status}: Unable to load drug details`
        }
        throw new Error(errorMessage)
    }

    const payload = await response.json()
    if (payload && typeof payload === 'object') {
        return normalizeDrug(payload as Record<string, unknown>)
    }

    return normalizeDrug({})
}

export async function createDrug(payload: DrugPayload): Promise<Drug> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload(payload)),
    })

    if (!response.ok) {
        throw new Error('Unable to create drug')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizeDrug(body as Record<string, unknown>)
    }

    return normalizeDrug({})
}

export async function updateDrug(id: number, payload: DrugPayload): Promise<Drug> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload(payload)),
    })

    if (!response.ok) {
        throw new Error('Unable to update drug')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizeDrug(body as Record<string, unknown>)
    }

    return normalizeDrug({})
}

export async function deleteDrug(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), { method: 'DELETE' })

    if (!response.ok) {
        throw new Error('Unable to delete drug')
    }
}
