/** @type {import('next').NextConfig} */
import dotenv from "dotenv";
dotenv.config();

const nextConfig = {
  reactStrictMode: false,
  env: {
    PORT: process.env.PORT,
    DEFAULT_IMAGE_PATH: process.env.DEFAULT_IMAGE_PATH,
  },
};

export default nextConfig;
