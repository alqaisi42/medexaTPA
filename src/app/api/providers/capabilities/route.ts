import { NextRequest } from 'next/server'
import { forwardProvidersRequest } from '../_utils'

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardProvidersRequest(
            '/api/v1/providers/capabilities',
            {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('Failed to proxy provider capabilities creation/update request', error)
        return new Response(
            JSON.stringify({ message: 'Failed to save provider capabilities' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        )
    }
}

