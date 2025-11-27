import { NextRequest } from 'next/server'
import { forwardPlansRequest } from '../../../_utils'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; benefitId: string }> }) {
    try {
        const { id, benefitId } = await params
        const payload = await request.json()
        return await forwardPlansRequest(
            `/api/policy/v1/plans/${id}/benefits/${benefitId}`,
            {
                method: 'PUT',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('Failed to proxy update plan benefit request', error)
        return new Response(JSON.stringify({ message: 'Failed to update plan benefit' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; benefitId: string }> }) {
    try {
        const { id, benefitId } = await params
        return await forwardPlansRequest(
            `/api/policy/v1/plans/${id}/benefits/${benefitId}`,
            {
                method: 'DELETE',
            }
        )
    } catch (error) {
        console.error('Failed to proxy delete plan benefit request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete plan benefit' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
