import {
    Plan,
    PlanDetail,
    PlanPayload,
    PlanListResponse,
    PlanSearchFilters,
    PlanBenefit,
    PlanBenefitPayload,
    PlanBenefitUpdatePayload,
    PlanBenefitListResponse,
    PlanBenefitResponse,
    MasterBenefit,
    MasterBenefitPayload,
    MasterBenefitUpdatePayload,
    MasterBenefitListResponse,
    MasterBenefitResponse,
    BenefitMapping,
    BenefitMappingPayload,
    BenefitMappingListResponse,
    BenefitMappingResponse,
    LimitBucketDetail,
    LimitBucketPayload,
    LimitBucketListResponse,
    LimitBucketResponse,
    PlanNetwork,
    PlanNetworkPayload,
    PlanNetworkUpdatePayload,
    PlanNetworkListResponse,
    PlanNetworkResponse,
    PlanExclusion,
    PlanExclusionPayload,
    PlanExclusionUpdatePayload,
    PlanExclusionListResponse,
    PlanExclusionResponse,
    PlanReinsurance,
    PlanReinsurancePayload,
    PlanReinsuranceUpdatePayload,
    PlanReinsuranceListResponse,
    PlanReinsuranceResponse,
} from '@/types/plan'

const PLANS_BASE_PATH = '/api/plans'
const BENEFITS_BASE_PATH = '/api/benefits'

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

// Plan Management Functions
export async function fetchPlans(filters: PlanSearchFilters = {}): Promise<PlanListResponse> {
    const { page = 0, size = 20, ...restFilters } = filters
    const params: Record<string, string | number | boolean> = { page, size }

    if (restFilters.contractId) params.contractId = restFilters.contractId
    if (restFilters.planCode) params.planCode = restFilters.planCode

    const response = await fetch(buildUrl(PLANS_BASE_PATH, '', params), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load plans')
    }

    const data: PlanListResponse = await response.json()
    return data
}

export async function createPlan(payload: PlanPayload): Promise<Plan> {
    const response = await fetch(buildUrl(PLANS_BASE_PATH), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to create plan:', response.status, errorText)
        throw new Error(`Unable to create plan: ${response.status} ${response.statusText}`)
    }

    try {
        const data = await response.json()
        return data
    } catch (parseError) {
        console.error('Failed to parse create plan response:', parseError)
        throw new Error('Unable to parse plan creation response')
    }
}

// Plan Benefits Functions
export async function fetchPlanBenefits(planId: number, page = 0, size = 20): Promise<PlanBenefitListResponse> {
    const params = { page, size }
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/benefits`, params), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load plan benefits')
    }

    const data: PlanBenefitListResponse = await response.json()
    return data
}

export async function addBenefitToPlan(planId: number, payload: PlanBenefitPayload): Promise<PlanBenefit> {
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/benefits`), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to add benefit to plan:', response.status, errorText)
        throw new Error(`Unable to add benefit to plan: ${response.status} ${response.statusText}`)
    }

    try {
        const data: PlanBenefitResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse add benefit response:', parseError)
        throw new Error('Unable to parse add benefit response')
    }
}

export async function updatePlanBenefit(planId: number, benefitId: number, payload: PlanBenefitUpdatePayload): Promise<PlanBenefit> {
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/benefits/${benefitId}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to update plan benefit:', response.status, errorText)
        throw new Error(`Unable to update plan benefit: ${response.status} ${response.statusText}`)
    }

    try {
        const data: PlanBenefitResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse update benefit response:', parseError)
        throw new Error('Unable to parse update benefit response')
    }
}

export async function removeBenefitFromPlan(planId: number, benefitId: number): Promise<void> {
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/benefits/${benefitId}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to remove benefit from plan')
    }
}

// Master Benefits Functions
export async function fetchMasterBenefits(page = 0, size = 1000): Promise<MasterBenefitListResponse> {
    const params = { page, size }
    const response = await fetch(buildUrl(BENEFITS_BASE_PATH, '', params), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load master benefits')
    }

    const data: MasterBenefitListResponse = await response.json()
    return data
}

export async function createMasterBenefit(payload: MasterBenefitPayload): Promise<MasterBenefit> {
    const response = await fetch(buildUrl(BENEFITS_BASE_PATH), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to create master benefit:', response.status, errorText)
        throw new Error(`Unable to create master benefit: ${response.status} ${response.statusText}`)
    }

    try {
        const data: MasterBenefitResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse create master benefit response:', parseError)
        throw new Error('Unable to parse master benefit creation response')
    }
}

export async function updateMasterBenefit(id: number, payload: MasterBenefitUpdatePayload): Promise<MasterBenefit> {
    const response = await fetch(buildUrl(BENEFITS_BASE_PATH, `/${id}`), {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to update master benefit:', response.status, errorText)
        throw new Error(`Unable to update master benefit: ${response.status} ${response.statusText}`)
    }

    try {
        const data: MasterBenefitResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse update master benefit response:', parseError)
        throw new Error('Unable to parse master benefit update response')
    }
}

export async function deleteMasterBenefit(id: number): Promise<void> {
    const response = await fetch(buildUrl(BENEFITS_BASE_PATH, `/${id}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to delete master benefit')
    }
}

// Benefit Mapping Functions
export async function fetchBenefitMapping(benefitId: number): Promise<BenefitMapping[]> {
    const response = await fetch(buildUrl(BENEFITS_BASE_PATH, `/${benefitId}/mapping`), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load benefit mapping')
    }

    const data: BenefitMappingListResponse = await response.json()
    if (data.success && data.data) {
        return data.data
    } else {
        throw new Error('Invalid response structure')
    }
}

export async function createBenefitMapping(benefitId: number, payload: BenefitMappingPayload): Promise<BenefitMapping> {
    const response = await fetch(buildUrl(BENEFITS_BASE_PATH, `/${benefitId}/mapping`), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to create benefit mapping:', response.status, errorText)
        throw new Error(`Unable to create benefit mapping: ${response.status} ${response.statusText}`)
    }

    try {
        const data: BenefitMappingResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse create benefit mapping response:', parseError)
        throw new Error('Unable to parse benefit mapping creation response')
    }
}

export async function deleteBenefitMapping(mappingId: number): Promise<void> {
    const response = await fetch(buildUrl(BENEFITS_BASE_PATH, `/mapping/${mappingId}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to delete benefit mapping')
    }
}

// Limit Bucket Functions
export async function fetchPlanLimitBuckets(planId: number, page = 0, size = 1000): Promise<LimitBucketListResponse> {
    const params = { page, size }
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/limit-buckets`, params), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load plan limit buckets')
    }

    const data: LimitBucketListResponse = await response.json()
    return data
}

export async function createLimitBucket(planId: number, payload: LimitBucketPayload): Promise<LimitBucketDetail> {
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/limit-buckets`), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to create limit bucket:', response.status, errorText)
        throw new Error(`Unable to create limit bucket: ${response.status} ${response.statusText}`)
    }

    try {
        const data: LimitBucketResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse create limit bucket response:', parseError)
        throw new Error('Unable to parse limit bucket creation response')
    }
}

export async function updateLimitBucket(planId: number, bucketId: number, payload: LimitBucketPayload): Promise<LimitBucketDetail> {
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/limit-buckets/${bucketId}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to update limit bucket:', response.status, errorText)
        throw new Error(`Unable to update limit bucket: ${response.status} ${response.statusText}`)
    }

    try {
        const data: LimitBucketResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse update limit bucket response:', parseError)
        throw new Error('Unable to parse limit bucket update response')
    }
}

export async function deleteLimitBucket(planId: number, bucketId: number): Promise<void> {
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/limit-buckets/${bucketId}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to delete limit bucket')
    }
}

// Plan Network Functions
export async function fetchPlanNetworks(planId: number, page = 0, size = 1000): Promise<PlanNetworkListResponse> {
    const params = { page, size }
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/networks`, params), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load plan networks')
    }

    const data: PlanNetworkListResponse = await response.json()
    return data
}

export async function attachNetworkToPlan(planId: number, payload: PlanNetworkPayload): Promise<PlanNetwork> {
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/networks`), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to attach network to plan:', response.status, errorText)
        throw new Error(`Unable to attach network to plan: ${response.status} ${response.statusText}`)
    }

    try {
        const data: PlanNetworkResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse attach network response:', parseError)
        throw new Error('Unable to parse attach network response')
    }
}

export async function updatePlanNetwork(planId: number, networkId: number, payload: PlanNetworkUpdatePayload): Promise<PlanNetwork> {
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/networks/${networkId}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to update plan network:', response.status, errorText)
        throw new Error(`Unable to update plan network: ${response.status} ${response.statusText}`)
    }

    try {
        const data: PlanNetworkResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse update plan network response:', parseError)
        throw new Error('Unable to parse plan network update response')
    }
}

export async function detachNetworkFromPlan(planId: number, networkId: number): Promise<void> {
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/networks/${networkId}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to detach network from plan')
    }
}

// Plan Exclusions API Functions
export async function fetchPlanExclusions(
    planId: number,
    params?: {
        exclusionType?: string
        page?: number
        size?: number
    }
): Promise<PlanExclusion[]> {
    const searchParams = new URLSearchParams()
    
    if (params?.exclusionType) {
        searchParams.append('exclusionType', params.exclusionType)
    }
    if (params?.page !== undefined) {
        searchParams.append('page', params.page.toString())
    }
    if (params?.size !== undefined) {
        searchParams.append('size', params.size.toString())
    }

    const url = buildUrl(PLANS_BASE_PATH, `/${planId}/exclusions`, Object.fromEntries(searchParams))
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error('Failed to fetch plan exclusions')
    }

    const data: PlanExclusionListResponse = await response.json()
    return data.data.content
}

export async function createPlanExclusion(
    planId: number,
    exclusion: PlanExclusionPayload
): Promise<PlanExclusion> {
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/exclusions`), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(exclusion),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to create plan exclusion:', response.status, errorText)
        throw new Error(`Unable to create plan exclusion: ${response.status} ${response.statusText}`)
    }

    try {
        const data: PlanExclusionResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse create exclusion response:', parseError)
        throw new Error('Unable to parse create exclusion response')
    }
}

export async function updatePlanExclusion(
    planId: number,
    exclusionId: number,
    exclusion: PlanExclusionUpdatePayload
): Promise<PlanExclusion> {
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/exclusions/${exclusionId}`), {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(exclusion),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to update plan exclusion:', response.status, errorText)
        throw new Error(`Unable to update plan exclusion: ${response.status} ${response.statusText}`)
    }

    try {
        const data: PlanExclusionResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse update exclusion response:', parseError)
        throw new Error('Unable to parse exclusion update response')
    }
}

export async function deletePlanExclusion(planId: number, exclusionId: number): Promise<void> {
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/exclusions/${exclusionId}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to delete plan exclusion')
    }
}

// Plan Reinsurance API Functions
export async function fetchPlanReinsurance(
    planId: number,
    params?: {
        page?: number
        size?: number
    }
): Promise<PlanReinsurance[]> {
    const searchParams = new URLSearchParams()
    
    if (params?.page !== undefined) {
        searchParams.append('page', params.page.toString())
    }
    if (params?.size !== undefined) {
        searchParams.append('size', params.size.toString())
    }

    const url = buildUrl(PLANS_BASE_PATH, `/${planId}/reinsurance`, Object.fromEntries(searchParams))
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error('Failed to fetch plan reinsurance')
    }

    const data: PlanReinsuranceListResponse = await response.json()
    return data.data.content
}

export async function attachPlanReinsurance(
    planId: number,
    reinsurance: PlanReinsurancePayload
): Promise<PlanReinsurance> {
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/reinsurance`), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reinsurance),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to attach reinsurance to plan:', response.status, errorText)
        throw new Error(`Unable to attach reinsurance to plan: ${response.status} ${response.statusText}`)
    }

    try {
        const data: PlanReinsuranceResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse attach reinsurance response:', parseError)
        throw new Error('Unable to parse attach reinsurance response')
    }
}

export async function updatePlanReinsurance(
    planId: number,
    treatyId: number,
    reinsurance: PlanReinsuranceUpdatePayload
): Promise<PlanReinsurance> {
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/reinsurance/${treatyId}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reinsurance),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to update plan reinsurance:', response.status, errorText)
        throw new Error(`Unable to update plan reinsurance: ${response.status} ${response.statusText}`)
    }

    try {
        const data: PlanReinsuranceResponse = await response.json()
        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response structure')
        }
    } catch (parseError) {
        console.error('Failed to parse update reinsurance response:', parseError)
        throw new Error('Unable to parse reinsurance update response')
    }
}

export async function detachPlanReinsurance(planId: number, treatyId: number): Promise<void> {
    const response = await fetch(buildUrl(PLANS_BASE_PATH, `/${planId}/reinsurance/${treatyId}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to detach reinsurance from plan')
    }
}
