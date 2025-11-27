import { NextRequest } from 'next/server'
import { forwardPlansRequest } from '../../../plans/_utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        return await forwardPlansRequest(`/api/policy/v1/benefits/${id}/mapping`)
    } catch (error) {
        console.error('Failed to proxy benefit mapping request', error)
        return new Response(JSON.stringify({ message: 'Failed to load benefit mapping' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const payload = await request.json()
        return await forwardPlansRequest(
            `/api/policy/v1/benefits/${id}/mapping`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('Failed to proxy benefit mapping creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create benefit mapping' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
