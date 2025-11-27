import { NextRequest, NextResponse } from 'next/server'
import { forwardApiRequest } from '../../../../_proxy'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
) {
  const { id, ruleId } = await params
  const body = await request.json()
  
  return forwardApiRequest(`/api/policy/v1/contracts/${id}/submission-rules/${ruleId}`, {
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
  { params }: { params: Promise<{ id: string; ruleId: string }> }
) {
  const { id, ruleId } = await params
  
  return forwardApiRequest(`/api/policy/v1/contracts/${id}/submission-rules/${ruleId}`, {
    method: 'DELETE',
    headers: {
      'accept': '*/*'
    }
  })
}
