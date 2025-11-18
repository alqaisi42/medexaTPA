import { NextRequest } from 'next/server'
import { forwardDrugPricesRequest } from '../_utils'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        return await forwardDrugPricesRequest(`/api/v1/drug-prices/${params.id}`)
    } catch (error) {
        console.error('Failed to proxy drug price detail', error)
        return new Response(JSON.stringify({ message: 'Failed to load price details' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const payload = await request.json()
        return await forwardDrugPricesRequest(`/api/v1/drug-prices/${params.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Failed to proxy drug price update', error)
        return new Response(JSON.stringify({ message: 'Failed to update price' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        return await forwardDrugPricesRequest(`/api/v1/drug-prices/${params.id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy drug price deletion', error)
        return new Response(JSON.stringify({ message: 'Failed to delete price' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
