import { NextRequest } from 'next/server'
import { forwardContractsRequest } from '../_utils'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params

    if (!id || id === 'NaN' || id === 'undefined') {
        return new Response(JSON.stringify({ message: 'Invalid contract ID' }), {
            status: 400,
        })
    }

    try {
        return await forwardContractsRequest(`/api/policy/v1/contracts/${id}`)
    } catch (error) {
        console.error('Failed to proxy contract details request', error)
        return new Response(JSON.stringify({ message: 'Failed to load contract' }), {
            status: 500,
        })
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params

    try {
        const payload = await request.json()

        return await forwardContractsRequest(
            `/api/policy/v1/contracts/${id}`,
            {
                method: 'PATCH',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('Failed to proxy contract update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update contract' }), {
            status: 500,
        })
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params

    try {
        return await forwardContractsRequest(
            `/api/policy/v1/contracts/${id}`,
            {
                method: 'DELETE',
            }
        )
    } catch (error) {
        console.error('Failed to proxy contract deletion request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete contract' }), {
            status: 500,
        })
    }
}
