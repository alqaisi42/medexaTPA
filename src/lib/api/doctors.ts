import { Doctor, CreateDoctorPayload, UpdateDoctorPayload, PaginatedResponse } from '@/types/doctor'

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, '') ?? ''
const BASE_PATH = '/api/doctors'

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

function parseDateTime(value: unknown): string | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return new Date(value * 1000).toISOString()
    }

    if (typeof value === 'string' && value.trim().length > 0) {
        return value
    }

    return null
}

function normalizeDoctor(item: Record<string, unknown>): Doctor {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        code: String(item['code'] ?? ''),
        nameEn: String(item['nameEn'] ?? item['name_en'] ?? ''),
        nameAr: String(item['nameAr'] ?? item['name_ar'] ?? ''),
        gender: String(item['gender'] ?? ''),
        specialtyId: typeof item['specialtyId'] === 'number' ? item['specialtyId'] : Number(item['specialtyId']) || 0,
        specialtyCode: String(item['specialtyCode'] ?? item['specialty_code'] ?? ''),
        specialtyNameEn: String(item['specialtyNameEn'] ?? item['specialty_name_en'] ?? ''),
        isActive: Boolean(item['isActive'] ?? item['is_active'] ?? true),
        licenseNumber: String(item['licenseNumber'] ?? item['license_number'] ?? ''),
        licenseAuthority: String(item['licenseAuthority'] ?? item['license_authority'] ?? ''),
        licenseExpiry: item['licenseExpiry'] ?? item['license_expiry'] ?? null,
        createdAt: parseDateTime(item['createdAt'] ?? item['created_at']),
        updatedAt: parseDateTime(item['updatedAt'] ?? item['updated_at']),
    }
}

export interface FetchDoctorsParams {
    page?: number
    size?: number
    name?: string
}

export async function fetchDoctors(params: FetchDoctorsParams = {}): Promise<PaginatedResponse<Doctor>> {
    const { page = 0, size = 20, name } = params
    const response = await fetch(buildUrl('', { page, size, name }), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load doctors')
    }

    const data: PaginatedResponse<Record<string, unknown>> = await response.json()
    return {
        ...data,
        content: Array.isArray(data.content) ? data.content.map((item) => normalizeDoctor(item)) : [],
    }
}

export async function getDoctorById(id: number): Promise<Doctor> {
    const url = buildUrl(`/${id}`)
    const response = await fetch(url, { cache: 'no-store' })

    if (!response.ok) {
        let errorMessage = 'Unable to load doctor details'
        try {
            const errorData = await response.json()
            if (errorData && typeof errorData === 'object' && 'message' in errorData) {
                errorMessage = String(errorData.message)
            }
        } catch {
            errorMessage = response.statusText || `HTTP ${response.status}: Unable to load doctor details`
        }
        throw new Error(errorMessage)
    }

    const payload = await response.json()
    if (payload && typeof payload === 'object') {
        return normalizeDoctor(payload as Record<string, unknown>)
    }

    return normalizeDoctor({})
}

export async function createDoctor(payload: CreateDoctorPayload): Promise<Doctor> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to create doctor')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizeDoctor(body as Record<string, unknown>)
    }

    return normalizeDoctor({})
}

export async function updateDoctor(id: number, payload: UpdateDoctorPayload): Promise<Doctor> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to update doctor')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizeDoctor(body as Record<string, unknown>)
    }

    return normalizeDoctor({})
}

export async function deleteDoctor(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to delete doctor')
    }
}

