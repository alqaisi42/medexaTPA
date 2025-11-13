import { ApiResponse, ICD, IcdPayload, PaginatedResponse } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'

const headers = {
    'Content-Type': 'application/json',
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
    const url = new URL(path, API_BASE_URL)
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, String(value))
            }
        })
    }
    return url.toString()
}

async function handleResponse<T>(response: Response): Promise<T | undefined> {
    if (!response.ok) {
        throw new Error('Unable to communicate with ICD service')
    }

    const payload: ApiResponse<T> = await response.json()
    if (!payload.success) {
        throw new Error(payload.message || 'ICD service responded with an error')
    }

    return payload.data as T | undefined
}

export interface FetchIcdsParams {
    page?: number
    size?: number
}

export async function fetchIcds({ page = 0, size = 10 }: FetchIcdsParams): Promise<PaginatedResponse<ICD>> {
    const url = buildUrl('/api/v1/icd-codes', { page, size })
    const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store',
    })

    const data = await handleResponse<PaginatedResponse<ICD>>(response)
    if (!data) {
        throw new Error('ICD service returned an empty payload')
    }
    return data
}

export async function searchIcds(keyword: string): Promise<ICD[]> {
    const url = buildUrl('/api/v1/icd-codes/search', { keyword })
    const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store',
    })

    const data = await handleResponse<ICD[]>(response)
    if (!data) {
        return []
    }
    return data
}

export async function createIcd(payload: IcdPayload): Promise<ICD> {
    const url = buildUrl('/api/v1/icd-codes')
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    })

    const data = await handleResponse<ICD>(response)
    if (!data) {
        throw new Error('ICD service returned an empty payload on creation')
    }
    return data
}

export async function updateIcd(id: number, payload: IcdPayload): Promise<ICD> {
    const url = buildUrl(`/api/v1/icd-codes/${id}`)
    const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
    })

    const data = await handleResponse<ICD>(response)
    if (!data) {
        throw new Error('ICD service returned an empty payload on update')
    }
    return data
}

export async function deleteIcd(id: number): Promise<void> {
    const url = buildUrl(`/api/v1/icd-codes/${id}`)
    const response = await fetch(url, {
        method: 'DELETE',
        headers,
    })

    await handleResponse<null>(response)
}
