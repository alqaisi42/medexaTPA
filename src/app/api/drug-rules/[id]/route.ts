import { NextRequest } from 'next/server'
import { forwardDrugRulesRequest } from '../_utils'

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardDrugRulesRequest(`/api/v1/drug-rules/${id}`)
    } catch (error) {
        console.error('Failed to proxy drug rule detail request', error)
        return new Response(JSON.stringify({ message: 'Failed to load drug rule details' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        const payload = await request.json()
        return await forwardDrugRulesRequest(`/api/v1/drug-rules/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Failed to proxy drug rule update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update drug rule' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
