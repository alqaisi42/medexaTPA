import { NextRequest } from 'next/server'
import { forwardSubscribersRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardSubscribersRequest('/api/v1/subscribers', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy subscribers list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load subscribers' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardSubscribersRequest(
            '/api/v1/subscribers',
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
        console.error('Failed to proxy subscriber creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create subscriber' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

