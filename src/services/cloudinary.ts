import { AppError } from '@/lib/appError';
// Cloudinary unsigned uploads + transformation helpers.
// Cloud name & upload preset are admin-entered (siteConfig/integrations) so no
// secrets live in the codebase. Create an *unsigned* upload preset in your
// Cloudinary console (Settings → Upload → Upload presets, Signing Mode =
// Unsigned) and paste its name plus your cloud name in the Cloudinary settings.

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
}

export async function uploadToCloudinary(
  file: File,
  config: CloudinaryConfig,
  folder = 'mahibere-ahaw',
  /** 'image' for photos; 'auto' for any file (PDFs, docs, etc.). */
  resourceType: 'image' | 'auto' | 'raw' = 'image',
): Promise<CloudinaryUploadResult> {
  if (!config.cloudName || !config.uploadPreset) {
    throw new AppError('cloudinaryNotConfigured');
  }
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', config.uploadPreset);
  form.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`,
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
