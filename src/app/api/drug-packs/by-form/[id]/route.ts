import { NextRequest } from 'next/server'
import { forwardDrugPacksRequest } from '../../_utils'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        return await forwardDrugPacksRequest(`/api/v1/drug-packs/by-form/${params.id}`)
    } catch (error) {
        console.error('Failed to proxy drug packs by form request', error)
        return new Response(JSON.stringify({ message: 'Failed to load drug packs' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
