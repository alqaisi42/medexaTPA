import { NextRequest } from 'next/server'
import { forwardDepartmentsRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardDepartmentsRequest('/api/v1/departments', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy departments list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load departments' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardDepartmentsRequest(
            '/api/v1/departments',
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
        console.error('Failed to proxy department creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create department' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

