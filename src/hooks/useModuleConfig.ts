import { useEffect, useState } from 'react';
import {
  moduleConfigService, DEFAULT_MODULE_CONFIG,
  type ModuleConfig, type ModuleKey, type SingleModuleConfig,
} from '@/services/moduleConfig';

// Module-level cache + shared listener
let cached: ModuleConfig = DEFAULT_MODULE_CONFIG;
const listeners = new Set<(c: ModuleConfig) => void>();
let unsubscribe: (() => void) | null = null;

function ensureSubscribed() {
  if (unsubscribe) return;
  unsubscribe = moduleConfigService.subscribe((c) => {
    cached = c;
    listeners.forEach((l) => l(c));
  });
}

/** Live config for a single module (members | plans | reports). */
export function useModuleConfig(key: ModuleKey): SingleModuleConfig {
  const [config, setConfig] = useState<ModuleConfig>(cached);

  useEffect(() => {
    ensureSubscribed();
    listeners.add(setConfig);
    setConfig(cached);
    return () => { listeners.delete(setConfig); };
  }, []);

  return config[key];
}
