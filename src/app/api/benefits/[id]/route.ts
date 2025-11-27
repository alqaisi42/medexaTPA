import { NextRequest } from 'next/server'
import { forwardPlansRequest } from '../../plans/_utils'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const payload = await request.json()
        return await forwardPlansRequest(
            `/api/policy/v1/benefits/${id}`,
            {
                method: 'PATCH',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('Failed to proxy benefit update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update benefit' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        return await forwardPlansRequest(
            `/api/policy/v1/benefits/${id}`,
            {
                method: 'DELETE',
            }
        )
    } catch (error) {
        console.error('Failed to proxy benefit deletion request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete benefit' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
