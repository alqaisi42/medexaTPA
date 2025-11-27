'use client'

import { ProviderContractDetailPage } from '@/features/medical-providers/components/provider-contract-detail-page'
import { use } from 'react'

export default function ProviderContractDetail({ params }: { params: Promise<{ contractId: string }> }) {
    const { contractId } = use(params)
    
    return <ProviderContractDetailPage />
}

