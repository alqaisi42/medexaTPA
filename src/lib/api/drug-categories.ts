import { DrugCategory, DrugCategoryPayload, DrugCategoryTreeItem } from '@/types'

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, '') ?? ''
const API_PREFIX = API_BASE_URL ? '/api/v1' : '/api'
const BASE_PATH = `${API_PREFIX}/drug-categories`

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

function parseDateTime(value: unknown): string | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return new Date(value * 1000).toISOString()
    }

    if (typeof value === 'string' && value.trim().length > 0) {
        return value
    }

    return null
}

function normalizeCategory(item: Record<string, unknown>): DrugCategory {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        code: String(item['code'] ?? ''),
        nameEn: String(item['nameEn'] ?? item['name_en'] ?? ''),
        nameAr: String(item['nameAr'] ?? item['name_ar'] ?? ''),
        parentId: typeof item['parentId'] === 'number' || item['parentId'] === null ? (item['parentId'] as number | null) : Number(item['parentId']) || null,
        level: typeof item['level'] === 'number' ? item['level'] : Number(item['level']) || null,
        isActive: Boolean(item['isActive'] ?? true),
        createdAt: parseDateTime(item['createdAt']),
        updatedAt: parseDateTime(item['updatedAt']),
    }
}

function normalizeTreeResponse(items: unknown): DrugCategoryTreeItem[] {
    if (!Array.isArray(items)) {
        return []
    }

    return items.map((item) => {
        const category = normalizeCategory(item as Record<string, unknown>)
        return {
            ...category,
            children: normalizeTreeResponse((item as Record<string, unknown>).children ?? []),
        }
    })
}

export async function fetchCategoriesTree(): Promise<DrugCategoryTreeItem[]> {
    const response = await fetch(buildUrl('/tree'), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load categories tree')
    }

    const data = await response.json()
    return normalizeTreeResponse(data)
}

export async function fetchChildCategories(parentId: number): Promise<DrugCategory[]> {
    const response = await fetch(buildUrl(`/${parentId}/children`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load child categories')
    }

    const data = await response.json()
    return Array.isArray(data) ? data.map((item) => normalizeCategory(item)) : []
}

export async function createDrugCategory(payload: DrugCategoryPayload): Promise<DrugCategory> {
    const response = await fetch(buildUrl(''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to create category')
    }

    const data = await response.json()
    return normalizeCategory(data)
}

export async function updateDrugCategory(id: number, payload: Partial<DrugCategoryPayload>): Promise<DrugCategory> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to update category')
    }

    const data = await response.json()
    return normalizeCategory(data)
}

export async function deleteDrugCategory(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), { method: 'DELETE' })

    if (!response.ok) {
        throw new Error('Unable to delete category')
    }
}
