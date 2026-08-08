import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Reusable meeting audiences, editable in Software Control.
 *
 * `scope` here is RELATIVE to whoever is scheduling — 'diocese' means "the
 * scheduler's own diocese", not a particular one. That is what makes a preset
 * reusable: one "My Diocese — congregation administrators only" entry works for
 * every diocese without an entry per diocese.
 *
 * Lives in `siteConfig`, which already has `allow read: if true; allow write:
 * if isAdmin()` — so this needs no firestore.rules change.
 */
export interface AudiencePreset {
  id: string;
  label: string;
  labelAm?: string;
  scope: 'all' | 'diocese' | 'congregation';
  /** Role keys. Empty means everyone within the scope. */
  roles: string[];
}

export interface MeetingPresets {
  presets: AudiencePreset[];
  meta?: { updatedAt?: string; updatedBy?: string };
}

/**
 * The shipped presets. The third is the case this feature exists for: a
 * diocese-level meeting that should reach congregation administrators and
 * nobody else.
 */
export const DEFAULT_PRESETS: AudiencePreset[] = [
  { id: 'everyone', label: 'Whole church', labelAm: 'መላው ቤተ ክርስቲያን', scope: 'all', roles: [] },
  { id: 'diocese-all', label: 'My Diocese — all members', labelAm: 'ሀገረ ስብከቴ — ሁሉም አባላት', scope: 'diocese', roles: [] },
  {
    id: 'diocese-admins',
    label: 'My Diocese — congregation administrators only',
    labelAm: 'ሀገረ ስብከቴ — የአጥቢያ አስተዳዳሪዎች ብቻ',
    scope: 'diocese',
    roles: ['Atbiya'],
  },
  { id: 'congregation-all', label: 'My Congregation', labelAm: 'አጥቢያዬ', scope: 'congregation', roles: [] },
];

const ref = doc(db, 'siteConfig', 'meetingAudiencePresets');

function normalize(raw: unknown): MeetingPresets | null {
  const data = raw as Partial<MeetingPresets> | undefined;
  if (!data || !Array.isArray(data.presets) || data.presets.length === 0) return null;
  return {
    presets: data.presets.map((p) => ({
      id: p.id,
      label: p.label ?? p.id,
      labelAm: p.labelAm,
      scope: (['all', 'diocese', 'congregation'].includes(p.scope) ? p.scope : 'all') as AudiencePreset['scope'],
      roles: Array.isArray(p.roles) ? p.roles : [],
    })),
    meta: data.meta,
  };
}

export const meetingPresetService = {
  /**
   * Never writes. The scheduling dialog reads this on open, and an ordinary
   * member has no permission to create siteConfig documents — a seed-on-read
   * would fail for exactly the people who need the presets.
   */
  async get(): Promise<AudiencePreset[]> {
    try {
      const snap = await getDoc(ref);
      return (snap.exists() && normalize(snap.data())?.presets) || DEFAULT_PRESETS;
    } catch {
      return DEFAULT_PRESETS;
    }
  },

  async save(presets: AudiencePreset[], updatedBy: string): Promise<void> {
    await setDoc(ref, {
      presets,
      meta: { updatedAt: new Date().toISOString(), updatedBy },
    });
  },
};
