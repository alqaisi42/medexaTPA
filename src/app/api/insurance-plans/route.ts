import { NextRequest } from 'next/server'
import { forwardInsurancePlansRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardInsurancePlansRequest('/api/v1/insurance-plans', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy insurance plans list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load insurance plans' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardInsurancePlansRequest(
            '/api/v1/insurance-plans',
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
        console.error('Failed to proxy insurance plan creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create insurance plan' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

