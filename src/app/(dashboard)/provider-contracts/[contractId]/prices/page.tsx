'use client'

import { ProviderContractPricesPage } from '@/features/medical-providers/components/provider-contract-prices-page'
import { use } from 'react'

export default function ProviderContractPrices({ params }: { params: Promise<{ contractId: string }> }) {
    const { contractId } = use(params)
    const contractIdNum = Number(contractId)
    
    return <ProviderContractPricesPage contractId={contractIdNum} />
}

