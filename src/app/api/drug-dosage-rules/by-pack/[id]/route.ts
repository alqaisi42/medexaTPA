import { NextRequest } from 'next/server'
import { forwardApiRequest } from '../../../../_proxy'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        return await forwardApiRequest(`/api/v1/drug-dosage-rules/by-pack/${params.id}`)
    } catch (error) {
        console.error('Failed to proxy dosage rules by pack request', error)
        return new Response(JSON.stringify({ message: 'Failed to load dosage rules for pack' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
