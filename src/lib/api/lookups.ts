import {ProviderType, Specialty} from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? ''

function buildUrl(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath
}

async function safeJson(response: Response) {
    try {
        return await response.json()
    } catch (error) {
        console.warn('Failed to parse lookup response body', error)
        return null
    }
}

function toArray(payload: unknown): unknown[] {
    if (Array.isArray(payload)) {
        return payload
    }

    if (payload && typeof payload === 'object') {
        const dataField = (payload as Record<string, unknown>).data
        const contentField = (payload as Record<string, unknown>).content

        if (Array.isArray(dataField)) {
            return dataField
        }

        if (Array.isArray(contentField)) {
            return contentField
        }
    }

    return []
}

function normalizeSpecialty(record: Record<string, unknown>): Specialty {
    return {
        id: Number(record.id ?? 0),
        code: String(record.code ?? ''),
        nameEn: String(record.nameEn ?? record.name_en ?? ''),
        nameAr: String(record.nameAr ?? record.name_ar ?? ''),
        isActive: Boolean(record.isActive ?? true),
        createdAt: (record.createdAt as string) ?? null,
        updatedAt: (record.updatedAt as string) ?? null,
        effectiveFrom: (record.effectiveFrom as string) ?? null,
        effectiveTo: (record.effectiveTo as string) ?? null,
    }
}

function normalizeProviderType(record: Record<string, unknown>): ProviderType {
    return {
        id: Number(record.id ?? 0),
        code: String(record.code ?? ''),
        nameEn: String(record.nameEn ?? record.name_en ?? ''),
        nameAr: String(record.nameAr ?? record.name_ar ?? ''),
    }
}

async function fetchLookup<T>(path: string, normalize: (record: Record<string, unknown>) => T, errorMessage: string): Promise<T[]> {
    const response = await fetch(buildUrl(path), {cache: 'no-store'})

    if (!response.ok) {
        throw new Error(errorMessage)
    }

    const payload = await safeJson(response)
    const records = toArray(payload)

    return records
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map(normalize)
}

export async function fetchSpecialtiesLookup(): Promise<Specialty[]> {
    return fetchLookup('/api/specialties', normalizeSpecialty, 'Unable to load specialties')
}

export async function fetchProviderTypesLookup(): Promise<ProviderType[]> {
    return fetchLookup(
        '/api/master/provider-types',
        normalizeProviderType,
        'Unable to load provider types',
    )
}
