import { NextRequest } from 'next/server'
import { forwardPlansRequest } from '../../_utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        return await forwardPlansRequest(
            `/api/policy/v1/plans/${id}/benefits`,
            undefined,
            request.nextUrl.searchParams
        )
    } catch (error) {
        console.error('Failed to proxy plan benefits request', error)
        return new Response(JSON.stringify({ message: 'Failed to load plan benefits' }), {
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
            `/api/policy/v1/plans/${id}/benefits`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('Failed to proxy add benefit to plan request', error)
        return new Response(JSON.stringify({ message: 'Failed to add benefit to plan' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
