import { NextRequest } from 'next/server'
import { forwardProvidersRequest } from '../_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardProvidersRequest('/api/v1/providers/departments', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy provider departments list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load provider departments' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardProvidersRequest(
            '/api/v1/providers/departments',
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
        console.error('Failed to proxy provider department creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create provider department' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
