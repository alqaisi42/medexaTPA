import { NextRequest } from 'next/server'
import { forwardDoctorsRequest } from '../_utils'

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
            message: 'Invalid doctor ID',
            error: `Received invalid ID: ${id}`,
        }),
        {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        }
    )
}

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params

    if (!validateId(id)) return invalidIdResponse(id)

    try {
        return await forwardDoctorsRequest(`/api/v1/doctors/${id}`)
    } catch (error) {
        console.error('Failed to proxy doctor detail request', error)
        return new Response(
            JSON.stringify({ message: 'Failed to load doctor details' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        )
    }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params

    if (!validateId(id)) return invalidIdResponse(id)

    try {
        const payload = await request.json()

        return await forwardDoctorsRequest(`/api/v1/doctors/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Failed to proxy doctor update request', error)
        return new Response(
            JSON.stringify({ message: 'Failed to update doctor' }),
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
        return await forwardDoctorsRequest(`/api/v1/doctors/${id}`, {
            method: 'DELETE',
        })
    } catch (error) {
        console.error('Failed to proxy doctor delete request', error)
        return new Response(
            JSON.stringify({ message: 'Failed to delete doctor' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        )
    }
}

