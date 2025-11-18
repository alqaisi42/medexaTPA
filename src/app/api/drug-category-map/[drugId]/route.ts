import { NextRequest } from 'next/server'
import { forwardDrugCategoryRequest } from '../../drug-categories/_utils'

export async function GET(request: NextRequest, context: { params: Promise<{ drugId: string }> }) {
    const { drugId } = await context.params

    try {
        return await forwardDrugCategoryRequest(`/api/v1/drug-category-map/${drugId}`, undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy drug categories fetch request', error)
        return new Response(JSON.stringify({ message: 'Failed to load drug categories' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
