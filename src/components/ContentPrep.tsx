import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter, 
  Download,
  Plus,
  Search,
  CheckCircle,
  MoreHorizontal,
  LayoutGrid,
  List,
  Facebook,
  Instagram,
  Linkedin,
  Video,
  MessageCircle,
  Hash,
  Send,
  Calendar,
  User,
  AlertCircle,
  Lock,
  FileSpreadsheet
} from 'lucide-react';
import { translations } from '../translations';
import { ContentItem, Language, ApprovalStage, Priority, Platform, User as AppUser } from '../types';
import { cn } from '../lib/utils';
import { exportContentToCSV, exportContentToJSON } from '../lib/exportUtils';
import { showToast } from './Toast';

interface ContentPrepProps {
  lang: Language;
  content: ContentItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onMoveToKanban: (id: string, publishDate: string) => void;
  onNewContent: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  currentUser?: AppUser | null;
}

export const ContentPrep: React.FC<ContentPrepProps> = ({ 
  lang, 
  content, 
  onApprove, 
  onReject, 
  onMoveToKanban, 
  onNewContent,
  onEdit,
  onDelete,
  currentUser
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const renderTextWithLinks = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const parts = text.split(urlRegex);
    return (
      <>
        {parts.map((part, idx) => {
          if (urlRegex.test(part)) {
            const href = part.startsWith('http') ? part : `https://${part}`;
            return (
              <a 
                key={idx} 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-green-600 hover:text-green-850 underline hover:no-underline font-extrabold transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </a>
            );
          }
          return part;
        })}
      </>
    );
  };

  const userPermissions = currentUser?.permissions || (currentUser?.role === 'Admin' ? ['all'] : ['view']);
  const canCreate = userPermissions.includes('all') || userPermissions.includes('create') || currentUser?.role === 'Admin';
  const canApprove = userPermissions.includes('all') || userPermissions.includes('approve') || currentUser?.role === 'Admin';
  const canEdit = userPermissions.includes('all') || userPermissions.includes('edit') || currentUser?.role === 'Admin';

  const [view, setView] = useState<'table' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [objectiveFilter, setObjectiveFilter] = useState<string>('All');
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [weekFilter, setWeekFilter] = useState<string>('All');
  const [schedulingItem, setSchedulingItem] = useState<string | null>(null);
  const [publishDate, setPublishDate] = useState('');

  const OBJECTIVES = ['All', 'Trust', 'Clinic', 'Service', 'Education', 'Engagement', 'Sales'];

  const filteredContent = content.filter(item => {
    // Only show items that are not yet in Kanban (Scheduled, Published, Delayed)
    const isInKanban = ['Scheduled', 'Published', 'Delayed'].includes(item.status);
    if (isInKanban) return false;

    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.caption && item.caption.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Objective filter
    const matchesObjective = objectiveFilter === 'All' || item.objective === objectiveFilter;
    
    // Platform filter
    const matchesPlatform = platformFilter === 'All' || item.platforms.includes(platformFilter as any);
    
    // Week filter
    const matchesWeek = weekFilter === 'All' || (item.week || 'Week 1') === weekFilter;

    return matchesSearch && matchesObjective && matchesPlatform && matchesWeek;
  });

  const groupedByWeek = useMemo(() => {
    const groups: Record<string, ContentItem[]> = {};
    const weeksToInclude = weekFilter === 'All' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'] : [weekFilter];
    
    weeksToInclude.forEach(w => {
      groups[w] = [];
    });

    filteredContent.forEach(item => {
      const week = item.week || 'Week 1';
      if (groups[week]) {
        groups[week].push(item);
      } else if (weekFilter === 'All') {
        groups[week] = [item];
      }
    });

    return groups;
  }, [filteredContent, weekFilter]);

  const getPlatformIcon = (p: Platform) => {
    switch (p) {
      case 'Facebook': return <Facebook size={14} className="text-blue-600" />;
      case 'Instagram': return <Instagram size={14} className="text-pink-600" />;
      case 'LinkedIn': return <Linkedin size={14} className="text-indigo-600" />;
      case 'TikTok': return <Video size={14} className="text-gray-900" />;
      case 'WhatsApp': return <MessageCircle size={14} className="text-green-600" />;
      default: return <Hash size={14} className="text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Normal': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Low': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t.preparation}</h2>
          <p className="text-sm text-gray-500 font-medium">
            {isRtl ? 'إدارة وتحضير المحتوى قبل النشر' : 'Manage and prepare content before publishing'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
            <button 
              onClick={() => setView('grid')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                view === 'grid' ? "bg-green-600 text-white shadow-lg shadow-green-100" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <LayoutGrid size={16} />
              {isRtl ? 'شبكة' : 'Grid'}
            </button>
            <button 
              onClick={() => setView('table')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                view === 'table' ? "bg-green-600 text-white shadow-lg shadow-green-100" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <List size={16} />
              {isRtl ? 'جدول' : 'Table'}
            </button>
          </div>

          {/* Export to Meta / CSV */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                exportContentToCSV(filteredContent, `cropsa-schedule-${Date.now()}.csv`);
                showToast(isRtl ? 'تم تصدير الجدول بصيغة CSV المتوافقة مع Meta و Excel!' : 'Exported schedule to CSV (Meta & Excel)!', 'success');
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              title={isRtl ? 'تصدير لجدولة Meta أو إكسيل' : 'Export to Meta CSV / Excel'}
            >
              <FileSpreadsheet size={16} className="text-emerald-600" />
              <span>{isRtl ? 'تصدير (Meta / CSV)' : 'Export CSV'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                exportContentToJSON(filteredContent, `cropsa-backup-${Date.now()}.json`);
                showToast(isRtl ? 'تم تصدير النسخة الاحتياطية JSON بنجاح!' : 'Exported JSON backup!', 'info');
              }}
              className="p-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-900 rounded-2xl transition-all shadow-sm cursor-pointer"
              title={isRtl ? 'نسخة احتياطية JSON' : 'JSON Backup'}
            >
              <Download size={16} />
            </button>
          </div>

          {canCreate && (
            <button 
              onClick={onNewContent}
              className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-2xl text-sm font-bold hover:bg-green-700 transition-all shadow-xl shadow-green-100"
            >
              <Plus size={20} />
              {t.newContent}
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col xl:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400", isRtl ? "right-4" : "left-4")} size={20} />
          <input 
            type="text" 
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm font-medium shadow-sm",
              isRtl ? "pr-12 pl-4" : "pl-12 pr-4"
            )}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Objective Filter */}
          <div className="flex-1 min-w-[150px] xl:flex-none flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-1 shadow-sm">
            <Filter size={18} className="text-gray-400 shrink-0" />
            <select 
              value={objectiveFilter}
              onChange={(e) => setObjectiveFilter(e.target.value)}
              className="w-full py-2.5 bg-transparent text-sm font-bold text-gray-600 outline-none cursor-pointer"
            >
              {OBJECTIVES.map(obj => (
                <option key={obj} value={obj}>
                  {obj === 'All' ? (isRtl ? 'كل الأهداف' : 'All Objectives') : obj}
                </option>
              ))}
            </select>
          </div>

          {/* Platform Filter */}
          <div className="flex-1 min-w-[150px] xl:flex-none flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-1 shadow-sm">
            <Filter size={18} className="text-gray-400 shrink-0" />
            <select 
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full py-2.5 bg-transparent text-sm font-bold text-gray-600 outline-none cursor-pointer"
            >
              <option value="All">{isRtl ? 'كل المنصات' : 'All Platforms'}</option>
              <option value="Facebook">{isRtl ? 'فيسبوك' : 'Facebook'}</option>
              <option value="Instagram">{isRtl ? 'إنستغرام' : 'Instagram'}</option>
              <option value="LinkedIn">{isRtl ? 'لينكد إن' : 'LinkedIn'}</option>
              <option value="TikTok">{isRtl ? 'تيك توك' : 'TikTok'}</option>
              <option value="WhatsApp">{isRtl ? 'واتساب' : 'WhatsApp'}</option>
            </select>
          </div>

          {/* Week Filter */}
          <div className="flex-1 min-w-[150px] xl:flex-none flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-1 shadow-sm">
            <Filter size={18} className="text-gray-400 shrink-0" />
            <select 
              value={weekFilter}
              onChange={(e) => setWeekFilter(e.target.value)}
              className="w-full py-2.5 bg-transparent text-sm font-bold text-gray-600 outline-none cursor-pointer"
            >
              <option value="All">{isRtl ? 'كل الأسابيع' : 'All Weeks'}</option>
              <option value="Week 1">{isRtl ? 'الأسبوع 1' : 'Week 1'}</option>
              <option value="Week 2">{isRtl ? 'الأسبوع 2' : 'Week 2'}</option>
              <option value="Week 3">{isRtl ? 'الأسبوع 3' : 'Week 3'}</option>
              <option value="Week 4">{isRtl ? 'الأسبوع 4' : 'Week 4'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Display */}
      <AnimatePresence mode="wait">
        {view === 'grid' ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-12"
          >
            {(Object.entries(groupedByWeek) as [string, ContentItem[]][]).map(([week, items], index) => (
              <div key={week} className="space-y-6 relative">
                <div className={cn(
                  "flex items-center gap-4 p-6 rounded-[2rem] border transition-all",
                  index === 0 ? "bg-green-50 border-green-100" :
                  index === 1 ? "bg-blue-50 border-blue-100" :
                  index === 2 ? "bg-purple-50 border-purple-100" :
                  "bg-orange-50 border-orange-100"
                )}>
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border",
                    index === 0 ? "bg-white text-green-600 border-green-200" :
                    index === 1 ? "bg-white text-blue-600 border-blue-200" :
                    index === 2 ? "bg-white text-purple-600 border-purple-200" :
                    "bg-white text-orange-600 border-orange-200"
                  )}>
                    <Calendar size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">{isRtl ? week.replace('Week', 'الأسبوع') : week}</h3>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        index === 0 ? "bg-green-600 text-white" :
                        index === 1 ? "bg-blue-600 text-white" :
                        index === 2 ? "bg-purple-600 text-white" :
                        "bg-orange-600 text-white"
                      )}>
                        {isRtl ? 'نشط' : 'Active'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                      {items.length} {isRtl ? 'منشورات' : 'Items'} • {isRtl ? 'خطة المحتوى الأسبوعية' : 'Weekly Content Plan'}
                    </p>
                  </div>
                  <div className="flex-1 h-px bg-gray-200/50 mx-6" />
                </div>
                
                {items.length === 0 ? (
                  <div className="py-12 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-center justify-center text-gray-400 text-sm font-medium">
                    {isRtl ? 'لا يوجد محتوى لهذا الأسبوع' : 'No content for this week'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {items.map((item) => (
                      <div key={item.id} onClick={() => onEdit(item.id)} className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col group hover:border-green-500 transition-all hover:shadow-xl hover:shadow-green-50/50 cursor-pointer">
                        <div className="relative h-48 bg-gray-100">
                          <img 
                            src={item.mediaUrl || `https://picsum.photos/seed/${item.id}/600/400`} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                            <div className="flex flex-wrap gap-1">
                              {item.platforms.map(p => (
                                <div key={p} className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                                  {getPlatformIcon(p)}
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              {canEdit && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
                                  className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                  <MoreHorizontal size={14} />
                                </button>
                              )}
                              {currentUser?.role === 'Admin' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                                  className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-gray-600 hover:text-red-600 transition-colors"
                                >
                                  <XCircle size={14} />
                                </button>
                              )}
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold border backdrop-blur-sm",
                                item.approvalStatus === 'Approved' ? "bg-green-500/90 text-white border-green-400" :
                                item.approvalStatus === 'Rejected' ? "bg-red-500/90 text-white border-red-400" :
                                "bg-yellow-500/90 text-white border-yellow-400"
                              )}>
                                {item.approvalStatus.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col space-y-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-1">
                              <h3 className="font-bold text-gray-900 leading-tight line-clamp-2">{item.title}</h3>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="inline-block w-fit px-2 py-0.5 rounded text-[10px] font-bold border bg-gray-50 text-gray-600 border-gray-200">
                                  {item.objective}
                                </span>
                                {item.labels && item.labels.map(lbl => (
                                  <span key={lbl} className="inline-block px-2 py-0.5 rounded text-[9px] font-black border bg-zinc-50 text-zinc-600 border-zinc-200 uppercase tracking-wider">
                                    {lbl}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border shrink-0", getPriorityColor(item.priority))}>
                              {item.priority}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed" onClick={(e) => e.stopPropagation()}>
                            {renderTextWithLinks(item.description || item.caption || '')}
                          </p>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                            <div className="flex items-center -space-x-2">
                              {item.assignedTo.map((person, idx) => (
                                <div 
                                  key={idx}
                                  title={person}
                                  className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-700 border-2 border-white shadow-sm"
                                >
                                  {person[0]}
                                </div>
                              ))}
                              {item.assignedTo.length === 0 && (
                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 border-2 border-white">?</div>
                              )}
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-[9px] font-bold text-gray-400 uppercase truncate max-w-[80px]">
                                {item.assignedTo.join(', ')}
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase">{item.type}</span>
                            </div>
                          </div>

                          <div className="pt-4 flex gap-2">
                            {item.approvalStatus === 'Pending' ? (
                              canApprove ? (
                                <>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onApprove(item.id); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                                  >
                                    <CheckCircle size={14} />
                                    {isRtl ? 'موافقة' : 'Approve'}
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onReject(item.id); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-red-100 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-all"
                                  >
                                    <XCircle size={14} />
                                    {isRtl ? 'رفض' : 'Reject'}
                                  </button>
                                </>
                              ) : (
                                <div className="w-full text-center py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] text-gray-400 font-bold flex items-center justify-center gap-1.5 cursor-not-allowed">
                                  <Lock size={12} className="text-gray-400" />
                                  {isRtl ? 'بانتظار موافقة المدير' : 'Awaiting Manager Approval'}
                                </div>
                              )
                            ) : item.approvalStatus === 'Approved' ? (
                              <div className="w-full space-y-2" onClick={(e) => e.stopPropagation()}>
                                {(canEdit || canApprove) ? (
                                  schedulingItem === item.id ? (
                                    <div className="flex gap-2">
                                      <input 
                                        type="date" 
                                        value={publishDate}
                                        onChange={(e) => setPublishDate(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      <button 
                                        onClick={() => {
                                          onMoveToKanban(item.id, publishDate || item.dueDate);
                                          setSchedulingItem(null);
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                                      >
                                        {isRtl ? 'تأكيد' : 'Confirm'}
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        setSchedulingItem(item.id);
                                        setPublishDate(item.dueDate);
                                      }}
                                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                    >
                                      <Send size={14} />
                                      {isRtl ? 'إضافة إلى كانبان' : 'Add to Kanban'}
                                    </button>
                                  )
                                ) : (
                                  <div className="w-full text-center py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] text-gray-400 font-bold flex items-center justify-center gap-1.5 cursor-not-allowed">
                                    <Lock size={12} className="text-gray-400" />
                                    {isRtl ? 'جدولة للمدير/المعدل فقط' : 'Requires Manager/Editor Rights'}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full py-2.5 bg-gray-50 text-gray-400 rounded-xl text-xs font-bold text-center border border-gray-100">
                                {isRtl ? 'مرفوض' : 'Rejected'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="table"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-12"
          >
            {(Object.entries(groupedByWeek) as [string, ContentItem[]][]).map(([week, items], index) => (
              <div key={week} className="space-y-6">
                {index > 0 && (
                  <div className="py-4 flex items-center justify-center">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
                    <div className="px-4 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {isRtl ? 'فاصل أسبوعي' : 'Weekly Separator'}
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
                  </div>
                )}
                <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                    <Calendar className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{isRtl ? week.replace('Week', 'الأسبوع') : week}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {items.length} {isRtl ? 'منشورات' : 'Items'}
                    </p>
                  </div>
                  <div className="flex-1 h-px bg-gray-200/50 mx-4" />
                </div>
                
                {items.length > 0 && (
                  <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse" dir={isRtl ? 'rtl' : 'ltr'}>
                        <thead>
                          <tr className="bg-gray-50/50">
                            <th className={cn("px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100", isRtl ? "text-right" : "text-left")}>{t.title}</th>
                            <th className={cn("px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100", isRtl ? "text-right" : "text-left")}>{isRtl ? 'الهدف' : 'Objective'}</th>
                            <th className={cn("px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100", isRtl ? "text-right" : "text-left")}>{t.platform}</th>
                            <th className={cn("px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100", isRtl ? "text-right" : "text-left")}>{t.approval}</th>
                            <th className={cn("px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100", isRtl ? "text-right" : "text-left")}>{t.dueDate}</th>
                            <th className={cn("px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100", isRtl ? "text-right" : "text-left")}>{t.priority}</th>
                            <th className={cn("px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100", isRtl ? "text-right" : "text-left")}>{t.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {items.map((item) => (
                            <tr key={item.id} onClick={(e) => { if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return; onEdit(item.id); }} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                                    <img src={item.mediaUrl || `https://picsum.photos/seed/${item.id}/100/100`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{item.type}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span className="text-xs font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                  {item.objective}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex gap-1">
                                  {item.platforms.map(p => (
                                    <div key={p} className="p-1 bg-gray-100 rounded-md" title={p}>
                                      {getPlatformIcon(p)}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span className={cn(
                                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold",
                                  item.approvalStatus === 'Approved' ? "bg-green-100 text-green-700" :
                                  item.approvalStatus === 'Rejected' ? "bg-red-100 text-red-700" :
                                  "bg-yellow-100 text-yellow-700"
                                )}>
                                  {item.approvalStatus.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-xs text-gray-600 font-bold">{item.dueDate}</td>
                              <td className="px-6 py-5">
                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", getPriorityColor(item.priority))}>
                                  {item.priority}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  {item.approvalStatus === 'Pending' ? (
                                    canApprove ? (
                                      <>
                                        <button 
                                          onClick={() => onApprove(item.id)}
                                          className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                        >
                                          <CheckCircle size={20} />
                                        </button>
                                        <button 
                                          onClick={() => onReject(item.id)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                          <XCircle size={20} />
                                        </button>
                                      </>
                                    ) : (
                                      <span title={isRtl ? "تتطلب صلاحية موافقة" : "Requires manager permission"}><Lock size={18} className="text-gray-400 mx-2" /></span>
                                    )
                                  ) : item.approvalStatus === 'Approved' && (
                                    <div className="flex items-center gap-2">
                                      {(canEdit || canApprove) ? (
                                        schedulingItem === item.id ? (
                                          <div className="flex gap-2">
                                            <input 
                                              type="date" 
                                              value={publishDate}
                                              onChange={(e) => setPublishDate(e.target.value)}
                                              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] outline-none"
                                            />
                                            <button 
                                              onClick={() => {
                                                onMoveToKanban(item.id, publishDate || item.dueDate);
                                                setSchedulingItem(null);
                                              }}
                                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold"
                                            >
                                              {isRtl ? 'تأكيد' : 'Confirm'}
                                            </button>
                                          </div>
                                        ) : (
                                          <button 
                                            onClick={() => {
                                              setSchedulingItem(item.id);
                                              setPublishDate(item.dueDate);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                          >
                                            <Send size={14} />
                                            {isRtl ? 'إرسال لكانبان' : 'Send to Kanban'}
                                          </button>
                                        )
                                      ) : (
                                        <span title={isRtl ? "تتطلب صلاحية تعديل أو إدارة" : "Requires editor or manager permission"}><Lock size={18} className="text-gray-400 mx-2" /></span>
                                      )}
                                    </div>
                                  )}
                                  <button 
                                    onClick={() => canEdit && onEdit(item.id)}
                                    className={cn("p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all", !canEdit && "opacity-0 pointer-events-none")}
                                  >
                                    <MoreHorizontal size={20} />
                                  </button>
                                  <button 
                                    onClick={() => currentUser?.role === 'Admin' && onDelete(item.id)}
                                    className={cn("p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all", currentUser?.role !== 'Admin' && "opacity-0 pointer-events-none")}
                                  >
                                    <XCircle size={20} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
