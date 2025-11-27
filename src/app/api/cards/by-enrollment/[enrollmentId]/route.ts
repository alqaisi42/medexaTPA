import { NextRequest } from 'next/server'
import { forwardCardsRequest } from '../../_utils'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ enrollmentId: string }> },
) {
    try {
        const { enrollmentId } = await params
        return await forwardCardsRequest(`/api/v1/cards/by-enrollment/${enrollmentId}`, undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy cards by enrollment request', error)
        return new Response(JSON.stringify({ message: 'Failed to load cards' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

