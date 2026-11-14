import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ChevronRight, 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer, 
  FileText, 
  Trello, 
  Calendar as CalendarIcon, 
  CloudSun, 
  CloudRain, 
  Sun, 
  Wind, 
  Droplets, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Video, 
  MessageCircle, 
  Hash, 
  BellRing,
  Sparkles,
  Search,
  CheckCircle,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../translations';
import { Language, ContentItem, Platform, CustomKPI, DashboardWidget, User } from '../types';
import { cn } from '../lib/utils';
import { ExecutiveReportModal } from './ExecutiveReportModal';

interface DashboardProps {
  lang: Language;
  content: ContentItem[];
  users?: User[];
  stats: { 
    total: number; 
    published: number; 
    delayed: number; 
    pending: number;
    prepSpeed: number;
    approvalRate: number;
    publishAccuracy: number;
    analyticsData?: { 
      totalReach: string;
      platformStats?: Record<string, number>;
    };
  };
  socialConnections: Record<string, boolean>;
  onToggleSocial: (platform: any) => void;
  customKPIs: CustomKPI[];
  onAddKPI: (kpi: Omit<CustomKPI, 'id' | 'current' | 'progress'>) => void;
  onDeleteKPI: (id: string) => void;
  widgets: DashboardWidget[];
  onUpdateWidgets: (widgets: DashboardWidget[]) => void;
  setActiveTab: (tab: any) => void;
  events?: any[];
  platformAnalytics?: any[];
}

const PLATFORMS_AR: Record<Platform, string> = {
  'Facebook': 'فيسبوك',
  'Instagram': 'إنستغرام',
  'LinkedIn': 'لينكد إن',
  'TikTok': 'تيك توك',
  'WhatsApp': 'واتساب',
  'Other': 'منصات أخرى'
};

const PLATFORM_ICONS: Record<Platform, any> = {
  'Facebook': Facebook,
  'Instagram': Instagram,
  'LinkedIn': Linkedin,
  'TikTok': Video,
  'WhatsApp': MessageCircle,
  'Other': Hash,
};

// Simple weather advice mapping
const WEATHER_MOCK = [
  { governorate: 'Cairo', governorateAr: 'القاهرة', temp: 28, condition: 'Sunny', adviceAr: 'جدول ري طبيعي. وقت مناسب لحصاد وتجفيف القمح.', adviceEn: 'Normal irrigation schedule. Ideal wheat drying weather.' },
  { governorate: 'Giza', governorateAr: 'الجيزة', temp: 29, condition: 'Sunny', adviceAr: 'مثالي لزراعة البطاطس والري في الصباح الباكر.', adviceEn: 'Ideal potatoes care weather. Irrigate early mornings.' },
  { governorate: 'Fayoum', governorateAr: 'الفيوم', temp: 31, condition: 'Partly Cloudy', adviceAr: 'سرعة الرياح متوسطة. انتبه عند رش المبيدات.', adviceEn: 'Moderate wind speed. Guard pesticide spraying.' }
];

export const Dashboard: React.FC<DashboardProps> = ({ 
  lang, 
  content, 
  users = [],
  stats, 
  setActiveTab,
  events = [],
  platformAnalytics = []
}) => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const isRtl = lang === 'ar';
  const t = translations[lang];

  // 1. Overdue / Late Items alerts (التنبيهات بالحاجات المتأخرة)
  const overdueItems = useMemo(() => {
    const today = new Date();
    return content.filter(item => {
      if (item.status === 'Published') return false;
      const dueDate = new Date(item.dueDate);
      return dueDate < today;
    });
  }, [content]);

  // 2. Content Preparation Details (تحضير المحتوى - summary)
  const prepStats = useMemo(() => {
    const totalPrep = content.length;
    const itemsByStage = {
      Idea: content.filter(item => item.status === 'Idea').length,
      InProgress: content.filter(item => item.status === 'In Progress').length,
      Ready: content.filter(item => item.status === 'Ready').length,
      Approved: content.filter(item => item.status === 'Approved').length,
      Scheduled: content.filter(item => item.status === 'Scheduled').length,
      Published: content.filter(item => item.status === 'Published').length,
    };
    return {
      total: totalPrep,
      stages: itemsByStage
    };
  }, [content]);

  // 3. Platform Analytics (أرقام التحليلات المختصرة لكل منصة)
  const platformSummaries = useMemo(() => {
    const platforms: Platform[] = ['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'WhatsApp'];
    return platforms.map(plat => {
      // Aggregate from platformAnalytics if exists, fallback to standard mock values
      const platMetrics = platformAnalytics.filter(m => m.platform === plat);
      const reach = platMetrics.reduce((sum, m) => sum + (m.reach || 0), 0) || (plat === 'Facebook' ? 111000 : plat === 'Instagram' ? 192000 : 42000);
      const followers = platMetrics.length > 0 ? (platMetrics[platMetrics.length - 1].followers || 0) : (plat === 'Facebook' ? 8900 : plat === 'Instagram' ? 14500 : 3500);
      const clicks = platMetrics.reduce((sum, m) => sum + (m.linkClicks || 0), 0) || (plat === 'Facebook' ? 4900 : plat === 'Instagram' ? 12000 : 1500);
      return {
        platform: plat,
        reach,
        followers,
        clicks
      };
    });
  }, [platformAnalytics]);

  // Chart dataset for Analytics summary
  const chartData = useMemo(() => {
    return platformSummaries.map(p => ({
      name: isRtl ? PLATFORMS_AR[p.platform] : p.platform,
      [isRtl ? 'الوصول' : 'Reach']: p.reach,
      [isRtl ? 'النقرات' : 'Clicks']: p.clicks,
    }));
  }, [platformSummaries, isRtl]);

  // Competitors & Logs loaded from LocalStorage for dashboard live sync
  const competitorsData = useMemo(() => {
    try {
      const saved = localStorage.getItem('cropsa_competitors_list');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      { id: 'comp-1', name: 'Al-Wadi Modern Farms', nameAr: 'مزارع الوادي الحديثة', platform: 'Facebook' },
      { id: 'comp-2', name: 'Al-Safwa Agritech', nameAr: 'الصفوة للتنمية الزراعية', platform: 'Instagram' },
      { id: 'comp-3', name: 'Sanabel Tayeba Group', nameAr: 'مجموعة سنابل طيبة', platform: 'TikTok' }
    ];
  }, []);

  const logsData = useMemo(() => {
    try {
      const saved = localStorage.getItem('cropsa_competitors_logs');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      { id: 'log-1', competitorId: 'comp-1', platform: 'Facebook', date: '2026-05-24', period: 'weekly', metrics: { 'Followers / المتابعين': 15100, 'Reach / الوصول': 46800 } },
      { id: 'log-4', competitorId: 'comp-2', platform: 'Instagram', date: '2026-05-24', period: 'weekly', metrics: { 'Followers / المتابعين': 19500, 'Reel Views / مشاهدات الريلز': 27500 } },
      { id: 'log-6', competitorId: 'comp-3', platform: 'TikTok', date: '2026-05-24', period: 'weekly', metrics: { 'Followers / المتابعين': 34800, 'Video Views / المشاهدات': 168000 } }
    ];
  }, []);

  const benchmarkStats = useMemo(() => {
    const cropsaFollowers = platformSummaries.reduce((sum, p) => sum + p.followers, 0) || 26900;
    const cropsaReach = platformSummaries.reduce((sum, p) => sum + p.reach, 0) || 345000;
    const cropsaAdjacencyClicks = platformSummaries.reduce((sum, p) => sum + p.clicks, 0) || 18400;

    let totalRivalsFollowers = 0;
    let totalRivalsReach = 0;

    competitorsData.forEach(comp => {
      const compLogs = logsData.filter(l => l.competitorId === comp.id);
      if (compLogs.length > 0) {
        const latest = compLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        totalRivalsFollowers += (latest.metrics?.['Followers / المتابعين'] || 0);
        totalRivalsReach += (latest.metrics?.['Reach / الوصول'] || latest.metrics?.['Reel Views / مشاهدات الريلز'] || latest.metrics?.['Video Views / المشاهدات'] || 0);
      }
    });

    const finalRivalFollowers = totalRivalsFollowers || 69400;
    const finalRivalReach = totalRivalsReach || 242000;

    return {
      cropsaFollowers,
      cropsaReach,
      cropsaClicks: cropsaAdjacencyClicks,
      rivalFollowers: finalRivalFollowers,
      rivalReach: finalRivalReach,
      rivalsCount: competitorsData.length
    };
  }, [platformSummaries, competitorsData, logsData]);

  const getPlatformIcon = (plat: Platform) => {
    const Icon = PLATFORM_ICONS[plat] || Hash;
    switch(plat) {
      case 'Facebook': return <Icon className="text-blue-600" size={18} />;
      case 'Instagram': return <Icon className="text-pink-600" size={18} />;
      case 'LinkedIn': return <Icon className="text-indigo-600" size={18} />;
      case 'TikTok': return <Icon className="text-zinc-900" size={18} />;
      case 'WhatsApp': return <Icon className="text-emerald-500" size={18} />;
      default: return <Icon className="text-gray-400" size={18} />;
    }
  };

  return (
    <div className="space-y-8 min-h-screen p-1 md:p-2" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Upper Welcome and Overview Header */}
      <header className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-green-600 text-white rounded-2xl shadow-lg shadow-green-100/50">
            <LayoutDashboard size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-green-100 text-green-700">
                {isRtl ? 'لوحة القيادة الموحدة' : 'Unified Intelligence Dashboard'}
              </span>
              <span className="text-[10px] font-mono font-bold text-gray-400">• Cropsa v2.1</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-950 tracking-tight mt-1">
              {isRtl ? 'الرصد العام والتحكم المركزي' : 'Cropsa General Command Center'}
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
              {isRtl ? 'مبنية بالكامل استناداً لبيانات التحليلات العميقة، وتحضير المحتوى، وكانبان، والأحداث الزراعية والطقس اليومي' : 'Real-time aggregated summary derived from analytical, preparation, scheduling, events, and weather telemetry'}
            </p>
          </div>
        </div>

        {/* Quick action triggers */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => setIsReportOpen(true)}
            className="px-5 py-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <FileText size={14} className="text-green-500" />
            <span>{isRtl ? 'تقرير المدير التنفيذي (PDF)' : 'Executive CEO Report (PDF)'}</span>
          </button>
          <button 
            onClick={() => setActiveTab('preparation')}
            className="px-5 py-3 bg-green-50 hover:bg-green-100 text-green-700 font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={14} />
            <span>{isRtl ? 'تحضير محتوى جديد' : 'New Post draft'}</span>
          </button>
        </div>
      </header>

      {/* 1. CRITICAL ALERTS: OVERDUE ITEMS (التنبيهات بالحاجات المتأخرة) */}
      <AnimatePresence>
        {overdueItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200/60 p-6 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 text-red-650 rounded-2xl shrink-0 mt-0.5 animate-pulse">
                <BellRing size={22} className="text-red-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-red-150 text-red-700 text-[10px] font-bold rounded-lg leading-none">
                    {isRtl ? 'عرض هام' : 'TIMELINES DELAYED'}
                  </span>
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider font-mono">
                    {overdueItems.length} {isRtl ? 'منشور متأخر عن الموعد' : 'posts overdue'}
                  </span>
                </div>
                <h3 className="text-red-950 font-black text-lg">
                  {isRtl ? 'تنبيه: عناصر تسويقية نشطة متأخرة عن موعد النشر المستهدف!' : 'Timeline Warning: Active marketing items exceed target due dates!'}
                </h3>
                <p className="text-xs text-red-700 font-medium leading-relaxed max-w-4xl">
                  {isRtl 
                    ? 'يوجد عناصر تسويقية لم يتم نشرها وموعد تسليمها النهائي في الماضي. يرجى مراجعة منشورات هذه الفترات على لوحة الكانبان فوراً ونشرها لتجنب خفض ترتيب الصفحات.'
                    : 'Unpublished marketing tasks whose target deadlines occupy the past are detected. Review these items on the Kanban matrix and publish immediately.'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setActiveTab('kanban')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-red-150 shrink-0 cursor-pointer"
            >
              {isRtl ? 'عرض الكانبان للتعديل والحل' : 'Resolve on Kanban'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Multi-Module Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* MODULE A: ANALYTICS OVERVIEW (إحصائيات وتحليلات المنصات) - 2 Columns on desktop */}
        <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm lg:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-black text-blue-500 tracking-widest block font-mono">Manual Performance Metrics</span>
              <h3 className="font-extrabold text-xl text-gray-950 flex items-center gap-2">
                <TrendingUp size={18} className="text-green-600" />
                {isRtl ? 'إحصاءات تحليلات المنصات (إدخال يدوي)' : 'Platform Analytics Overview (Manual Entry)'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {isRtl ? 'تقارير أداء ومعدلات نمو المنصات المُدخلة في سجل التحليلات الحالي' : 'Aggregated numbers for channel reach and audience stats directly from manual ledgers'}
              </p>
            </div>
            
            <button 
              onClick={() => setActiveTab('analytics')}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer self-start"
            >
              <span>{isRtl ? 'تعديل أو إدخال إحصاء' : 'Edit weekly entries'}</span>
              <ChevronRight size={12} className={isRtl ? 'rotate-180' : ''} />
            </button>
          </div>

          {/* Quick numbers bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pt-2">
            {platformSummaries.map(plat => (
              <div key={plat.platform} className="p-4 bg-zinc-50 border border-zinc-150/50 rounded-2xl space-y-2 group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-zinc-900">{isRtl ? PLATFORMS_AR[plat.platform] : plat.platform}</span>
                  {getPlatformIcon(plat.platform)}
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-black text-zinc-805 truncate">
                    {plat.reach > 1000 ? `${(plat.reach/1000).toFixed(1)}K` : plat.reach} {isRtl ? 'وصول' : 'Reach'}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    {plat.followers.toLocaleString()} {isRtl ? 'تابع' : 'follows'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Mini chart representing these parameters */}
          <div className="h-48 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #f3f4f6' }}
                />
                <Bar dataKey={isRtl ? 'الوصول' : 'Reach'} fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey={isRtl ? 'النقرات' : 'Clicks'} fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* MODULE B: CONTENT PREPARATION STATS (تحضير المحتوى - summary) */}
        <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-black text-green-500 tracking-widest block font-mono">Content Stage Funnel</span>
            <h3 className="font-extrabold text-xl text-gray-950 flex items-center gap-2">
              <FileText size={18} className="text-green-600" />
              {isRtl ? 'مسار تحضير المحتوى' : 'Content Preparation Hub'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {isRtl ? 'حالة منشورات كروبسا التسويقية ومراحل مراجعتها واعتمادها شهرياً' : 'Live state of content scheduling, approval and revision pipelines'}
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Stage Items Row 1 */}
            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => setActiveTab('preparation')}
                className="p-4 bg-orange-50/40 hover:bg-orange-50 border border-orange-100 rounded-2xl cursor-pointer transition-all flex items-start gap-3"
              >
                <div className="p-2 bg-orange-100/85 text-orange-700 rounded-xl leading-none">
                  <Sparkles size={14} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase">{isRtl ? 'طروحات وأفكار' : 'Ideas'}</h4>
                  <p className="text-lg font-black text-orange-850 mt-1">{prepStats.stages.Idea}</p>
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('preparation')}
                className="p-4 bg-purple-50/40 hover:bg-purple-50 border border-purple-100 rounded-2xl cursor-pointer transition-all flex items-start gap-3"
              >
                <div className="p-2 bg-purple-100/85 text-purple-700 rounded-xl leading-none">
                  <Clock size={14} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase">{isRtl ? 'قيد الكتابة والتنفيذ' : 'In Progress'}</h4>
                  <p className="text-lg font-black text-purple-850 mt-1">{prepStats.stages.InProgress}</p>
                </div>
              </div>
            </div>

            {/* Stage Items Row 2 */}
            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => setActiveTab('preparation')}
                className="p-4 bg-blue-50/40 hover:bg-blue-50 border border-blue-100 rounded-2xl cursor-pointer transition-all flex items-start gap-3"
              >
                <div className="p-2 bg-blue-100/80 text-blue-700 rounded-xl leading-none">
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase">{isRtl ? 'معتمد وجاهز للنشر' : 'Approved & Ready'}</h4>
                  <p className="text-lg font-black text-blue-800 mt-1">{prepStats.stages.Approved + prepStats.stages.Ready}</p>
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('calendar')}
                className="p-4 bg-green-50/40 hover:bg-green-50 border border-green-100 rounded-2xl cursor-pointer transition-all flex items-start gap-3"
              >
                <div className="p-2 bg-green-100/80 text-green-700 rounded-xl leading-none">
                  <CheckCircle size={14} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase">{isRtl ? 'تم نشره واكتماله' : 'Published'}</h4>
                  <p className="text-lg font-black text-green-800 mt-1">{prepStats.stages.Published}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <button 
              onClick={() => setActiveTab('preparation')}
              className="w-full py-2.5 text-center text-xs font-black text-green-700 bg-green-50 hover:bg-green-100 rounded-xl cursor-pointer transition-all"
            >
              {isRtl ? 'إدارة واعتماد منشورات خطة التحضير' : 'Go to Preparation workspace'}
            </button>
          </div>
        </section>

      </div>

      {/* MODULE: THE EXPECTED (المتوقع - خطة وفلو النشر) */}
      <section className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-[2.5rem] border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-black text-indigo-400 tracking-widest block font-mono">Publishing Outlook & Forecast</span>
            <h3 className="font-extrabold text-xl text-white flex items-center gap-2 mt-1">
              <CalendarIcon size={18} className="text-indigo-400" />
              {isRtl ? 'المتوقع (خطة النشر وقيد التنفيذ)' : 'The Expected (Upcoming Publishing Plan)'}
            </h3>
            <p className="text-xs text-indigo-200/70 mt-1">
              {isRtl 
                ? 'المنشورات المتوقع نشرها قريباً وتحليل خطط النشر المعتمدة لمختلف المنصات' 
                : 'Expected publications going live soon, categorized by internal output vs third-party links.'}
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setActiveTab('calendar')}
            className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 font-extrabold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer self-start"
          >
            <span>{isRtl ? 'فتح صفحة نشر المحتوى' : 'Manage Publishing'}</span>
            <ChevronRight size={12} className={isRtl ? 'rotate-180' : ''} />
          </button>
        </div>

        {/* Expected Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <h4 className="text-[10px] font-bold text-indigo-300 uppercase">{isRtl ? 'إجمالي المتوقع نشره' : 'Total Expected to Publish'}</h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-white">{content.filter(item => item.status !== 'Published' && item.status !== 'Idea').length}</span>
              <span className="text-[10px] text-indigo-300 font-bold">{isRtl ? 'منشور' : 'posts'}</span>
            </div>
            <p className="text-[9px] text-indigo-200/50 mt-1">{isRtl ? 'معاد جدولة/مراجعة' : 'scheduled/review'}</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <h4 className="text-[10px] font-bold text-amber-300 uppercase">{isRtl ? 'داخلي (من كانبان)' : 'Internal (From Kanban)'}</h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-amber-200">{content.filter(item => !item.isExternal && item.status !== 'Published' && item.status !== 'Idea').length}</span>
              <span className="text-[10px] text-amber-300 font-bold">{isRtl ? 'منشور داخلي' : 'posts'}</span>
            </div>
            <p className="text-[9px] text-amber-200/50 mt-1">{isRtl ? 'قيد الموافقة والتجهيز' : 'stage flow'}</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <h4 className="text-[10px] font-bold text-rose-300 uppercase">{isRtl ? 'خارجي (يدوي)' : 'External (Manual Link)'}</h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-rose-200">{content.filter(item => item.isExternal && item.status !== 'Published' && item.status !== 'Idea').length}</span>
              <span className="text-[10px] text-rose-300 font-bold">{isRtl ? 'رابط خارجي' : 'links'}</span>
            </div>
            <p className="text-[9px] text-rose-200/50 mt-1">{isRtl ? 'يتطلب رفع ميريل/نتايج' : 'requires materials'}</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <h4 className="text-[10px] font-bold text-emerald-300 uppercase">{isRtl ? 'منشور في الخطة الأسبوعية' : 'Published This Week'}</h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-emerald-300">{content.filter(item => item.status === 'Published').length}</span>
              <span className="text-[10px] text-emerald-300 font-bold">{isRtl ? 'أنجز' : 'done'}</span>
            </div>
            <p className="text-[9px] text-emerald-200/50 mt-1">{isRtl ? 'ظهر باللون الأخضر' : 'marked in green'}</p>
          </div>
        </div>

        {/* Platforms Expected Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'WhatsApp'].map(plat => {
            const total = content.filter(item => item.platforms.includes(plat as any) && item.status !== 'Published' && item.status !== 'Idea').length;
            const internal = content.filter(item => item.platforms.includes(plat as any) && !item.isExternal && item.status !== 'Published' && item.status !== 'Idea').length;
            const external = content.filter(item => item.platforms.includes(plat as any) && item.isExternal && item.status !== 'Published' && item.status !== 'Idea').length;
            const Icon = PLATFORM_ICONS[plat as Platform];

            return (
              <div key={plat} className="p-3 bg-white/5 rounded-xl flex items-center justify-between border border-white/5 hover:border-indigo-500/35 transition-all">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 bg-white/10 rounded-lg text-white">
                    {Icon ? <Icon size={14} /> : null}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-black text-white">{isRtl ? (PLATFORMS_AR[plat as Platform] || plat) : plat}</p>
                    <p className="text-[9px] text-indigo-300/80 font-semibold">{isRtl ? `${total} متوقع` : `${total} expected`}</p>
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono font-bold text-indigo-200 shrink-0">
                  <span className="text-blue-300" title={isRtl ? 'داخلي' : 'Internal'}>{internal}</span>
                  <span className="text-white/30 mx-1">/</span>
                  <span className="text-rose-300" title={isRtl ? 'خارجي' : 'External'}>{external}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CROPSA VS COMPETITORS LIVE BENCHMARK WIDGET */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50/40 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-4 relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100/50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">
              <Sparkles size={11} className="text-emerald-600 animate-pulse" />
              {isRtl ? 'بوابة الرقابة والذكاء التنافسي' : 'Market Intelligence Benchmarking'}
            </span>
            <h3 className="font-extrabold text-xl text-gray-950 flex items-center gap-2 mt-2">
              <Users size={18} className="text-emerald-600" />
              {isRtl ? 'تحليل ومقارنة الأداء العام مع المنافسين الزراعيين' : 'CROPSA vs Competitors Public Benchmarks'}
            </h3>
            <p className="text-xs font-semibold text-gray-400 mt-1">
              {isRtl 
                ? 'مقارنة فورية لقنوات تواصل كروبسا ضد مزارع المنافسين المرصودين على مستوى المتابعين والوصول والنشاط' 
                : 'Direct high-fidelity telemetry comparing our educational outreach against tracked competitors.'}
            </p>
          </div>

          <button 
            onClick={() => setActiveTab('competitors')}
            className="px-5 py-3 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer self-start"
          >
            <span>{isRtl ? 'مستودع المنافسين وجداول القياس' : 'Open Competitors Hub'}</span>
            <ChevronRight size={13} className={isRtl ? 'rotate-180' : ''} />
          </button>
        </div>

        {/* Quick Horizontal Competitive Net Scorecard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-100/60 p-5 rounded-2xl relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100/80 text-emerald-800 rounded-xl text-xs font-black">
              {benchmarkStats.cropsaReach >= benchmarkStats.rivalReach ? '🏆 ' : '📈 '}
              {benchmarkStats.rivalReach > 0 ? Math.round(((benchmarkStats.cropsaReach - benchmarkStats.rivalReach) / benchmarkStats.rivalReach) * 100) : 42}%
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest leading-none mb-1">{isRtl ? 'حجم التفوق النسبي للوصول' : 'Reach Advantage'}</p>
              <p className="text-xs font-black text-gray-900 leading-none">
                {benchmarkStats.cropsaReach >= benchmarkStats.rivalReach 
                  ? (isRtl ? 'تفوق إيجابي لكروبسا' : 'CROPSA Outperformance')
                  : (isRtl ? 'يتطلب مضاعفة النشر' : 'Requires optimization')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100/80 text-emerald-800 rounded-xl text-xs font-black">
              👑 {benchmarkStats.rivalFollowers > 0 ? Math.round(((benchmarkStats.cropsaFollowers) / benchmarkStats.rivalFollowers) * 100) : 38}%
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest leading-none mb-1">{isRtl ? 'مؤشر تغلغل الجمهور التراكمي' : 'Audience Density'}</p>
              <p className="text-xs font-black text-gray-900 leading-none">
                {isRtl ? 'صدارة تفاعلية ممتازة' : 'High segment lead profile'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-100 text-teal-800 rounded-xl text-[10px] font-black uppercase tracking-wider leading-none">
              {isRtl ? 'الريادة الأولى' : 'Market Leader'}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest leading-none mb-1">{isRtl ? 'المركز التنافسي لكروبسا' : 'Strategic Position'}</p>
              <p className="text-xs font-black text-emerald-700 leading-none">
                {isRtl ? 'تفوق في نطاق الانتشار الإرشادي' : 'Primary outreach dominance'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          
          {/* Column 1: Followers Benchmark */}
          <div className="p-5 bg-zinc-50 border border-zinc-150/50 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-widest">{isRtl ? 'حجم الجمهور والمتابعين' : 'Audience Index'}</span>
              <h4 className="text-sm font-black text-gray-800 mt-1">{isRtl ? 'إجمالي المتابعين لكافة المنصات' : 'Combined Followers Base'}</h4>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-black text-zinc-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {isRtl ? 'كروبسا والمنشورات' : 'CROPSA (Us)'}
                </span>
                <span className="text-sm font-black text-emerald-600 font-mono">{benchmarkStats.cropsaFollowers.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-xs font-black text-zinc-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {isRtl ? 'المنافسون المدمجون' : 'Rivals Combined'}
                </span>
                <span className="text-sm font-black text-amber-600 font-mono">{benchmarkStats.rivalFollowers.toLocaleString()}</span>
              </div>
            </div>

            {/* Progress visually */}
            <div className="space-y-1">
              <div className="h-2.5 w-full bg-gray-100 rounded-full flex overflow-hidden">
                <div className="bg-emerald-500" style={{ width: `${(benchmarkStats.cropsaFollowers / (benchmarkStats.cropsaFollowers + benchmarkStats.rivalFollowers || 1)) * 100}%` }} />
                <div className="bg-amber-400" style={{ width: `${(benchmarkStats.rivalFollowers / (benchmarkStats.cropsaFollowers + benchmarkStats.rivalFollowers || 1)) * 100}%` }} />
              </div>
              <p className="text-[9px] text-gray-450 font-bold block text-center">
                {isRtl 
                  ? `تمثل كروبسا نسبة ${((benchmarkStats.cropsaFollowers / (benchmarkStats.cropsaFollowers + benchmarkStats.rivalFollowers || 1)) * 100).toFixed(0)}% من النطاق الكلي للجمهور`
                  : `Cropsa represents ${((benchmarkStats.cropsaFollowers / (benchmarkStats.cropsaFollowers + benchmarkStats.rivalFollowers || 1)) * 100).toFixed(0)}% of total shared market segment`}
              </p>
            </div>
          </div>

          {/* Column 2: Total Exposure Reach */}
          <div className="p-5 bg-zinc-50 border border-zinc-150/50 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-widest">{isRtl ? 'انتشار الحملات الإرشادية' : 'Outreach Index'}</span>
              <h4 className="text-sm font-black text-gray-800 mt-1">{isRtl ? 'متوسط نطاق الوصول الشهري' : 'Aggregated Monthly Reach'}</h4>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-black text-zinc-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {isRtl ? 'كروبسا (أنت)' : 'CROPSA'}
                </span>
                <span className="text-sm font-black text-emerald-600 font-mono">{benchmarkStats.cropsaReach.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-xs font-black text-zinc-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {isRtl ? 'المنافسون بالوصول المخصص' : 'Rivals Combined'}
                </span>
                <span className="text-sm font-black text-amber-600 font-mono">{benchmarkStats.rivalReach.toLocaleString()}</span>
              </div>
            </div>

            <div className="h-2.5 w-full bg-gray-100 rounded-full flex overflow-hidden">
              <div className="bg-emerald-500" style={{ width: `${(benchmarkStats.cropsaReach / (benchmarkStats.cropsaReach + benchmarkStats.rivalReach || 1)) * 100}%` }} />
              <div className="bg-amber-400" style={{ width: `${(benchmarkStats.rivalReach / (benchmarkStats.cropsaReach + benchmarkStats.rivalReach || 1)) * 100}%` }} />
            </div>

            <p className="text-[10px] text-center text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 p-1.5 rounded-lg">
              {benchmarkStats.cropsaReach >= benchmarkStats.rivalReach 
                ? (isRtl ? 'تفوق في نطاق المشاهدة والانتشار الزراعي! 🎉' : 'We lead in public reach efficiency indices!')
                : (isRtl ? 'تحذير: المنافسون يمتلكون نطاقاً منبسطاً أوسع حالياً' : 'Rival outreach exceeds current baseline target')}
            </p>
          </div>

          {/* Column 3: Strategic Gap insights */}
          <div className="p-5 bg-zinc-900 text-white border border-zinc-850 rounded-2xl flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[9px] uppercase font-black text-emerald-400 block tracking-widest">{isRtl ? 'التوصية والتوجيه التنافسي' : 'Actionable Intel'}</span>
              <h4 className="text-xs font-bold text-zinc-100 mt-1">{isRtl ? 'دليل كروبسا للاستبصار اليومي والحل' : 'Cropsa Competitor Gap Guide'}</h4>
            </div>

            <p className="text-[11px] text-zinc-350 leading-relaxed font-semibold">
              {benchmarkStats.cropsaReach >= benchmarkStats.rivalReach ? (
                isRtl 
                  ? 'رائع! مزارع كروبسا متفوقة بفضل وصولنا الكثيف والمرصود لمجموعات فيسبوك. استمر في نشر الأدلة المصورة ومقاطع ري القمح لتقويض تقدم المنافسين.'
                  : 'Superb! Cropsa reach leads. Continue publishing step-by-step PDF crop guides on Facebook and WhatsApp to fortify positional parameters.'
              ) : (
                isRtl 
                  ? 'يتفوق المنافسون في الوصول التراكمي. نوصي بتجهيز ونشر ٣ مقاطع فيديو ريلز قصيرة أسبوعياً لشرح تفاصيل وقاية البنجر، واجتذاب انتباه المزارعين النشطين.'
                  : 'Rivals exceed reach. We recommend prioritizing 3 high-impact educational video Reels weekly focusing on soil optimization to recapture and tilt segment density.'
              )}
            </p>

            <span className="text-[9px] font-bold text-emerald-400 block uppercase tracking-widest text-center mt-1 border-t border-zinc-800 pt-2 font-mono">
              {isRtl ? `عدد المنافسين النشطين: ${benchmarkStats.rivalsCount}` : `Active Tracked Rivals: ${benchmarkStats.rivalsCount}`}
            </span>
          </div>

        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* MODULE C: KANBAN URGENT TASKS SHORTCUT (لوحة الكانبان بقائمة الأشياء القادمة) */}
        <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-gray-950 flex items-center gap-2">
              <Trello size={18} className="text-green-600" />
              {isRtl ? 'الأولويات وجدول المهام (كانبان)' : 'Urgent Kanban Priorities'}
            </h3>
            
            <button 
              onClick={() => setActiveTab('kanban')}
              className="text-[11px] font-black text-green-700 hover:text-green-800 flex items-center gap-0.5 cursor-pointer"
            >
              <span>{isRtl ? 'عرض اللوحة' : 'View full'}</span>
              <ChevronRight size={12} className={isRtl ? 'rotate-180' : ''} />
            </button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {content.filter(item => item.status !== 'Published').slice(0, 4).map((item) => (
              <div 
                key={item.id}
                onClick={() => setActiveTab('kanban')}
                className="p-3.5 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-150/40 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-3 "
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                      item.priority === 'High' ? 'bg-red-50 text-red-650' : 'bg-gray-100 text-gray-600'
                    )}>
                      {item.priority}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400">
                      {item.platforms.join(', ')}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-gray-950 truncate max-w-[200px]">{item.title}</h4>
                </div>
                
                <span className={cn(
                  "text-[9px] font-extrabold px-2 py-0.5 rounded-lg border",
                  item.status === 'Ready' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                  item.status === 'In Progress' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                  'bg-gray-50 border-gray-150 text-gray-500'
                )}>
                  {item.status}
                </span>
              </div>
            ))}
            {content.filter(item => item.status !== 'Published').length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-8">{isRtl ? 'لا متبقي تحت التنفيذ حالياً.' : 'Hooray, no active tasks.'}</p>
            )}
          </div>
        </section>

        {/* MODULE D: UPCOMING AGRICULTURAL EVENTS (المناسبات الزراعية) */}
        <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-gray-950 flex items-center gap-2">
              <CalendarIcon size={18} className="text-green-600" />
              {isRtl ? 'أقرب المناسبات الزراعية الوطنية' : 'Upcoming Agricultural Events'}
            </h3>
            
            <button 
              onClick={() => setActiveTab('events')}
              className="text-[11px] font-black text-green-700 hover:text-green-800 flex items-center gap-0.5 cursor-pointer"
            >
              <span>{isRtl ? 'عرض الكل' : 'View all'}</span>
              <ChevronRight size={12} className={isRtl ? 'rotate-180' : ''} />
            </button>
          </div>

          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-0.5">
            {events.slice(0, 3).map((ev) => (
              <div key={ev.id} className="p-4 bg-green-50/30 border border-green-100/50 rounded-2xl flex items-start gap-4">
                <div className="p-2.5 bg-green-100 text-green-700 rounded-xl leading-none font-black text-center min-w-[50px] shrink-0">
                  <span className="text-[10px] block font-mono uppercase text-green-600">{new Date(ev.date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'short' })}</span>
                  <span className="text-base block font-bold font-sans mt-0.5">{new Date(ev.date).getDate()}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black bg-white border border-green-200 text-green-700 px-1.5 py-0.5 rounded uppercase">
                      {ev.category === 'Agricultural' ? (isRtl ? 'زراعي رسمي' : 'Agricultural') : (isRtl ? 'عيد وطني' : 'National')}
                    </span>
                    {ev.importance === 'High' && (
                      <span className="text-[9px] font-black bg-red-50 text-red-650 px-1.5 py-0.5 rounded uppercase">
                        {isRtl ? 'هام جداً' : 'Urgent'}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black text-gray-950">{ev.title}</h4>
                  <p className="text-[10px] leading-relaxed text-gray-500 font-medium line-clamp-2">{ev.description}</p>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-8">{isRtl ? 'لا توجد مناسبات زراعية مسجلة حالياً.' : 'No items.'}</p>
            )}
          </div>
        </section>

        {/* MODULE E: AGRICULTURAL WEATHER ALERTS (الطقس الزراعي) */}
        <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-gray-950 flex items-center gap-2">
              <CloudSun size={18} className="text-green-600" />
              {isRtl ? 'رصد الطقس الزراعي المؤثر' : 'Agri-Weather Monitoring'}
            </h3>
            
            <button 
              onClick={() => setActiveTab('weather')}
              className="text-[11px] font-black text-green-700 hover:text-green-800 flex items-center gap-0.5"
            >
              <span>{isRtl ? 'التوقعات الزراعية' : 'Detailed advice'}</span>
              <ChevronRight size={12} className={isRtl ? 'rotate-180' : ''} />
            </button>
          </div>

          <div className="space-y-3.5">
            {WEATHER_MOCK.map((item) => (
              <div 
                key={item.governorate}
                className="p-3.5 bg-gradient-to-tr from-zinc-50/50 to-white/90 border border-zinc-150/40 rounded-2xl flex items-start gap-3.5 shadow-sm"
              >
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl flex flex-col items-center justify-center shrink-0 min-w-[50px]">
                  <Sun size={18} />
                  <span className="text-xs font-black mt-1 font-mono">{item.temp}°C</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-zinc-900">{isRtl ? item.governorateAr : item.governorate}</span>
                    <span className="text-[9px] font-bold text-gray-400">{isRtl ? 'مستقر' : 'Sunny & Stable'}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-amber-800 font-bold bg-amber-50/40 border border-amber-100/50 p-2 rounded-xl mt-1">
                    {isRtl ? item.adviceAr : item.adviceEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      <ExecutiveReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        lang={lang}
        content={content}
        users={users}
      />

    </div>
  );
};
