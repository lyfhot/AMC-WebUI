window.__AMC_RUNTIME_CONFIG__ = {
  // Deployment-level defaults for the static (Cloudflare Pages) build.
  // Routes Gemini-native requests to the self-hosted API service:
  //   https://api.ruin.pics/api/gemini  (Gemini proxy on the VPS)
  // serverManagedApi: true lets visitors use the server-side GEMINI_API_KEY
  // without entering their own key (BYOK still overrides it per browser).
  serverManagedApi: true,
  useCustomApiConfig: true,
  useApiProxy: true,
  apiProxyUrl: 'https://api.ruin.pics/api/gemini',
  pyodideBaseUrl: null,
  ...(window.__AMC_RUNTIME_CONFIG__ || {}),
};
