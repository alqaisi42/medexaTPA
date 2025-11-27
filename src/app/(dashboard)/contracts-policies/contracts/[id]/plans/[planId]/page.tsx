import { PlanDetailPage } from '@/features/contracts-policies/components/plan-detail-page'

export default async function PlanDetailRoute({ params }: { params: Promise<{ id: string; planId: string }> }) {
    const { id, planId } = await params
    return <PlanDetailPage contractId={parseInt(id)} planId={parseInt(planId)} />
}
