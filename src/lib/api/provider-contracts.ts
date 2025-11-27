import {
    ProviderContract,
    ProviderContractListResponse,
    ProviderContractPayload,
    ProviderContractSearchFilters,
    ProviderContractUpdatePayload,
} from '@/types/provider-contract'

const BASE_PATH = '/api/provider-contracts'

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

function parseBigDecimal(value: unknown): number | null {
    if (value === null || value === undefined) return null
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
        const parsed = Number(value)
        return isNaN(parsed) ? null : parsed
    }
    return null
}

function parseDateTime(value: unknown): number | string | null {
    if (value === null || value === undefined) return null
    if (typeof value === 'string') return value
    if (typeof value === 'number') return value
    // Handle OffsetDateTime format [year, month, day, hour, minute, second, nano]
    if (Array.isArray(value) && value.length >= 3) {
        const [year, month, day] = value
        return new Date(year, month - 1, day).getTime() / 1000
    }
    return null
}

function normalizeProviderContract(item: Record<string, unknown>): ProviderContract {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        contractCode: String(item['contractCode'] ?? ''),
        nameEn: String(item['nameEn'] ?? ''),
        nameAr: item['nameAr'] ? String(item['nameAr']) : null,
        providerId: typeof item['providerId'] === 'number' ? item['providerId'] : Number(item['providerId']) || 0,
        providerName: item['providerName'] ? String(item['providerName']) : null,
        isActive: Boolean(item['isActive'] ?? true),
        appliesToNetwork: Boolean(item['appliesToNetwork'] ?? false),
        effectiveFrom: parseDateTime(item['effectiveFrom']),
        effectiveTo: parseDateTime(item['effectiveTo']),
        createdAt: parseDateTime(item['createdAt']),
        updatedAt: parseDateTime(item['updatedAt']),
        // Financial fields
        tpaCommissionPercent: parseBigDecimal(item['tpaCommissionPercent']),
        tpaCommissionFixed: parseBigDecimal(item['tpaCommissionFixed']),
        contractDiscountPercent: parseBigDecimal(item['contractDiscountPercent']),
        contractDiscountFixed: parseBigDecimal(item['contractDiscountFixed']),
        reimbursementModel: item['reimbursementModel'] ? String(item['reimbursementModel']) : null,
        ppdPercent: parseBigDecimal(item['ppdPercent']),
        ppdDayLimit: item['ppdDayLimit'] !== null && item['ppdDayLimit'] !== undefined ? Number(item['ppdDayLimit']) : null,
        annualCap: parseBigDecimal(item['annualCap']),
        monthlyCap: parseBigDecimal(item['monthlyCap']),
        perCaseCap: parseBigDecimal(item['perCaseCap']),
        vatIncluded: item['vatIncluded'] !== null && item['vatIncluded'] !== undefined ? Boolean(item['vatIncluded']) : null,
        vatPercent: parseBigDecimal(item['vatPercent']),
        denyPolicy: item['denyPolicy'] && typeof item['denyPolicy'] === 'object' ? (item['denyPolicy'] as Record<string, unknown>) : null,
        // Extended fields
        settlementStrategy: item['settlementStrategy'] ? String(item['settlementStrategy']) : null,
        deductibleOverride: parseBigDecimal(item['deductibleOverride']),
        copayOverride: parseBigDecimal(item['copayOverride']),
        copayType: item['copayType'] ? String(item['copayType']) : null,
        networkTier: item['networkTier'] ? String(item['networkTier']) : null,
        currency: item['currency'] ? String(item['currency']) : null,
        claimSubmissionDayLimit: item['claimSubmissionDayLimit'] !== null && item['claimSubmissionDayLimit'] !== undefined ? Number(item['claimSubmissionDayLimit']) : null,
        isCashlessAllowed: item['isCashlessAllowed'] !== null && item['isCashlessAllowed'] !== undefined ? Boolean(item['isCashlessAllowed']) : null,
        isReimbursementAllowed: item['isReimbursementAllowed'] !== null && item['isReimbursementAllowed'] !== undefined ? Boolean(item['isReimbursementAllowed']) : null,
        // Audit fields
        createdBy: item['createdBy'] ? String(item['createdBy']) : null,
        updatedBy: item['updatedBy'] ? String(item['updatedBy']) : null,
    }
}

export async function fetchProviderContracts(filters: ProviderContractSearchFilters = {}): Promise<ProviderContractListResponse> {
    const { page = 0, size = 20, ...restFilters } = filters
    const params: Record<string, string | number | boolean> = { page, size }

    if (restFilters.query) params.query = restFilters.query
    if (restFilters.providerId) params.providerId = restFilters.providerId
    if (restFilters.isActive !== undefined) params.isActive = restFilters.isActive
    if (restFilters.appliesToNetwork !== undefined) params.appliesToNetwork = restFilters.appliesToNetwork
    if (restFilters.effectiveFromStart) params.effectiveFromStart = restFilters.effectiveFromStart
    if (restFilters.effectiveFromEnd) params.effectiveFromEnd = restFilters.effectiveFromEnd
    if (restFilters.sortBy) params.sortBy = restFilters.sortBy
    if (restFilters.sortDirection) params.sortDirection = restFilters.sortDirection

    const response = await fetch(buildUrl('', params), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load provider contracts')
    }

    const data: ProviderContractListResponse = await response.json()
    return {
        ...data,
        content: data.content.map(normalizeProviderContract),
    }
}

export async function fetchProviderContract(id: number): Promise<ProviderContract> {
    const response = await fetch(buildUrl(`/${id}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load provider contract')
    }

    const data = await response.json()
    return normalizeProviderContract(data)
}

export async function createProviderContract(payload: ProviderContractPayload): Promise<ProviderContract> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to create provider contract')
    }

    const data = await response.json()
    return normalizeProviderContract(data)
}

export async function updateProviderContract(id: number, payload: ProviderContractUpdatePayload): Promise<ProviderContract> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to update provider contract')
    }

    const data = await response.json()
    return normalizeProviderContract(data)
}

export async function deleteProviderContract(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to delete provider contract')
    }
}

