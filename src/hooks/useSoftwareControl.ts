import { useEffect, useState } from 'react';
import {
  softwareControlService,
  DEFAULT_SOFTWARE_CONTROL,
  navAllowed,
  elementAllowed,
  type SoftwareControlConfig,
} from '@/services/softwareControl';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/contexts/PermissionContext';

// Module-level cache + listener shared by all consumers
let cached: SoftwareControlConfig = DEFAULT_SOFTWARE_CONTROL;
const listeners = new Set<(c: SoftwareControlConfig) => void>();
let unsubscribe: (() => void) | null = null;

function ensureSubscribed() {
  if (unsubscribe) return;
  unsubscribe = softwareControlService.subscribe((config) => {
    cached = config;
    listeners.forEach((l) => l(config));
  });
}

/** Live software-control config plus per-user gating helpers.
 *  `showNav(key)` — sidebar tab visibility; `showElement(key)` — button visibility. */
export function useSoftwareControl() {
  const [config, setConfig] = useState<SoftwareControlConfig>(cached);
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();

  useEffect(() => {
    ensureSubscribed();
    listeners.add(setConfig);
    setConfig(cached);
    return () => {
      listeners.delete(setConfig);
    };
  }, []);

  const level = user?.hierarchyLevel ?? user?.role ?? '';

  return {
    config,
    showNav: (navKey: string) => navAllowed(config, navKey, level, isSuperAdmin),
    showElement: (elementKey: string) => elementAllowed(config, elementKey, level, isSuperAdmin),
  };
}
