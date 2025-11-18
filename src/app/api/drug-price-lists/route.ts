import { NextRequest } from 'next/server'
import { forwardDrugPriceListsRequest } from './_utils'

export async function GET() {
    try {
        return await forwardDrugPriceListsRequest('/api/v1/drug-price-lists')
    } catch (error) {
        console.error('Failed to proxy price list fetch', error)
        return new Response(JSON.stringify({ message: 'Failed to load price lists' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardDrugPriceListsRequest('/api/v1/drug-price-lists', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Failed to proxy price list creation', error)
        return new Response(JSON.stringify({ message: 'Failed to create price list' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
