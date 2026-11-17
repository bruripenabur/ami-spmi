import React from 'react';
import { ArrowRight, Globe, ShieldCheck, Sparkles } from 'lucide-react';
import { Language, t } from '../../utils/i18n';

interface LandingCardProps {
  lang: Language;
  onToggleLang: () => void;
  onEnterApp: () => void;
}

export const LandingCard: React.FC<LandingCardProps> = ({
  lang,
  onToggleLang,
  onEnterApp,
}) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-4 sm:p-6 relative overflow-hidden">
      {/* Artistic Subtle Watermark "Hotumese" */}
      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden">
        <span className="text-[18vw] font-black tracking-widest text-white/[0.03] uppercase font-mono">
          Hotumese
        </span>
      </div>

      <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-blue-500/30 bg-slate-900/80 backdrop-blur-xl shadow-2xl p-6 sm:p-10 text-white space-y-8">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3.5">
            <img
              src="/unpatti-logo.png"
              alt="Logo UNPATTI"
              className="h-12 w-12 object-contain"
            />
            <div>
              <div className="text-[11px] font-mono tracking-wider text-amber-400 font-semibold uppercase">
                UNIVERSITAS PATTIMURA
              </div>
              <div className="text-xs text-slate-300 font-medium">
                LPMPP — UNPATTI AMBON
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleLang}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-amber-400 hover:bg-slate-700 transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span>{lang === 'ID' ? 'ID 🇮🇩 | EN 🇬🇧' : 'EN 🇬🇧 | ID 🇮🇩'}</span>
            </button>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/50 px-4 py-1.5 text-xs text-blue-300 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>{t('landing.badge', lang)}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {t('landing.headline', lang)}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            {t('landing.desc', lang)}
          </p>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5 space-y-1.5">
            <div className="text-xs font-bold text-amber-400">
              {t('landing.unit', lang)}
            </div>
            <div className="text-xs italic text-slate-300 font-medium">
              {t('landing.tagline', lang)}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>{t('landing.certified', lang)}</span>
          </div>

          <button
            type="button"
            onClick={onEnterApp}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all hover:scale-[1.02]"
          >
            <span>{t('landing.join', lang)}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
