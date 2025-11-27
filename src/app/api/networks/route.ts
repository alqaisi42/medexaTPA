import { NextRequest } from 'next/server'
import { forwardNetworksRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardNetworksRequest('/api/v1/networks', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy networks list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load networks' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardNetworksRequest(
            '/api/v1/networks',
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
        console.error('Failed to proxy network creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create network' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

