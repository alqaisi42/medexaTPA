import { NextRequest } from 'next/server'
import { forwardPoliciesRequest } from '../_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardPoliciesRequest('/api/v1/policies/maternity-rules/by-policy', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy maternity rules request', error)
        return new Response(JSON.stringify({ message: 'Failed to load maternity rules' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardPoliciesRequest(
            '/api/v1/policies/maternity-rules',
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
        console.error('Failed to proxy maternity rules creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create maternity rules' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

