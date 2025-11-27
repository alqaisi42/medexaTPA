import { NextRequest } from 'next/server'
import { forwardPlansRequest } from '../../../_utils'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; treatyId: string }> }) {
    try {
        const { id, treatyId } = await params
        const payload = await request.json()
        return await forwardPlansRequest(
            `/api/policy/v1/plans/${id}/reinsurance/${treatyId}`,
            {
                method: 'PUT',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('Failed to proxy update reinsurance request', error)
        return new Response(JSON.stringify({ message: 'Failed to update reinsurance' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; treatyId: string }> }) {
    try {
        const { id, treatyId } = await params
        return await forwardPlansRequest(
            `/api/policy/v1/plans/${id}/reinsurance/${treatyId}`,
            {
                method: 'DELETE',
            }
        )
    } catch (error) {
        console.error('Failed to proxy detach reinsurance request', error)
        return new Response(JSON.stringify({ message: 'Failed to detach reinsurance' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
