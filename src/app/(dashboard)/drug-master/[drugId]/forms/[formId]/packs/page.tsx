'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DrugPacksPanel } from '@/features/drug-master/components/drug-master-page'
import { getDrugFormById } from '@/lib/api/drug-forms'
import type { DrugForm } from '@/types'

interface FormPacksPageProps {
    params: Promise<{
        drugId: string
        formId: string
    }>
}

export default function FormPacksPage({ params }: FormPacksPageProps) {
    const router = useRouter()
    const resolvedParams = use(params)
    const drugId = Number(resolvedParams.drugId)
    const formId = Number(resolvedParams.formId)
    const [form, setForm] = useState<DrugForm | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadForm = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await getDrugFormById(formId)
                setForm(data)
            } catch (requestError) {
                console.error(requestError)
                setError(requestError instanceof Error ? requestError.message : 'Unable to load dosage form')
                setForm(null)
            } finally {
                setLoading(false)
            }
        }
        void loadForm()
    }, [formId])

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" className="px-0 text-gray-600 hover:text-gray-900" onClick={() => router.push(`/drug-master/${drugId}`)}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to drug
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Manage packs</h1>
                        <p className="text-sm text-gray-600">Configure pack definitions for the selected dosage form.</p>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="flex items-center gap-2 rounded-lg border bg-white p-4 text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading dosage form...
                </div>
            )}

            {error && !loading && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}

            {form && !loading && (
                <DrugPacksPanel drugId={drugId} form={form} onClose={() => router.push(`/drug-master/${drugId}`)} />
            )}
        </div>
    )
}

