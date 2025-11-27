import { ContractEditPage } from '@/features/contracts-policies/components/contract-edit-page'

export default async function ContractEditRoute({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <ContractEditPage contractId={parseInt(id)} />
}
