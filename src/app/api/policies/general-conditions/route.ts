import { NextRequest } from 'next/server'
import { forwardPoliciesRequest } from '../_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardPoliciesRequest('/api/v1/policies/general-conditions/by-policy', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy general conditions request', error)
        return new Response(JSON.stringify({ message: 'Failed to load general conditions' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardPoliciesRequest(
            '/api/v1/policies/general-conditions',
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
        console.error('Failed to proxy general conditions creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create general conditions' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

