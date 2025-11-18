import { NextRequest } from 'next/server'
import { forwardDrugCategoryRequest } from '../../../drug-categories/_utils'

export async function DELETE(_: NextRequest, context: { params: Promise<{ drugId: string; categoryId: string }> }) {
    const { drugId, categoryId } = await context.params

    try {
        return await forwardDrugCategoryRequest(`/api/v1/drug-category-map/${drugId}/${categoryId}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy drug category unlink request', error)
        return new Response(JSON.stringify({ message: 'Failed to remove drug category' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
