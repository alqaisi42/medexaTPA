import { NextRequest } from 'next/server'
import { forwardApiRequest } from '../../_proxy'

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json()
        return await forwardApiRequest('/api/v1/drug-decision/evaluate', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Failed to proxy drug decision evaluate request', error)
        return new Response(JSON.stringify({ message: 'Failed to evaluate drug decision' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
