import { NextRequest } from 'next/server'
import { forwardDrugPacksRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardDrugPacksRequest('/api/v1/drug-packs', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy drug packs list request', error)
        return new Response(JSON.stringify({ message: 'Failed to load drug packs' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardDrugPacksRequest(
            '/api/v1/drug-packs',
            {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            },
            request.nextUrl.searchParams,
        )
    } catch (error) {
        console.error('Failed to proxy drug pack creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create drug pack' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
