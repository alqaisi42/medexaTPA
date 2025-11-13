import { NextRequest } from 'next/server'
import { forwardProceduresRequest } from '../_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardProceduresRequest(
            '/api/v1/procedures/categories',
            undefined,
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy procedure categories request', error)
        return new Response(JSON.stringify({ message: 'Failed to load procedure categories' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
