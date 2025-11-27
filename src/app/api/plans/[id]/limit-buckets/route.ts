import { NextRequest } from 'next/server'
import { forwardPlansRequest } from '../../_utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        return await forwardPlansRequest(
            `/api/policy/v1/plans/${id}/limit-buckets`,
            undefined,
            request.nextUrl.searchParams
        )
    } catch (error) {
        console.error('Failed to proxy plan limit buckets request', error)
        return new Response(JSON.stringify({ message: 'Failed to load plan limit buckets' }), {
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
            `/api/policy/v1/plans/${id}/limit-buckets`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('Failed to proxy create limit bucket request', error)
        return new Response(JSON.stringify({ message: 'Failed to create limit bucket' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
