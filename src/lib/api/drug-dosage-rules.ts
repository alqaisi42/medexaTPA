import {
    DosageRecommendationRequest,
    DosageRecommendationResponse,
    DosageRule,
    DosageRuleCondition,
    DosageRuleFrequency,
    DosageRulePayload,
} from '@/types'

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, '') ?? ''
const API_PREFIX = API_BASE_URL ? '/api/v1' : '/api'
const DOSAGE_RULES_BASE_PATH = `${API_PREFIX}/drug-rules`
const DRUGS_BASE_PATH = `${API_PREFIX}/drugs`

function buildApiUrl(
    basePath: string,
    path: string = '',
    params?: Record<string, string | number | boolean | null | undefined>,
) {
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
    const baseUrl = API_BASE_URL ? `${API_BASE_URL}${finalPath}` : finalPath
    const query = searchParams.toString()

    return query ? `${baseUrl}?${query}` : baseUrl
}

const buildDosageRuleUrl = (
    path: string = '',
    params?: Record<string, string | number | boolean | null | undefined>,
) => buildApiUrl(DOSAGE_RULES_BASE_PATH, path, params)

const buildDrugsUrl = (path: string = '', params?: Record<string, string | number | boolean | null | undefined>) =>
    buildApiUrl(DRUGS_BASE_PATH, path, params)

function parseDate(value: unknown): string | null {
    if (Array.isArray(value) && value.length >= 3) {
        const [year, month, day] = value
        if (typeof year === 'number' && typeof month === 'number' && typeof day === 'number') {
            const monthString = `${month}`.padStart(2, '0')
            const dayString = `${day}`.padStart(2, '0')
            return `${year}-${monthString}-${dayString}`
        }
    }

    if (typeof value === 'string' && value.trim().length > 0) {
        return value.slice(0, 10)
    }

    return null
}

function parseNullableNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value)
        return Number.isNaN(parsed) ? null : parsed
    }
    return null
}

function toStringOrNull(value: unknown): string | null {
    if (value === null || value === undefined) {
        return null
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : null
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value)
    }

    return null
}

function normalizeCondition(value: Record<string, unknown>): DosageRuleCondition {
    return {
        factorCode: String(value['factorCode'] ?? value['factor_code'] ?? ''),
        operator: String(value['operator'] ?? 'EQUALS') as DosageRuleCondition['operator'],
        valueExact: toStringOrNull(value['valueExact']),
        valueFrom: toStringOrNull(value['valueFrom']),
        valueTo: toStringOrNull(value['valueTo']),
        values: Array.isArray(value['values'])
            ? (value['values'] as unknown[]).map((entry) => String(entry))
            : undefined,
    }
}

function normalizeFrequency(value: Record<string, unknown>): DosageRuleFrequency {
    return {
        frequencyCode: String(value['frequencyCode'] ?? value['frequency'] ?? value['code'] ?? ''),
        timesPerDay: parseNullableNumber(value['timesPerDay'] ?? value['times_per_day']),
        intervalHours: parseNullableNumber(value['intervalHours'] ?? value['interval_hours']),
        timingNotes:
            typeof value['timingNotes'] === 'string'
                ? value['timingNotes']
                : typeof value['description'] === 'string'
                  ? value['description']
                  : null,
        specialInstructions:
            typeof value['specialInstructions'] === 'string' ? value['specialInstructions'] : null,
    }
}

function normalizeDosageRule(value: Record<string, unknown>): DosageRule {
    return {
        id: typeof value['id'] === 'number' ? value['id'] : Number(value['id']) || 0,
        drugPackId: typeof value['drugPackId'] === 'number' ? value['drugPackId'] : Number(value['drugPackId']) || 0,
        ruleName: String(value['ruleName'] ?? value['name'] ?? ''),
        dosageAmount: parseNullableNumber(value['dosageAmount']) ?? 0,
        dosageUnit: String(value['dosageUnit'] ?? value['dosage_unit'] ?? ''),
        notes: typeof value['notes'] === 'string' ? value['notes'] : null,
        priority: parseNullableNumber(value['priority']) ?? 0,
        validFrom: parseDate(value['validFrom']),
        validTo: parseDate(value['validTo']),
        isActive: Boolean(value['isActive'] ?? value['active'] ?? true),
        conditions: Array.isArray(value['conditions'])
            ? (value['conditions'] as Record<string, unknown>[]).map((condition) => normalizeCondition(condition))
            : [],
        frequencies: (
            Array.isArray(value['frequencies'])
                ? (value['frequencies'] as Record<string, unknown>[])
                : Array.isArray(value['frequencyCases'])
                  ? (value['frequencyCases'] as Record<string, unknown>[])
                  : Array.isArray(value['frequency_cases'])
                    ? (value['frequency_cases'] as Record<string, unknown>[])
                    : []
        ).map((frequency) => normalizeFrequency(frequency)),
    }
}

function buildConditionPayload(condition: DosageRuleCondition) {
    return {
        ...condition,
        valueExact: condition.valueExact || null,
        valueFrom: condition.valueFrom || null,
        valueTo: condition.valueTo || null,
        values: condition.values && condition.values.length > 0 ? condition.values : undefined,
    }
}

function buildFrequencyPayload(frequency: DosageRuleFrequency) {
    return {
        ...frequency,
        timesPerDay: frequency.timesPerDay ?? null,
        intervalHours: frequency.intervalHours ?? null,
        timingNotes: frequency.timingNotes || null,
        specialInstructions: frequency.specialInstructions || null,
    }
}

function buildPayload(payload: DosageRulePayload) {
    return {
        ...payload,
        validFrom: payload.validFrom || null,
        validTo: payload.validTo || null,
        notes: payload.notes || null,
        conditions: payload.conditions.map((condition) => buildConditionPayload(condition)),
        frequencies: payload.frequencies.map((frequency) => buildFrequencyPayload(frequency)),
    }
}

export async function fetchDosageRulesByPack(packId: number): Promise<DosageRule[]> {
    const response = await fetch(buildDrugsUrl(`/by-pack/${packId}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load dosage rules')
    }

    const data = await response.json()
    if (Array.isArray(data)) {
        return data.map((item) => normalizeDosageRule(item as Record<string, unknown>))
    }

    return []
}

export async function createDosageRule(payload: DosageRulePayload): Promise<DosageRule> {
    const response = await fetch(buildDosageRuleUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload(payload)),
    })

    if (!response.ok) {
        throw new Error('Unable to create dosage rule')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizeDosageRule(body as Record<string, unknown>)
    }

    return normalizeDosageRule({})
}

export async function updateDosageRule(id: number, payload: DosageRulePayload): Promise<DosageRule> {
    const response = await fetch(buildDosageRuleUrl(`/${id}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload(payload)),
    })

    if (!response.ok) {
        throw new Error('Unable to update dosage rule')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return normalizeDosageRule(body as Record<string, unknown>)
    }

    return normalizeDosageRule({})
}

export async function deleteDosageRule(id: number): Promise<void> {
    const response = await fetch(buildDosageRuleUrl(`/${id}`), { method: 'DELETE' })

    if (!response.ok) {
        throw new Error('Unable to delete dosage rule')
    }
}

export async function deactivateDosageRule(id: number): Promise<void> {
    const response = await fetch(buildDosageRuleUrl(`/${id}/deactivate`), { method: 'POST' })

    if (!response.ok) {
        throw new Error('Unable to deactivate dosage rule')
    }
}

export async function computeDosageRecommendation(
    drugIdOrPackId: number,
    payload: DosageRecommendationRequest,
): Promise<DosageRecommendationResponse> {
    const basePath = API_BASE_URL ? `/api/v1/drugs/${drugIdOrPackId}/dosage/recommendation` : `/api/drugs/${drugIdOrPackId}/dosage/recommendation`
    const response = await fetch(basePath, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to compute dosage recommendation')
    }

    const body = await response.json()
    if (body && typeof body === 'object') {
        return {
            foundRule: Boolean(body['foundRule']),
            ruleId: typeof body['ruleId'] === 'number' ? body['ruleId'] : Number(body['ruleId']) || null,
            ruleName: String(body['ruleName'] ?? ''),
            priority: typeof body['priority'] === 'number' ? body['priority'] : Number(body['priority']) || null,
            dosageAmount:
                typeof body['dosageAmount'] === 'number'
                    ? body['dosageAmount']
                    : body['dosageAmount'] !== null && body['dosageAmount'] !== undefined
                      ? Number(body['dosageAmount']) || null
                      : null,
            dosageUnit: typeof body['dosageUnit'] === 'string' ? body['dosageUnit'] : null,
            notes: typeof body['notes'] === 'string' ? body['notes'] : null,
            frequencies: Array.isArray(body['frequencies'])
                ? (body['frequencies'] as Record<string, unknown>[]).map((frequency) => normalizeFrequency(frequency))
                : [],
            reasons: Array.isArray(body['reasons']) ? body['reasons'].map((reason) => String(reason)) : [],
        }
    }

    return {
        foundRule: false,
        ruleId: null,
        ruleName: '',
        priority: null,
        dosageAmount: null,
        dosageUnit: null,
        notes: null,
        frequencies: [],
        reasons: [],
    }
}
