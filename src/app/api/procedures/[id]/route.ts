import { NextRequest } from 'next/server'
import { forwardProceduresRequest } from '../_utils'

interface RouteContext {
    params: { id: string }
}

export async function PUT(request: NextRequest, context: RouteContext) {
    const { id } = context.params

    if (!id) {
        return new Response(JSON.stringify({ message: 'Procedure identifier is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    try {
        const payload = await request.json()

        return await forwardProceduresRequest(
            `/api/v1/procedures/${id}`,
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
        console.error('Failed to proxy procedure update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update procedure' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    const { id } = context.params

    if (!id) {
        return new Response(JSON.stringify({ message: 'Procedure identifier is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    try {
        return await forwardProceduresRequest(`/api/v1/procedures/${id}`, { method: 'DELETE' }, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy procedure deletion request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete procedure' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
