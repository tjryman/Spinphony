import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const keyPath = path.join(__dirname, 'localhost-key.pem');
const certPath = path.join(__dirname, 'localhost-cert.pem');

// Auto-generate a self-signed cert on first run using macOS built-in openssl
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  try {
    execSync(
      `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=localhost"`,
      { stdio: 'pipe' },
    );
  } catch {
    console.warn('Could not auto-generate SSL cert — openssl not found');
  }
}

const httpsOptions =
  fs.existsSync(keyPath) && fs.existsSync(certPath)
    ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
    : undefined;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: httpsOptions,
  },
});
