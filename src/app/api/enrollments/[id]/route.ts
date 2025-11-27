import { NextRequest } from 'next/server'
import { forwardEnrollmentsRequest } from '../_utils'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        return await forwardEnrollmentsRequest(`/api/v1/enrollments/${id}`, undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy enrollment get request', error)
        return new Response(JSON.stringify({ message: 'Failed to load enrollment' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

