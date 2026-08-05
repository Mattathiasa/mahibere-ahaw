import React from 'react';
import type { AdminDraft } from '@/services/atbiyaAdmins';
import { syntheticEmail } from '@/services/signup';
import { Field } from '@/components/AtbiyaForm';
import { Input } from '@/components/ui/input';

/**
 * The administrator credential fields, shared by the registration wizard's
 * second step and the "add administrator" form on an existing parish.
 *
 * The draft shape and its validation live in services/atbiyaAdmins.ts, next to
 * the input type they describe.
 */

interface AtbiyaAdminFieldsProps {
  draft: AdminDraft;
  setDraft: React.Dispatch<React.SetStateAction<AdminDraft>>;
  disabled?: boolean;
}

export const AtbiyaAdminFields: React.FC<AtbiyaAdminFieldsProps> = ({
  draft, setDraft, disabled = false,
}) => {
  function set<K extends keyof AdminDraft>(key: K, value: AdminDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full name (English) *">
          <Input value={draft.fullNameEnglish} disabled={disabled}
            onChange={(e) => set('fullNameEnglish', e.target.value)}
            placeholder="Abebe Kebede Worku" />
        </Field>
        <Field label="Full name (አማርኛ)">
          <Input value={draft.fullNameAmharic ?? ''} disabled={disabled}
            onChange={(e) => set('fullNameAmharic', e.target.value)}
            placeholder="አበበ ከበደ ወርቁ" />
        </Field>
        <Field label="Username *" hint="What they type to sign in.">
          <Input value={draft.username} disabled={disabled}
            onChange={(e) => set('username', e.target.value)}
            autoComplete="off" placeholder="abebe.k" />
        </Field>
        <Field label="Phone">
          <Input value={draft.phone ?? ''} disabled={disabled}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="0938714929" />
        </Field>
      </div>

      <Field
        label="Email"
        hint={
          draft.username.trim()
            ? `Optional. Left blank, the account signs in as ${syntheticEmail(draft.username.trim())} — which has no inbox, so password reset links cannot be sent to it.`
            : 'Optional, but without one no password reset link can ever be sent to this account.'
        }
      >
        <Input type="email" value={draft.email ?? ''} disabled={disabled}
          onChange={(e) => set('email', e.target.value)}
          autoComplete="off" placeholder="abebe@example.com" />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Password *">
          <Input type="password" value={draft.password} disabled={disabled}
            onChange={(e) => set('password', e.target.value)}
            autoComplete="new-password" placeholder="At least 6 characters" />
        </Field>
        <Field label="Confirm password *">
          <Input type="password" value={draft.confirmPassword} disabled={disabled}
            onChange={(e) => set('confirmPassword', e.target.value)}
            autoComplete="new-password" />
        </Field>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Share these credentials with the administrator directly and ask them to
        change the password after their first sign-in.
      </p>
    </div>
  );
};
