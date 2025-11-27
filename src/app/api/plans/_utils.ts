const apiBaseUrl = process.env.API_BASE_URL

if (!apiBaseUrl) {
    throw new Error('API_BASE_URL environment variable is not defined.')
}

export function buildPlansUrl(path: string, searchParams?: URLSearchParams) {
    const url = new URL(path, apiBaseUrl)
    if (searchParams) {
        searchParams.forEach((value, key) => {
            url.searchParams.set(key, value)
        })
    }
    return url.toString()
}

export async function forwardPlansRequest(
    path: string,
    init?: RequestInit,
    searchParams?: URLSearchParams,
) {
    const url = buildPlansUrl(path, searchParams)
    
    const response = await fetch(url, {
        ...init,
        headers: {
            ...init?.headers,
            'Accept': '*/*',
        },
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
            'Content-Type': 'application/json',
        },
    })
}
