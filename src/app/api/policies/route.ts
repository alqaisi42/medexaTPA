import { NextRequest } from 'next/server'
import { forwardPoliciesRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardPoliciesRequest('/api/v1/policies/search', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy policies search request', error)
        return new Response(JSON.stringify({ message: 'Failed to load policies' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardPoliciesRequest(
            '/api/v1/policies',
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
        console.error('Failed to proxy policy creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create policy' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

