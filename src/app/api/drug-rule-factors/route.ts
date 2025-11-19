import { NextRequest } from 'next/server'
import { forwardDrugRulesRequest } from '../drug-rules/_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardDrugRulesRequest('/api/v1/drug-rule-factors', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy drug rule factors list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load drug rule factors' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardDrugRulesRequest(
            '/api/v1/drug-rule-factors',
            {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' },
            },
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy drug rule factor creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create drug rule factor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
