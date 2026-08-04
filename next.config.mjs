/** @type {import('next').NextConfig} */
const nextConfig = {
  // libsql's native/local-file client isn't webpack-bundleable (dynamic
  // requires pull in its README/LICENSE files) - run it as a real Node
  // require at runtime instead of bundling it.
  serverExternalPackages: ["@libsql/client", "libsql", "@prisma/adapter-libsql"],
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
