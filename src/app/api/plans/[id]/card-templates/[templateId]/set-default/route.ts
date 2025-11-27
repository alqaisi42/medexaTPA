import { NextRequest } from 'next/server'
import { forwardPlansRequest } from '../../../../_utils'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; templateId: string }> }) {
    try {
        const { id, templateId } = await params
        return await forwardPlansRequest(
            `/api/policy/v1/plan-card-templates/plan/${id}/${templateId}/set-default`,
            {
                method: 'POST',
                body: '',
            }
        )
    } catch (error) {
        console.error('Failed to proxy set default template request', error)
        return new Response(JSON.stringify({ message: 'Failed to set default template' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
