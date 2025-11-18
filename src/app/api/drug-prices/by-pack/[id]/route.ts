import { NextRequest } from 'next/server'
import { forwardDrugPricesRequest } from '../../_utils'

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params

    try {
        return await forwardDrugPricesRequest(`/api/v1/drug-prices/by-pack/${id}`)
    } catch (error) {
        console.error('Failed to proxy prices by pack', error)
        return new Response(JSON.stringify({ message: 'Failed to load pack prices' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
