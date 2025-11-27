import { NextRequest } from 'next/server'
import { forwardApiRequest } from '../../_proxy'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        return await forwardApiRequest(`/api/v1/drug-rules/${id}`)
    } catch (error) {
        console.error('Failed to proxy dosage rule details request', error)
        return new Response(JSON.stringify({ message: 'Failed to load dosage rule' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const payload = await request.json()
        return await forwardApiRequest(`/api/v1/drug-rules/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Failed to proxy dosage rule update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update dosage rule' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        return await forwardApiRequest(`/api/v1/drug-rules/${id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy dosage rule delete request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete dosage rule' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
