import { NextRequest } from 'next/server'
import { forwardPlanNetworksRequest } from './_utils'

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardPlanNetworksRequest(
            '/api/v1/plan-networks',
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
        console.error('Failed to proxy plan-network creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create plan-network link' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

