import { NextRequest } from 'next/server'
import { forwardDrugCategoryRequest } from '../../drug-categories/_utils'

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ drugId: string }> }
) {
    try {
        const { drugId } = await context.params

        return await forwardDrugCategoryRequest(`/api/v1/drug-category-map/${drugId}`)
    } catch (error) {
        console.error('Drug category fetch proxy error', error)
        return new Response(JSON.stringify({ message: 'Failed to load drug categories' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
