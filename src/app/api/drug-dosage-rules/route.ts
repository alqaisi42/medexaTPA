import { NextRequest } from 'next/server'
import { forwardApiRequest } from '../_proxy'

export async function GET(request: NextRequest) {
    try {
        return await forwardApiRequest('/api/v1/drug-rules', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy dosage rules list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load dosage rules' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardApiRequest(
            '/api/v1/drug-rules',
            {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' },
            },
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy dosage rule creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create dosage rule' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
