import { NextRequest } from 'next/server'
import { forwardDrugsRequest } from '../_utils'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        return await forwardDrugsRequest(`/api/v1/drugs/${params.id}`)
    } catch (error) {
        console.error('Failed to proxy drug details request', error)
        return new Response(JSON.stringify({ message: 'Failed to load drug details' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const payload = await request.json()
        return await forwardDrugsRequest(`/api/v1/drugs/${params.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        })
    } catch (error) {
        console.error('Failed to proxy drug update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update drug' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        return await forwardDrugsRequest(`/api/v1/drugs/${params.id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy drug deletion request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete drug' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
