import React, { useState } from 'react';
import { 
  Mail, 
  Plus, 
  Search, 
  ChevronRight, 
  Settings2, 
  ToggleLeft as Toggle, 
  MessageSquare, 
  Trash2, 
  Bell,
  Save,
  X,
  PlusCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../translations';
import { Language, EmailRule } from '../types';
import { cn } from '../lib/utils';

interface EmailRulesProps {
  lang: Language;
}

const INITIAL_RULES: EmailRule[] = [
  {
    id: '1',
    trigger: 'Content Ready for Approval',
    subject: 'Action Required: Content Pending Your Approval',
    body: 'Hi Admin, a new content item is ready for your review. Please visit the dashboard.',
    active: true,
    recipients: ['admin@cropsa.com']
  },
  {
    id: '2',
    trigger: 'Content Published',
    subject: 'Updates from Cropsa Ops: New Content Published',
    body: 'Our latest post is now live across all platforms. Great job team!',
    active: false,
    recipients: ['marketing@cropsa.com', 'social@cropsa.com']
  },
  {
    id: '3',
    trigger: 'Weekly Performance Report',
    subject: 'Cropsa Ops: Weekly Performance Analytics',
    body: 'Greetings, here is the summary of our social performance for this week.',
    active: true,
    recipients: ['ceo@cropsa.com']
  }
];

export const EmailRules: React.FC<EmailRulesProps> = ({ lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [rules, setRules] = useState<EmailRule[]>(INITIAL_RULES);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<Partial<EmailRule>>({ 
    trigger: '', 
    subject: '', 
    body: '', 
    active: true,
    recipients: [],
    frequency: 'Immediately'
  });
  const [isTesting, setIsTesting] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const handleToggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleSaveRule = () => {
    if (editingId) {
      setRules(rules.map(r => r.id === editingId ? { ...r, ...newRule } as EmailRule : r));
      setEditingId(null);
    } else {
      setRules([...rules, { ...newRule, id: Math.random().toString(36).substr(2, 9) } as EmailRule]);
    }
    setIsAdding(false);
    setNewRule({ trigger: '', subject: '', body: '', active: true, recipients: [], frequency: 'Immediately' });
  };

  const handleTestRule = (rule: EmailRule) => {
    if (!rule.recipients || rule.recipients.length === 0) {
      setNotification({
        message: isRtl ? 'يرجى إضافة مستلم واحد على الأقل للاختبار' : 'Please add at least one recipient for testing',
        type: 'error'
      });
      return;
    }
    
    setIsTesting(true);
    
    // Simulate real API sending process with more steps for realism
    setTimeout(() => {
      setIsTesting(false);
      const now = new Date().toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const msg = isRtl 
        ? `✅ تم إرسال بريد تجريبي بنجاح إلى: ${rule.recipients?.join(', ')} في الساعة ${now}` 
        : `✅ Test email successfully sent to: ${rule.recipients?.join(', ')} at ${now}`;
      
      setNotification({ message: msg, type: 'success' });
      
      // Auto-hide notification
      setTimeout(() => setNotification(null), 8000);
    }, 2000);
  };

  const handleDeleteRule = (id: string) => {
    if (confirm(isRtl ? 'هل تريد حذف هذه القاعدة؟' : 'Are you sure you want to delete this rule?')) {
      setRules(rules.filter(r => r.id !== id));
    }
  };

  const handleEdit = (rule: EmailRule) => {
    setNewRule(rule);
    setEditingId(rule.id);
    setIsAdding(true);
  };

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const recipients = val.split(',').map(s => s.trim()).filter(s => s !== '');
    setNewRule({ ...newRule, recipients });
  };

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3",
              notification.type === 'success' ? "bg-green-600 text-white" : "bg-red-600 text-white"
            )}
          >
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {notification.message}
            <button onClick={() => setNotification(null)} className="ml-4 opacity-70 hover:opacity-100">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            {t.emailRules}
          </h1>
          <p className="text-gray-500 font-medium italic">
            {isRtl ? 'إدارة قواعد مراسلات البريد التلقائية والربط الإلكتروني' : 'Manage automated email rules and electronic links'}
          </p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingId(null); setNewRule({ trigger: '', subject: '', body: '', active: true, recipients: [] }); }}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          {isRtl ? 'إضافة قاعدة' : 'Add Rule'}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {rules.map((rule) => (
          <motion.div 
            layout
            key={rule.id}
            className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-4 rounded-2xl",
                rule.active ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
              )}>
                <Mail size={24} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-black text-gray-900">{rule.trigger}</h3>
                  {!rule.active && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] uppercase font-black rounded-lg tracking-wider">
                      {isRtl ? 'معطل' : 'Inactive'}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <MessageSquare size={12} />
                    <span className="italic">{rule.subject}</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">{rule.body}</p>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest mt-1">
                    <p className="text-green-600">
                      {isRtl ? 'المستلمون: ' : 'Recipients: '} {rule.recipients?.join(', ')}
                    </p>
                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                    <p className="text-blue-600">
                      {isRtl ? 'التوقيت: ' : 'Timing: '} {rule.frequency || (isRtl ? 'فوراً' : 'Immediately')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleTestRule(rule)}
                disabled={isTesting}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-100 active:scale-95 disabled:opacity-50"
              >
                {isRtl ? 'اختبار' : 'Test'}
              </button>
              <button 
                onClick={() => handleToggleRule(rule.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  rule.active ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  rule.active ? "bg-green-500 animate-pulse" : "bg-gray-400"
                )} />
                {rule.active ? (isRtl ? 'مفعل' : 'Active') : (isRtl ? 'تفعيل' : 'Activate')}
              </button>
              <div className="w-px h-8 bg-gray-100 mx-1" />
              <button 
                onClick={() => handleEdit(rule)}
                className="p-3 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
              >
                <Settings2 size={20} />
              </button>
              <button 
                onClick={() => handleDeleteRule(rule.id)}
                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center text-white shadow-lg shadow-green-100">
                    <PlusCircle size={24} />
                   </div>
                   <div>
                    <h3 className="text-2xl font-black text-gray-900 leading-tight">
                      {editingId ? (isRtl ? 'تعديل القاعدة' : 'Edit Rule') : (isRtl ? 'قاعدة جديدة' : 'New Email Rule')}
                    </h3>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest italic">{isRtl ? 'تخصيص قواعد الرسائل' : 'Customize Messaging Rules'}</p>
                   </div>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white rounded-2xl transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">{isRtl ? 'المشغل (الحالة)' : 'Trigger (Status)'}</label>
                  <select 
                    value={newRule.trigger}
                    onChange={(e) => setNewRule({...newRule, trigger: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:ring-4 focus:ring-green-100 transition-all appearance-none"
                  >
                    <option value="">{isRtl ? 'اختر الحالة' : 'Select Status'}</option>
                    <option value="Content Approved">{isRtl ? 'تم الموافقة على المحتوى' : 'Content Approved'}</option>
                    <option value="Content Rejected">{isRtl ? 'تم رفض المحتوى' : 'Content Rejected'}</option>
                    <option value="New Content Drafted">{isRtl ? 'مسودة محتوى جديدة' : 'New Content Drafted'}</option>
                    <option value="Content Scheduled">{isRtl ? 'تم جدولة المحتوى' : 'Content Scheduled'}</option>
                    <option value="Content Published">{isRtl ? 'تم نشر المحتوى' : 'Content Published'}</option>
                    <option value="Weekly Performance report">{isRtl ? 'تقرير الأداء الأسبوعي' : 'Weekly Performance Report'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">{isRtl ? 'عناوين البريد (مفصولة بفاصلة)' : 'Target Emails (comma separated)'}</label>
                  <input 
                    type="text"
                    value={newRule.recipients?.join(', ')}
                    onChange={handleRecipientChange}
                    placeholder={isRtl ? 'example@mail.com, user@cropsa.com' : 'example@mail.com, user@cropsa.com'}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:ring-4 focus:ring-green-100 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">{isRtl ? 'التوقيت / التكرار' : 'Timing / Frequency'}</label>
                    <select 
                      value={newRule.frequency}
                      onChange={(e) => setNewRule({...newRule, frequency: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:ring-4 focus:ring-green-100 transition-all appearance-none"
                    >
                      <option value="Immediately">{isRtl ? 'فوراً' : 'Immediately'}</option>
                      <option value="Hourly">{isRtl ? 'كل ساعة' : 'Hourly'}</option>
                      <option value="Daily">{isRtl ? 'يوميًّا' : 'Daily'}</option>
                      <option value="Weekly">{isRtl ? 'أسبوعيًّا' : 'Weekly'}</option>
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">{isRtl ? 'عنوان الرسالة' : 'Email Subject'}</label>
                    <input 
                      type="text"
                      value={newRule.subject}
                      onChange={(e) => setNewRule({...newRule, subject: e.target.value})}
                      placeholder={isRtl ? 'مثلاً: تم تجهيز المحتوى' : 'e.g., Content is ready'}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:ring-4 focus:ring-green-100 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">{isRtl ? 'نص الرسالة' : 'Message Body'}</label>
                  <textarea 
                    rows={4}
                    value={newRule.body}
                    onChange={(e) => setNewRule({...newRule, body: e.target.value})}
                    placeholder={isRtl ? 'اكتب نص الرسالة هنا...' : 'Write your message body here...'}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:ring-4 focus:ring-green-100 focus:bg-white transition-all resize-none"
                  />
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-4">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="px-8 py-4 font-bold text-gray-500 hover:text-gray-700 transition-all"
                >
                  {isRtl ? 'تجاهل' : 'Cancel'}
                </button>
                <button 
                  onClick={handleSaveRule}
                  disabled={!newRule.trigger || !newRule.subject}
                  className="px-10 py-4 bg-green-600 text-white rounded-2xl font-black shadow-lg shadow-green-100 hover:bg-green-700 transition-all disabled:opacity-50 disabled:shadow-none active:scale-95"
                >
                  {isRtl ? 'حفظ القاعدة' : 'Save Rule'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
