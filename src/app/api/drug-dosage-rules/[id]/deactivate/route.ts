import { NextRequest } from 'next/server'
import { forwardApiRequest } from '../../../_proxy'

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        return await forwardApiRequest(`/api/v1/drug-rules/${params.id}/deactivate`, { method: 'POST' })
    } catch (error) {
        console.error('Failed to proxy dosage rule deactivate request', error)
        return new Response(JSON.stringify({ message: 'Failed to deactivate dosage rule' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
