// [Member 3 - Abhinav] frontend/src/components/customer_tablet/LanguageSelector.tsx

import React, { useState } from 'react';
import { notifyWebSocket } from '../../services/apiService';

export interface Language {
  code: string;
  name: string;
  nativeScript: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeScript: 'English' },
  { code: 'hi', name: 'Hindi', nativeScript: 'हिंदी' },
  { code: 'mr', name: 'Marathi', nativeScript: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeScript: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeScript: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', nativeScript: 'বাংলা' }
];

export interface LanguageSelectorProps {
  onLanguageSelect: (code: string, name: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageSelect }) => {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const handleSelect = (lang: Language) => {
    // If a selection is already confirmed, ignore further clicks
    if (selectedCode) return;

    setSelectedCode(lang.code);
    
    // Notify websocket singleton pattern via Event
    notifyWebSocket(lang.code);
    
    // Notify paremt component to show summary
    onLanguageSelect(lang.code, lang.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, lang: Language) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(lang);
    }
  };

  return (
    <div className="language-grid" role="group" aria-label="Select your preferred language">
      {LANGUAGES.map((lang) => {
        const isSelected = selectedCode === lang.code;
        return (
          <button
            key={lang.code}
            className={`language-tile ${isSelected ? 'selected' : ''}`}
            onClick={() => handleSelect(lang)}
            onKeyDown={(e) => handleKeyDown(e, lang)}
            disabled={selectedCode !== null} // Disable tiles once a choice is made locally
            aria-pressed={isSelected}
            aria-label={`${lang.name} - ${lang.nativeScript}`}
          >
            <span className="english-name">{lang.name}</span>
            <span className="native-name script-native">{lang.nativeScript}</span>
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSelector;
