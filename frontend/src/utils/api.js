// Central API base URL:
// - If VITE_API_URL is set (e.g. Render/Railway hosted backend), use it
// - In local development, fallback to 'http://localhost:5000'
// - In production on Vercel (monorepo serverless), fallback to '' (relative path)
const API_BASE = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? 'http://localhost:5000' : '');

export default API_BASE;
