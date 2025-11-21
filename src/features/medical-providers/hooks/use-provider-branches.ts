import { useCallback, useState } from 'react'
import { PaginatedResponse, ProviderBranch, ProviderBranchPayload } from '@/types/provider'
import {
    createProviderBranch,
    deleteProviderBranch,
    listProviderBranches,
    updateProviderBranch,
} from '../services/provider-service'

interface BranchFilters {
    name?: string
}

interface UseProviderBranchesResult {
    branches: ProviderBranch[]
    pagination: PaginatedResponse<ProviderBranch> | null
    isLoading: boolean
    isSaving: boolean
    error: string | null
    filters: BranchFilters
    load: (providerId: number, page?: number, size?: number) => Promise<void>
    setFilters: (filters: BranchFilters) => void
    create: (payload: ProviderBranchPayload) => Promise<void>
    update: (id: number, payload: ProviderBranchPayload) => Promise<void>
    remove: (id: number) => Promise<void>
    clearError: () => void
}

export function useProviderBranches(initialPageSize = 10): UseProviderBranchesResult {
    const [branches, setBranches] = useState<ProviderBranch[]>([])
    const [pagination, setPagination] = useState<PaginatedResponse<ProviderBranch> | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [providerId, setProviderId] = useState<number | null>(null)
    const [filters, setFiltersState] = useState<BranchFilters>({})

    const load = useCallback(
        async (provider: number, page = 0, size = initialPageSize) => {
            setIsLoading(true)
            setError(null)
            setProviderId(provider)
            try {
                const result = await listProviderBranches(provider, { page, size, name: filters.name })
                setBranches(result.content)
                setPagination(result)
            } catch (err) {
                console.error('Failed to load provider branches', err)
                setError(err instanceof Error ? err.message : 'Unable to load provider branches')
                setBranches([])
                setPagination(null)
            } finally {
                setIsLoading(false)
            }
        },
        [filters.name, initialPageSize],
    )

    const create = useCallback(
        async (payload: ProviderBranchPayload) => {
            if (!providerId) {
                throw new Error('No provider selected')
            }
            setIsSaving(true)
            setError(null)
            try {
                await createProviderBranch({ ...payload, providerId })
                await load(providerId, pagination?.pageNumber ?? 0, pagination?.pageSize ?? initialPageSize)
            } catch (err) {
                console.error('Failed to create branch', err)
                setError(err instanceof Error ? err.message : 'Unable to create branch')
                throw err
            } finally {
                setIsSaving(false)
            }
        },
        [load, providerId, pagination?.pageNumber, pagination?.pageSize, initialPageSize],
    )

    const update = useCallback(
        async (id: number, payload: ProviderBranchPayload) => {
            if (!providerId) {
                throw new Error('No provider selected')
            }
            setIsSaving(true)
            setError(null)
            try {
                await updateProviderBranch(id, { ...payload, providerId })
                await load(providerId, pagination?.pageNumber ?? 0, pagination?.pageSize ?? initialPageSize)
            } catch (err) {
                console.error('Failed to update branch', err)
                setError(err instanceof Error ? err.message : 'Unable to update branch')
                throw err
            } finally {
                setIsSaving(false)
            }
        },
        [load, providerId, pagination?.pageNumber, pagination?.pageSize, initialPageSize],
    )

    const remove = useCallback(
        async (id: number) => {
            if (!providerId) {
                throw new Error('No provider selected')
            }
            setIsSaving(true)
            setError(null)
            try {
                await deleteProviderBranch(id)
                await load(providerId, pagination?.pageNumber ?? 0, pagination?.pageSize ?? initialPageSize)
            } catch (err) {
                console.error('Failed to delete branch', err)
                setError(err instanceof Error ? err.message : 'Unable to delete branch')
                throw err
            } finally {
                setIsSaving(false)
            }
        },
        [load, providerId, pagination?.pageNumber, pagination?.pageSize, initialPageSize],
    )

    const setFilters = useCallback((next: BranchFilters) => {
        setFiltersState(next)
    }, [])

    const clearError = useCallback(() => setError(null), [])

    return { branches, pagination, isLoading, isSaving, error, filters, load, setFilters, create, update, remove, clearError }
}
