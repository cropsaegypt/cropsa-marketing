import React, { useState, useMemo, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  TrendingUp, 
  Award, 
  Users, 
  Eye, 
  Activity, 
  X, 
  Target, 
  PlusCircle, 
  BarChart3, 
  Calendar, 
  Layers, 
  Sparkles, 
  Check,
  Facebook, 
  Instagram, 
  Linkedin, 
  Video, 
  MessageCircle, 
  Hash,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, Platform } from '../types';
import { cn } from '../lib/utils';
import { generateCompetitorCounterStrategy } from '../lib/gemini';
import { showToast } from './Toast';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area 
} from 'recharts';

interface CompetitorsProps {
  lang: Language;
  platformAnalytics: any[];
}

export interface Competitor {
  id: string;
  name: string;
  nameAr?: string;
  platform: Platform;
  noteEn?: string;
  noteAr?: string;
}

export interface DynamicCompetitorLog {
  id: string;
  competitorId: string;
  platform: Platform;
  date: string;
  period: 'daily' | 'weekly' | 'monthly';
  metrics: Record<string, number>; // Dynamic key-values!
}

const PLATFORMS: Platform[] = ['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'WhatsApp', 'Other'];

const PLATFORM_ICONS: Record<Platform, any> = {
  Facebook,
  Instagram,
  LinkedIn: Linkedin,
  TikTok: Video,
  WhatsApp: MessageCircle,
  Other: Hash
};

// Initial default competitors matching our agricultural application domain
const DEFAULT_COMPETITORS: Competitor[] = [
  {
    id: 'comp-1',
    name: 'Al-Wadi Modern Farms',
    nameAr: 'مزارع الوادي الحديثة',
    platform: 'Facebook',
    noteEn: 'Strong in organic farming daily reach.',
    noteAr: 'قوي في الانتشار اليومي والوعي بمحاصيل الدلتا.'
  },
  {
    id: 'comp-2',
    name: 'Al-Safwa Agritech',
    nameAr: 'الصفوة للتنمية الزراعية',
    platform: 'Instagram',
    noteEn: 'Active visual guides on crop fertilization.',
    noteAr: 'نشط للغاية في الأدلة الصورية ومقاطع الريلز الإرشادية.'
  },
  {
    id: 'comp-3',
    name: 'Sanabel Tayeba Group',
    nameAr: 'مجموعة سنابل طيبة',
    platform: 'TikTok',
    noteEn: 'Viral video shorts on organic wheat control.',
    noteAr: 'مقاطع تيك توك واسعة الانتشار لمكافحة آفات القمح.'
  }
];

// Seed logs with the new dynamic metric style
const DEFAULT_LOGS: DynamicCompetitorLog[] = [
  {
    id: 'log-1',
    competitorId: 'comp-1',
    platform: 'Facebook',
    date: '2026-05-10',
    period: 'weekly',
    metrics: {
      'Followers / المتابعين': 14200,
      'Reach / الوصول': 35000,
      'Engagement Rate / التفاعل %': 4.5,
      'Posts Count / المنشورات': 4
    }
  },
  {
    id: 'log-2',
    competitorId: 'comp-1',
    platform: 'Facebook',
    date: '2026-05-17',
    period: 'weekly',
    metrics: {
      'Followers / المتابعين': 14600,
      'Reach / الوصول': 42000,
      'Engagement Rate / التفاعل %': 4.8,
      'Posts Count / المنشورات': 5
    }
  },
  {
    id: 'log-3',
    competitorId: 'comp-1',
    platform: 'Facebook',
    date: '2026-05-24',
    period: 'weekly',
    metrics: {
      'Followers / المتابعين': 15100,
      'Reach / الوصول': 46800,
      'Engagement Rate / التفاعل %': 5.1,
      'Posts Count / المنشورات': 6
    }
  },
  {
    id: 'log-4',
    competitorId: 'comp-2',
    platform: 'Instagram',
    date: '2026-05-10',
    period: 'weekly',
    metrics: {
      'Followers / المتابعين': 18000,
      'Reel Views / مشاهدات الريلز': 22000,
      'Engagement Rate / التفاعل %': 5.2,
      'Stories Count / القصص اليومية': 14
    }
  },
  {
    id: 'log-5',
    competitorId: 'comp-2',
    platform: 'Instagram',
    date: '2026-05-24',
    period: 'weekly',
    metrics: {
      'Followers / المتابعين': 19500,
      'Reel Views / مشاهدات الريلز': 27500,
      'Engagement Rate / التفاعل %': 5.6,
      'Stories Count / القصص اليومية': 18
    }
  },
  {
    id: 'log-6',
    competitorId: 'comp-3',
    platform: 'TikTok',
    date: '2026-05-12',
    period: 'weekly',
    metrics: {
      'Followers / المتابعين': 32000,
      'Likes / الإعجابات': 92000,
      'Video Views / المشاهدات': 145000
    }
  },
  {
    id: 'log-7',
    competitorId: 'comp-3',
    platform: 'TikTok',
    date: '2026-05-24',
    period: 'weekly',
    metrics: {
      'Followers / المتابعين': 34800,
      'Likes / الإعجابات': 99500,
      'Video Views / المشاهدات': 168000
    }
  }
];

// Starter metrics per platform to auto-suggest
const STARTER_METRICS: Record<Platform, string[]> = {
  Facebook: ['Followers / المتابعين', 'Reach / الوصول', 'Engagement Rate / التفاعل %', 'Posts Count / المنشورات'],
  Instagram: ['Followers / المتابعين', 'Reel Views / مشاهدات الريلز', 'Engagement Rate / التفاعل %', 'Stories Count / القصص اليومية'],
  TikTok: ['Followers / المتابعين', 'Likes / الإعجابات', 'Video Views / المشاهدات', 'Comments / التعليقات'],
  LinkedIn: ['Followers / المتابعين', 'Post Impressions / انطباعات القراء', 'Click-Through Rate / النقر %', 'Content Shares / المشاركات'],
  WhatsApp: ['Group Members / أعضاء المجموعات', 'Active Admins / المشرفين النشطين', 'Weekly Link Clicks / نقرات الروابط'],
  Other: ['Followers / المتابعين', 'Estimated Reach / الوصول التقديري']
};

export const Competitors: React.FC<CompetitorsProps> = ({ lang, platformAnalytics }) => {
  const isRtl = lang === 'ar';

  // Sub tab: 'logs' dashboard or 'compare' dynamic charts
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'compare'>('logs');
  
  // Platform tab for dynamic platform analytics separation
  const [selectedPlatformTab, setSelectedPlatformTab] = useState<Platform>('Facebook');

  // Filter for comparing periods
  const [selectedPeriodCompareTab, setSelectedPeriodCompareTab] = useState<'All' | 'daily' | 'weekly' | 'monthly'>('All');

  // Competitor Profiles & Logs States
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [logs, setLogs] = useState<DynamicCompetitorLog[]>([]);

  // Firestore sync for competitors list
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'competitors'), async (snapshot) => {
      const fetched: Competitor[] = [];
      snapshot.forEach((doc) => {
        fetched.push(doc.data() as Competitor);
      });

      if (fetched.length === 0) {
        try {
          const initDoc = await getDoc(doc(db, 'settings', 'init_status'));
          const data = initDoc.exists() ? initDoc.data() : {};
          if (!data?.competitors) {
            // First time ever! Initialize defaults
            const promises = DEFAULT_COMPETITORS.map(async (c) => {
              await setDoc(doc(db, 'competitors', c.id), c);
            });
            await Promise.all(promises);
            await setDoc(doc(db, 'settings', 'init_status'), { ...data, competitors: true });
            setCompetitors(DEFAULT_COMPETITORS);
          } else {
            // Explicitly deleted by user
            setCompetitors([]);
          }
        } catch (err) {
          setCompetitors([]);
        }
      } else {
        fetched.sort((a, b) => a.id.localeCompare(b.id));
        setCompetitors(fetched);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'competitors');
    });

    return () => unsub();
  }, []);

  // Firestore sync for competitor logs list
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'competitors_logs'), async (snapshot) => {
      const fetched: DynamicCompetitorLog[] = [];
      snapshot.forEach((doc) => {
        fetched.push(doc.data() as DynamicCompetitorLog);
      });

      if (fetched.length === 0) {
        try {
          const initDoc = await getDoc(doc(db, 'settings', 'init_status'));
          const data = initDoc.exists() ? initDoc.data() : {};
          if (!data?.competitors_logs) {
            // First time ever! Initialize defaults
            const promises = DEFAULT_LOGS.map(async (l) => {
              await setDoc(doc(db, 'competitors_logs', l.id), l);
            });
            await Promise.all(promises);
            await setDoc(doc(db, 'settings', 'init_status'), { ...data, competitors_logs: true });
            setLogs(DEFAULT_LOGS);
          } else {
            // Explicitly deleted by user
            setLogs([]);
          }
        } catch (err) {
          setLogs([]);
        }
      } else {
        fetched.sort((a, b) => b.date.localeCompare(a.date));
        setLogs(fetched);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'competitors_logs');
    });

    return () => unsub();
  }, []);

  // UI state for messages (to avoid blocking iframe with window.alert)
  const [alertMessage, setAlertMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Filters state
  const [filterRivalId, setFilterRivalId] = useState<string>('All');
  const [filterPeriod, setFilterPeriod] = useState<string>('All');

  // Competitor Profile Form Modal State
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [compName, setCompName] = useState('');
  const [compPlatform, setCompPlatform] = useState<Platform>('Facebook');
  const [compNote, setCompNote] = useState('');

  // Dynamic Log Form Modal State (used for both Add and Edit!)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null); // Null means ADD, has string means EDIT
  
  const [logCompId, setLogCompId] = useState('');
  const [logPlatform, setLogPlatform] = useState<Platform>('Facebook');
  const [logPeriod, setLogPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Custom metrics collection for currently editing/adding log
  const [currentFormMetrics, setCurrentFormMetrics] = useState<{ name: string; value: string }[]>([]);
  const [newMetricNameStr, setNewMetricNameStr] = useState('');

  // AI Strategy Analysis Modal state
  const [selectedCompForAi, setSelectedCompForAi] = useState<Competitor | null>(null);
  const [aiObservation, setAiObservation] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiStrategyResult, setAiStrategyResult] = useState<{
    analysis: string;
    counterTactics: string[];
    suggestedCampaign: string;
  } | null>(null);

  const handleRunAiCompetitorAnalysis = async (comp: Competitor) => {
    setSelectedCompForAi(comp);
    const obs = isRtl ? (comp.noteAr || comp.noteEn || '') : (comp.noteEn || comp.noteAr || '');
    setAiObservation(obs);
    setIsAiAnalyzing(true);
    setAiStrategyResult(null);

    try {
      const result = await generateCompetitorCounterStrategy({
        competitorName: isRtl ? (comp.nameAr || comp.name) : comp.name,
        platform: comp.platform,
        observation: obs || (isRtl ? 'نشاط ملحوظ في نشر المحتوى الزراعي' : 'Active social media presence'),
        lang: lang
      });
      setAiStrategyResult(result);
      showToast(isRtl ? 'تم إعداد استراتيجية المواجهة بالذكاء الاصطناعي بنجاح!' : 'AI Counter-Strategy generated!', 'success');
    } catch (err: any) {
      console.error('Competitor AI error:', err);
      showToast(isRtl ? 'تعذر تحليل المنافس بالذكاء الاصطناعي. تأكد من إعداد GEMINI_API_KEY.' : 'AI analysis failed', 'error');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Show status toasts
  const triggerToast = (text: string, isError = false) => {
    setAlertMessage({ text, isError });
    setTimeout(() => {
      setAlertMessage(null);
    }, 4000);
  };

  // Persists states safely to state and Firestore
  const saveCompetitorsList = async (updated: Competitor[]) => {
    setCompetitors(updated);
    const updatedIds = new Set(updated.map(c => c.id));
    const deleted = competitors.filter(c => !updatedIds.has(c.id));
    for (const c of deleted) {
      try {
        await deleteDoc(doc(db, 'competitors', c.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `competitors/${c.id}`);
      }
    }
    for (const c of updated) {
      try {
        await setDoc(doc(db, 'competitors', c.id), c);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `competitors/${c.id}`);
      }
    }
  };

  const saveLogsList = async (updated: DynamicCompetitorLog[]) => {
    setLogs(updated);
    const updatedIds = new Set(updated.map(l => l.id));
    const deleted = logs.filter(l => !updatedIds.has(l.id));
    for (const l of deleted) {
      try {
        await deleteDoc(doc(db, 'competitors_logs', l.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `competitors_logs/${l.id}`);
      }
    }
    for (const l of updated) {
      try {
        await setDoc(doc(db, 'competitors_logs', l.id), l);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `competitors_logs/${l.id}`);
      }
    }
  };

  // Competitor CRUD
  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim()) return;

    const newComp: Competitor = {
      id: 'comp_' + Math.random().toString(36).substring(2, 9),
      name: compName.trim(),
      nameAr: compName.trim(),
      platform: compPlatform,
      noteEn: compNote.trim(),
      noteAr: compNote.trim()
    };

    saveCompetitorsList([...competitors, newComp]);
    setCompName('');
    setCompNote('');
    setIsCompModalOpen(false);
    triggerToast(isRtl ? 'تم إضافة ملف الشركة المنافسة بنجاح!' : 'Competitor profile successfully added!');
  };

  const handleDeleteCompetitor = (id: string) => {
    const updatedComps = competitors.filter(c => c.id !== id);
    const updatedLogs = logs.filter(l => l.competitorId !== id);
    saveCompetitorsList(updatedComps);
    saveLogsList(updatedLogs);
    triggerToast(isRtl ? 'تم حذف الملف وجميع القياسات المرتبطة به' : 'Competitor profile and records deleted.');
  };

  // Dynamically load suggestions when competitor or platform changes in Log modal
  const handleFormCompetitorChange = (compId: string) => {
    setLogCompId(compId);
    const selectedComp = competitors.find(c => c.id === compId);
    if (selectedComp) {
      setLogPlatform(selectedComp.platform);
      // Keep metrics list blank for entirely free manual registration, as requested
      setCurrentFormMetrics([]);
    }
  };

  // Initalize form for adding a new log
  const handleOpenAddLogModal = () => {
    setEditingLogId(null);
    setLogPeriod('weekly');
    setLogDate(new Date().toISOString().split('T')[0]);
    
    const initialCompId = competitors[0]?.id || '';
    if (!initialCompId) {
      triggerToast(isRtl ? 'برجاء إضافة ملف منافس واحد أولاً قبل تسجيل القياس' : 'Please configure a competitor profile first', true);
      return;
    }

    setLogCompId(initialCompId);
    const initialComp = competitors[0];
    setLogPlatform(initialComp.platform);
    
    // Completely empty starting baseline for dynamic manual metrics
    setCurrentFormMetrics([]);
    setNewMetricNameStr('');
    setIsLogModalOpen(true);
  };

  // Initialize form for editing an existing log
  const handleOpenEditLogModal = (log: DynamicCompetitorLog) => {
    setEditingLogId(log.id);
    setLogCompId(log.competitorId);
    setLogPlatform(log.platform);
    setLogPeriod(log.period);
    setLogDate(log.date);

    // Format metrics from object to editable array of key-value maps
    const formatted = Object.entries(log.metrics).map(([name, value]) => ({
      name,
      value: String(value)
    }));
    setCurrentFormMetrics(formatted);
    setNewMetricNameStr('');
    setIsLogModalOpen(true);
  };

  // Add custom typed metric row in form
  const handleAddCustomMetricFormRow = () => {
    const trimmed = newMetricNameStr.trim();
    if (!trimmed) return;
    
    // Check for duplicates
    if (currentFormMetrics.some(m => m.name.toLowerCase() === trimmed.toLowerCase())) {
      triggerToast(isRtl ? 'هذا المؤشر تم إضافته بالفعل' : 'Metric name already exists in form', true);
      return;
    }

    setCurrentFormMetrics([...currentFormMetrics, { name: trimmed, value: '' }]);
    setNewMetricNameStr('');
  };

  // Remove metric row from active log form build
  const handleRemoveMetricFormRow = (index: number) => {
    const updated = [...currentFormMetrics];
    updated.splice(index, 1);
    setCurrentFormMetrics(updated);
  };

  // Form Metric input change
  const handleMetricValueChange = (index: number, valStr: string) => {
    const updated = [...currentFormMetrics];
    updated[index].value = valStr;
    setCurrentFormMetrics(updated);
  };

  // Save the Dynamic Log entry
  const handleSaveDynamicLog = (e: React.FormEvent) => {
    e.preventDefault();

    // Collect metrics values into final record model
    const processedMetrics: Record<string, number> = {};
    currentFormMetrics.forEach(m => {
      const num = parseFloat(m.value);
      if (!isNaN(num) && m.name.trim() !== '') {
        processedMetrics[m.name.trim()] = num;
      }
    });

    if (Object.keys(processedMetrics).length === 0) {
      triggerToast(isRtl ? 'برجاء تسجيل قيمة رقمية واحدة على الأقل لأحد المؤشرات لتوثيق القياس' : 'Please register at least one numeric metric value', true);
      return;
    }

    if (editingLogId) {
      // Editorial Save Mode
      const updatedLogs = logs.map(l => {
        if (l.id === editingLogId) {
          return {
            ...l,
            competitorId: logCompId,
            platform: logPlatform,
            period: logPeriod,
            date: logDate,
            metrics: processedMetrics
          };
        }
        return l;
      });
      saveLogsList(updatedLogs);
      triggerToast(isRtl ? 'تم تعديل قياسات المنافس بنجاح' : 'Competitor metric log updated successfully.');
    } else {
      // Creation Save Mode
      const newLog: DynamicCompetitorLog = {
        id: 'log_' + Math.random().toString(36).substring(2, 9),
        competitorId: logCompId,
        platform: logPlatform,
        date: logDate,
        period: logPeriod,
        metrics: processedMetrics
      };
      saveLogsList([newLog, ...logs]);
      triggerToast(isRtl ? 'تم تسجيل قياسات المنافس المخصصة بنجاح!' : 'Dynamic metric log successfully registered.');
    }

    setIsLogModalOpen(false);
    setEditingLogId(null);
  };

  // Simple direct delete trigger (responsive, safe, no browser blocks!)
  const handleDeleteLogEntry = (id: string) => {
    const updated = logs.filter(l => l.id !== id);
    saveLogsList(updated);
    triggerToast(isRtl ? 'تم حذف السجل بنجاح' : 'Log record permanently removed.');
  };

  // Dynamic filter lists for logs table
  const filteredLogsList = useMemo(() => {
    return logs.filter(l => {
      const matchComp = filterRivalId === 'All' || l.competitorId === filterRivalId;
      const matchPeriod = filterPeriod === 'All' || l.period === filterPeriod;
      return matchComp && matchPeriod;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, filterRivalId, filterPeriod]);

  // Helper to dynamically scale Cropsa baseline values for specified periods
  const getCropsaBaselineForPeriod = (period: 'daily' | 'weekly' | 'monthly') => {
    const totalWeeklyReach = platformAnalytics.reduce((sum, m) => sum + (m.reach || 0), 0) || 235000;
    const totalWeeklyEngagement = platformAnalytics.reduce((sum, m) => sum + (m.engagement || 0), 0) || 15000;
    const followersMax = platformAnalytics.length > 0 ? (platformAnalytics[platformAnalytics.length - 1].followers || 26900) : 26900;
    
    let scale = 1.0;
    if (period === 'daily') scale = 1 / 7;
    else if (period === 'monthly') scale = 4.3;

    return {
      'Followers / المتابعين': followersMax,
      'Reach / الوصول': Math.round(totalWeeklyReach * scale),
      'Engagement Rate / التفاعل %': totalWeeklyReach > 0 ? Number(((totalWeeklyEngagement / totalWeeklyReach) * 100).toFixed(1)) : 5.8,
      'Posts Count / المنشورات': Math.round((platformAnalytics.length * 4 || 28) * scale),
      'Reel Views / مشاهدات الريلز': Math.round((totalWeeklyReach ? Math.round(totalWeeklyReach * 0.45) : 105000) * scale),
      'Stories Count / القصص اليومية': Math.round(24 * scale),
      'Likes / الإعجابات': Math.round((totalWeeklyEngagement * 3 || 45000) * scale),
      'Video Views / المشاهدات': Math.round((totalWeeklyReach ? Math.round(totalWeeklyReach * 0.6) : 124000) * scale)
    };
  };

  // Aggregate cropsa own platform metric baseline
  const cropsaPlatformBaseline = useMemo(() => {
    return getCropsaBaselineForPeriod('weekly');
  }, [platformAnalytics]);


  // DYNAMIC PLATFORM SPECIFIC SECTION CALCULATIONS
  // Compute analytics specifically for the selected active platform tab!
  const platformSpecificAnalytics = useMemo(() => {
    // 1. Get competitors categorized under this platform
    const platformComps = competitors.filter(c => c.platform === selectedPlatformTab);
    const platformCompIds = platformComps.map(c => c.id);

    // 2. Get all logs loaded under this platform or logged for platform competitors with optional period filter
    const platformLogs = logs.filter(l => {
      const matchPlat = l.platform === selectedPlatformTab || platformCompIds.includes(l.competitorId);
      const matchPeriod = selectedPeriodCompareTab === 'All' || l.period === selectedPeriodCompareTab;
      return matchPlat && matchPeriod;
    }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 3. Extract all dynamic custom metrics keys used inside this platform
    const uniqueMetricKeysSet = new Set<string>();
    platformLogs.forEach(l => {
      Object.keys(l.metrics).forEach(m => uniqueMetricKeysSet.add(m));
    });
    const uniqueMetricKeys = Array.from(uniqueMetricKeysSet);

    // 4. For each metric key, map out dynamic comparison values
    const metricComparisons = uniqueMetricKeys.map(key => {
      const competitorLeaders: { competitorName: string; value: number; date: string }[] = [];
      
      platformComps.forEach(comp => {
        const compLogs = platformLogs.filter(l => l.competitorId === comp.id && l.metrics[key] !== undefined);
        if (compLogs.length > 0) {
          // Get latest
          const latest = compLogs[compLogs.length - 1];
          competitorLeaders.push({
            competitorName: isRtl ? (comp.nameAr || comp.name) : comp.name,
            value: latest.metrics[key],
            date: latest.date
          });
        }
      });

      // Cropsa own value corresponding to this key, scaled by period!
      const activePeriod = selectedPeriodCompareTab === 'All' ? 'weekly' : selectedPeriodCompareTab;
      const cropsaBaselineMap = getCropsaBaselineForPeriod(activePeriod) as Record<string, number>;
      const cropsaOwnValue = cropsaBaselineMap[key] !== undefined ? cropsaBaselineMap[key] : (key.toLowerCase().includes('rate') || key.includes('%') ? 5.5 : Math.round(12000 * (activePeriod === 'daily' ? 1/7 : activePeriod === 'monthly' ? 4.3 : 1.0)));

      // Build historical trends line chart dataset for this specific metric key
      const uniqueDates = Array.from(new Set(platformLogs.map(l => l.date))).sort();
      const historicalTrendData = uniqueDates.map(date => {
        const datePoint: Record<string, any> = { date };
        
        // Cropsa reference value trend
        const dateIndex = uniqueDates.indexOf(date);
        const cropsaFactor = 0.85 + (dateIndex / (uniqueDates.length || 1)) * 0.15;
        datePoint[isRtl ? 'كروبسا' : 'CROPSA'] = Math.round(cropsaOwnValue * cropsaFactor);

        // Rivals values
        platformComps.forEach(comp => {
          const matchedLog = platformLogs.find(l => l.competitorId === comp.id && l.date === date);
          if (matchedLog && matchedLog.metrics[key] !== undefined) {
            datePoint[isRtl ? (comp.nameAr || comp.name) : comp.name] = matchedLog.metrics[key];
          }
        });

        return datePoint;
      });

      // Side-by-side bar chart data representation
      const sideBySideBarData = [
        {
          name: isRtl ? 'كروبسا والمنافسين' : 'CROPSA & Rivals',
          [isRtl ? 'كروبسا (أنت)' : 'CROPSA (Us)']: cropsaOwnValue,
          ...competitorLeaders.reduce((acc, lead) => {
            acc[lead.competitorName] = lead.value;
            return acc;
          }, {} as Record<string, number>)
        }
      ];

      return {
        metricKey: key,
        cropsaValue: cropsaOwnValue,
        competitorsLatest: competitorLeaders,
        trendData: historicalTrendData,
        barData: sideBySideBarData
      };
    });

    return {
      competitorsCount: platformComps.length,
      logsCount: platformLogs.length,
      metricsComparisons: metricComparisons,
      platformComps
    };
  }, [competitors, logs, selectedPlatformTab, selectedPeriodCompareTab, platformAnalytics, isRtl]);

  const activeRivalObj = competitors.find(c => c.id === filterRivalId);
  const activeRivalName = isRtl ? (activeRivalObj?.nameAr || activeRivalObj?.name || 'المنافس المتطابق') : (activeRivalObj?.name || 'Rival Profile');

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Dynamic system feedback alerts (no iframe frozen states!) */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "fixed bottom-6 right-6 z-[120] p-4 rounded-2xl flex items-center gap-3 shadow-2xl border text-xs font-black",
              alertMessage.isError 
                ? "bg-red-50 border-red-200 text-red-700" 
                : "bg-emerald-950 border-emerald-800 text-emerald-400"
            )}
          >
            <AlertCircle size={16} />
            <span>{alertMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Competitors Interactive Header Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-lime-150/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
            <Target size={26} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-zinc-950 text-emerald-400 font-mono">
                {isRtl ? 'رقابة السوق الزراعي التنافسي' : 'Competitive Ag-Registry'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-gray-950 tracking-tight mt-1">
              {isRtl ? 'منصة قياس وتحليل أداء المنافسين لمزارع كروبسا' : 'Competitor Benchmarking & Intelligent Registry'}
            </h2>
            <p className="text-sm font-semibold text-gray-500 mt-1 max-w-2xl leading-relaxed">
              {isRtl 
                ? 'قم ببناء مؤشرات قياس دورية وحرة لكل منصة ترغب في مقارنتها، وتابع تقدم كفاءة حملات الإرشاد ضد المنافسين الزراعيين وجهًا لوجه.'
                : 'Configure free custom metrics per social channel. Log and evaluate key agricultural outreach compared directly with CROPSA.'}
            </p>
          </div>
        </div>

        {/* Floating actions */}
        <div className="flex items-center gap-2.5 shrink-0 relative z-10">
          <button
            onClick={() => setIsCompModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 hover:bg-zinc-800 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Plus size={14} />
            {isRtl ? 'إضافة شركة منافسة' : 'Add Rival Company'}
          </button>
          
          <button
            onClick={handleOpenAddLogModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-green-100 cursor-pointer active:scale-95"
          >
            <PlusCircle size={14} />
            {isRtl ? 'تسجيل قياس جديد' : 'Log New Metric'}
          </button>
        </div>
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="bg-gray-100/80 p-1.5 rounded-2xl flex max-w-lg shadow-inner border border-gray-200">
        <button
          onClick={() => setActiveSubTab('logs')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all cursor-pointer",
            activeSubTab === 'logs' 
              ? "bg-white text-emerald-950 shadow-md transform scale-[1.01]"
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          <Layers size={14} />
          {isRtl ? 'إدخال سجل القياسات والتحكم بها' : 'Data Entry & Action Logs'}
        </button>

        <button
          onClick={() => setActiveSubTab('compare')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all cursor-pointer",
            activeSubTab === 'compare' 
              ? "bg-white text-emerald-950 shadow-md transform scale-[1.01]"
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          <BarChart3 size={14} />
          {isRtl ? 'المقارنات والرسوم والتحليلات حسب القنوات' : 'Separated Platform Analytics'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* SUBTAB 1: DATA REGISTRY & DIRECT LOG EDITING */}
        {activeSubTab === 'logs' && (
          <motion.div
            key="tab-logs"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Left Side: Tracked Competitors List Card */}
              <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                    <Award size={16} className="text-amber-500" />
                    {isRtl ? 'الشركات المنافسة المرصودة' : 'Tracked Competitors'}
                  </h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">{competitors.length}</span>
                </div>

                <div className="space-y-2.5 max-h-[420px] overflow-y-auto custom-scrollbar">
                  {competitors.map(comp => {
                    const IconComp = PLATFORM_ICONS[comp.platform] || Hash;
                    return (
                      <div 
                        key={comp.id}
                        className="p-3.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between group transition-all"
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <span className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center text-xs shadow-sm bg-white",
                            comp.platform === 'Facebook' ? "text-blue-600" :
                            comp.platform === 'Instagram' ? "text-pink-600" :
                            comp.platform === 'TikTok' ? "text-zinc-950" : "text-emerald-600"
                          )}>
                            <IconComp size={15} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-950 truncate">
                              {isRtl ? comp.nameAr || comp.name : comp.name}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">{comp.platform}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleRunAiCompetitorAnalysis(comp)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-all cursor-pointer"
                            title={isRtl ? "تحليل ذكي واقتراح استراتيجية مضادة (Gemini)" : "AI Counter-Strategy (Gemini)"}
                          >
                            <Sparkles size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCompetitor(comp.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-650 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title={isRtl ? "حذف الملف وجميع سجلاته" : "Delete profile and metrics"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {competitors.length === 0 && (
                    <p className="text-[11px] font-bold text-gray-400 text-center py-6">
                      {isRtl ? 'لم يتم إضافة أي منافس بعد.' : 'No competitor profiles configured yet.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side: Timeline dynamic Logs Table */}
              <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-200/90 shadow-sm space-y-6">
                
                {/* Metrics timeline filter bars */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <h3 className="text-sm font-black text-gray-950 flex items-center gap-2">
                    <Calendar size={16} className="text-green-600" />
                    {isRtl ? 'المحور الدوري لمؤشرات ومقاييس الأداء للمنافسين' : 'Dynamic Benchmarking Timeline Log'}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Competitor Filter */}
                    <select
                      value={filterRivalId}
                      onChange={(e) => setFilterRivalId(e.target.value)}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer focus:bg-white"
                    >
                      <option value="All">{isRtl ? 'كل المنافسين' : 'All Competitors'}</option>
                      {competitors.map(c => (
                        <option key={c.id} value={c.id}>{isRtl ? c.nameAr || c.name : c.name}</option>
                      ))}
                    </select>

                    {/* Period Filter */}
                    <select
                      value={filterPeriod}
                      onChange={(e) => setFilterPeriod(e.target.value)}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer focus:bg-white"
                    >
                      <option value="All">{isRtl ? 'كل الدوريات' : 'All Periods'}</option>
                      <option value="daily">{isRtl ? 'يومي' : 'Daily'}</option>
                      <option value="weekly">{isRtl ? 'أسبوعي' : 'Weekly'}</option>
                      <option value="monthly">{isRtl ? 'شهري' : 'Monthly'}</option>
                    </select>
                  </div>
                </div>

                {/* Registry Log Grid / Scroll Feed */}
                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                  {filteredLogsList.map(log => {
                    const competitorProfile = competitors.find(c => c.id === log.competitorId);
                    const rivalNameLabel = isRtl 
                      ? (competitorProfile?.nameAr || competitorProfile?.name || 'شركة مجهولة')
                      : (competitorProfile?.name || 'Unknown Rival');
                    const PlatformIcon = PLATFORM_ICONS[log.platform] || Hash;

                    return (
                      <div 
                        key={log.id} 
                        className="p-5 bg-white border border-gray-200/90 rounded-[1.75rem] hover:border-emerald-500/30 hover:shadow-md transition-all space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center text-xs",
                              log.platform === 'Facebook' ? "bg-blue-50 text-blue-600" :
                              log.platform === 'Instagram' ? "bg-pink-50 text-pink-600" : "bg-zinc-50 text-emerald-600"
                            )}>
                              <PlatformIcon size={14} />
                            </span>
                            <div>
                              <h4 className="text-xs font-black text-gray-900">{rivalNameLabel}</h4>
                              <p className="text-[10px] text-gray-400 font-bold mt-0.5">{log.platform} • {log.period}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-xl">
                              {log.date}
                            </span>
                            
                            {/* Actions options: Edit & Delete (Safe, interactive, no freeze) */}
                            <button
                              onClick={() => handleOpenEditLogModal(log)}
                              className="p-1 px-2.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-500 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title={isRtl ? "تعديل هذا القياس" : "Edit metrics"}
                            >
                              <Edit3 size={11} />
                              <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                            </button>

                            <button
                              onClick={() => handleDeleteLogEntry(log.id)}
                              className="p-1 px-2 bg-red-50 text-red-650 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                              title={isRtl ? "حذف السجل" : "Delete record"}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Rendering Dynamic KeyValues Registered inside this specific log entry! */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {Object.entries(log.metrics).map(([metricKey, metricValue]) => (
                            <div key={metricKey} className="p-3 bg-gray-50/50 border border-gray-100 rounded-2xl flex flex-col justify-between">
                              <span className="text-[10px] font-bold text-gray-400 truncate block uppercase leading-tight" title={metricKey}>
                                {metricKey}
                              </span>
                              <span className="text-sm font-black text-gray-900 mt-1 font-mono">
                                {metricValue % 1 === 0 ? metricValue.toLocaleString() : metricValue}
                              </span>
                            </div>
                          ))}
                        </div>

                      </div>
                    );
                  })}

                  {filteredLogsList.length === 0 && (
                    <div className="text-center p-14 border border-dashed border-gray-200 rounded-3xl">
                      <p className="text-xs font-bold text-gray-400 mt-1">
                        {isRtl ? 'لا توجد أي قياسات مخصصة مسجلة تطابق التصفية الحالية.' : 'No matched dyn-metric logs found for the applied filter.'}
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: SEPARATED PLATFORM ANALYTICS COMPARISONS */}
        {activeSubTab === 'compare' && (
          <motion.div
            key="tab-compare"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
             {/* Horizontal Platform & Period Switchers */}
             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-150 pb-4">
               <div className="flex flex-wrap items-center gap-2">
                 {PLATFORMS.map(p => {
                   const IconPlat = PLATFORM_ICONS[p];
                   return (
                     <button
                       key={p}
                       onClick={() => setSelectedPlatformTab(p)}
                       className={cn(
                         "flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer",
                         selectedPlatformTab === p 
                           ? "bg-zinc-950 text-white shadow-md transform scale-[1.02]"
                           : "bg-white text-gray-500 border border-gray-200 hover:text-gray-950"
                       )}
                     >
                       <IconPlat size={13} />
                       <span>{p}</span>
                     </button>
                   );
                 })}
               </div>

               {/* Period Filter Switcher */}
               <div className="flex items-center gap-1 bg-gray-100/80 p-1.5 rounded-xl border border-gray-200 self-start lg:self-auto">
                 <span className="text-[10px] font-black uppercase text-gray-400 px-2 font-mono">{isRtl ? 'تصفية دورية المقارنة:' : 'Compare Period:'}</span>
                 {(['All', 'daily', 'weekly', 'monthly'] as const).map(per => (
                   <button
                     key={per}
                     onClick={() => setSelectedPeriodCompareTab(per)}
                     className={cn(
                       "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer",
                       selectedPeriodCompareTab === per
                         ? "bg-white text-emerald-800 shadow-sm"
                         : "text-gray-500 hover:text-gray-950"
                     )}
                   >
                     {per === 'All' ? (isRtl ? 'الكل' : 'All') :
                      per === 'daily' ? (isRtl ? 'يومي' : 'Daily') :
                      per === 'weekly' ? (isRtl ? 'أسبوعي' : 'Weekly') :
                      (isRtl ? 'شهري' : 'Monthly')}
                   </button>
                 ))}
               </div>
             </div>

            {/* PLATFORM SUMMARY METRIC SECTION */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-sm space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h4 className="text-sm font-black text-gray-950 flex items-center gap-2">
                    <Sparkles className="text-emerald-500 animate-spin-slow" size={16} />
                    {isRtl 
                      ? `تقرير ومؤشرات الأداء التفاعلية: منصة ${selectedPlatformTab}` 
                      : `Live Interactive Reporting Model: ${selectedPlatformTab}`}
                  </h4>
                  <p className="text-xs font-semibold text-gray-400 mt-0.5">
                    {isRtl 
                      ? `استعراض تحليلي مخصص مبني بالكامل على البيانات وعمل مقارنات ديناميكية لكل مؤشر سجلته.`
                      : `Dynamic model benchmarking Cropsa vs Rivals specifically calculated for logged metrics in ${selectedPlatformTab}.`}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-gray-500 font-mono">
                  <span>{isRtl ? `المرصودين: ${platformSpecificAnalytics.competitorsCount}` : `Rivals: ${platformSpecificAnalytics.competitorsCount}`}</span>
                  <span>•</span>
                  <span>{isRtl ? `تسجيلات القياس: ${platformSpecificAnalytics.logsCount}` : `Logs Count: ${platformSpecificAnalytics.logsCount}`}</span>
                </div>
              </div>

              {/* Rendering dynamic comparison models according to dynamic metric keys inside logged platform data! */}
              {platformSpecificAnalytics.metricsComparisons.length > 0 ? (
                <div className="space-y-12">
                  {platformSpecificAnalytics.metricsComparisons.map(comparison => {
                    return (
                      <div key={comparison.metricKey} className="p-6 bg-gray-50/50 border border-gray-100 rounded-[2rem] space-y-6">
                        
                        {/* Title of Metric comparison */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100/80 pb-3">
                          <h5 className="text-xs font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                            {isRtl ? 'تحليل ومقارنة مؤشر:' : 'Analytical Benchmark -'} {comparison.metricKey}
                          </h5>

                          <div className="flex items-center gap-4 text-[11px] font-sans font-black">
                            <span className="text-emerald-600">{isRtl ? `كروبسا: ${comparison.cropsaValue.toLocaleString()}` : `CROPSA: ${comparison.cropsaValue.toLocaleString()}`}</span>
                            {comparison.competitorsLatest.map(lead => (
                              <span key={lead.competitorName} className="text-amber-600">
                                {lead.competitorName}: {lead.value.toLocaleString()}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* RECHARTS CHANNELS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          
                          {/* Comparative bar chart */}
                          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest">{isRtl ? 'مقارنة القيمة وجدًا لوجه' : 'Side-by-side latest Values comparison'}</span>
                            <div className="h-56">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparison.barData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                  <XAxis dataKey="name" fontSize={9} stroke="#9ca3af" tickLine={false} />
                                  <YAxis fontSize={9} stroke="#9ca3af" tickLine={false} tickFormatter={(v) => v.toLocaleString()} />
                                  <Tooltip />
                                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                  <Bar dataKey={isRtl ? 'كروبسا (أنت)' : 'CROPSA (Us)'} fill="#10b981" radius={[4, 4, 0, 0]} barSize={26} />
                                  {comparison.competitorsLatest.map((lead, i) => (
                                    <Bar key={lead.competitorName} dataKey={lead.competitorName} fill={i === 0 ? '#f59e0b' : i === 1 ? '#3b82f6' : '#a855f7'} radius={[4, 4, 0, 0]} barSize={26} />
                                  ))}
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Historical trend graph */}
                          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest">{isRtl ? 'تطور ونمو المؤشر بمرور التاريخ' : 'Metric growth timeline analysis'}</span>
                            <div className="h-56">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={comparison.trendData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                  <XAxis dataKey="date" fontSize={9} stroke="#9ca3af" tickLine={false} />
                                  <YAxis fontSize={9} stroke="#9ca3af" tickLine={false} tickFormatter={(v) => v.toLocaleString()} />
                                  <Tooltip />
                                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                  <Line type="monotone" dataKey={isRtl ? 'كروبسا' : 'CROPSA'} stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                  {comparison.competitorsLatest.map((lead, i) => (
                                    <Line key={lead.competitorName} type="monotone" dataKey={lead.competitorName} stroke={i === 0 ? '#f59e0b' : i === 1 ? '#3b82f6' : '#a855f7'} strokeWidth={2.5} dot={{ r: 3 }} />
                                  ))}
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-14 border border-dashed border-gray-200 rounded-3xl">
                  <p className="text-xs font-bold text-gray-400">
                    {isRtl 
                      ? 'لا توجد قياسات مسجلة لهذه المنصة حتى الآن. يرجى البدء في تسجيل القياس واختيار مؤشرات حرة لاستعراض التحاليل الفورية!'
                      : 'No custom metrics registered for this platform yet. Please log a competitor metric with customized fields.'}
                  </p>
                </div>
              )}

              {/* DYNAMIC ANALYTICAL INSIGHT CARDS */}
              <div className="p-6 bg-gradient-to-tr from-zinc-950 to-zinc-900 text-white rounded-[2rem] border border-zinc-800 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-wider relative z-10">
                  <Sparkles size={11} />
                  {isRtl ? 'النموذج التحليلي الاسترشادي الذكي' : 'Strategic Insights Counsel'}
                </span>

                <h4 className="text-sm font-black text-white relative z-10">
                  {isRtl ? `التقرير التنافسي الذكي لمجموعة قنوات: ${selectedPlatformTab}` : `${selectedPlatformTab} Agri-Inbound Optimization Analysis`}
                </h4>

                <p className="text-xs font-semibold text-zinc-350 leading-relaxed max-w-4xl relative z-10">
                  {selectedPlatformTab === 'Facebook' && (
                    isRtl 
                      ? 'مجموعات الفلاحين على فيسبوك تُظهر حساسية عالية للمواد البصرية الدقيقة (الدقة العالية بالصور). مزارع الوادي Modern Farms تكثف استخدام المجموعات وتتجاوزنا بمشاركات المنشورات. يوصى بزيادة منشورات المعرفة وعمل بث حي أسبوعي لتقديم الدعم الفوري للفلاحين لتعزيز نسبة ثقتهم.' 
                      : 'Facebook group interaction demonstrates a high correlation with visual materials. Al-Wadi is scaling reach via active hub directories. We recommend initiating a weekly live consult event on crops diagnostics to re-establish leader trust indices.'
                  )}
                  {selectedPlatformTab === 'Instagram' && (
                    isRtl 
                      ? 'المنافسون على إنستغرام ينشطون تحديداً في مقاطع الريلز اليومية والقصص المستمرة لجمع تعليقات فورية. لتعديل الوضع نقترح نشر إنفوجرافيك مقسم لعدة صفحات (Carousel) يشرح تفاصيل مراحل تسميد القمح وتجفيف محاصيل البنجر.' 
                      : 'Rivals are utilizing daily Reels to captivate attention in agrarian stories. To bolster engagement we recommend scheduling high-density Carousel slides visual guides detailing fertilizer schedules.'
                  )}
                  {selectedPlatformTab === 'WhatsApp' && (
                    isRtl 
                      ? 'الوصول في مجموعات واتساب يتميز بمعدل قراءة يقترب من ١٠٠٪. المنافس المباشر لا يمتلك قنوات رسمية نشطة. هذه فجوة استراتيجية ذهبية لصالح كروبسا! نوصي بتجهيز ونشر روابط قنوات واتساب مباشرة للفلاحين لضمهم والاستحواذ على حصة التواجد المباشر.' 
                      : 'WhatsApp broadcast read rates approach 95%. Cropsa can seize a golden advantage by publishing instant WhatsApp joining links on our primary pages to build high-retention direct access communities.'
                  )}
                  {['TikTok', 'LinkedIn', 'Other'].includes(selectedPlatformTab) && (
                    isRtl 
                      ? 'تحليلات المنصات الإرشادية تشير إلى انتشار مذهل للفيديو التعليمي السريع ومعدلات التحويل المرتفعة لمواقع الحجز. يجب على كتاب المحتوى تفريغ توصيات الكتيب الإرشادي وتحضيرها كشذرات قصيرة سريعة لتجنب خسارة انتباه الفلاحين الشباب.' 
                      : 'Analytics indicate short informative videos maximize attention index in agritech circles. Focus creation efforts around educational nuggets extracted from official seed catalogs.'
                  )}
                </p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 1: ADD COMPETITOR PROFILE */}
      <AnimatePresence>
        {isCompModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl border border-gray-150 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-gray-950">{isRtl ? 'إضافة ملف شركة منافسة' : 'Add Competitor Profile'}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{isRtl ? 'أدخل التفاصيل الأساسية للشركة' : 'Configure rival company credentials'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCompModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-950 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddCompetitor} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{isRtl ? 'اسم الشركة المنافسة' : 'Rival Company Name'}</label>
                  <input
                    type="text"
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    placeholder={isRtl ? 'مثلاً: مزارع الفتح والتوحيد' : 'e.g., Al-Farouq Agritech'}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-green-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{isRtl ? 'المنصة الرئيسية للمنافس' : 'Principal Platform'}</label>
                  <select
                    value={compPlatform}
                    onChange={(e) => setCompPlatform(e.target.value as Platform)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none cursor-pointer focus:bg-white"
                  >
                    {PLATFORMS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{isRtl ? 'ملاحظة استبصارية' : 'Strategic Insights / Objective'}</label>
                  <textarea
                    value={compNote}
                    onChange={(e) => setCompNote(e.target.value)}
                    placeholder={isRtl ? 'مثلاً: يركزون على صور الإرشاد والري السطحي...' : 'e.g., Targets crop visual reports ...'}
                    className="w-full h-24 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-xs outline-none focus:bg-white resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCompModalOpen(false)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black rounded-lg transition-colors cursor-pointer"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-green-600 hover:bg-green-750 text-white text-xs font-black rounded-lg transition-colors shadow-lg shadow-green-150 cursor-pointer"
                  >
                    {isRtl ? 'إضافة المنافس' : 'Add Profile'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: DYNAMIC CUSTOM LOGS RECORDER / EDITING */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-3xl border border-gray-150 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-gray-950">
                    {editingLogId ? (isRtl ? 'تعديل تسجيل قياسات المنافس' : 'Edit Competitor Metric Log') : (isRtl ? 'تسجيل قياسات شركة منافسة' : 'Log Competitor Metrics')}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    {isRtl ? 'أدخل المؤشرات والبيانات يدوياً بكل حرية وتحكم' : 'Build freely and evaluate specific companion metric keys'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-950 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveDynamicLog} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Competitor */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{isRtl ? 'الشركة المنافسة' : 'Select Competitor'}</label>
                    <select
                      value={logCompId}
                      onChange={(e) => handleFormCompetitorChange(e.target.value)}
                      disabled={!!editingLogId}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none focus:bg-white cursor-pointer"
                    >
                      {competitors.map(c => (
                        <option key={c.id} value={c.id}>
                          {isRtl ? `${c.nameAr || c.name} (${c.platform})` : `${c.name} (${c.platform})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{isRtl ? 'تاريخ تسجيل القياس' : 'Log Date'}</label>
                    <input
                      type="date"
                      required
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Period Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#d97706] uppercase tracking-widest block">{isRtl ? 'دورية القياس لربط المقارنة' : 'Reporting Period'}</label>
                    <select
                      value={logPeriod}
                      onChange={(e) => setLogPeriod(e.target.value as any)}
                      className="w-full px-4 py-3 bg-amber-50/50 border border-amber-200 text-amber-950 font-extrabold rounded-xl text-xs outline-none cursor-pointer focus:bg-white focus:border-amber-400"
                    >
                      <option value="daily">{isRtl ? '☀️ يومي (تسجيل يومي)' : '☀️ Daily Log Period'}</option>
                      <option value="weekly">{isRtl ? '🔁 أسبوعي (تسجيل أسبوعي)' : '🔁 Weekly Log Period'}</option>
                      <option value="monthly">{isRtl ? '📅 شهري (تسجيل شهري)' : '📅 Monthly Log Period'}</option>
                    </select>
                  </div>

                  {/* Matched Platform Visual indicator */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{isRtl ? 'المنصة المسجلة' : 'Assigned Platform'}</label>
                    <div className="px-4 py-3 bg-gray-100 border border-gray-200 text-gray-500 font-bold rounded-xl text-xs flex items-center gap-2">
                      <Sparkles size={12} className="text-emerald-500" />
                      <span>{logPlatform}</span>
                    </div>
                  </div>
                </div>

                {/* VISUAL PERIOD INFORMATION FLAG BANNER & INTEL BASELINE */}
                <div className="p-4 bg-zinc-950 text-white rounded-[1.5rem] border border-zinc-800 space-y-3.5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2 relative z-10">
                    <span className="text-[10px] uppercase font-black text-emerald-400 block tracking-widest flex items-center gap-1.5">
                      <Activity size={12} />
                      {isRtl ? 'مستويات تفوق كروبسا التنافسي المرجعية' : 'CROPSA Competitive reference baselines'}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono font-black text-[9px] rounded-md uppercase tracking-wider border border-emerald-500/30">
                      {logPeriod === 'daily' ? (isRtl ? 'مقارن يومي' : 'Daily baselines') :
                       logPeriod === 'monthly' ? (isRtl ? 'مقارن شهري' : 'Monthly baselines') :
                       (isRtl ? 'مقارن أسبوعي' : 'Weekly baselines')}
                    </span>
                  </div>

                  <p className="text-[11px] font-medium text-zinc-350 leading-relaxed">
                    {isRtl 
                      ? 'قارن القيم التي تسجلها للمنافس أدناه مع تقديرات أداء كروبسا المسجلة للفترة ذاتها لتحديد نسبة تفوقنا فورًا:'
                      : 'Match values you input dynamically with Cropsa estimated base rates in the same period flag:'}
                  </p>

                  <div className="grid grid-cols-3 gap-2.5 relative z-10">
                    <div className="p-2.5 bg-zinc-900 border border-zinc-850 rounded-xl text-center">
                      <p className="text-[9px] text-[#a1a1aa] font-medium">{isRtl ? 'وصول كروبسا' : 'Cropsa Reach'}</p>
                      <p className="text-xs font-black text-emerald-400 font-mono mt-0.5">
                        {getCropsaBaselineForPeriod(logPeriod)['Reach / الوصول'].toLocaleString()}
                      </p>
                    </div>

                    <div className="p-2.5 bg-zinc-900 border border-zinc-850 rounded-xl text-center">
                      <p className="text-[9px] text-[#a1a1aa] font-medium">{isRtl ? 'تفاعل كروبسا' : 'Engagement %'}</p>
                      <p className="text-xs font-black text-emerald-400 font-mono mt-0.5">
                        %{getCropsaBaselineForPeriod(logPeriod)['Engagement Rate / التفاعل %']}
                      </p>
                    </div>

                    <div className="p-2.5 bg-zinc-900 border border-zinc-850 rounded-xl text-center">
                      <p className="text-[9px] text-[#a1a1aa] font-medium">{isRtl ? 'منشورات كروبسا' : 'Cropsa Posts'}</p>
                      <p className="text-xs font-black text-emerald-400 font-mono mt-0.5">
                        {getCropsaBaselineForPeriod(logPeriod)['Posts Count / المنشورات']}
                      </p>
                    </div>
                  </div>
                </div>

                {/* FORM METRIC ROW GENERATOR */}
                <div className="border-t border-gray-100/90 pt-4 space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-500" />
                      {isRtl ? 'مؤشرات القياس والتسجيل المخصصة' : 'Dynamic custom Metric entries'}
                    </label>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      {isRtl ? `${currentFormMetrics.length} حقول` : `${currentFormMetrics.length} metrics`}
                    </span>
                  </div>

                  {/* List of active metric inputs */}
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {currentFormMetrics.map((met, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 bg-gray-50 hover:bg-gray-100/60 p-2.5 rounded-2xl border border-gray-200/60 transition-colors">
                        
                        {/* Metric Label */}
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-black text-gray-800 block truncate" title={met.name}>
                            {met.name}
                          </span>
                        </div>

                        {/* Metric Value Number input */}
                        <input
                          type="number"
                          step="any"
                          required
                          value={met.value}
                          onChange={(e) => handleMetricValueChange(idx, e.target.value)}
                          placeholder={isRtl ? 'أدخل الرقم' : 'Value'}
                          className="w-28 px-3 py-1.5 bg-white border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none rounded-xl text-xs font-bold text-center"
                        />

                        {/* Delete single dynamic log field row */}
                        <button
                          type="button"
                          onClick={() => handleRemoveMetricFormRow(idx)}
                          className="p-1 px-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {currentFormMetrics.length === 0 && (
                      <p className="text-[11px] font-semibold text-gray-400 text-center py-6">
                        {isRtl ? 'لا توجد حقول قياس حالية. يرجى كتابة حقل قياس مخصص أدناه لتعبئة السجلات.' : 'No metric inputs active. Define a new parameter key below!'}
                      </p>
                    )}
                  </div>

                  {/* ADDFORM INPUT TRIGGER FOR CUSTOM PARAMETER KEYS */}
                  <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl space-y-2.5">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">
                      {isRtl ? 'أضف مؤشر قياس مخصص جديد (اكتب وسجل بحريّة)' : 'Define dynamic custom Metric name'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMetricNameStr}
                        onChange={(e) => setNewMetricNameStr(e.target.value)}
                        placeholder={isRtl ? 'مثلاً: عدد المشاركات، مشاهدات الفيديو، أو المشتركين...' : 'e.g., Video Shares, Likes, Reach Index...'}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 text-gray-800 outline-none rounded-xl text-xs font-semibold"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomMetricFormRow();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomMetricFormRow}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
                      >
                        {isRtl ? 'أضف حقل' : 'Add custom Field'}
                      </button>
                    </div>

                    {/* Quick Suggestions Row */}
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-emerald-100/50">
                      <span className="text-[9px] font-black text-emerald-700/60 uppercase tracking-widest block w-full mb-0.5">{isRtl ? '💡 مقترحات سريعة الإضافة (بنقرة واحدة للمساعدة):' : '💡 Quick Suggest Pills (click to append field):'}</span>
                      {[
                        isRtl ? 'Followers / المتابعين' : 'Followers / المتابعين',
                        isRtl ? 'Reach / الوصول' : 'Reach / الوصول',
                        isRtl ? 'Engagement Rate / التفاعل %' : 'Engagement Rate / التفاعل %',
                        isRtl ? 'Video Views / المشاهدات' : 'Video Views / المشاهدات',
                        isRtl ? 'Likes / الإعجابات' : 'Likes / الإعجابات',
                        isRtl ? 'Posts Count / المنشورات' : 'Posts Count / المنشورات'
                      ].map(pill => {
                        const exists = currentFormMetrics.some(m => m.name === pill);
                        return (
                          <button
                            key={pill}
                            type="button"
                            disabled={exists}
                            onClick={() => {
                              setCurrentFormMetrics(prev => [...prev, { name: pill, value: '' }]);
                            }}
                            className={cn(
                              "px-2 py-1 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer border",
                              exists 
                                ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
                                : "bg-white text-emerald-850 hover:text-emerald-950 border-emerald-100/80 hover:bg-emerald-50 hover:scale-[1.02]"
                            )}
                          >
                            + {pill}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Submit / Cancel buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogModalOpen(false);
                      setEditingLogId(null);
                    }}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-250 text-gray-700 text-xs font-black rounded-lg transition-colors cursor-pointer"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-755 text-white text-xs font-black rounded-lg transition-colors shadow-lg shadow-green-100 cursor-pointer"
                  >
                    {isRtl ? 'حفظ القياسات' : 'Save Record'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}

        {/* AI Counter-Strategy Modal */}
        {selectedCompForAi && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCompForAi(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-inner">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-gray-900">
                      {isRtl ? `تحليل استراتيجية: ${selectedCompForAi.nameAr || selectedCompForAi.name}` : `Strategy Analysis: ${selectedCompForAi.name}`}
                    </h3>
                    <p className="text-xs font-bold text-gray-400">
                      {isRtl ? `المنصة: ${selectedCompForAi.platform} • ذكاء اصطناعي تنافسي` : `Platform: ${selectedCompForAi.platform} • Competitive AI`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCompForAi(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              {isAiAnalyzing ? (
                <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
                  <Loader2 className="animate-spin text-purple-600" size={36} />
                  <p className="text-sm font-bold text-gray-700">
                    {isRtl ? 'جاري تحليل نقاط قوة وضعف المنافس واقتراح تكتيكات مواجهة لـ كروبسا...' : 'Analyzing competitor strengths and drafting counter-tactics...'}
                  </p>
                </div>
              ) : aiStrategyResult ? (
                <div className="space-y-6">
                  {/* Analysis Breakdown */}
                  <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 space-y-2">
                    <h4 className="text-xs font-black text-purple-900 uppercase tracking-widest flex items-center gap-2">
                      <Target size={16} />
                      {isRtl ? 'تحليل الموقف التنافسي' : 'Competitive Assessment'}
                    </h4>
                    <p className="text-sm font-medium text-gray-800 leading-relaxed">
                      {aiStrategyResult.analysis}
                    </p>
                  </div>

                  {/* Counter Tactics */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      {isRtl ? 'تكتيكات الرد والمواجهة المقترحة لكروبسا:' : 'Suggested Counter-Tactics:'}
                    </h4>
                    <div className="space-y-2">
                      {aiStrategyResult.counterTactics.map((tactic, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                          <Check className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                          <span className="text-xs font-bold text-gray-800 leading-relaxed">{tactic}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Campaign */}
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 space-y-2">
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={16} />
                      {isRtl ? 'فكرة حملة مضادة مقترحة:' : 'Suggested Counter-Campaign:'}
                    </h4>
                    <p className="text-sm font-bold text-emerald-950">
                      {aiStrategyResult.suggestedCampaign}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        const copyText = `تحليل المنافس (${selectedCompForAi.nameAr || selectedCompForAi.name}):\n${aiStrategyResult.analysis}\n\nالتكتيكات المقترحة:\n${aiStrategyResult.counterTactics.join('\n')}\n\nالحملة المقترحة:\n${aiStrategyResult.suggestedCampaign}`;
                        navigator.clipboard.writeText(copyText);
                        showToast(isRtl ? 'تم نسخ التقرير التنافسي!' : 'Copied report to clipboard!', 'info');
                      }}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black rounded-2xl transition-all"
                    >
                      {isRtl ? 'نسخ التقرير' : 'Copy Report'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCompForAi(null)}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-purple-200 transition-all"
                    >
                      {isRtl ? 'إغلاق' : 'Close'}
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
