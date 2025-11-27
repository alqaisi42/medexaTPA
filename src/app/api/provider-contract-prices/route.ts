import { NextRequest } from 'next/server'
import { forwardProviderContractPricesRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardProviderContractPricesRequest('/api/v1/provider-contract-prices', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy provider contract prices list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load provider contract prices' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardProviderContractPricesRequest(
            '/api/v1/provider-contract-prices',
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
        console.error('Failed to proxy provider contract price creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create provider contract price' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

