import { NextRequest, NextResponse } from 'next/server'

const BACKEND_BASE_URL = [
    process.env.PRICING_SERVICE_URL,
    process.env.PRICING_API_BASE_URL,
    process.env.NEXT_PUBLIC_PRICING_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
]
    .find((value) => typeof value === 'string' && value.trim().length > 0)
    ?.replace(/\/$/, '')

function buildBackendUrl(path: string, search: string): string {
    if (!BACKEND_BASE_URL) {
        throw new Error('Missing pricing backend base URL')
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const url = new URL(normalizedPath, `${BACKEND_BASE_URL}/`)

    if (search) {
        url.search = search
    }

    return url.toString()
}

async function readRequestBody(request: NextRequest): Promise<BodyInit | undefined> {
    if (request.method === 'GET' || request.method === 'HEAD') {
        return undefined
    }

    if (!request.body) {
        return undefined
    }

    const contentType = request.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
        return request.body
    }

    if (contentType.includes('application/x-www-form-urlencoded')) {
        const params: [string, string][] = []
        const formData = await request.formData()
        formData.forEach((value, key) => {
            params.push([key, typeof value === 'string' ? value : value.name])
        })
        return new URLSearchParams(params)
    }

    const text = await request.text()
    return text.length ? text : undefined
}

export async function proxyToPricingBackend(request: NextRequest, backendPath: string): Promise<NextResponse> {
    try {
        const backendUrl = buildBackendUrl(backendPath, request.nextUrl.search)

        const headers = new Headers(request.headers)
        headers.delete('host')
        headers.set('accept', headers.get('accept') ?? 'application/json')

        const body = await readRequestBody(request)

        const response = await fetch(backendUrl, {
            method: request.method,
            headers,
            body,
        })

        const responseHeaders = new Headers(response.headers)
        responseHeaders.delete('transfer-encoding')

        const responseBody = await response.arrayBuffer()

        return new NextResponse(responseBody, {
            status: response.status,
            headers: responseHeaders,
        })
    } catch (error) {
        console.error(`Failed to proxy ${request.method} ${backendPath}:`, error)
        return NextResponse.json({ message: 'Pricing service unavailable' }, { status: 502 })
    }
}
