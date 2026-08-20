import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logo from '@/assets/logo.png';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '@/services/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGE_ENDONYM, nextLanguage } from '@/i18n/languages';
import { useTranslation } from '@/hooks/useTranslation';
import { Sun, Moon, Languages, Home, Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThreeBackground } from '@/components/ThreeBackground';

import { errorMessage } from '@/lib/appError';
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggingIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t: tree } = useLanguage();
  const { t } = useTranslation();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const upcomingLanguage = nextLanguage(language);
  const toggleLanguage = () => setLanguage(upcomingLanguage);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      // Only auto-redirect if coming from a protected route (has 'from' in state)
      const fromProtectedRoute = (location.state as any)?.from;

      // `getCurrentUser` is the gate rather than `isAuthenticated`, because it
      // waits for onAuthStateChanged: on a cold load the SDK has not restored the
      // session yet, so the synchronous check reads false for a signed-in user.
      // That used to be masked by `isAuthenticated` trusting a token string in
      // localStorage — which is the very thing that made it lie about expired
      // sessions. Rejection here is the ordinary "nobody signed in" path.
      try {
        await authService.getCurrentUser();
        if (fromProtectedRoute) {
          navigate(fromProtectedRoute.pathname, { replace: true });
          return;
        }
        // Signed in, but they came to /login deliberately — leave them here.
      } catch {
        authService.clearAuth();
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [navigate, location]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim()) return;
    setLoginError(null);
    setResetNotice(null);
    login(formData, {
      onError: (error: unknown) => setLoginError(errorMessage(tree, error)),
    });
  };

  /**
   * Firebase's own reset email — free, no Cloud Functions involved. Accounts
   * created with only a username have no real inbox; sendPasswordReset says so
   * rather than reporting a success nobody will ever receive.
   */
  const handleForgotPassword = async () => {
    setLoginError(null);
    setResetNotice(null);
    if (!formData.username.trim()) {
      setLoginError(tree.errors.enterIdentifierFirst);
      return;
    }
    setIsResetting(true);
    try {
      const { sentTo } = await authService.sendPasswordReset(formData.username);
      setResetNotice(tree.pages.resetLinkSent.replace('{email}', sentTo));
    } catch (error) {
      setLoginError(errorMessage(tree, error));
    } finally {
      setIsResetting(false);
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#0D2440]' : 'bg-[#E7F0FA]'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E5E99] mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-700 ${theme === 'dark' ? 'bg-[#0D2440] text-white' : 'bg-[#E7F0FA] text-[#0D2440]'}`}>
      <ThreeBackground />

      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#2E5E99]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#7BA4D0]/10 blur-[100px] pointer-events-none" />

      {/* Navigation Buttons */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-6 left-6 z-20"
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className={`gap-2 rounded-xl backdrop-blur-md border border-[#2E5E99]/10 shadow-sm hover:shadow-md transition-all ${theme === 'dark' ? 'bg-[#0D2440]/50 hover:bg-[#0D2440]/70 text-white' : 'bg-white/50 hover:bg-white/70 text-[#0D2440]'}`}
        >
          <Home className="h-4 w-4" />
          <span className="font-bold text-xs uppercase tracking-wider">{t('loginHome')}</span>
        </Button>
      </motion.div>

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="absolute top-6 right-6 flex items-center gap-3 z-20"
      >
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className={`rounded-xl border-[#2E5E99]/10 backdrop-blur-md ${theme === 'dark' ? 'bg-[#0D2440]/50 hover:bg-[#0D2440]/70 text-[#7BA4D0]' : 'bg-white/50 hover:bg-white/70 text-[#2E5E99]'}`}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className={`gap-2 rounded-xl border-[#2E5E99]/10 backdrop-blur-md font-bold text-xs ${theme === 'dark' ? 'bg-[#0D2440]/50 hover:bg-[#0D2440]/70 text-white' : 'bg-white/50 hover:bg-white/70 text-[#0D2440]'}`}
        >
          <Languages className="h-4 w-4 text-[#2E5E99]" />
          <span>{LANGUAGE_ENDONYM[language]}</span>
        </Button>
      </motion.div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <Card className={`border-[#2E5E99]/10 shadow-2xl overflow-hidden backdrop-blur-xl ${theme === 'dark' ? 'bg-[#0D2440]/60' : 'bg-white/70'}`}>
          <div className={`h-2 w-full bg-gradient-to-r from-[#2E5E99] via-[#7BA4D0] to-[#2E5E99]`} />

          <CardHeader className="space-y-4 text-center pt-6 sm:pt-10 pb-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex justify-center"
            >
              <div className="relative group">
                <div className="absolute -inset-4 bg-[#2E5E99]/20 rounded-full blur-xl group-hover:bg-[#2E5E99]/30 transition-all duration-500" />
                <img src={logo} alt={tree.common.logoAlt} className="h-16 w-16 sm:h-24 sm:w-24 relative z-10 drop-shadow-2xl" />
              </div>
            </motion.div>

            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] text-[10px] font-black uppercase tracking-widest border border-[#2E5E99]/20 mb-2">
                  <Sparkles className="h-3 w-3" />
                  {t('loginBadge')}
                </div>
                <CardTitle className={`text-2xl sm:text-4xl font-black font-ethiopic tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
                  {t('loginTitle')}
                </CardTitle>
              </motion.div>
              <CardDescription className={`text-base font-ethiopic ${theme === 'dark' ? 'text-white/60' : 'text-[#0D2440]/60'}`}>
                {t('loginSubtitle')}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-5 sm:p-8 pt-4 sm:pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <Label htmlFor="username" className={`text-xs uppercase font-bold tracking-widest ${theme === 'dark' ? 'text-[#7BA4D0]' : 'text-[#2E5E99]'}`}>{t('loginUsernameLabel')}</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-[#2E5E99] transition-colors" />
                    <Input
                      id="username"
                      type="text"
                      placeholder={t('loginUsernamePlaceholder')}
                      value={formData.username}
                      onChange={(e) => { setFormData({ ...formData, username: e.target.value }); setLoginError(null); }}
                      required
                      disabled={isLoggingIn}
                      className={`pl-10 h-12 rounded-xl border-[#2E5E99]/20 bg-transparent focus:bg-[#2E5E99]/5 focus:border-[#2E5E99] transition-all ${theme === 'dark' ? 'text-white placeholder:text-white/20' : 'text-[#0D2440]'}`}
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className={`text-xs uppercase font-bold tracking-widest ${theme === 'dark' ? 'text-[#7BA4D0]' : 'text-[#2E5E99]'}`}>{t('loginPasswordLabel')}</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-[#2E5E99] transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder={t('loginPasswordPlaceholder')}
                      value={formData.password}
                      onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setLoginError(null); }}
                      required
                      disabled={isLoggingIn}
                      className={`pl-10 h-12 rounded-xl border-[#2E5E99]/20 bg-transparent focus:bg-[#2E5E99]/5 focus:border-[#2E5E99] transition-all ${theme === 'dark' ? 'text-white placeholder:text-white/20' : 'text-[#0D2440]'}`}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={isResetting}
                      className="text-xs font-bold text-[#2E5E99] hover:underline disabled:opacity-50"
                    >
                      {isResetting ? tree.pages.loginSendingReset : tree.pages.loginForgotPassword}
                    </button>
                  </div>
                  {resetNotice && (
                    <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-sm flex items-start gap-2">
                      <span className="mt-0.5">✅</span>
                      <span>{resetNotice}</span>
                    </div>
                  )}
                </motion.div>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {loginError && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium flex items-start gap-2">
                    <span className="mt-0.5">⚠️</span>
                    <span>{loginError}</span>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full h-12 bg-[#2E5E99] hover:bg-[#1a3a60] text-white rounded-xl shadow-lg hover:shadow-xl hover:shadow-[#2E5E99]/20 transition-all duration-300 font-bold tracking-wide"
                  size="lg"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                      <span>{t('loginVerifying')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{t('loginSignIn')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="text-center text-sm"
              >
                <span className={theme === 'dark' ? 'text-white/50' : 'text-[#0D2440]/60'}>
                  {tree.pages.loginNewMember}{' '}
                </span>
                <Link to="/signup" className="font-bold text-[#2E5E99] hover:underline">
                  {tree.pages.loginCreateAccount}
                </Link>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-white/30' : 'text-[#0D2440]/40'}`}>
                  {tree.pages.loginApprovalNote}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className={`text-center text-xs space-y-2 p-4 rounded-xl border border-dashed border-[#2E5E99]/20 ${theme === 'dark' ? 'bg-[#2E5E99]/5 text-white/40' : 'bg-[#E7F0FA] text-[#0D2440]/50'}`}
              >
                <p className="font-bold uppercase tracking-widest mb-2">{t('loginAuthNote')}</p>
                <div className="flex justify-center gap-4 font-mono">
                  <span>{t('loginAuthDesc')}</span>
                </div>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
