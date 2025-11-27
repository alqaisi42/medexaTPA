import { NextRequest } from 'next/server'
import { forwardPlansRequest } from '../../../_utils'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; bucketId: string }> }) {
    try {
        const { id, bucketId } = await params
        const payload = await request.json()
        return await forwardPlansRequest(
            `/api/policy/v1/plans/${id}/limit-buckets/${bucketId}`,
            {
                method: 'PUT',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('Failed to proxy update limit bucket request', error)
        return new Response(JSON.stringify({ message: 'Failed to update limit bucket' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; bucketId: string }> }) {
    try {
        const { id, bucketId } = await params
        return await forwardPlansRequest(
            `/api/policy/v1/plans/${id}/limit-buckets/${bucketId}`,
            {
                method: 'DELETE',
            }
        )
    } catch (error) {
        console.error('Failed to proxy delete limit bucket request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete limit bucket' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
