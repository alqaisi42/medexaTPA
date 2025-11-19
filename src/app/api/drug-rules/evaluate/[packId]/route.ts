import { NextRequest } from 'next/server'
import { forwardDrugRulesRequest } from '../../_utils'

export async function POST(request: NextRequest, context: { params: Promise<{ packId: string }> }) {
    const { packId } = await context.params
    try {
        const payload = await request.json()
        return await forwardDrugRulesRequest(`/api/v1/drug-rules/evaluate/${packId}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Failed to proxy drug rule evaluation request', error)
        return new Response(JSON.stringify({ message: 'Failed to evaluate drug rules' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
