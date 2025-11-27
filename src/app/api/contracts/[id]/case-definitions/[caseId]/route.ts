import { NextRequest, NextResponse } from 'next/server'
import { forwardApiRequest } from '../../../../_proxy'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; caseId: string }> }
) {
  const { id, caseId } = await params
  const body = await request.json()
  
  return forwardApiRequest(`/api/policy/v1/contracts/${id}/case-definitions/${caseId}`, {
    method: 'PATCH',
    headers: {
      'accept': '*/*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; caseId: string }> }
) {
  const { id, caseId } = await params
  
  return forwardApiRequest(`/api/policy/v1/contracts/${id}/case-definitions/${caseId}`, {
    method: 'DELETE',
    headers: {
      'accept': '*/*'
    }
  })
}
