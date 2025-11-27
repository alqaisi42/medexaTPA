import {
    PlanNetworkMapping,
    PlanNetworkMappingListResponse,
    PlanNetworkMappingPayload,
    PlanNetworkMappingUpdatePayload,
} from '@/types/network'

const BASE_PATH = '/api/plan-networks'

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

function parseDateTime(value: unknown): string | null {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return new Date(value * 1000).toISOString()
    }
    return null
}

function normalizePlanNetworkMapping(item: Record<string, unknown>): PlanNetworkMapping {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        planId: typeof item['planId'] === 'number' ? item['planId'] : Number(item['planId']) || 0,
        planCode: String(item['planCode'] ?? ''),
        planNameEn: String(item['planNameEn'] ?? ''),
        networkId: typeof item['networkId'] === 'number' ? item['networkId'] : Number(item['networkId']) || 0,
        networkCode: String(item['networkCode'] ?? ''),
        networkNameEn: String(item['networkNameEn'] ?? ''),
        coverageType: (item['coverageType'] as 'INCLUDED' | 'EXCLUDED' | 'PARTIAL') ?? 'INCLUDED',
        status: (item['status'] as 'ACTIVE' | 'INACTIVE') ?? 'ACTIVE',
        effectiveFrom: parseDateTime(item['effectiveFrom']),
        effectiveTo: parseDateTime(item['effectiveTo']),
        notes: item['notes'] ? String(item['notes']) : null,
        createdAt: parseDateTime(item['createdAt']),
        updatedAt: parseDateTime(item['updatedAt']),
    }
}

export interface FetchPlanNetworksByNetworkParams {
    networkId: number
    status?: 'ACTIVE' | 'INACTIVE'
    page?: number
    size?: number
}

export async function fetchPlanNetworksByNetwork(
    params: FetchPlanNetworksByNetworkParams,
): Promise<PlanNetworkMappingListResponse> {
    const { networkId, status, page = 0, size = 20 } = params
    const queryParams: Record<string, string | number> = { networkId, page, size }
    if (status) queryParams.status = status

    const response = await fetch(buildUrl('/by-network', queryParams), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load plan-networks by network')
    }

    const data: PlanNetworkMappingListResponse = await response.json()
    return {
        ...data,
        content: data.content.map(normalizePlanNetworkMapping),
    }
}

export interface FetchPlanNetworksByPlanParams {
    planId: number
    status?: 'ACTIVE' | 'INACTIVE'
    page?: number
    size?: number
}

export async function fetchPlanNetworksByPlan(
    params: FetchPlanNetworksByPlanParams,
): Promise<PlanNetworkMappingListResponse> {
    const { planId, status, page = 0, size = 20 } = params
    const queryParams: Record<string, string | number> = { planId, page, size }
    if (status) queryParams.status = status

    const response = await fetch(buildUrl('/by-plan', queryParams), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load plan-networks by plan')
    }

    const data: PlanNetworkMappingListResponse = await response.json()
    return {
        ...data,
        content: data.content.map(normalizePlanNetworkMapping),
    }
}

export async function createPlanNetworkMapping(payload: PlanNetworkMappingPayload): Promise<PlanNetworkMapping> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to create plan-network mapping')
    }

    const data = await response.json()
    return normalizePlanNetworkMapping(data)
}

export async function updatePlanNetworkMapping(
    id: number,
    payload: PlanNetworkMappingUpdatePayload,
): Promise<PlanNetworkMapping> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to update plan-network mapping')
    }

    const data = await response.json()
    return normalizePlanNetworkMapping(data)
}

export async function deletePlanNetworkMapping(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to delete plan-network mapping')
    }
}

