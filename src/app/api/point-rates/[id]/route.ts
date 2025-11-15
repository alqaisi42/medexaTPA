import { NextRequest } from 'next/server'

import { proxyToPricingBackend } from '../../_utils/proxy'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    return proxyToPricingBackend(request, `/api/point-rates/${params.id}`)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    return proxyToPricingBackend(request, `/api/point-rates/${params.id}`)
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    return proxyToPricingBackend(request, `/api/point-rates/${params.id}`)
}
