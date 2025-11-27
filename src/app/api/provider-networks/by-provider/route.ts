import { NextRequest } from 'next/server'
import { forwardProviderNetworksRequest } from '../_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardProviderNetworksRequest('/api/v1/provider-networks/by-provider', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy provider-networks by-provider request', error)
        return new Response(JSON.stringify({ message: 'Failed to load provider-networks by provider' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

