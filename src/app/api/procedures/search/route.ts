import { NextRequest } from 'next/server'
import { forwardProceduresRequest } from '../_utils'

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardProceduresRequest(
            '/api/v1/procedures/search',
            {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            },
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy procedures search request', error)
        return new Response(JSON.stringify({ message: 'Failed to search procedures' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
