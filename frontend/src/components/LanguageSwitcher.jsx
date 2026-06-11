import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { supportedLanguages } from '../../../shared/i18n.config.js';

export default function LanguageSwitcher({ dark = false }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Normalize language code — i18n.language can be 'en-US' etc.
  const currentLang = i18n.language?.split('-')[0] || 'uz';
  const current = supportedLanguages.find(({ code }) => code === currentLang) || supportedLanguages[0];

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selectLang = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="lang-switcher relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={current.label}
        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors ${
          dark
            ? 'text-white/90 hover:bg-white/10'
            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <span>{current.flag}</span>
        <span>{current.code.toUpperCase()}</span>
        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[200] mt-1.5 w-40 overflow-hidden rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 shadow-xl">
          {supportedLanguages.map(({ code, label, flag }) => (
            <button
              key={code}
              onClick={() => selectLang(code)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                currentLang === code
                  ? 'bg-blue-50 dark:bg-blue-900/30 font-semibold text-blue-600 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <span>{flag}</span>
              <span className="font-semibold">{code.toUpperCase()}</span>
              <span className={`text-xs ${currentLang === code ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-400'}`}>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
