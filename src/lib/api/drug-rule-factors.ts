import { DrugRuleFactor, DrugRuleFactorPayload } from '@/types'

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, '') ?? ''
const API_PREFIX = API_BASE_URL ? '/api/v1' : '/api'
const BASE_PATH = `${API_PREFIX}/drug-rule-factors`

function buildUrl(path: string = '') {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const fullPath = `${BASE_PATH}${normalizedPath === '/' ? '' : normalizedPath}`
    return API_BASE_URL ? `${API_BASE_URL}${fullPath}` : fullPath
}

function normalizeFactor(item: Record<string, unknown>): DrugRuleFactor {
    return {
        code: String(item['code'] ?? ''),
        description: String(item['description'] ?? ''),
    }
}

async function parseJsonResponse(response: Response) {
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
        return response.json()
    }
    const text = await response.text()
    return text ? JSON.parse(text) : null
}

async function ensureOk(response: Response, fallbackMessage: string) {
    if (!response.ok) {
        try {
            const body = await parseJsonResponse(response)
            if (body && typeof body === 'object' && 'message' in body) {
                throw new Error(String(body.message))
            }
        } catch (error) {
            if (error instanceof Error) {
                throw error
            }
        }
        throw new Error(fallbackMessage)
    }
}

export async function fetchDrugRuleFactors(): Promise<DrugRuleFactor[]> {
    const response = await fetch(buildUrl(), { cache: 'no-store' })
    await ensureOk(response, 'Unable to load drug rule factors')
    const body = await response.json()
    if (Array.isArray(body)) {
        return body.map((item) => normalizeFactor(item as Record<string, unknown>))
    }
    return []
}

export async function createDrugRuleFactor(payload: DrugRuleFactorPayload): Promise<DrugRuleFactor> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    await ensureOk(response, 'Unable to create drug rule factor')
    const body = await response.json()
    return normalizeFactor(body as Record<string, unknown>)
}
