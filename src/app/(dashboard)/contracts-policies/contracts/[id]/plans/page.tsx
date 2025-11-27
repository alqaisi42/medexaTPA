import { PlansManagementPage } from '@/features/contracts-policies/components/plans-management-page'

export default async function PlansManagementRoute({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <PlansManagementPage contractId={parseInt(id)} />
}
