'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PackPricingPanel } from '@/features/drug-master/components/drug-master-page'
import { getDrugPackById } from '@/lib/api/drug-packs'
import type { DrugPack } from '@/types'

interface PackPricingPageProps {
    params: Promise<{
        drugId: string
        formId: string
        packId: string
    }>
}

export default function PackPricingPage({ params }: PackPricingPageProps) {
    const router = useRouter()
    const resolvedParams = use(params)
    const drugId = Number(resolvedParams.drugId)
    const formId = Number(resolvedParams.formId)
    const packId = Number(resolvedParams.packId)
    const packsBase = `/drug-master/${drugId}/forms/${formId}/packs`
    const [pack, setPack] = useState<DrugPack | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadPack = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await getDrugPackById(packId)
                setPack(data)
            } catch (requestError) {
                console.error(requestError)
                setError(requestError instanceof Error ? requestError.message : 'Unable to load pack details')
                setPack(null)
            } finally {
                setLoading(false)
            }
        }
        void loadPack()
    }, [packId])

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" className="px-0 text-gray-600 hover:text-gray-900" onClick={() => router.push(packsBase)}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to packs
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Pack pricing</h1>
                        <p className="text-sm text-gray-600">Manage pricing per price list for this pack.</p>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="flex items-center gap-2 rounded-lg border bg-white p-4 text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading pack details...
                </div>
            )}

            {error && !loading && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}

            {pack && !loading && (
                <PackPricingPanel pack={pack} onBack={() => router.push(packsBase)} onUpdated={() => void 0} />
            )}
        </div>
    )
}

