import { Department, PaginatedResponse } from '@/types/department'

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, '') ?? ''
const BASE_PATH = '/api/departments'

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
    const baseUrl = API_BASE_URL ? `${API_BASE_URL}${finalPath}` : finalPath
    const query = searchParams.toString()

    return query ? `${baseUrl}?${query}` : baseUrl
}

function normalizeDepartment(item: Record<string, unknown>): Department {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        code: String(item['code'] ?? ''),
        nameEn: String(item['nameEn'] ?? item['name_en'] ?? ''),
        nameAr: String(item['nameAr'] ?? item['name_ar'] ?? ''),
        isActive: Boolean(item['isActive'] ?? item['is_active'] ?? true),
    }
}

export interface FetchDepartmentsParams {
    page?: number
    size?: number
    name?: string
}

export async function fetchDepartments(params: FetchDepartmentsParams = {}): Promise<PaginatedResponse<Department>> {
    const { page = 0, size = 20 } = params
    const response = await fetch(buildUrl('', { page, size }), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load departments')
    }

    const data: PaginatedResponse<Record<string, unknown>> = await response.json()
    return {
        ...data,
        content: Array.isArray(data.content) ? data.content.map((item) => normalizeDepartment(item)) : [],
    }
}

export interface CreateDepartmentPayload {
    code: string
    nameEn: string
    nameAr: string
}

export async function createDepartment(payload: CreateDepartmentPayload): Promise<Department> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to create department')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizeDepartment(body as Record<string, unknown>)
    }

    return normalizeDepartment({})
}

export interface UpdateDepartmentPayload {
    nameEn: string
    nameAr: string
    isActive: boolean
}

export async function updateDepartment(id: number, payload: UpdateDepartmentPayload): Promise<Department> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to update department')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizeDepartment(body as Record<string, unknown>)
    }

    return normalizeDepartment({})
}

export async function deactivateDepartment(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}/deactivate`), {
        method: 'POST',
    })

    if (!response.ok) {
        throw new Error('Unable to deactivate department')
    }
}

export async function deleteDepartment(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to delete department')
    }
}

