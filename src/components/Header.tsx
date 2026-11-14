import React from 'react';
import { 
  Menu, 
  Search, 
  PlusCircle, 
  Globe,
  Settings,
  LogOut
} from 'lucide-react';
import { translations } from '../translations';
import { Language } from '../types';
import { cn } from '../lib/utils';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeTab: string;
  lang: Language;
  setLang: (lang: Language) => void;
  isDark?: boolean;
  onNewContent?: () => void;
  hasNotifications?: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar, 
  activeTab, 
  lang,
  setLang,
  isDark,
  onNewContent,
  hasNotifications,
  onLogout
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  return (
    <header className={cn(
      "h-16 flex items-center justify-between px-8 shrink-0 z-10 transition-colors duration-500",
      isDark ? "bg-[#0a0a0a] border-b border-gray-800 text-gray-100" : "bg-white border-b border-gray-200 text-gray-900"
    )}>
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className={cn("p-2 rounded-lg transition-colors", isDark ? "hover:bg-gray-800" : "hover:bg-gray-100")}
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold capitalize truncate">
          {t[activeTab.replace('-', 'aiLab') as keyof typeof t] || activeTab}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className={isRtl ? "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" : "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"} size={16} />
          <input 
            type="text" 
            placeholder={t.search} 
            className={cn(
              "py-2 rounded-full text-sm w-64 transition-all outline-none border-transparent focus:bg-transparent focus:border-green-500",
              isRtl ? "pr-10 pl-4" : "pl-10 pr-4",
              isDark ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-900 focus:bg-white"
            )}
          />
        </div>

        <button 
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          className={cn("p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium", isDark ? "hover:bg-gray-800" : "hover:bg-gray-100")}
        >
          <Globe size={18} />
          <span>{lang === 'en' ? 'العربية' : 'English'}</span>
        </button>

        {onLogout && (
          <button 
            onClick={onLogout}
            title={t.logout}
            className={cn(
              "p-2 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700",
              isDark ? "hover:bg-red-950/20" : "hover:bg-red-50"
            )}
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">{t.logout}</span>
          </button>
        )}

        <button 
          onClick={onNewContent}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shadow-green-900/20 shrink-0"
        >
          <PlusCircle size={18} />
          <span className="hidden sm:inline">{t.newContent}</span>
        </button>
      </div>
    </header>
  );
};
