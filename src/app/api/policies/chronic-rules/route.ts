import { NextRequest } from 'next/server'
import { forwardPoliciesRequest } from '../_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardPoliciesRequest('/api/v1/policies/chronic-rules', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy chronic rules request', error)
        return new Response(JSON.stringify({ message: 'Failed to load chronic rules' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardPoliciesRequest(
            '/api/v1/policies/chronic-rules',
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
        console.error('Failed to proxy chronic rules creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create chronic rules' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

