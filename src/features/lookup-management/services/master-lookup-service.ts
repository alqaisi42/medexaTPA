import { AgeGroupRecord, BaseLookupRecord, LookupCategory, LookupRecord } from '@/types/lookup'

export interface CreateLookupPayload {
    code: string
    nameEn: string
    nameAr: string
    minAgeYears?: number | null
    maxAgeYears?: number | null
    isActive?: boolean
    effectiveFrom?: string | null
    effectiveTo?: string | null
}

const API_ROUTE_PREFIX = '/api/master'

export async function getLookupRecords(category: LookupCategory): Promise<LookupRecord[]> {
    const response = await fetch(buildUrl(category), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Unable to load lookup records'))
    }

    const payload = await safeJson(response)
    return normalizeLookupRecords(category, payload)
}

export async function createLookupRecord(
    category: LookupCategory,
    payload: CreateLookupPayload,
): Promise<LookupRecord> {
    const response = await fetch(buildUrl(category), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildRequestPayload(category, payload)),
    })

    if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Unable to save lookup record'))
    }

    const body = await safeJson(response)

    if (Array.isArray(body) && body.length > 0) {
        return normalizeLookupRecord(category, body[0])
    }

    if (typeof body === 'object' && body !== null) {
        return normalizeLookupRecord(category, body as Record<string, unknown>)
    }

    return normalizeLookupRecord(category, {})
}

function buildUrl(category: LookupCategory) {
    return `${API_ROUTE_PREFIX}/${category}`
}

async function safeJson(response: Response) {
    try {
        return await response.json()
    } catch (error) {
        console.warn('Failed to parse JSON response for master lookup', error)
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
        return 'Requested lookup resource was not found.'
    }

    return fallback
}

type RawLookupRecord = Record<string, unknown>

function normalizeLookupRecords(category: LookupCategory, payload: unknown): LookupRecord[] {
    if (!Array.isArray(payload)) {
        return []
    }

    return payload
        .filter((item): item is RawLookupRecord => typeof item === 'object' && item !== null)
        .map((item) => normalizeLookupRecord(category, item))
}

export function normalizeLookupRecord(category: LookupCategory, item: RawLookupRecord): LookupRecord {
    const baseRecord: BaseLookupRecord = {
        id: toStringOrFallback(
            item['id'],
            globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
        ),
        code: toStringOrEmpty(item['code']),
        nameEn: toStringOrEmpty(item['nameEn'] ?? item['name_en']),
        nameAr: toStringOrEmpty(item['nameAr'] ?? item['name_ar']),
    }

    if (category === 'age-groups') {
        const minAge = parseNullableNumber(item['minAgeYears'] ?? item['from'])
        const maxAge = parseNullableNumber(item['maxAgeYears'] ?? item['to'])
        const isActiveRaw = item['isActive'] ?? item['is_active']
        const effectiveFromRaw = item['effectiveFrom'] ?? item['effective_from']
        const effectiveToRaw = item['effectiveTo'] ?? item['effective_to']

        const ageGroupRecord: AgeGroupRecord = {
            ...baseRecord,
            minAgeYears: minAge,
            maxAgeYears: maxAge,
            isActive: typeof isActiveRaw === 'boolean' ? isActiveRaw : true,
            effectiveFrom: toIsoString(effectiveFromRaw),
            effectiveTo: toIsoString(effectiveToRaw),
        }

        return ageGroupRecord
    }

    return baseRecord
}

function buildRequestPayload(category: LookupCategory, data: CreateLookupPayload) {
    const basePayload = {
        code: data.code,
        nameEn: data.nameEn,
        nameAr: data.nameAr,
    }

    if (category === 'age-groups') {
        const effectiveFrom = data.effectiveFrom ? new Date(data.effectiveFrom).toISOString() : null
        const effectiveTo = data.effectiveTo ? new Date(data.effectiveTo).toISOString() : null

        return {
            ...basePayload,
            name_en: data.nameEn,
            name_ar: data.nameAr,
            minAgeYears: data.minAgeYears ?? null,
            maxAgeYears: data.maxAgeYears ?? null,
            from: data.minAgeYears ?? null,
            to: data.maxAgeYears ?? null,
            isActive: data.isActive ?? true,
            effectiveFrom,
            effectiveTo,
        }
    }

    return basePayload
}

function parseNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
        return null
    }

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

function toStringOrEmpty(value: unknown): string {
    if (typeof value === 'string') {
        return value
    }

    if (typeof value === 'number') {
        return String(value)
    }

    return ''
}

function toStringOrFallback(value: unknown, fallback: string): string {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value)
    }

    return fallback
}

function toIsoString(value: unknown): string | null {
    if (value instanceof Date) {
        return value.toISOString()
    }

    if (typeof value === 'string' && value.length > 0) {
        return value
    }

    return null
}
