import { NextRequest } from 'next/server'
import { forwardProviderNetworksRequest } from '../_utils'

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        const payload = await request.json()
        return await forwardProviderNetworksRequest(`/api/v1/provider-networks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        })
    } catch (error) {
        console.error('Failed to proxy provider-network update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update provider-network link' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardProviderNetworksRequest(`/api/v1/provider-networks/${id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy provider-network deletion request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete provider-network link' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

