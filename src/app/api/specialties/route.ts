import { NextRequest } from "next/server"

const apiBaseUrl = process.env.API_BASE_URL

if (!apiBaseUrl) {
    throw new Error("API_BASE_URL environment variable is not defined.")
}

function buildUpstreamUrl(path: string, searchParams?: URLSearchParams) {
    const url = new URL(path, apiBaseUrl)

    if (searchParams) {
        searchParams.forEach((value, key) => {
            if (value !== undefined && value !== null && value !== "") {
                url.searchParams.set(key, value)
            }
        })
    }

    return url.toString()
}

async function forwardRequest(path: string, init?: RequestInit, searchParams?: URLSearchParams) {
    const response = await fetch(buildUpstreamUrl(path, searchParams), {
        ...init,
        headers: {
            Accept: "application/json",
            ...(init?.headers ?? {}),
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
        return await forwardRequest("/api/v1/specialties", undefined, request.nextUrl.searchParams)
    } catch (error) {
        console.error("Failed to proxy specialties list request", error)
        return new Response(JSON.stringify({ message: "Failed to load specialties" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}

export async function POST(request: NextRequest) {
    const payload = await request.json()

    try {
        return await forwardRequest("/api/v1/specialties", {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json",
            },
        })
    } catch (error) {
        console.error("Failed to proxy specialties create request", error)
        return new Response(JSON.stringify({ message: "Failed to create specialty" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}
