import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '../../../shared/i18n.config.js';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  // Normalize language code — i18n.language can be 'en-US' etc.
  const currentLang = i18n.language?.split('-')[0] || 'uz';

  return (
    <div className="lang-switcher flex gap-1">
      {supportedLanguages.map(({ code, label, flag }) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          title={label}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            currentLang === code
              ? 'font-bold bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {flag} <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
