import { NextRequest } from 'next/server'
import { forwardApiRequest } from '../../../_proxy'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params

        return await forwardApiRequest(`/api/v1/drugs/by-pack/${id}`)
    } catch (error) {
        console.error('Failed to proxy drug pack dosage request', error)

        return new Response(
            JSON.stringify({ message: 'Failed to load configured dosage rules for pack' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            },
        )
    }
}

