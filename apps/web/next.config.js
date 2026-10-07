/** @type {import('next').NextConfig} */
const nextConfig = {
  // The browser only ever talks to this origin; /api/* is forwarded to the FastAPI deployment.
  async rewrites() {
    const api = process.env.API_ORIGIN ?? "http://localhost:8000";
    return [{ source: "/api/:path*", destination: `${api}/:path*` }];
  },
};

module.exports = nextConfig;
