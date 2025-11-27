import { NextRequest } from 'next/server'
import { forwardCardsRequest } from '../_utils'

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardCardsRequest(
            '/api/v1/cards/issue',
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
        console.error('Failed to proxy card issue request', error)
        return new Response(JSON.stringify({ message: 'Failed to issue card' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

