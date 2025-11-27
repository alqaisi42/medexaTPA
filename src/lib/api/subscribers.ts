import { Subscriber, SubscriberListResponse, SubscriberPayload, SubscriberSearchFilters, FamilyTreeResponse, FamilyTreeMember } from '@/types/subscriber'

const BASE_PATH = '/api/subscribers'

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
        // [year, month, day] format
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

function normalizeSubscriber(item: Record<string, unknown>): Subscriber {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        nationalId: String(item['nationalId'] ?? ''),
        fullNameEn: String(item['fullNameEn'] ?? ''),
        fullNameAr: item['fullNameAr'] ? String(item['fullNameAr']) : null,
        gender: String(item['gender'] ?? ''),
        dateOfBirth: Array.isArray(item['dateOfBirth']) 
            ? item['dateOfBirth'] as [number, number, number]
            : parseDate(item['dateOfBirth']),
        maritalStatus: item['maritalStatus'] ? String(item['maritalStatus']) : null,
        isAlive: Boolean(item['isAlive'] ?? true),
        deathDate: parseDate(item['deathDate']),
        createdAt: parseTimestamp(item['createdAt']),
        updatedAt: parseTimestamp(item['updatedAt']),
        passportNo: item['passportNo'] ? String(item['passportNo']) : null,
        insuranceId: item['insuranceId'] ? String(item['insuranceId']) : null,
        firstNameEn: item['firstNameEn'] ? String(item['firstNameEn']) : null,
        middleNameEn: item['middleNameEn'] ? String(item['middleNameEn']) : null,
        lastNameEn: item['lastNameEn'] ? String(item['lastNameEn']) : null,
        firstNameAr: item['firstNameAr'] ? String(item['firstNameAr']) : null,
        middleNameAr: item['middleNameAr'] ? String(item['middleNameAr']) : null,
        lastNameAr: item['lastNameAr'] ? String(item['lastNameAr']) : null,
        phoneNumber: item['phoneNumber'] ? String(item['phoneNumber']) : null,
        mobileNumber: item['mobileNumber'] ? String(item['mobileNumber']) : null,
        email: item['email'] ? String(item['email']) : null,
        country: item['country'] ? String(item['country']) : null,
        city: item['city'] ? String(item['city']) : null,
        addressLine: item['addressLine'] ? String(item['addressLine']) : null,
        employerName: item['employerName'] ? String(item['employerName']) : null,
        employeeNumber: item['employeeNumber'] ? String(item['employeeNumber']) : null,
        nationality: item['nationality'] ? String(item['nationality']) : null,
        employerId: item['employerId'] !== null && item['employerId'] !== undefined ? Number(item['employerId']) : null,
        relationType: item['relationType'] ? String(item['relationType']) : null,
        isHeadOfFamily: Boolean(item['isHeadOfFamily'] ?? false),
        hofId: item['hofId'] !== null && item['hofId'] !== undefined ? Number(item['hofId']) : null,
        hasChronicConditions: Boolean(item['hasChronicConditions'] ?? false),
        hasPreexisting: Boolean(item['hasPreexisting'] ?? false),
        preexistingNotes: item['preexistingNotes'] ? String(item['preexistingNotes']) : null,
        eligibilityStatus: item['eligibilityStatus'] ? String(item['eligibilityStatus']) : null,
        eligibilityStart: parseDate(item['eligibilityStart']),
        eligibilityEnd: parseDate(item['eligibilityEnd']),
        currentPolicyId: item['currentPolicyId'] !== null && item['currentPolicyId'] !== undefined ? Number(item['currentPolicyId']) : null,
        currentEnrollmentId: item['currentEnrollmentId'] !== null && item['currentEnrollmentId'] !== undefined ? Number(item['currentEnrollmentId']) : null,
        currentCardStatus: item['currentCardStatus'] ? String(item['currentCardStatus']) : null,
        currentCardVersion: item['currentCardVersion'] !== null && item['currentCardVersion'] !== undefined ? Number(item['currentCardVersion']) : null,
    }
}

export async function fetchSubscribers(filters: SubscriberSearchFilters = {}): Promise<SubscriberListResponse> {
    const { page = 0, size = 20, ...restFilters } = filters
    const params: Record<string, string | number | boolean> = { page, size }

    if (restFilters.query) params.query = restFilters.query
    if (restFilters.gender) params.gender = restFilters.gender
    if (restFilters.isAlive !== undefined) params.isAlive = restFilters.isAlive
    if (restFilters.ageMin !== undefined) params.ageMin = restFilters.ageMin
    if (restFilters.ageMax !== undefined) params.ageMax = restFilters.ageMax
    if (restFilters.hasActivePolicy !== undefined) params.hasActivePolicy = restFilters.hasActivePolicy
    if (restFilters.hasActiveCard !== undefined) params.hasActiveCard = restFilters.hasActiveCard

    const response = await fetch(buildUrl('', params), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load subscribers')
    }

    const rawData = await response.json()
    const data = rawData as { content: unknown[] } & SubscriberListResponse
    return {
        ...data,
        content: Array.isArray(data.content) ? data.content.map((item) => normalizeSubscriber(item as Record<string, unknown>)) : [],
    }
}

export async function fetchSubscriber(id: number): Promise<Subscriber> {
    const response = await fetch(buildUrl(`/${id}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load subscriber')
    }

    const data = await response.json()
    return normalizeSubscriber(data)
}

export async function createSubscriber(payload: SubscriberPayload): Promise<Subscriber> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Unable to create subscriber: ${errorText}`)
    }

    const data = await response.json()
    return normalizeSubscriber(data)
}

export async function updateSubscriber(id: number, payload: SubscriberPayload): Promise<Subscriber> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Unable to update subscriber: ${errorText}`)
    }

    const data = await response.json()
    return normalizeSubscriber(data)
}

export async function deleteSubscriber(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Unable to delete subscriber: ${errorText}`)
    }
}

function normalizeFamilyTreeMember(item: Record<string, unknown>): FamilyTreeMember {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        fullNameEn: String(item['fullNameEn'] ?? ''),
        fullNameAr: item['fullNameAr'] ? String(item['fullNameAr']) : null,
        relationType: item['relationType'] ? String(item['relationType']) : null,
        isHeadOfFamily: Boolean(item['isHeadOfFamily'] ?? false),
        dateOfBirth: Array.isArray(item['dateOfBirth']) 
            ? item['dateOfBirth'] as [number, number, number]
            : parseDate(item['dateOfBirth']),
        gender: String(item['gender'] ?? ''),
        nationalId: String(item['nationalId'] ?? ''),
    }
}

export async function fetchFamilyTree(subscriberId: number): Promise<FamilyTreeResponse> {
    const response = await fetch(buildUrl(`/${subscriberId}/family-tree`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load family tree')
    }

    const data = await response.json()
    return {
        hof: normalizeFamilyTreeMember(data.hof || {}),
        dependents: Array.isArray(data.dependents) 
            ? data.dependents.map((item: Record<string, unknown>) => normalizeFamilyTreeMember(item))
            : [],
    }
}

