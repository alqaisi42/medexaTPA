import { NextRequest } from 'next/server'
import { forwardPlansRequest } from '../plans/_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardPlansRequest('/api/policy/v1/benefits', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy benefits list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load benefits' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardPlansRequest(
            '/api/policy/v1/benefits',
            {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('Failed to proxy benefit creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create benefit' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
