import {
    Network,
    NetworkListResponse,
    NetworkPayload,
    NetworkSearchFilters,
    NetworkUpdatePayload,
} from '@/types/network'

const BASE_PATH = '/api/networks'

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

function normalizeNetwork(item: Record<string, unknown>): Network {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        code: String(item['code'] ?? ''),
        nameEn: String(item['nameEn'] ?? ''),
        nameAr: String(item['nameAr'] ?? ''),
        description: item['description'] ? String(item['description']) : null,
        status: (item['status'] as 'ACTIVE' | 'INACTIVE') ?? 'ACTIVE',
        networkType: (item['networkType'] as 'TIER' | 'GEOGRAPHIC' | 'SPECIALTY' | 'OTHER') ?? 'TIER',
        effectiveFrom: parseTimestamp(item['effectiveFrom']),
        effectiveTo: parseTimestamp(item['effectiveTo']),
        createdAt: parseTimestamp(item['createdAt']),
        updatedAt: parseTimestamp(item['updatedAt']),
    }
}

export async function fetchNetworks(filters: NetworkSearchFilters = {}): Promise<NetworkListResponse> {
    const { page = 0, size = 20, ...restFilters } = filters
    const params: Record<string, string | number> = { page, size }
    
    if (restFilters.status) params.status = restFilters.status
    if (restFilters.name) params.name = restFilters.name
    if (restFilters.networkType) params.networkType = restFilters.networkType

    const response = await fetch(buildUrl('', params), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load networks')
    }

    const data: NetworkListResponse = await response.json()
    return {
        ...data,
        content: data.content.map(normalizeNetwork),
    }
}

export async function fetchNetwork(id: number): Promise<Network> {
    const response = await fetch(buildUrl(`/${id}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load network')
    }

    const data = await response.json()
    return normalizeNetwork(data)
}

export async function createNetwork(payload: NetworkPayload): Promise<Network> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to create network')
    }

    const data = await response.json()
    return normalizeNetwork(data)
}

export async function updateNetwork(id: number, payload: NetworkUpdatePayload): Promise<Network> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to update network')
    }

    const data = await response.json()
    return normalizeNetwork(data)
}

export async function deleteNetwork(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to delete network')
    }
}

