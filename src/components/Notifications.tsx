import React from 'react';
import { motion } from 'motion/react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Send,
  ExternalLink,
  Eye
} from 'lucide-react';
import { translations } from '../translations';
import { Language, ContentItem } from '../types';
import { cn } from '../lib/utils';

interface NotificationsProps {
  lang: Language;
  content: ContentItem[];
  onOpenDetail: (id: string) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ lang, content, onOpenDetail }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);

  const requestPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          new Notification(isRtl ? 'تم تفعيل التنبيهات' : 'Notifications Activated', {
            body: isRtl ? 'ستصلك تنبيهات عند جاهزية المحتوى للنشر.' : 'You will receive alerts when content is ready for publishing.',
            icon: '/favicon.ico'
          });
        }
      });
    } else {
      setNotificationsEnabled(true); // Fallback for simulation
    }
  };

  // Filter content that is ready or scheduled (simulating "finished preparation")
  const readyContent = content.filter(item => 
    item.status === 'Ready' || item.status === 'Scheduled' || item.status === 'Approved' || item.status === 'Review'
  );

  const mockNotifications = [
    {
      id: 'mock-1',
      title: isRtl ? 'تحليل الأداء الأسبوعي جاهز' : 'Weekly Performance Analysis Ready',
      type: 'prep_finished',
      date: '2026-05-20',
      status: 'Ready',
      platforms: ['Facebook', 'Instagram']
    },
    {
      id: 'mock-2',
      title: isRtl ? 'تم رصد تريند جديد: أسعار الأسمدة' : 'New Trend Detected: Fertilizer Prices',
      type: 'execution_moved',
      date: '2026-05-19',
      status: 'Active',
      platforms: ['Facebook']
    }
  ];

  const notifications = readyContent.length > 0 
    ? readyContent.map(item => ({
        id: item.id,
        title: item.title,
        type: item.status === 'Review' ? 'review_needed' : (item.status === 'Approved' ? 'prep_finished' : 'execution_moved'),
        date: item.publishDate || item.dueDate,
        status: item.status,
        platforms: item.platforms || []
      }))
    : mockNotifications;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            {isRtl ? 'الإشعارات' : 'Notifications'}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            {isRtl ? 'تتبع المحتوى الجاهز ومواعيد النشر' : 'Track ready content and publishing schedules'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group"
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                notif.type === 'review_needed' ? "bg-pink-100 text-pink-600 shadow-pink-50" : (notif.type === 'prep_finished' ? "bg-green-100 text-green-600 shadow-green-50" : "bg-blue-100 text-blue-600 shadow-blue-50")
              )}>
                {notif.type === 'review_needed' ? <Eye size={24} /> : (notif.type === 'prep_finished' ? <CheckCircle size={24} /> : <Send size={24} />)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest",
                    notif.type === 'review_needed' ? "bg-pink-50 text-pink-700" : (notif.type === 'prep_finished' ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700")
                  )}>
                    {notif.type === 'review_needed' ? (isRtl ? 'مطلوب مراجعة' : 'Review Needed') : (notif.type === 'prep_finished' ? (isRtl ? 'تم التحضير' : 'Prep Finished') : (isRtl ? 'في التنفيذ' : 'In Execution'))}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {notif.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-green-600 transition-colors">
                  {notif.title}
                </h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                    <Calendar size={14} />
                    <span>{isRtl ? 'موعد النشر:' : 'Publish Date:'} {notif.date || '-'}</span>
                  </div>
                  <div className="flex gap-1">
                    {notif.platforms.map(p => (
                      <span key={p} className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => onOpenDetail(notif.id)}
                className="p-3 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
              >
                <ExternalLink size={20} />
              </button>
            </motion.div>
          ))
        ) : (
          <div className="py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400 space-y-4">
            <Bell size={48} className="opacity-20" />
            <p className="font-bold">{isRtl ? 'لا توجد تنبيهات جديدة حالياً' : 'No new alerts at the moment'}</p>
          </div>
        )}
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 p-8 rounded-[2.5rem] border border-green-100 space-y-2">
          <div className="text-3xl font-black text-green-700">{notifications.filter(n => n.type === 'prep_finished').length}</div>
          <div className="text-sm font-bold text-green-600 uppercase tracking-widest">{isRtl ? 'جاهز للنشر' : 'Ready to Publish'}</div>
        </div>
        <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 space-y-2">
          <div className="text-3xl font-black text-blue-700">{notifications.filter(n => n.type === 'execution_moved').length}</div>
          <div className="text-sm font-bold text-blue-600 uppercase tracking-widest">{isRtl ? 'قيد التنفيذ' : 'In Execution'}</div>
        </div>
        <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 space-y-2">
          <div className="text-3xl font-black text-orange-700">{notifications.length}</div>
          <div className="text-sm font-bold text-orange-600 uppercase tracking-widest">{isRtl ? 'إجمالي التنبيهات' : 'Total Alerts'}</div>
        </div>
      </div>
    </motion.div>
  );
};
