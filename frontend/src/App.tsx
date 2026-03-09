import { createContext, useState, useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SetupPage from './pages/Setup';
import ChatPage from './pages/Chat';
import { translations } from './i18n';
import type { Language } from './i18n';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

function App() {
  const [language, setLanguage] = useState<Language>('en');

  const t = (keyPath: string) => {
    const keys = keyPath.split('.');
    let result: any = translations[language];
    for (const key of keys) {
      result = result?.[key];
    }
    return result || keyPath;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SetupPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </BrowserRouter>
    </LanguageContext.Provider>
  );
}

export default App;
