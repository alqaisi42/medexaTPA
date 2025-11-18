import { NextRequest } from 'next/server'
import { forwardDrugCategoryRequest } from '../_utils'

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params

    try {
        const payload = await request.json()
        return await forwardDrugCategoryRequest(`/api/v1/drug-categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        })
    } catch (error) {
        console.error('Failed to proxy drug category update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update drug category' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params

    try {
        return await forwardDrugCategoryRequest(`/api/v1/drug-categories/${id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy drug category delete request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete drug category' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
