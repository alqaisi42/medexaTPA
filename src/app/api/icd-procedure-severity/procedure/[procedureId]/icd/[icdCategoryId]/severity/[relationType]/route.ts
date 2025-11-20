import { NextRequest } from 'next/server'
import { forwardIcdProcedureSeverityRequest } from '../../../../../../_utils'

interface RouteContext {
    params: {
        procedureId: string
        icdCategoryId: string
        relationType: string
    }
}

export async function GET(request: NextRequest, context: RouteContext) {
    const { procedureId, icdCategoryId, relationType } = context.params

    if (!procedureId || !icdCategoryId || !relationType) {
        return new Response(JSON.stringify({ message: 'Procedure, ICD category, and relation type are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    try {
        return await forwardIcdProcedureSeverityRequest(
            `/api/icd-procedure-severity/procedure/${procedureId}/icd/${icdCategoryId}/severity/${relationType}`,
            { method: 'GET' },
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy ICD procedure severity lookup request', error)
        return new Response(JSON.stringify({ message: 'Failed to load ICD procedure severity' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
