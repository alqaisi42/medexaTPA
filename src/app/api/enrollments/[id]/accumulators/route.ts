import { NextRequest, NextResponse } from 'next/server'
import { forwardApiRequest } from '../../../_proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  
  const year = searchParams.get('year')
  const planId = searchParams.get('planId')
  const page = searchParams.get('page') || '0'
  const size = searchParams.get('size') || '20'
  
  if (!year) {
    return NextResponse.json(
      { error: 'Year parameter is required' },
      { status: 400 }
    )
  }
  
  const queryParams = new URLSearchParams({ year, page, size })
  if (planId) {
    queryParams.set('planId', planId)
  }
  
  return forwardApiRequest(`/api/policy/v1/enrollments/${id}/accumulators`, {
    method: 'GET',
    headers: {
      'accept': '*/*'
    }
  }, queryParams)
}
