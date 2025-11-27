import { NextRequest } from 'next/server'
import { forwardPlanNetworksRequest } from '../_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardPlanNetworksRequest('/api/v1/plan-networks/by-network', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy plan-networks by-network request', error)
        return new Response(JSON.stringify({ message: 'Failed to load plan-networks by network' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

