import { NextRequest } from 'next/server'
import { forwardNetworksRequest } from '../_utils'

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardNetworksRequest(`/api/v1/networks/${id}`)
    } catch (error) {
        console.error('Failed to proxy network details request', error)
        return new Response(JSON.stringify({ message: 'Failed to load network details' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        const payload = await request.json()
        return await forwardNetworksRequest(`/api/v1/networks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        })
    } catch (error) {
        console.error('Failed to proxy network update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update network' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardNetworksRequest(`/api/v1/networks/${id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy network deletion request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete network' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

