import { NextRequest } from "next/server"

const allowedResources = new Set([
    "uoms",
    "service-types",
    "service-categories",
    "provider-types",
    "genders",
    "facility-levels",
    "currencies",
    "countries",
    "age-groups",
])

const apiBaseUrl = process.env.API_BASE_URL

if (!apiBaseUrl) {
    throw new Error("API_BASE_URL environment variable is not defined.")
}

function buildUpstreamUrl(resource: string) {
    return `${apiBaseUrl}/api/v1/master/${resource}`
}

async function forwardRequest(resource: string, init?: RequestInit) {
    const response = await fetch(buildUpstreamUrl(resource), {
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

export async function GET(_: NextRequest, { params }: { params: { resource: string } }) {
    const { resource } = params

    if (!allowedResources.has(resource)) {
        return new Response(JSON.stringify({ message: "Resource not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        })
    }

    try {
        return await forwardRequest(resource)
    } catch (error) {
        console.error("Failed to proxy master lookup GET request", error)
        return new Response(JSON.stringify({ message: "Failed to load lookup data" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}

export async function POST(request: NextRequest, { params }: { params: { resource: string } }) {
    const { resource } = params

    if (!allowedResources.has(resource)) {
        return new Response(JSON.stringify({ message: "Resource not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        })
    }

    const payload = await request.json()

    try {
        return await forwardRequest(resource, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json",
            },
        })
    } catch (error) {
        console.error("Failed to proxy master lookup POST request", error)
        return new Response(JSON.stringify({ message: "Failed to save lookup data" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}
