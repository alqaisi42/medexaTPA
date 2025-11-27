'use server'

import { DrugDetailsPageClient } from '@/features/drug-master/components/drug-details-page-client'

interface DrugDetailsPageProps {
    params: Promise<{
        drugId: string
    }>
}

export default async function DrugDetailsPage({ params }: DrugDetailsPageProps) {
    const { drugId: drugIdParam } = await params
    return <DrugDetailsPageClient drugId={Number(drugIdParam)} />
}

