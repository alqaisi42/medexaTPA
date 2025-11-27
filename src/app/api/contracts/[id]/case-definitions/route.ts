import { NextRequest, NextResponse } from 'next/server'
import { forwardApiRequest } from '../../../_proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  
  const page = searchParams.get('page') || '0'
  const size = searchParams.get('size') || '20'
  
  const queryParams = new URLSearchParams({ page, size })
  
  return forwardApiRequest(`/api/policy/v1/contracts/${id}/case-definitions`, {
    method: 'GET',
    headers: {
      'accept': '*/*'
    }
  }, queryParams)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  
  return forwardApiRequest(`/api/policy/v1/contracts/${id}/case-definitions`, {
    method: 'POST',
    headers: {
      'accept': '*/*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
}
