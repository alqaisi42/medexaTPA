import {
    Enrollment,
    EnrollmentListResponse,
    EnrollmentSearchFilters,
    EnrollSubscriberPayload,
} from '@/types/card'

const BASE_PATH = '/api/enrollments'

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

function parseDate(value: unknown): string | null {
    if (value === null || value === undefined) return null
    if (typeof value === 'string') return value
    if (Array.isArray(value) && value.length >= 3) {
        const [year, month, day] = value
        return new Date(year, month - 1, day).toISOString().split('T')[0]
    }
    return null
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

import { Policy } from '@/types/card'
import { Subscriber } from '@/types/subscriber'

function normalizeEnrollment(item: Record<string, unknown>): Enrollment {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        policyId: typeof item['policyId'] === 'number' ? item['policyId'] : Number(item['policyId']) || 0,
        policy: item['policy'] && typeof item['policy'] === 'object' ? (item['policy'] as unknown as Policy) : undefined,
        subscriberId: typeof item['subscriberId'] === 'number' ? item['subscriberId'] : Number(item['subscriberId']) || 0,
        subscriber: item['subscriber'] && typeof item['subscriber'] === 'object' ? (item['subscriber'] as unknown as Subscriber) : undefined,
        payer: item['payer'] !== null && item['payer'] !== undefined ? Number(item['payer']) : null,
        relationType: item['relationType'] ? String(item['relationType']) : null,
        isHeadOfFamily: Boolean(item['isHeadOfFamily'] ?? false),
        coverageStart: Array.isArray(item['coverageStart'])
            ? (item['coverageStart'] as [number, number, number])
            : parseDate(item['coverageStart']),
        coverageEnd: Array.isArray(item['coverageEnd'])
            ? (item['coverageEnd'] as [number, number, number])
            : parseDate(item['coverageEnd']),
        status: item['status'] ? String(item['status']) : null,
        createdAt: parseTimestamp(item['createdAt']),
        updatedAt: parseTimestamp(item['updatedAt']),
    }
}

export async function fetchEnrollments(filters: EnrollmentSearchFilters = {}): Promise<EnrollmentListResponse> {
    const { page = 0, size = 20, ...restFilters } = filters
    const params: Record<string, string | number> = { page, size }

    if (restFilters.policyId !== undefined) params.policyId = restFilters.policyId
    if (restFilters.subscriberId !== undefined) params.subscriberId = restFilters.subscriberId

    const response = await fetch(buildUrl('', params), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load enrollments')
    }

    const data: EnrollmentListResponse = await response.json()
    return {
        ...data,
        content: data.content.map(normalizeEnrollment),
    }
}

export async function fetchEnrollment(id: number): Promise<Enrollment> {
    const response = await fetch(buildUrl(`/${id}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load enrollment')
    }

    const data = await response.json()
    return normalizeEnrollment(data)
}

export async function enrollSubscriber(payload: EnrollSubscriberPayload): Promise<Enrollment> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Unable to enroll subscriber: ${errorText}`)
    }

    const data = await response.json()
    return normalizeEnrollment(data)
}

