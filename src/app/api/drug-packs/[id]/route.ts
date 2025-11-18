import { NextRequest } from 'next/server'
import { forwardDrugPacksRequest } from '../_utils'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        return await forwardDrugPacksRequest(`/api/v1/drug-packs/${params.id}`)
    } catch (error) {
        console.error('Failed to proxy drug pack detail request', error)
        return new Response(JSON.stringify({ message: 'Failed to load drug pack details' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const payload = await request.json()
        return await forwardDrugPacksRequest(`/api/v1/drug-packs/${params.id}`, {
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

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        return await forwardDrugPacksRequest(`/api/v1/drug-packs/${params.id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy drug pack delete request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete drug pack' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
