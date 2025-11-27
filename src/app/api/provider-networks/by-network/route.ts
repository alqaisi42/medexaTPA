import { NextRequest } from 'next/server'
import { forwardProviderNetworksRequest } from '../_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardProviderNetworksRequest('/api/v1/provider-networks/by-network', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy provider-networks by-network request', error)
        return new Response(JSON.stringify({ message: 'Failed to load provider-networks by network' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

