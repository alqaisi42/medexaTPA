import { NextRequest } from "next/server"

const apiBaseUrl = process.env.API_BASE_URL

if (!apiBaseUrl) {
    throw new Error("API_BASE_URL environment variable is not defined.")
}

function buildUpstreamUrl(id: string) {
    return new URL(`/api/v1/diagnosis-categories/${id}`, apiBaseUrl).toString()
}

async function forwardRequest(id: string, init?: RequestInit) {
    const response = await fetch(buildUpstreamUrl(id), {
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

export async function DELETE(
    _: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params

    try {
        return await forwardRequest(id, { method: "DELETE" })
    } catch (error) {
        console.error("Failed to proxy diagnosis category delete request", error)
        return new Response(JSON.stringify({ message: "Failed to delete diagnosis category" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}
