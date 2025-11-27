import { NextRequest } from 'next/server'
import { forwardProvidersRequest } from '../../_utils'

function validateId(id: string): boolean {
    return id !== undefined &&
        id !== null &&
        id.trim() !== '' &&
        id !== 'NaN' &&
        !isNaN(Number(id))
}

function invalidIdResponse(id: string) {
    return new Response(
        JSON.stringify({
            success: false,
            message: 'Invalid provider ID',
            error: `Received invalid ID: ${id}`,
        }),
        {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        }
    )
}

export async function GET(_: NextRequest, context: { params: Promise<{ providerId: string }> }) {
    const { providerId } = await context.params

    if (!validateId(providerId)) return invalidIdResponse(providerId)

    try {
        return await forwardProvidersRequest(`/api/v1/providers/capabilities/${providerId}`)
    } catch (error) {
        console.error('Failed to proxy provider capabilities request', error)
        return new Response(
            JSON.stringify({ message: 'Failed to load provider capabilities' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        )
    }
}

