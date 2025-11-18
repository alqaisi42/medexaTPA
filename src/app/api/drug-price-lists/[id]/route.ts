import { NextRequest } from 'next/server'
import { forwardDrugPriceListsRequest } from '../_utils'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        return await forwardDrugPriceListsRequest(`/api/v1/drug-price-lists/${params.id}`)
    } catch (error) {
        console.error('Failed to proxy price list detail', error)
        return new Response(JSON.stringify({ message: 'Failed to load price list details' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const payload = await request.json()
        return await forwardDrugPriceListsRequest(`/api/v1/drug-price-lists/${params.id}`, {
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

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        return await forwardDrugPriceListsRequest(`/api/v1/drug-price-lists/${params.id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy price list deletion', error)
        return new Response(JSON.stringify({ message: 'Failed to delete price list' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
