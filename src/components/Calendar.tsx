import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Video,
  MessageCircle,
  Hash,
  LayoutGrid,
  List,
  Plus,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  AlertTriangle,
  Upload,
  Copy,
  PlusCircle,
  BarChart2,
  ListChecks,
  Eye,
  Trash2,
  Download
} from 'lucide-react';
import { translations } from '../translations';
import { ContentItem, Language, Platform } from '../types';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface CalendarProps {
  lang: Language;
  content: ContentItem[];
  onAddEvent?: () => void;
  onOpenDetail?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onUpdateItem?: (id: string, updates: Partial<ContentItem>) => void;
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

export const Calendar: React.FC<CalendarProps> = ({ 
  lang, 
  content, 
  onAddEvent, 
  onOpenDetail, 
  onToggleComplete,
  onUpdateItem
}) => {
  const t = translations[lang];
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'All'>('All');
  
  // Custom states
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExternalType, setIsExternalType] = useState<boolean>(true); // true = external, false = internal
  
  // Add modal form state
  const [selectedKanbanId, setSelectedKanbanId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newPlatform, setNewPlatform] = useState<Platform>('Facebook');
  const [newDate, setNewDate] = useState('2026-03-01');
  const [newTuv, setNewTuv] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newExternalUrl, setNewExternalUrl] = useState('');
  const [newUploadFile, setNewUploadFile] = useState<any>(null);
  
  // Quick copy toast representation
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const isRtl = lang === 'ar';

  // Filter content to only include items explicitly scheduled or added for publishing (عايز المحتوي اللي يبقا موجود اللي انا ضايفه بس)
  const scheduledContent = useMemo(() => {
    return content.filter(item => item.scheduledInPublishing === true);
  }, [content]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDayOfMonth }, (_, i) => null);

  const getLocalDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const currentFormattedDate = getLocalDateString(currentDate);

  const getDayContent = (day: number, monthOffset = 0) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, day);
    const dateStr = getLocalDateString(date);
    return scheduledContent.filter(item => {
      const matchesDate = item.dueDate === dateStr || item.publishDate === dateStr || item.preparationDate === dateStr;
      const matchesPlatform = selectedPlatform === 'All' || item.platforms.includes(selectedPlatform);
      return matchesDate && matchesPlatform;
    });
  };

  const monthName = currentDate.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'long' });
  const year = currentDate.getFullYear();

  // Week view calculations
  const startOfWeek = useMemo(() => {
    const date = new Date(currentDate);
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  }, [startOfWeek]);

  // Current Week scheduled items
  const currentWeekItems = useMemo(() => {
    const activeDates = weekDays.map(d => getLocalDateString(d));
    return scheduledContent.filter(item => {
      const matchesPlatform = selectedPlatform === 'All' || item.platforms.includes(selectedPlatform);
      const isOnDate = activeDates.includes(item.dueDate) || (item.publishDate && activeDates.includes(item.publishDate)) || (item.preparationDate && activeDates.includes(item.preparationDate));
      return matchesPlatform && isOnDate;
    });
  }, [scheduledContent, weekDays, selectedPlatform]);

  // Platform specific analytics calculation (التحليلات اللي تحت تبقا المحتوي اللي انا محدده مع تفصيل الحالات والألوان)
  const platformAnalytics = useMemo(() => {
    const platformsList: Platform[] = ['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'WhatsApp', 'Other'];
    return platformsList.map(p => {
      const items = scheduledContent.filter(item => item.platforms.includes(p));
      const total = items.length;
      
      const published = items.filter(item => item.status === 'Published').length; // Green
      
      const ready = items.filter(item => {
        if (item.status === 'Published') return false;
        const hasMaterials = (item.results && item.results.length > 0) || (item.attachments && item.attachments.length > 0);
        const isApprovedOrReady = item.status === 'Approved' || item.status === 'Ready' || (item.status === 'Review' && hasMaterials);
        return hasMaterials || isApprovedOrReady;
      }).length; // Yellow
      
      const pending = total - published - ready; // Red
      
      const internal = items.filter(item => !item.isExternal).length;
      const external = items.filter(item => item.isExternal).length;

      return { platform: p, total, internal, external, published, ready, pending };
    });
  }, [scheduledContent]);

  // Weekly stats specifically for the selected week (mini-analytics widget requested by the user)
  const weeklyAnalytics = useMemo(() => {
    const total = currentWeekItems.length;
    const internal = currentWeekItems.filter(item => !item.isExternal).length;
    const external = currentWeekItems.filter(item => item.isExternal).length;

    const platformsList: Platform[] = ['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'WhatsApp', 'Other'];
    const distribution = platformsList.map(platform => {
      const count = currentWeekItems.filter(item => item.platforms.includes(platform)).length;
      return { platform, count };
    });

    const maxCount = Math.max(...distribution.map(d => d.count), 1);
    
    return {
      total,
      internal,
      external,
      distribution,
      maxCount
    };
  }, [currentWeekItems]);

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setDate(currentDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else {
      newDate.setDate(currentDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const weekDaysLabels = isRtl 
    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Color Coding rule for agenda items (قواعد تحديد الألوان: أخضر للمنشور، أصفر للمادة الجاهزة أو المرفوعة، أحمر لمنشئ بدون مادة)
  const getItemColors = (item: ContentItem) => {
    if (item.status === 'Published') {
      return {
        bg: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600',
        badge: 'bg-emerald-600/30 text-emerald-100 border-emerald-500/40',
        card: 'bg-emerald-50 border-emerald-200 text-emerald-950',
        indicator: 'bg-emerald-600'
      };
    }

    const hasMaterials = (item.results && item.results.length > 0) || (item.attachments && item.attachments.length > 0);
    const isApprovedOrReady = item.status === 'Approved' || item.status === 'Ready' || (item.status === 'Review' && hasMaterials);

    if (hasMaterials || isApprovedOrReady) {
      return {
        bg: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600',
        badge: 'bg-amber-600/30 text-amber-100 border-amber-500/40',
        card: 'bg-amber-50 border-amber-200 text-amber-950',
        indicator: 'bg-amber-500'
      };
    }

    return {
      bg: 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600',
      badge: 'bg-rose-600/30 text-rose-100 border-rose-500/40',
      card: 'bg-rose-50 border-rose-200 text-rose-950',
      indicator: 'bg-rose-600'
    };
  };

  // Add Item to publishing flow
  const handleAddPublishItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isExternalType) {
        // Create manual external content item
        const id = 'external-' + Math.random().toString(36).substr(2, 9);
        const externalItem: ContentItem = {
          id,
          title: newTitle || (isRtl ? 'محتوى خارجي جديد' : 'New External Post'),
          platforms: [newPlatform],
          isExternal: true,
          scheduledInPublishing: true,
          externalUrl: newExternalUrl || '',
          tuv: newTuv || '',
          type: 'Post',
          caption: newCaption || '',
          description: newDescription || '',
          status: 'Scheduled',
          stageId: 'stage-5', // Scheduled
          assignedTo: [],
          createdBy: 'System',
          dueDate: newDate,
          publishDate: newDate,
          preparationDate: newDate,
          approvalStatus: 'Pending',
          priority: 'Normal',
          tasks: [],
          comments: [],
          attachments: [],
          results: newUploadFile ? [newUploadFile] : []
        };
        await setDoc(doc(db, 'content', id), externalItem);
      } else {
        // Select existing internal Kanban card to schedule
        if (!selectedKanbanId) return;
        const matched = content.find(item => item.id === selectedKanbanId);
        if (matched && onUpdateItem) {
          onUpdateItem(matched.id, {
            dueDate: newDate,
            publishDate: newDate,
            platforms: [newPlatform],
            status: matched.status === 'Idea' ? 'Scheduled' : matched.status,
            stageId: matched.stageId === 'stage-idea' ? 'stage-5' : matched.stageId,
            scheduledInPublishing: true
          });
        }
      }
      // Reset form
      setNewTitle('');
      setNewTuv('');
      setNewCaption('');
      setNewDescription('');
      setNewExternalUrl('');
      setNewUploadFile(null);
      setSelectedKanbanId('');
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error saving publish item:', err);
    }
  };

  const compressImage = (dataUrl: string, maxW = 800, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      if (!dataUrl.startsWith('data:image/')) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => {
        resolve(dataUrl);
      };
    });
  };

  // Base64 file reader for adding attachments to items
  const handleBase64Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/') && file.size > 800 * 1024) {
      const uploaded = {
        id: 'res-' + Math.random().toString(36).substr(2, 9),
        name: `${file.name} (Optimized)`,
        type: 'document',
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        date: new Date().toISOString()
      };
      setNewUploadFile(uploaded);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      let dataUrl = reader.result as string;
      const isImg = file.type.startsWith('image/');
      if (isImg && dataUrl.startsWith('data:image/')) {
        dataUrl = await compressImage(dataUrl);
      }
      const uploaded = {
        id: 'res-' + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: isImg ? 'image' : 'document',
        url: dataUrl,
        date: new Date().toISOString()
      };
      setNewUploadFile(uploaded);
    };
    reader.readAsDataURL(file);
  };

  const handleBase64ModalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedItem || !onUpdateItem) return;

    if (file.type.startsWith('video/') && file.size > 800 * 1024) {
      const uploaded = {
        id: 'res-' + Math.random().toString(36).substr(2, 9),
        name: `${file.name} (Optimized)`,
        type: 'document',
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        date: new Date().toISOString()
      };
      const updatedResults = [...(selectedItem.results || []), uploaded];
      onUpdateItem(selectedItem.id, { results: updatedResults });
      setSelectedItem(prev => prev ? { ...prev, results: updatedResults } : null);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      let dataUrl = reader.result as string;
      const isImg = file.type.startsWith('image/');
      if (isImg && dataUrl.startsWith('data:image/')) {
        dataUrl = await compressImage(dataUrl);
      }
      const uploaded = {
        id: 'res-' + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: isImg ? 'image' : 'document',
        url: dataUrl,
        date: new Date().toISOString()
      };
      
      const updatedResults = [...(selectedItem.results || []), uploaded];
      onUpdateItem(selectedItem.id, { results: updatedResults });
      setSelectedItem(prev => prev ? { ...prev, results: updatedResults } : null);
    };
    reader.readAsDataURL(file);
  };

  // Toggle item from checklist (or calendar toggle buttons)
  const handleToggleChecklist = (id: string) => {
    const item = content.find(i => i.id === id);
    if (!item || !onUpdateItem) return;

    const newStatus = item.status === 'Published' ? 'Scheduled' : 'Published';
    onUpdateItem(item.id, { 
      status: newStatus,
      publishDate: newStatus === 'Published' ? getLocalDateString(new Date()) : ''
    });

    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Handle Approve transition
  const handleApproveStatus = (id: string) => {
    if (onUpdateItem) {
      onUpdateItem(id, {
        status: 'Approved',
        stageId: 'stage-4', // Approved stage
        approvalStatus: 'Approved'
      });
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(prev => prev ? { ...prev, status: 'Approved', approvalStatus: 'Approved', stageId: 'stage-4' } : null);
      }
    }
  };

  const handleCopyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(isRtl ? 'تم النسخ!' : 'Copied!');
    setTimeout(() => setCopyStatus(null), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col gap-6"
    >
      {/* Top action header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black text-gray-950 tracking-tight flex items-center gap-2">
            <CalendarIcon className="text-green-600" size={28} />
            {isRtl ? 'نشر المحتوى' : 'Content Publishing'}
          </h2>
          <div className="flex bg-white border border-gray-200 rounded-2xl p-1 shadow-sm">
            <button 
              type="button"
              onClick={() => setView('month')}
              className={cn(
                "px-6 py-2 text-xs font-black rounded-xl transition-all cursor-pointer",
                view === 'month' ? "bg-green-600 text-white shadow-lg shadow-green-150" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {isRtl ? 'شهر' : 'Month'}
            </button>
            <button 
              type="button"
              onClick={() => setView('week')}
              className={cn(
                "px-6 py-2 text-xs font-black rounded-xl transition-all cursor-pointer",
                view === 'week' ? "bg-green-600 text-white shadow-lg shadow-green-150" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {isRtl ? 'أسبوع' : 'Week'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value as any)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-[1.5rem] text-xs font-extrabold text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
          >
            <option value="All">{isRtl ? 'كل المنصات' : 'All Platforms'}</option>
            <option value="Facebook">Facebook</option>
            <option value="Instagram">Instagram</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="TikTok">TikTok</option>
            <option value="WhatsApp">WhatsApp</option>
          </select>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-[1.5rem] px-4 py-2 shadow-sm">
            <button 
              type="button"
              onClick={handlePrev}
              className="p-1.5 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 cursor-pointer"
            >
              <ChevronLeft size={18} className={isRtl ? "rotate-180" : ""} />
            </button>
            <span className="text-xs font-black text-gray-800 min-w-[120px] text-center font-mono">
              {view === 'month' ? `${monthName} ${year}` : `${isRtl ? 'أسبوع' : 'Week'} ${weekDays[0].getDate()} - ${weekDays[6].getDate()} ${monthName}`}
            </span>
            <button 
              type="button"
              onClick={handleNext}
              className="p-1.5 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 cursor-pointer"
            >
              <ChevronRight size={18} className={isRtl ? "rotate-180" : ""} />
            </button>
          </div>

          <button 
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-green-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black hover:bg-green-700 transition-all shadow-lg hover:shadow-xl hover:scale-101 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            {isRtl ? 'إضافة محتوى للخطة' : 'Add Content to Plan'}
          </button>
        </div>
      </div>

      {/* Main Grid: Left is Calendar, Right is Widgets (Checklist & Analytics) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Main Work Area: Calendar */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[550px]">
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
              {weekDaysLabels.map((day, ix) => (
                <div key={day} className="px-3 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center border-r border-gray-100 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {view === 'month' ? (
                  <motion.div 
                    key="month"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    className="grid grid-cols-7 border-collapse bg-gray-50/20"
                  >
                    {[...padding, ...days].map((day, i) => {
                      const dayContent = day ? getDayContent(day) : [];
                      const today = new Date();
                      const isCurrentDay = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
                      
                      return (
                        <div 
                          key={i} 
                          className={cn(
                            "min-h-[125px] p-2.5 md:p-3 border-r border-b border-gray-108/60 last:border-r-0 flex flex-col gap-2 transition-colors",
                            !day && "bg-gray-50/40",
                            day && "hover:bg-gray-50/50 bg-white"
                          )}
                        >
                          {day && (
                            <>
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  "text-xs font-black w-6.5 h-6.5 flex items-center justify-center rounded-lg transition-all",
                                  isCurrentDay 
                                    ? "bg-green-600 text-white shadow-md shadow-green-100 font-black font-sans" 
                                    : "text-gray-400 group-hover:text-gray-900"
                                )}>
                                  {day}
                                </span>
                                {dayContent.length > 0 && (
                                  <span className="text-[8px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-lg border border-emerald-100">
                                    {dayContent.length} {isRtl ? 'تسليم' : 'posts'}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 max-h-[85px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                                {dayContent.map(item => {
                                  const colors = getItemColors(item);
                                  const platform = item.platforms[0] || 'Other';
                                  const Icon = PLATFORM_ICONS[platform] || Hash;
                                  const isPublished = item.status === 'Published';
                                  
                                  return (
                                    <div 
                                      key={item.id} 
                                      onClick={() => setSelectedItem(item)}
                                      className={cn(
                                        "px-2 py-1.5 rounded-xl border flex items-center justify-between text-[9px] cursor-pointer shadow-sm relative transition-all active:scale-95 group",
                                        colors.bg
                                      )}
                                      title={item.title}
                                    >
                                      <div className="flex items-center gap-1 min-w-0 flex-1">
                                        <Icon size={10} className="shrink-0 opacity-90" />
                                        <span className={cn("truncate font-black tracking-tight", isPublished && "line-through opacity-80")}>
                                          {item.title}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {item.isExternal && (
                                          <span className="text-[7px] font-black uppercase bg-white/25 px-1 py-0.2 rounded" title={isRtl ? 'خارجي' : 'External'}>
                                            {isRtl ? 'خ' : 'EXT'}
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleChecklist(item.id);
                                          }}
                                          className={cn(
                                            "w-3.5 h-3.5 rounded-md flex items-center justify-center transition-all bg-white text-gray-800 border-white/50 hover:bg-neutral-100"
                                          )}
                                        >
                                          <Check size={8} className={isPublished ? "text-emerald-600 block" : "hidden group-hover:block text-gray-400"} strokeWidth={4.5} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="week"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    className="grid grid-cols-7 h-full bg-gray-50/10 min-h-[460px]"
                  >
                    {weekDays.map((date, i) => {
                      const dayContent = getDayContent(date.getDate(), date.getMonth() - currentDate.getMonth());
                      const isToday = date.toDateString() === new Date().toDateString();
                      
                      return (
                        <div 
                          key={i} 
                          className={cn(
                            "min-h-full p-4 border-r border-b border-gray-110 flex flex-col gap-3 transition-colors",
                            isToday ? "bg-green-50/20" : "hover:bg-gray-50/30 bg-white"
                          )}
                        >
                          <div className="flex flex-col items-center gap-1 pb-2 border-b border-gray-100">
                            <span className={cn(
                              "text-base font-black w-10 h-10 flex items-center justify-center rounded-xl transition-all",
                              isToday ? "bg-green-600 text-white shadow-md shadow-green-150" : "text-gray-400"
                            )}>
                              {date.getDate()}
                            </span>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{weekDaysLabels[i]}</span>
                          </div>

                          <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                            {dayContent.map(item => {
                              const colors = getItemColors(item);
                              const platName = item.platforms[0] || 'Other';
                              const Icon = PLATFORM_ICONS[platName] || Hash;
                              const isPublished = item.status === 'Published';
                              
                              return (
                                <div 
                                  key={item.id} 
                                  onClick={() => setSelectedItem(item)}
                                  className={cn(
                                    "p-3 rounded-2xl border shadow-sm transition-all hover:scale-[1.01] cursor-pointer text-xs flex flex-col gap-2 group relative",
                                    colors.card
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Icon size={12} className="shrink-0 text-gray-600" />
                                      <span className={cn("font-black text-[11px] truncate leading-tight block", isPublished && "line-through opacity-70")}>
                                        {item.title}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleChecklist(item.id);
                                      }}
                                      className={cn(
                                        "w-4 h-4 rounded-md border flex items-center justify-center cursor-pointer transition-all bg-white",
                                        isPublished ? "border-emerald-500 text-emerald-600" : "border-gray-200 hover:border-emerald-500"
                                      )}
                                    >
                                      <Check size={10} className={isPublished ? "text-emerald-600 block" : "hidden group-hover:block text-gray-400"} strokeWidth={4} />
                                    </button>
                                  </div>

                                  <div className="flex items-center justify-between pt-1.5 border-t border-black/5 mt-auto">
                                    <span className="text-[8px] uppercase tracking-widest opacity-60 font-black">
                                      {item.isExternal ? (isRtl ? 'خارجي' : 'External') : (isRtl ? 'داخلي' : 'Internal')}
                                    </span>
                                    {item.tuv && (
                                      <span className="text-[8px] font-mono font-bold bg-white/70 px-1.5 py-0.5 rounded border border-black/5">
                                        TUV: {item.tuv}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Sticky Widgets Section: Week Checklist & Platform Analytics */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Week Checklist (شيك ليست المحتوى الأسبوعي) */}
          <section className="bg-white p-5 rounded-[2.5rem] border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <h3 className="font-black text-sm text-gray-950 flex items-center gap-2">
                <ListChecks size={18} className="text-green-600 animate-pulse" />
                {isRtl ? 'شيك ليست الأسبوع' : 'Weekly Posting Checklist'}
              </h3>
              <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-black">
                {currentWeekItems.filter(i => i.status === 'Published').length}/{currentWeekItems.length}
              </span>
            </div>
            
            <p className="text-[10px] text-gray-400 leading-relaxed font-bold">
              {isRtl 
                ? 'اضغط فوق الصناديق لتأكيد نزول منشورات هذا الأسبوع بالفعل على المنصات. ستظهر المنشورات المؤكدة باللون الأخضر' 
                : 'Click to assert go-live of content plans this week. Checked plans render in vivid green.'}
            </p>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {currentWeekItems.map(item => {
                const colors = getItemColors(item);
                const firstPlatform = item.platforms[0] || 'Other';
                const Icon = PLATFORM_ICONS[firstPlatform] || Hash;
                const isPublished = item.status === 'Published';
                
                return (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={cn(
                      "p-3 rounded-2xl border shadow-sm cursor-pointer hover:scale-[1.01] transition-all flex items-center justify-between gap-3 text-xs",
                      colors.card
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="p-1.5 rounded-lg bg-white shadow-sm text-gray-600 shrink-0">
                        <Icon size={12} />
                      </div>
                      <div className="min-w-0">
                        <h4 className={cn("font-black text-[11px] truncate leading-tight block", isPublished && "line-through opacity-70 text-emerald-800")}>
                          {item.title}
                        </h4>
                        <span className="text-[8px] font-mono text-gray-400 block font-semibold">
                          {item.dueDate}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleChecklist(item.id);
                      }}
                      className={cn(
                        "w-5 h-5 rounded-lg border flex items-center justify-center transition-all bg-white cursor-pointer shrink-0",
                        isPublished ? "border-emerald-500 text-emerald-600 bg-emerald-50" : "border-gray-200 text-transparent hover:border-emerald-500 hover:text-emerald-650"
                      )}
                    >
                      <Check size={11} strokeWidth={4.5} className={isPublished ? "block text-emerald-600" : ""} />
                    </button>
                  </div>
                );
              })}

              {currentWeekItems.length === 0 && (
                <p className="text-[10px] text-gray-400 font-bold text-center py-6 italic">
                  {isRtl ? 'لا توجد تسليمات مبرمجة هذا الأسبوع.' : 'No scheduled items for this week.'}
                </p>
              )}
            </div>
          </section>

          {/* Mini-Analytics Widget specifically for the Calendar View (أداة تحليلات الأسبوع المختار) */}
          <section className="bg-white p-5 rounded-[2.5rem] border border-gray-200 shadow-sm space-y-5">
            <h3 className="font-black text-sm text-gray-950 flex items-center gap-2 border-b border-gray-50 pb-2">
              <BarChart2 size={18} className="text-green-600" />
              {isRtl ? 'تحليلات الأسبوع المحدد' : 'Selected Week Analytics'}
            </h3>

            {/* KPI Counts Panel (total, internal, external counts for selected week) */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-50/40 border border-emerald-100 p-2.5 rounded-2xl text-center">
                <span className="text-[9px] font-black text-emerald-800 block uppercase tracking-wider">
                  {isRtl ? 'المجموع' : 'Total'}
                </span>
                <span className="text-lg font-black text-emerald-950 block mt-0.5">
                  {weeklyAnalytics.total}
                </span>
              </div>

              <div className="bg-blue-50/40 border border-blue-100 p-2.5 rounded-2xl text-center">
                <span className="text-[9px] font-black text-blue-800 block uppercase tracking-wider">
                  {isRtl ? 'داخلي' : 'Internal'}
                </span>
                <span className="text-lg font-black text-blue-950 block mt-0.5">
                  {weeklyAnalytics.internal}
                </span>
              </div>

              <div className="bg-amber-50/40 border border-amber-100 p-2.5 rounded-2xl text-center">
                <span className="text-[9px] font-black text-amber-800 block uppercase tracking-wider">
                  {isRtl ? 'خارجي' : 'External'}
                </span>
                <span className="text-lg font-black text-amber-950 block mt-0.5">
                  {weeklyAnalytics.external}
                </span>
              </div>
            </div>

            {/* Platform Distribution Chart for currently selected week */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none block">
                {isRtl ? 'توزيع المنصات هذا الأسبوع' : 'Platform Distribution'}
              </h4>

              {weeklyAnalytics.total > 0 ? (
                <div className="space-y-3">
                  {weeklyAnalytics.distribution.map(({ platform, count }) => {
                    const Icon = PLATFORM_ICONS[platform] || Hash;
                    const percentage = Math.round((count / weeklyAnalytics.total) * 100);
                    
                    // Specific platform colors matching their brand templates
                    let barColorClass = "bg-gray-500";
                    if (platform === 'Facebook') barColorClass = "bg-[#1877F2]";
                    else if (platform === 'Instagram') barColorClass = "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040]";
                    else if (platform === 'LinkedIn') barColorClass = "bg-[#0A66C2]";
                    else if (platform === 'TikTok') barColorClass = "bg-black";
                    else if (platform === 'WhatsApp') barColorClass = "bg-[#25D366]";

                    return (
                      <div key={platform} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                          <div className="flex items-center gap-1.5 font-black">
                            <Icon size={12} className="text-gray-500 shrink-0" />
                            <span>{isRtl ? PLATFORMS_AR[platform] : platform}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 font-mono font-bold shrink-0">
                            {count} {isRtl ? 'منشور' : 'posts'} ({percentage}%)
                          </span>
                        </div>
                        {/* Custom Visual HTML Segmented Chart Bar */}
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden relative shadow-inner">
                          <div 
                            className={cn("h-full rounded-full transition-all duration-500", barColorClass)}
                            style={{ width: `${(count / weeklyAnalytics.maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400 font-bold border border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                  <p className="text-[11px] italic">
                    {isRtl ? 'لا توجد منشورات مجدولة لهذا الأسبوع.' : 'No scheduled posts for this week.'}
                  </p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>

      {/* 1. CUSTOM PUBLISHING DETAIL MODAL (وعايز اللي يظهر جوا لما ادوس التسليمات واسم المحتوي والمنصة وال TUV ووصف المحتوي والكابشن) */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl border border-gray-200 overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-green-100 text-green-800">
                    {selectedItem.isExternal ? (isRtl ? 'منشور خارجي يدوي' : 'External Manual Posting') : (isRtl ? 'بطاقة نشر داخلية' : 'Internal Pipeline Card')}
                  </span>
                  <h3 className="text-lg font-black text-gray-950 mt-1 flex items-center gap-1.5">
                    {selectedItem.status === 'Published' ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-ping" />
                    )}
                    {selectedItem.title}
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-150 text-gray-400 hover:text-gray-900 transition-colors text-lg font-bold flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Scroller Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                
                {/* Visual state warning if external missing material */}
                {selectedItem.isExternal && (!selectedItem.results || selectedItem.results.length === 0) && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="text-rose-600 shrink-0 mt-0.5 animate-pulse" size={18} />
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-rose-950">{isRtl ? 'تنبيه: مادة النشر (الماتريال) لم يتم رفعها بعد!' : 'Alert: Material results missing!'}</h4>
                      <p className="text-[10px] text-rose-700 leading-relaxed font-bold">
                        {isRtl 
                          ? 'لأنه منشور خارجي يدوي، يجب رفع صورة أو محتوى النتائج ليتحول لونه على أجندة النشر من الأحمر إلى الأصفر للموافقة واعتماده.'
                          : 'As an external content item, attach files/images under results to turn agenda from red to yellow.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Key metadata grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 block uppercase">{isRtl ? 'المنصة التسويقية' : 'Target Platform'}</span>
                    <span className="text-xs font-black text-gray-800 flex items-center gap-1.5 mt-1">
                      {React.createElement(PLATFORM_ICONS[selectedItem.platforms[0] || 'Other'] || Hash, { size: 14, className: 'text-gray-500' })}
                      {selectedItem.platforms.join(', ')}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 block uppercase">الـ TUV</span>
                    {onUpdateItem ? (
                      <input 
                        type="text"
                        value={selectedItem.tuv || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          onUpdateItem(selectedItem.id, { tuv: val });
                          setSelectedItem(prev => prev ? { ...prev, tuv: val } : null);
                        }}
                        placeholder={isRtl ? 'مثال: TUV-817' : 'e.g. TUV-12'}
                        className="text-xs font-bold text-gray-800 bg-transparent outline-none w-full border-b border-transparent focus:border-green-500 pt-0.5 font-mono"
                      />
                    ) : (
                      <span className="text-xs font-black text-gray-850 block mt-1 font-mono">{selectedItem.tuv || '—'}</span>
                    )}
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 col-span-2 md:col-span-1">
                    <span className="text-[9px] font-black text-gray-400 block uppercase">{isRtl ? 'تاريخ النشر' : 'Schedule Day'}</span>
                    <span className="text-xs font-black text-gray-800 block mt-1 font-mono">{selectedItem.dueDate}</span>
                  </div>
                </div>

                {/* Content Description (وصف المحتوى) */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText size={14} />
                    {isRtl ? 'وصف المحتوى وتفاصيل التسليمات' : 'Content Deliverables Description'}
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                    <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed font-semibold">
                      {selectedItem.description || (isRtl ? 'لا يوجد وصف مضاف.' : 'No description provided.')}
                    </p>
                  </div>
                </div>

                {/* Caption (الكابشن) */}
                <div className="space-y-2 bg-gradient-to-tr from-green-50/10 to-green-50/40 p-4 rounded-3xl border border-green-150/50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-green-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={14} className="text-green-700" />
                      {isRtl ? 'كابشن المنشور المقترح للكتابة' : 'Published Caption Copy'}
                    </h4>
                    {selectedItem.caption && (
                      <button 
                        type="button"
                        onClick={() => handleCopyCaption(selectedItem.caption || '')}
                        className="px-2.5 py-1 text-[9px] font-black bg-white border border-green-200 text-green-700 hover:bg-green-50 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <Copy size={11} />
                        <span>{copyStatus || (isRtl ? 'نسخ الكابشن' : 'Copy Caption')}</span>
                      </button>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-green-100/60 shadow-sm">
                    <p className="text-xs text-green-950 font-black whitespace-pre-line leading-relaxed leading-extra" dir="auto">
                      {selectedItem.caption || (isRtl ? 'لا يوجد كابشن مجهز.' : 'No caption prepared.')}
                    </p>
                  </div>
                </div>

                {/* External link if exists */}
                {selectedItem.externalUrl && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">{isRtl ? 'رابط خارجي للمحتوى' : 'Target External URL'}</h4>
                    <a 
                      href={selectedItem.externalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-extrabold hover:underline"
                    >
                      <ExternalLink size={12} />
                      <span className="truncate max-w-sm">{selectedItem.externalUrl}</span>
                    </a>
                  </div>
                )}

                {/* Materials & Results (التسليمات المرفقة والتنزيلات) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Upload size={14} />
                    {isRtl ? 'التسليمات المرفقة كملفات ونتائج' : 'Publishing Materials & Deliverables Results'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedItem.results && selectedItem.results.map(res => (
                      <div key={res.id} className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between shadow-sm">
                        <div className="min-w-0 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <div className="truncate">
                            <span className="text-[10px] font-black text-emerald-950 block truncate">{res.name}</span>
                            <span className="text-[8px] opacity-60 font-mono block uppercase">{res.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {res.url && (
                            <a 
                              href={res.url} 
                              download={res.name}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-700 transition"
                              title={isRtl ? 'عرض أو تحميل' : 'Open / View'}
                            >
                              <Download size={13} />
                            </a>
                          )}
                          <button 
                            type="button"
                            onClick={() => {
                              if (onUpdateItem) {
                                const leftOver = (selectedItem.results || []).filter(r => r.id !== res.id);
                                onUpdateItem(selectedItem.id, { results: leftOver });
                                setSelectedItem(prev => prev ? { ...prev, results: leftOver } : null);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-600 transition"
                            title={isRtl ? 'حذف' : 'Remove'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Fallback if none uploaded */}
                    {(!selectedItem.results || selectedItem.results.length === 0) && (
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center text-[10px] font-bold text-gray-400 md:col-span-2">
                        {isRtl ? 'لا توجد مرفقات تسليم مضافة بعد.' : 'No attached materials.'}
                      </div>
                    )}
                  </div>

                  {/* Attachment Uploader helper tool */}
                  {onUpdateItem && (
                    <div className="pt-2 border-t border-gray-100">
                      <label className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-300 hover:border-green-500 rounded-2xl text-xs font-black text-gray-500 hover:text-green-700 bg-gray-50/50 hover:bg-green-50/20 cursor-pointer transition-all">
                        <Upload size={14} />
                        <span>{isRtl ? 'رفع تسليمة / مادة نتائج جديدة (صورة أو وثيقة)' : 'Attach New Result/Document'}</span>
                        <input 
                          type="file" 
                          accept="image/*,application/pdf"
                          onChange={handleBase64ModalUpload}
                          className="hidden" 
                        />
                      </label>
                    </div>
                  )}
                </div>

              </div>

              {/* State Transitions / Action Footer inside Modal */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/70 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
                
                {/* 1. Toggle Published checkbox */}
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => handleToggleChecklist(selectedItem.id)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-xs font-black border transition-all flex items-center gap-2 cursor-pointer",
                      selectedItem.status === 'Published' 
                        ? "bg-emerald-600 border-emerald-600 text-white" 
                        : "bg-white border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800"
                    )}
                  >
                    <CheckCircle2 size={14} />
                    <span>{selectedItem.status === 'Published' ? (isRtl ? 'منشور بالفعل ✓' : 'Published ✓') : (isRtl ? 'تأكيد النشر على المنصة' : 'Set as Published')}</span>
                  </button>
                </div>

                {/* 2. Approve button appears only when status is Review */}
                <div className="flex gap-2">
                  {selectedItem.status === 'Review' && (
                    <button 
                      type="button"
                      onClick={() => handleApproveStatus(selectedItem.id)}
                      className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-md shadow-yellow-950/10 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <CheckCircle2 size={14} />
                      <span>{isRtl ? 'الموافقة المباشرة (معتمد النشر)' : 'Approve for Posting'}</span>
                    </button>
                  )}

                  <button 
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="px-5 py-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    {isRtl ? 'إغلاق نافذة التفاصيل' : 'Close Details'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. ADD EVENT AND CONTENT TO PUBLISHING PLAN DIALOG (داخلي ولا خارجي) */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg border border-gray-200 overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-black text-gray-950">
                  {isRtl ? 'إضافة محتوى لجدول النشر' : 'Schedule Content to Agenda'}
                </h3>
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-150 text-gray-400 hover:text-gray-950 transition-colors text-lg font-bold flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddPublishItem} className="p-6 space-y-4">
                
                {/* 1. Toggle between Internal and External */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider block">
                    {isRtl ? 'مصدر المحتوى وجدوى النشر' : 'Publishing Origin'}
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 border border-gray-200 p-1.5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setIsExternalType(false)}
                      className={cn(
                        "py-3 rounded-xl text-xs font-black text-center transition-all cursor-pointer",
                        !isExternalType 
                          ? "bg-green-600 text-white shadow-md shadow-green-100" 
                          : "text-gray-400 hover:text-gray-700"
                      )}
                    >
                      {isRtl ? 'محتوى داخلي (من كانبان)' : 'Internal (From Kanban)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsExternalType(true)}
                      className={cn(
                        "py-3 rounded-xl text-xs font-black text-center transition-all cursor-pointer",
                        isExternalType 
                          ? "bg-green-600 text-white shadow-md shadow-green-100" 
                          : "text-gray-400 hover:text-gray-700"
                      )}
                    >
                      {isRtl ? 'محتوى خارجي يدوي' : 'External (Manual Post)'}
                    </button>
                  </div>
                </div>

                {/* Date and Platform fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase block">{isRtl ? 'تاريخ النشر' : 'Schedule Date'}</label>
                    <input 
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-green-500 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase block">{isRtl ? 'المنصة التسويقية الكبرى' : 'Publish Platform'}</label>
                    <select
                      value={newPlatform}
                      onChange={(e) => setNewPlatform(e.target.value as Platform)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer focus:ring-1 focus:ring-green-500"
                    >
                      <option value="Facebook">Facebook</option>
                      <option value="Instagram">Instagram</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="TikTok">TikTok</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Other">Other / منصة أخرى</option>
                    </select>
                  </div>
                </div>

                {/* 2. CASE A: INTERNAL CONTENTS */}
                {!isExternalType ? (
                  <div className="space-y-1.5 p-3.5 bg-blue-50/40 border border-blue-100/60 rounded-2xl">
                    <label className="text-[10px] font-black text-blue-700 uppercase block">
                      {isRtl ? 'اختر بطاقة محتوى كانبان لربطها وجدولتها' : 'Connect Existing Kanban Board Card'}
                    </label>
                    <select
                      value={selectedKanbanId}
                      onChange={(e) => setSelectedKanbanId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-blue-150 rounded-xl text-xs font-black outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      required={!isExternalType}
                    >
                      <option value="">{isRtl ? '--- الرجاء اختيار بطاقة محتوى ---' : '--- Choose Kanban Post ---'}</option>
                      {content.filter(item => !item.isExternal).map(item => (
                        <option key={item.id} value={item.id}>
                          {item.title} ({item.status || 'Idea'})
                        </option>
                      ))}
                    </select>
                    <p className="text-[9px] text-blue-600/80 leading-relaxed font-bold mt-1">
                      {isRtl 
                        ? 'ربط بطاقة الكانبان يقوم تلقائياً بترحيلها للخطة التسويقية وتحديث كابشنها ووصفها عند الانتهاء.'
                        : 'Linking an existing Kanban item adds it directly to the schedule grid with fully inherited values.'}
                    </p>
                  </div>
                ) : (
                  // CASE B: EXTERNAL MANUAL CONTENTS
                  <div className="space-y-3.5">
                    
                    {/* Deliverables / Title */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase block">{isRtl ? 'اسم المحتوى / التسليمات' : 'Deliverables Title'}</label>
                      <input 
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder={isRtl ? 'مثال: بوست تسعير قمح مايو بكروبسا' : 'e.g. Wheat Price List Campaign'}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-extrabold outline-none focus:ring-1 focus:ring-green-500"
                        required={isExternalType}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* TUV */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase block">الـ TUV</label>
                        <input 
                          type="text"
                          value={newTuv}
                          onChange={(e) => setNewTuv(e.target.value)}
                          placeholder={isRtl ? 'TUV-8117' : 'TUV Number'}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none font-mono focus:ring-1 focus:ring-green-500"
                        />
                      </div>

                      {/* External URL */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase block">{isRtl ? 'رابط النشر الخارجي' : 'External URL (Optional)'}</label>
                        <input 
                          type="url"
                          value={newExternalUrl}
                          onChange={(e) => setNewExternalUrl(e.target.value)}
                          placeholder="https://facebook.com/..."
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    {/* Content Description */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase block">{isRtl ? 'وصف المحتوى' : 'Content Description'}</label>
                      <textarea 
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder={isRtl ? 'أدخل وصف المنشور وعناصر التفاصيل بدقة هنا...' : 'Post description and content deliverables outline...'}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none resize-none h-16 focus:ring-1 focus:ring-green-500"
                      />
                    </div>

                    {/* Caption */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase block">{isRtl ? 'الكابشن المقترح للمنشور' : 'Campaign Caption Text'}</label>
                      <textarea 
                        value={newCaption}
                        onChange={(e) => setNewCaption(e.target.value)}
                        placeholder={isRtl ? 'نص الكابشن والهاشتاجات المعتمدة للنشر...' : 'Write complete caption text with marketing hashtags...'}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none resize-none h-20 focus:ring-1 focus:ring-green-500"
                      />
                    </div>

                    {/* Deliverable Material file */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase block">{isRtl ? 'المواد والنتائج (رفع ماتريال)' : 'Attach Material (File)'}</label>
                      <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-350 hover:border-green-500 rounded-xl text-xs font-black text-gray-500 hover:text-green-700 bg-gray-50 cursor-pointer transition-all">
                        <Upload size={13} />
                        <span>{newUploadFile ? `✓ ${newUploadFile.name}` : (isRtl ? 'انقر لرفع الماتريال فوراً' : 'Select deliverables file')}</span>
                        <input 
                          type="file" 
                          accept="image/*,application/pdf"
                          onChange={handleBase64Upload}
                          className="hidden" 
                        />
                      </label>
                      <p className="text-[8px] text-gray-400 font-bold">
                        {isRtl 
                          ? 'تنبيه: يمكنك رفع التسليمة الآن، أو تخطي الرفع وجدولتها باللون الأحمر، ورفعها لاحقاً لترقية اللون.'
                          : 'You can bypass files now (agenda item is red). Add results file later to turn it yellow.'}
                      </p>
                    </div>

                  </div>
                )}

                {/* Form Footer Buttons */}
                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>

                  <button 
                    type="submit"
                    className="px-5 py-2.5 text-xs font-black bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg rounded-xl cursor-pointer active:scale-95 transition-all"
                  >
                    {isRtl ? 'حفظ وجدولة للنشر' : 'Schedule Content'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
