import { useCallback, useState } from 'react'
import {
    PaginatedResponse,
    ProviderDoctor,
    ProviderDoctorPayload,
    ProviderDoctorUpdatePayload,
} from '@/types/provider'
import {
    assignProviderDoctor,
    deleteProviderDoctor,
    listProviderDoctors,
    updateProviderDoctor,
} from '../services/provider-service'

interface UseProviderDoctorsResult {
    doctors: ProviderDoctor[]
    pagination: PaginatedResponse<ProviderDoctor> | null
    isLoading: boolean
    isSaving: boolean
    error: string | null
    load: (providerId: number, page?: number, size?: number) => Promise<void>
    create: (payload: ProviderDoctorPayload) => Promise<void>
    update: (id: number, payload: ProviderDoctorUpdatePayload) => Promise<void>
    remove: (id: number) => Promise<void>
    clearError: () => void
}

export function useProviderDoctors(initialPageSize = 10): UseProviderDoctorsResult {
    const [doctors, setDoctors] = useState<ProviderDoctor[]>([])
    const [pagination, setPagination] = useState<PaginatedResponse<ProviderDoctor> | null>(null)
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
                const result = await listProviderDoctors(provider, { page, size })
                setDoctors(result.content)
                setPagination(result)
            } catch (err) {
                console.error('Failed to load provider doctors', err)
                setError(err instanceof Error ? err.message : 'Unable to load provider doctors')
                setDoctors([])
                setPagination(null)
            } finally {
                setIsLoading(false)
            }
        },
        [initialPageSize],
    )

    const create = useCallback(
        async (payload: ProviderDoctorPayload) => {
            if (!providerId) {
                throw new Error('No provider selected')
            }
            setIsSaving(true)
            setError(null)
            try {
                await assignProviderDoctor({ ...payload, providerId })
                await load(providerId, pagination?.pageNumber ?? 0, pagination?.pageSize ?? initialPageSize)
            } catch (err) {
                console.error('Failed to assign doctor', err)
                setError(err instanceof Error ? err.message : 'Unable to assign doctor')
                throw err
            } finally {
                setIsSaving(false)
            }
        },
        [load, providerId, pagination?.pageNumber, pagination?.pageSize, initialPageSize],
    )

    const update = useCallback(
        async (id: number, payload: ProviderDoctorUpdatePayload) => {
            if (!providerId) {
                throw new Error('No provider selected')
            }
            setIsSaving(true)
            setError(null)
            try {
                await updateProviderDoctor(id, payload)
                await load(providerId, pagination?.pageNumber ?? 0, pagination?.pageSize ?? initialPageSize)
            } catch (err) {
                console.error('Failed to update doctor assignment', err)
                setError(err instanceof Error ? err.message : 'Unable to update doctor assignment')
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
                await deleteProviderDoctor(id)
                await load(providerId, pagination?.pageNumber ?? 0, pagination?.pageSize ?? initialPageSize)
            } catch (err) {
                console.error('Failed to delete doctor assignment', err)
                setError(err instanceof Error ? err.message : 'Unable to delete doctor assignment')
                throw err
            } finally {
                setIsSaving(false)
            }
        },
        [load, providerId, pagination?.pageNumber, pagination?.pageSize, initialPageSize],
    )

    const clearError = useCallback(() => setError(null), [])

    return { doctors, pagination, isLoading, isSaving, error, load, create, update, remove, clearError }
}
