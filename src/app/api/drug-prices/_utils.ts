const targetBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? ''

export async function forwardDrugPricesRequest(path: string, init?: RequestInit) {
    const targetUrl = `${targetBaseUrl}${path}`
    const response = await fetch(targetUrl, init)

    const body = await response.text()
    return new Response(body, {
        status: response.status,
        headers: { 'Content-Type': response.headers.get('content-type') ?? 'application/json' },
    })
}
