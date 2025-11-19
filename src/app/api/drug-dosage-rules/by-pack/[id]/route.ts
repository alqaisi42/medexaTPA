import { NextRequest } from 'next/server'
import { forwardApiRequest } from '../../../_proxy'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }   // ← params is Promise now
) {
    try {
        const { id } = await context.params          // ← FIX: unwrap Promise

        return await forwardApiRequest(`/api/v1/drug-rules/by-pack/${id}`)
    } catch (error) {
        console.error('Failed to proxy dosage rules by pack request', error)

        return new Response(
            JSON.stringify({ message: 'Failed to load dosage rules for pack' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        )
    }
}
