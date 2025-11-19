import { NextRequest } from 'next/server'
import {forwardApiRequest} from "@/app/api/_proxy";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params                   // ← FIX

        const payload = await request.json()

        return await forwardApiRequest(`/api/v1/drugs/${id}/dosage/recommendation`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Failed to proxy dosage recommendation request', error)
        return new Response(
            JSON.stringify({ message: 'Failed to compute dosage recommendation' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        )
    }
}

