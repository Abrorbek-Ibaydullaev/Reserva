import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Reserva Biz runs on port 3000 in dev (matches the Google "Authorized
// JavaScript origins" entry http://localhost:3000).
export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
});
