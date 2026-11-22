import React, { useState, useMemo } from 'react';
import { 
  CalendarClock, 
  AlertCircle, 
  Clock, 
  CalendarDays, 
  Search, 
  X, 
  Filter, 
  ArrowUpDown, 
  User as UserIcon, 
  CheckSquare, 
  ExternalLink,
  ChevronDown,
  Facebook,
  Instagram,
  Linkedin,
  Video,
  MessageCircle,
  Hash,
  Layers,
  Sparkles,
  Plus
} from 'lucide-react';
import { ContentItem, Language, KanbanStage, User, Platform, Priority } from '../types';
import { cn } from '../lib/utils';

interface KanbanAgendaProps {
  lang: Language;
  content: ContentItem[];
  stages: KanbanStage[];
  users?: User[];
  onOpenDetail: (id: string) => void;
  onNewContent?: () => void;
}

type TimeframeFilter = 'all' | 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'upcoming' | 'no_date';

const PLATFORM_ICONS: Record<Platform, any> = {
  'Facebook': Facebook,
  'Instagram': Instagram,
  'LinkedIn': Linkedin,
  'TikTok': Video,
  'WhatsApp': MessageCircle,
  'Other': Hash,
};

export const KanbanAgenda: React.FC<KanbanAgendaProps> = ({
  lang,
  content,
  stages,
  users = [],
  onOpenDetail,
  onNewContent
}) => {
  const isRtl = lang === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageId, setSelectedStageId] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<TimeframeFilter>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showNoDateGroup, setShowNoDateGroup] = useState<boolean>(true);

  // Parse YYYY-MM-DD or ISO string safely
  const parseDueDate = (dateStr?: string): Date | null => {
    if (!dateStr || !dateStr.trim()) return null;
    const clean = dateStr.trim().split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
    const dt = new Date(dateStr);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const now = new Date();
  const today = useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()), []);

  const getDaysDifference = (targetDate: Date): number => {
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const diffMs = target.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  // Build unique assignees list
  const allAssignees = useMemo(() => {
    const set = new Set<string>();
    users.forEach(u => u.name && set.add(u.name));
    content.forEach(c => {
      if (Array.isArray(c.assignedTo)) {
        c.assignedTo.forEach(a => a && set.add(a));
      }
    });
    return Array.from(set).sort();
  }, [users, content]);

  // Enrich items with deadline calculations
  const enrichedItems = useMemo(() => {
    return content.map(item => {
      const parsedDate = parseDueDate(item.dueDate);
      const diffDays = parsedDate ? getDaysDifference(parsedDate) : null;

      let category: TimeframeFilter = 'no_date';
      if (diffDays !== null) {
        if (diffDays < 0) {
          category = 'overdue';
        } else if (diffDays === 0) {
          category = 'today';
        } else if (diffDays === 1) {
          category = 'tomorrow';
        } else if (diffDays >= 2 && diffDays <= 7) {
          category = 'this_week';
        } else {
          category = 'upcoming';
        }
      }

      const stage = stages.find(s => s.id === item.stageId || (!item.stageId && s.status === item.status));
      const stageName = isRtl ? (stage?.nameAr || stage?.name || item.status) : (stage?.name || item.status);
      const stageColor = stage?.color || '#94A3B8';

      return {
        ...item,
        parsedDate,
        diffDays,
        category,
        stageName,
        stageColor
      };
    });
  }, [content, stages, isRtl, today]);

  // Global counts for metrics cards
  const counts = useMemo(() => {
    const overdue = enrichedItems.filter(i => i.category === 'overdue').length;
    const todayCount = enrichedItems.filter(i => i.category === 'today').length;
    const tomorrowCount = enrichedItems.filter(i => i.category === 'tomorrow').length;
    const thisWeek = enrichedItems.filter(i => i.category === 'this_week').length;
    const upcoming = enrichedItems.filter(i => i.category === 'upcoming').length;
    const totalScheduled = enrichedItems.filter(i => i.diffDays !== null).length;
    const noDate = enrichedItems.filter(i => i.category === 'no_date').length;

    return {
      overdue,
      today: todayCount,
      tomorrow: tomorrowCount,
      thisWeek,
      upcoming,
      totalScheduled,
      noDate
    };
  }, [enrichedItems]);

  // Filter & search items
  const filteredItems = useMemo(() => {
    return enrichedItems.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const descMatch = (item.description || item.caption || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch) return false;
      }

      // Stage
      if (selectedStageId !== 'all') {
        const itemStageId = item.stageId || stages.find(s => s.status === item.status)?.id;
        if (itemStageId !== selectedStageId) return false;
      }

      // Assignee
      if (selectedAssignee !== 'all') {
        if (!item.assignedTo || !item.assignedTo.includes(selectedAssignee)) return false;
      }

      // Timeframe
      if (timeframeFilter !== 'all') {
        if (timeframeFilter === 'this_week') {
          if (item.category !== 'this_week' && item.category !== 'today' && item.category !== 'tomorrow') {
            return false;
          }
        } else if (item.category !== timeframeFilter) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Items with no dates go to the bottom
      if (!a.parsedDate && !b.parsedDate) return 0;
      if (!a.parsedDate) return 1;
      if (!b.parsedDate) return -1;

      const timeA = a.parsedDate.getTime();
      const timeB = b.parsedDate.getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [enrichedItems, searchQuery, selectedStageId, selectedAssignee, timeframeFilter, sortOrder, stages]);

  // Relative deadline badge helper
  const renderRelativeBadge = (diffDays: number | null) => {
    if (diffDays === null) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
          {isRtl ? 'بدون موعد' : 'No Deadline'}
        </span>
      );
    }

    if (diffDays < 0) {
      const days = Math.abs(diffDays);
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-sm animate-pulse">
          <AlertCircle size={14} className="shrink-0 text-rose-600" />
          {isRtl ? (days === 1 ? 'فات الموعد أمس' : `متأخر بـ ${days} أيام`) : (days === 1 ? 'Overdue by 1 day' : `Overdue by ${days} days`)}
        </span>
      );
    }

    if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-50 text-amber-800 border border-amber-300 shadow-sm">
          <Clock size={14} className="shrink-0 text-amber-600" />
          {isRtl ? 'يستحق اليوم!' : 'Due Today!'}
        </span>
      );
    }

    if (diffDays === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">
          <Clock size={14} className="shrink-0 text-yellow-600" />
          {isRtl ? 'يستحق غداً' : 'Due Tomorrow'}
        </span>
      );
    }

    if (diffDays <= 7) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CalendarDays size={14} className="shrink-0 text-emerald-600" />
          {isRtl ? `متبقي ${diffDays} أيام` : `${diffDays} days left`}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
        <CalendarDays size={14} className="shrink-0 text-blue-600" />
        {isRtl ? `متبقي ${diffDays} يوم` : `${diffDays} days left`}
      </span>
    );
  };

  // Group items if showing 'all'
  const groupedSections = useMemo(() => {
    if (timeframeFilter !== 'all') {
      return [
        {
          key: timeframeFilter,
          title: isRtl ? 'المحتويات المحددة' : 'Selected Content',
          badgeClass: 'bg-emerald-100 text-emerald-800',
          items: filteredItems
        }
      ];
    }

    const sections = [];

    const overdueItems = filteredItems.filter(i => i.category === 'overdue');
    if (overdueItems.length > 0) {
      sections.push({
        key: 'overdue',
        title: isRtl ? '🚨 متأخرة عن موعد التسليم' : '🚨 Overdue Deadlines',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        cardBorder: 'border-r-4 border-r-rose-500',
        items: overdueItems
      });
    }

    const todayItems = filteredItems.filter(i => i.category === 'today');
    if (todayItems.length > 0) {
      sections.push({
        key: 'today',
        title: isRtl ? '⏰ مستحقة اليوم' : '⏰ Due Today',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        cardBorder: 'border-r-4 border-r-amber-500',
        items: todayItems
      });
    }

    const tomorrowItems = filteredItems.filter(i => i.category === 'tomorrow');
    if (tomorrowItems.length > 0) {
      sections.push({
        key: 'tomorrow',
        title: isRtl ? '⏳ مستحقة غداً' : '⏳ Due Tomorrow',
        badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        cardBorder: 'border-r-4 border-r-yellow-500',
        items: tomorrowItems
      });
    }

    const thisWeekItems = filteredItems.filter(i => i.category === 'this_week');
    if (thisWeekItems.length > 0) {
      sections.push({
        key: 'this_week',
        title: isRtl ? '📅 مستحقة هذا الأسبوع' : '📅 Due This Week',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        cardBorder: 'border-r-4 border-r-emerald-500',
        items: thisWeekItems
      });
    }

    const upcomingItems = filteredItems.filter(i => i.category === 'upcoming');
    if (upcomingItems.length > 0) {
      sections.push({
        key: 'upcoming',
        title: isRtl ? '🗓️ مواعيد قادمة' : '🗓️ Upcoming Deadlines',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        cardBorder: 'border-r-4 border-r-blue-500',
        items: upcomingItems
      });
    }

    const noDateItems = filteredItems.filter(i => i.category === 'no_date');
    if (noDateItems.length > 0) {
      sections.push({
        key: 'no_date',
        title: isRtl ? '📋 بدون موعد تسليم محدد' : '📋 No Deadline Specified',
        badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
        cardBorder: 'border-r-4 border-r-gray-300',
        items: noDateItems,
        isCollapsible: true
      });
    }

    return sections;
  }, [filteredItems, timeframeFilter, isRtl]);

  return (
    <div className="flex-1 flex flex-col space-y-6 overflow-y-auto custom-scrollbar pb-10" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Overdue */}
        <button
          onClick={() => setTimeframeFilter(timeframeFilter === 'overdue' ? 'all' : 'overdue')}
          className={cn(
            "p-4 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer",
            timeframeFilter === 'overdue'
              ? "bg-rose-50 border-rose-300 shadow-md ring-2 ring-rose-400"
              : "bg-white border-gray-100 hover:border-rose-200 hover:shadow-sm"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">{isRtl ? 'متأخرة عن الموعد' : 'Overdue'}</span>
            <span className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center",
              counts.overdue > 0 ? "bg-rose-100 text-rose-600" : "bg-gray-100 text-gray-400"
            )}>
              <AlertCircle size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={cn("text-2xl font-black", counts.overdue > 0 ? "text-rose-600" : "text-gray-900")}>
              {counts.overdue}
            </span>
            <span className="text-[10px] text-gray-400 font-bold">{isRtl ? 'محتوى متأخر' : 'items'}</span>
          </div>
        </button>

        {/* Today */}
        <button
          onClick={() => setTimeframeFilter(timeframeFilter === 'today' ? 'all' : 'today')}
          className={cn(
            "p-4 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer",
            timeframeFilter === 'today'
              ? "bg-amber-50 border-amber-300 shadow-md ring-2 ring-amber-400"
              : "bg-white border-gray-100 hover:border-amber-200 hover:shadow-sm"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">{isRtl ? 'مستحقة اليوم' : 'Due Today'}</span>
            <span className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center",
              counts.today > 0 ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400"
            )}>
              <Clock size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={cn("text-2xl font-black", counts.today > 0 ? "text-amber-600" : "text-gray-900")}>
              {counts.today}
            </span>
            <span className="text-[10px] text-gray-400 font-bold">{isRtl ? 'محتوى اليوم' : 'items'}</span>
          </div>
        </button>

        {/* This Week */}
        <button
          onClick={() => setTimeframeFilter(timeframeFilter === 'this_week' ? 'all' : 'this_week')}
          className={cn(
            "p-4 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer",
            timeframeFilter === 'this_week'
              ? "bg-emerald-50 border-emerald-300 shadow-md ring-2 ring-emerald-400"
              : "bg-white border-gray-100 hover:border-emerald-200 hover:shadow-sm"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">{isRtl ? 'خلال الأسبوع' : 'This Week'}</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CalendarClock size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">
              {counts.today + counts.tomorrow + counts.thisWeek}
            </span>
            <span className="text-[10px] text-gray-400 font-bold">{isRtl ? 'محتوى هذا الأسبوع' : 'items'}</span>
          </div>
        </button>

        {/* Total Scheduled */}
        <button
          onClick={() => setTimeframeFilter('all')}
          className={cn(
            "p-4 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer",
            timeframeFilter === 'all'
              ? "bg-blue-50 border-blue-300 shadow-md ring-2 ring-blue-400"
              : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">{isRtl ? 'إجمالي المواعيد' : 'Total Tracked'}</span>
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <CalendarDays size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700">
              {counts.totalScheduled}
            </span>
            <span className="text-[10px] text-gray-400 font-bold">
              {isRtl ? `من إجمالي ${content.length}` : `of ${content.length}`}
            </span>
          </div>
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'البحث عن عنوان أو تفاصيل المحتوى...' : 'Search content title or details...'}
              className="w-full pr-10 pl-9 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold focus:bg-white focus:border-green-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stage Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 text-xs font-bold">
              <Layers size={14} className="text-gray-400 shrink-0" />
              <select
                value={selectedStageId}
                onChange={(e) => setSelectedStageId(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none cursor-pointer"
              >
                <option value="all">{isRtl ? 'جميع المراحل' : 'All Stages'}</option>
                {stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    {isRtl ? (st.nameAr || st.name) : st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 text-xs font-bold">
              <UserIcon size={14} className="text-gray-400 shrink-0" />
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none cursor-pointer"
              >
                <option value="all">{isRtl ? 'جميع المسؤولين' : 'All Assignees'}</option>
                {allAssignees.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
              title={isRtl ? 'تبديل ترتيب المواعيد' : 'Toggle deadline sort'}
            >
              <ArrowUpDown size={14} className="text-gray-500" />
              <span>{sortOrder === 'asc' ? (isRtl ? 'الأقرب أولاً' : 'Earliest First') : (isRtl ? 'الأبعد أولاً' : 'Latest First')}</span>
            </button>
          </div>
        </div>

        {/* Timeframe Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {[
            { id: 'all', label: isRtl ? 'الكل' : 'All', count: filteredItems.length },
            { id: 'overdue', label: isRtl ? 'متأخرة' : 'Overdue', count: counts.overdue, danger: counts.overdue > 0 },
            { id: 'today', label: isRtl ? 'اليوم' : 'Today', count: counts.today },
            { id: 'tomorrow', label: isRtl ? 'غداً' : 'Tomorrow', count: counts.tomorrow },
            { id: 'this_week', label: isRtl ? 'هذا الأسبوع' : 'This Week', count: counts.thisWeek },
            { id: 'upcoming', label: isRtl ? 'قادمة' : 'Upcoming', count: counts.upcoming },
            { id: 'no_date', label: isRtl ? 'بدون موعد' : 'No Date', count: counts.noDate },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframeFilter(tf.id as TimeframeFilter)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer",
                timeframeFilter === tf.id
                  ? (tf.danger ? "bg-rose-600 text-white shadow-sm" : "bg-emerald-600 text-white shadow-sm")
                  : (tf.danger ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200")
              )}
            >
              <span>{tf.label}</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                timeframeFilter === tf.id ? "bg-white/30 text-white" : "bg-gray-200 text-gray-700"
              )}>
                {tf.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Groups */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CalendarClock size={32} />
          </div>
          <h4 className="text-base font-black text-gray-800">
            {isRtl ? 'لا توجد محتويات مطابقة للشروط' : 'No matching content deadlines'}
          </h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {isRtl 
              ? 'جرّب تغيير خيارات البحث أو تصفية المواعيد لعرض محتويات كانبان الأخرى.' 
              : 'Try clearing search or filters to see other Kanban content items.'}
          </p>
          {(searchQuery || selectedStageId !== 'all' || selectedAssignee !== 'all' || timeframeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStageId('all');
                setSelectedAssignee('all');
                setTimeframeFilter('all');
              }}
              className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-200 transition-all cursor-pointer"
            >
              {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedSections.map((section) => (
            <div key={section.key} className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                    {section.title}
                  </h3>
                  <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-black border", section.badgeClass)}>
                    {section.items.length}
                  </span>
                </div>

                {section.isCollapsible && (
                  <button
                    onClick={() => setShowNoDateGroup(prev => !prev)}
                    className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showNoDateGroup ? (isRtl ? 'طي' : 'Collapse') : (isRtl ? 'توسيع' : 'Expand')}</span>
                    <ChevronDown size={14} className={cn("transition-transform", showNoDateGroup && "rotate-180")} />
                  </button>
                )}
              </div>

              {/* Cards Grid */}
              {(!section.isCollapsible || showNoDateGroup) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.items.map((item) => {
                    const completedTasks = (item.tasks || []).filter(t => t.completed).length;
                    const totalTasks = (item.tasks || []).length;

                    return (
                      <div
                        key={item.id}
                        onClick={() => onOpenDetail(item.id)}
                        className={cn(
                          "bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden",
                          section.cardBorder
                        )}
                      >
                        <div>
                          {/* Top Meta Bar */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            {/* Platform Icons */}
                            <div className="flex items-center gap-1">
                              {(item.platforms || []).map((p) => {
                                const Icon = PLATFORM_ICONS[p] || Hash;
                                return (
                                  <div
                                    key={p}
                                    title={p}
                                    className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:text-green-700 transition-colors"
                                  >
                                    <Icon size={12} />
                                  </div>
                                );
                              })}
                              {item.type && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                                  {item.type}
                                </span>
                              )}
                            </div>

                            {/* Stage Badge */}
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-gray-50 border border-gray-100">
                              <span 
                                className="w-2 h-2 rounded-full shrink-0" 
                                style={{ backgroundColor: item.stageColor }} 
                              />
                              <span className="text-gray-700 truncate max-w-[90px]">{item.stageName}</span>
                            </div>
                          </div>

                          {/* Title */}
                          <h4 className="text-sm font-black text-gray-900 group-hover:text-green-700 transition-colors line-clamp-2 mb-2">
                            {item.title}
                          </h4>

                          {/* Description excerpt if present */}
                          {(item.description || item.caption) && (
                            <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                              {item.description || item.caption}
                            </p>
                          )}
                        </div>

                        {/* Deadline Box & Details */}
                        <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                          {/* Deadline Date & Urgency Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-black text-gray-700">
                              <Clock size={14} className="text-gray-400 shrink-0" />
                              <span className="font-mono">
                                {item.dueDate ? item.dueDate.split('T')[0] : (isRtl ? 'غير محدد' : 'Not set')}
                              </span>
                            </div>
                            {renderRelativeBadge(item.diffDays)}
                          </div>

                          {/* Assignees & Tasks summary */}
                          <div className="flex items-center justify-between gap-2 pt-1">
                            {/* Assignee Avatars */}
                            <div className="flex items-center -space-x-1.5 overflow-hidden">
                              {(item.assignedTo && item.assignedTo.length > 0) ? (
                                item.assignedTo.map((person, idx) => (
                                  <div
                                    key={idx}
                                    title={person}
                                    className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 border-2 border-white flex items-center justify-center text-[9px] font-black shadow-xs"
                                  >
                                    {person[0]}
                                  </div>
                                ))
                              ) : (
                                <span className="text-[10px] text-gray-400 font-bold">
                                  {isRtl ? 'غير مكلف لأحد' : 'Unassigned'}
                                </span>
                              )}
                            </div>

                            {/* Tasks indicator */}
                            {totalTasks > 0 && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                                <CheckSquare size={11} className={completedTasks === totalTasks ? "text-green-600" : "text-gray-400"} />
                                <span>{completedTasks}/{totalTasks}</span>
                              </div>
                            )}

                            {/* Open button */}
                            <span className="text-[10px] font-black text-emerald-600 group-hover:underline flex items-center gap-1">
                              {isRtl ? 'التفاصيل' : 'Details'}
                              <ExternalLink size={10} />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
