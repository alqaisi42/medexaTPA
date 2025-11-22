import { ProviderDetailsPage } from '@/features/medical-providers/components/provider-details-page'

interface ProviderDetailsParams {
    params: {
        providerId: string
    }
}

export default function ProviderDetails({ params }: ProviderDetailsParams) {
    const providerId = Number(params.providerId)
    return <ProviderDetailsPage providerId={providerId} />
}
