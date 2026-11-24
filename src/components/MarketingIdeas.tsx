import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lightbulb, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Archive, 
  ArrowRight, 
  Calendar, 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Link as LinkIcon, 
  Upload, 
  X, 
  Trash2, 
  Edit3, 
  ThumbsUp, 
  Share2, 
  Layers, 
  Check, 
  ExternalLink,
  ChevronRight,
  Hash,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  HelpCircle,
  Zap,
  Tag
} from 'lucide-react';
import { MarketingIdea, Language, Platform, User } from '../types';
import { cn } from '../lib/utils';
import { compressImageFile } from '../lib/storage';
import { showToast } from './Toast';

interface MarketingIdeasProps {
  lang: Language;
  ideas: MarketingIdea[];
  currentUser?: User | null;
  onAddIdea: (idea: Omit<MarketingIdea, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateIdea: (id: string, updates: Partial<MarketingIdea>) => Promise<void>;
  onDeleteIdea: (id: string) => Promise<void>;
  onPromoteToContent: (idea: MarketingIdea, targetWeek: string) => Promise<void>;
  setActiveTab: (tab: any) => void;
}

const PLATFORMS: Platform[] = ['Facebook', 'Instagram', 'TikTok', 'LinkedIn', 'WhatsApp'];

const PLATFORM_ICONS: Record<Platform, any> = {
  'Facebook': Facebook,
  'Instagram': Instagram,
  'LinkedIn': Linkedin,
  'TikTok': Video,
  'WhatsApp': MessageCircle,
  'Other': Hash,
};

const PRESET_LABELS = [
  'موسم القمح',
  'عيادة زراعية',
  'توعية مزارعين',
  'ريلز سريع',
  'عرض خاص',
  'تريند زراعي',
  'سند ليك',
  'تعليمي',
  'حصاد'
];

const PRESET_SEASONS = [
  'موسم حصاد القمح',
  'موسم زراعة البطاطس',
  'معرض صحاري الزراعي',
  'بداية فصل الربيع',
  'عيد الفلاح المصري',
  'موسم مكافحة الآفات الصيفية'
];

export const MarketingIdeas: React.FC<MarketingIdeasProps> = ({
  lang,
  ideas,
  currentUser,
  onAddIdea,
  onUpdateIdea,
  onDeleteIdea,
  onPromoteToContent,
  setActiveTab
}) => {
  const isRtl = lang === 'ar';
  const isAdmin = currentUser?.role === 'Admin';
  const canApprove = isAdmin || currentUser?.permissions?.includes('approve') || currentUser?.permissions?.includes('all');

  // Main UI State
  const [activeTab, setActiveIdeasTab] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'All'>('All');
  const [selectedLabel, setSelectedLabel] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'votes' | 'timing'>('newest');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<MarketingIdea | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLabels, setFormLabels] = useState<string[]>([]);
  const [customLabelInput, setCustomLabelInput] = useState('');
  const [formPlatforms, setFormPlatforms] = useState<Platform[]>(['Facebook', 'Instagram']);
  const [mediaMode, setMediaMode] = useState<'upload' | 'url'>('upload');
  const [formMediaUrl, setFormMediaUrl] = useState('');
  const [formMediaType, setFormMediaType] = useState<'image' | 'video' | 'link' | 'none'>('none');
  const [formPreferredDate, setFormPreferredDate] = useState('');
  const [formPreferredSeason, setFormPreferredSeason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promote / Smart Week Recommendation State
  const [promotingIdea, setPromotingIdea] = useState<MarketingIdea | null>(null);
  const [selectedTargetWeek, setSelectedTargetWeek] = useState<string>('Week 1');
  const [isPromoting, setIsPromoting] = useState(false);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingIdea(null);
    setFormTitle('');
    setFormDescription('');
    setFormLabels(['توعية مزارعين']);
    setCustomLabelInput('');
    setFormPlatforms(['Facebook', 'Instagram']);
    setMediaMode('upload');
    setFormMediaUrl('');
    setFormMediaType('none');
    setFormPreferredDate('');
    setFormPreferredSeason('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (idea: MarketingIdea) => {
    setEditingIdea(idea);
    setFormTitle(idea.title);
    setFormDescription(idea.description || '');
    setFormLabels(idea.labels || []);
    setCustomLabelInput('');
    setFormPlatforms(idea.platforms || ['Facebook']);
    setMediaMode(idea.mediaUrl?.startsWith('data:') ? 'upload' : 'url');
    setFormMediaUrl(idea.mediaUrl || '');
    setFormMediaType(idea.mediaType || 'none');
    setFormPreferredDate(idea.preferredDate || '');
    setFormPreferredSeason(idea.preferredSeason || '');
    setIsModalOpen(true);
  };

  // Toggle Platform selection in form
  const togglePlatform = (p: Platform) => {
    setFormPlatforms(prev => 
      prev.includes(p) ? (prev.length > 1 ? prev.filter(item => item !== p) : prev) : [...prev, p]
    );
  };

  // Toggle Label in form
  const toggleLabel = (label: string) => {
    setFormLabels(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const handleAddCustomLabel = () => {
    if (customLabelInput.trim() && !formLabels.includes(customLabelInput.trim())) {
      setFormLabels([...formLabels, customLabelInput.trim()]);
      setCustomLabelInput('');
    }
  };

  // Handle Image File Upload with Canvas Compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      // Direct base64 for small video preview or standard reader
      const reader = new FileReader();
      reader.onload = () => {
        setFormMediaUrl(reader.result as string);
        setFormMediaType('video');
      };
      reader.readAsDataURL(file);
    } else {
      // Compress image to ensure small size
      try {
        const compressedDataUrl = await compressImageFile(file, 900, 0.7);
        setFormMediaUrl(compressedDataUrl);
        setFormMediaType('image');
      } catch (err) {
        console.warn('Compression failed, using fallback', err);
        const reader = new FileReader();
        reader.onload = () => {
          setFormMediaUrl(reader.result as string);
          setFormMediaType('image');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Submit Idea Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast(isRtl ? 'يرجى كتابة عنوان الفكرة' : 'Please enter an idea title', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const ideaPayload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        labels: formLabels,
        platforms: formPlatforms,
        mediaUrl: formMediaUrl.trim() || undefined,
        mediaType: formMediaUrl.trim() ? formMediaType : 'none',
        preferredDate: formPreferredDate.trim() || undefined,
        preferredSeason: formPreferredSeason.trim() || undefined,
        status: editingIdea ? editingIdea.status : ('active' as const),
        createdBy: editingIdea ? editingIdea.createdBy : (currentUser?.name || 'Ahmed Ali'),
        votes: editingIdea ? (editingIdea.votes || 0) : 0
      };

      if (editingIdea) {
        await onUpdateIdea(editingIdea.id, ideaPayload);
        showToast(isRtl ? 'تم تحديث الفكرة بنجاح' : 'Idea updated successfully', 'success');
      } else {
        await onAddIdea(ideaPayload);
        showToast(isRtl ? 'تمت إضافة الفكرة التسويقية بنجاح! 💡' : 'Idea added successfully! 💡', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Failed to save idea', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upvote Idea
  const handleVote = async (idea: MarketingIdea, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onUpdateIdea(idea.id, { votes: (idea.votes || 0) + 1 });
    } catch (err) {
      console.warn(err);
    }
  };

  // Smart Week Recommendation Calculation
  const recommendedWeekInfo = useMemo(() => {
    if (!promotingIdea) return { week: 'Week 1', explanation: '' };

    const dateStr = promotingIdea.preferredDate;
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const day = d.getDate();
        const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const monthStr = monthNamesAr[d.getMonth()] || '';

        if (day <= 7) {
          return {
            week: 'Week 1',
            explanation: isRtl 
              ? `الموعد المفضل (${day} ${monthStr}) يقع في بداية الشهر (الأيام 1 - 7)، والأنسب له خطة الأسبوع الأول.`
              : `Target date (${day} ${monthStr}) is early in the month (Days 1-7). Recommended: Week 1.`
          };
        } else if (day <= 14) {
          return {
            week: 'Week 2',
            explanation: isRtl 
              ? `الموعد المفضل (${day} ${monthStr}) يقع في النصف الأول من الشهر (الأيام 8 - 14)، والأنسب له خطة الأسبوع الثاني.`
              : `Target date (${day} ${monthStr}) is in mid-early month (Days 8-14). Recommended: Week 2.`
          };
        } else if (day <= 21) {
          return {
            week: 'Week 3',
            explanation: isRtl 
              ? `الموعد المفضل (${day} ${monthStr}) يقع في منتصف الشهر (الأيام 15 - 21)، والأنسب له خطة الأسبوع الثالث.`
              : `Target date (${day} ${monthStr}) is mid-month (Days 15-21). Recommended: Week 3.`
          };
        } else {
          return {
            week: 'Week 4',
            explanation: isRtl 
              ? `الموعد المفضل (${day} ${monthStr}) يقع في أواخر الشهر (الأيام 22 فما بعد)، والأنسب له خطة الأسبوع الرابع.`
              : `Target date (${day} ${monthStr}) is late in the month (Days 22+). Recommended: Week 4.`
          };
        }
      }
    }

    if (promotingIdea.preferredSeason) {
      return {
        week: 'Week 2',
        explanation: isRtl 
          ? `بناءً على موسم الفكرة (${promotingIdea.preferredSeason})، نقترح التجهيز لها ضمن خطة الأسبوع الثاني.`
          : `Based on season (${promotingIdea.preferredSeason}), recommended: Week 2.`
      };
    }

    return {
      week: 'Week 1',
      explanation: isRtl 
        ? 'نظراً لعدم وجود موعد زمني محدد، يُقترح البدء في أقرب أسبوع قادم (الأسبوع 1).'
        : 'No specific date provided. Recommended for the upcoming Week 1.'
    };
  }, [promotingIdea, isRtl]);

  // Open Promote Modal
  const handleOpenPromote = (idea: MarketingIdea, e: React.MouseEvent) => {
    e.stopPropagation();
    setPromotingIdea(idea);
    const rec = recommendedWeekInfo;
    setSelectedTargetWeek(rec.week || 'Week 1');
  };

  // Confirm Promotion to Content Prep
  const handleConfirmPromotion = async () => {
    if (!promotingIdea) return;
    setIsPromoting(true);
    try {
      await onPromoteToContent(promotingIdea, selectedTargetWeek);
      showToast(
        isRtl 
          ? `تم اعتماد الفكرة ونقلها بنجاح إلى [${selectedTargetWeek}] في صفحة تحضير المحتوى! 🚀` 
          : `Idea promoted to [${selectedTargetWeek}] in Content Prep! 🚀`,
        'success'
      );
      setPromotingIdea(null);
    } catch (err) {
      console.error(err);
      showToast(isRtl ? 'حدث خطأ أثناء نقل الفكرة' : 'Promotion failed', 'error');
    } finally {
      setIsPromoting(false);
    }
  };

  // Filter and Sort ideas
  const filteredIdeas = useMemo(() => {
    return ideas.filter(item => {
      // Tab filter
      if (activeTab === 'active' && item.status !== 'active') return false;
      if (activeTab === 'archived' && item.status === 'active') return false;

      // Platform filter
      if (selectedPlatform !== 'All' && !item.platforms?.includes(selectedPlatform)) return false;

      // Label filter
      if (selectedLabel !== 'All' && !item.labels?.includes(selectedLabel)) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        const labelMatch = item.labels?.some(l => l.toLowerCase().includes(q));
        if (!titleMatch && !descMatch && !labelMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'votes') {
        return (b.votes || 0) - (a.votes || 0);
      }
      if (sortBy === 'timing') {
        if (!a.preferredDate) return 1;
        if (!b.preferredDate) return -1;
        return a.preferredDate.localeCompare(b.preferredDate);
      }
      // default newest
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [ideas, activeTab, selectedPlatform, selectedLabel, searchQuery, sortBy]);

  const activeCount = useMemo(() => ideas.filter(i => i.status === 'active').length, [ideas]);
  const archivedCount = useMemo(() => ideas.filter(i => i.status !== 'active').length, [ideas]);

  return (
    <div className="h-full flex flex-col space-y-6 overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-600">
              <Lightbulb size={24} className="animate-pulse" />
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {isRtl ? 'أفكار تسويقية' : 'Marketing Ideas'}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
              {activeCount} {isRtl ? 'فكرة نشطة' : 'Active'}
            </span>
          </div>
          <p className="text-xs font-bold text-gray-400 mt-1">
            {isRtl 
              ? 'بنك أفكار المحتوى التسويقي - ابتكر الأفكار، حدد مواعيدها، وانقل الأفضل مباشرة إلى خطة التحضير' 
              : 'Marketing ideation hub - generate, schedule, and promote top concepts directly into content prep'}
          </p>
        </div>

        {/* Action Button: New Idea */}
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-green-100 hover:shadow-2xl hover:shadow-green-200 transition-all cursor-pointer self-start md:self-auto active:scale-95"
        >
          <Plus size={20} />
          <span>{isRtl ? 'فكرة تسويقية جديدة' : 'New Marketing Idea'}</span>
        </button>
      </div>

      {/* Tabs and Control Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-3 shrink-0">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Main Switcher: Active vs Archive */}
          <div className="flex bg-gray-100 p-1 rounded-2xl items-center gap-1 shadow-inner self-start">
            <button
              onClick={() => setActiveIdeasTab('active')}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer",
                activeTab === 'active'
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Lightbulb size={16} />
              <span>{isRtl ? 'الأفكار النشطة' : 'Active Ideas'}</span>
              <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                {activeCount}
              </span>
            </button>
            <button
              onClick={() => setActiveIdeasTab('archived')}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer",
                activeTab === 'archived'
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Archive size={16} />
              <span>{isRtl ? 'الأرشيف والمعتمدة' : 'Archived & Promoted'}</span>
              <span className="bg-gray-200 text-gray-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                {archivedCount}
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'البحث عن فكرة أو وسم...' : 'Search ideas or tags...'}
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

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <span className="text-xs font-bold text-gray-400 hidden sm:inline">{isRtl ? 'ترتيب:' : 'Sort:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
            >
              <option value="newest">{isRtl ? 'الأحدث أولاً' : 'Newest'}</option>
              <option value="votes">{isRtl ? 'الأكثر تفاعلاً 👍' : 'Most Votes'}</option>
              <option value="timing">{isRtl ? 'الموعد المفضل 📅' : 'Target Date'}</option>
            </select>
          </div>
        </div>

        {/* Platforms and Labels Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-50">
          
          {/* Platform Filters */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {(['All', ...PLATFORMS] as (Platform | 'All')[]).map((p) => {
              const Icon = p === 'All' ? Layers : PLATFORM_ICONS[p];
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPlatform(p)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    selectedPlatform === p 
                      ? "bg-emerald-600 text-white shadow-sm" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <Icon size={13} />
                  <span>{p === 'All' ? (isRtl ? 'جميع المنصات' : 'All') : p}</span>
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block" />

          {/* Label Presets Filter */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedLabel('All')}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer",
                selectedLabel === 'All'
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {isRtl ? 'كل التصنيفات' : 'All Tags'}
            </button>
            {PRESET_LABELS.slice(0, 5).map((lbl) => (
              <button
                key={lbl}
                onClick={() => setSelectedLabel(selectedLabel === lbl ? 'All' : lbl)}
                className={cn(
                  "px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border",
                  selectedLabel === lbl
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                )}
              >
                #{lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ideas Grid Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-16">
        {filteredIdeas.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 space-y-4 my-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Lightbulb size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-gray-800">
                {activeTab === 'active' 
                  ? (isRtl ? 'لا توجد أفكار تسويقية نشطة حالياً' : 'No active marketing ideas') 
                  : (isRtl ? 'الأرشيف فارغ حالياً' : 'Archive is empty')}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {isRtl 
                  ? 'ابدأ بإضافة فكرة تسويقية جديدة، أو قم بتغيير الفلاتر الحالية لعرض أفكار أخرى.' 
                  : 'Start by adding a new marketing idea, or adjust filters to view more.'}
              </p>
            </div>
            {activeTab === 'active' && (
              <button
                onClick={handleOpenAddModal}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-green-100 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Plus size={16} />
                <span>{isRtl ? 'إضافة أول فكرة' : 'Add First Idea'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredIdeas.map((idea) => {
              const isApproved = idea.status === 'approved';

              return (
                <div
                  key={idea.id}
                  className={cn(
                    "bg-white rounded-[2rem] border transition-all duration-300 hover:shadow-xl hover:shadow-green-50/50 flex flex-col justify-between overflow-hidden group relative",
                    isApproved ? "border-emerald-200 bg-emerald-50/10" : "border-gray-200 hover:border-green-400"
                  )}
                >
                  {/* Card Header & Media */}
                  <div>
                    {/* Media Thumbnail if present */}
                    {idea.mediaUrl && (
                      <div className="relative aspect-video w-full bg-gray-900 overflow-hidden border-b border-gray-100">
                        {idea.mediaType === 'video' ? (
                          <video src={idea.mediaUrl} controls className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src={idea.mediaUrl}
                            alt={idea.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                          {idea.mediaType === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                          <span>{idea.mediaType === 'video' ? (isRtl ? 'فيديو' : 'Video') : (isRtl ? 'صورة' : 'Image')}</span>
                        </span>
                      </div>
                    )}

                    <div className="p-5 space-y-3">
                      {/* Meta Top: Platforms & Status */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Platforms */}
                        <div className="flex items-center gap-1">
                          {(idea.platforms || []).map((p) => {
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
                        </div>

                        {/* Status Badge */}
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 size={12} />
                            <span>{isRtl ? `معتمدة (${idea.promotedWeek || 'تحضير'})` : `Promoted (${idea.promotedWeek})`}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>{isRtl ? 'فكرة نشطة' : 'Active Idea'}</span>
                          </span>
                        )}
                      </div>

                      {/* Idea Title */}
                      <h3 className="text-base font-black text-gray-900 group-hover:text-green-700 transition-colors line-clamp-2">
                        {idea.title}
                      </h3>

                      {/* Description */}
                      {idea.description && (
                        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                          {idea.description}
                        </p>
                      )}

                      {/* Labels Chips */}
                      {idea.labels && idea.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {idea.labels.map((lbl, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-gray-100 text-gray-700 border border-gray-200"
                            >
                              #{lbl}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Timing & Season Badge */}
                      {(idea.preferredDate || idea.preferredSeason) && (
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100/80 flex items-center justify-between text-xs font-bold text-amber-900">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-amber-600 shrink-0" />
                            <span>{idea.preferredDate ? idea.preferredDate : idea.preferredSeason}</span>
                          </div>
                          {idea.preferredDate && idea.preferredSeason && (
                            <span className="text-[10px] text-amber-700 font-medium truncate max-w-[120px]">
                              {idea.preferredSeason}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Upvotes & Actions */}
                  <div className="p-5 pt-0">
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      
                      {/* Left: Author & Votes */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleVote(idea, e)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-700 border border-gray-200 text-xs font-bold transition-all cursor-pointer"
                          title={isRtl ? 'إعجاب بالفكرة' : 'Upvote idea'}
                        >
                          <ThumbsUp size={13} />
                          <span>{idea.votes || 0}</span>
                        </button>

                        <span className="text-[10px] font-bold text-gray-400">
                          {idea.createdBy}
                        </span>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(idea)}
                          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                          title={isRtl ? 'تعديل الفكرة' : 'Edit Idea'}
                        >
                          <Edit3 size={15} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذه الفكرة؟' : 'Delete this idea?')) {
                              onDeleteIdea(idea.id);
                            }
                          }}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                          title={isRtl ? 'حذف الفكرة' : 'Delete'}
                        >
                          <Trash2 size={15} />
                        </button>

                        {/* Promote Button (If Active) */}
                        {!isApproved && (
                          <button
                            onClick={(e) => handleOpenPromote(idea, e)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl text-xs font-black shadow-md shadow-green-100 hover:shadow-lg transition-all cursor-pointer"
                            title={isRtl ? 'اعتماد ونقل إلى تحضير المحتوى' : 'Promote to Content Prep'}
                          >
                            <Zap size={14} className="fill-white" />
                            <span>{isRtl ? 'اعتماد ونقل للخطة' : 'Promote'}</span>
                          </button>
                        )}

                        {/* If already promoted: quick jump to content prep */}
                        {isApproved && (
                          <button
                            onClick={() => setActiveTab('preparation')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-xl text-xs font-black transition-all cursor-pointer"
                          >
                            <span>{isRtl ? 'عرض في الخطة' : 'View in Prep'}</span>
                            <ExternalLink size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Add / Edit Idea Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl border border-gray-100 shadow-2xl p-6 md:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Lightbulb size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">
                      {editingIdea 
                        ? (isRtl ? 'تعديل الفكرة التسويقية' : 'Edit Marketing Idea')
                        : (isRtl ? 'إضافة فكرة تسويقية جديدة' : 'New Marketing Idea')}
                    </h3>
                    <p className="text-xs text-gray-400 font-bold">
                      {isRtl 
                        ? 'دوّن فكرتك التسويقية بالتفصيل ليتم اعتمادها ونقلها إلى خطة المحتوى' 
                        : 'Capture your idea details to approve and schedule into content plan'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitForm} className="space-y-5">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700">
                    {isRtl ? 'عنوان الفكرة *' : 'Idea Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={isRtl ? "مثال: ريلز مقارنة بين التسميد الحيوي والكيماوي في موسم القمح" : "e.g. Bio-fertilizer comparison reel for wheat harvest"}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs md:text-sm font-bold focus:bg-white focus:border-green-600 focus:outline-none transition-all"
                  />
                </div>

                {/* Target Platforms */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700">
                    {isRtl ? 'المنصات المستهدفة' : 'Target Platforms'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => {
                      const Icon = PLATFORM_ICONS[p];
                      const isSelected = formPlatforms.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => togglePlatform(p)}
                          className={cn(
                            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                            isSelected
                              ? "bg-green-600 text-white border-green-600 shadow-sm"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          )}
                        >
                          <Icon size={14} />
                          <span>{p}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Labels & Tags */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-700">
                    {isRtl ? 'التصنيفات والليبل (Tags)' : 'Labels & Tags'}
                  </label>
                  
                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_LABELS.map((lbl) => {
                      const isSelected = formLabels.includes(lbl);
                      return (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => toggleLabel(lbl)}
                          className={cn(
                            "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                            isSelected
                              ? "bg-emerald-700 text-white border-emerald-700"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          )}
                        >
                          #{lbl}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom label input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={customLabelInput}
                      onChange={(e) => setCustomLabelInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomLabel();
                        }
                      }}
                      placeholder={isRtl ? "إضافة وسم مخصص..." : "Add custom tag..."}
                      className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomLabel}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {isRtl ? 'إضافة' : 'Add'}
                    </button>
                  </div>
                </div>

                {/* Description / Copy / Script */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700">
                    {isRtl ? 'تفاصيل الفكرة والاسكريبت المقترح' : 'Idea Content / Script Details'}
                  </label>
                  <textarea
                    rows={4}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder={isRtl 
                      ? "اكتب فكرة المحتوى، الـ Hook، النقاط الرئيسية، أو رسالة الفيديو بالتفصيل..." 
                      : "Describe the content hook, core message, or suggested script..."}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs md:text-sm font-medium focus:bg-white focus:border-green-600 focus:outline-none transition-all leading-relaxed"
                  />
                </div>

                {/* Preferred Timing & Season */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Target Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                      <Calendar size={14} className="text-green-600" />
                      <span>{isRtl ? 'الموعد المفضل للتنفيذ' : 'Preferred Date'}</span>
                    </label>
                    <input
                      type="date"
                      value={formPreferredDate}
                      onChange={(e) => setFormPreferredDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Preferred Season */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" />
                      <span>{isRtl ? 'الموسم أو المناسبة المرتبطة' : 'Season / Event'}</span>
                    </label>
                    <select
                      value={formPreferredSeason}
                      onChange={(e) => setFormPreferredSeason(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none cursor-pointer"
                    >
                      <option value="">{isRtl ? 'اختر الموسم (اختياري)...' : 'Select season (optional)...'}</option>
                      {PRESET_SEASONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Media Upload or Link */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-blue-600" />
                      <span>{isRtl ? 'وسائط أو تغذية بصرية (ميديا)' : 'Media / Visual Reference'}</span>
                    </label>

                    <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setMediaMode('upload')}
                        className={cn(
                          "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                          mediaMode === 'upload' ? "bg-white text-green-700 shadow-xs" : "text-gray-500"
                        )}
                      >
                        {isRtl ? 'رفع ملف' : 'Upload File'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMediaMode('url')}
                        className={cn(
                          "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                          mediaMode === 'url' ? "bg-white text-green-700 shadow-xs" : "text-gray-500"
                        )}
                      >
                        {isRtl ? 'رابط مباشر' : 'Direct Link'}
                      </button>
                    </div>
                  </div>

                  {mediaMode === 'upload' ? (
                    <div>
                      <input
                        type="file"
                        id="idea-media-file"
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="idea-media-file"
                        className="border-2 border-dashed border-gray-200 hover:border-green-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-gray-50 hover:bg-green-50/20 transition-all text-center"
                      >
                        <Upload size={20} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-600">
                          {isRtl ? 'اضغط لاختيار صورة أو فيديو للفكرة' : 'Click to select image or video'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {isRtl ? 'الصور تُضغط تلقائياً لسرعة التحميل والحفظ' : 'Images automatically optimized'}
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="url"
                        value={formMediaUrl}
                        onChange={(e) => {
                          setFormMediaUrl(e.target.value);
                          if (e.target.value.includes('.mp4') || e.target.value.includes('youtube') || e.target.value.includes('tiktok')) {
                            setFormMediaType('video');
                          } else {
                            setFormMediaType('image');
                          }
                        }}
                        placeholder={isRtl ? "ضع رابط الصورة أو الفيديو المرجعي هنا..." : "https://example.com/reference-media.jpg"}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Preview if media present */}
                  {formMediaUrl && (
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 max-h-48 aspect-video bg-gray-900 group">
                      {formMediaType === 'video' ? (
                        <video src={formMediaUrl} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={formMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setFormMediaUrl('');
                          setFormMediaType('none');
                        }}
                        className="absolute top-2 left-2 p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md cursor-pointer"
                        title={isRtl ? 'إزالة الوسائط' : 'Remove media'}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black shadow-lg shadow-green-100 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSubmitting 
                      ? (isRtl ? 'جاري الحفظ...' : 'Saving...') 
                      : (editingIdea ? (isRtl ? 'حفظ التعديلات' : 'Update Idea') : (isRtl ? 'إضافة الفكرة 💡' : 'Add Idea 💡'))}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Smart Week Recommendation Modal (Promote to Content Prep) */}
      <AnimatePresence>
        {promotingIdea && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg border border-gray-100 shadow-2xl p-6 md:p-8 space-y-6"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <Zap size={28} className="fill-emerald-600" />
                </div>
                <h3 className="text-xl font-black text-gray-900">
                  {isRtl ? 'اعتماد ونقل إلى تحضير المحتوى' : 'Promote to Content Preparation'}
                </h3>
                <p className="text-xs text-gray-500">
                  {isRtl ? 'سيتم تحويل هذه الفكرة إلى كارت محتوى رسمي في خطة النشر' : 'Convert idea into an official content item'}
                </p>
              </div>

              {/* Idea Snippet */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1 text-right">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {isRtl ? 'الفكرة المحددة:' : 'Selected Idea:'}
                </span>
                <h4 className="text-sm font-black text-gray-900 line-clamp-1">{promotingIdea.title}</h4>
                {promotingIdea.preferredDate && (
                  <div className="text-xs text-amber-800 font-bold flex items-center gap-1.5 pt-1">
                    <Calendar size={13} className="text-amber-600" />
                    <span>{isRtl ? `الموعد المفضل: ${promotingIdea.preferredDate}` : `Target: ${promotingIdea.preferredDate}`}</span>
                  </div>
                )}
              </div>

              {/* Smart Recommendation Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/80 space-y-2 text-right">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-black">
                  <Sparkles size={16} className="text-emerald-600" />
                  <span>{isRtl ? '🎯 الاقتراح الذكي لتوقيت النشر:' : '🎯 Smart Week Recommendation:'}</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed font-bold">
                  {recommendedWeekInfo.explanation}
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600">{isRtl ? 'الأسبوع المقترح:' : 'Recommended:'}</span>
                  <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-sm">
                    {isRtl ? recommendedWeekInfo.week.replace('Week', 'الأسبوع') : recommendedWeekInfo.week}
                  </span>
                </div>
              </div>

              {/* Week Selector / Override */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-700 block text-right">
                  {isRtl ? 'اختر أسبوع خطة المحتوى (أو وافق على الاقتراح):' : 'Select Target Week in Content Prep:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedTargetWeek(w)}
                      className={cn(
                        "py-3 rounded-2xl text-xs font-black transition-all cursor-pointer border text-center",
                        selectedTargetWeek === w
                          ? "bg-green-600 text-white border-green-600 shadow-md shadow-green-100"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      )}
                    >
                      {isRtl ? w.replace('Week', 'الأسبوع') : w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPromotingIdea(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black text-xs transition-colors cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPromotion}
                  disabled={isPromoting}
                  className="flex-2 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-2xl font-black text-xs shadow-xl shadow-green-100 hover:shadow-2xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  <span>
                    {isPromoting 
                      ? (isRtl ? 'جاري الاعتماد والنقل...' : 'Promoting...') 
                      : (isRtl ? `موافق على ${selectedTargetWeek.replace('Week', 'الأسبوع')} ونقل الآن ✓` : `Confirm & Promote to ${selectedTargetWeek} ✓`)}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
