import { NextRequest, NextResponse } from 'next/server'
import { forwardApiRequest } from '../../../../_proxy'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; policyId: string }> }
) {
  const { id, policyId } = await params
  const body = await request.json()
  
  return forwardApiRequest(`/api/policy/v1/contracts/${id}/pricing-policies/${policyId}`, {
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
  { params }: { params: Promise<{ id: string; policyId: string }> }
) {
  const { id, policyId } = await params
  
  return forwardApiRequest(`/api/policy/v1/contracts/${id}/pricing-policies/${policyId}`, {
    method: 'DELETE',
    headers: {
      'accept': '*/*'
    }
  })
}
