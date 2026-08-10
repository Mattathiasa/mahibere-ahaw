import type { Translations } from '@/i18n/translations';

/**
 * An error that carries a translation key instead of prose.
 *
 * Service modules run outside React, so they cannot call `useLanguage()` and
 * cannot know the reader's language. They used to throw English sentences —
 * `throw new Error('Incorrect password. Please try again.')` — which meant an
 * Amharic-speaking member got an English toast on every failed sign-in, and the
 * text was invisible to the admin translation editor.
 *
 * Throw `new AppError('errWrongPassword')` instead and resolve it at the catch
 * site, where `t` is in scope, with `errorMessage(t, e)`.
 *
 * `super(key)` is deliberate: `message` is the key, so a catch site that has
 * not been migrated yet displays `errWrongPassword` rather than crashing or
 * showing `[object Object]`. That is ugly but safe, and greppable.
 */
export class AppError extends Error {
  constructor(
    readonly key: keyof Translations['errors'],
    readonly params?: Record<string, string | number>
  ) {
    super(String(key));
    this.name = 'AppError';
  }
}

/**
 * Resolve any thrown value to a sentence in the reader's language.
 *
 * Handles the three things a `catch` can receive: an `AppError` (translate its
 * key), a plain `Error` (show its message — Firebase SDK errors land here), and
 * anything else (fall back to the generic message).
 */
export function errorMessage(t: Translations, e: unknown): string {
  if (e instanceof AppError) {
    const template = t.errors[e.key] ?? String(e.key);
    if (!e.params) return template;
    return Object.entries(e.params).reduce(
      (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
      template
    );
  }
  if (e instanceof Error && e.message) return e.message;
  return t.errors.generic;
}
