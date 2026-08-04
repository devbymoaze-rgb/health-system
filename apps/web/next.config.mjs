import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(path.resolve(__dirname, '../..'));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@crm-eye/database', '@crm-eye/shared', '@crm-eye/ai'],
};

export default nextConfig;
