import { NextRequest } from 'next/server'
import { forwardPlansRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardPlansRequest('/api/policy/v1/plans', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy plans list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load plans' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardPlansRequest(
            '/api/policy/v1/plans',
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
        console.error('Failed to proxy plan creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create plan' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
