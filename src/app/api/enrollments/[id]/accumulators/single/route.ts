import { NextRequest, NextResponse } from 'next/server'
import { forwardApiRequest } from '../../../../_proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  
  const planId = searchParams.get('planId')
  const benefitId = searchParams.get('benefitId')
  const year = searchParams.get('year')
  
  if (!planId || !benefitId || !year) {
    return NextResponse.json(
      { error: 'planId, benefitId, and year parameters are required' },
      { status: 400 }
    )
  }
  
  const queryParams = new URLSearchParams({ planId, benefitId, year })
  
  return forwardApiRequest(`/api/policy/v1/enrollments/${id}/accumulators/single`, {
    method: 'GET',
    headers: {
      'accept': '*/*'
    }
  }, queryParams)
}
