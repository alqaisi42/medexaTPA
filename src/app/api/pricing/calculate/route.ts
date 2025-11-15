import { NextRequest } from 'next/server'

import { proxyToPricingBackend } from '../../_utils/proxy'

export async function POST(request: NextRequest) {
    return proxyToPricingBackend(request, '/api/pricing/calculate')
}
