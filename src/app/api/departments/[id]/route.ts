import { NextRequest } from 'next/server'
import { forwardDepartmentsRequest } from '../_utils'

function validateId(id: string): boolean {
    return id !== undefined &&
        id !== null &&
        id.trim() !== '' &&
        id !== 'NaN' &&
        !isNaN(Number(id))
}

function invalidIdResponse(id: string) {
    return new Response(
        JSON.stringify({
            success: false,
            message: 'Invalid department ID',
            error: `Received invalid ID: ${id}`,
        }),
        {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        }
    )
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params

    if (!validateId(id)) return invalidIdResponse(id)

    try {
        const payload = await request.json()

        return await forwardDepartmentsRequest(`/api/v1/departments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Failed to proxy department update request', error)
        return new Response(
            JSON.stringify({ message: 'Failed to update department' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        )
    }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params

    if (!validateId(id)) return invalidIdResponse(id)

    try {
        return await forwardDepartmentsRequest(`/api/v1/departments/${id}`, {
            method: 'DELETE',
        })
    } catch (error) {
        console.error('Failed to proxy department delete request', error)
        return new Response(
            JSON.stringify({ message: 'Failed to delete department' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        )
    }
}

