import {
    ApiResponse,
    CreateIcdComplicationPayload,
    DeleteIcdComplicationPayload,
    IcdComplication,
} from '@/types'

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, '') ?? ''
const ICD_API_BASE_PATH = API_BASE_URL ? '/api/v1' : '/api'

const headers = {
    'Content-Type': 'application/json',
}

function buildUrl(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const fullPath = `${ICD_API_BASE_PATH}${normalizedPath}`
    return API_BASE_URL ? `${API_BASE_URL}${fullPath}` : fullPath
}

function isApiResponse<T>(payload: unknown): payload is ApiResponse<T> {
    return Boolean(payload && typeof payload === 'object' && 'success' in payload)
}

async function handleResponse<T>(response: Response): Promise<T | undefined> {
    if (!response.ok) {
        throw new Error('Unable to communicate with ICD complications service')
    }

    const payload = await response.json()

    if (isApiResponse<T>(payload)) {
        if (!payload.success) {
            throw new Error(payload.message || 'ICD complications service responded with an error')
        }
        return payload.data as T | undefined
    }

    return payload as T | undefined
}

export async function fetchIcdComplications(sourceIcdId: number): Promise<IcdComplication[]> {
    const url = buildUrl(`/icd/complications/${sourceIcdId}`)
    const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store',
    })

    const data = await handleResponse<IcdComplication[]>(response)
    return data ?? []
}

export async function createIcdComplication(payload: CreateIcdComplicationPayload): Promise<IcdComplication> {
    const url = buildUrl('/icd/complications')
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    })

    const data = await handleResponse<IcdComplication>(response)
    if (!data) {
        throw new Error('ICD complications service returned an empty payload on creation')
    }

    return data
}

export async function deleteIcdComplication(payload: DeleteIcdComplicationPayload): Promise<void> {
    const url = buildUrl('/icd/complications')
    const response = await fetch(url, {
        method: 'DELETE',
        headers,
        body: JSON.stringify(payload),
    })

    await handleResponse<null>(response)
}

