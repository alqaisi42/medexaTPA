import { NextRequest } from 'next/server'
import { forwardProceduresRequest } from '../../../_utils'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params  // ← الحل الأساسي

        if (!id || id === 'undefined') {
            return new Response(
                JSON.stringify({ message: 'containerId is missing or invalid' }),
                { status: 400 }
            )
        }

        return await forwardProceduresRequest(
            `/api/v1/procedures/by-container/${id}/details`,
            undefined,
            request.nextUrl.searchParams
        )
    } catch (error) {
        console.error('Failed to proxy container details request', error)
        return new Response(
            JSON.stringify({ message: 'Failed to load container procedure details' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}
