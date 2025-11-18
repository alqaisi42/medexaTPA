import { DrugCategoryAssignment } from '@/types'

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, '') ?? ''
const API_PREFIX = API_BASE_URL ? '/api/v1' : '/api'
const BASE_PATH = `${API_PREFIX}/drug-category-map`

function buildUrl(path: string = '') {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const finalPath = `${BASE_PATH}${normalizedPath === '/' ? '' : normalizedPath}`
    return API_BASE_URL ? `${API_BASE_URL}${finalPath}` : finalPath
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

function normalizeAssignment(item: Record<string, unknown>): DrugCategoryAssignment {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        drugId: typeof item['drugId'] === 'number' ? item['drugId'] : Number(item['drugId']) || 0,
        categoryId:
            typeof item['categoryId'] === 'number' ? (item['categoryId'] as number) : Number(item['categoryId']) || 0,
        isPrimary: Boolean(item['isPrimary']),
        validFrom: parseDate(item['validFrom']),
        validTo: parseDate(item['validTo']),
        createdAt: parseDateTime(item['createdAt']),
        updatedAt: parseDateTime(item['updatedAt']),
    }
}

export interface AssignCategoryPayload {
    drugId: number
    categoryId: number
    isPrimary: boolean
    validFrom?: string | null
    validTo?: string | null
}

export async function assignDrugCategory(payload: AssignCategoryPayload): Promise<DrugCategoryAssignment> {
    const response = await fetch(buildUrl(''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to assign category to drug')
    }

    const data = await response.json()
    return normalizeAssignment(data)
}

export async function fetchDrugCategories(drugId: number): Promise<DrugCategoryAssignment[]> {
    const response = await fetch(buildUrl(`/${drugId}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load drug categories')
    }

    const data = await response.json()
    return Array.isArray(data) ? data.map((item) => normalizeAssignment(item)) : []
}

export async function removeDrugCategory(drugId: number, categoryId: number): Promise<void> {
    const response = await fetch(buildUrl(`/${drugId}/${categoryId}`), { method: 'DELETE' })

    if (!response.ok) {
        throw new Error('Unable to remove drug category')
    }
}
