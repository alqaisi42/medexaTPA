import { NextRequest } from 'next/server'
import { forwardPoliciesRequest } from '../_utils'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params
        return await forwardPoliciesRequest(`/api/v1/policies/${id}`, undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy policy get request', error)
        return new Response(JSON.stringify({ message: 'Failed to load policy' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params
        const payload = await request.json()
        return await forwardPoliciesRequest(
            `/api/v1/policies/${id}`,
            {
                method: 'PUT',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            },
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy policy update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update policy' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params
        return await forwardPoliciesRequest(
            `/api/v1/policies/${id}`,
            {
                method: 'DELETE',
            },
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy policy delete request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete policy' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

