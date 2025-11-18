import { NextRequest } from 'next/server'
import { forwardDrugPricesRequest } from './_utils'

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardDrugPricesRequest('/api/v1/drug-prices', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Failed to proxy drug price creation', error)
        return new Response(JSON.stringify({ message: 'Failed to create price' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
