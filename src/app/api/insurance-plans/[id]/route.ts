import { NextRequest } from 'next/server'
import { forwardInsurancePlansRequest } from '../_utils'

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardInsurancePlansRequest(`/api/v1/insurance-plans/${id}`)
    } catch (error) {
        console.error('Failed to proxy insurance plan details request', error)
        return new Response(JSON.stringify({ message: 'Failed to load insurance plan details' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        const payload = await request.json()
        return await forwardInsurancePlansRequest(`/api/v1/insurance-plans/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        })
    } catch (error) {
        console.error('Failed to proxy insurance plan update request', error)
        return new Response(JSON.stringify({ message: 'Failed to update insurance plan' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    try {
        return await forwardInsurancePlansRequest(`/api/v1/insurance-plans/${id}`, { method: 'DELETE' })
    } catch (error) {
        console.error('Failed to proxy insurance plan deletion request', error)
        return new Response(JSON.stringify({ message: 'Failed to delete insurance plan' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

