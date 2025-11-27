import {
    Contract,
    ContractListResponse,
    ContractResponse,
    ContractPlansResponse,
    ContractPayload,
    ContractUpdatePayload,
    ContractSearchFilters,
} from '@/types/contract'

const BASE_PATH = '/api/contracts'

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

function formatDate(date: [number, number, number] | string): string {
    if (Array.isArray(date)) {
        return `${date[2]}/${date[1]}/${date[0]}`
    }
    if (typeof date === 'string') {
        return new Date(date).toLocaleDateString()
    }
    return '-'
}

function normalizeContract(item: Contract): Contract {
    return {
        ...item,
        startDate: item.startDate,
        endDate: item.endDate,
        renewalDate: item.renewalDate || null,
        totalPremium: item.totalPremium || null,
        terminationReason: item.terminationReason || null,
        tpaBranchId: item.tpaBranchId || null,
    }
}

export async function fetchContracts(filters: ContractSearchFilters = {}): Promise<ContractListResponse> {
    const { page = 0, size = 20, ...restFilters } = filters
    const params: Record<string, string | number | boolean> = { page, size }

    if (restFilters.payerId) params.payerId = restFilters.payerId
    if (restFilters.corporateId) params.corporateId = restFilters.corporateId
    if (restFilters.contractNumber) params.contractNumber = restFilters.contractNumber
    if (restFilters.status) params.status = restFilters.status
    if (restFilters.startDateFrom) params.startDateFrom = restFilters.startDateFrom
    if (restFilters.startDateTo) params.startDateTo = restFilters.startDateTo
    if (restFilters.endDateFrom) params.endDateFrom = restFilters.endDateFrom
    if (restFilters.endDateTo) params.endDateTo = restFilters.endDateTo
    if (restFilters.sortBy) params.sortBy = restFilters.sortBy
    if (restFilters.sortDirection) params.sortDirection = restFilters.sortDirection

    const response = await fetch(buildUrl('', params), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load contracts')
    }

    const data: ContractListResponse = await response.json()
    return {
        ...data,
        data: {
            ...data.data,
            content: data.data.content.map(normalizeContract),
        },
    }
}

export async function fetchContract(id: number): Promise<Contract> {
    const url = buildUrl(`/${id}`)
    console.log('Fetching contract from URL:', url)
    
    const response = await fetch(url, { cache: 'no-store' })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to fetch contract:', response.status, response.statusText, errorText)
        throw new Error(`Unable to load contract: ${response.status} ${response.statusText}`)
    }

    try {
        const data = await response.json()
        console.log('Contract API response:', data)
        
        // Handle different response structures
        if (data.success && data.data) {
            // Response has wrapper structure like { success: true, data: {...} }
            console.log('Using wrapped response structure')
            return normalizeContract(data.data)
        } else if (data.id) {
            // Direct contract object
            console.log('Using direct response structure')
            return normalizeContract(data)
        } else {
            console.error('Unexpected response structure:', data)
            throw new Error('Invalid contract data structure')
        }
    } catch (parseError) {
        console.error('Failed to parse contract response:', parseError)
        throw new Error('Unable to parse contract data')
    }
}

export async function createContract(payload: ContractPayload): Promise<Contract> {
    const response = await fetch(buildUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to create contract:', response.status, errorText)
        throw new Error(`Unable to create contract: ${response.status} ${response.statusText}`)
    }

    try {
        const data = await response.json()
        
        // Handle different response structures
        if (data.success && data.data) {
            // Response has wrapper structure like { success: true, data: {...} }
            return normalizeContract(data.data)
        } else if (data.id) {
            // Direct contract object
            return normalizeContract(data)
        } else {
            console.error('Unexpected create response structure:', data)
            throw new Error('Invalid contract creation response')
        }
    } catch (parseError) {
        console.error('Failed to parse create contract response:', parseError)
        throw new Error('Unable to parse contract creation response')
    }
}

export async function updateContract(id: number, payload: ContractUpdatePayload): Promise<Contract> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to update contract:', response.status, errorText)
        throw new Error(`Unable to update contract: ${response.status} ${response.statusText}`)
    }

    try {
        const data = await response.json()
        
        // Handle different response structures
        if (data.success && data.data) {
            // Response has wrapper structure like { success: true, data: {...} }
            return normalizeContract(data.data)
        } else if (data.id) {
            // Direct contract object
            return normalizeContract(data)
        } else {
            console.error('Unexpected update response structure:', data)
            throw new Error('Invalid contract update response')
        }
    } catch (parseError) {
        console.error('Failed to parse update contract response:', parseError)
        throw new Error('Unable to parse contract update response')
    }
}

export async function deleteContract(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/${id}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Unable to delete contract')
    }
}

export async function fetchContractPlans(contractId: number, page = 0, size = 20): Promise<ContractPlansResponse> {
    const params = { page, size }
    const response = await fetch(buildUrl(`/${contractId}/plans`, params), { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Unable to load contract plans')
    }

    const data: ContractPlansResponse = await response.json()
    return data
}

export async function duplicateContract(id: number): Promise<Contract> {
    try {
        // First fetch the original contract
        const original = await fetchContract(id)
        
        // Helper function to convert date to ISO string
        const dateToISOString = (date: [number, number, number] | string | null): string | null => {
            if (!date) return null
            if (Array.isArray(date)) {
                return new Date(date[0], date[1] - 1, date[2]).toISOString().split('T')[0]
            }
            if (typeof date === 'string') {
                return new Date(date).toISOString().split('T')[0]
            }
            return null
        }
        
        // Create a new contract payload based on the original
        const payload: ContractPayload = {
            contractNumber: `${original.contractNumber}-COPY-${Date.now()}`, // Add timestamp to ensure uniqueness
            payerId: original.payerId,
            corporateId: original.corporateId,
            tpaBranchId: original.tpaBranchId || undefined,
            startDate: new Date().toISOString().split('T')[0], // Today's date
            endDate: dateToISOString(original.endDate) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 1 year from now
            renewalDate: dateToISOString(original.renewalDate || null),
            currencyCode: original.currencyCode,
            totalPremium: original.totalPremium || undefined,
            status: 'DRAFT',
            plans: original.plans.map(plan => ({
                planCode: `${plan.planCode}-COPY`,
                nameEn: `${plan.nameEn} (Copy)`,
                nameAr: plan.nameAr ? `${plan.nameAr} (نسخة)` : undefined,
                annualLimitPerMember: plan.annualLimitPerMember,
                annualLimitPerFamily: plan.annualLimitPerFamily,
                lifetimeLimitPerMember: plan.lifetimeLimitPerMember || undefined,
                isActive: plan.isActive,
            })),
        }

        return await createContract(payload)
    } catch (error) {
        console.error('Failed to duplicate contract:', error)
        throw new Error(`Unable to duplicate contract: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

export { formatDate }
