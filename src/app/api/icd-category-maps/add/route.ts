import { NextRequest } from "next/server"

const apiBaseUrl = process.env.API_BASE_URL

if (!apiBaseUrl) {
    throw new Error("API_BASE_URL environment variable is not defined.")
}

function buildUpstreamUrl(searchParams: URLSearchParams) {
    const url = new URL("/api/v1/icd-category-maps/add", apiBaseUrl)

    searchParams.forEach((value, key) => {
        if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, value)
        }
    })

    return url.toString()
}

async function forwardRequest(searchParams: URLSearchParams) {
    const response = await fetch(buildUpstreamUrl(searchParams), {
        method: "POST",
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

export async function POST(request: NextRequest) {
    try {
        return await forwardRequest(request.nextUrl.searchParams)
    } catch (error) {
        console.error("Failed to proxy ICD to category add request", error)
        return new Response(JSON.stringify({ message: "Failed to link ICD to category" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}
