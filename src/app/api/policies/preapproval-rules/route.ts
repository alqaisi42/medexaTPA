import { NextRequest } from 'next/server'
import { forwardPoliciesRequest } from '../_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardPoliciesRequest('/api/v1/policies/preapproval-rules', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy preapproval rules request', error)
        return new Response(JSON.stringify({ message: 'Failed to load preapproval rules' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

