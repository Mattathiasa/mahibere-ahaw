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
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { hierarchyService, type Atbiya } from '@/services/hierarchy';
import { signupService, type SignupInput } from '@/services/signup';
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

const STEPS = [
  { n: 1, label: 'Your details', icon: UserIcon },
  { n: 2, label: 'Your Atbiya', icon: Church },
  { n: 3, label: 'About you', icon: Briefcase },
  { n: 4, label: 'Sign-in details', icon: MapPin },
];

type Form = Omit<SignupInput, 'atbiyaName'> & { confirmPassword: string };

const blank: Form = {
  fullNameEnglish: '', fullNameAmharic: '', username: '', email: '',
  password: '', confirmPassword: '', phone: '', dateOfBirth: '', gender: '',
  maritalStatus: '', hasChildren: false, childrenCount: 0, workSchool: '',
  region: '', zone: '', woreda: '', ministryType: [], churchRoles: [],
  atbiyaId: '',
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wider text-[#2E5E99]">
        {label}{required && ' *'}
      </Label>
      {children}
    </div>
  );
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const moduleCfg = useModuleConfig('members');
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
      if (!form.fullNameEnglish.trim()) return 'Please enter your full name in English.';
      if (!form.fullNameAmharic.trim()) return 'Please enter your full name in Amharic.';
      if (!form.phone.trim()) return 'Please enter a phone number so your parish can reach you.';
    }
    if (n === 2 && !form.atbiyaId) {
      return 'Please choose the Atbiya you attend — that parish reviews your request.';
    }
    if (n === 4) {
      if (!form.username.trim()) return 'Please choose a username.';
      if (!/^[a-zA-Z0-9._-]{3,}$/.test(form.username.trim())) {
        return 'Usernames must be at least 3 characters, using letters, digits, dot, dash or underscore.';
      }
      if (!form.email.trim()) return 'Please enter an email address — it is how you will sign in.';
      if (form.password.length < 6) return 'Your password must be at least 6 characters.';
      if (form.password !== form.confirmPassword) return 'The two passwords do not match.';
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
        setError('That username is already taken. Please choose another.');
        return;
      }
      const { confirmPassword, ...input } = form;
      await signupService.register({
        ...input,
        atbiyaName: selectedAtbiya?.name ?? '',
      });
      navigate('/pending', {
        replace: true,
        state: { atbiyaName: selectedAtbiya?.name, atbiyaId: selectedAtbiya?.id },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const cycleLanguage = () =>
    setLanguage(language === 'en' ? 'am' : language === 'am' ? 'om' : language === 'om' ? 'ti' : 'en');

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
            className="p-3 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#2E5E99]/10 transition-colors font-bold text-xs uppercase text-[#2E5E99]">
            {language === 'en' ? 'AM' : language === 'am' ? 'OM' : language === 'om' ? 'TI' : 'EN'}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-[2rem] shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white'}`}>
          <div className="h-2 bg-gradient-to-r from-[#2E5E99] to-[#7BA4D0]" />

          <div className="p-6 sm:p-10 space-y-8">
            <div className="text-center space-y-2">
              <img src={logo} alt="Mahibere Ahaw" className="h-16 w-16 mx-auto" />
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Become a Member</h1>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                Fill in your details and choose the Atbiya you attend. Your request goes
                to that parish — you will be able to sign in once they approve it.
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
                  <Field label="Full name (English)" required>
                    <Input value={form.fullNameEnglish} onChange={(e) => set('fullNameEnglish', e.target.value)}
                      placeholder="Abebe Kebede" />
                  </Field>
                  <Field label="Full name (አማርኛ)" required>
                    <Input value={form.fullNameAmharic} onChange={(e) => set('fullNameAmharic', e.target.value)}
                      placeholder="አበበ ከበደ" />
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Phone number" required>
                    <Input value={form.phone} onChange={(e) => set('phone', e.target.value)}
                      placeholder="0911 22 33 44" />
                  </Field>
                  <Field label="Gender">
                    <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Date of birth">
                  <EthiopianDatePicker
                    value={form.dateOfBirth}
                    onChange={(iso) => set('dateOfBirth', iso)}
                  />
                </Field>
              </div>
            )}

            {/* ── Step 2: parish ── */}
            {step === 2 && (
              <div className="space-y-4">
                <Field label="Search parishes">
                  <Input value={atbiyaSearch} onChange={(e) => setAtbiyaSearch(e.target.value)}
                    placeholder="Search by name or place…" />
                </Field>

                {loadingAtbiyas ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-[#2E5E99]" />
                  </div>
                ) : atbiyas.length === 0 ? (
                  <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-[#2E5E99]/30">
                    <Church className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-bold">No parishes are accepting requests yet</p>
                    <p className="text-sm text-muted-foreground">
                      Please contact the head office, or try again later.
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
                        No parish matches "{atbiyaSearch}".
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
                  <Field label="Work or school">
                    <Input value={form.workSchool} onChange={(e) => set('workSchool', e.target.value)} />
                  </Field>
                )}
                {fieldVisible('maritalStatus') && (
                  <Field label="Marital status">
                    <Select value={form.maritalStatus} onValueChange={(v) => set('maritalStatus', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
                  <span className="text-sm font-medium">I have children</span>
                </label>
                {form.hasChildren && (
                  <Field label="Number of children">
                    <Input type="number" min={0} value={form.childrenCount}
                      onChange={(e) => set('childrenCount', Number(e.target.value))} />
                  </Field>
                )}
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Region">
                    <Select value={form.region} onValueChange={(v) => set('region', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {ETHIOPIAN_REGIONS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Zone">
                    <Input value={form.zone} onChange={(e) => set('zone', e.target.value)} />
                  </Field>
                  <Field label="Woreda">
                    <Input value={form.woreda} onChange={(e) => set('woreda', e.target.value)} />
                  </Field>
                </div>
                <Field label="Ministries you would like to serve in">
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
                      <p className="font-bold">Your request goes to {selectedAtbiya.name}</p>
                      {selectedAtbiya.contact?.phone && (
                        <p className="text-muted-foreground text-xs mt-0.5">
                          Contact: {selectedAtbiya.contact.nameEn ?? ''} {selectedAtbiya.contact.phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Username" required>
                    <Input value={form.username} onChange={(e) => set('username', e.target.value)}
                      autoComplete="username" placeholder="abebe.kebede" />
                  </Field>
                  <Field label="Email" required>
                    <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                      autoComplete="email" placeholder="you@example.com" />
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Password" required>
                    <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)}
                      autoComplete="new-password" placeholder="At least 6 characters" />
                  </Field>
                  <Field label="Confirm password" required>
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
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              {step < STEPS.length ? (
                <Button onClick={next} className="bg-[#2E5E99] hover:bg-[#204a7c]">
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting} className="bg-[#2E5E99] hover:bg-[#204a7c]">
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send request
                </Button>
              )}
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#2E5E99] hover:underline">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
