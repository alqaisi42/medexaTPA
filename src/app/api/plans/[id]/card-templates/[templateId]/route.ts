import { NextRequest } from 'next/server'
import { forwardPlansRequest } from '../../../_utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; templateId: string }> }) {
    try {
        const { templateId } = await params
        return await forwardPlansRequest(
            `/api/policy/v1/plan-card-templates/${templateId}`
        )
    } catch (error) {
        console.error('Failed to proxy card template details request', error)
        return new Response(JSON.stringify({ message: 'Failed to load card template' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; templateId: string }> }) {
    try {
        const { templateId } = await params
        const payload = await request.json()
        return await forwardPlansRequest(
            `/api/policy/v1/plan-card-templates/${templateId}`,
            {
                method: 'PUT',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('Failed to proxy update card template request', error)
        return new Response(JSON.stringify({ message: 'Failed to update card template' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; templateId: string }> }) {
    try {
        const { templateId } = await params
        return await forwardPlansRequest(
            `/api/policy/v1/plan-card-templates/${templateId}`,
            {
                method: 'DELETE',
            }
        )
    } catch (error) {
        console.error('Failed to proxy delete card template request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete card template' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
