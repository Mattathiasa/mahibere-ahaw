import { useEffect, useState } from 'react';
import { integrationsService, type IntegrationsConfig, DEFAULT_INTEGRATIONS } from '@/services/integrations';
import { uploadToCloudinary, type CloudinaryUploadResult } from '@/services/cloudinary';

// Shared, cached integrations config so every uploader uses the same
// admin-entered Cloudinary cloud name + preset.
let cached: IntegrationsConfig | null = null;
let fetchPromise: Promise<IntegrationsConfig> | null = null;

function load(): Promise<IntegrationsConfig> {
  if (cached) return Promise.resolve(cached);
  if (!fetchPromise) {
    fetchPromise = integrationsService.get()
      .then((c) => { cached = c; return c; })
      .catch(() => { cached = DEFAULT_INTEGRATIONS; return DEFAULT_INTEGRATIONS; });
  }
  return fetchPromise;
}

export function invalidateIntegrationsCache() {
  cached = null;
  fetchPromise = null;
}

export function useCloudinary() {
  const [config, setConfig] = useState<IntegrationsConfig>(cached ?? DEFAULT_INTEGRATIONS);
  const [ready, setReady] = useState(!!cached);

  useEffect(() => {
    let cancelled = false;
    load().then((c) => { if (!cancelled) { setConfig(c); setReady(true); } });
    return () => { cancelled = true; };
  }, []);

  const isConfigured = !!config.cloudinaryCloudName && !!config.cloudinaryApiKey;

  async function upload(file: File, folder?: string): Promise<CloudinaryUploadResult> {
    const fresh = await load();
    return uploadToCloudinary(file, integrationsService.toCloudinary(fresh), folder);
  }

  return { config, ready, isConfigured, upload };
}
