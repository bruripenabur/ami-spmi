import React, { useState } from 'react';
import { Eye, EyeOff, Lock, LogIn, Mail, AlertCircle, Loader2, Globe, ArrowLeft } from 'lucide-react';
import { Language, t } from '../../utils/i18n';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  externalError?: string | null;
  lang?: Language;
  onToggleLang?: () => void;
  onBackToLanding?: () => void;
}

const UNPATTI_CAMPUS_BG_URL =
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e2/Foto_Universitas-Patimura.webp/500px-Foto_Universitas-Patimura.webp?utm_source=id.wikipedia.org&utm_campaign=parser&utm_content=thumbnail';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  externalError = null,
  lang = 'ID',
  onToggleLang,
  onBackToLanding,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bgFailed, setBgFailed] = useState(false);

  const displayError = errorMsg ?? externalError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg(t('login.emptyError', lang));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onLogin(trimmedEmail, password);
      if (!res.ok) {
        setErrorMsg(
          res.error || t('login.invalidError', lang)
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col justify-center">
      {/* Top action controls (Back to Landing & Language switch) */}
      <div className="fixed top-4 right-4 z-30 flex items-center gap-2">
        {onToggleLang && (
          <button
            type="button"
            onClick={onToggleLang}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 backdrop-blur-md px-3 py-2 text-xs font-bold text-amber-400 hover:bg-slate-800 shadow-lg transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span>{lang === 'ID' ? 'ID 🇮🇩 | EN 🇬🇧' : 'EN 🇬🇧 | ID 🇮🇩'}</span>
          </button>
        )}
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 backdrop-blur-md px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-lg transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-amber-400" />
            <span>{t('login.backToLanding', lang)}</span>
          </button>
        )}
      </div>

      {/* Full-bleed Background Image */}
      {!bgFailed && (
        <img
          src={UNPATTI_CAMPUS_BG_URL}
          alt="Kampus Universitas Pattimura Ambon"
          onError={() => setBgFailed(true)}
          className="fixed inset-0 h-full w-full object-cover object-center select-none pointer-events-none"
        />
      )}

      {/* High-Contrast Dark Gradient Overlay */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(15, 23, 42, 0.88) 0%, rgba(30, 58, 138, 0.78) 100%)',
        }}
      />

      {/* Responsive Container */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-start md:items-center">
          {/* Left / Top Campus Branding Column */}
          <div className="md:col-span-5 lg:col-span-6 text-white space-y-5">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/20 p-2 backdrop-blur-sm shadow-lg">
                <img
                  src="/unpatti-logo.png"
                  alt="Logo Universitas Pattimura"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#FACC15]">
                  Universitas Pattimura · Ambon
                </div>
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  {t('login.campusTitle', lang)}
                </h1>
              </div>
            </div>

            <p className="text-sm sm:text-base font-medium text-[#FACC15] leading-snug">
              {t('login.campusSub', lang)}
            </p>

            <p className="text-xs sm:text-sm text-slate-100/90 leading-relaxed max-w-xl">
              {t('login.campusDesc', lang)}
            </p>
          </div>

          {/* Right / Bottom White Login Card */}
          <div className="md:col-span-7 lg:col-span-6">
            <div className="rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-white/60 p-5 sm:p-7">
              <div className="mb-5">
                <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
                  {t('login.cardTitle', lang)}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#334155]">
                  {t('login.cardSub', lang)}
                </p>
              </div>

              {displayError && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs sm:text-sm text-red-800"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{displayError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs sm:text-sm font-semibold text-[#334155] mb-1.5"
                  >
                    {t('login.emailLabel', lang)}
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-email"
                      type="text"
                      autoComplete="username email"
                      value={email}
                      disabled={isSubmitting}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('login.emailPlaceholder', lang)}
                      className="w-full min-h-[46px] rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-3.5 py-2.5 text-base text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs sm:text-sm font-semibold text-[#334155] mb-1.5"
                  >
                    {t('login.passwordLabel', lang)}
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      disabled={isSubmitting}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('login.passwordPlaceholder', lang)}
                      className="w-full min-h-[46px] rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-12 py-2.5 text-base text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                      }
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] active:bg-blue-900 px-5 py-3 text-sm sm:text-base font-bold text-white shadow-md shadow-blue-900/20 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('login.verifying', lang)}
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      {t('login.submit', lang)}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
