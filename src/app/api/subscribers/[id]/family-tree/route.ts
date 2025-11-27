import { NextRequest } from 'next/server'
import { forwardSubscribersRequest } from '../../_utils'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        return await forwardSubscribersRequest(`/api/v1/subscribers/${id}/family-tree`, undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy family tree request', error)
        return new Response(JSON.stringify({ message: 'Failed to load family tree' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

