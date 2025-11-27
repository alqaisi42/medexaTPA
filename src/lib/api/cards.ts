import {
    InsuranceCard,
    IssueCardPayload,
    UpdateCardStatusPayload,
    CardInstruction,
    CardInstructionPayload,
    CardInstructionFilters,
    Enrollment,
} from '@/types/card'

const BASE_PATH = '/api/cards'

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

function normalizeInsuranceCard(item: Record<string, unknown>): InsuranceCard {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        enrollmentId: typeof item['enrollmentId'] === 'number' ? item['enrollmentId'] : Number(item['enrollmentId']) || 0,
        enrollment: item['enrollment'] && typeof item['enrollment'] === 'object' ? (item['enrollment'] as unknown as Enrollment) : undefined,
        cardNumber: String(item['cardNumber'] ?? ''),
        versionNo: typeof item['versionNo'] === 'number' ? item['versionNo'] : Number(item['versionNo']) || 0,
        status: String(item['status'] ?? ''),
        issueDate: Array.isArray(item['issueDate'])
            ? (item['issueDate'] as [number, number, number])
            : parseDate(item['issueDate']),
        expiryDate: Array.isArray(item['expiryDate'])
            ? (item['expiryDate'] as [number, number, number])
            : parseDate(item['expiryDate']),
        pdfUrl: item['pdfUrl'] ? String(item['pdfUrl']) : null,
        imageUrl: item['imageUrl'] ? String(item['imageUrl']) : null,
        createdAt: parseTimestamp(item['createdAt']),
        updatedAt: parseTimestamp(item['updatedAt']),
    }
}


export async function fetchCardsByEnrollment(enrollmentId: number): Promise<InsuranceCard[]> {
    const response = await fetch(buildUrl(`/by-enrollment/${enrollmentId}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load cards')
    }

    const data: unknown[] = await response.json()
    return Array.isArray(data) ? data.map((item) => normalizeInsuranceCard(item)) : []
}

export async function issueCard(payload: IssueCardPayload): Promise<InsuranceCard> {
    const response = await fetch(buildUrl('/issue'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Unable to issue card: ${errorText}`)
    }

    const data = await response.json()
    return normalizeInsuranceCard(data)
}

export async function updateCardStatus(cardId: number, payload: UpdateCardStatusPayload): Promise<InsuranceCard> {
    const response = await fetch(buildUrl(`/${cardId}/status`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Unable to update card status: ${errorText}`)
    }

    const data = await response.json()
    return normalizeInsuranceCard(data)
}

// Card Instructions APIs
const INSTRUCTIONS_BASE_PATH = '/api/card-instructions'

function buildInstructionsUrl(params?: Record<string, string | number | boolean | null | undefined>) {
    const searchParams = new URLSearchParams()

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                return
            }
            searchParams.set(key, String(value))
        })
    }

    const query = searchParams.toString()
    return query ? `${INSTRUCTIONS_BASE_PATH}?${query}` : INSTRUCTIONS_BASE_PATH
}

function normalizeCardInstruction(item: Record<string, unknown>): CardInstruction {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        scopeType: String(item['scopeType'] ?? ''),
        scopeId: typeof item['scopeId'] === 'number' ? item['scopeId'] : Number(item['scopeId']) || 0,
        language: String(item['language'] ?? ''),
        title: String(item['title'] ?? ''),
        body: String(item['body'] ?? ''),
        priority: typeof item['priority'] === 'number' ? item['priority'] : Number(item['priority']) || 0,
        isActive: Boolean(item['isActive'] ?? true),
        effectiveFrom: Array.isArray(item['effectiveFrom'])
            ? (item['effectiveFrom'] as [number, number, number])
            : parseDate(item['effectiveFrom']),
        effectiveTo: Array.isArray(item['effectiveTo'])
            ? (item['effectiveTo'] as [number, number, number])
            : parseDate(item['effectiveTo']),
        createdAt: parseTimestamp(item['createdAt']),
        updatedAt: parseTimestamp(item['updatedAt']),
    }
}

export async function fetchCardInstructions(filters: CardInstructionFilters = {}): Promise<CardInstruction[]> {
    const params: Record<string, string | number> = {}

    if (filters.scopeType) params.scopeType = filters.scopeType
    // Only include scopeId if provided (GLOBAL scope doesn't need it)
    if (filters.scopeId !== undefined && filters.scopeId !== null) {
        params.scopeId = filters.scopeId
    }
    if (filters.language) params.language = filters.language

    const response = await fetch(buildInstructionsUrl(params), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load card instructions')
    }

    const data: unknown[] = await response.json()
    return Array.isArray(data) ? data.map((item) => normalizeCardInstruction(item)) : []
}

export async function createCardInstruction(payload: CardInstructionPayload): Promise<CardInstruction> {
    const response = await fetch(INSTRUCTIONS_BASE_PATH, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Unable to create card instruction: ${errorText}`)
    }

    const data = await response.json()
    return normalizeCardInstruction(data)
}

