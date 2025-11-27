import { NextRequest, NextResponse } from 'next/server'
import { forwardApiRequest } from '../../../../../_proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; combinationId: string }> }
) {
  const { id, combinationId } = await params
  
  return forwardApiRequest(`/api/policy/v1/${id}/limits/combinations/${combinationId}`, {
    method: 'GET',
    headers: {
      'accept': '*/*'
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; combinationId: string }> }
) {
  const { id, combinationId } = await params
  const body = await request.json()
  
  return forwardApiRequest(`/api/policy/v1/${id}/limits/combinations/${combinationId}`, {
    method: 'PUT',
    headers: {
      'accept': '*/*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; combinationId: string }> }
) {
  const { id, combinationId } = await params
  
  return forwardApiRequest(`/api/policy/v1/${id}/limits/combinations/${combinationId}`, {
    method: 'DELETE',
    headers: {
      'accept': '*/*'
    }
  })
}
