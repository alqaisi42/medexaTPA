import { NextRequest } from 'next/server'
import { forwardDrugCategoryRequest } from './_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardDrugCategoryRequest('/api/v1/drug-categories/tree', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy drug categories tree request', error)
        return new Response(JSON.stringify({ message: 'Failed to load drug categories' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardDrugCategoryRequest('/api/v1/drug-categories', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        })
    } catch (error) {
        console.error('Failed to proxy drug category creation request', error)
        return new Response(JSON.stringify({ message: 'Failed to create drug category' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
