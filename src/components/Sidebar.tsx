import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Trello, 
  FileStack, 
  Sparkles, 
  BarChart3, 
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  Users,
  Bell,
  CloudSun,
  ShieldAlert,
  Settings,
  Lightbulb
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { translations } from '../translations';
import { Language, User as AppUser } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  lang: Language;
  onLogout: () => void;
  isDark?: boolean;
  currentUser?: AppUser | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  setIsOpen, 
  activeTab, 
  setActiveTab, 
  lang,
  onLogout,
  isDark,
  currentUser
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const isAdmin = currentUser?.role === 'Admin';

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
    { id: 'marketing-ideas', icon: Lightbulb, label: t.marketingIdeas },
    { id: 'preparation', icon: FileStack, label: t.preparation },
    { id: 'calendar', icon: Calendar, label: t.calendar },
    { id: 'kanban', icon: Trello, label: t.kanban },
    { id: 'events', icon: CalendarDays, label: t.events },
    { id: 'weather', icon: CloudSun, label: t.weather },
    { id: 'notifications', icon: Bell, label: t.notifications },
    { id: 'materials', icon: FileStack, label: t.materials },
    { id: 'analytics', icon: BarChart3, label: t.analytics },
    { id: 'competitors', icon: TrendingUp, label: t.competitors },
    { id: 'profile', icon: User, label: t.profile },
    ...(isAdmin ? [
      { id: 'users', icon: Users, label: t.users },
      { id: 'settings', icon: Settings, label: t.settings }
    ] : [])
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ 
        width: isOpen ? 260 : (window.innerWidth < 1024 ? 0 : 80),
        x: (window.innerWidth < 1024 && !isOpen) ? (isRtl ? 260 : -260) : 0
      }}
      className={cn(
        "fixed lg:relative top-0 bottom-0 z-50 flex flex-col transition-all duration-500",
        isDark ? "bg-[#0a0a0a] border-gray-800" : "bg-white border-gray-200 shadow-2xl lg:shadow-none",
        isRtl ? "border-l right-0" : "border-r left-0",
        !isOpen && window.innerWidth < 1024 && "pointer-events-none"
      )}
    >
      {/* Mobile Close Backdrop */}
      {isOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[-1] lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg shadow-green-900/20">
          C
        </div>
        {isOpen && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("font-bold text-xl tracking-tight truncate", isDark ? "text-green-500" : "text-green-800")}
          >
            {t.appName}
          </motion.span>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
              activeTab === item.id 
                ? (isDark ? "bg-green-500/10 text-green-500 shadow-sm shadow-green-900/20" : "bg-green-50 text-green-700 shadow-sm shadow-green-100")
                : (isDark ? "text-gray-500 hover:bg-gray-800 hover:text-gray-200" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"),
              !isOpen && "justify-center"
            )}
          >
            <item.icon size={20} className={cn("transition-transform shrink-0", activeTab === item.id ? "scale-110" : "group-hover:scale-110")} />
            {isOpen && <span className="font-medium text-sm truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className={cn("p-4 border-t space-y-2", isDark ? "border-gray-800" : "border-gray-100")}>
        <div 
          onClick={() => setActiveTab('profile')}
          className={cn("flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer", isDark ? "hover:bg-gray-800" : "hover:bg-gray-50", !isOpen && "justify-center")} 
          title={currentUser?.role || 'Admin'}
        >
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-xs uppercase", isDark ? "bg-green-500/10 text-green-500" : "bg-green-100 text-green-700")}>
            {currentUser?.avatar || (currentUser?.name ? currentUser.name[0] : 'SA')}
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs font-bold truncate", isDark ? "text-gray-200" : "text-gray-900")}>
                {currentUser?.name || 'Admin User'}
              </p>
              <p className="text-[10px] text-gray-500 truncate">
                {currentUser?.email || 'admin@cropsa.com'}
              </p>
              <span className="inline-block text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider mt-0.5">
                {currentUser?.role || 'Admin'}
              </span>
            </div>
          )}
        </div>
        <button 
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-3 p-2 rounded-lg text-red-500 transition-colors",
            isDark ? "hover:bg-red-500/10" : "hover:bg-red-50",
            !isOpen && "justify-center"
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {isOpen && <span className="text-sm font-medium">{t.logout}</span>}
        </button>
      </div>
    </motion.aside>
  );
};
