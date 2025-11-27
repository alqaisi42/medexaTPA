import { NextRequest } from "next/server"

const apiBaseUrl = process.env.API_BASE_URL

if (!apiBaseUrl) {
    throw new Error("API_BASE_URL environment variable is not defined.")
}

function buildUpstreamUrl() {
    return new URL("/api/v1/icd/complications", apiBaseUrl).toString()
}

async function forwardRequest(init: RequestInit) {
    const response = await fetch(buildUpstreamUrl(), {
        ...init,
        headers: {
            Accept: "application/json",
            ...(init.headers ?? {}),
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
    const payload = await request.json()

    try {
        return await forwardRequest({
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json",
            },
        })
    } catch (error) {
        console.error("Failed to proxy ICD complication create request", error)
        return new Response(JSON.stringify({ message: "Failed to create ICD complication" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}

export async function DELETE(request: NextRequest) {
    const payload = await request.json()

    try {
        return await forwardRequest({
            method: "DELETE",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json",
            },
        })
    } catch (error) {
        console.error("Failed to proxy ICD complication delete request", error)
        return new Response(JSON.stringify({ message: "Failed to delete ICD complication" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}

