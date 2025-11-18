import { NextRequest } from 'next/server'
import { forwardDrugPricesRequest } from '../_utils'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const drugPackId = searchParams.get('drugPackId')
        const priceListId = searchParams.get('priceListId')

        const path = `/api/v1/drug-prices/active?${new URLSearchParams({
            drugPackId: drugPackId ?? '',
            priceListId: priceListId ?? '',
        }).toString()}`

        return await forwardDrugPricesRequest(path)
    } catch (error) {
        console.error('Failed to proxy active price lookup', error)
        return new Response(JSON.stringify({ message: 'Failed to load active price' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
