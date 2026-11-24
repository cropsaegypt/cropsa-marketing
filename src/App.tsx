import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { LayoutDashboard, FileStack, Trello, Calendar as CalendarIcon, Bell } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Kanban } from './components/Kanban';
import { Materials } from './components/Materials';
import { Analytics } from './components/Analytics';
import { Competitors } from './components/Competitors';
import { Login } from './components/Login';
import { ContentPrep } from './components/ContentPrep';
import { Users } from './components/Users';
import { Calendar } from './components/Calendar';
import { AgriEvents } from './components/AgriEvents';
import { Notifications } from './components/Notifications';
import { AgriWeather } from './components/AgriWeather';
import { Settings } from './components/Settings';
import { Profile } from './components/Profile';
import { ContentDetailModal } from './components/ContentDetailModal';
import { NewContentModal } from './components/NewContentModal';
import { MOCK_CONTENT, MOCK_USERS } from './constants';
import { ContentItem, Language, ContentStatus, Task, Comment, User, CustomKPI, DashboardWidget, MaterialItem, KanbanStage } from './types';
import { cn } from './lib/utils';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { signInAnonymously, signOut } from 'firebase/auth';
import { ToastContainer } from './components/Toast';

// Mock Data
export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem('cropsa_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem('cropsa_current_user');
      return !!saved;
    } catch (_) {
      return false;
    }
  });

  useEffect(() => {
    // ALWAYS ensure an active Firebase Auth session so Firestore security rules allow reading users & data
    const ensureAuth = async () => {
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.warn('Anonymous sign-in on app mount:', err);
        }
      }
    };
    ensureAuth();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        signInAnonymously(auth).catch((err) => {
          console.warn('Anonymous sign-in on auth change:', err);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('cropsa_current_user');
    } catch (_) {}
    setCurrentUser(null);
    setIsLoggedIn(false);
    if (!auth.currentUser) {
      signInAnonymously(auth).catch(() => {});
    }
  };
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'kanban' | 'materials' | 'analytics' | 'competitors' | 'preparation' | 'users' | 'events' | 'notifications' | 'settings' | 'weather' | 'profile'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([
    { id: '1', name: 'Wheat Harvest Photo', type: 'Image', url: 'https://picsum.photos/seed/wheat/800/600', addedDate: '2026-04-01', size: '2.4 MB' },
    { id: '2', name: 'Irrigation Tutorial', type: 'Video', url: '#', addedDate: '2026-03-28', size: '45.8 MB' },
    { id: '3', name: 'Fertilizer Guide 2026', type: 'Document', url: '#', addedDate: '2026-04-02', size: '1.2 MB' },
    { id: '4', name: 'Cropsa Website Link', type: 'Link', url: 'https://cropsa.com', addedDate: '2026-03-15' },
  ]);
  const [emailRules, setEmailRules] = useState<any[]>([]);
  const [platformAnalytics, setPlatformAnalytics] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('cropsa_weekly_metrics');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 50) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    
    const months = ['April', 'May', 'June', 'July', 'August', 'September'];
    const platforms = ['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'WhatsApp', 'Other'];
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    
    const generated: any[] = [];
    platforms.forEach(p => {
      months.forEach((m, mIdx) => {
        let baseReach = 15000;
        let baseEng = 2000;
        let baseFollowers = 5000;
        let baseClicks = 600;
        let baseRevenue = 150;
        
        if (p === 'Facebook') {
          baseReach = 28000 + mIdx * 2500;
          baseEng = 4100 + mIdx * 350;
          baseFollowers = 9500 + mIdx * 500;
          baseClicks = 1300 + mIdx * 110;
          baseRevenue = 330 + mIdx * 45;
        } else if (p === 'Instagram') {
          baseReach = 45000 + mIdx * 4000;
          baseEng = 8500 + mIdx * 700;
          baseFollowers = 14000 + mIdx * 900;
          baseClicks = 2500 + mIdx * 180;
          baseRevenue = 520 + mIdx * 60;
        } else if (p === 'TikTok') {
          baseReach = 95000 + mIdx * 9000;
          baseEng = 23000 + mIdx * 1700;
          baseFollowers = 19000 + mIdx * 2500;
          baseClicks = 4200 + mIdx * 350;
          baseRevenue = 320 + mIdx * 40;
        } else if (p === 'LinkedIn') {
          baseReach = 11000 + mIdx * 700;
          baseEng = 1500 + mIdx * 120;
          baseFollowers = 3800 + mIdx * 250;
          baseClicks = 500 + mIdx * 35;
          baseRevenue = 210 + mIdx * 25;
        } else if (p === 'WhatsApp') {
          baseReach = 7500 + mIdx * 500;
          baseEng = 2600 + mIdx * 180;
          baseFollowers = 2100 + mIdx * 120;
          baseClicks = 650 + mIdx * 50;
          baseRevenue = 110 + mIdx * 12;
        } else {
          baseReach = 14000 + mIdx * 900;
          baseEng = 1800 + mIdx * 110;
          baseFollowers = 4600 + mIdx * 300;
          baseClicks = 800 + mIdx * 60;
          baseRevenue = 130 + mIdx * 20;
        }
        
        weeks.forEach((w, wIdx) => {
          const wave = Math.sin((mIdx + wIdx) * 1.5);
          const reach = Math.round((baseReach / 4) * (1 + wave * 0.12));
          const engagement = Math.round((baseEng / 4) * (1 + wave * 0.1));
          const followers = Math.round(baseFollowers + (wIdx + 1) * (p === 'TikTok' ? 450 : 150));
          const linkClicks = Math.round((baseClicks / 4) * (1 + wave * 0.14));
          const revenue = Math.round((baseRevenue / 4) * (1 + wave * 0.18));
          
          generated.push({
            id: `${p.toLowerCase().slice(0, 2)}-${m.toLowerCase().slice(0, 3)}-w${wIdx + 1}`,
            platform: p,
            month: m,
            week: w,
            reach,
            engagement,
            followers,
            linkClicks,
            revenue
          });
        });
      });
    });
    
    try {
      localStorage.setItem('cropsa_weekly_metrics', JSON.stringify(generated));
    } catch (_) {}
    return generated;
  });
  const [events, setEvents] = useState<any[]>([
    {
      id: '1',
      title: 'عيد الفلاح المصري',
      date: '2026-09-09',
      category: 'National',
      description: 'يوم تقدير الفلاح المصري ودوره في الاقتصاد القومي.',
      recommendations: ['Facebook', 'Instagram', 'LinkedIn'],
      importance: 'High'
    },
    {
      id: '2',
      title: 'بداية موسم حصاد القمح',
      date: '2026-04-15',
      category: 'Agricultural',
      description: 'أهم موسم زراعي في مصر، يتطلب تغطية مكثفة لنصائح الحصاد والتوريد.',
      recommendations: ['Facebook', 'WhatsApp', 'TikTok'],
      importance: 'High'
    }
  ]);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

  // Firestore sync for users list
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const fetched: User[] = [];
      snapshot.forEach((doc) => {
        fetched.push(doc.data() as User);
      });

      if (fetched.length === 0) {
        // Populate Firestore if empty
        MOCK_USERS.forEach(async (u) => {
          try {
            await setDoc(doc(db, 'users', u.id), u);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${u.id}`);
          }
        });
        setUsers(MOCK_USERS);
      } else {
        fetched.sort((a, b) => a.id.localeCompare(b.id));
        setUsers(fetched);

        // Keep local current user state matched up
        if (currentUser) {
          const matched = fetched.find(u => u.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase());
          if (matched) {
            if (matched.name !== currentUser.name || matched.password !== currentUser.password || matched.role !== currentUser.role) {
              setCurrentUser(matched);
              sessionStorage.setItem('cropsa_current_user', JSON.stringify(matched));
            }
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsub();
  }, [currentUser]);

  const handleUpdateUsers = async (updatedUsers: User[]) => {
    // Delete missing users
    const currentIds = new Set(updatedUsers.map(u => u.id));
    const deletedUsers = users.filter(u => !currentIds.has(u.id));

    for (const u of deletedUsers) {
      try {
        await deleteDoc(doc(db, 'users', u.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${u.id}`);
      }
    }

    // Add or Update modified users
    for (const u of updatedUsers) {
      const existing = users.find(ex => ex.id === u.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(u)) {
        try {
          await setDoc(doc(db, 'users', u.id), u);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${u.id}`);
        }
      }
    }

    setUsers(updatedUsers);
    
    if (currentUser) {
      const updatedSelf = updatedUsers.find(u => u.id === currentUser.id);
      if (updatedSelf) {
        setCurrentUser(updatedSelf);
        sessionStorage.setItem('cropsa_current_user', JSON.stringify(updatedSelf));
      }
    }
  };

  // Firestore sync for content list
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'content'), async (snapshot) => {
      const fetched: ContentItem[] = [];
      snapshot.forEach((doc) => {
        fetched.push(doc.data() as ContentItem);
      });

      if (fetched.length === 0) {
        try {
          const initDoc = await getDoc(doc(db, 'settings', 'init_status'));
          const data = initDoc.exists() ? initDoc.data() : {};
          if (!data?.content) {
            // Populate Firestore if empty
            const promises = MOCK_CONTENT.map(async (c) => {
              await setDoc(doc(db, 'content', c.id), c);
            });
            await Promise.all(promises);
            await setDoc(doc(db, 'settings', 'init_status'), { ...data, content: true });
            setContent(MOCK_CONTENT);
          } else {
            setContent([]);
          }
        } catch (err) {
          setContent([]);
        }
      } else {
        // Sort ascending by position first (if present), then by dueDate, then id to preserve order
        fetched.sort((a, b) => {
          if (a.position !== undefined && b.position !== undefined) {
            return a.position - b.position;
          }
          if (a.position !== undefined) return -1;
          if (b.position !== undefined) return 1;

          if (a.dueDate !== b.dueDate) {
            return a.dueDate.localeCompare(b.dueDate);
          }
          return a.id.localeCompare(b.id);
        });
        setContent(fetched);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'content');
    });

    return () => unsub();
  }, []);

  // Firestore sync for materials list
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'materials'), async (snapshot) => {
      const fetched: MaterialItem[] = [];
      snapshot.forEach((doc) => {
        fetched.push(doc.data() as MaterialItem);
      });

      if (fetched.length === 0) {
        try {
          const initDoc = await getDoc(doc(db, 'settings', 'init_status'));
          const data = initDoc.exists() ? initDoc.data() : {};
          if (!data?.materials) {
            const initialMaterials: MaterialItem[] = [
              { id: '1', name: 'Wheat Harvest Photo', type: 'Image', url: 'https://picsum.photos/seed/wheat/800/600', addedDate: '2026-04-01', size: '2.4 MB' },
              { id: '2', name: 'Irrigation Tutorial', type: 'Video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', addedDate: '2026-03-28', size: '45.8 MB' },
              { id: '3', name: 'Fertilizer Guide 2026', type: 'Document', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', addedDate: '2026-04-02', size: '1.2 MB' },
              { id: '4', name: 'Cropsa Website Link', type: 'Link', url: 'https://cropsa.com', addedDate: '2026-03-15' },
            ];
            const promises = initialMaterials.map(async (m) => {
              await setDoc(doc(db, 'materials', m.id), m);
            });
            await Promise.all(promises);
            await setDoc(doc(db, 'settings', 'init_status'), { ...data, materials: true });
            setMaterials(initialMaterials);
          } else {
            setMaterials([]);
          }
        } catch (err) {
          setMaterials([]);
        }
      } else {
        fetched.sort((a, b) => a.id.localeCompare(b.id));
        setMaterials(fetched);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'materials');
    });

    return () => unsub();
  }, []);

  const handleUpdateMaterials = async (updatedMaterials: MaterialItem[]) => {
    const currentIds = new Set(updatedMaterials.map(m => m.id));
    const deleted = materials.filter(m => !currentIds.has(m.id));
    for (const m of deleted) {
      try {
        await deleteDoc(doc(db, 'materials', m.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `materials/${m.id}`);
      }
    }
    for (const m of updatedMaterials) {
      try {
        await setDoc(doc(db, 'materials', m.id), m);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `materials/${m.id}`);
      }
    }
  };

  // Firestore sync for events list
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'events'), async (snapshot) => {
      const fetched: any[] = [];
      snapshot.forEach((doc) => {
        fetched.push(doc.data());
      });

      if (fetched.length === 0) {
        try {
          const initDoc = await getDoc(doc(db, 'settings', 'init_status'));
          const data = initDoc.exists() ? initDoc.data() : {};
          if (!data?.events) {
            const initialEvents = [
              {
                id: '1',
                title: 'عيد الفلاح المصري',
                date: '2026-09-09',
                category: 'National',
                description: 'يوم تقدير الفلاح المصري ودوره في الاقتصاد القومي.',
                recommendations: ['Facebook', 'Instagram', 'LinkedIn'],
                importance: 'High'
              },
              {
                id: '2',
                title: 'بداية موسم حصاد القمح',
                date: '2026-04-15',
                category: 'Agricultural',
                description: 'أهم موسم زراعي في مصر، يتطلب تغطية مكثفة لنصائح الحصاد والتوريد.',
                recommendations: ['Facebook', 'WhatsApp', 'TikTok'],
                importance: 'High'
              }
            ];
            const promises = initialEvents.map(async (ev) => {
              await setDoc(doc(db, 'events', ev.id), ev);
            });
            await Promise.all(promises);
            await setDoc(doc(db, 'settings', 'init_status'), { ...data, events: true });
            setEvents(initialEvents);
          } else {
            setEvents([]);
          }
        } catch (err) {
          setEvents([]);
        }
      } else {
        fetched.sort((a, b) => a.date.localeCompare(b.date));
        setEvents(fetched);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'events');
    });

    return () => unsub();
  }, []);

  const handleUpdateEvents = async (updatedEvents: any[]) => {
    const currentIds = new Set(updatedEvents.map(e => e.id));
    const deleted = events.filter(e => !currentIds.has(e.id));
    for (const e of deleted) {
      try {
        await deleteDoc(doc(db, 'events', e.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `events/${e.id}`);
      }
    }
    for (const e of updatedEvents) {
      try {
        await setDoc(doc(db, 'events', e.id), e);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `events/${e.id}`);
      }
    }
  };

  // Redirect non-admin users if they try to access admin tabs
  useEffect(() => {
    if (isLoggedIn && currentUser && currentUser.role !== 'Admin') {
      if (activeTab === 'users' || activeTab === 'settings') {
        setActiveTab('dashboard');
      }
    }
  }, [activeTab, currentUser, isLoggedIn]);

  const [customKPIs, setCustomKPIs] = useState<CustomKPI[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'custom_kpis'), async (snapshot) => {
      const fetched: CustomKPI[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push(docSnap.data() as CustomKPI);
      });

      if (fetched.length === 0) {
        try {
          const initDoc = await getDoc(doc(db, 'settings', 'init_status'));
          const data = initDoc.exists() ? initDoc.data() : {};
          if (!data?.custom_kpis) {
            const initialKPIs: CustomKPI[] = [
              { id: '1', name: 'Facebook Posts', target: '10', current: '0', platform: 'Facebook', metric: 'posts', progress: 0 },
              { id: '2', name: 'Instagram Posts', target: '8', current: '0', platform: 'Instagram', metric: 'posts', progress: 0 },
            ];
            const promises = initialKPIs.map(async (k) => {
              await setDoc(doc(db, 'custom_kpis', k.id), k);
            });
            await Promise.all(promises);
            await setDoc(doc(db, 'settings', 'init_status'), { ...data, custom_kpis: true });
            setCustomKPIs(initialKPIs);
          } else {
            setCustomKPIs([]);
          }
        } catch (err) {
          setCustomKPIs([]);
        }
      } else {
        fetched.sort((a, b) => a.id.localeCompare(b.id));
        setCustomKPIs(fetched);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'custom_kpis');
    });

    return () => unsub();
  }, []);

  const handleUpdateKPIs = async (updated: CustomKPI[]) => {
    const currentIds = new Set(updated.map(kpi => kpi.id));
    const deleted = customKPIs.filter(kpi => !currentIds.has(kpi.id));
    for (const kpi of deleted) {
      try {
        await deleteDoc(doc(db, 'custom_kpis', kpi.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `custom_kpis/${kpi.id}`);
      }
    }
    for (const kpi of updated) {
      try {
        await setDoc(doc(db, 'custom_kpis', kpi.id), kpi);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `custom_kpis/${kpi.id}`);
      }
    }
    setCustomKPIs(updated);
  };

  const canCreate = useMemo(() => {
    if (!currentUser) return true; // Preview fallback
    const perms = currentUser.permissions || (currentUser.role === 'Admin' ? ['all'] : ['view']);
    return perms.includes('all') || perms.includes('create') || currentUser.role === 'Admin';
  }, [currentUser]);
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>([
    { id: 'stats', type: 'stats', title: 'Stats Grid', visible: true, order: 0 },
    { id: 'chart', type: 'chart', title: 'Performance Chart', visible: true, order: 1 },
    { id: 'goals', type: 'goals', title: 'Campaign Goals', visible: true, order: 2 },
    { id: 'platforms', type: 'platforms', title: 'Platform Performance', visible: true, order: 3 },
    { id: 'kpis', type: 'kpis', title: 'KPI Summary', visible: true, order: 4 },
    { id: 'recent', type: 'recent', title: 'Recent Content', visible: true, order: 5 },
  ]);
  const [stages, setStages] = useState<KanbanStage[]>([]);
  const [tabNames, setTabNames] = useState<string[]>([]);

  // Sync stages to Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'stages'), async (snapshot) => {
      const fetched: KanbanStage[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push(docSnap.data() as KanbanStage);
      });

      const initialStages: KanbanStage[] = [
        { id: 'stage-1', name: 'Idea', nameAr: 'فكرة', status: 'Idea', color: '#6366f1', order: 0 },
        { id: 'stage-2', name: 'In Progress', nameAr: 'قيد التنفيذ', status: 'In Progress', color: '#f59e0b', order: 1 },
        { id: 'stage-review', name: 'Review', nameAr: 'مراجعة', status: 'Review', color: '#ec4899', order: 2 },
        { id: 'stage-3', name: 'Ready', nameAr: 'جاهز', status: 'Ready', color: '#10b981', order: 3 },
        { id: 'stage-4', name: 'Approved', nameAr: 'معتمد', status: 'Approved', color: '#3b82f6', order: 4 },
        { id: 'stage-5', name: 'Scheduled', nameAr: 'مجدول', status: 'Scheduled', color: '#8b5cf6', order: 5 },
        { id: 'stage-6', name: 'Published', nameAr: 'منشور', status: 'Published', color: '#059669', order: 6 },
      ];

      if (fetched.length === 0) {
        const promises = initialStages.map(async (s) => {
          await setDoc(doc(db, 'stages', s.id), s);
        });
        await Promise.all(promises);
        setStages(initialStages);
      } else {
        // Auto inject stage-review if missing
        if (!fetched.some(s => s.status === 'Review')) {
          try {
            await setDoc(doc(db, 'stages', 'stage-review'), { id: 'stage-review', name: 'Review', nameAr: 'مراجعة', status: 'Review', color: '#ec4899', order: 2 });
          } catch (err) {
            // Safe ignore/fallthrough in case of transient error
          }
        }
        fetched.sort((a, b) => {
          const orderA = a.order !== undefined ? a.order : 999;
          const orderB = b.order !== undefined ? b.order : 999;
          if (orderA !== orderB) return orderA - orderB;
          return a.id.localeCompare(b.id);
        });
        setStages(fetched);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'stages');
    });

    return () => unsub();
  }, []);

  const handleUpdateStages = async (updatedStages: KanbanStage[]) => {
    const withOrder = updatedStages.map((s, idx) => ({ ...s, order: idx }));
    const currentIds = new Set(withOrder.map(s => s.id));
    const deleted = stages.filter(s => !currentIds.has(s.id));
    for (const s of deleted) {
      try {
        await deleteDoc(doc(db, 'stages', s.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `stages/${s.id}`);
      }
    }
    for (const s of withOrder) {
      try {
        await setDoc(doc(db, 'stages', s.id), s);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `stages/${s.id}`);
      }
    }
    setStages(withOrder);
  };

  // Sync tab names to Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'tab_names'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.names)) {
          setTabNames(data.names);
        }
      } else {
        const defaultNames = ['Dashboard', 'Preparation', 'Kanban', 'Calendar', 'Events', 'Analytics', 'Materials', 'Users', 'Settings'];
        setDoc(doc(db, 'settings', 'tab_names'), { names: defaultNames }).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, 'settings/tab_names');
        });
        setTabNames(defaultNames);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/tab_names');
    });

    return () => unsub();
  }, []);

  const handleUpdateTabNames = async (names: string[]) => {
    try {
      await setDoc(doc(db, 'settings', 'tab_names'), { names });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/tab_names');
    }
    setTabNames(names);
  };
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [isNewContentModalOpen, setIsNewContentModalOpen] = useState(false);
  const [socialConnections, setSocialConnections] = useState({
    Facebook: true,
    Instagram: true,
    LinkedIn: false,
    TikTok: false
  });

  const [analyticsData, setAnalyticsData] = useState({
    reach: '124.5K',
    engagement: '4.8%',
    conversion: '1.2%',
    responseTime: '14m',
    prepSpeed: 85,
    publishAccuracy: 92,
    totalReach: '1.2M'
  });

  const selectedContent = useMemo(() => 
    content.find(c => c.id === selectedContentId), 
  [content, selectedContentId]);

  const handleAddContent = async (newItem: Omit<ContentItem, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const itemWithId = { ...newItem, id } as ContentItem;
    try {
      await setDoc(doc(db, 'content', id), itemWithId);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `content/${id}`);
    }
  };

  const handleToggleSocial = (platform: keyof typeof socialConnections) => {
    setSocialConnections(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  const handleCloneItem = async (clonedItem: ContentItem) => {
    try {
      await setDoc(doc(db, 'content', clonedItem.id), clonedItem);
      setSelectedContentId(clonedItem.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `content/${clonedItem.id}`);
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<ContentItem>) => {
    const existing = content.find(item => item.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    try {
      await setDoc(doc(db, 'content', id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `content/${id}`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'content', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `content/${id}`);
    }
  };

  const handleMoveToKanban = async (id: string, publishDate: string) => {
    const existing = content.find(item => item.id === id);
    if (!existing) return;
    const updated = { ...existing, status: 'Scheduled' as ContentStatus, publishDate };
    try {
      await setDoc(doc(db, 'content', id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `content/${id}`);
    }
  };

  const handleApprove = async (id: string) => {
    const existing = content.find(item => item.id === id);
    if (!existing) return;
    const updated = { ...existing, approvalStatus: 'Approved' as any, status: 'In Progress' as ContentStatus };
    try {
      await setDoc(doc(db, 'content', id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `content/${id}`);
    }
  };

  const handleReject = async (id: string) => {
    const existing = content.find(item => item.id === id);
    if (!existing) return;
    const updated = { ...existing, approvalStatus: 'Rejected' as any };
    try {
      await setDoc(doc(db, 'content', id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `content/${id}`);
    }
  };

  const handleUpdateStatus = async (id: string, status: ContentStatus, stageId?: string, newOrderIds?: string[]) => {
    const existing = content.find(item => item.id === id);
    if (!existing) return;
    try {
      if (newOrderIds && newOrderIds.length > 0) {
        const promises = newOrderIds.map(async (itemId, idx) => {
          const item = content.find(c => c.id === itemId);
          if (item) {
            const isTarget = itemId === id;
            const updated = { 
              ...item, 
              position: idx,
              status: isTarget ? status : item.status,
              stageId: isTarget ? (stageId || null) : item.stageId
            };
            await setDoc(doc(db, 'content', itemId), updated);
          }
        });
        await Promise.all(promises);
      } else {
        const updated = { ...existing, status, stageId: stageId || null };
        await setDoc(doc(db, 'content', id), updated);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `content/${id}`);
    }
  };

  const handleUpdateTasks = async (id: string, tasks: Task[]) => {
    const existing = content.find(item => item.id === id);
    if (!existing) return;
    const updated = { ...existing, tasks };
    try {
      await setDoc(doc(db, 'content', id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `content/${id}`);
    }
  };

  const handleUpdateComments = async (id: string, comments: Comment[]) => {
    const existing = content.find(item => item.id === id);
    if (!existing) return;
    const updated = { ...existing, comments };
    try {
      await setDoc(doc(db, 'content', id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `content/${id}`);
    }
  };

  const calculatedKPIs = useMemo(() => {
    return customKPIs.map(kpi => {
      let current = 0;
      if (kpi.metric === 'posts') {
        current = content.filter(c => 
          c.status === 'Published' && 
          (kpi.platform === 'All' || c.platforms.includes(kpi.platform))
        ).length;
      }
      const progress = Math.min(Math.round((current / parseInt(kpi.target || '1')) * 100), 100);
      return { ...kpi, current: current.toString(), progress };
    });
  }, [customKPIs, content]);

  const stats = useMemo(() => {
    const today = new Date();
    const total = content.length;
    const published = content.filter(c => c.status === 'Published').length;
    
    // Delayed items: not published and due date is in the past
    const delayedCount = content.filter(c => {
      const isPublished = (c.status as string) === 'Published';
      if (isPublished) return false;
      const dueDate = new Date(c.dueDate);
      return dueDate < today;
    }).length;

    const inPipeline = content.filter(c => c.status !== 'Published').length;
    
    // Approval Rate - actual calculation
    const approvalRate = total > 0 ? Math.round((content.filter(c => c.approvalStatus === 'Approved').length / total) * 100) : 0;

    // Prep Speed - actual task completion percentage
    const totalTasks = content.reduce((acc, c) => acc + (c.tasks?.length || 0), 0);
    const completedTasks = content.reduce((acc, c) => acc + (c.tasks?.filter(t => t.completed).length || 0), 0);
    const prepSpeed = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    // Publish Accuracy - Penalized by delayed items
    const scheduled = content.filter(c => c.status === 'Scheduled').length;
    const baseAccuracy = 100; 
    const penalty = delayedCount > 0 ? (delayedCount / (published + scheduled + delayedCount || 1)) * 50 : 0;
    const publishAccuracy = Math.round(Math.max(baseAccuracy - penalty, 0));

    // Dynamic Reach calculation per platform
    const platformBaseReach: Record<string, number> = {
      'Facebook': 42000,
      'Instagram': 28000,
      'TikTok': 75000,
      'LinkedIn': 8000,
      'WhatsApp': 5000
    };

    const platformReach = Object.keys(platformBaseReach).reduce((acc, p) => {
      const posts = content.filter(c => c.status === 'Published' && c.platforms.includes(p as any)).length;
      acc[p] = platformBaseReach[p] + (posts * 15000);
      return acc;
    }, {} as Record<string, number>);

    const totalCalculatedReachNum = Object.values(platformReach).reduce((a, b) => a + b, 0) + 1000000; // Base 1M
    const totalCalculatedReach = (totalCalculatedReachNum / 1000000).toFixed(1);

    const updatedAnalyticsData = {
      ...analyticsData,
      prepSpeed,
      publishAccuracy,
      totalReach: `${totalCalculatedReach}M`,
      platformStats: platformReach
    };

    return { 
      total, 
      published, 
      delayed: delayedCount, 
      pending: inPipeline, 
      prepSpeed, 
      approvalRate, 
      publishAccuracy,
      analyticsData: updatedAnalyticsData
    };
  }, [content, analyticsData]);

  if (!isLoggedIn) {
    return (
      <Login 
        onLogin={() => {
          try {
            const saved = sessionStorage.getItem('cropsa_current_user');
            if (saved) {
              setCurrentUser(JSON.parse(saved));
            }
          } catch (_) {}
          setIsLoggedIn(true);
        }} 
        lang={lang} 
        setLang={setLang} 
        users={users} 
      />
    );
  }

  const isDarkTab = false; // Forced to false as per user request for Light Mode across the app

  return (
    <div className={cn(
      "flex h-screen font-sans overflow-hidden transition-colors duration-500", 
      isDarkTab ? "bg-[#0a0a0a] text-gray-100" : "bg-gray-50 text-gray-900",
      lang === 'ar' ? "flex-row text-right" : "flex-row text-left"
    )} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }} 
        lang={lang}
        onLogout={handleLogout}
        isDark={isDarkTab}
        currentUser={currentUser}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          activeTab={activeTab} 
          lang={lang} 
          setLang={setLang} 
          isDark={isDarkTab}
          onNewContent={canCreate ? () => setIsNewContentModalOpen(true) : undefined}
          hasNotifications={stats.delayed > 0}
          onLogout={handleLogout}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32 md:pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <Dashboard 
                key="dashboard" 
                lang={lang} 
                content={content} 
                users={users}
                stats={stats} 
                socialConnections={socialConnections}
                onToggleSocial={handleToggleSocial}
                customKPIs={calculatedKPIs}
                onAddKPI={async (kpi) => {
                  const id = Date.now().toString();
                  const newItem = { ...kpi, id } as CustomKPI;
                  try {
                    await setDoc(doc(db, 'custom_kpis', id), newItem);
                  } catch (err) {
                    handleFirestoreError(err, OperationType.WRITE, `custom_kpis/${id}`);
                  }
                }}
                onDeleteKPI={async (id) => {
                  try {
                    await deleteDoc(doc(db, 'custom_kpis', id));
                  } catch (err) {
                    handleFirestoreError(err, OperationType.DELETE, `custom_kpis/${id}`);
                  }
                }}
                widgets={dashboardWidgets}
                onUpdateWidgets={setDashboardWidgets}
                setActiveTab={setActiveTab}
                events={events}
                platformAnalytics={platformAnalytics}
              />
            )}
            {activeTab === 'kanban' && (
              <Kanban 
                key="kanban" 
                lang={lang} 
                content={content} 
                stages={stages}
                users={users}
                onUpdateStages={setStages}
                onUpdateStatus={handleUpdateStatus}
                onUpdateTasks={handleUpdateTasks}
                onOpenDetail={(id) => setSelectedContentId(id)}
                onNewContent={canCreate ? () => setIsNewContentModalOpen(true) : undefined}
              />
            )}
            {activeTab === 'materials' && (
              <Materials 
                key="materials" 
                lang={lang} 
                items={materials}
                onUpdateItems={handleUpdateMaterials}
              />
            )}
            {activeTab === 'analytics' && (
              <Analytics 
                key="analytics" 
                lang={lang} 
                data={analyticsData}
                onUpdateData={setAnalyticsData}
                platformAnalytics={platformAnalytics}
                onUpdatePlatformAnalytics={setPlatformAnalytics}
                customKPIs={customKPIs}
                onUpdateKPIs={handleUpdateKPIs}
                currentUser={currentUser}
              />
            )}
            {activeTab === 'competitors' && (
              <Competitors 
                key="competitors"
                lang={lang}
                platformAnalytics={platformAnalytics}
              />
            )}
            {activeTab === 'weather' && (
              <AgriWeather 
                key="weather" 
                lang={lang} 
                onAddContent={handleAddContent}
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === 'preparation' && (
              <ContentPrep 
                key="preparation" 
                lang={lang} 
                content={content} 
                onApprove={handleApprove}
                onReject={handleReject}
                onMoveToKanban={handleMoveToKanban}
                onNewContent={() => setIsNewContentModalOpen(true)}
                onEdit={(id) => setSelectedContentId(id)}
                onDelete={handleDeleteItem}
                currentUser={currentUser}
              />
            )}
            {activeTab === 'users' && <Users key="users" lang={lang} users={users} onUpdateUsers={handleUpdateUsers} />}
            {activeTab === 'calendar' && (
              <Calendar 
                key="calendar" 
                lang={lang} 
                content={content} 
                onAddEvent={() => setIsNewContentModalOpen(true)}
                onOpenDetail={(id) => setSelectedContentId(id)}
                onUpdateItem={handleUpdateItem}
                onToggleComplete={async (id) => {
                  const existing = content.find(item => item.id === id);
                  if (!existing) return;
                  const newStatus = existing.status === 'Published' ? 'Scheduled' : 'Published';
                  try {
                    await setDoc(doc(db, 'content', id), { ...existing, status: newStatus });
                  } catch (err) {
                    handleFirestoreError(err, OperationType.WRITE, `content/${id}`);
                  }
                }}
              />
            )}
            {activeTab === 'events' && (
              <AgriEvents 
                key="events" 
                lang={lang} 
                events={events}
                onUpdateEvents={handleUpdateEvents}
                onAddContent={async (title, platforms, preparationDate, eventObj) => {
                  try {
                    const targetPlatforms = platforms.length > 0 ? platforms : ['Facebook'];
                    const promises = targetPlatforms.map(async (platform) => {
                      const id = Math.random().toString(36).substr(2, 9);
                      const newContentItem = {
                        id,
                        title: `${title} (${platform})`,
                        platforms: [platform],
                        type: 'Post',
                        caption: eventObj.description || `${title} prepared for ${platform}`,
                        description: eventObj.description || `${title} prepared for ${platform}`,
                        status: 'Idea',
                        stageId: 'stage-idea',
                        assignedTo: [],
                        createdBy: currentUser?.name || 'System',
                        dueDate: eventObj.date || new Date().toISOString().split('T')[0],
                        publishDate: eventObj.date || '',
                        preparationDate: preparationDate || '',
                        approvalStatus: 'Pending',
                        priority: eventObj.importance === 'High' ? 'High' : eventObj.importance === 'Low' ? 'Low' : 'Normal',
                        tasks: [],
                        comments: [],
                        attachments: [],
                        results: [],
                        labels: [eventObj.category, 'Seasonal']
                      };
                      await setDoc(doc(db, 'content', id), newContentItem);
                    });
                    await Promise.all(promises);
                    setActiveTab('kanban');
                  } catch (err) {
                    handleFirestoreError(err, OperationType.WRITE, 'content_auto_creation');
                  }
                }}
              />
            )}
            {activeTab === 'notifications' && (
              <Notifications 
                key="notifications" 
                lang={lang} 
                content={content} 
                onOpenDetail={(id) => setSelectedContentId(id)}
              />
            )}
            {activeTab === 'settings' && (
              <Settings 
                key="settings" 
                lang={lang} 
                stages={stages}
                onUpdateStages={handleUpdateStages}
                tabNames={tabNames}
                onUpdateTabNames={handleUpdateTabNames}
              />
            )}
            {activeTab === 'profile' && (
              <Profile 
                key="profile"
                lang={lang}
                currentUser={currentUser}
                users={users}
                onUpdateUsers={handleUpdateUsers}
                onLogout={handleLogout}
              />
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {selectedContent && (
            <ContentDetailModal 
              lang={lang}
              item={selectedContent}
              users={users}
              onClose={() => setSelectedContentId(null)}
              onUpdateTasks={handleUpdateTasks}
              onUpdateComments={handleUpdateComments}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onCloneItem={handleCloneItem}
              stages={stages}
            />
          )}
        </AnimatePresence>

        <NewContentModal 
          lang={lang}
          isOpen={isNewContentModalOpen}
          users={users}
          onClose={() => setIsNewContentModalOpen(false)}
          onAdd={handleAddContent}
        />

        {/* Floating Toast Notification Container */}
        <ToastContainer isRtl={lang === 'ar'} />

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
          <div className="bg-white/90 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-2xl p-2 flex items-center justify-around ring-1 ring-black/5">
            {[
              { id: 'dashboard', icon: LayoutDashboard },
              { id: 'kanban', icon: Trello },
              { id: 'preparation', icon: FileStack },
              { id: 'calendar', icon: CalendarIcon },
              { id: 'notifications', icon: Bell },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300",
                  activeTab === item.id 
                    ? "bg-green-600 text-white shadow-lg shadow-green-200 scale-105" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <item.icon size={20} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
