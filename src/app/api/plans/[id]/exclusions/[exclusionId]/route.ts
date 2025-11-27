import { NextRequest } from 'next/server'
import { forwardPlansRequest } from '../../../_utils'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; exclusionId: string }> }) {
    try {
        const { id, exclusionId } = await params
        const payload = await request.json()
        return await forwardPlansRequest(
            `/api/policy/v1/plans/${id}/exclusions/${exclusionId}`,
            {
                method: 'PATCH',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('Failed to proxy update exclusion request', error)
        return new Response(JSON.stringify({ message: 'Failed to update exclusion' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; exclusionId: string }> }) {
    try {
        const { id, exclusionId } = await params
        return await forwardPlansRequest(
            `/api/policy/v1/plans/${id}/exclusions/${exclusionId}`,
            {
                method: 'DELETE',
            }
        )
    } catch (error) {
        console.error('Failed to proxy delete exclusion request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete exclusion' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
