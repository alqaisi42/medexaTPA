import { NextRequest } from 'next/server'

import { forwardProceduresRequest } from '../../_utils'

export async function DELETE(request: NextRequest) {
    try {
        return await forwardProceduresRequest(
            '/api/v1/procedures/unlink/category',
            {
                method: 'DELETE',
            },
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy procedure category unlink request', error)
        return new Response(JSON.stringify({ message: 'Failed to unlink procedure category' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
