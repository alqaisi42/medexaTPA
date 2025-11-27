import { NextRequest } from 'next/server'
import { forwardProviderNetworksRequest } from './_utils'

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardProviderNetworksRequest(
            '/api/v1/provider-networks',
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
        console.error('Failed to proxy provider-network creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create provider-network link' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

