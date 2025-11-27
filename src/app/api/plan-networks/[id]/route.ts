import { NextRequest } from 'next/server'
import { forwardPlanNetworksRequest } from '../_utils'

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        const payload = await request.json()
        return await forwardPlanNetworksRequest(`/api/v1/plan-networks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        })
    } catch (error) {
        console.error('Failed to proxy plan-network update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update plan-network link' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardPlanNetworksRequest(`/api/v1/plan-networks/${id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy plan-network deletion request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete plan-network link' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

