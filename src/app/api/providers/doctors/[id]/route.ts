import { NextRequest } from 'next/server'
import { forwardProvidersRequest } from '../../_utils'

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
    const { id } = context.params
    try {
        const payload = await request.json()
        return await forwardProvidersRequest(`/api/v1/providers/doctors/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Failed to proxy provider doctor update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update provider doctor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(_: NextRequest, context: { params: { id: string } }) {
    const { id } = context.params
    try {
        return await forwardProvidersRequest(`/api/v1/providers/doctors/${id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy provider doctor delete request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete provider doctor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
