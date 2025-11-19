import { NextRequest } from 'next/server'
import { forwardDrugRulesRequest } from '../../_utils'

export async function POST(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardDrugRulesRequest(`/api/v1/drug-rules/${id}/deactivate`, { method: 'POST' })
    } catch (error) {
        console.error('Failed to proxy drug rule deactivate request', error)
        return new Response(JSON.stringify({ message: 'Failed to deactivate drug rule' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
