import { Specialty, SpecialtyPayload } from '@/types/specialty'

const API_ROUTE_PREFIX = '/api/v1/specialties'

async function handleJsonResponse(response: Response, fallbackMessage: string) {
    if (!response.ok) {
        throw new Error(await extractErrorMessage(response, fallbackMessage))
    }

    try {
        return (await response.json()) as unknown
    } catch (error) {
        console.warn('Failed to parse JSON response for specialties', error)
        return null
    }
}

async function extractErrorMessage(response: Response, fallback: string) {
    try {
        const data = await response.json()
        if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
            return data.message
        }
    } catch {
        // ignore parsing error - fall back to generic message
    }

    if (response.status === 404) {
        return 'Requested specialty resource was not found.'
    }

    return fallback
}

function toStringOrNull(value: unknown): string | null {
    if (typeof value === 'string') {
        return value
    }

    return null
}

function toNumber(value: unknown): number {
    if (typeof value === 'number') {
        return value
    }

    if (typeof value === 'string') {
        const parsed = Number(value)
        if (Number.isFinite(parsed)) {
            return parsed
        }
    }

    return Math.random()
}

function normalizeSpecialty(record: Record<string, unknown>): Specialty {
    return {
        id: toNumber(record['id']),
        code: typeof record['code'] === 'string' ? record['code'] : '',
        nameEn: typeof record['nameEn'] === 'string' ? record['nameEn'] : '',
        nameAr: typeof record['nameAr'] === 'string' ? record['nameAr'] : '',
        isActive: typeof record['isActive'] === 'boolean' ? record['isActive'] : true,
        createdAt: toStringOrNull(record['createdAt']),
        updatedAt: toStringOrNull(record['updatedAt']),
        effectiveFrom: toStringOrNull(record['effectiveFrom']),
        effectiveTo: toStringOrNull(record['effectiveTo']),
    }
}

export async function getSpecialties(): Promise<Specialty[]> {
    const response = await fetch(API_ROUTE_PREFIX, { cache: 'no-store' })
    const payload = await handleJsonResponse(response, 'Unable to load specialties')

    if (!Array.isArray(payload)) {
        return []
    }

    return payload
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item) => normalizeSpecialty(item))
}

export async function createSpecialty(payload: SpecialtyPayload): Promise<Specialty> {
    const response = await fetch(API_ROUTE_PREFIX, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    const body = await handleJsonResponse(response, 'Unable to create specialty')

    if (body && typeof body === 'object') {
        return normalizeSpecialty(body as Record<string, unknown>)
    }

    return normalizeSpecialty({})
}

export async function updateSpecialty(id: number, payload: SpecialtyPayload): Promise<Specialty> {
    const response = await fetch(`${API_ROUTE_PREFIX}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    const body = await handleJsonResponse(response, 'Unable to update specialty')

    if (body && typeof body === 'object') {
        return normalizeSpecialty(body as Record<string, unknown>)
    }

    return normalizeSpecialty({})
}

export async function deleteSpecialty(id: number): Promise<void> {
    const response = await fetch(`${API_ROUTE_PREFIX}/${id}`, {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Unable to delete specialty'))
    }
}
