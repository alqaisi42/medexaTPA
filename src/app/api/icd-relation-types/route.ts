const apiBaseUrl = process.env.API_BASE_URL

if (!apiBaseUrl) {
    throw new Error("API_BASE_URL environment variable is not defined.")
}

function buildUpstreamUrl() {
    return new URL("/api/v1/icd-relation-types", apiBaseUrl).toString()
}

async function forwardRequest() {
    const response = await fetch(buildUpstreamUrl(), {
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

export async function GET() {
    try {
        return await forwardRequest()
    } catch (error) {
        console.error("Failed to proxy ICD relation types request", error)
        return new Response(JSON.stringify({ message: "Failed to load ICD relation types" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}
