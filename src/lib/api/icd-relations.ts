import {
    ApiResponse,
    CreateIcdRelationPayload,
    IcdRelation,
    IcdRelationType,
    ICD,
    PaginatedResponse,
} from '@/types'

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, '') ?? ''
const RELATIONS_API_BASE_PATH = API_BASE_URL ? '/api/v1' : '/api'

const headers = {
    'Content-Type': 'application/json',
}

function buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
) {
    const searchParams = new URLSearchParams()

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, String(value))
            }
        })
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const fullPath = `${RELATIONS_API_BASE_PATH}${normalizedPath}`
    const base = API_BASE_URL ? `${API_BASE_URL}${fullPath}` : fullPath
    const query = searchParams.toString()

    return query ? `${base}?${query}` : base
}

async function handleResponse<T>(response: Response): Promise<T | undefined> {
    if (!response.ok) {
        throw new Error('Unable to communicate with ICD relations service')
    }

    const payload: ApiResponse<T> = await response.json()
    if (!payload.success) {
        throw new Error(payload.message || 'ICD relations service responded with an error')
    }

    return payload.data as T | undefined
}

export interface FetchIcdRelationsParams {
    page?: number
    size?: number
}

export async function fetchIcdRelations(
    { page = 0, size = 10 }: FetchIcdRelationsParams = {}
): Promise<PaginatedResponse<IcdRelation>> {
    const url = buildUrl('/icd-relations', { page, size })
    const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store',
    })

    const data = await handleResponse<PaginatedResponse<IcdRelation>>(response)
    if (!data) {
        throw new Error('ICD relations service returned an empty payload')
    }

    return data
}

export async function fetchIcdRelationsByIcd(
    icdId: number,
    { page = 0, size = 10 }: FetchIcdRelationsParams = {}
): Promise<PaginatedResponse<IcdRelation>> {
    const url = buildUrl(`/icd-relations/icd/${icdId}`, { page, size })
    const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store',
    })

    const data = await handleResponse<PaginatedResponse<IcdRelation>>(response)
    if (!data) {
        throw new Error('ICD relations service returned an empty payload for ICD relations')
    }

    return data
}

export async function fetchIcdNeighbors(icdId: number): Promise<ICD[]> {
    const url = buildUrl(`/icd-relations/neighbors/${icdId}`)
    const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store',
    })

    const data = await handleResponse<ICD[]>(response)
    return data ?? []
}

export async function fetchIcdRelationTypes(): Promise<IcdRelationType[]> {
    const url = buildUrl('/icd-relation-types')
    const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store',
    })

    const data = await handleResponse<IcdRelationType[]>(response)
    return data ?? []
}

export async function createIcdRelation(payload: CreateIcdRelationPayload): Promise<IcdRelation> {
    const url = buildUrl('/icd-relations')
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    })

    const data = await handleResponse<IcdRelation>(response)
    if (!data) {
        throw new Error('ICD relations service returned an empty payload on creation')
    }

    return data
}

export async function deleteIcdRelation(relationId: number): Promise<void> {
    const url = buildUrl(`/icd-relations/${relationId}`)
    const response = await fetch(url, {
        method: 'DELETE',
        headers,
    })

    await handleResponse<null>(response)
}
