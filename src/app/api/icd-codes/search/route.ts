import { NextRequest } from "next/server"

const apiBaseUrl = process.env.API_BASE_URL

if (!apiBaseUrl) {
    throw new Error("API_BASE_URL environment variable is not defined.")
}

async function forwardSearchRequest(searchParams: URLSearchParams) {
    const url = new URL("/api/v1/icd-codes/search", apiBaseUrl)

    searchParams.forEach((value, key) => {
        if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, value)
        }
    })

    const response = await fetch(url.toString(), {
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

export async function GET(request: NextRequest) {
    try {
        return await forwardSearchRequest(request.nextUrl.searchParams)
    } catch (error) {
        console.error("Failed to proxy ICD search request", error)
        return new Response(JSON.stringify({ message: "Failed to search ICD codes" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}
