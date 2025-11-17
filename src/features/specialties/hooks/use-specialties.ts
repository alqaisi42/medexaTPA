import { useCallback, useState } from 'react'
import { Specialty, SpecialtyPayload } from '@/types/specialty'
import { createSpecialty, deleteSpecialty, getSpecialties, updateSpecialty } from '../services/specialty-service'

interface UseSpecialtiesResult {
    specialties: Specialty[]
    isLoading: boolean
    isSaving: boolean
    fetchError: string | null
    loadSpecialties: () => Promise<Specialty[]>
    create: (payload: SpecialtyPayload) => Promise<Specialty>
    update: (id: number, payload: SpecialtyPayload) => Promise<Specialty>
    remove: (id: number) => Promise<void>
    clearError: () => void
}

export function useSpecialties(): UseSpecialtiesResult {
    const [specialties, setSpecialties] = useState<Specialty[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [fetchError, setFetchError] = useState<string | null>(null)

    const loadSpecialties = useCallback(async () => {
        setIsLoading(true)
        setFetchError(null)

        try {
            const data = await getSpecialties()
            setSpecialties(data)
            return data
        } catch (error) {
            console.error('Failed to load specialties', error)
            const message = error instanceof Error ? error.message : 'Failed to load specialties. Please try again.'
            setSpecialties([])
            setFetchError(message)
            return []
        } finally {
            setIsLoading(false)
        }
    }, [])

    const create = useCallback(async (payload: SpecialtyPayload) => {
        setIsSaving(true)

        try {
            const created = await createSpecialty(payload)
            await loadSpecialties()
            return created
        } finally {
            setIsSaving(false)
        }
    }, [loadSpecialties])

    const update = useCallback(async (id: number, payload: SpecialtyPayload) => {
        setIsSaving(true)

        try {
            const updated = await updateSpecialty(id, payload)
            await loadSpecialties()
            return updated
        } finally {
            setIsSaving(false)
        }
    }, [loadSpecialties])

    const remove = useCallback(async (id: number) => {
        setIsSaving(true)

        try {
            await deleteSpecialty(id)
            await loadSpecialties()
        } finally {
            setIsSaving(false)
        }
    }, [loadSpecialties])

    const clearError = useCallback(() => setFetchError(null), [])

    return {
        specialties,
        isLoading,
        isSaving,
        fetchError,
        loadSpecialties,
        create,
        update,
        remove,
        clearError,
    }
}
