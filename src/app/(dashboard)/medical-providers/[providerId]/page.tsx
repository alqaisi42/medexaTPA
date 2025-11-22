import { ProviderDetailsPage } from '@/features/medical-providers/components/provider-details-page'

interface ProviderDetailsParams {
    params: Promise<{
        providerId: string
    }>
}

export default async function ProviderDetails({ params }: ProviderDetailsParams) {
    const { providerId: providerIdParam } = await params
    const providerId = Number(providerIdParam)
    
    // if (isNaN(providerId) || providerId <= 0) {
    //     return (
    //         <div className="p-6">
    //             <p className="text-red-600">Invalid provider ID</p>
    //         </div>
    //     )
    // }
    //
    return <ProviderDetailsPage providerId={providerId} />
}
