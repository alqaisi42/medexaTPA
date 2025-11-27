import { NextRequest } from 'next/server'
import { forwardPoliciesRequest } from '../../_utils'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params
        return await forwardPoliciesRequest(`/api/v1/policies/waiting-periods/${id}`, undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy waiting period get request', error)
        return new Response(JSON.stringify({ message: 'Failed to load waiting period' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

