import { NextRequest } from 'next/server'
import { forwardPlanNetworksRequest } from '../_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardPlanNetworksRequest('/api/v1/plan-networks/by-plan', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy plan-networks by-plan request', error)
        return new Response(JSON.stringify({ message: 'Failed to load plan-networks by plan' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

