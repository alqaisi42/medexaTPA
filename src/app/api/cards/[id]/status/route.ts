import { NextRequest } from 'next/server'
import { forwardCardsRequest } from '../../_utils'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        const payload = await request.json()
        return await forwardCardsRequest(
            `/api/v1/cards/${id}/status`,
            {
                method: 'PUT',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            },
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy card status update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update card status' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

