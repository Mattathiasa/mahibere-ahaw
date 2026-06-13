import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { CloudinaryConfig } from '@/services/cloudinary';

// Third-party integration settings (admin-managed, public read via the
// existing siteConfig rule). Holds the Cloudinary cloud name + unsigned
// upload preset so the web admin can configure uploads without code changes.

export interface IntegrationsConfig {
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
  meta?: { updatedAt?: string; updatedBy?: string };
}

export const DEFAULT_INTEGRATIONS: IntegrationsConfig = {
  cloudinaryCloudName: 'dqxcewc2t',
  cloudinaryUploadPreset: 'mahibere-ahaw',
};

const REF = () => doc(db, 'siteConfig', 'integrations');

export const integrationsService = {
  async get(): Promise<IntegrationsConfig> {
    const snap = await getDoc(REF());
    if (!snap.exists()) return { ...DEFAULT_INTEGRATIONS };
    return { ...DEFAULT_INTEGRATIONS, ...(snap.data() as Partial<IntegrationsConfig>) };
  },

  async save(config: IntegrationsConfig, updatedBy: string): Promise<void> {
    await setDoc(REF(), {
      ...config,
      meta: { updatedAt: new Date().toISOString(), updatedBy },
    });
  },

  toCloudinary(config: IntegrationsConfig): CloudinaryConfig {
    return {
      cloudName: config.cloudinaryCloudName,
      uploadPreset: config.cloudinaryUploadPreset,
    };
  },
};
