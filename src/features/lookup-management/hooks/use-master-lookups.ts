import { useCallback, useState } from 'react'
import type { LookupCategory, LookupRecord } from '@/types/lookup'
import { CreateLookupPayload, createLookupRecord, getLookupRecords } from '../services/master-lookup-service'

interface UseMasterLookupsResult {
    records: LookupRecord[]
    isLoading: boolean
    isSaving: boolean
    fetchError: string | null
    loadRecords: (category: LookupCategory) => Promise<LookupRecord[]>
    createRecord: (category: LookupCategory, payload: CreateLookupPayload) => Promise<LookupRecord>
    clearError: () => void
}

export function useMasterLookups(): UseMasterLookupsResult {
    const [records, setRecords] = useState<LookupRecord[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [fetchError, setFetchError] = useState<string | null>(null)

    const loadRecords = useCallback(async (category: LookupCategory) => {
        setIsLoading(true)
        setFetchError(null)

        try {
            const data = await getLookupRecords(category)
            setRecords(data)
            return data
        } catch (error) {
            console.error('Failed to load lookup records', error)
            const message =
                error instanceof Error ? error.message : 'Failed to load lookup records. Please try again.'
            setRecords([])
            setFetchError(message)
            return []
        } finally {
            setIsLoading(false)
        }
    }, [])

    const createRecord = useCallback(
        async (category: LookupCategory, payload: CreateLookupPayload) => {
            setIsSaving(true)

            try {
                const created = await createLookupRecord(category, payload)
                await loadRecords(category)
                return created
            } finally {
                setIsSaving(false)
            }
        },
        [loadRecords],
    )

    const clearError = useCallback(() => {
        setFetchError(null)
    }, [])

    return {
        records,
        isLoading,
        isSaving,
        fetchError,
        loadRecords,
        createRecord,
        clearError,
    }
}
