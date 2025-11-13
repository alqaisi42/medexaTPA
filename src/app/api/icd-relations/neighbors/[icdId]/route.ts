import { NextRequest } from "next/server"

const apiBaseUrl = process.env.API_BASE_URL

if (!apiBaseUrl) {
    throw new Error("API_BASE_URL environment variable is not defined.")
}

function buildUpstreamUrl(icdId: string) {
    return new URL(`/api/v1/icd-relations/neighbors/${icdId}`, apiBaseUrl).toString()
}

async function forwardRequest(icdId: string) {
    const response = await fetch(buildUpstreamUrl(icdId), {
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
    context: { params: Promise<{ icdId: string }> }
) {
    const { icdId } = await context.params

    try {
        return await forwardRequest(icdId)
    } catch (error) {
        console.error("Failed to proxy ICD neighbors request", error)
        return new Response(JSON.stringify({ message: "Failed to load ICD neighbors" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}
