/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/seminar/0915",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
