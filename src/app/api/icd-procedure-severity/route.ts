import { NextRequest } from 'next/server'
import { forwardIcdProcedureSeverityRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardIcdProcedureSeverityRequest('/api/icd-procedure-severity', { method: 'GET' }, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy ICD procedure severity list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load ICD procedure severities' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardIcdProcedureSeverityRequest(
            '/api/icd-procedure-severity',
            {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' },
            },
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy ICD procedure severity creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create ICD procedure severity' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
