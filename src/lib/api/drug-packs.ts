import { DrugForm, DrugFormPackStructure, DrugPack, DrugPackPayload } from '@/types'

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, '') ?? ''
const API_PREFIX = API_BASE_URL ? '/api/v1' : '/api'
const BASE_PATH = `${API_PREFIX}/drug-packs`

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

function normalizeDrugPack(item: Record<string, unknown>): DrugPack {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        drugFormId: typeof item['drugFormId'] === 'number' ? item['drugFormId'] : Number(item['drugFormId']) || 0,
        packCode: String(item['packCode'] ?? ''),
        unitOfMeasure: String(item['unitOfMeasure'] ?? ''),
        unitsPerPack: typeof item['unitsPerPack'] === 'number' ? item['unitsPerPack'] : Number(item['unitsPerPack']) || 0,
        minDispenseQuantity:
            typeof item['minDispenseQuantity'] === 'number' ? item['minDispenseQuantity'] : Number(item['minDispenseQuantity']) || 0,
        maxDispenseQuantity:
            typeof item['maxDispenseQuantity'] === 'number' ? item['maxDispenseQuantity'] : Number(item['maxDispenseQuantity']) || 0,
        isSplitAllowed: Boolean(item['isSplitAllowed'] ?? false),
        validFrom: parseDate(item['validFrom']),
        validTo: parseDate(item['validTo']),
        isActive: Boolean(item['isActive'] ?? true),
    }
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

function buildPayload(payload: DrugPackPayload) {
    return {
        ...payload,
        validFrom: payload.validFrom || null,
        validTo: payload.validTo || null,
    }
}

export async function fetchDrugPacksByForm(drugFormId: number): Promise<DrugPack[]> {
    const response = await fetch(buildUrl(`/by-form/${drugFormId}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load drug packs')
    }

    const data = await response.json()
    if (Array.isArray(data)) {
        return data.map((item) => normalizeDrugPack(item as Record<string, unknown>))
    }

    return []
}

export async function fetchDrugPacksByDrug(drugId: number): Promise<DrugPack[]> {
    const response = await fetch(buildUrl(`/by-drug/${drugId}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load drug packs for drug')
    }

    const data = await response.json()
    if (Array.isArray(data)) {
        return data.map((item) => normalizeDrugPack(item as Record<string, unknown>))
    }

    return []
}

export async function fetchPackStructureByDrug(drugId: number): Promise<DrugFormPackStructure[]> {
    const response = await fetch(buildUrl(`/structure/by-drug/${drugId}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load drug pack structure')
    }

    const data = await response.json()
    if (Array.isArray(data)) {
        return data.map((item) => ({
            form: normalizeDrugForm((item as Record<string, unknown>)['form'] as Record<string, unknown>),
            packs: Array.isArray((item as Record<string, unknown>)['packs'])
                ? ((item as Record<string, unknown>)['packs'] as Record<string, unknown>[]).map((pack) =>
                      normalizeDrugPack(pack),
                  )
                : [],
        }))
    }

    return []
}

export async function getDrugPackById(id: number): Promise<DrugPack> {
    const url = buildUrl(`/${id}`)
    const response = await fetch(url, { cache: 'no-store' })

    if (!response.ok) {
        let errorMessage = 'Unable to load drug pack details'
        try {
            const errorData = await response.json()
            if (errorData && typeof errorData === 'object' && 'message' in errorData) {
                errorMessage = String(errorData.message)
            }
        } catch {
            // If response is not JSON, use status text
            errorMessage = response.statusText || `HTTP ${response.status}: Unable to load drug pack details`
        }
        throw new Error(errorMessage)
    }

    const payload = await response.json()
    if (payload && typeof payload === 'object') {
        return normalizeDrugPack(payload as Record<string, unknown>)
    }

    return normalizeDrugPack({})
}

export async function createDrugPack(payload: DrugPackPayload): Promise<DrugPack> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload(payload)),
    })

    if (!response.ok) {
        throw new Error('Unable to create drug pack')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizeDrugPack(body as Record<string, unknown>)
    }

    return normalizeDrugPack({})
}

export async function updateDrugPack(id: number, payload: DrugPackPayload): Promise<DrugPack> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload(payload)),
    })

    if (!response.ok) {
        throw new Error('Unable to update drug pack')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizeDrugPack(body as Record<string, unknown>)
    }

    return normalizeDrugPack({})
}

export async function deleteDrugPack(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), { method: 'DELETE' })

    if (!response.ok) {
        throw new Error('Unable to delete drug pack')
    }
}
