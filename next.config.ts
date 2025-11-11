import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactCompiler: true,

    swcMinify: true, // ✅ ما يزال صحيح ومدعوم

    experimental: {
        serverActions: {
            bodySizeLimit: "2mb"
        },
        turbo: {
            resolveExtensions: [".ts", ".tsx", ".js", ".jsx"]
        }
    },

    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "localhost",
                port: "3000"
            }
        ]
    }
};

export default nextConfig;
