import { NextRequest } from 'next/server'
import { forwardProviderContractPricesRequest } from '../_utils'

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardProviderContractPricesRequest(`/api/v1/provider-contract-prices/${id}`)
    } catch (error) {
        console.error('Failed to proxy provider contract price details request', error)
        return new Response(JSON.stringify({ message: 'Failed to load provider contract price details' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        const payload = await request.json()
        return await forwardProviderContractPricesRequest(`/api/v1/provider-contract-prices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        })
    } catch (error) {
        console.error('Failed to proxy provider contract price update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update provider contract price' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardProviderContractPricesRequest(`/api/v1/provider-contract-prices/${id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy provider contract price deletion request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete provider contract price' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

