import { NextRequest } from 'next/server'
import { forwardSubscribersRequest } from '../_utils'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        return await forwardSubscribersRequest(`/api/v1/subscribers/${id}`, undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy subscriber get request', error)
        return new Response(JSON.stringify({ message: 'Failed to load subscriber' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        const payload = await request.json()
        return await forwardSubscribersRequest(
            `/api/v1/subscribers/${id}`,
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
        console.error('Failed to proxy subscriber update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update subscriber' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        return await forwardSubscribersRequest(`/api/v1/subscribers/${id}`, {
            method: 'DELETE',
        })
    } catch (error) {
        console.error('Failed to proxy subscriber delete request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete subscriber' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

