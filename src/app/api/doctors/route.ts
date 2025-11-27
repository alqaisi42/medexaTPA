import { NextRequest } from 'next/server'
import { forwardDoctorsRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardDoctorsRequest('/api/v1/doctors', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy doctors list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load doctors' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardDoctorsRequest(
            '/api/v1/doctors',
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
        console.error('Failed to proxy doctor creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create doctor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

