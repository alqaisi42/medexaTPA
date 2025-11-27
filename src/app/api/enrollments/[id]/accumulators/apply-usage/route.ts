import { NextRequest, NextResponse } from 'next/server'
import { forwardApiRequest } from '../../../../_proxy'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  
  return forwardApiRequest(`/api/policy/v1/enrollments/${id}/accumulators/apply-usage`, {
    method: 'POST',
    headers: {
      'accept': '*/*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
}
