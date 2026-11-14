import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  Palette, 
  Layout, 
  Type, 
  Image as ImageIcon, 
  Save, 
  Plus, 
  Trash2,
  Check,
  ChevronRight,
  Globe,
  Bell,
  Shield,
  Smartphone
} from 'lucide-react';
import { translations } from '../translations';
import { Language, KanbanStage } from '../types';
import { cn } from '../lib/utils';

interface SettingsProps {
  lang: Language;
  stages: KanbanStage[];
  onUpdateStages: (stages: KanbanStage[]) => void;
  tabNames: string[];
  onUpdateTabNames: (names: string[]) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  lang, 
  stages, 
  onUpdateStages, 
  tabNames, 
  onUpdateTabNames 
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'workflow' | 'notifications'>('general');

  const [settings, setSettings] = useState({
    siteName: 'Cropsa Social Ops',
    logo: 'https://cropsa.com/logo.png',
    primaryColor: '#16a34a',
  });

  const handleSave = () => {
    alert(isRtl ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
  };

  const handleAddStage = () => {
    const name = prompt(isRtl ? 'أدخل اسم المرحلة الجديدة:' : 'Enter new stage name:');
    if (name) {
      const newStage: KanbanStage = {
        id: `stage-${Math.random().toString(36).substr(2, 9)}`,
        name: name,
        nameAr: name,
        status: 'Idea',
        color: '#16a34a'
      };
      onUpdateStages([...stages, newStage]);
    }
  };

  const handleEditStage = (idx: number) => {
    const stage = stages[idx];
    const name = prompt(isRtl ? 'تعديل اسم المرحلة:' : 'Edit stage name:', isRtl ? stage.nameAr : stage.name);
    if (name) {
      const newStages = [...stages];
      newStages[idx] = { ...stage, name: name, nameAr: name };
      onUpdateStages(newStages);
    }
  };

  const handleDeleteStage = (idx: number) => {
    if (confirm(isRtl ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) {
      onUpdateStages(stages.filter((_, i) => i !== idx));
    }
  };

  const handleUpdateTabName = (idx: number, name: string) => {
    const newNames = [...tabNames];
    newNames[idx] = name;
    onUpdateTabNames(newNames);
  };

  const tabs = [
    { id: 'general', label: isRtl ? 'عام' : 'General', icon: <SettingsIcon size={18} /> },
    { id: 'appearance', label: isRtl ? 'المظهر' : 'Appearance', icon: <Palette size={18} /> },
    { id: 'workflow', label: isRtl ? 'سير العمل' : 'Workflow', icon: <Layout size={18} /> },
    { id: 'notifications', label: isRtl ? 'الإشعارات' : 'Notifications', icon: <Bell size={18} /> }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            {isRtl ? 'الإعدادات' : 'Settings'}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            {isRtl ? 'تخصيص النظام وتفضيلاتك' : 'Customize the system and your preferences'}
          </p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-2xl text-sm font-bold hover:bg-green-700 transition-all shadow-xl shadow-green-100"
        >
          <Save size={20} />
          {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-green-600 text-white shadow-lg shadow-green-100" 
                  : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-[3rem] border border-gray-100 p-8 md:p-12 shadow-sm">
          {activeTab === 'general' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isRtl ? 'اسم الموقع' : 'Site Name'}</label>
                  <input 
                    type="text" 
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isRtl ? 'اللغة الافتراضية' : 'Default Language'}</label>
                  <select className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-green-500 transition-all">
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isRtl ? 'الشعار' : 'Logo'}</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden">
                    <img src={settings.logo} alt="Logo" className="w-full h-full object-contain p-4" />
                  </div>
                  <button className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">
                    {isRtl ? 'تغيير الشعار' : 'Change Logo'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isRtl ? 'اللون الرئيسي' : 'Primary Color'}</label>
                <div className="flex flex-wrap gap-4">
                  {['#16a34a', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#111827'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setSettings({...settings, primaryColor: color})}
                      className={cn(
                        "w-12 h-12 rounded-2xl transition-all flex items-center justify-center text-white",
                        settings.primaryColor === color ? "ring-4 ring-offset-2 ring-gray-200 scale-110 shadow-lg" : "hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                    >
                      {settings.primaryColor === color && <Check size={20} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isRtl ? 'نمط الواجهة' : 'UI Style'}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="p-6 border-2 border-green-600 bg-green-50 rounded-3xl text-left space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white">
                      <Smartphone size={20} />
                    </div>
                    <div className="font-bold text-gray-900">{isRtl ? 'حديث (Modern)' : 'Modern UI'}</div>
                    <div className="text-xs text-gray-500 leading-relaxed">{isRtl ? 'تصميم عصري مع حواف دائرية وظلال ناعمة' : 'Contemporary design with rounded edges and soft shadows'}</div>
                  </button>
                  <button className="p-6 border border-gray-100 bg-white rounded-3xl text-left space-y-2 hover:border-gray-200 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                      <Layout size={20} />
                    </div>
                    <div className="font-bold text-gray-900">{isRtl ? 'كلاسيكي (Classic)' : 'Classic UI'}</div>
                    <div className="text-xs text-gray-500 leading-relaxed">{isRtl ? 'تصميم تقليدي يركز على الكفاءة والمساحة' : 'Traditional design focused on efficiency and space'}</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isRtl ? 'مراحل العمل' : 'Workflow Stages'}</label>
                  <button 
                    onClick={handleAddStage}
                    className="text-xs font-bold text-green-600 flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> {isRtl ? 'إضافة مرحلة' : 'Add Stage'}
                  </button>
                </div>
                <div className="space-y-3">
                  {stages.map((stage, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">
                          {idx + 1}
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          {isRtl ? stage.nameAr : stage.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleEditStage(idx)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-white rounded-xl transition-all"
                        >
                          <SettingsIcon size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteStage(idx)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isRtl ? 'أسماء التبويبات' : 'Tab Names'}</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tabNames.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <Type size={16} className="text-gray-400" />
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => handleUpdateTabName(idx, e.target.value)}
                        className="bg-transparent text-sm font-bold text-gray-700 outline-none w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
