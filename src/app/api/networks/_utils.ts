const apiBaseUrl = process.env.API_BASE_URL

if (!apiBaseUrl) {
    throw new Error('API_BASE_URL environment variable is not defined.')
}

function buildNetworksUrl(path: string, searchParams?: URLSearchParams) {
    const url = new URL(path, apiBaseUrl)

    if (searchParams) {
        searchParams.forEach((value, key) => {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, value)
            }
        })
    }

    return url.toString()
}

export async function forwardNetworksRequest(path: string, init?: RequestInit, searchParams?: URLSearchParams) {
    const response = await fetch(buildNetworksUrl(path, searchParams), {
        ...init,
        headers: {
            Accept: 'application/json',
            ...(init?.headers ?? {}),
        },
        cache: 'no-store',
    })

    const text = await response.text()
    const contentType = response.headers.get('content-type') ?? 'application/json'
    const body = contentType.includes('application/json') && text ? text : text || '{}'

    return new Response(body, {
        status: response.status,
        headers: {
            'Content-Type': contentType.includes('application/json') ? 'application/json' : 'text/plain',
        },
    })
}

