import { useCallback, useState } from 'react'
import { PaginatedResponse, ProviderDepartment, ProviderDepartmentPayload } from '@/types/provider'
import { assignProviderDepartment, deleteProviderDepartment, listProviderDepartments } from '../services/provider-service'

interface UseProviderDepartmentsResult {
    departments: ProviderDepartment[]
    pagination: PaginatedResponse<ProviderDepartment> | null
    isLoading: boolean
    isSaving: boolean
    error: string | null
    load: (providerId: number, page?: number, size?: number) => Promise<void>
    create: (payload: ProviderDepartmentPayload) => Promise<void>
    remove: (id: number) => Promise<void>
    clearError: () => void
}

export function useProviderDepartments(initialPageSize = 10): UseProviderDepartmentsResult {
    const [departments, setDepartments] = useState<ProviderDepartment[]>([])
    const [pagination, setPagination] = useState<PaginatedResponse<ProviderDepartment> | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [providerId, setProviderId] = useState<number | null>(null)

    const load = useCallback(
        async (provider: number, page = 0, size = initialPageSize) => {
            setIsLoading(true)
            setError(null)
            setProviderId(provider)
            try {
                const result = await listProviderDepartments(provider, { page, size })
                setDepartments(result.content)
                setPagination(result)
            } catch (err) {
                console.error('Failed to load provider departments', err)
                setError(err instanceof Error ? err.message : 'Unable to load provider departments')
                setDepartments([])
                setPagination(null)
            } finally {
                setIsLoading(false)
            }
        },
        [initialPageSize],
    )

    const create = useCallback(
        async (payload: ProviderDepartmentPayload) => {
            if (!providerId) {
                throw new Error('No provider selected')
            }
            setIsSaving(true)
            setError(null)
            try {
                await assignProviderDepartment({ ...payload, providerId })
                await load(providerId, pagination?.pageNumber ?? 0, pagination?.pageSize ?? initialPageSize)
            } catch (err) {
                console.error('Failed to assign department', err)
                setError(err instanceof Error ? err.message : 'Unable to assign department')
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
                await deleteProviderDepartment(id)
                await load(providerId, pagination?.pageNumber ?? 0, pagination?.pageSize ?? initialPageSize)
            } catch (err) {
                console.error('Failed to delete department assignment', err)
                setError(err instanceof Error ? err.message : 'Unable to delete department assignment')
                throw err
            } finally {
                setIsSaving(false)
            }
        },
        [load, providerId, pagination?.pageNumber, pagination?.pageSize, initialPageSize],
    )

    const clearError = useCallback(() => setError(null), [])

    return { departments, pagination, isLoading, isSaving, error, load, create, remove, clearError }
}
