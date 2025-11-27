import { NextRequest } from 'next/server'
import { forwardEnrollmentsRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardEnrollmentsRequest('/api/v1/enrollments', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy enrollments list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load enrollments' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardEnrollmentsRequest(
            '/api/v1/enrollments',
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
        console.error('Failed to proxy enrollment creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create enrollment' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

