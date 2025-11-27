'use client'

import { useParams, useRouter } from 'next/navigation'
import { PolicyDetailPage } from '@/features/contracts-policies/components/policy-detail-page'

export default function PolicyDetailRoute() {
    const params = useParams()
    const router = useRouter()
    const policyId = params?.id ? (params.id === 'new' ? null : Number(params.id)) : null

    return <PolicyDetailPage policyId={policyId} onBack={() => router.push('/contracts-policies')} />
}

