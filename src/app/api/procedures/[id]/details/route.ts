import { NextRequest } from 'next/server'
import { forwardProceduresRequest } from '../../_utils'

interface RouteContext {
    params: { id: string }
}

export async function GET(request: NextRequest, context: RouteContext) {
    const { id } = context.params

    if (!id) {
        return new Response(JSON.stringify({ message: 'Procedure identifier is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    try {
        return await forwardProceduresRequest(`/api/v1/procedures/${id}/details`, undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy procedure details request', error)
        return new Response(JSON.stringify({ message: 'Failed to load procedure details' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
