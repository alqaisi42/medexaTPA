import { NextRequest } from 'next/server'
import { forwardProcedureIcdCategoryRequest } from '../_utils'

interface RouteContext {
    params: { id: string }
}

export async function GET(request: NextRequest, context: RouteContext) {
    const { id } = context.params

    if (!id) {
        return new Response(JSON.stringify({ message: 'Identifier is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    try {
        return await forwardProcedureIcdCategoryRequest(
            `/api/v1/procedure-icd-category/${id}`,
            { method: 'GET' },
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy procedure ICD category fetch request', error)
        return new Response(JSON.stringify({ message: 'Failed to load ICD category mapping' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    const { id } = context.params

    if (!id) {
        return new Response(JSON.stringify({ message: 'Identifier is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    try {
        return await forwardProcedureIcdCategoryRequest(
            `/api/v1/procedure-icd-category/${id}`,
            { method: 'DELETE' },
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy procedure ICD category deletion request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete ICD category mapping' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
