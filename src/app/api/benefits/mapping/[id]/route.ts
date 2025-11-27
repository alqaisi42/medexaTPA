import { NextRequest } from 'next/server'
import { forwardPlansRequest } from '../../../plans/_utils'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        return await forwardPlansRequest(
            `/api/policy/v1/benefits/mapping/${id}`,
            {
                method: 'DELETE',
            }
        )
    } catch (error) {
        console.error('Failed to proxy benefit mapping deletion request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete benefit mapping' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
