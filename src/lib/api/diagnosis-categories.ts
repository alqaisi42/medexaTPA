import {
    ApiResponse,
    DiagnosisCategory,
    DiagnosisCategoryPayload,
    IcdCategoryMap,
    PaginatedResponse,
} from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? ''
const API_BASE_PATH = API_BASE_URL ? '/api/v1' : '/api'

const defaultHeaders = {
    'Content-Type': 'application/json',
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
    const searchParams = new URLSearchParams()

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, String(value))
            }
        })
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const fullPath = `${API_BASE_PATH}${normalizedPath}`
    const base = API_BASE_URL ? `${API_BASE_URL}${fullPath}` : fullPath
    const query = searchParams.toString()

    return query ? `${base}?${query}` : base
}

async function handleResponse<T>(response: Response): Promise<T | undefined> {
    if (!response.ok) {
        throw new Error('Diagnosis categories service is unavailable at the moment')
    }

    const payload: ApiResponse<T> = await response.json()
    if (!payload.success) {
        throw new Error(payload.message || 'Diagnosis categories service responded with an error')
    }

    return payload.data as T | undefined
}

export interface FetchDiagnosisCategoriesParams {
    page?: number
    size?: number
}

export async function fetchDiagnosisCategories({
    page = 0,
    size = 10,
}: FetchDiagnosisCategoriesParams): Promise<PaginatedResponse<DiagnosisCategory>> {
    const url = buildUrl('/diagnosis-categories', { page, size })
    const response = await fetch(url, {
        method: 'GET',
        headers: defaultHeaders,
        cache: 'no-store',
    })

    const data = await handleResponse<PaginatedResponse<DiagnosisCategory>>(response)
    if (!data) {
        throw new Error('Diagnosis categories service returned an empty payload')
    }

    return data
}

export async function fetchDiagnosisCategoryByName(name: string): Promise<DiagnosisCategory | null> {
    const normalizedName = name.trim()
    if (!normalizedName) {
        return null
    }

    const url = buildUrl(`/diagnosis-categories/name/${encodeURIComponent(normalizedName)}`)
    const response = await fetch(url, {
        method: 'GET',
        headers: defaultHeaders,
        cache: 'no-store',
    })

    try {
        const data = await handleResponse<DiagnosisCategory>(response)
        return data ?? null
    } catch (error) {
        if (error instanceof Error && error.message.includes('error')) {
            throw error
        }
        return null
    }
}

export async function createDiagnosisCategory(payload: DiagnosisCategoryPayload): Promise<DiagnosisCategory> {
    const url = buildUrl('/diagnosis-categories')
    const response = await fetch(url, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(payload),
    })

    const data = await handleResponse<DiagnosisCategory>(response)
    if (!data) {
        throw new Error('Diagnosis categories service returned an empty payload on creation')
    }

    return data
}

export async function updateDiagnosisCategory(payload: DiagnosisCategoryPayload & { id: number }): Promise<DiagnosisCategory> {
    const url = buildUrl('/diagnosis-categories')
    const response = await fetch(url, {
        method: 'PUT',
        headers: defaultHeaders,
        body: JSON.stringify(payload),
    })

    const data = await handleResponse<DiagnosisCategory>(response)
    if (!data) {
        throw new Error('Diagnosis categories service returned an empty payload on update')
    }

    return data
}

export async function deleteDiagnosisCategory(id: number): Promise<void> {
    const url = buildUrl(`/diagnosis-categories/${id}`)
    const response = await fetch(url, {
        method: 'DELETE',
        headers: defaultHeaders,
    })

    await handleResponse<null>(response)
}

export async function addIcdToCategory(categoryId: number, icdId: number): Promise<IcdCategoryMap> {
    const url = buildUrl('/icd-category-maps/add', { categoryId, icdId })
    const response = await fetch(url, {
        method: 'POST',
        headers: defaultHeaders,
    })

    const data = await handleResponse<IcdCategoryMap>(response)
    if (!data) {
        throw new Error('Unable to add ICD to the selected category')
    }

    return data
}

export interface FetchIcdCategoryMappingsParams {
    icdId: number
    page?: number
    size?: number
}

export async function fetchIcdCategoryMappings({
    icdId,
    page = 0,
    size = 10,
}: FetchIcdCategoryMappingsParams): Promise<PaginatedResponse<IcdCategoryMap>> {
    const url = buildUrl(`/icd-category-maps/icd/${icdId}`, { page, size })
    const response = await fetch(url, {
        method: 'GET',
        headers: defaultHeaders,
        cache: 'no-store',
    })

    const data = await handleResponse<PaginatedResponse<IcdCategoryMap>>(response)
    if (!data) {
        throw new Error('Unable to retrieve ICD to category mappings')
    }

    return data
}

export async function removeIcdFromCategory(categoryId: number, icdId: number): Promise<void> {
    const url = buildUrl('/icd-category-maps/remove', { categoryId, icdId })
    const response = await fetch(url, {
        method: 'DELETE',
        headers: defaultHeaders,
    })

    await handleResponse<null>(response)
}
