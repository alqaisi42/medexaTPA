import { NextRequest } from "next/server"

const apiBaseUrl = process.env.API_BASE_URL

if (!apiBaseUrl) {
    throw new Error("API_BASE_URL environment variable is not defined.")
}

function buildUpstreamUrl(name: string) {
    return new URL(`/api/v1/diagnosis-categories/name/${encodeURIComponent(name)}`, apiBaseUrl).toString()
}

async function forwardRequest(name: string) {
    const response = await fetch(buildUpstreamUrl(name), {
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
    _: NextRequest,
    context: { params: Promise<{ name: string }> }
) {
    const { name } = await context.params

    try {
        return await forwardRequest(name)
    } catch (error) {
        console.error("Failed to proxy diagnosis category lookup by name", error)
        return new Response(JSON.stringify({ message: "Failed to load diagnosis category" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}
