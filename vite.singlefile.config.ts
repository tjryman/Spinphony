import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Builds the whole app into one self-contained HTML file (dist-single/),
// used for hosted test previews where no dev server is available.
// Run with: npx vite build --config vite.singlefile.config.ts
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-single',
  },
});
