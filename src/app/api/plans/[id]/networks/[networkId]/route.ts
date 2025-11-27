import { NextRequest } from 'next/server'
import { forwardPlansRequest } from '../../../_utils'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; networkId: string }> }) {
    try {
        const { id, networkId } = await params
        const payload = await request.json()
        return await forwardPlansRequest(
            `/api/policy/v1/plans/${id}/networks/${networkId}`,
            {
                method: 'PUT',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('Failed to proxy update plan network request', error)
        return new Response(JSON.stringify({ message: 'Failed to update plan network' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; networkId: string }> }) {
    try {
        const { id, networkId } = await params
        return await forwardPlansRequest(
            `/api/policy/v1/plans/${id}/networks/${networkId}`,
            {
                method: 'DELETE',
            }
        )
    } catch (error) {
        console.error('Failed to proxy detach network from plan request', error)
        return new Response(JSON.stringify({ message: 'Failed to detach network from plan' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
