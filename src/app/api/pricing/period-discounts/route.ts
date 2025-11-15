import { NextRequest } from 'next/server'

import { proxyToPricingBackend } from '../../_utils/proxy'

export async function GET(request: NextRequest) {
    return proxyToPricingBackend(request, '/api/pricing/period-discounts')
}

export async function POST(request: NextRequest) {
    return proxyToPricingBackend(request, '/api/pricing/period-discounts')
}
