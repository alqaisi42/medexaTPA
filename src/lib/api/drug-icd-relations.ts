import {
    CreateDrugIcdRelationPayload,
    DrugIcdRelation,
    DrugIcdRelationApiRecord,
    DrugIcdRelationResponse,
    DrugIcdRelationType,
    DrugSummary,
    ICD,
    RawDrugDetails,
    RawIcdDetails,
    UpdateDrugIcdRelationPayload,
} from '@/types'

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, '') ?? ''
const API_PREFIX = API_BASE_URL ? '/api/v1' : '/api'
const BASE_PATH = `${API_PREFIX}/drug-icd`

const FLAT_ICD_FIELD_MAP: Record<string, keyof RawIcdDetails> = {
    icdid: 'id',
    icdsystemcode: 'systemCode',
    icdcode: 'code',
    icdnameen: 'nameEn',
    icdnamear: 'nameAr',
    icdchapter: 'chapter',
    icdblock: 'block',
    icdisbillable: 'isBillable',
    icdvalidfrom: 'validFrom',
    icdvalidto: 'validTo',
    icdseveritylevel: 'severityLevel',
    icdischronic: 'isChronic',
    icdrequiresauthorization: 'requiresAuthorization',
    icdstandardlosdays: 'standardLosDays',
    icdisactive: 'isActive',
    icdcomplicationrisk: 'complicationRisk',
    icdcreatedat: 'createdAt',
    icdupdatedat: 'updatedAt',
    icdcreatedby: 'createdBy',
    icdupdatedby: 'updatedBy',
    icdeffectivefrom: 'effectiveFrom',
    icdeffectiveto: 'effectiveTo',
    icdnameenarabic: 'name_ar',
    icdnameenenglish: 'nameEn',
    icdsystemcodelegacy: 'system_code',
}

function normalizeFlatFieldKey(key: string): string {
    if (!key) return ''
    const condensed = key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    if (!condensed.startsWith('icd')) {
        return ''
    }
    return condensed
}

function buildUrl(path: string = '') {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const finalPath = `${BASE_PATH}${normalizedPath === '/' ? '' : normalizedPath}`
    const baseUrl = API_BASE_URL ? `${API_BASE_URL}${finalPath}` : finalPath
    return baseUrl
}

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

function parseDateTime(value: unknown): string | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return new Date(value * 1000).toISOString()
    }

    if (typeof value === 'string' && value.trim().length > 0) {
        return value
    }

    return null
}

function normalizeRelationType(value: unknown): DrugIcdRelationType {
    switch (value) {
        case 'CONTRAINDICATION':
        case 'PRECAUTION':
        case 'INDICATION':
            return value
        default:
            return 'INDICATION'
    }
}

function normalizeDrugSummary(item: RawDrugDetails | null | undefined): DrugSummary | null {
    if (!item) return null

    return {
        id: typeof item.id === 'number' ? item.id : Number(item?.id) || 0,
        code: String(item.code ?? ''),
        genericNameEn: String(item.genericNameEn ?? item.generic_name_en ?? ''),
        brandNameEn: String(item.brandNameEn ?? item.brand_name_en ?? ''),
    }
}

function normalizeIcd(item: RawIcdDetails | null | undefined): ICD | null {
    if (!item) return null

    const validFrom = parseDate(item.validFrom) ?? ''
    const validTo = parseDate(item.validTo) ?? ''

    return {
        id: typeof item.id === 'number' ? item.id : Number(item?.id) || 0,
        systemCode: String(item.systemCode ?? item.system_code ?? ''),
        code: String(item.code ?? ''),
        nameEn: String(item.nameEn ?? item.name_en ?? ''),
        nameAr: String(item.nameAr ?? item.name_ar ?? ''),
        chapter: String(item.chapter ?? ''),
        block: String(item.block ?? ''),
        isBillable: Boolean(item.isBillable),
        validFrom,
        validTo,
        severityLevel: String(item.severityLevel ?? item.severity_level ?? ''),
        isChronic: Boolean(item.isChronic),
        requiresAuthorization: Boolean(item.requiresAuthorization),
        standardLosDays:
            typeof item.standardLosDays === 'number'
                ? item.standardLosDays
                : Number(item.standardLosDays) || 0,
        isActive: Boolean(item.isActive ?? true),
        complicationRisk: item.complicationRisk ? String(item.complicationRisk) : undefined,
        createdAt: parseDateTime(item.createdAt) ?? undefined,
        updatedAt: parseDateTime(item.updatedAt) ?? undefined,
        createdBy: item.createdBy ? String(item.createdBy) : undefined,
        updatedBy: item.updatedBy ? String(item.updatedBy) : undefined,
        effectiveFrom: parseDateTime(item.effectiveFrom) ?? undefined,
        effectiveTo: parseDateTime(item.effectiveTo) ?? undefined,
    }
}

function getDisplayString(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null
    }
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function extractDisplayValueFromRecord(
    item: DrugIcdRelationApiRecord,
    kind: 'code' | 'name',
): string | null {
    const record = item as unknown as Record<string, unknown>
    const keyword = kind === 'code' ? 'code' : 'name'
    for (const [key, value] of Object.entries(record)) {
        const normalizedKey = key.toLowerCase()
        if (!normalizedKey.includes('icd') || !normalizedKey.includes(keyword)) continue
        const display = getDisplayString(value)
        if (display) {
            return display
        }
    }
    return null
}

function extractFlatIcdDetails(item: DrugIcdRelationApiRecord): RawIcdDetails | null {
    const record = item as unknown as Record<string, unknown>
    let hasValue = false
    const raw: Record<string, unknown> = {}

    for (const [flatKey, value] of Object.entries(record)) {
        const lookupKey = normalizeFlatFieldKey(flatKey)
        if (!lookupKey) continue
        const rawKey = FLAT_ICD_FIELD_MAP[lookupKey]
        if (!rawKey) continue
        if (value === undefined || value === null || value === '') continue
        hasValue = true
        if (rawKey === 'id') {
            raw[rawKey] = typeof value === 'number' ? value : Number(value) || 0
        } else {
            raw[rawKey] = value
        }
    }

    if (!hasValue) {
        return null
    }

    if (typeof raw['id'] !== 'number' || Number.isNaN(raw['id'] as number)) {
        raw['id'] = 0
    }

    const hasMeaningfulIdentifier =
        (typeof raw['id'] === 'number' && (raw['id'] as number) > 0) ||
        typeof raw['code'] === 'string' ||
        typeof raw['nameEn'] === 'string' ||
        typeof raw['name_en'] === 'string'

    if (!hasMeaningfulIdentifier) {
        return null
    }

    return raw as unknown as RawIcdDetails
}

function normalizeRelationIcd(item: DrugIcdRelationApiRecord, fallback: RawIcdDetails | null): ICD | null {
    const detailedIcd = normalizeIcd(item.icd ?? null)
    if (detailedIcd) {
        return detailedIcd
    }

    return fallback ? normalizeIcd(fallback) : null
}

function normalizeRelation(item: DrugIcdRelationApiRecord): DrugIcdRelation {
    const fallbackRawIcd = extractFlatIcdDetails(item)
    const icd = normalizeRelationIcd(item, fallbackRawIcd)
    const fallbackCode = getDisplayString(icd?.code) ??
        getDisplayString(fallbackRawIcd?.code) ??
        extractDisplayValueFromRecord(item, 'code')
    const fallbackName =
        getDisplayString(icd?.nameEn) ??
        getDisplayString(
            fallbackRawIcd?.nameEn ??
                fallbackRawIcd?.name_en ??
                fallbackRawIcd?.nameAr ??
                fallbackRawIcd?.name_ar,
        ) ??
        extractDisplayValueFromRecord(item, 'name')

    return {
        id: typeof item.id === 'number' ? item.id : Number(item?.id) || 0,
        drug: normalizeDrugSummary(item.drug ?? null),
        icd,
        icdCodeDisplay: fallbackCode,
        icdNameDisplay: fallbackName,
        relationType: normalizeRelationType(item.relationType),
        notes: typeof item.notes === 'string' ? item.notes : null,
        validFrom: parseDate(item.validFrom),
        validTo: parseDate(item.validTo),
        isActive: Boolean(item.isActive ?? true),
        createdAt: parseDateTime(item.createdAt),
        updatedAt: parseDateTime(item.updatedAt),
    }
}

export async function fetchDrugIcdRelations(drugId: number): Promise<DrugIcdRelation[]> {
    if (!drugId) {
        return []
    }

    const response = await fetch(buildUrl(`/${drugId}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load ICD relations for this drug')
    }

    const payload = (await response.json()) as unknown
    if (!Array.isArray(payload)) {
        return []
    }

    return payload.map((item) => normalizeRelation(item as DrugIcdRelationApiRecord))
}

export async function createDrugIcdRelation(payload: CreateDrugIcdRelationPayload): Promise<DrugIcdRelation> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to link ICD to this drug')
    }

    const body = (await response.json()) as DrugIcdRelationApiRecord
    return normalizeRelation(body)
}

export async function updateDrugIcdRelation(
    id: number,
    payload: UpdateDrugIcdRelationPayload,
): Promise<DrugIcdRelation> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Unable to update ICD relation for this drug')
    }

    const body = (await response.json()) as DrugIcdRelationApiRecord
    return normalizeRelation(body)
}

export async function deleteDrugIcdRelation(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), { method: 'DELETE' })

    if (!response.ok) {
        throw new Error('Unable to delete ICD relation')
    }
}
