import {
    DosageRecommendationResponse,
    DosageRuleFrequency,
    DrugDecisionEvaluationRequest,
    DrugDecisionEvaluationResponse,
    DrugDecisionPricingSummary,
} from '@/types'

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, '') ?? ''
const API_PREFIX = API_BASE_URL ? '/api/v1' : '/api'
const BASE_PATH = `${API_PREFIX}/drug-decision`

function buildUrl(path: string = '') {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const finalPath = `${BASE_PATH}${normalizedPath === '/' ? '' : normalizedPath}`

    return API_BASE_URL ? `${API_BASE_URL}${finalPath}` : finalPath
}

function normalizePricingSummary(payload: unknown): DrugDecisionPricingSummary | null {
    if (!payload || typeof payload !== 'object') {
        return null
    }

    const data = payload as Record<string, unknown>
    return {
        baseUnitPrice: typeof data['baseUnitPrice'] === 'number' ? data['baseUnitPrice'] : Number(data['baseUnitPrice']) || null,
        baseTotalPrice:
            typeof data['baseTotalPrice'] === 'number' ? data['baseTotalPrice'] : Number(data['baseTotalPrice']) || null,
        finalUnitPrice:
            typeof data['finalUnitPrice'] === 'number' ? data['finalUnitPrice'] : Number(data['finalUnitPrice']) || null,
        finalTotalPrice:
            typeof data['finalTotalPrice'] === 'number' ? data['finalTotalPrice'] : Number(data['finalTotalPrice']) || null,
        adjustmentValue:
            typeof data['adjustmentValue'] === 'number' ? data['adjustmentValue'] : Number(data['adjustmentValue']) || null,
        requestedQuantity:
            typeof data['requestedQuantity'] === 'number'
                ? data['requestedQuantity']
                : Number(data['requestedQuantity']) || null,
        maxAllowedQuantity:
            typeof data['maxAllowedQuantity'] === 'number'
                ? data['maxAllowedQuantity']
                : Number(data['maxAllowedQuantity']) || null,
        quantityAfterEnforcement:
            typeof data['quantityAfterEnforcement'] === 'number'
                ? data['quantityAfterEnforcement']
                : Number(data['quantityAfterEnforcement']) || null,
    }
}

function normalizeDosage(payload: unknown): DosageRecommendationResponse | null {
    if (!payload || typeof payload !== 'object') {
        return null
    }

    const data = payload as Record<string, unknown>
    const normalizeFrequency = (value: unknown): DosageRuleFrequency => {
        if (!value || typeof value !== 'object') {
            return {
                frequencyCode: '',
                timesPerDay: null,
                intervalHours: null,
                timingNotes: null,
                specialInstructions: null,
            }
        }
        const record = value as Record<string, unknown>
        return {
            frequencyCode: String(record['frequencyCode'] ?? ''),
            timesPerDay:
                typeof record['timesPerDay'] === 'number'
                    ? record['timesPerDay']
                    : record['timesPerDay'] !== null && record['timesPerDay'] !== undefined
                      ? Number(record['timesPerDay']) || null
                      : null,
            intervalHours:
                typeof record['intervalHours'] === 'number'
                    ? record['intervalHours']
                    : record['intervalHours'] !== null && record['intervalHours'] !== undefined
                      ? Number(record['intervalHours']) || null
                      : null,
            timingNotes: typeof record['timingNotes'] === 'string' ? record['timingNotes'] : null,
            specialInstructions:
                typeof record['specialInstructions'] === 'string' ? record['specialInstructions'] : null,
        }
    }

    return {
        foundRule: Boolean(data['foundRule']),
        ruleId: typeof data['ruleId'] === 'number' ? data['ruleId'] : Number(data['ruleId']) || null,
        ruleName: String(data['ruleName'] ?? ''),
        priority: typeof data['priority'] === 'number' ? data['priority'] : Number(data['priority']) || null,
        dosageAmount:
            typeof data['dosageAmount'] === 'number'
                ? data['dosageAmount']
                : data['dosageAmount'] !== null && data['dosageAmount'] !== undefined
                  ? Number(data['dosageAmount']) || null
                  : null,
        dosageUnit: typeof data['dosageUnit'] === 'string' ? data['dosageUnit'] : null,
        notes: typeof data['notes'] === 'string' ? data['notes'] : null,
        frequencies: Array.isArray(data['frequencies'])
            ? (data['frequencies'] as unknown[]).map((frequency) => normalizeFrequency(frequency))
            : [],
        reasons: Array.isArray(data['reasons']) ? data['reasons'].map((reason) => String(reason)) : [],
    }
}

export async function evaluateDrugDecision(
    payload: DrugDecisionEvaluationRequest,
): Promise<DrugDecisionEvaluationResponse> {
    const response = await fetch(buildUrl('/evaluate'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to evaluate drug decision')
    }

    const body = await response.json()
    return {
        eligible: Boolean(body['eligible']),
        reasons: Array.isArray(body['reasons']) ? body['reasons'].map((reason: unknown) => String(reason)) : [],
        pricing: normalizePricingSummary(body['pricing']),
        dosage: normalizeDosage(body['dosage']),
        warnings: Array.isArray(body['warnings']) ? body['warnings'].map((warning: unknown) => String(warning)) : [],
        clinicalNotes: Array.isArray(body['clinicalNotes'])
            ? body['clinicalNotes'].map((note: unknown) => String(note))
            : [],
    }
}
