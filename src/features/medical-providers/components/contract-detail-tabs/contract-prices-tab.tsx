'use client'

import { ProviderContractPricesPage } from '../provider-contract-prices-page'

interface ContractPricesTabProps {
    contractId: number
    providerId: number
}

export function ContractPricesTab({ contractId, providerId }: ContractPricesTabProps) {
    return <ProviderContractPricesPage contractId={contractId} providerId={providerId} />
}

