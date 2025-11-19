import { NextRequest } from 'next/server'
import { forwardDrugRulesRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardDrugRulesRequest('/api/v1/drug-rules', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy drug rules list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load drug rules' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardDrugRulesRequest(
            '/api/v1/drug-rules',
            {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' },
            },
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy drug rule creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create drug rule' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
