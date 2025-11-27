import {
    InsurancePlan,
    InsurancePlanListResponse,
    InsurancePlanPayload,
    InsurancePlanSearchFilters,
    InsurancePlanUpdatePayload,
} from '@/types/insurance-plan'

const BASE_PATH = '/api/insurance-plans'

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

function parseTimestamp(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : null
    }
    return null
}

function normalizeInsurancePlan(item: Record<string, unknown>): InsurancePlan {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        code: String(item['code'] ?? ''),
        nameEn: String(item['nameEn'] ?? ''),
        nameAr: String(item['nameAr'] ?? ''),
        description: item['description'] ? String(item['description']) : null,
        planType: (item['planType'] as 'CORPORATE' | 'INDIVIDUAL' | 'FAMILY' | 'GROUP' | 'OTHER') ?? 'OTHER',
        category: (item['category'] as 'PREMIUM' | 'STANDARD' | 'BASIC' | 'ECONOMY' | 'OTHER') ?? 'OTHER',
        isActive: Boolean(item['isActive'] ?? true),
        effectiveFrom: parseTimestamp(item['effectiveFrom']),
        effectiveTo: parseTimestamp(item['effectiveTo']),
        createdAt: parseTimestamp(item['createdAt']),
        updatedAt: parseTimestamp(item['updatedAt']),
    }
}

export async function fetchInsurancePlans(filters: InsurancePlanSearchFilters = {}): Promise<InsurancePlanListResponse> {
    const { page = 0, size = 20, ...restFilters } = filters
    const params: Record<string, string | number | boolean> = { page, size }

    if (restFilters.planType) params.planType = restFilters.planType
    if (restFilters.category) params.category = restFilters.category
    if (restFilters.isActive !== undefined) params.isActive = restFilters.isActive
    if (restFilters.name) params.name = restFilters.name
    if (restFilters.code) params.code = restFilters.code

    const response = await fetch(buildUrl('', params), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load insurance plans')
    }

    const data: InsurancePlanListResponse = await response.json()
    return {
        ...data,
        content: data.content.map(normalizeInsurancePlan),
    }
}

export async function fetchInsurancePlan(id: number): Promise<InsurancePlan> {
    const response = await fetch(buildUrl(`/${id}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load insurance plan')
    }

    const data = await response.json()
    return normalizeInsurancePlan(data)
}

export async function createInsurancePlan(payload: InsurancePlanPayload): Promise<InsurancePlan> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to create insurance plan')
    }

    const data = await response.json()
    return normalizeInsurancePlan(data)
}

export async function updateInsurancePlan(id: number, payload: InsurancePlanUpdatePayload): Promise<InsurancePlan> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to update insurance plan')
    }

    const data = await response.json()
    return normalizeInsurancePlan(data)
}

export async function deleteInsurancePlan(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to delete insurance plan')
    }
}

