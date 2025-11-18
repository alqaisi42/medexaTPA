import { NextRequest } from 'next/server'
import { forwardDrugFormsRequest } from '../_utils'

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardDrugFormsRequest(`/api/v1/drug-forms/${id}`)
    } catch (error) {
        console.error('Failed to proxy drug form details request', error)
        return new Response(JSON.stringify({ message: 'Failed to load drug form' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        const payload = await request.json()
        return await forwardDrugFormsRequest(`/api/v1/drug-forms/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        })
    } catch (error) {
        console.error('Failed to proxy drug form update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update drug form' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardDrugFormsRequest(`/api/v1/drug-forms/${id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy drug form deletion request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete drug form' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
