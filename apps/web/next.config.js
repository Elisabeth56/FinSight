/** @type {import('next').NextConfig} */
const nextConfig = {
  // The browser only ever talks to this origin; /api/* is forwarded to the FastAPI deployment.
  // A fallback rewrite runs after every route, so /api/auth/* stays with the Neon Auth handler.
  async rewrites() {
    const api = process.env.API_ORIGIN ?? "http://localhost:8000";
    return { fallback: [{ source: "/api/:path*", destination: `${api}/:path*` }] };
  },
};

module.exports = nextConfig;
