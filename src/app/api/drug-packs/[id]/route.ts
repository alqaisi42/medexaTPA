import { NextRequest } from 'next/server'
import { forwardDrugPacksRequest } from '../_utils'

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardDrugPacksRequest(`/api/v1/drug-packs/${id}`)
    } catch (error) {
        console.error('Failed to proxy drug pack detail request', error)
        return new Response(JSON.stringify({ message: 'Failed to load drug pack details' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        const payload = await request.json()
        return await forwardDrugPacksRequest(`/api/v1/drug-packs/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Failed to proxy drug pack update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update drug pack' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardDrugPacksRequest(`/api/v1/drug-packs/${id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy drug pack delete request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete drug pack' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
