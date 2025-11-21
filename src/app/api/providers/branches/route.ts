import { NextRequest } from 'next/server'
import { forwardProvidersRequest } from '../_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardProvidersRequest('/api/v1/providers/branches', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy provider branches list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load provider branches' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardProvidersRequest(
            '/api/v1/providers/branches',
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
        console.error('Failed to proxy provider branch creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create provider branch' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
