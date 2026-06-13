// Cloudinary SIGNED uploads + transformation helpers.
// The API secret lives only in the `signCloudinaryUpload` Cloud Function.
// The browser asks the function to sign the upload params, then POSTs the file
// to Cloudinary with the signature + api_key. Cloud name, api key and upload
// preset are admin-entered (siteConfig/integrations) — none are secret.

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey: string;
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
}

const signUpload = httpsCallable<
  { paramsToSign: Record<string, string> },
  { signature: string; timestamp: number }
>(functions, 'signCloudinaryUpload');

export async function uploadToCloudinary(
  file: File,
  config: CloudinaryConfig,
  folder = 'mahibere-ahaw',
): Promise<CloudinaryUploadResult> {
  if (!config.cloudName || !config.apiKey) {
    throw new Error('Cloudinary is not configured. Set the cloud name and API key first.');
  }

  // Params that will be signed by the Cloud Function (must match what we send).
  const paramsToSign: Record<string, string> = { folder };
  if (config.uploadPreset) paramsToSign.upload_preset = config.uploadPreset;

  const { data } = await signUpload({ paramsToSign });
  const { signature, timestamp } = data;

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', config.apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', folder);
  if (config.uploadPreset) form.append('upload_preset', config.uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    { method: 'POST', body: form },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cloudinary upload failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  return {
    secureUrl: json.secure_url as string,
    publicId: json.public_id as string,
    width: json.width,
    height: json.height,
  };
}

/**
 * Insert a Cloudinary transformation into a delivery URL.
 * e.g. transform(url, 'w_1200,f_auto,q_auto') for an optimised hero image.
 */
export function transform(url: string, transformation: string): string {
  if (!url.includes('/upload/')) return url;
  // Avoid double-stacking if a transformation is already present.
  return url.replace('/upload/', `/upload/${transformation}/`);
}

/** Optimised, responsive delivery (auto format + quality). */
export function optimized(url: string, width = 1200): string {
  return transform(url, `w_${width},f_auto,q_auto,c_limit`);
}
