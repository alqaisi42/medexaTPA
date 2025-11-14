import { NextRequest } from 'next/server'

import { forwardProceduresRequest } from '../../_utils'

export async function DELETE(request: NextRequest) {
    try {
        return await forwardProceduresRequest(
            '/api/v1/procedures/unlink/container',
            {
                method: 'DELETE',
            },
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy procedure container unlink request', error)
        return new Response(JSON.stringify({ message: 'Failed to unlink procedure container' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
