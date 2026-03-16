function normalizeSiteUrl(value?: string | null) {
  if (!value) return null;
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
}

function isVercelSubdomain(value: string | null) {
  return !!value && value.endsWith(".vercel.app");
}

export function getSiteUrl() {
  const configuredUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL);
  const productionUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL);
  const customDomainFallback = "https://ytg-be.top";

  return (
    (configuredUrl && !isVercelSubdomain(configuredUrl) ? configuredUrl : null) ??
    (productionUrl && !isVercelSubdomain(productionUrl) ? productionUrl : null) ??
    customDomainFallback ??
    configuredUrl ??
    productionUrl ??
    "http://localhost:3000"
  );
}
