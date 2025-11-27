import {
    ProviderNetworkMapping,
    ProviderNetworkMappingListResponse,
    ProviderNetworkMappingPayload,
    ProviderNetworkMappingUpdatePayload,
    NetworkStatus,
} from '@/types/network'

const BASE_PATH = '/api/provider-networks'

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

function normalizeProviderNetworkMapping(item: Record<string, unknown>): ProviderNetworkMapping {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        providerId: typeof item['providerId'] === 'number' ? item['providerId'] : Number(item['providerId']) || 0,
        providerCode: String(item['providerCode'] ?? ''),
        providerNameEn: String(item['providerNameEn'] ?? ''),
        networkId: typeof item['networkId'] === 'number' ? item['networkId'] : Number(item['networkId']) || 0,
        networkCode: String(item['networkCode'] ?? ''),
        networkNameEn: String(item['networkNameEn'] ?? ''),
        tierCode: String(item['tierCode'] ?? ''),
        status: (item['status'] as 'ACTIVE' | 'INACTIVE') ?? 'ACTIVE',
        effectiveFrom: parseTimestamp(item['effectiveFrom']),
        effectiveTo: parseTimestamp(item['effectiveTo']),
        notes: item['notes'] ? String(item['notes']) : null,
        createdAt: parseTimestamp(item['createdAt']),
        updatedAt: parseTimestamp(item['updatedAt']),
    }
}

export interface FetchProviderNetworksByNetworkParams {
    networkId: number
    status?: NetworkStatus
    page?: number
    size?: number
}

export async function fetchProviderNetworksByNetwork(
    params: FetchProviderNetworksByNetworkParams,
): Promise<ProviderNetworkMappingListResponse> {
    const { networkId, status, page = 0, size = 20 } = params
    const queryParams: Record<string, string | number> = { networkId, page, size }
    if (status) queryParams.status = status

    const response = await fetch(buildUrl('/by-network', queryParams), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load provider-networks by network')
    }

    const data: ProviderNetworkMappingListResponse = await response.json()
    return {
        ...data,
        content: data.content.map(normalizeProviderNetworkMapping),
    }
}

export interface FetchProviderNetworksByProviderParams {
    providerId: number
    status?: NetworkStatus
    page?: number
    size?: number
}

export async function fetchProviderNetworksByProvider(
    params: FetchProviderNetworksByProviderParams,
): Promise<ProviderNetworkMappingListResponse> {
    const { providerId, status, page = 0, size = 20 } = params
    const queryParams: Record<string, string | number> = { providerId, page, size }
    if (status) queryParams.status = status

    const response = await fetch(buildUrl('/by-provider', queryParams), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load provider-networks by provider')
    }

    const data: ProviderNetworkMappingListResponse = await response.json()
    return {
        ...data,
        content: data.content.map(normalizeProviderNetworkMapping),
    }
}

export async function createProviderNetworkMapping(payload: ProviderNetworkMappingPayload): Promise<ProviderNetworkMapping> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to create provider-network mapping')
    }

    const data = await response.json()
    return normalizeProviderNetworkMapping(data)
}

export async function updateProviderNetworkMapping(
    id: number,
    payload: ProviderNetworkMappingUpdatePayload,
): Promise<ProviderNetworkMapping> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to update provider-network mapping')
    }

    const data = await response.json()
    return normalizeProviderNetworkMapping(data)
}

export async function deleteProviderNetworkMapping(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to delete provider-network mapping')
    }
}

