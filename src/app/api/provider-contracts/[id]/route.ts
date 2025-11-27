import { NextRequest } from 'next/server'
import { forwardProviderContractsRequest } from '../_utils'

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardProviderContractsRequest(`/api/v1/provider-contracts/${id}`)
    } catch (error) {
        console.error('Failed to proxy provider contract details request', error)
        return new Response(JSON.stringify({ message: 'Failed to load provider contract details' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        const payload = await request.json()
        return await forwardProviderContractsRequest(`/api/v1/provider-contracts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        })
    } catch (error) {
        console.error('Failed to proxy provider contract update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update provider contract' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardProviderContractsRequest(`/api/v1/provider-contracts/${id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy provider contract deletion request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete provider contract' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

