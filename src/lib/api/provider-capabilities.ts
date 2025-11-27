import { ProviderCapabilities, ProviderCapabilitiesPayload } from '@/types/provider'

const BASE_PATH = '/api/providers/capabilities'

function buildUrl(path: string = '') {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const finalPath = `${BASE_PATH}${normalizedPath === '/' ? '' : normalizedPath}`
    return finalPath
}

function normalizeCapabilities(item: Record<string, unknown>): ProviderCapabilities {
    return {
        providerId: typeof item['providerId'] === 'number' ? item['providerId'] : Number(item['providerId']) || 0,
        hasEmergency: Boolean(item['hasEmergency'] ?? false),
        hasIcu: Boolean(item['hasIcu'] ?? false),
        hasNicU: Boolean(item['hasNicU'] ?? false),
        hasOrRooms: Boolean(item['hasOrRooms'] ?? false),
        hasLab: Boolean(item['hasLab'] ?? false),
        hasRadiology: Boolean(item['hasRadiology'] ?? false),
        hasMri: Boolean(item['hasMri'] ?? false),
        hasCt: Boolean(item['hasCt'] ?? false),
        hasXray: Boolean(item['hasXray'] ?? false),
        hasUltrasound: Boolean(item['hasUltrasound'] ?? false),
        canPrescribeMedication: Boolean(item['canPrescribeMedication'] ?? false),
        canAdmitPatients: Boolean(item['canAdmitPatients'] ?? false),
        requiresReferral: Boolean(item['requiresReferral'] ?? false),
        notes: item['notes'] ? String(item['notes']) : null,
    }
}

export async function fetchProviderCapabilities(providerId: number): Promise<ProviderCapabilities> {
    const response = await fetch(buildUrl(`/${providerId}`), { cache: 'no-store' })

    if (!response.ok) {
        if (response.status === 404) {
            // Return default capabilities if not found
            return {
                providerId,
                hasEmergency: false,
                hasIcu: false,
                hasNicU: false,
                hasOrRooms: false,
                hasLab: false,
                hasRadiology: false,
                hasMri: false,
                hasCt: false,
                hasXray: false,
                hasUltrasound: false,
                canPrescribeMedication: false,
                canAdmitPatients: false,
                requiresReferral: false,
                notes: null,
            }
        }
        throw new Error('Unable to load provider capabilities')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizeCapabilities(body as Record<string, unknown>)
    }

    return normalizeCapabilities({ providerId })
}

export async function saveProviderCapabilities(payload: ProviderCapabilitiesPayload): Promise<ProviderCapabilities> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to save provider capabilities')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizeCapabilities(body as Record<string, unknown>)
    }

    return normalizeCapabilities({ providerId: payload.providerId })
}

