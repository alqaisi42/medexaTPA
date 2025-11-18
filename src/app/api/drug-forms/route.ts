import { NextRequest } from 'next/server'
import { forwardDrugFormsRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardDrugFormsRequest('/api/v1/drug-forms', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy drug forms list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load drug forms' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardDrugFormsRequest(
            '/api/v1/drug-forms',
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
        console.error('Failed to proxy drug form creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create drug form' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
