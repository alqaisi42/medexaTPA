import { NextRequest } from 'next/server'
import { forwardPlansRequest } from '../../_utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        return await forwardPlansRequest(
            `/api/policy/v1/plan-card-templates/plan/${id}`,
            undefined,
            request.nextUrl.searchParams
        )
    } catch (error) {
        console.error('Failed to proxy plan card templates request', error)
        return new Response(JSON.stringify({ message: 'Failed to load plan card templates' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const payload = await request.json()
        
        // Ensure planId matches the route parameter
        payload.planId = parseInt(id)
        
        return await forwardPlansRequest(
            `/api/policy/v1/plan-card-templates`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('Failed to proxy create card template request', error)
        return new Response(JSON.stringify({ message: 'Failed to create card template' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
