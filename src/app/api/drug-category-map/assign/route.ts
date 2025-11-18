import { NextRequest } from 'next/server'
import { forwardDrugCategoryRequest } from '../../drug-categories/_utils'

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardDrugCategoryRequest('/api/v1/drug-category-map', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        })
    } catch (error) {
        console.error('Failed to proxy drug category assignment request', error)
        return new Response(JSON.stringify({ message: 'Failed to assign category to drug' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
