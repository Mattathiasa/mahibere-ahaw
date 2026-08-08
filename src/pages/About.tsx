import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network } from 'lucide-react';
import { PublicChrome } from '@/components/home/PublicChrome';
import { useTheme } from '@/contexts/ThemeContext';
import { useAboutContent } from '@/hooks/useAboutContent';

/**
 * ስለ እኛ — the church's history, its account of orthodoxy, and its structure.
 *
 * The homepage carries the summary, the vision and the mission; this carries
 * the ~1,800 words behind them, for a reader who chose to open it. Every
 * subsection has an anchor so the homepage, the footer or a sermon note can
 * link straight to one part.
 */
const About: React.FC = () => {
  const { theme } = useTheme();
  const { content, loaded } = useAboutContent();
  const dark = theme === 'dark';

  // The target does not exist in the DOM until the content resolves, so
  // scrolling on mount alone would silently do nothing.
  useEffect(() => {
    if (!loaded) return;
    const hash = window.location.hash;
    if (!hash) return;
    const id = window.setTimeout(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(id);
  }, [loaded]);

  const body = dark ? 'text-white/75' : 'text-[#0D2440]/75';
  const headingColor = dark ? 'text-white' : 'text-[#0D2440]';

  return (
    <PublicChrome>
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 max-w-4xl">
        {/* ── Title ── */}
        <motion.header
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mb-16 text-center"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] text-xs font-black uppercase tracking-[0.25em] font-ethiopic">
            {content.badge}
          </span>
          <h1 className={`text-3xl sm:text-5xl font-black font-ethiopic leading-tight ${headingColor}`}>
            {content.title}
          </h1>
          <p className={`font-ethiopic text-lg leading-relaxed max-w-2xl mx-auto ${body}`}>
            {content.subtitle}
          </p>
        </motion.header>

        {/* ── Contents rail ── */}
        <nav className={`mb-16 rounded-3xl border p-6 ${dark ? 'bg-white/5 border-white/10' : 'bg-[#2E5E99]/5 border-[#2E5E99]/10'}`}>
          <ol className="space-y-2">
            {content.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}
                  className="font-ethiopic font-bold text-[#2E5E99] hover:underline">
                  {s.ordinal}. {s.title}
                </a>
              </li>
            ))}
            <li>
              <a href={`#${content.structure.id}`}
                className="font-ethiopic font-bold text-[#2E5E99] hover:underline">
                {content.structure.ordinal}. {content.structure.title}
              </a>
            </li>
          </ol>
        </nav>

        {/* ── Sections ── */}
        <div className="space-y-20">
          {content.sections.map((section) => (
            <motion.section
              key={section.id} id={section.id}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              className="scroll-mt-24 space-y-6"
            >
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-black text-[#2E5E99]/30 shrink-0">{section.ordinal}</span>
                <h2 className={`text-2xl sm:text-3xl font-black font-ethiopic leading-snug ${headingColor}`}>
                  {section.title}
                </h2>
              </div>

              {section.intro && (
                <p className={`font-ethiopic text-lg leading-relaxed ${body}`}>{section.intro}</p>
              )}

              {section.subsections.map((sub) => (
                <div key={sub.id} id={sub.id} className="scroll-mt-24 space-y-3 pt-4">
                  <h3 className={`text-xl font-black font-ethiopic ${headingColor}`}>{sub.heading}</h3>
                  {sub.paragraphs.map((p, i) => (
                    <p key={i} className={`font-ethiopic leading-loose ${body}`}>{p}</p>
                  ))}
                  {(sub.bullets ?? []).length > 0 && (
                    <ul className="space-y-3 pt-2">
                      {(sub.bullets ?? []).map((b, i) => (
                        <li key={i}
                          className={`font-ethiopic leading-relaxed pl-4 border-l-2 border-[#2E5E99]/30 ${body}`}>
                          {b.title && (
                            <strong className={`font-black ${headingColor}`}>{b.title}፦ </strong>
                          )}
                          {b.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </motion.section>
          ))}

          {/* ── Structure ── */}
          <motion.section
            id={content.structure.id}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="scroll-mt-24 space-y-6"
          >
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black text-[#2E5E99]/30 shrink-0">
                {content.structure.ordinal}
              </span>
              <h2 className={`text-2xl sm:text-3xl font-black font-ethiopic leading-snug ${headingColor}`}>
                {content.structure.title}
              </h2>
            </div>
            <p className={`font-ethiopic text-lg leading-relaxed ${body}`}>{content.structure.intro}</p>

            <ol className="space-y-3">
              {content.structure.levels.map((level, i) => (
                <li key={level.name}
                  className={`flex gap-4 p-5 rounded-2xl border ${dark ? 'bg-white/5 border-white/10' : 'bg-white border-[#2E5E99]/10'}`}>
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-[#2E5E99] to-[#7BA4D0] text-white font-black flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div className="space-y-1">
                    <h3 className={`font-black font-ethiopic ${headingColor}`}>{level.name}</h3>
                    <p className={`font-ethiopic text-sm leading-relaxed ${body}`}>{level.description}</p>
                  </div>
                </li>
              ))}
            </ol>

            {content.structure.note && (
              <p className={`font-ethiopic text-sm flex items-start gap-2 ${body}`}>
                <Network className="h-4 w-4 mt-0.5 shrink-0 text-[#2E5E99]" />
                {content.structure.note}
              </p>
            )}
          </motion.section>
        </div>
      </div>
    </PublicChrome>
  );
};

export default About;
