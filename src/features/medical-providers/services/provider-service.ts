import {
    PaginatedResponse,
    ProviderBranch,
    ProviderBranchPayload,
    ProviderPayload,
    ProviderRecord,
    ProviderStatus,
} from '@/types/provider'

const API_PREFIX = '/api/providers'

function toNumber(value: unknown): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
        const parsed = Number(value)
        if (Number.isFinite(parsed)) return parsed
    }

    return 0
}

function toStringOrNull(value: unknown): string | null {
    if (value === null || value === undefined) return null
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)

    return null
}

function ensureRecord(input: unknown): Record<string, unknown> {
    if (input && typeof input === 'object') {
        return input as Record<string, unknown>
    }

    return {}
}

function normalizeProvider(raw: Record<string, unknown>): ProviderRecord {
    const providerType = ensureRecord(raw['providerType'])

    return {
        id: toNumber(raw['id']),
        code: typeof raw['code'] === 'string' ? raw['code'] : '',
        nameEn: typeof raw['nameEn'] === 'string' ? raw['nameEn'] : '',
        nameAr: typeof raw['nameAr'] === 'string' ? raw['nameAr'] : '',
        providerType: {
            id: toNumber(providerType['id']),
            code: typeof providerType['code'] === 'string' ? providerType['code'] : '',
            nameEn: typeof providerType['nameEn'] === 'string' ? providerType['nameEn'] : typeof providerType['name_en'] === 'string' ? providerType['name_en'] : '',
            nameAr: typeof providerType['nameAr'] === 'string' ? providerType['nameAr'] : typeof providerType['name_ar'] === 'string' ? providerType['name_ar'] : '',
            isActive: typeof providerType['is_active'] === 'boolean' ? providerType['is_active'] : true,
            createdAt: providerType['createdAt'] ?? providerType['created_at'] ?? null,
            updatedAt: providerType['updatedAt'] ?? providerType['updated_at'] ?? null,
            canAdmitPatients: Boolean(providerType['canAdmitPatients'] ?? providerType['can_admit_patients']),
            canPrescribeMedication: Boolean(providerType['canPrescribeMedication'] ?? providerType['can_prescribe_medication']),
            requiresReferral: Boolean(providerType['requiresReferral'] ?? providerType['requires_referral']),
            effectiveFrom: providerType['effectiveFrom'] ?? providerType['effective_from'] ?? null,
            effectiveTo: providerType['effectiveTo'] ?? providerType['effective_to'] ?? null,
        },
        ownershipType: (raw['ownershipType'] as ProviderRecord['ownershipType']) ?? 'PRIVATE',
        status: (raw['status'] as ProviderStatus) ?? 'ACTIVE',
        taxNumber: toStringOrNull(raw['taxNumber']),
        licenseNumber: toStringOrNull(raw['licenseNumber']),
        website: toStringOrNull(raw['website']),
        notes: toStringOrNull(raw['notes']),
        createdAt: raw['createdAt'] ?? null,
        updatedAt: raw['updatedAt'] ?? null,
    }
}

function normalizeBranch(raw: Record<string, unknown>): ProviderBranch {
    const workingHours = ensureRecord(raw['workingHours'])
    const normalizedWorkingHours: Record<string, string> = {}

    Object.entries(workingHours).forEach(([key, value]) => {
        if (typeof value === 'string') {
            normalizedWorkingHours[key] = value
        }
    })

    return {
        id: toNumber(raw['id']),
        providerId: toNumber(raw['providerId']),
        nameEn: typeof raw['nameEn'] === 'string' ? raw['nameEn'] : '',
        nameAr: typeof raw['nameAr'] === 'string' ? raw['nameAr'] : '',
        country: typeof raw['country'] === 'string' ? raw['country'] : '',
        city: typeof raw['city'] === 'string' ? raw['city'] : '',
        district: typeof raw['district'] === 'string' ? raw['district'] : '',
        street: typeof raw['street'] === 'string' ? raw['street'] : '',
        phone: typeof raw['phone'] === 'string' ? raw['phone'] : '',
        mobile: typeof raw['mobile'] === 'string' ? raw['mobile'] : '',
        email: typeof raw['email'] === 'string' ? raw['email'] : '',
        latitude: typeof raw['latitude'] === 'number' ? raw['latitude'] : null,
        longitude: typeof raw['longitude'] === 'number' ? raw['longitude'] : null,
        workingHours: normalizedWorkingHours,
        isMain: Boolean(raw['isMain']),
        isActive: typeof raw['isActive'] === 'boolean' ? raw['isActive'] : true,
    }
}

async function handleJson(response: Response, fallback: string) {
    if (!response.ok) {
        throw new Error(await extractError(response, fallback))
    }

    try {
        return (await response.json()) as unknown
    } catch (error) {
        console.warn('Failed to parse response body', error)
        return null
    }
}

async function extractError(response: Response, fallback: string) {
    try {
        const body = await response.json()
        if (body && typeof body === 'object' && 'message' in body && typeof (body as Record<string, unknown>).message === 'string') {
            return (body as Record<string, unknown>).message as string
        }
    } catch {
        // ignore
    }

    if (response.status === 404) {
        return 'Requested provider resource was not found.'
    }

    return fallback
}

function buildSearchParams(params?: Record<string, unknown>) {
    const searchParams = new URLSearchParams()
    if (!params) return searchParams

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        searchParams.set(key, String(value))
    })

    return searchParams
}

export async function listProviders(params: {
    page?: number
    size?: number
    name?: string
    status?: ProviderStatus | ''
} = {}): Promise<PaginatedResponse<ProviderRecord>> {
    const searchParams = buildSearchParams({
        page: params.page ?? 0,
        size: params.size ?? 10,
        name: params.name,
        status: params.status,
    })

    const response = await fetch(`${API_PREFIX}?${searchParams.toString()}`, { cache: 'no-store' })
    const payload = await handleJson(response, 'Unable to load providers')

    const content =
        Array.isArray((payload as Record<string, unknown>)?.['content'])
            ? ((payload as Record<string, unknown>).content as unknown[])
            : []

    const providers = content
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item) => normalizeProvider(item))

    const pageable = ensureRecord((payload as Record<string, unknown>)?.['pageable'])

    return {
        content: providers,
        totalElements: toNumber((payload as Record<string, unknown>)?.['totalElements']),
        totalPages: toNumber((payload as Record<string, unknown>)?.['totalPages']) || 0,
        pageNumber: toNumber(pageable['pageNumber']),
        pageSize: toNumber(pageable['pageSize']) || params.size || 10,
    }
}

export async function getProvider(id: number): Promise<ProviderRecord> {
    const response = await fetch(`${API_PREFIX}/${id}`, { cache: 'no-store' })
    const payload = ensureRecord(await handleJson(response, 'Unable to load provider details'))

    return normalizeProvider(payload)
}

export async function createProvider(payload: ProviderPayload): Promise<ProviderRecord> {
    const response = await fetch(API_PREFIX, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    const body = ensureRecord(await handleJson(response, 'Unable to create provider'))
    return normalizeProvider(body)
}

export async function updateProvider(id: number, payload: ProviderPayload): Promise<ProviderRecord> {
    const response = await fetch(`${API_PREFIX}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    const body = ensureRecord(await handleJson(response, 'Unable to update provider'))
    return normalizeProvider(body)
}

export async function deleteProvider(id: number): Promise<void> {
    const response = await fetch(`${API_PREFIX}/${id}`, { method: 'DELETE' })
    if (!response.ok) {
        throw new Error(await extractError(response, 'Unable to delete provider'))
    }
}

export async function listProviderBranches(
    providerId: number,
    params: { page?: number; size?: number } = {},
): Promise<PaginatedResponse<ProviderBranch>> {
    const searchParams = buildSearchParams({
        providerId,
        page: params.page ?? 0,
        size: params.size ?? 10,
    })

    const response = await fetch(`${API_PREFIX}/branches?${searchParams.toString()}`, { cache: 'no-store' })
    const payload = await handleJson(response, 'Unable to load provider branches')

    const content =
        Array.isArray((payload as Record<string, unknown>)?.['content'])
            ? ((payload as Record<string, unknown>).content as unknown[])
            : []

    const branches = content
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item) => normalizeBranch(item))

    const pageable = ensureRecord((payload as Record<string, unknown>)?.['pageable'])

    return {
        content: branches,
        totalElements: toNumber((payload as Record<string, unknown>)?.['totalElements']),
        totalPages: toNumber((payload as Record<string, unknown>)?.['totalPages']) || 0,
        pageNumber: toNumber(pageable['pageNumber']),
        pageSize: toNumber(pageable['pageSize']) || params.size || 10,
    }
}

export async function getProviderBranch(id: number): Promise<ProviderBranch> {
    const response = await fetch(`${API_PREFIX}/branches/${id}`, { cache: 'no-store' })
    const payload = ensureRecord(await handleJson(response, 'Unable to load branch details'))
    return normalizeBranch(payload)
}

export async function createProviderBranch(payload: ProviderBranchPayload): Promise<ProviderBranch> {
    const response = await fetch(`${API_PREFIX}/branches`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    const body = ensureRecord(await handleJson(response, 'Unable to create provider branch'))
    return normalizeBranch(body)
}

export async function updateProviderBranch(id: number, payload: ProviderBranchPayload): Promise<ProviderBranch> {
    const response = await fetch(`${API_PREFIX}/branches/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    const body = ensureRecord(await handleJson(response, 'Unable to update provider branch'))
    return normalizeBranch(body)
}

export async function deleteProviderBranch(id: number): Promise<void> {
    const response = await fetch(`${API_PREFIX}/branches/${id}`, { method: 'DELETE' })
    if (!response.ok) {
        throw new Error(await extractError(response, 'Unable to delete provider branch'))
    }
}
