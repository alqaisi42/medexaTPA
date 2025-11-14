import { NextRequest } from 'next/server'

import { forwardProceduresRequest } from '../../_utils'

interface RouteParams {
    params: {
        id: string
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const payload = await request.json()

        return await forwardProceduresRequest(
            `/api/v1/procedures/categories/${params.id}`,
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
        console.error('Failed to proxy procedure category update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update procedure category' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        return await forwardProceduresRequest(
            `/api/v1/procedures/categories/${params.id}`,
            {
                method: 'DELETE',
            },
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy procedure category deletion request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete procedure category' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
