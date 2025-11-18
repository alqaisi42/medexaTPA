import { DrugForm, DrugFormPayload } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? ''
const API_PREFIX = API_BASE_URL ? '/api/v1' : '/api'
const BASE_PATH = `${API_PREFIX}/drug-forms`

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

function normalizeDrugForm(item: Record<string, unknown>): DrugForm {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        drugId: typeof item['drugId'] === 'number' ? item['drugId'] : Number(item['drugId']) || 0,
        dosageForm: String(item['dosageForm'] ?? ''),
        route: String(item['route'] ?? ''),
        strengthValue: typeof item['strengthValue'] === 'number' ? item['strengthValue'] : Number(item['strengthValue']) || 0,
        strengthUnit: String(item['strengthUnit'] ?? ''),
        isDefaultForm: Boolean(item['isDefaultForm'] ?? false),
        validFrom: parseDate(item['validFrom']),
        validTo: parseDate(item['validTo']),
        isActive: Boolean(item['isActive'] ?? true),
    }
}

function buildPayload(payload: DrugFormPayload) {
    return {
        ...payload,
        validFrom: payload.validFrom || null,
        validTo: payload.validTo || null,
    }
}

export async function fetchDrugForms(drugId: number): Promise<DrugForm[]> {
    const response = await fetch(buildUrl('', { drugId }), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load drug forms')
    }

    const data = await response.json()
    if (Array.isArray(data)) {
        return data.map((item) => normalizeDrugForm(item as Record<string, unknown>))
    }

    return []
}

export async function getDrugFormById(id: number): Promise<DrugForm> {
    const response = await fetch(buildUrl(`/${id}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load drug form details')
    }

    const payload = await response.json()
    if (payload && typeof payload === 'object') {
        return normalizeDrugForm(payload as Record<string, unknown>)
    }

    return normalizeDrugForm({})
}

export async function createDrugForm(payload: DrugFormPayload): Promise<DrugForm> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload(payload)),
    })

    if (!response.ok) {
        throw new Error('Unable to create drug form')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizeDrugForm(body as Record<string, unknown>)
    }

    return normalizeDrugForm({})
}

export async function updateDrugForm(id: number, payload: DrugFormPayload): Promise<DrugForm> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload(payload)),
    })

    if (!response.ok) {
        throw new Error('Unable to update drug form')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizeDrugForm(body as Record<string, unknown>)
    }

    return normalizeDrugForm({})
}

export async function deleteDrugForm(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), { method: 'DELETE' })

    if (!response.ok) {
        throw new Error('Unable to delete drug form')
    }
}
