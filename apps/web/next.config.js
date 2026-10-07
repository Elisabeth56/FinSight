const { apiOrigin } = require("./lib/api-origin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The browser only ever talks to this origin; /api/* is forwarded to the FastAPI deployment.
  // A fallback rewrite runs after every route, so /api/auth/* stays with the Neon Auth handler.
  async rewrites() {
    return { fallback: [{ source: "/api/:path*", destination: `${apiOrigin()}/:path*` }] };
  },
};

module.exports = nextConfig;
