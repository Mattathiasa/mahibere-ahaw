import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLandingContent } from '@/hooks/useLandingContent';
import { Button } from '@/pages/home-components/Button';
import { AppError, errorMessage } from '@/lib/appError';
import { suggestionService, type SuggestionCategory } from '@/services/suggestions';

/** Matches the other homepage sections so `#suggestions` clears the fixed nav. */
const SECTION_CLASS = 'py-24 sm:py-32 relative scroll-mt-24 sm:scroll-mt-28';

/**
 * Mirrors the caps in the `suggestions` block of firestore.rules. Checked here
 * too so a person who writes three words is told so in their own language,
 * rather than watching the request come back denied with nothing to explain it.
 */
const MIN_MESSAGE = 10;
const MAX_MESSAGE = 2000;
const MAX_NAME = 80;
const MAX_CONTACT = 120;

/**
 * How long before the same browser may send again. Not a security control —
 * localStorage is trivially cleared — but it stops the accidental double-send
 * and the idle repeat-clicker, which is most of what a small site actually
 * sees. The real rate limit is App Check; see src/lib/firebase.ts.
 */
const COOLDOWN_MS = 60_000;
const COOLDOWN_KEY = 'suggestion-last-sent';

function withinCooldown(): boolean {
  try {
    const last = Number(localStorage.getItem(COOLDOWN_KEY) ?? 0);
    return Number.isFinite(last) && Date.now() - last < COOLDOWN_MS;
  } catch {
    // Private browsing can throw on access. A visitor who cannot be tracked
    // gets to send — refusing them would be worse than the missed throttle.
    return false;
  }
}

function markSent(): void {
  try {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  } catch {
    /* see withinCooldown */
  }
}

/**
 * The homepage suggestion box.
 *
 * The one place on this site where somebody with no account writes to the
 * church's database, so read `src/services/suggestions.ts` and the `suggestions`
 * block in firestore.rules together with this file.
 *
 * Nothing submitted is rendered back here. This is a private box, not a comment
 * wall: submissions are read in Software Control and nowhere else, which is why
 * there is no list, no count, and no "recent suggestions" below the form.
 */
export const SuggestionSection: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { content } = useLandingContent();
  const s = content.suggestions;

  const [category, setCategory] = useState<SuggestionCategory>('Appreciation');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  /**
   * Honeypot. A real person never sees this field, so anything in it came from
   * something filling every input on the page. Deliberately named `website` —
   * a plausible target — and never sent to Firestore, where an extra key would
   * fail the rules' `hasOnly` check anyway.
   */
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const dark = theme === 'dark';
  const headingColor = dark ? 'text-white' : 'text-[#0D2440]';
  const bodyColor = dark ? 'text-white/60' : 'text-[#0D2440]/70';
  const cardBg = dark ? 'bg-white/5 border-white/10' : 'bg-white border-[#2E5E99]/10';
  const fieldClass =
    'w-full rounded-2xl px-5 py-3.5 border transition-colors focus:outline-none focus:border-[#2E5E99] ' +
    (dark
      ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30'
      : 'bg-[#2E5E99]/5 border-[#2E5E99]/10 text-[#0D2440] placeholder:text-[#0D2440]/30');
  const labelClass = 'block text-xs font-black uppercase tracking-[0.2em] text-[#2E5E99] mb-2';

  /** Label and stored token, side by side. The token is what Firestore keeps. */
  const categories: ReadonlyArray<{ value: SuggestionCategory; label: string }> = [
    { value: 'Appreciation', label: s.categoryAppreciationLabel },
    { value: 'Change', label: s.categoryChangeLabel },
    { value: 'Feature', label: s.categoryFeatureLabel },
    { value: 'Problem', label: s.categoryProblemLabel },
  ];

  function resetForm() {
    setCategory('Appreciation');
    setName('');
    setContact('');
    setMessage('');
    setWebsite('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;

    // Show the thank-you and write nothing. Telling a bot it was caught only
    // teaches whoever wrote it to rename the field.
    if (website.trim()) {
      setSent(true);
      return;
    }

    const trimmed = message.trim();
    if (trimmed.length < MIN_MESSAGE) {
      toast.error(errorMessage(t, new AppError('suggestionTooShort')));
      return;
    }
    if (trimmed.length > MAX_MESSAGE) {
      toast.error(errorMessage(t, new AppError('suggestionTooLong')));
      return;
    }
    if (withinCooldown()) {
      toast.error(errorMessage(t, new AppError('suggestionCooldown')));
      return;
    }

    setSending(true);
    try {
      await suggestionService.submit({
        category,
        message: trimmed,
        name: name.trim().slice(0, MAX_NAME),
        contact: contact.trim().slice(0, MAX_CONTACT),
        language,
      });
      markSent();
      resetForm();
      setSent(true);
    } catch (err) {
      toast.error(errorMessage(t, err));
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="suggestions" className={SECTION_CLASS}>
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-12 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] text-[10px] font-black uppercase tracking-widest border border-[#2E5E99]/20"
          >
            <MessageSquarePlus className="h-3 w-3" />
            {s.badge}
          </motion.div>
          <h2 className={`text-4xl md:text-6xl font-black font-ethiopic ${headingColor}`}>
            {s.sectionTitle}
          </h2>
          <p className="text-xl text-[#2E5E99] font-ethiopic leading-relaxed">
            {s.sectionDescription}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`max-w-3xl p-8 sm:p-10 rounded-[2rem] border shadow-xl ${cardBg}`}
        >
          {sent ? (
            <div className="text-center space-y-4 py-6">
              <div className="inline-flex p-4 rounded-2xl bg-[#2E5E99]/10 text-[#2E5E99]">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className={`text-2xl font-black font-ethiopic ${headingColor}`}>
                {s.thankYouTitle}
              </h3>
              <p className={`font-ethiopic leading-relaxed ${bodyColor}`}>{s.thankYouMessage}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => setSent(false)}>
                {s.sendAnotherLabel}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <span className={labelClass}>{s.categoryFieldLabel}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.map((option) => {
                    const active = category === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setCategory(option.value)}
                        aria-pressed={active}
                        className={`text-left rounded-2xl px-5 py-3.5 border font-ethiopic transition-all ${
                          active
                            ? 'bg-[#2E5E99] border-[#2E5E99] text-white shadow-[0_10px_30px_-12px_rgba(46,94,153,0.6)]'
                            : dark
                              ? 'bg-white/5 border-white/10 text-white/70 hover:border-[#2E5E99]/40'
                              : 'bg-[#2E5E99]/5 border-[#2E5E99]/10 text-[#0D2440]/70 hover:border-[#2E5E99]/40'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="suggestion-message">
                  {s.messageFieldLabel}
                </label>
                <textarea
                  id="suggestion-message"
                  required
                  rows={5}
                  maxLength={MAX_MESSAGE}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={s.messagePlaceholder}
                  className={`${fieldClass} font-ethiopic resize-y`}
                />
                <p className="mt-1 text-right text-[10px] font-black tracking-widest text-[#2E5E99]/50">
                  {message.trim().length}/{MAX_MESSAGE}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="suggestion-name">
                    {s.nameFieldLabel}
                  </label>
                  <input
                    id="suggestion-name"
                    type="text"
                    maxLength={MAX_NAME}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={s.namePlaceholder}
                    className={`${fieldClass} font-ethiopic`}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="suggestion-contact">
                    {s.contactFieldLabel}
                  </label>
                  <input
                    id="suggestion-contact"
                    type="text"
                    maxLength={MAX_CONTACT}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={s.contactPlaceholder}
                    className={`${fieldClass} font-ethiopic`}
                  />
                </div>
              </div>

              {/* Honeypot — hidden from people, offered to anything filling every
                  field. `hidden` rather than an off-screen position so assistive
                  technology skips it too. */}
              <input
                type="text"
                name="website"
                hidden
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between pt-2">
                <p className={`text-xs font-ethiopic leading-relaxed max-w-sm ${bodyColor}`}>
                  {s.privacyNote}
                </p>
                <Button type="submit" disabled={sending} className="shrink-0">
                  {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {sending ? s.submittingLabel : s.submitLabel}
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};
