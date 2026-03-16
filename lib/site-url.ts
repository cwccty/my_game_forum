function normalizeSiteUrl(value?: string | null) {
  if (!value) return null;
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
}

export function getSiteUrl() {
  const configuredUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL);
  const productionUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL);
  const customDomainFallback = "https://ytg-be.top";

  return (
    configuredUrl ??
    (productionUrl && !productionUrl.endsWith(".vercel.app") ? productionUrl : null) ??
    customDomainFallback ??
    productionUrl ??
    "http://localhost:3000"
  );
}
