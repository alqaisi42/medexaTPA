import {
    Policy,
    PolicyPayload,
    PolicyListResponse,
    PolicySearchFilters,
    WaitingPeriod,
    WaitingPeriodListResponse,
    SpecialLimit,
    SpecialLimitListResponse,
    ProviderException,
    ProviderExceptionListResponse,
    PreapprovalRule,
    PreapprovalRuleListResponse,
    MaternityRule,
    MaternityRulePayload,
    GeneralCondition,
    GeneralConditionPayload,
    Exclusion,
    ExclusionListResponse,
    ChronicRule,
    ChronicRulePayload,
    ChronicRuleListResponse,
    CategoryLimit,
    CategoryLimitListResponse,
} from '@/types/policy'

const BASE_PATH = '/api/policies'

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
    const query = searchParams.toString()

    return query ? `${finalPath}?${query}` : finalPath
}

function parseDate(value: unknown): string | null {
    if (value === null || value === undefined) return null
    if (typeof value === 'string') return value
    if (Array.isArray(value) && value.length >= 3) {
        // [year, month, day] format
        const [year, month, day] = value
        return new Date(year, month - 1, day).toISOString().split('T')[0]
    }
    return null
}

function normalizePolicy(item: Record<string, unknown>): Policy {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        policyNumber: String(item['policyNumber'] ?? ''),
        policyCode: item['policyCode'] ? String(item['policyCode']) : null,
        employerId: typeof item['employerId'] === 'number' ? item['employerId'] : Number(item['employerId']) || 0,
        insuranceCompanyId:
            item['insuranceCompanyId'] !== null && item['insuranceCompanyId'] !== undefined
                ? Number(item['insuranceCompanyId'])
                : null,
        policyType: item['policyType'] ? String(item['policyType']) : null,
        policyCategory: item['policyCategory'] ? String(item['policyCategory']) : null,
        startDate: Array.isArray(item['startDate']) ? (item['startDate'] as [number, number, number]) : parseDate(item['startDate']),
        endDate: Array.isArray(item['endDate']) ? (item['endDate'] as [number, number, number]) : parseDate(item['endDate']),
        effectiveFrom: parseDate(item['effectiveFrom']),
        effectiveTo: parseDate(item['effectiveTo']),
        globalLimit: item['globalLimit'] !== null && item['globalLimit'] !== undefined ? Number(item['globalLimit']) : null,
        inpatientLimit:
            item['inpatientLimit'] !== null && item['inpatientLimit'] !== undefined ? Number(item['inpatientLimit']) : null,
        outpatientLimit:
            item['outpatientLimit'] !== null && item['outpatientLimit'] !== undefined ? Number(item['outpatientLimit']) : null,
        pharmacyLimit:
            item['pharmacyLimit'] !== null && item['pharmacyLimit'] !== undefined ? Number(item['pharmacyLimit']) : null,
        maternityLimit:
            item['maternityLimit'] !== null && item['maternityLimit'] !== undefined ? Number(item['maternityLimit']) : null,
        dentalLimit: item['dentalLimit'] !== null && item['dentalLimit'] !== undefined ? Number(item['dentalLimit']) : null,
        opticalLimit: item['opticalLimit'] !== null && item['opticalLimit'] !== undefined ? Number(item['opticalLimit']) : null,
        hasMaternity: Boolean(item['hasMaternity'] ?? false),
        hasDental: Boolean(item['hasDental'] ?? false),
        hasOptical: Boolean(item['hasOptical'] ?? false),
        hasPharmacy: Boolean(item['hasPharmacy'] ?? false),
        pricingModel: item['pricingModel'] ? String(item['pricingModel']) : null,
        networkType: item['networkType'] ? String(item['networkType']) : null,
        isActive: Boolean(item['isActive'] ?? true),
    }
}

export async function searchPolicies(filters: PolicySearchFilters = {}): Promise<PolicyListResponse> {
    const { page = 0, size = 20, ...restFilters } = filters
    const params: Record<string, string | number | boolean> = { page, size }

    if (restFilters.query) params.query = restFilters.query
    if (restFilters.employerId !== undefined) params.employerId = restFilters.employerId
    if (restFilters.isActive !== undefined) params.isActive = restFilters.isActive

    const response = await fetch(buildUrl('', params), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load policies')
    }

    const rawData = await response.json()
    const data = rawData as { content: unknown[] } & PolicyListResponse
    return {
        ...data,
        content: Array.isArray(data.content) ? data.content.map((item) => normalizePolicy(item as Record<string, unknown>)) : [],
    }
}

export async function fetchPolicy(id: number): Promise<Policy> {
    const response = await fetch(buildUrl(`/${id}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load policy')
    }

    const data = await response.json()
    return normalizePolicy(data)
}

export async function createPolicy(payload: PolicyPayload): Promise<Policy> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Unable to create policy: ${errorText}`)
    }

    const data = await response.json()
    return normalizePolicy(data)
}

export async function updatePolicy(id: number, payload: PolicyPayload): Promise<Policy> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Unable to update policy: ${errorText}`)
    }

    const data = await response.json()
    return normalizePolicy(data)
}

export async function deletePolicy(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Unable to delete policy: ${errorText}`)
    }
}

function normalizeWaitingPeriod(item: Record<string, unknown>): WaitingPeriod {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        policyId: typeof item['policyId'] === 'number' ? item['policyId'] : Number(item['policyId']) || 0,
        serviceType: item['serviceType'] ? String(item['serviceType']) : null,
        days: typeof item['days'] === 'number' ? item['days'] : Number(item['days']) || 0,
        icdCategoryId:
            item['icdCategoryId'] !== null && item['icdCategoryId'] !== undefined ? Number(item['icdCategoryId']) : null,
        procedureCategoryId:
            item['procedureCategoryId'] !== null && item['procedureCategoryId'] !== undefined
                ? Number(item['procedureCategoryId'])
                : null,
        maternityFlag: Boolean(item['maternityFlag'] ?? false),
        notes: item['notes'] ? String(item['notes']) : null,
    }
}

export async function fetchWaitingPeriods(policyId: number, page: number = 0, size: number = 1000): Promise<WaitingPeriodListResponse> {
    const response = await fetch(buildUrl('/waiting-periods', { policyId, page, size }), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load waiting periods')
    }

    const rawData = await response.json()
    const data = rawData as { content: unknown[] } & WaitingPeriodListResponse
    return {
        ...data,
        content: Array.isArray(data.content)
            ? data.content.map((item) => normalizeWaitingPeriod(item as Record<string, unknown>))
            : [],
    }
}

export async function fetchWaitingPeriod(id: number): Promise<WaitingPeriod> {
    const response = await fetch(buildUrl(`/waiting-periods/${id}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load waiting period')
    }

    const data = await response.json()
    return normalizeWaitingPeriod(data)
}

export async function fetchPoliciesBySubscriber(subscriberId: number): Promise<Policy[]> {
    const response = await fetch(buildUrl(`/by-subscriber/${subscriberId}`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load policies for subscriber')
    }

    const data = await response.json()
    // API returns an array directly, not a paginated response
    if (Array.isArray(data)) {
        return data.map((item) => normalizePolicy(item as Record<string, unknown>))
    }
    return []
}

// Special Limits
function normalizeSpecialLimit(item: Record<string, unknown>): SpecialLimit {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        policyId: typeof item['policyId'] === 'number' ? item['policyId'] : Number(item['policyId']) || 0,
        serviceType: item['serviceType'] ? String(item['serviceType']) : null,
        limitType: item['limitType'] ? String(item['limitType']) : null,
        limitAmount: item['limitAmount'] !== null && item['limitAmount'] !== undefined ? Number(item['limitAmount']) : null,
        maxVisits: item['maxVisits'] !== null && item['maxVisits'] !== undefined ? Number(item['maxVisits']) : null,
        deductibleAmount: item['deductibleAmount'] !== null && item['deductibleAmount'] !== undefined ? Number(item['deductibleAmount']) : null,
        copayPercent: item['copayPercent'] !== null && item['copayPercent'] !== undefined ? Number(item['copayPercent']) : null,
        icdId: item['icdId'] !== null && item['icdId'] !== undefined ? Number(item['icdId']) : null,
        procedureId: item['procedureId'] !== null && item['procedureId'] !== undefined ? Number(item['procedureId']) : null,
        procedureCategoryId: item['procedureCategoryId'] !== null && item['procedureCategoryId'] !== undefined ? Number(item['procedureCategoryId']) : null,
        notes: item['notes'] ? String(item['notes']) : null,
    }
}

export async function fetchSpecialLimits(policyId: number, page: number = 0, size: number = 1000): Promise<SpecialLimitListResponse> {
    const response = await fetch(buildUrl('/special-limits', { policyId, page, size }), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load special limits')
    }

    const rawData = await response.json()
    const data = rawData as { content: unknown[] } & SpecialLimitListResponse
    return {
        ...data,
        content: Array.isArray(data.content)
            ? data.content.map((item) => normalizeSpecialLimit(item as Record<string, unknown>))
            : [],
    }
}

// Provider Exceptions
function normalizeProviderException(item: Record<string, unknown>): ProviderException {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        policyId: typeof item['policyId'] === 'number' ? item['policyId'] : Number(item['policyId']) || 0,
        providerId: typeof item['providerId'] === 'number' ? item['providerId'] : Number(item['providerId']) || 0,
        serviceType: item['serviceType'] ? String(item['serviceType']) : null,
        procedureId: item['procedureId'] !== null && item['procedureId'] !== undefined ? Number(item['procedureId']) : null,
        icdId: item['icdId'] !== null && item['icdId'] !== undefined ? Number(item['icdId']) : null,
        overrideCopayPercent: item['overrideCopayPercent'] !== null && item['overrideCopayPercent'] !== undefined ? Number(item['overrideCopayPercent']) : null,
        overrideDeductibleAmount: item['overrideDeductibleAmount'] !== null && item['overrideDeductibleAmount'] !== undefined ? Number(item['overrideDeductibleAmount']) : null,
        overrideLimitAmount: item['overrideLimitAmount'] !== null && item['overrideLimitAmount'] !== undefined ? Number(item['overrideLimitAmount']) : null,
        overrideReimbursementModel: item['overrideReimbursementModel'] ? String(item['overrideReimbursementModel']) : null,
        isAllowed: Boolean(item['isAllowed'] ?? true),
        exceptionType: item['exceptionType'] ? String(item['exceptionType']) : null,
        notes: item['notes'] ? String(item['notes']) : null,
    }
}

export async function fetchProviderExceptions(policyId: number, page: number = 0, size: number = 1000): Promise<ProviderExceptionListResponse> {
    const response = await fetch(buildUrl('/provider-exceptions', { policyId, page, size }), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load provider exceptions')
    }

    const rawData = await response.json()
    const data = rawData as { content: unknown[] } & ProviderExceptionListResponse
    return {
        ...data,
        content: Array.isArray(data.content)
            ? data.content.map((item) => normalizeProviderException(item as Record<string, unknown>))
            : [],
    }
}

// Preapproval Rules
function normalizePreapprovalRule(item: Record<string, unknown>): PreapprovalRule {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        policyId: typeof item['policyId'] === 'number' ? item['policyId'] : Number(item['policyId']) || 0,
        serviceType: item['serviceType'] ? String(item['serviceType']) : null,
        procedureId: item['procedureId'] !== null && item['procedureId'] !== undefined ? Number(item['procedureId']) : null,
        icdId: item['icdId'] !== null && item['icdId'] !== undefined ? Number(item['icdId']) : null,
        providerTypeId: item['providerTypeId'] !== null && item['providerTypeId'] !== undefined ? Number(item['providerTypeId']) : null,
        claimType: item['claimType'] ? String(item['claimType']) : null,
        requiresPreapproval: Boolean(item['requiresPreapproval'] ?? false),
        notes: item['notes'] ? String(item['notes']) : null,
    }
}

export async function fetchPreapprovalRules(policyId: number, page: number = 0, size: number = 1000): Promise<PreapprovalRuleListResponse> {
    const response = await fetch(buildUrl('/preapproval-rules', { policyId, page, size }), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load preapproval rules')
    }

    const rawData = await response.json()
    const data = rawData as { content: unknown[] } & PreapprovalRuleListResponse
    return {
        ...data,
        content: Array.isArray(data.content)
            ? data.content.map((item) => normalizePreapprovalRule(item as Record<string, unknown>))
            : [],
    }
}

// Maternity Rules
function normalizeMaternityRule(item: Record<string, unknown>): MaternityRule {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        policyId: typeof item['policyId'] === 'number' ? item['policyId'] : Number(item['policyId']) || 0,
        waitingDays: item['waitingDays'] !== null && item['waitingDays'] !== undefined ? Number(item['waitingDays']) : null,
        requiresMarriage: Boolean(item['requiresMarriage'] ?? false),
        coversNormalDelivery: Boolean(item['coversNormalDelivery'] ?? false),
        coversCSection: Boolean(item['coversCSection'] ?? false),
        coversComplications: Boolean(item['coversComplications'] ?? false),
        coversIvf: Boolean(item['coversIvf'] ?? false),
        perPregnancyLimit: item['perPregnancyLimit'] !== null && item['perPregnancyLimit'] !== undefined ? Number(item['perPregnancyLimit']) : null,
        annualLimit: item['annualLimit'] !== null && item['annualLimit'] !== undefined ? Number(item['annualLimit']) : null,
        maxPregnancies: item['maxPregnancies'] !== null && item['maxPregnancies'] !== undefined ? Number(item['maxPregnancies']) : null,
        requiresPreapproval: Boolean(item['requiresPreapproval'] ?? false),
        newbornCoverageDays: item['newbornCoverageDays'] !== null && item['newbornCoverageDays'] !== undefined ? Number(item['newbornCoverageDays']) : null,
        pricingModel: item['pricingModel'] ? String(item['pricingModel']) : null,
        packagePrice: item['packagePrice'] !== null && item['packagePrice'] !== undefined ? Number(item['packagePrice']) : null,
        notes: item['notes'] ? String(item['notes']) : null,
    }
}

export async function fetchMaternityRule(policyId: number): Promise<MaternityRule | null> {
    const response = await fetch(buildUrl('/maternity-rules', { policyId }), { cache: 'no-store' })

    if (!response.ok) {
        if (response.status === 404) {
            return null
        }
        throw new Error('Unable to load maternity rules')
    }

    const data = await response.json()
    return normalizeMaternityRule(data)
}

export async function createMaternityRule(payload: MaternityRulePayload): Promise<MaternityRule> {
    const response = await fetch(buildUrl('/maternity-rules'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Unable to create maternity rules: ${errorText}`)
    }

    const data = await response.json()
    return normalizeMaternityRule(data)
}

// General Conditions
function normalizeGeneralCondition(item: Record<string, unknown>): GeneralCondition {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        policyId: typeof item['policyId'] === 'number' ? item['policyId'] : Number(item['policyId']) || 0,
        minAgeYears: item['minAgeYears'] !== null && item['minAgeYears'] !== undefined ? Number(item['minAgeYears']) : null,
        maxAgeYears: item['maxAgeYears'] !== null && item['maxAgeYears'] !== undefined ? Number(item['maxAgeYears']) : null,
        allowDependentsAfterHofDeath: Boolean(item['allowDependentsAfterHofDeath'] ?? false),
        newbornGraceDays: item['newbornGraceDays'] !== null && item['newbornGraceDays'] !== undefined ? Number(item['newbornGraceDays']) : null,
        coverageScope: item['coverageScope'] ? String(item['coverageScope']) : null,
        isInternationalCoverage: Boolean(item['isInternationalCoverage'] ?? false),
        defaultCopayPercent: item['defaultCopayPercent'] !== null && item['defaultCopayPercent'] !== undefined ? Number(item['defaultCopayPercent']) : null,
        defaultDeductibleAmount: item['defaultDeductibleAmount'] !== null && item['defaultDeductibleAmount'] !== undefined ? Number(item['defaultDeductibleAmount']) : null,
        defaultCoinsurancePercent: item['defaultCoinsurancePercent'] !== null && item['defaultCoinsurancePercent'] !== undefined ? Number(item['defaultCoinsurancePercent']) : null,
        annualLimit: item['annualLimit'] !== null && item['annualLimit'] !== undefined ? Number(item['annualLimit']) : null,
        lifetimeLimit: item['lifetimeLimit'] !== null && item['lifetimeLimit'] !== undefined ? Number(item['lifetimeLimit']) : null,
        familyLimit: item['familyLimit'] !== null && item['familyLimit'] !== undefined ? Number(item['familyLimit']) : null,
        gracePeriodDays: item['gracePeriodDays'] !== null && item['gracePeriodDays'] !== undefined ? Number(item['gracePeriodDays']) : null,
        maxClaimsPerDay: item['maxClaimsPerDay'] !== null && item['maxClaimsPerDay'] !== undefined ? Number(item['maxClaimsPerDay']) : null,
        minGapBetweenVisitsDays: item['minGapBetweenVisitsDays'] !== null && item['minGapBetweenVisitsDays'] !== undefined ? Number(item['minGapBetweenVisitsDays']) : null,
        autoApproveChronic: Boolean(item['autoApproveChronic'] ?? false),
        autoApproveMaternityFollowups: Boolean(item['autoApproveMaternityFollowups'] ?? false),
        termsEn: item['termsEn'] ? String(item['termsEn']) : null,
        termsAr: item['termsAr'] ? String(item['termsAr']) : null,
    }
}

export async function fetchGeneralCondition(policyId: number): Promise<GeneralCondition | null> {
    const response = await fetch(buildUrl('/general-conditions', { policyId }), { cache: 'no-store' })

    if (!response.ok) {
        if (response.status === 404) {
            return null
        }
        throw new Error('Unable to load general conditions')
    }

    const data = await response.json()
    return normalizeGeneralCondition(data)
}

export async function createGeneralCondition(payload: GeneralConditionPayload): Promise<GeneralCondition> {
    const response = await fetch(buildUrl('/general-conditions'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Unable to create general conditions: ${errorText}`)
    }

    const data = await response.json()
    return normalizeGeneralCondition(data)
}

// Exclusions
function normalizeExclusion(item: Record<string, unknown>): Exclusion {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        policyId: typeof item['policyId'] === 'number' ? item['policyId'] : Number(item['policyId']) || 0,
        code: item['code'] ? String(item['code']) : null,
        description: item['description'] ? String(item['description']) : null,
        exclusionType: item['exclusionType'] ? String(item['exclusionType']) : null,
        icdId: item['icdId'] !== null && item['icdId'] !== undefined ? Number(item['icdId']) : null,
        procedureId: item['procedureId'] !== null && item['procedureId'] !== undefined ? Number(item['procedureId']) : null,
        isGlobal: Boolean(item['isGlobal'] ?? false),
    }
}

export async function fetchExclusions(policyId: number, page: number = 0, size: number = 1000): Promise<ExclusionListResponse> {
    const response = await fetch(buildUrl('/exclusions', { policyId, page, size }), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load exclusions')
    }

    const rawData = await response.json()
    const data = rawData as { content: unknown[] } & ExclusionListResponse
    return {
        ...data,
        content: Array.isArray(data.content)
            ? data.content.map((item) => normalizeExclusion(item as Record<string, unknown>))
            : [],
    }
}

// Chronic Rules
function normalizeChronicRule(item: Record<string, unknown>): ChronicRule {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        policyId: typeof item['policyId'] === 'number' ? item['policyId'] : Number(item['policyId']) || 0,
        icdId: item['icdId'] !== null && item['icdId'] !== undefined ? Number(item['icdId']) : null,
        monthlyLimit: item['monthlyLimit'] !== null && item['monthlyLimit'] !== undefined ? Number(item['monthlyLimit']) : null,
        annualLimit: item['annualLimit'] !== null && item['annualLimit'] !== undefined ? Number(item['annualLimit']) : null,
        perPrescriptionLimit: item['perPrescriptionLimit'] !== null && item['perPrescriptionLimit'] !== undefined ? Number(item['perPrescriptionLimit']) : null,
        maxVisitsYearly: item['maxVisitsYearly'] !== null && item['maxVisitsYearly'] !== undefined ? Number(item['maxVisitsYearly']) : null,
        mandatoryFollowupMonths: item['mandatoryFollowupMonths'] !== null && item['mandatoryFollowupMonths'] !== undefined ? Number(item['mandatoryFollowupMonths']) : null,
        allowsLongTermMeds: Boolean(item['allowsLongTermMeds'] ?? false),
        maxMedicationMonthsSupply: item['maxMedicationMonthsSupply'] !== null && item['maxMedicationMonthsSupply'] !== undefined ? Number(item['maxMedicationMonthsSupply']) : null,
        requiresPreapproval: Boolean(item['requiresPreapproval'] ?? false),
        notes: item['notes'] ? String(item['notes']) : null,
    }
}

export async function fetchChronicRules(policyId: number, page: number = 0, size: number = 1000): Promise<ChronicRuleListResponse> {
    const response = await fetch(buildUrl('/chronic-rules', { policyId, page, size }), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load chronic rules')
    }

    const rawData = await response.json()
    const data = rawData as { content: unknown[] } & ChronicRuleListResponse
    return {
        ...data,
        content: Array.isArray(data.content)
            ? data.content.map((item) => normalizeChronicRule(item as Record<string, unknown>))
            : [],
    }
}

export async function createChronicRule(payload: ChronicRulePayload): Promise<ChronicRule> {
    const response = await fetch(buildUrl('/chronic-rules'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Unable to create chronic rule: ${errorText}`)
    }

    const data = await response.json()
    return normalizeChronicRule(data)
}

// Category Limits
function normalizeCategoryLimit(item: Record<string, unknown>): CategoryLimit {
    return {
        id: typeof item['id'] === 'number' ? item['id'] : Number(item['id']) || 0,
        policyId: typeof item['policyId'] === 'number' ? item['policyId'] : Number(item['policyId']) || 0,
        serviceCategory: item['serviceCategory'] ? String(item['serviceCategory']) : null,
        subCategory: item['subCategory'] ? String(item['subCategory']) : null,
        yearlyLimit: item['yearlyLimit'] !== null && item['yearlyLimit'] !== undefined ? Number(item['yearlyLimit']) : null,
        monthlyLimit: item['monthlyLimit'] !== null && item['monthlyLimit'] !== undefined ? Number(item['monthlyLimit']) : null,
        perVisitLimit: item['perVisitLimit'] !== null && item['perVisitLimit'] !== undefined ? Number(item['perVisitLimit']) : null,
        maxVisits: item['maxVisits'] !== null && item['maxVisits'] !== undefined ? Number(item['maxVisits']) : null,
        copayPercent: item['copayPercent'] !== null && item['copayPercent'] !== undefined ? Number(item['copayPercent']) : null,
        deductibleAmount: item['deductibleAmount'] !== null && item['deductibleAmount'] !== undefined ? Number(item['deductibleAmount']) : null,
        notes: item['notes'] ? String(item['notes']) : null,
    }
}

export async function fetchCategoryLimits(policyId: number, page: number = 0, size: number = 1000): Promise<CategoryLimitListResponse> {
    const response = await fetch(buildUrl('/category-limits', { policyId, page, size }), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load category limits')
    }

    const rawData = await response.json()
    const data = rawData as { content: unknown[] } & CategoryLimitListResponse
    return {
        ...data,
        content: Array.isArray(data.content)
            ? data.content.map((item) => normalizeCategoryLimit(item as Record<string, unknown>))
            : [],
    }
}

