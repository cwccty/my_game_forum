function normalizeSiteUrl(value?: string | null) {
  if (!value) return null;
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
}

export function getSiteUrl() {
  return (
    normalizeSiteUrl(process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    "http://localhost:3000"
  );
}
