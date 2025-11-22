import { NextRequest } from 'next/server'
import { forwardProvidersRequest } from '../../_utils'

export async function DELETE(_: NextRequest, context: { params: { id: string } }) {
    const { id } = context.params
    try {
        return await forwardProvidersRequest(`/api/v1/providers/departments/${id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy provider department delete request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete provider department' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
