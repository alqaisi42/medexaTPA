import { NextRequest } from 'next/server'
import { forwardDrugPriceListsRequest } from '../_utils'

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params

    try {
        return await forwardDrugPriceListsRequest(`/api/v1/drug-price-lists/${id}`)
    } catch (error) {
        console.error('Failed to proxy price list detail', error)
        return new Response(JSON.stringify({ message: 'Failed to load price list details' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params

    try {
        const payload = await request.json()
        return await forwardDrugPriceListsRequest(`/api/v1/drug-price-lists/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Failed to proxy price list update', error)
        return new Response(JSON.stringify({ message: 'Failed to update price list' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params

    try {
        return await forwardDrugPriceListsRequest(`/api/v1/drug-price-lists/${id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy price list deletion', error)
        return new Response(JSON.stringify({ message: 'Failed to delete price list' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
