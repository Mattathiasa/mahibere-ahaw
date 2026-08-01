import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Home, Phone, Mail, Church, MapPin } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useTheme } from '@/contexts/ThemeContext';
import { hierarchyService, type Atbiya } from '@/services/hierarchy';
import { Button } from '@/components/ui/button';

/**
 * Shown after a member sends a sign-up request, and whenever a pending member
 * tries to sign in. Its job is to explain who is deciding and how to reach them.
 */
const PendingApproval: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const location = useLocation();
  const state = (location.state ?? {}) as { atbiyaName?: string; atbiyaId?: string };

  const [parish, setParish] = useState<Atbiya | null>(null);

  useEffect(() => {
    if (!state.atbiyaId) return;
    // Parish records are publicly readable, so this works while signed out.
    hierarchyService.getAtbiyaById(state.atbiyaId)
      .then(setParish)
      .catch(() => setParish(null));
  }, [state.atbiyaId]);

  const name = parish?.name ?? state.atbiyaName;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-700 ${
      theme === 'dark' ? 'bg-[#0D2440] text-white' : 'bg-[#E7F0FA] text-[#0D2440]'}`}>
      <div className="p-4 sm:p-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="gap-2 font-bold">
          <Home className="h-4 w-4" /> HOME
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden ${
            theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white'}`}>
          <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-500" />
          <div className="p-8 sm:p-10 space-y-6 text-center">
            <img src={logo} alt="Mahibere Ahaw" className="h-16 w-16 mx-auto" />

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-black uppercase tracking-widest border border-amber-500/20">
              <Clock className="h-3.5 w-3.5" /> Awaiting approval
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight">Request sent</h1>
              <p className="text-muted-foreground leading-relaxed">
                {name
                  ? <>Your membership request is with <strong>{name}</strong>. Once they approve it you will be able to sign in with the username and password you just chose.</>
                  : <>Your membership request has been sent to your Atbiya. Once they approve it you will be able to sign in with the username and password you just chose.</>}
              </p>
            </div>

            {parish && (parish.contact?.phone || parish.contact?.email || parish.address?.am || parish.address?.en) && (
              <div className="text-left rounded-2xl border border-[#2E5E99]/15 bg-[#2E5E99]/5 p-5 space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-[#2E5E99] flex items-center gap-1.5">
                  <Church className="h-3.5 w-3.5" /> {parish.name}
                  {parish.nameAmharic && <span className="font-ethiopic font-bold normal-case">· {parish.nameAmharic}</span>}
                </p>
                {(parish.address?.am || parish.address?.en) && (
                  <p className="text-sm flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[#2E5E99]" />
                    <span className="font-ethiopic leading-relaxed">{parish.address?.am || parish.address?.en}</span>
                  </p>
                )}
                {parish.contact?.phone && (
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-[#2E5E99]" />
                    <a href={`tel:${parish.contact.phone.replace(/\s+/g, '')}`} className="font-bold hover:underline">
                      {parish.contact.phone}
                    </a>
                    {parish.contact.nameEn && (
                      <span className="text-muted-foreground text-xs">({parish.contact.nameEn})</span>
                    )}
                  </p>
                )}
                {parish.contact?.email && (
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-[#2E5E99]" />
                    <a href={`mailto:${parish.contact.email}`} className="font-bold hover:underline break-all">
                      {parish.contact.email}
                    </a>
                  </p>
                )}
                <p className="text-xs text-muted-foreground pt-1">
                  Contact them directly if your request is taking longer than expected.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => navigate('/')}>Back to home</Button>
              <Button onClick={() => navigate('/login')} className="bg-[#2E5E99] hover:bg-[#204a7c]">
                Go to sign in
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Wrong parish?{' '}
              <Link to="/signup" className="font-bold text-[#2E5E99] hover:underline">
                Start a new request
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PendingApproval;
