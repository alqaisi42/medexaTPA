import { NextRequest } from 'next/server'
import { forwardProcedureIcdCategoryRequest } from './_utils'

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardProcedureIcdCategoryRequest(
            '/api/v1/procedure-icd-category',
            {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' },
            },
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy procedure ICD category creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create ICD category mapping' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
