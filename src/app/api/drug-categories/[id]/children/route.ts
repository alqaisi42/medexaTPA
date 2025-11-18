import { NextRequest } from 'next/server'
import { forwardDrugCategoryRequest } from '../../_utils'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params

    try {
        return await forwardDrugCategoryRequest(`/api/v1/drug-categories/${id}/children`, undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy child categories request', error)
        return new Response(JSON.stringify({ message: 'Failed to load child categories' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
