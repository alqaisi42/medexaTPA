import { NextRequest } from 'next/server'
import { forwardContractsRequest } from '../../_utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        return await forwardContractsRequest(
            `/api/policy/v1/contracts/${id}/plans`,
            undefined,
            request.nextUrl.searchParams
        )
    } catch (error) {
        console.error('Failed to proxy contract plans request', error)
        return new Response(JSON.stringify({ message: 'Failed to load contract plans' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
