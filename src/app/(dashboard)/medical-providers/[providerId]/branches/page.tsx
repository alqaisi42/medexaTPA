'use server'

import { ProviderBranchesPageClient } from '@/features/medical-providers/components/provider-branches-page-client'

interface ProviderBranchesPageProps {
    params: Promise<{
        providerId: string
    }>
}

export default async function ProviderBranchesPage({ params }: ProviderBranchesPageProps) {
    const { providerId: providerIdParam } = await params
    const providerId = Number(providerIdParam)
    
    // if (isNaN(providerId) || providerId <= 0) {
    //     return (
    //         <div className="p-6">
    //             <p className="text-red-600">Invalid provider ID</p>
    //         </div>
    //     )
    // }
    
    return <ProviderBranchesPageClient providerId={providerId} />
}

