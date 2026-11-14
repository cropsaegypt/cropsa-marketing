import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  Calendar, 
  Layout, 
  Type, 
  Target, 
  DollarSign, 
  User,
  Facebook,
  Instagram,
  Linkedin,
  Video,
  MessageCircle,
  Hash,
  Check,
  Sparkles,
  Loader2,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { translations } from '../translations';
import { Language, Platform, ContentType, Priority, ContentStatus, ContentItem, User as UserType } from '../types';
import { cn } from '../lib/utils';
import { generateMarketingContent } from '../lib/gemini';
import { uploadMediaFile } from '../lib/storage';
import { showToast } from './Toast';

interface NewContentModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<ContentItem, 'id'>) => void;
  users: UserType[];
}

const PLATFORMS: Platform[] = ['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'WhatsApp'];
const TYPES: ContentType[] = ['Hybrid', 'Video', 'Image', 'Carousel', 'Story', 'Post', 'Reel'];
const PRIORITIES: Priority[] = ['High', 'Normal', 'Low'];
const OBJECTIVES = ['Trust', 'Clinic', 'Service', 'Education', 'Engagement'];

const PRESET_TOPICS = [
  'نصائح حصاد القمح وتجنب الهدر في الغلة',
  'مكافحة العفن البني في محصول البطاطس بالدلتا',
  'طرق تقليل استهلاك مياه الري والتسميد عبر تطبيق كروبسا',
  'تطبيق كروبسا للمستثمرين وأصحاب المشاريع الزراعية الحديثة',
  'التعامل مع موجات الحر الشديدة على أشجار المانجو والموالح'
];

export const NewContentModal: React.FC<NewContentModalProps> = ({ lang, isOpen, onClose, onAdd, users }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [formData, setFormData] = useState({
    title: '',
    platforms: ['Facebook'] as Platform[],
    type: 'Image' as ContentType,
    caption: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'Normal' as Priority,
    objective: 'Trust',
    assignedTo: [] as string[],
    paid: false,
    week: 'Week 1',
    mediaUrl: ''
  });

  // AI Generator state
  const [showAiAssist, setShowAiAssist] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState<'Egyptian Farmer (عامية زراعية)' | 'Professional AgriTech (رسمي متخصص)' | 'Persuasive Marketing (تسويقي تفاعلي)' | 'Educational (إرشادي زراعي)'>('Egyptian Farmer (عامية زراعية)');
  const [aiAudience, setAiAudience] = useState('مزارعي الدلتا والصعيد وأصحاب الأراضي');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // File Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleGenerateAi = async () => {
    if (!aiTopic.trim()) {
      showToast(isRtl ? 'يرجى كتابة موضوع المنشور أو اختيار أحد المقترحات' : 'Please enter a topic or select a suggestion', 'warning');
      return;
    }

    setIsAiGenerating(true);
    try {
      const generated = await generateMarketingContent({
        topic: aiTopic,
        platform: formData.platforms[0] || 'Facebook',
        contentType: formData.type,
        objective: formData.objective,
        tone: aiTone,
        targetAudience: aiAudience,
        lang: lang
      });

      const fullDescription = `${generated.description}\n\n${generated.cta}\n\n${generated.hashtags.join(' ')}`;

      setFormData(prev => ({
        ...prev,
        title: generated.title || prev.title || aiTopic,
        caption: generated.caption || prev.caption,
        description: fullDescription
      }));

      showToast(
        isRtl ? 'تم توليد المحتوى بنجاح عبر Gemini AI!' : 'Content generated successfully with Gemini AI!',
        'success'
      );
      setShowAiAssist(false);
    } catch (err: any) {
      console.error('AI Generation error:', err);
      showToast(
        isRtl ? 'تعذر توليد المحتوى بالذكاء الاصطناعي. تأكد من إعداد GEMINI_API_KEY.' : (err.message || 'AI Generation failed. Check API key.'),
        'error'
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadMediaFile(file, 'campaign-covers', (progress) => {
        setUploadProgress(progress);
      });

      setFormData(prev => ({
        ...prev,
        mediaUrl: result.url
      }));

      showToast(
        isRtl ? `تم رفع الملف (${result.name}) بنجاح!` : `File (${result.name}) uploaded successfully!`,
        'success'
      );
    } catch (err: any) {
      console.error('Upload error:', err);
      showToast(isRtl ? 'حدث خطأ أثناء رفع الملف' : 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.platforms.length === 0) {
      showToast(isRtl ? 'يرجى اختيار منصة واحدة على الأقل' : 'Please select at least one platform', 'warning');
      return;
    }
    onAdd({
      ...formData,
      status: 'Idea',
      approvalStatus: 'Pending',
      createdBy: 'Admin',
      tasks: [],
      comments: [],
      attachments: formData.mediaUrl ? [{
        id: `att-${Date.now()}`,
        name: formData.title || 'Attached Media',
        url: formData.mediaUrl,
        type: formData.type === 'Video' ? 'video' : 'image',
        date: new Date().toISOString()
      }] : []
    });
    onClose();
    showToast(isRtl ? 'تمت إضافة المحتوى بنجاح إلى جدول التحضير' : 'Content added successfully to prep table', 'success');
    
    // Reset form
    setFormData({
      title: '',
      platforms: ['Facebook'],
      type: 'Image',
      caption: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'Normal',
      objective: 'Trust',
      assignedTo: [],
      paid: false,
      week: 'Week 1',
      mediaUrl: ''
    });
    setAiTopic('');
  };

  const togglePlatform = (p: Platform) => {
    setFormData(prev => {
      const platforms = prev.platforms.includes(p)
        ? prev.platforms.filter(item => item !== p)
        : [...prev.platforms, p];
      return { ...prev, platforms };
    });
  };

  const toggleAssignee = (name: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(name) 
        ? prev.assignedTo.filter(u => u !== name) 
        : [...prev.assignedTo, name]
    }));
  };

  const getPlatformIcon = (p: Platform) => {
    switch (p) {
      case 'Facebook': return <Facebook size={16} />;
      case 'Instagram': return <Instagram size={16} />;
      case 'LinkedIn': return <Linkedin size={16} />;
      case 'TikTok': return <Video size={16} />;
      case 'WhatsApp': return <MessageCircle size={16} />;
      default: return <Hash size={16} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="p-8 md:p-10 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-green-200">
                  <Plus size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t.newContent}</h2>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest italic">
                    {isRtl ? 'إضافة محتوى جديد لجدول التحضير' : 'Add new content to preparation schedule'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAiAssist(!showAiAssist)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all shadow-sm",
                    showAiAssist 
                      ? "bg-purple-600 text-white shadow-purple-200 ring-4 ring-purple-100" 
                      : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                  )}
                >
                  <Sparkles size={16} className={showAiAssist ? "animate-spin" : ""} />
                  {isRtl ? 'مساعد الذكاء الاصطناعي (Gemini)' : 'Gemini AI Assistant'}
                </button>
                <button 
                  onClick={onClose}
                  className="p-4 hover:bg-white hover:shadow-sm rounded-2xl transition-all text-gray-400 hover:text-gray-900"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* AI Assistant Drawer */}
            <AnimatePresence>
              {showAiAssist && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-gradient-to-br from-purple-50/80 via-emerald-50/40 to-white border-b border-purple-100 p-8 space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-purple-600" size={20} />
                      <h3 className="text-base font-black text-purple-900">
                        {isRtl ? 'توليد محتوى زراعي ذكي بضغطة زر' : 'Smart AgriTech Copy Generator'}
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-purple-600 bg-purple-100/80 px-3 py-1 rounded-full">
                      Powered by Gemini 2.0 Flash
                    </span>
                  </div>

                  {/* Preset Quick Chips */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                      {isRtl ? 'أفكار ومواضيع شائعة:' : 'Quick Presets:'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_TOPICS.map((topic, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAiTopic(topic)}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-purple-100 hover:border-purple-300 hover:bg-purple-50 text-gray-700 transition-all text-start"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black text-gray-600">
                        {isRtl ? 'موضوع أو فكرة المنشور' : 'Post Topic or Idea'}
                      </label>
                      <input
                        type="text"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder={isRtl ? 'مثال: نصائح لمزارعي الطماطم لتجنب سوسة الطماطم...' : 'e.g. Tips for wheat growers during harvest...'}
                        className="w-full px-5 py-3.5 bg-white border border-purple-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-purple-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-600">
                        {isRtl ? 'نبرة الصوت (Tone)' : 'Tone of Voice'}
                      </label>
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value as any)}
                        className="w-full px-4 py-3.5 bg-white border border-purple-200 rounded-2xl font-bold text-xs outline-none focus:ring-4 focus:ring-purple-100"
                      >
                        <option value="Egyptian Farmer (عامية زراعية)">عامية زراعية مصرية (أصيل وقريب للفلاح)</option>
                        <option value="Professional AgriTech (رسمي متخصص)">رسمي متخصص (للمهندسين والشركات)</option>
                        <option value="Persuasive Marketing (تسويقي تفاعلي)">تسويقي بيعي تفاعلي</option>
                        <option value="Educational (إرشادي زراعي)">إرشادي وتوعوي</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs font-bold text-gray-400">
                      {isRtl ? 'سيقوم الذكاء الاصطناعي بكتابة العنوان، الكابشن، والنص بالكامل مع الهاشتاجات.' : 'AI will generate the title, caption, body, and relevant hashtags.'}
                    </p>
                    <button
                      type="button"
                      disabled={isAiGenerating}
                      onClick={handleGenerateAi}
                      className="flex items-center gap-2 px-8 py-3.5 bg-purple-600 text-white rounded-2xl font-black text-xs hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 disabled:opacity-50"
                    >
                      {isAiGenerating ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {isRtl ? 'جاري التوليد الذكي...' : 'Generating...'}
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          {isRtl ? 'توليد المحتوى الآن' : 'Generate Content'}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       {t.title}
                    </label>
                    <input 
                      required
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder={isRtl ? "عنوان المحتوى..." : "Content title..."}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-green-100 focus:bg-white outline-none transition-all text-sm font-bold shadow-inner"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       {t.platform}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PLATFORMS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => togglePlatform(p)}
                          className={cn(
                            "flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all border shadow-sm",
                            formData.platforms.includes(p) 
                              ? "bg-green-600 text-white border-green-600 shadow-green-100" 
                              : "bg-white text-gray-500 border-gray-100 hover:border-green-200"
                          )}
                        >
                          {getPlatformIcon(p)}
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       {t.type}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({...formData, type})}
                          className={cn(
                            "px-5 py-3 rounded-xl text-xs font-bold transition-all border shadow-sm",
                            formData.type === type 
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-100" 
                              : "bg-white text-gray-500 border-gray-100 hover:border-indigo-200"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Media Upload / Attachment */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon size={14} />
                      {isRtl ? 'صورة الغلاف أو التصميم' : 'Cover Image / Design'}
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex items-center justify-center gap-3 px-5 py-3.5 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-2xl cursor-pointer transition-all text-xs font-bold text-gray-600">
                        <Upload size={16} />
                        <span>{isUploading ? `${isRtl ? 'جاري الرفع' : 'Uploading'} (${uploadProgress}%)...` : (isRtl ? 'رفع تصميم أو صورة' : 'Upload Design or Photo')}</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                      {formData.mediaUrl && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                          <img src={formData.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       {t.dueDate}
                    </label>
                    <input 
                      type="date" 
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-green-100 focus:bg-white outline-none transition-all text-sm font-bold shadow-inner"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       {t.assignedTo}
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                      {users.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleAssignee(user.name)}
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-2xl border transition-all text-left group",
                            formData.assignedTo.includes(user.name)
                              ? "bg-green-50 border-green-500 ring-2 ring-green-100 shadow-sm"
                              : "bg-gray-50 border-gray-50 hover:border-gray-200 hover:bg-white"
                          )}
                        >
                          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 shadow-sm transition-colors", formData.assignedTo.includes(user.name) ? "bg-green-600 text-white" : "bg-white text-gray-400 group-hover:bg-green-100 group-hover:text-green-700")}>
                            {user.name?.[0] || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase truncate">{user.role}</p>
                          </div>
                          {formData.assignedTo.includes(user.name) && <Check size={14} className="text-green-600" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                     <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.priority}</label>
                        <select 
                          value={formData.priority}
                          onChange={(e) => setFormData({...formData, priority: e.target.value as Priority})}
                          className="w-full px-3 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-green-100 appearance-none shadow-inner"
                        >
                          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.objective}</label>
                        <select 
                          value={formData.objective}
                          onChange={(e) => setFormData({...formData, objective: e.target.value})}
                          className="w-full px-3 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-green-100 appearance-none shadow-inner"
                        >
                          {OBJECTIVES.map(obj => <option key={obj} value={obj}>{obj}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{isRtl ? 'الأسبوع' : 'Week'}</label>
                        <select 
                          value={formData.week}
                          onChange={(e) => setFormData({...formData, week: e.target.value})}
                          className="w-full px-3 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-green-100 appearance-none shadow-inner"
                        >
                          {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(w => (
                            <option key={w} value={w}>{isRtl ? w.replace('Week', 'الأسبوع') : w}</option>
                          ))}
                        </select>
                     </div>
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{isRtl ? 'الكابشن والافتتاحية' : 'Caption & Hook'}</label>
                    <textarea 
                      value={formData.caption}
                      onChange={(e) => setFormData({...formData, caption: e.target.value})}
                      placeholder={isRtl ? "اكتب الافتتاحية أو النص الجذاب هنا..." : "Write the hook or caption here..."}
                      className="w-full h-32 px-6 py-4 bg-gray-50 border border-gray-100 rounded-[2rem] outline-none focus:ring-4 focus:ring-green-100 focus:bg-white transition-all text-sm font-bold shadow-inner resize-none relative"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{isRtl ? 'نص المنشور الكامل والهاشتاجات' : 'Full Post Body & Hashtags'}</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder={isRtl ? "تفاصيل المنشور، التوصيات، والهاشتاجات..." : "Full post copy, recommendations, and hashtags..."}
                      className="w-full h-32 px-6 py-4 bg-gray-50 border border-gray-100 rounded-[2rem] outline-none focus:ring-4 focus:ring-green-100 focus:bg-white transition-all text-sm font-bold shadow-inner resize-none"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-8 md:p-10 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-6">
              <button 
                type="button"
                onClick={onClose}
                className="px-8 py-4 text-sm font-black text-gray-400 hover:text-gray-900 transition-all uppercase tracking-widest"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleSubmit}
                className="px-12 py-4 bg-green-600 text-white rounded-2xl text-sm font-black hover:bg-green-700 transition-all shadow-2xl shadow-green-200 active:scale-95"
              >
                {t.add} {t.newContent}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
