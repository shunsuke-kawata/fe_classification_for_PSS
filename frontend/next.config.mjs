/** @type {import('next').NextConfig} */
import dotenv from "dotenv";
dotenv.config();

const nextConfig = {
  reactStrictMode: false,
  env: {
    PORT: process.env.PORT,
  },
};

export default nextConfig;
