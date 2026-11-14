import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Tag, 
  Share2, 
  ChevronRight,
  Facebook,
  Instagram,
  Linkedin,
  Video,
  MessageCircle,
  Hash,
  Sparkles,
  Search,
  Filter,
  Clock,
  Plus,
  X,
  AlertCircle,
  Edit2,
  Trash2
} from 'lucide-react';
import { translations } from '../translations';
import { Language, Platform } from '../types';
import { cn } from '../lib/utils';

interface Event {
  id: string;
  title: string;
  date: string;
  category: 'Agricultural' | 'National' | 'Religious';
  description: string;
  recommendations: Platform[];
  importance: 'High' | 'Medium' | 'Low';
  preparationDate?: string;
}

const PLATFORM_ICONS: Record<Platform, any> = {
  'Facebook': Facebook,
  'Instagram': Instagram,
  'LinkedIn': Linkedin,
  'TikTok': Video,
  'WhatsApp': MessageCircle,
  'Other': Hash,
};

interface AgriEventsProps {
  lang: Language;
  events: Event[];
  onUpdateEvents: (events: Event[]) => void;
  onAddContent: (title: string, platforms: Platform[], preparationDate: string, eventObj: Event) => void;
}

export const AgriEvents: React.FC<AgriEventsProps> = ({ lang, events, onUpdateEvents, onAddContent }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    date: '',
    category: 'Agricultural',
    description: '',
    recommendations: [],
    importance: 'Medium',
    preparationDate: ''
  });

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || e.category === filter;
    return matchesSearch && matchesFilter;
  });

  const handleOpenModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setNewEvent(event);
    } else {
      setEditingEvent(null);
      setNewEvent({
        title: '',
        date: '',
        category: 'Agricultural',
        description: '',
        recommendations: [],
        importance: 'Medium',
        preparationDate: ''
      });
    }
    setShowAddModal(true);
  };

  const handleSave = () => {
    if (!newEvent.title || !newEvent.date) return;
    if (editingEvent) {
      const updatedEvent: Event = {
        ...editingEvent,
        title: newEvent.title!,
        date: newEvent.date!,
        category: (newEvent.category as any) || 'Agricultural',
        description: newEvent.description || '',
        recommendations: newEvent.recommendations || [],
        importance: (newEvent.importance as any) || 'Medium',
        preparationDate: newEvent.preparationDate || ''
      };
      onUpdateEvents(events.map(e => e.id === editingEvent.id ? updatedEvent : e));
      if (updatedEvent.recommendations && updatedEvent.recommendations.length > 0) {
        onAddContent(updatedEvent.title, updatedEvent.recommendations, updatedEvent.preparationDate || '', updatedEvent);
      }
    } else {
      const event: Event = {
        id: Math.random().toString(36).substr(2, 9),
        title: newEvent.title!,
        date: newEvent.date!,
        category: (newEvent.category as any) || 'Agricultural',
        description: newEvent.description || '',
        recommendations: newEvent.recommendations || [],
        importance: (newEvent.importance as any) || 'Medium',
        preparationDate: newEvent.preparationDate || ''
      };
      onUpdateEvents([event, ...events]);
      if (event.recommendations && event.recommendations.length > 0) {
        onAddContent(event.title, event.recommendations, event.preparationDate || '', event);
      }
    }
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(isRtl ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      onUpdateEvents(events.filter(e => e.id !== id));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{t.events}</h2>
          <p className="text-gray-500 text-sm font-medium">
            {isRtl ? 'اكتشف أهم المناسبات وخطط لمحتواك مسبقاً' : 'Discover key events and plan your content in advance'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-2xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
          >
            <Plus size={20} />
            {isRtl ? 'إضافة مناسبة' : 'Add Event'}
          </button>
          <div className="relative group">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors", isRtl ? "right-4" : "left-4")} size={18} />
            <input 
              type="text"
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none w-full sm:w-64 transition-all shadow-sm",
                isRtl ? "pr-12 pl-6" : "pl-12 pr-6"
              )}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEvents.map((event) => (
          <motion.div 
            key={event.id}
            whileHover={{ y: -4 }}
            className="bg-white rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-xl hover:border-green-200 transition-all overflow-hidden group"
          >
            <div className="p-8 flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                    event.category === 'Agricultural' ? "bg-green-50 text-green-600 shadow-green-100" :
                    event.category === 'National' ? "bg-blue-50 text-blue-600 shadow-blue-100" :
                    "bg-purple-50 text-purple-600 shadow-purple-100"
                  )}>
                    <CalendarIcon size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 mb-1">{event.title}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                      <Clock size={14} />
                      <span>{event.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                    event.importance === 'High' ? "bg-red-50 text-red-600" :
                    event.importance === 'Medium' ? "bg-orange-50 text-orange-600" :
                    "bg-blue-50 text-blue-600"
                  )}>
                    {event.importance}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(event)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(event.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-8 flex-1">
                {event.description}
              </p>

              <div className="space-y-4 pt-6 border-t border-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={14} className="text-yellow-500" />
                    {isRtl ? 'الترشيح للنشر' : 'Recommended Platforms'}
                  </span>
                  <div className="flex gap-2">
                    {event.recommendations.map(p => {
                      const Icon = PLATFORM_ICONS[p];
                      return (
                        <div key={p} className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all cursor-help" title={p}>
                          <Icon size={16} />
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <button 
                  onClick={() => onAddContent(event.title, event.recommendations || [], event.preparationDate || '', event)}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2 group/btn shadow-xl shadow-gray-100"
                >
                  {isRtl ? 'إنشاء محتوى لهذه المناسبة' : 'Create Content for this Event'}
                  <ChevronRight size={18} className={cn("transition-transform group-hover/btn:translate-x-1", isRtl && "rotate-180 group-hover/btn:-translate-x-1")} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-gray-900">{editingEvent ? (isRtl ? 'تعديل مناسبة' : 'Edit Event') : (isRtl ? 'إضافة مناسبة جديدة' : 'Add New Event')}</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{isRtl ? 'عنوان المناسبة' : 'Event Title'}</label>
                  <input 
                    type="text" 
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder={isRtl ? 'مثلاً: عيد الحصاد' : 'e.g. Harvest Festival'}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{isRtl ? 'التاريخ' : 'Date'}</label>
                    <input 
                      type="date" 
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{isRtl ? 'التصنيف' : 'Category'}</label>
                    <select 
                      value={newEvent.category}
                      onChange={(e) => setNewEvent({...newEvent, category: e.target.value as any})}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold"
                    >
                      <option value="Agricultural">{isRtl ? 'زراعي' : 'Agricultural'}</option>
                      <option value="National">{isRtl ? 'وطني' : 'National'}</option>
                      <option value="Religious">{isRtl ? 'ديني' : 'Religious'}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{isRtl ? 'يوم التحضير لمحتوى المناسبة' : 'Preparation Date for Content'}</label>
                  <input 
                    type="date" 
                    value={newEvent.preparationDate || ''}
                    onChange={(e) => setNewEvent({...newEvent, preparationDate: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{isRtl ? 'الوصف' : 'Description'}</label>
                  <textarea 
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    rows={3}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{isRtl ? 'الأهمية' : 'Importance'}</label>
                  <div className="flex gap-2">
                    {['High', 'Medium', 'Low'].map(imp => (
                      <button
                        key={imp}
                        onClick={() => setNewEvent({...newEvent, importance: imp as any})}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                          newEvent.importance === imp 
                            ? "bg-gray-900 text-white border-gray-900" 
                            : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                        )}
                      >
                        {imp}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{isRtl ? 'منصات مقترحة' : 'Platforms'}</label>
                  <div className="flex flex-wrap gap-2">
                    {['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'WhatsApp'].map(p => (
                      <button 
                        key={p}
                        onClick={() => {
                          const platforms = newEvent.recommendations || [];
                          if (platforms.includes(p as any)) {
                            setNewEvent({...newEvent, recommendations: platforms.filter(x => x !== p)});
                          } else {
                            setNewEvent({...newEvent, recommendations: [...platforms, p as any]});
                          }
                        }}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all",
                          newEvent.recommendations?.includes(p as any) ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-4 bg-green-600 text-white rounded-2xl text-sm font-bold hover:bg-green-700 transition-all shadow-xl shadow-green-100"
                >
                  {isRtl ? 'حفظ' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
