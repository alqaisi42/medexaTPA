import {
    ApiResponse,
    CreateIcdProcedureSeverityPayload,
    CreateProcedureIcdCategoryPayload,
    IcdProcedureSeverity,
    ProcedureIcdCategoryMapping,
} from '@/types'

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '')
    ?? process.env.API_BASE_URL?.replace(/\/$/, '')
    ?? ''
const PROCEDURE_CATEGORY_API_BASE = API_BASE_URL ? '/api/v1' : '/api'
const ICD_SEVERITY_API_BASE = API_BASE_URL ? '/api/v1' : '/api'

const headers = {
    'Content-Type': 'application/json',
}

function buildUrl(basePath: string, path: string, params?: Record<string, string | number | boolean | undefined>) {
    const searchParams = new URLSearchParams()

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, String(value))
            }
        })
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const fullPath = `${basePath}${normalizedPath}`
    const base = API_BASE_URL ? `${API_BASE_URL}${fullPath}` : fullPath
    const query = searchParams.toString()

    return query ? `${base}?${query}` : base
}

async function parsePayload<T>(response: Response, errorMessage: string): Promise<T> {
    if (!response.ok) {
        throw new Error(errorMessage)
    }

    const text = await response.text()
    if (!text) {
        return {} as T
    }

    try {
        const parsed = JSON.parse(text)
        if (parsed && typeof parsed === 'object' && 'success' in parsed) {
            const payload = parsed as ApiResponse<T>
            if (!payload.success) {
                throw new Error(payload.message || errorMessage)
            }
            if (payload.data !== undefined && payload.data !== null) {
                return payload.data
            }
        }

        return parsed as T
    } catch {
        throw new Error(errorMessage)
    }
}

export async function fetchProcedureIcdCategoryMappings(procedureId: number): Promise<ProcedureIcdCategoryMapping[]> {
    const url = buildUrl(PROCEDURE_CATEGORY_API_BASE, `/procedure-icd-category/${procedureId}`)
    const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store',
    })

    return await parsePayload<ProcedureIcdCategoryMapping[]>(response, 'Unable to load procedure ICD categories')
}

export async function createProcedureIcdCategoryMapping(
    payload: CreateProcedureIcdCategoryPayload,
): Promise<ProcedureIcdCategoryMapping> {
    const url = buildUrl(PROCEDURE_CATEGORY_API_BASE, '/procedure-icd-category')
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    })

    return await parsePayload<ProcedureIcdCategoryMapping>(response, 'Unable to create procedure ICD category mapping')
}

export async function deleteProcedureIcdCategoryMapping(mappingId: number): Promise<void> {
    const url = buildUrl(PROCEDURE_CATEGORY_API_BASE, `/procedure-icd-category/${mappingId}`)
    const response = await fetch(url, {
        method: 'DELETE',
        headers,
    })

    await parsePayload<unknown>(response, 'Unable to delete procedure ICD category mapping')
}

export async function fetchIcdProcedureSeverities(): Promise<IcdProcedureSeverity[]> {
    const url = buildUrl(ICD_SEVERITY_API_BASE, '/icd-procedure-severity')
    const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store',
    })

    return await parsePayload<IcdProcedureSeverity[]>(response, 'Unable to load ICD procedure severities')
}

export async function fetchIcdProcedureSeverity(
    procedureId: number,
    icdCategoryId: number,
    relationType: string,
): Promise<IcdProcedureSeverity> {
    const url = buildUrl(
        ICD_SEVERITY_API_BASE,
        `/icd-procedure-severity/procedure/${procedureId}/icd/${icdCategoryId}/severity/${relationType}`,
    )

    const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store',
    })

    return await parsePayload<IcdProcedureSeverity>(response, 'Unable to load ICD procedure severity')
}

export async function createIcdProcedureSeverity(
    payload: CreateIcdProcedureSeverityPayload,
): Promise<IcdProcedureSeverity> {
    const url = buildUrl(ICD_SEVERITY_API_BASE, '/icd-procedure-severity')
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    })

    return await parsePayload<IcdProcedureSeverity>(response, 'Unable to create ICD procedure severity')
}
