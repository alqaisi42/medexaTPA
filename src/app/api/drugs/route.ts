import { NextRequest } from 'next/server'
import { forwardDrugsRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardDrugsRequest('/api/v1/drugs', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy drugs list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load drugs' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardDrugsRequest(
            '/api/v1/drugs',
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
        console.error('Failed to proxy drug creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create drug' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
