// [Member 3 - Abhinav] frontend/src/components/customer_tablet/LanguageSelector.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface Language {
  code: string;
  name: string;
  nativeScript: string;
}

interface LanguageGroup {
  region: string;
  languages: Language[];
}

export interface LanguageSelectorProps {
  onLanguageSelect: (code: string, name: string) => void;
}

const PRIME_LANGUAGES: Language[] = [
  { code: 'hi', name: 'Hindi', nativeScript: 'हिंदी' },
  { code: 'en', name: 'English', nativeScript: 'English' },
  { code: 'mr', name: 'Marathi', nativeScript: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeScript: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeScript: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', nativeScript: 'বাংলা' },
];

const ALL_LANGUAGE_GROUPS: LanguageGroup[] = [
  {
    region: 'Indian',
    languages: [
      { code: 'as', name: 'Assamese', nativeScript: 'অসমীয়া' },
      { code: 'brx', name: 'Bodo', nativeScript: 'बड़ो' },
      { code: 'doi', name: 'Dogri', nativeScript: 'डोगरी' },
      { code: 'gu', name: 'Gujarati', nativeScript: 'ગુજરાતી' },
      { code: 'kn', name: 'Kannada', nativeScript: 'ಕನ್ನಡ' },
      { code: 'ks', name: 'Kashmiri', nativeScript: 'كٲشُر' },
      { code: 'kok', name: 'Konkani', nativeScript: 'कोंकणी' },
      { code: 'mai', name: 'Maithili', nativeScript: 'मैथिली' },
      { code: 'ml', name: 'Malayalam', nativeScript: 'മലയാളം' },
      { code: 'mni', name: 'Manipuri', nativeScript: 'মণিপুরী' },
      { code: 'ne', name: 'Nepali', nativeScript: 'नेपाली' },
      { code: 'or', name: 'Odia', nativeScript: 'ଓଡ଼ିଆ' },
      { code: 'pa', name: 'Punjabi', nativeScript: 'ਪੰਜਾਬੀ' },
      { code: 'sa', name: 'Sanskrit', nativeScript: 'संस्कृतम्' },
      { code: 'sat', name: 'Santali', nativeScript: 'ᱥᱟᱱᱛᱟᱲᱤ' },
      { code: 'sd', name: 'Sindhi', nativeScript: 'سنڌي' },
      { code: 'ur', name: 'Urdu', nativeScript: 'اردو' },
    ],
  },
  {
    region: 'Asian',
    languages: [
      { code: 'zh', name: 'Chinese (Mandarin)', nativeScript: '中文' },
      { code: 'ja', name: 'Japanese', nativeScript: '日本語' },
      { code: 'ko', name: 'Korean', nativeScript: '한국어' },
      { code: 'th', name: 'Thai', nativeScript: 'ไทย' },
      { code: 'vi', name: 'Vietnamese', nativeScript: 'Tiếng Việt' },
      { code: 'id', name: 'Indonesian', nativeScript: 'Bahasa Indonesia' },
      { code: 'ms', name: 'Malay', nativeScript: 'Bahasa Melayu' },
      { code: 'tl', name: 'Tagalog', nativeScript: 'Tagalog' },
      { code: 'my', name: 'Burmese', nativeScript: 'မြန်မာ' },
      { code: 'km', name: 'Khmer', nativeScript: 'ខ្មែរ' },
      { code: 'lo', name: 'Lao', nativeScript: 'ລາວ' },
      { code: 'si', name: 'Sinhala', nativeScript: 'සිංහල' },
      { code: 'bo', name: 'Tibetan', nativeScript: 'བོད་སྐད' },
      { code: 'mn', name: 'Mongolian', nativeScript: 'Монгол' },
      { code: 'az', name: 'Azerbaijani', nativeScript: 'Azərbaycan' },
      { code: 'kk', name: 'Kazakh', nativeScript: 'Қазақ' },
      { code: 'uz', name: 'Uzbek', nativeScript: 'Oʻzbek' },
      { code: 'tk', name: 'Turkmen', nativeScript: 'Türkmen' },
      { code: 'ky', name: 'Kyrgyz', nativeScript: 'Кыргызча' },
      { code: 'tg', name: 'Tajik', nativeScript: 'Тоҷикӣ' },
      { code: 'ka', name: 'Georgian', nativeScript: 'ქართული' },
      { code: 'hy', name: 'Armenian', nativeScript: 'Հայերեն' },
    ],
  },
  {
    region: 'European',
    languages: [
      { code: 'es', name: 'Spanish', nativeScript: 'Español' },
      { code: 'fr', name: 'French', nativeScript: 'Français' },
      { code: 'de', name: 'German', nativeScript: 'Deutsch' },
      { code: 'it', name: 'Italian', nativeScript: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nativeScript: 'Português' },
      { code: 'ru', name: 'Russian', nativeScript: 'Русский' },
      { code: 'nl', name: 'Dutch', nativeScript: 'Nederlands' },
      { code: 'pl', name: 'Polish', nativeScript: 'Polski' },
      { code: 'sv', name: 'Swedish', nativeScript: 'Svenska' },
      { code: 'no', name: 'Norwegian', nativeScript: 'Norsk' },
      { code: 'da', name: 'Danish', nativeScript: 'Dansk' },
      { code: 'fi', name: 'Finnish', nativeScript: 'Suomi' },
      { code: 'cs', name: 'Czech', nativeScript: 'Čeština' },
      { code: 'sk', name: 'Slovak', nativeScript: 'Slovenčina' },
      { code: 'hu', name: 'Hungarian', nativeScript: 'Magyar' },
      { code: 'ro', name: 'Romanian', nativeScript: 'Română' },
      { code: 'bg', name: 'Bulgarian', nativeScript: 'Български' },
      { code: 'hr', name: 'Croatian', nativeScript: 'Hrvatski' },
      { code: 'sr', name: 'Serbian', nativeScript: 'Српски' },
      { code: 'uk', name: 'Ukrainian', nativeScript: 'Українська' },
      { code: 'el', name: 'Greek', nativeScript: 'Ελληνικά' },
      { code: 'tr', name: 'Turkish', nativeScript: 'Türkçe' },
      { code: 'sq', name: 'Albanian', nativeScript: 'Shqip' },
      { code: 'bs', name: 'Bosnian', nativeScript: 'Bosanski' },
      { code: 'mk', name: 'Macedonian', nativeScript: 'Македонски' },
      { code: 'sl', name: 'Slovenian', nativeScript: 'Slovenščina' },
      { code: 'lv', name: 'Latvian', nativeScript: 'Latviešu' },
      { code: 'lt', name: 'Lithuanian', nativeScript: 'Lietuvių' },
      { code: 'et', name: 'Estonian', nativeScript: 'Eesti' },
      { code: 'mt', name: 'Maltese', nativeScript: 'Malti' },
      { code: 'ga', name: 'Irish', nativeScript: 'Gaeilge' },
      { code: 'cy', name: 'Welsh', nativeScript: 'Cymraeg' },
      { code: 'ca', name: 'Catalan', nativeScript: 'Català' },
      { code: 'eu', name: 'Basque', nativeScript: 'Euskara' },
      { code: 'gl', name: 'Galician', nativeScript: 'Galego' },
      { code: 'is', name: 'Icelandic', nativeScript: 'Íslenska' },
      { code: 'lb', name: 'Luxembourgish', nativeScript: 'Lëtzebuergesch' },
    ],
  },
  {
    region: 'Middle Eastern & African',
    languages: [
      { code: 'ar', name: 'Arabic', nativeScript: 'العربية' },
      { code: 'he', name: 'Hebrew', nativeScript: 'עברית' },
      { code: 'fa', name: 'Persian (Farsi)', nativeScript: 'فارسی' },
      { code: 'ku', name: 'Kurdish', nativeScript: 'کوردی' },
      { code: 'ps', name: 'Pashto', nativeScript: 'پښتو' },
      { code: 'sw', name: 'Swahili', nativeScript: 'Kiswahili' },
      { code: 'am', name: 'Amharic', nativeScript: 'አማርኛ' },
      { code: 'ha', name: 'Hausa', nativeScript: 'Hausa' },
      { code: 'yo', name: 'Yoruba', nativeScript: 'Yorùbá' },
      { code: 'ig', name: 'Igbo', nativeScript: 'Igbo' },
      { code: 'zu', name: 'Zulu', nativeScript: 'isiZulu' },
      { code: 'xh', name: 'Xhosa', nativeScript: 'isiXhosa' },
      { code: 'af', name: 'Afrikaans', nativeScript: 'Afrikaans' },
      { code: 'so', name: 'Somali', nativeScript: 'Soomaaliga' },
      { code: 'ti', name: 'Tigrinya', nativeScript: 'ትግርኛ' },
    ],
  },
  {
    region: 'Americas & Others',
    languages: [
      { code: 'ht', name: 'Haitian Creole', nativeScript: 'Kreyòl ayisyen' },
      { code: 'qu', name: 'Quechua', nativeScript: 'Runasimi' },
      { code: 'gn', name: 'Guarani', nativeScript: "Avañe'ẽ" },
      { code: 'nah', name: 'Nahuatl', nativeScript: 'Nāhuatl' },
    ],
  },
];

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (language: Language) => void;
  selectedCode: string | null;
}

const LanguageModal: React.FC<ModalProps> = ({ isOpen, onClose, onSelect, selectedCode }) => {
  const [search, setSearch] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, input, [tabindex]:not([tabindex="-1"])'
        );

        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const filterLanguages = (languages: Language[]): Language[] => {
    if (!search.trim()) return languages;

    const query = search.toLowerCase().trim();
    return languages.filter(
      (language) =>
        language.name.toLowerCase().includes(query) ||
        language.nativeScript.toLowerCase().includes(query)
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        ref={modalRef}
        className="modal-container"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Select a language"
      >
        <div className="modal-header">
          <h2 className="modal-title">All Languages</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close language selector"
          >
            ✕
          </button>
        </div>

        <div className="modal-search-wrapper">
          <input
            ref={searchInputRef}
            className="modal-search-input"
            type="text"
            placeholder="Search language..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search languages"
          />
        </div>

        <div className="modal-body">
          {ALL_LANGUAGE_GROUPS.map((group) => {
            const filtered = filterLanguages(group.languages);
            if (filtered.length === 0) return null;

            return (
              <div key={group.region} className="modal-region-group">
                <h3 className="modal-region-header">{group.region}</h3>
                <div className="modal-chips-grid">
                  {filtered.map((language) => (
                    <button
                      key={`${group.region}-${language.code}`}
                      type="button"
                      className={`modal-chip ${selectedCode === language.code ? 'selected pulse-gold' : ''}`}
                      onClick={() => onSelect(language)}
                      aria-label={`${language.name} - ${language.nativeScript}`}
                      aria-pressed={selectedCode === language.code}
                    >
                      <span className="modal-chip-native script-native">{language.nativeScript}</span>
                      <span className="modal-chip-english">{language.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {ALL_LANGUAGE_GROUPS.every((group) => filterLanguages(group.languages).length === 0) && (
            <div className="modal-no-results">No languages match &ldquo;{search}&rdquo;</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageSelect }) => {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const handleSelect = useCallback(
    (language: Language) => {
      if (selectedCode) return;

      setSelectedCode(language.code);
      setModalOpen(false);
      onLanguageSelect(language.code, language.name);
    },
    [onLanguageSelect, selectedCode]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, language: Language) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect(language);
    }
  };

  return (
    <>
      <div className="language-grid" role="group" aria-label="Select your preferred language">
        {PRIME_LANGUAGES.map((language) => {
          const isSelected = selectedCode === language.code;

          return (
            <button
              key={language.code}
              type="button"
              className={`language-tile ${isSelected ? 'selected pulse-gold' : ''}`}
              onClick={() => handleSelect(language)}
              onKeyDown={(event) => handleKeyDown(event, language)}
              disabled={selectedCode !== null}
              aria-pressed={isSelected}
              aria-label={`${language.name} - ${language.nativeScript}`}
            >
              <span className="native-name script-native">{language.nativeScript}</span>
              <span className="english-name">{language.name}</span>
            </button>
          );
        })}
      </div>

      {!selectedCode && (
        <button
          type="button"
          className="more-languages-btn"
          onClick={() => setModalOpen(true)}
          aria-label="Show more languages"
        >
          🌐 More Languages
        </button>
      )}

      <LanguageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelect}
        selectedCode={selectedCode}
      />
    </>
  );
};

export default LanguageSelector;
