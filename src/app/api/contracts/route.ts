import { NextRequest } from 'next/server'
import { forwardContractsRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardContractsRequest('/api/policy/v1/contracts', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy contracts list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load contracts' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardContractsRequest(
            '/api/policy/v1/contracts',
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
        console.error('Failed to proxy contract creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create contract' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
