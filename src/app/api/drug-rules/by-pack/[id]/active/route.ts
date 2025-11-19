import { NextRequest } from 'next/server'
import { forwardDrugRulesRequest } from '../../../_utils'

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardDrugRulesRequest(`/api/v1/drug-rules/by-pack/${id}/active`)
    } catch (error) {
        console.error('Failed to proxy active drug rules by pack request', error)
        return new Response(JSON.stringify({ message: 'Failed to load active drug rules' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
