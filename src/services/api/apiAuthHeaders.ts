import { useSettingsStore } from '@/stores/settingsStore';

export const getServerAccessPassword = (): string | null => {
  try {
    return useSettingsStore.getState().appSettings.serverAccessPassword?.trim() || null;
  } catch {
    return null;
  }
};

export const getServerAuthHeaders = (passwordOverride?: string | null): Record<string, string> => {
  const token = passwordOverride !== undefined ? passwordOverride?.trim() || null : getServerAccessPassword();
  if (!token) {
    return {};
  }
  return {
    'x-access-token': token,
    authorization: `Bearer ${token}`,
  };
};

const GEMINI_PROXY_PATH_SUFFIX = /\/api\/gemini\/?$/i;

/**
 * Strip a trailing `/api/gemini` proxy path from an absolute apiProxyUrl:
 * the auth-verify endpoint lives on the server ROOT (`/api/auth/verify`).
 * Sending it under the proxy prefix would forward `/api/auth/verify` to the
 * Gemini upstream and return 404. The relative `/api/gemini` (Docker) case is
 * already resolved to `undefined` by the caller, so same-origin is preserved.
 */
export const normalizeServerVerifyBaseUrl = (base?: string | null): string => {
  const trimmed = base?.trim().replace(/\/+$/, '') || '';
  return trimmed.replace(GEMINI_PROXY_PATH_SUFFIX, '');
};

export const verifyServerAccessPassword = async (
  password: string,
  customBaseUrl?: string,
): Promise<{ ok: boolean; message?: string }> => {
  const trimmed = password.trim();
  if (!trimmed) {
    return { ok: false, message: 'Password cannot be empty' };
  }
  const base = normalizeServerVerifyBaseUrl(customBaseUrl);
  const url = `${base}/api/auth/verify`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-access-token': trimmed,
        authorization: `Bearer ${trimmed}`,
      },
    });
    if (response.status === 200) {
      return { ok: true };
    }
    if (response.status === 401) {
      return { ok: false, message: 'Invalid access password' };
    }
    return { ok: false, message: `Server returned status ${response.status}` };
  } catch (verifyError) {
    const connectionErrorMessage = verifyError instanceof Error ? verifyError.message : String(verifyError);
    return { ok: false, message: `Connection failed: ${connectionErrorMessage}` };
  }
};

export const checkServerAuthRequired = async (
  customBaseUrl?: string,
): Promise<{ authRequired: boolean; ok: boolean }> => {
  const base = customBaseUrl?.replace(/\/+$/, '') || '';
  const url = `${base}/health`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { authRequired: false, ok: false };
    }
    const data = (await response.json()) as { authRequired?: boolean };
    return { authRequired: Boolean(data.authRequired), ok: true };
  } catch {
    return { authRequired: false, ok: false };
  }
};
