import { NextRequest } from 'next/server'
import { forwardDrugCategoryRequest } from '../_utils'

export async function GET(request: NextRequest) {
    try {
        return await forwardDrugCategoryRequest('/api/v1/drug-categories/tree', undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error('Failed to proxy drug categories tree request', error)
        return new Response(JSON.stringify({ message: 'Failed to load drug categories tree' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

