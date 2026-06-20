/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  reactStrictMode: true,
  transpilePackages: ["@tezhelp/ui", "@tezhelp/i18n", "@tezhelp/config"],
};

export default nextConfig;
