import { NextRequest } from 'next/server'
import { forwardProviderContractsRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardProviderContractsRequest('/api/v1/provider-contracts', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy provider contracts list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load provider contracts' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardProviderContractsRequest(
            '/api/v1/provider-contracts',
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
        console.error('Failed to proxy provider contract creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create provider contract' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

