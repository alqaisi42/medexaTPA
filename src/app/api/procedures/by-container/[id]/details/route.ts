import { NextRequest } from 'next/server'

import { forwardProceduresRequest } from '../../../_utils'

interface RouteParams {
    params: {
        id: string
    }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        return await forwardProceduresRequest(
            `/api/v1/procedures/by-container/${params.id}/details`,
            undefined,
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy procedure container details request', error)
        return new Response(JSON.stringify({ message: 'Failed to load container procedure details' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
