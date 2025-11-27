import { NextRequest } from 'next/server'
import { forwardCardsRequest } from '../cards/_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardCardsRequest('/api/v1/card-instructions', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy card instructions request', error)
        return new Response(JSON.stringify({ message: 'Failed to load card instructions' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardCardsRequest(
            '/api/v1/card-instructions',
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
        console.error('Failed to proxy card instruction creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create card instruction' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

