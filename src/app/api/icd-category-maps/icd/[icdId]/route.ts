import { NextRequest } from "next/server"

const apiBaseUrl = process.env.API_BASE_URL

if (!apiBaseUrl) {
    throw new Error("API_BASE_URL environment variable is not defined.")
}

function buildUpstreamUrl(icdId: string, searchParams?: URLSearchParams) {
    const url = new URL(`/api/v1/icd-category-maps/icd/${icdId}`, apiBaseUrl)

    if (searchParams) {
        searchParams.forEach((value, key) => {
            if (value !== undefined && value !== null && value !== "") {
                url.searchParams.set(key, value)
            }
        })
    }

    return url.toString()
}

async function forwardRequest(icdId: string, searchParams: URLSearchParams) {
    const response = await fetch(buildUpstreamUrl(icdId, searchParams), {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
        cache: "no-store",
    })

    const text = await response.text()
    const contentType = response.headers.get("content-type") ?? "application/json"
    const body = contentType.includes("application/json") && text ? text : text || "{}"

    return new Response(body, {
        status: response.status,
        headers: {
            "Content-Type": contentType.includes("application/json") ? "application/json" : "text/plain",
        },
    })
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ icdId: string }> }
) {
    const { icdId } = await context.params

    try {
        return await forwardRequest(icdId, request.nextUrl.searchParams)
    } catch (error) {
        console.error("Failed to proxy ICD to category mapping list request", error)
        return new Response(JSON.stringify({ message: "Failed to load ICD category mappings" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}
