import {
    DrugRule,
    DrugRuleCondition,
    DrugRuleEvaluationRequest,
    DrugRuleEvaluationResponse,
    DrugRulePayload,
} from '@/types'

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, '') ?? ''
const API_PREFIX = API_BASE_URL ? '/api/v1' : '/api'
const BASE_PATH = `${API_PREFIX}/drug-rules`

function buildUrl(path: string = '') {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const fullPath = `${BASE_PATH}${normalizedPath === '/' ? '' : normalizedPath}`
    return API_BASE_URL ? `${API_BASE_URL}${fullPath}` : fullPath
}

function parseDate(value: unknown): string | null {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value.slice(0, 10)
    }
    if (Array.isArray(value) && value.length >= 3) {
        const [year, month, day] = value
        if (typeof year === 'number' && typeof month === 'number' && typeof day === 'number') {
            return `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`
        }
    }
    return null
}

function normalizeCondition(item: Record<string, unknown>): DrugRuleCondition {
    const values = Array.isArray(item['values'])
        ? (item['values'] as unknown[]).map((value) => String(value)).filter((value) => value.length > 0)
        : undefined

    return {
        factorCode: String(item['factorCode'] ?? ''),
        operator: String(item['operator'] ?? 'EQUALS') as DrugRuleCondition['operator'],
        valueExact: item['valueExact'] === null || item['valueExact'] === undefined ? null : String(item['valueExact']),
        valueFrom: item['valueFrom'] === null || item['valueFrom'] === undefined ? null : String(item['valueFrom']),
        valueTo: item['valueTo'] === null || item['valueTo'] === undefined ? null : String(item['valueTo']),
        values,
    }
}

function normalizeRule(item: Record<string, unknown>): DrugRule {
    const conditions = Array.isArray(item['conditions'])
        ? (item['conditions'] as Record<string, unknown>[]).map((condition) => normalizeCondition(condition))
        : []

    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        drugPackId: typeof item['drugPackId'] === 'number' ? item['drugPackId'] : Number(item['drugPackId']) || 0,
        ruleType: String(item['ruleType'] ?? 'AGE_ELIGIBILITY') as DrugRule['ruleType'],
        priority: typeof item['priority'] === 'number' ? item['priority'] : Number(item['priority']) || 0,
        maxQuantity: item['maxQuantity'] === null || item['maxQuantity'] === undefined ? null : Number(item['maxQuantity']) || 0,
        adjustmentValue:
            item['adjustmentValue'] === null || item['adjustmentValue'] === undefined
                ? null
                : Number(item['adjustmentValue']) || 0,
        validFrom: parseDate(item['validFrom']),
        validTo: parseDate(item['validTo']),
        isActive: Boolean(item['isActive'] ?? true),
        description: String(item['description'] ?? ''),
        eligibility:
            item['eligibility'] === null || item['eligibility'] === undefined ? null : Boolean(item['eligibility']),
        conditions,
    }
}

function normalizeConditionsPayload(conditions: DrugRuleCondition[]): DrugRuleCondition[] {
    return conditions.map((condition) => {
        const payload: DrugRuleCondition = {
            factorCode: condition.factorCode,
            operator: condition.operator,
            valueExact: condition.valueExact?.trim() ? condition.valueExact : null,
            valueFrom: condition.valueFrom?.trim() ? condition.valueFrom : null,
            valueTo: condition.valueTo?.trim() ? condition.valueTo : null,
        }

        if (condition.values && condition.values.length > 0) {
            payload.values = condition.values
        }

        return payload
    })
}

function buildPayload(payload: DrugRulePayload) {
    const normalized: Record<string, unknown> = {
        drugPackId: payload.drugPackId,
        ruleType: payload.ruleType,
        priority: payload.priority,
        maxQuantity: payload.maxQuantity ?? null,
        adjustmentValue: payload.adjustmentValue ?? null,
        validFrom: payload.validFrom || null,
        validTo: payload.validTo || null,
        description: payload.description,
        conditions: normalizeConditionsPayload(payload.conditions),
    }

    if (typeof payload.eligibility === 'boolean') {
        normalized.eligibility = payload.eligibility
    }

    return normalized
}

async function parseJson(response: Response) {
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
            const body = await parseJson(response)
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

export async function fetchDrugRulesByPack(packId: number, options?: { activeOnly?: boolean }): Promise<DrugRule[]> {
    if (!packId) {
        return []
    }
    const path = options?.activeOnly ? `/by-pack/${packId}/active` : `/by-pack/${packId}`
    const response = await fetch(buildUrl(path), { cache: 'no-store' })
    await ensureOk(response, 'Unable to load drug rules')
    const body = await response.json()
    if (Array.isArray(body)) {
        return body.map((item) => normalizeRule(item as Record<string, unknown>))
    }
    return []
}

export async function getDrugRuleById(id: number): Promise<DrugRule> {
    const response = await fetch(buildUrl(`/${id}`), { cache: 'no-store' })
    await ensureOk(response, 'Unable to load drug rule details')
    const body = await response.json()
    return normalizeRule(body as Record<string, unknown>)
}

export async function createDrugRule(payload: DrugRulePayload): Promise<DrugRule> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(payload)),
    })
    await ensureOk(response, 'Unable to create drug rule')
    const body = await response.json()
    return normalizeRule(body as Record<string, unknown>)
}

export async function updateDrugRule(id: number, payload: DrugRulePayload): Promise<DrugRule> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(payload)),
    })
    await ensureOk(response, 'Unable to update drug rule')
    const body = await response.json()
    return normalizeRule(body as Record<string, unknown>)
}

export async function deactivateDrugRule(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}/deactivate`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
    await ensureOk(response, 'Unable to deactivate drug rule')
}

export async function evaluateDrugRules(
    packId: number,
    payload: DrugRuleEvaluationRequest,
): Promise<DrugRuleEvaluationResponse> {
    const response = await fetch(buildUrl(`/evaluate/${packId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    await ensureOk(response, 'Unable to evaluate drug rules')
    const body = await response.json()
    return {
        eligible: Boolean(body['eligible']),
        reasons: Array.isArray(body['reasons']) ? (body['reasons'] as unknown[]).map((reason) => String(reason)) : [],
        priceAdjustmentValue:
            body['priceAdjustmentValue'] === null || body['priceAdjustmentValue'] === undefined
                ? null
                : Number(body['priceAdjustmentValue']) || 0,
        maxAllowedQuantity:
            body['maxAllowedQuantity'] === null || body['maxAllowedQuantity'] === undefined
                ? null
                : Number(body['maxAllowedQuantity']) || 0,
        appliedRules: Array.isArray(body['appliedRules'])
            ? (body['appliedRules'] as unknown[]).map((rule) => String(rule))
            : [],
    }
}
