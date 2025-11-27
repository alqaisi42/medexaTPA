import { NextRequest } from 'next/server'
import { forwardDrugPacksRequest } from '../../_utils'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        return await forwardDrugPacksRequest(`/api/v1/drug-packs/by-drug/${id}`)
    } catch (error) {
        console.error('Failed to proxy drug packs by drug request', error)
        return new Response(JSON.stringify({ message: 'Failed to load drug packs' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
