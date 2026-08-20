import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, Sun, Moon, Languages, Loader2, AlertCircle, Church,
  User as UserIcon, MapPin, Briefcase, ArrowLeft, ArrowRight, Check,
} from 'lucide-react';
import logo from '@/assets/logo.png';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGE_ENDONYM, nextLanguage } from '@/i18n/languages';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { hierarchyService, type Atbiya } from '@/services/hierarchy';
import { signupService, type SignupInput } from '@/services/signup';
import { isValidPhone, normalizeEthiopianPhone } from '@/lib/phone';
import { LocationPicker } from '@/components/LocationPicker';
import type { LatLng } from '@/lib/geo';
import { ETHIOPIAN_REGIONS } from '@/types';
import { EthiopianDatePicker } from '@/components/ui/EthiopianDatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const MINISTRY_OPTIONS = [
  'Sunday School', 'Youth Ministry', 'Women Ministry', 'Choir',
  'Deacon Service', 'Prayer Team', 'Media Ministry',
];

const STEP_ICONS = [UserIcon, Church, Briefcase, MapPin];

type Form = Omit<SignupInput, 'atbiyaName'> & { confirmPassword: string };

const blank: Form = {
  fullNameEnglish: '', fullNameAmharic: '', username: '', email: '',
  password: '', confirmPassword: '', phone: '', dateOfBirth: '', gender: '',
  maritalStatus: '', hasChildren: false, childrenCount: 0, workSchool: '',
  region: '', zone: '', woreda: '', ministryType: [], churchRoles: [],
  atbiyaId: '',
};

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wider text-[#2E5E99]">
        {label}{required && ' *'}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  );
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  // `t` is the merged tree: English is always the base, so a language that has
  // not been translated yet renders English rather than `undefined`, and an
  // admin can fill it in from Landing Editor → UI Translations → Sign-up Form.
  const { language, setLanguage, t } = useLanguage();
  const tx = t.signup;
  const moduleCfg = useModuleConfig('members');

  const STEPS = [
    { n: 1, label: tx.stepDetails, icon: STEP_ICONS[0] },
    { n: 2, label: tx.stepCongregation, icon: STEP_ICONS[1] },
    { n: 3, label: tx.stepAbout, icon: STEP_ICONS[2] },
    { n: 4, label: tx.stepCredentials, icon: STEP_ICONS[3] },
  ];
  const fieldVisible = (key: string) => moduleCfg.fields.find((f) => f.key === key)?.visible ?? true;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(blank);
  const [atbiyas, setAtbiyas] = useState<Atbiya[]>([]);
  const [loadingAtbiyas, setLoadingAtbiyas] = useState(true);
  const [atbiyaSearch, setAtbiyaSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Runs unauthenticated — see getPublicAtbiyas() and the hierarchy list rule.
  useEffect(() => {
    hierarchyService.getPublicAtbiyas()
      .then(setAtbiyas)
      .catch(() => setAtbiyas([]))
      .finally(() => setLoadingAtbiyas(false));
  }, []);

  const filteredAtbiyas = useMemo(() => {
    const q = atbiyaSearch.trim().toLowerCase();
    if (!q) return atbiyas;
    return atbiyas.filter((a) =>
      [a.name, a.nameAmharic, a.cityEn, a.cityAm, a.address?.en, a.address?.am]
        .join(' ').toLowerCase().includes(q));
  }, [atbiyas, atbiyaSearch]);

  const selectedAtbiya = atbiyas.find((a) => a.id === form.atbiyaId) ?? null;

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
  }
  function toggleMinistry(value: string) {
    setForm((f) => ({
      ...f,
      ministryType: (f.ministryType ?? []).includes(value)
        ? (f.ministryType ?? []).filter((m) => m !== value)
        : [...(f.ministryType ?? []), value],
    }));
  }

  /** Returns an error message for the current step, or null when it's valid. */
  function validateStep(n: number): string | null {
    if (n === 1) {
      if (!form.fullNameEnglish.trim()) return tx.errNameEnglish;
      if (!form.fullNameAmharic.trim()) return tx.errNameAmharic;
      // Phone is the only contact detail we insist on: it is how the parish
      // reaches a member, and many members have no email address at all.
      if (!form.phone.trim()) return tx.errPhoneMissing;
      if (!isValidPhone(form.phone)) {
        return tx.errPhoneInvalid;
      }
    }
    if (n === 2 && !form.atbiyaId) {
      return tx.errCongregation;
    }
    if (n === 4) {
      if (!form.username.trim()) return tx.errUsernameMissing;
      if (!/^[a-zA-Z0-9._-]{3,}$/.test(form.username.trim())) {
        return tx.errUsernameFormat;
      }
      // Email is optional — you sign in with your username either way. Same
      // check the parish-administrator form uses, so both paths agree.
      if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
        return tx.errEmail;
      }
      if (form.password.length < 6) return tx.errPassword;
      if (form.password !== form.confirmPassword) return tx.errPasswordMatch;
    }
    return null;
  }

  function next() {
    const problem = validateStep(step);
    if (problem) return setError(problem);
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length));
  }

  async function handleSubmit() {
    for (const n of [1, 2, 3, 4]) {
      const problem = validateStep(n);
      if (problem) { setStep(n); return setError(problem); }
    }
    setSubmitting(true);
    setError(null);
    try {
      if (await signupService.isUsernameTaken(form.username)) {
        setStep(4);
        setError(tx.errUsernameTaken);
        return;
      }
      const { confirmPassword, ...input } = form;
      await signupService.register({
        ...input,
        // Store one canonical shape, so a number typed as 0911… and the same
        // number typed as +251911… are not two different members.
        phone: normalizeEthiopianPhone(input.phone) ?? input.phone.trim(),
        atbiyaName: selectedAtbiya?.name ?? '',
      });
      navigate('/pending', {
        replace: true,
        state: { atbiyaName: selectedAtbiya?.name, atbiyaId: selectedAtbiya?.id },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : tx.errGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  const cycleLanguage = () =>
    setLanguage(nextLanguage(language));

  return (
    <div className={`min-h-screen transition-colors duration-700 ${theme === 'dark' ? 'bg-[#0D2440] text-white' : 'bg-[#E7F0FA] text-[#0D2440]'}`}>
      <div className="flex items-center justify-between p-4 sm:p-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="gap-2 font-bold">
          <Home className="h-4 w-4" /> HOME
        </Button>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-3 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#2E5E99]/10 transition-colors">
            {theme === 'light' ? <Moon className="h-5 w-5 text-[#2E5E99]" /> : <Sun className="h-5 w-5 text-[#7BA4D0]" />}
          </button>
          <button onClick={cycleLanguage}
            className="px-3 py-2 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#2E5E99]/10 transition-colors font-bold text-xs text-[#2E5E99]">
            {LANGUAGE_ENDONYM[nextLanguage(language)]}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-[2rem] shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white'}`}>
          <div className="h-2 bg-gradient-to-r from-[#2E5E99] to-[#7BA4D0]" />

          <div className="p-6 sm:p-10 space-y-8">
            <div className="text-center space-y-2">
              <img src={logo} alt={t.common.logoAlt} className="h-16 w-16 mx-auto" />
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{tx.title}</h1>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                {tx.intro}
              </p>
            </div>

            {/* Step rail */}
            <div className="flex items-center justify-between gap-2">
              {STEPS.map(({ n, label, icon: Icon }) => (
                <div key={n} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
                    step > n ? 'bg-emerald-500 text-white'
                    : step === n ? 'bg-[#2E5E99] text-white'
                    : 'bg-[#2E5E99]/10 text-[#2E5E99]/50'}`}>
                    {step > n ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider text-center ${
                    step === n ? 'text-[#2E5E99]' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* ── Step 1: identity ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={tx.fullNameEnglish} required>
                    <Input value={form.fullNameEnglish} onChange={(e) => set('fullNameEnglish', e.target.value)}
                      placeholder={t.people.personNameExample} />
                  </Field>
                  <Field label={tx.fullNameAmharic} required>
                    <Input value={form.fullNameAmharic} onChange={(e) => set('fullNameAmharic', e.target.value)}
                      placeholder="አበበ ከበደ" />
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={tx.phone} required hint={tx.phoneHint}>
                    <Input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                      autoComplete="tel" placeholder="0911 22 33 44" />
                  </Field>
                  <Field label={tx.gender}>
                    <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
                      <SelectTrigger><SelectValue placeholder={t.common.selectPlaceholder} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">{tx.male}</SelectItem>
                        <SelectItem value="Female">{tx.female}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label={tx.dateOfBirth}>
                  <EthiopianDatePicker
                    value={form.dateOfBirth}
                    onChange={(iso) => set('dateOfBirth', iso)}
                    allowGregorian
                  />
                </Field>
              </div>
            )}

            {/* ── Step 2: parish ── */}
            {step === 2 && (
              <div className="space-y-4">
                <Field label={tx.searchCongregations}>
                  <Input value={atbiyaSearch} onChange={(e) => setAtbiyaSearch(e.target.value)}
                    placeholder={tx.searchPlaceholder} />
                </Field>

                {loadingAtbiyas ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-[#2E5E99]" />
                  </div>
                ) : atbiyas.length === 0 ? (
                  <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-[#2E5E99]/30">
                    <Church className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-bold">{tx.noCongregations}</p>
                    <p className="text-sm text-muted-foreground">
                      {tx.noCongregationsHint}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {filteredAtbiyas.map((a) => {
                      const active = form.atbiyaId === a.id;
                      return (
                        <button key={a.id} type="button" onClick={() => set('atbiyaId', a.id)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all ${
                            active
                              ? 'border-[#2E5E99] bg-[#2E5E99]/5 ring-2 ring-[#2E5E99]/30'
                              : 'border-[#2E5E99]/15 hover:border-[#2E5E99]/40'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-bold">{a.name}</p>
                              {a.nameAmharic && (
                                <p className="text-sm font-ethiopic text-muted-foreground">{a.nameAmharic}</p>
                              )}
                              {(a.address?.am || a.address?.en) && (
                                <p className="text-xs text-muted-foreground mt-1 font-ethiopic leading-relaxed">
                                  {a.address?.am || a.address?.en}
                                </p>
                              )}
                            </div>
                            {active && <Check className="h-5 w-5 text-[#2E5E99] shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                    {filteredAtbiyas.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        {tx.noMatch} "{atbiyaSearch}".
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: background ── */}
            {step === 3 && (
              <div className="space-y-4">
                {fieldVisible('workSchool') && (
                  <Field label={tx.workSchool}>
                    <Input value={form.workSchool} onChange={(e) => set('workSchool', e.target.value)} />
                  </Field>
                )}
                {fieldVisible('maritalStatus') && (
                  <Field label={tx.maritalStatus}>
                    <Select value={form.maritalStatus} onValueChange={(v) => set('maritalStatus', v)}>
                      <SelectTrigger><SelectValue placeholder={t.common.selectPlaceholder} /></SelectTrigger>
                      <SelectContent>
                        {['Single', 'Married', 'Divorced', 'Widowed'].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.hasChildren}
                    onCheckedChange={(v) => set('hasChildren', v === true)} />
                  <span className="text-sm font-medium">{tx.hasChildren}</span>
                </label>
                {form.hasChildren && (
                  <Field label={tx.childrenCount}>
                    <Input type="number" min={0} value={form.childrenCount}
                      onChange={(e) => set('childrenCount', Number(e.target.value))} />
                  </Field>
                )}
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label={tx.region}>
                    <Select value={form.region} onValueChange={(v) => set('region', v)}>
                      <SelectTrigger><SelectValue placeholder={t.common.selectPlaceholder} /></SelectTrigger>
                      <SelectContent>
                        {ETHIOPIAN_REGIONS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label={tx.addressZone}>
                    <Input value={form.zone} onChange={(e) => set('zone', e.target.value)} />
                  </Field>
                  <Field label={tx.addressWoreda}>
                    <Input value={form.woreda} onChange={(e) => set('woreda', e.target.value)} />
                  </Field>
                </div>
                <p className="text-[11px] text-muted-foreground -mt-2">
                  {tx.addressHint}
                </p>
                <LocationPicker
                  value={{ lat: form.lat, lng: form.lng }}
                  onChange={(p: LatLng | null) =>
                    setForm((f) => ({ ...f, lat: p?.lat, lng: p?.lng }))}
                  label={tx.homeLocation}
                  hint={tx.homeLocationHint}
                  height={220}
                />
                <Field label={tx.ministries}>
                  <div className="flex flex-wrap gap-2">
                    {MINISTRY_OPTIONS.map((m) => {
                      const on = (form.ministryType ?? []).includes(m);
                      return (
                        <button key={m} type="button" onClick={() => toggleMinistry(m)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                            on ? 'bg-[#2E5E99] text-white border-[#2E5E99]'
                               : 'border-[#2E5E99]/20 hover:border-[#2E5E99]/50'}`}>
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            )}

            {/* ── Step 4: credentials ── */}
            {step === 4 && (
              <div className="space-y-4">
                {selectedAtbiya && (
                  <div className="p-4 rounded-2xl bg-[#2E5E99]/5 border border-[#2E5E99]/15 flex items-start gap-3">
                    <Church className="h-5 w-5 text-[#2E5E99] mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-bold">{tx.requestGoesTo} {selectedAtbiya.name}</p>
                      {selectedAtbiya.contact?.phone && (
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {tx.contact}: {selectedAtbiya.contact.nameEn ?? ''} {selectedAtbiya.contact.phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={tx.username} required>
                    <Input value={form.username} onChange={(e) => set('username', e.target.value)}
                      autoComplete="username" placeholder={t.people.usernameExample} />
                  </Field>
                  <Field label={tx.email} hint={tx.emailHint}>
                    <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                      autoComplete="email" placeholder={t.forms.emailPlaceholder} />
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={tx.password} required>
                    <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)}
                      autoComplete="new-password" placeholder={tx.passwordPlaceholder} />
                  </Field>
                  <Field label={tx.confirmPassword} required>
                    <Input type="password" value={form.confirmPassword}
                      onChange={(e) => set('confirmPassword', e.target.value)} autoComplete="new-password" />
                  </Field>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button variant="outline" disabled={step === 1 || submitting}
                onClick={() => { setError(null); setStep((s) => Math.max(1, s - 1)); }}>
                <ArrowLeft className="h-4 w-4 mr-2" /> {tx.back}
              </Button>
              {step < STEPS.length ? (
                <Button onClick={next} className="bg-[#2E5E99] hover:bg-[#204a7c]">
                  {tx.continue} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting} className="bg-[#2E5E99] hover:bg-[#204a7c]">
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {tx.submit}
                </Button>
              )}
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {tx.haveAccount}{' '}
              <Link to="/login" className="font-bold text-[#2E5E99] hover:underline">{tx.signIn}</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
