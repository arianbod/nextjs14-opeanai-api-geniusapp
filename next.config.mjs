/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: "/api/:path*",
                headers: [
                    { key: "Access-Control-Allow-Credentials", value: "true" },
                    { key: "Access-Control-Allow-Origin", value: "*" }, // Allow all origins temporarily for testing
                    { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
                    { key: "Access-Control-Allow-Headers", value: "*" },
                    // Add Referrer Policy header
                    { key: "Referrer-Policy", value: "no-referrer-when-cross-origin" }
                ]
            }
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'oaidalleapiprodscus.blob.core.windows.net',
                port: '',
                pathname: '/private/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;