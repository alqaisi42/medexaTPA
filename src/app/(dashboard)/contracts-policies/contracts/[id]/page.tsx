import { ContractDetailPage } from '@/features/contracts-policies/components/contract-detail-page'

export default async function ContractDetailRoute({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <ContractDetailPage contractId={parseInt(id)} />
}
