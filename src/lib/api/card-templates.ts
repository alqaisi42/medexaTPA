import {
    CardTemplate,
    CardTemplatePayload,
    CardTemplateUpdatePayload,
    CardTemplateListResponse,
    CardTemplateResponse,
} from '@/types/card-template'

const CARD_TEMPLATES_BASE_PATH = '/api/plans'

function buildUrl(basePath: string, path: string = '', params?: Record<string, string | number | boolean | null | undefined>) {
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
    const finalPath = `${basePath}${normalizedPath === '/' ? '' : normalizedPath}`
    const query = searchParams.toString()

    return query ? `${finalPath}?${query}` : finalPath
}

// Fetch card templates for a plan
export async function fetchCardTemplates(
    planId: number,
    params?: {
        page?: number
        size?: number
    }
): Promise<CardTemplate[]> {
    const searchParams = new URLSearchParams()
    
    if (params?.page !== undefined) {
        searchParams.append('page', params.page.toString())
    }
    if (params?.size !== undefined) {
        searchParams.append('size', params.size.toString())
    }

    const url = buildUrl(CARD_TEMPLATES_BASE_PATH, `/${planId}/card-templates`, Object.fromEntries(searchParams))
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error('Failed to fetch card templates')
    }

    const data: CardTemplateListResponse = await response.json()
    return data.data.content
}

// Get card template by ID
export async function getCardTemplate(planId: number, templateId: number): Promise<CardTemplate> {
    const response = await fetch(buildUrl(CARD_TEMPLATES_BASE_PATH, `/${planId}/card-templates/${templateId}`))

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to get card template:', response.status, errorText)
        throw new Error(`Unable to get card template: ${response.status} ${response.statusText}`)
    }

    try {
        const data: CardTemplateResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse card template response:', parseError)
        throw new Error('Unable to parse card template response')
    }
}

// Create new card template
export async function createCardTemplate(
    planId: number,
    template: CardTemplatePayload
): Promise<CardTemplate> {
    const response = await fetch(buildUrl(CARD_TEMPLATES_BASE_PATH, `/${planId}/card-templates`), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to create card template:', response.status, errorText)
        throw new Error(`Unable to create card template: ${response.status} ${response.statusText}`)
    }

    try {
        const data: CardTemplateResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse create template response:', parseError)
        throw new Error('Unable to parse create template response')
    }
}

// Update card template
export async function updateCardTemplate(
    planId: number,
    templateId: number,
    template: CardTemplateUpdatePayload
): Promise<CardTemplate> {
    const response = await fetch(buildUrl(CARD_TEMPLATES_BASE_PATH, `/${planId}/card-templates/${templateId}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to update card template:', response.status, errorText)
        throw new Error(`Unable to update card template: ${response.status} ${response.statusText}`)
    }

    try {
        const data: CardTemplateResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse update template response:', parseError)
        throw new Error('Unable to parse template update response')
    }
}

// Delete card template
export async function deleteCardTemplate(planId: number, templateId: number): Promise<void> {
    const response = await fetch(buildUrl(CARD_TEMPLATES_BASE_PATH, `/${planId}/card-templates/${templateId}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to delete card template')
    }
}

// Set template as default
export async function setDefaultTemplate(planId: number, templateId: number): Promise<CardTemplate> {
    const response = await fetch(buildUrl(CARD_TEMPLATES_BASE_PATH, `/${planId}/card-templates/${templateId}/set-default`), {
        method: 'POST',
        body: '',
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to set default template:', response.status, errorText)
        throw new Error(`Unable to set default template: ${response.status} ${response.statusText}`)
    }

    try {
        const data: CardTemplateResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse set default response:', parseError)
        throw new Error('Unable to parse set default response')
    }
}
