import { NextRequest } from 'next/server'
import { forwardPoliciesRequest } from '../_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardPoliciesRequest('/api/v1/policies/provider-exceptions', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy provider exceptions request', error)
        return new Response(JSON.stringify({ message: 'Failed to load provider exceptions' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

