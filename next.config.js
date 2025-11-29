/** @type {import('next').NextConfig} */

// Security headers for protection against common vulnerabilities
const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff", // Prevent MIME type sniffing
  },
  {
    key: "X-Frame-Options",
    value: "DENY", // Prevent clickjacking
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block", // Browser XSS protection
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin", // Control referrer info
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)", // Restrict APIs
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains", // HTTPS enforcement
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://stripe.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' https: data:; " +
      "font-src 'self' https://fonts.gstatic.com https:; " +
      "connect-src 'self' https: ws: wss:; " +
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';",
  },
];

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "plphgrlkszglrawjgtvn.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "ovnmvbyjvpbsfacywgig.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Add security headers to all responses
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
