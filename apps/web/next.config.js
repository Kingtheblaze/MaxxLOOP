/** @type {import('next').NextConfig} */
function getApiOrigin() {
  const configuredOrigin = process.env.API_INTERNAL_URL;
  if (process.env.VERCEL && !configuredOrigin) {
    throw new Error("API_INTERNAL_URL must be configured for Vercel deployments.");
  }

  const value = configuredOrigin || "http://localhost:8000";
  let parsedOrigin;
  try {
    parsedOrigin = new URL(value);
  } catch {
    throw new Error("API_INTERNAL_URL must be a valid HTTP(S) origin.");
  }

  if (
    !["http:", "https:"].includes(parsedOrigin.protocol) ||
    parsedOrigin.username ||
    parsedOrigin.password ||
    parsedOrigin.pathname !== "/" ||
    parsedOrigin.search ||
    parsedOrigin.hash ||
    (process.env.VERCEL && parsedOrigin.protocol !== "https:")
  ) {
    throw new Error("API_INTERNAL_URL must be an HTTPS origin on Vercel and must not include a path.");
  }

  return parsedOrigin.origin;
}

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiOrigin = getApiOrigin();
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
