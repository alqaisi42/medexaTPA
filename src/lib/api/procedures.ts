import {
    ApiResponse,
    CreateProcedurePayload,
    ProcedureCategoryRecord,
    ProcedureCategoryResponse,
    ProcedureDetails,
    ProcedureListResponse,
    ProcedureSearchFilters,
    ProcedureSearchResponse,
    ProcedureSummary,
} from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? ''
const PROCEDURES_API_BASE_PATH = API_BASE_URL ? '/api/v1' : '/api'

const headers = {
    'Content-Type': 'application/json',
}

function buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>,
) {
    const searchParams = new URLSearchParams()

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') {
                return
            }
            searchParams.set(key, String(value))
        })
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const fullPath = `${PROCEDURES_API_BASE_PATH}${normalizedPath}`
    const base = API_BASE_URL ? `${API_BASE_URL}${fullPath}` : fullPath
    const query = searchParams.toString()

    return query ? `${base}?${query}` : base
}

async function handleResponse<T>(response: Response, errorMessage: string): Promise<T> {
    if (!response.ok) {
        throw new Error(errorMessage)
    }

    const payload: ApiResponse<T> = await response.json()
    if (!payload.success) {
        throw new Error(payload.message || errorMessage)
    }

    if (payload.data === undefined || payload.data === null) {
        throw new Error('Procedures service returned an empty payload')
    }

    return payload.data
}

function hasActiveSearch(filters: ProcedureSearchFilters): boolean {
    return Object.entries(filters).some(([key, rawValue]) => {
        if (key === 'minPrice' || key === 'maxPrice' || key === 'categoryId' || key === 'containerId') {
            return rawValue !== null && rawValue !== undefined
        }

        if (typeof rawValue === 'boolean') {
            return true
        }

        if (rawValue === null || rawValue === undefined) {
            return false
        }

        if (typeof rawValue === 'string') {
            return rawValue.trim().length > 0
        }

        return true
    })
}

function buildSearchPayload(filters: ProcedureSearchFilters): Record<string, unknown> {
    const payload: Record<string, unknown> = {}

    if (filters.keyword && filters.keyword.trim()) {
        payload.keyword = filters.keyword.trim()
    }
    if (filters.systemCode && filters.systemCode.trim()) {
        payload.systemCode = filters.systemCode.trim()
    }
    if (filters.isSurgical !== null && filters.isSurgical !== undefined) {
        payload.isSurgical = filters.isSurgical
    }
    if (filters.requiresAuthorization !== null && filters.requiresAuthorization !== undefined) {
        payload.requiresAuthorization = filters.requiresAuthorization
    }
    if (filters.requiresAnesthesia !== null && filters.requiresAnesthesia !== undefined) {
        payload.requiresAnesthesia = filters.requiresAnesthesia
    }
    if (filters.isActive !== null && filters.isActive !== undefined) {
        payload.isActive = filters.isActive
    }
    if (typeof filters.minPrice === 'number') {
        payload.minPrice = filters.minPrice
    }
    if (typeof filters.maxPrice === 'number') {
        payload.maxPrice = filters.maxPrice
    }
    if (filters.validOn && filters.validOn.trim()) {
        payload.validOn = filters.validOn
    }
    if (typeof filters.categoryId === 'number') {
        payload.categoryId = filters.categoryId
    }
    if (typeof filters.containerId === 'number') {
        payload.containerId = filters.containerId
    }

    return payload
}

export interface FetchProceduresParams {
    page?: number
    size?: number
}

export async function fetchProcedures({ page = 0, size = 10 }: FetchProceduresParams): Promise<ProcedureListResponse> {
    const url = buildUrl('/procedures', { page, size })
    const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store',
    })

    return handleResponse<ProcedureListResponse>(response, 'Unable to load procedures')
}

export interface SearchProceduresParams extends FetchProceduresParams {
    filters: ProcedureSearchFilters
}

export async function searchProcedures({
    filters,
    page = 0,
    size = 10,
}: SearchProceduresParams): Promise<ProcedureSearchResponse> {
    const url = buildUrl('/procedures/search', { page, size })
    const payload = buildSearchPayload(filters)

    if (!hasActiveSearch(filters)) {
        return fetchProcedures({ page, size })
    }

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    })

    return handleResponse<ProcedureSearchResponse>(response, 'Unable to search procedures')
}

export async function createProcedure(payload: CreateProcedurePayload): Promise<ProcedureDetails> {
    const url = buildUrl('/procedures')
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    })

    return handleResponse<ProcedureDetails>(response, 'Unable to create procedure')
}

export async function fetchProcedureCategories({
    page = 0,
    size = 50,
}: FetchProceduresParams = {}): Promise<ProcedureCategoryResponse> {
    const url = buildUrl('/procedures/categories', { page, size })
    const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store',
    })

    return handleResponse<ProcedureCategoryResponse>(response, 'Unable to load procedure categories')
}

export async function getProcedureDetails(id: number): Promise<ProcedureDetails> {
    const url = buildUrl(`/procedures/${id}/details`)
    const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store',
    })

    return handleResponse<ProcedureDetails>(response, 'Unable to load procedure details')
}

export type { ProcedureSummary }
