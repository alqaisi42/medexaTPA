import { useCallback, useState } from 'react'
import { PaginatedResponse, ProviderPayload, ProviderRecord, ProviderStatus } from '@/types/provider'
import { createProvider, deleteProvider, listProviders, updateProvider } from '../services/provider-service'

interface ProviderFilters {
    name?: string
    status?: ProviderStatus | ''
}

interface UseProvidersResult {
    providers: ProviderRecord[]
    pagination: PaginatedResponse<ProviderRecord> | null
    isLoading: boolean
    isSaving: boolean
    error: string | null
    filters: ProviderFilters
    load: (page?: number, size?: number) => Promise<void>
    setFilters: (filters: ProviderFilters) => void
    create: (payload: ProviderPayload) => Promise<void>
    update: (id: number, payload: ProviderPayload) => Promise<void>
    remove: (id: number) => Promise<void>
    clearError: () => void
}

export function useProviders(initialPageSize = 10): UseProvidersResult {
    const [providers, setProviders] = useState<ProviderRecord[]>([])
    const [pagination, setPagination] = useState<PaginatedResponse<ProviderRecord> | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [filters, setFiltersState] = useState<ProviderFilters>({})
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(
        async (page = 0, size = initialPageSize) => {
            setIsLoading(true)
            setError(null)
            try {
                const result = await listProviders({
                    page,
                    size,
                    name: filters.name,
                    status: filters.status,
                })
                setProviders(result.content)
                setPagination(result)
            } catch (err) {
                console.error('Failed to load providers', err)
                setProviders([])
                setPagination(null)
                setError(err instanceof Error ? err.message : 'Unable to load providers')
            } finally {
                setIsLoading(false)
            }
        },
        [filters.name, filters.status, initialPageSize],
    )

    const create = useCallback(
        async (payload: ProviderPayload) => {
            setIsSaving(true)
            setError(null)
            try {
                await createProvider(payload)
                await load(pagination?.pageNumber ?? 0, pagination?.pageSize ?? initialPageSize)
            } catch (err) {
                console.error('Failed to create provider', err)
                setError(err instanceof Error ? err.message : 'Unable to create provider')
                throw err
            } finally {
                setIsSaving(false)
            }
        },
        [load, pagination?.pageNumber, pagination?.pageSize, initialPageSize],
    )

    const update = useCallback(
        async (id: number, payload: ProviderPayload) => {
            setIsSaving(true)
            setError(null)
            try {
                await updateProvider(id, payload)
                await load(pagination?.pageNumber ?? 0, pagination?.pageSize ?? initialPageSize)
            } catch (err) {
                console.error('Failed to update provider', err)
                setError(err instanceof Error ? err.message : 'Unable to update provider')
                throw err
            } finally {
                setIsSaving(false)
            }
        },
        [load, pagination?.pageNumber, pagination?.pageSize, initialPageSize],
    )

    const remove = useCallback(
        async (id: number) => {
            setIsSaving(true)
            setError(null)
            try {
                await deleteProvider(id)
                await load(pagination?.pageNumber ?? 0, pagination?.pageSize ?? initialPageSize)
            } catch (err) {
                console.error('Failed to delete provider', err)
                setError(err instanceof Error ? err.message : 'Unable to delete provider')
                throw err
            } finally {
                setIsSaving(false)
            }
        },
        [load, pagination?.pageNumber, pagination?.pageSize, initialPageSize],
    )

    const setFilters = useCallback((next: ProviderFilters) => {
        setFiltersState(next)
    }, [])

    const clearError = useCallback(() => setError(null), [])

    return {
        providers,
        pagination,
        isLoading,
        isSaving,
        error,
        filters,
        load,
        setFilters,
        create,
        update,
        remove,
        clearError,
    }
}
