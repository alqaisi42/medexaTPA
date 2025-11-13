import { NextRequest } from 'next/server'
import { forwardProceduresRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardProceduresRequest('/api/v1/procedures', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy procedures list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load procedures' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardProceduresRequest(
            '/api/v1/procedures',
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
        console.error('Failed to proxy procedure creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create procedure' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
