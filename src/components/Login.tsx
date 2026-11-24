import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  Globe, 
  Leaf,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  Share2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { translations } from '../translations';
import { Language, User } from '../types';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { signInAnonymously } from 'firebase/auth';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

interface LoginProps {
  onLogin: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
  users: User[];
}

export const Login: React.FC<LoginProps> = ({ onLogin, lang, setLang, users }) => {
  const t = translations[lang];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const isRtl = lang === 'ar';

  // Helper to convert Arabic numerals to Western numerals
  const normalizeArabicDigits = (str: string) => {
    return str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  };

  // Pre-initialize anonymous session as soon as login page loads so Firestore is immediately readable
  useEffect(() => {
    if (!auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        console.warn('Anonymous auth initialization on login mount:', err);
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!email.trim() || !password.trim()) {
      setErrorMsg(isRtl ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      const enteredEmail = email.trim().toLowerCase();
      const enteredPass = password.trim();
      const normEnteredPass = normalizeArabicDigits(enteredPass);
      
      const isDefaultAdmin = (
        (enteredEmail === 'admin' || enteredEmail === 'admin@cropsa.com') && 
        (enteredPass === 'cropsa2026' || normEnteredPass === 'cropsa2026')
      );
      
      // Ensure active session with Firebase Auth to satisfy Firestore Security Rules
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authErr) {
          console.warn('Firebase Auth sign in fallback:', authErr);
        }
      }

      // Load fresh users directly from Firestore to ensure synchronized login
      let currentUsersList = users;
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const fetched: User[] = [];
        snapshot.forEach(d => {
          fetched.push({ ...(d.data() as User), id: d.id });
        });
        if (fetched.length > 0) {
          currentUsersList = fetched;
        }
      } catch (err) {
        console.warn('Fallback: firebase login fetch failed, attempting retry...', err);
        try {
          if (!auth.currentUser) await signInAnonymously(auth);
          const retrySnap = await getDocs(collection(db, 'users'));
          const retryFetched: User[] = [];
          retrySnap.forEach(d => {
            retryFetched.push({ ...(d.data() as User), id: d.id });
          });
          if (retryFetched.length > 0) {
            currentUsersList = retryFetched;
          }
        } catch (_) {}
      }

      const matchedUser = currentUsersList.find(u => {
        const uEmail = (u.email || '').trim().toLowerCase();
        const uUsername = uEmail.split('@')[0];
        const uName = (u.name || '').trim().toLowerCase();
        const uPass = (u.password || '').trim();
        const normUPass = normalizeArabicDigits(uPass);

        // Match by full email, username before '@', or exact user name
        const isIdentityMatched = 
          uEmail === enteredEmail || 
          (uUsername && uUsername === enteredEmail) || 
          uName === enteredEmail;

        if (!isIdentityMatched) return false;

        // Master password 'cropsa2026' always grants access to any recognized user
        if (enteredPass === 'cropsa2026' || normEnteredPass === 'cropsa2026') {
          return true;
        }

        // Check if user has an explicit password in Firestore
        if (uPass) {
          return (
            uPass === enteredPass || 
            normUPass === normEnteredPass || 
            uPass === normEnteredPass
          );
        }

        // If user has no password set yet in DB, allow cropsa2026
        return enteredPass === 'cropsa2026';
      });

      setIsLoading(false);

      if (isDefaultAdmin || matchedUser) {
        const loginTime = new Date().toISOString();
        const userObj: User = matchedUser ? {
          ...matchedUser,
          lastLogin: loginTime
        } : {
          id: '1',
          name: 'Ahmed Ali',
          email: 'ahmed@cropsa.com',
          role: 'Admin',
          permissions: ['all'],
          avatar: 'AA',
          lastLogin: loginTime
        };

        // Write the lastLogin timestamp to Firestore asynchronously (non-blocking)
        setDoc(doc(db, 'users', userObj.id), { lastLogin: loginTime }, { merge: true })
          .catch((dbErr) => console.warn("Notice: lastLogin write skipped", dbErr));

        try {
          sessionStorage.setItem('cropsa_current_user', JSON.stringify(userObj));
        } catch (_) {}
        onLogin();
      } else {
        setErrorMsg(isRtl 
          ? 'بيانات الدخول غير صحيحة! يرجى التأكد من البريد الإلكتروني وكلمة المرور.' 
          : 'Invalid credentials! Please verify your email and password.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(isRtl 
        ? 'حدث خطأ في الاتصال بالشبكة. يرجى إعادة المحاولة.' 
        : 'Network connection failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex w-screen overflow-hidden text-gray-900 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* LEFT SIDE: Beautiful Interactive Marketing/Stats Split-Screen (Hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] bg-zinc-950 text-white p-12 xl:p-16 flex-col justify-between relative overflow-hidden border-r border-zinc-800">
        
        {/* Dynamic Glowing Mesh Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] -ml-32 -mb-32 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#1c1c1c_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />

        {/* Header Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-950">
            <Leaf size={22} className="text-white transform -rotate-12" />
          </div>
          <div>
            <span className="text-lg font-black tracking-wider text-white font-sans uppercase">CROPSA</span>
            <span className="text-[10px] font-bold text-emerald-400 block tracking-widest leading-none">DIGITAL AGRIC</span>
          </div>
        </div>

        {/* Ambient Display & Stats Content */}
        <div className="relative z-10 my-auto max-w-xl space-y-10">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-black uppercase tracking-wider">
              <Sparkles size={12} /> {isRtl ? 'البوابة الداخلية للموظفين' : 'Internal Staff Portal'}
            </span>
            <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight uppercase">
              {isRtl 
                ? 'نظام إدارة التسويق الداخلي بكروبسا' 
                : 'Cropsa Internal Marketing Management System'}
            </h1>
            <p className="text-sm xl:text-base font-medium text-zinc-400 leading-relaxed">
              {isRtl 
                ? 'البوابة الموحدة لموظفي ومسوقي كروبسا لتخطيط وتنسيق حملات السوشيال ميديا، إدارة التصاميم والمواد الدعائية، وتحليل مؤشرات التفاعل والأداء الإعلاني لحظة بلحظة.' 
                : 'The unified hub for Cropsa team and marketing specialists to plan, schedule social campaigns, manage creative assets, and analyze engagement and outreach analytics in real time.'}
            </p>
          </div>

          {/* Floating Live Feature highlights */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-2">
              <TrendingUp className="text-emerald-500" size={20} />
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">{isRtl ? 'إدارة مؤشرات الأداء' : 'Marketing Analytics'}</h4>
              <p className="text-[11px] text-zinc-400 font-medium">{isRtl ? 'قياس نسب الوصول، التفاعل ومتابعة الميزانيات الترويجية للحملات.' : 'Assess engagement, reach, and marketing budgets easily.'}</p>
            </div>
            <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-2">
              <Share2 className="text-emerald-500" size={20} />
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">{isRtl ? 'جدولة وتخطيط فوري' : 'Campaign Planning'}</h4>
              <p className="text-[11px] text-zinc-400 font-medium">{isRtl ? 'تقويم تسويقي وقنوات تحضير ونشر متكاملة لمنصات التواصل.' : 'Interactive planning calendar and social channels scheduler.'}</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between border-t border-zinc-900 pt-6">
          <p className="text-xs font-black text-zinc-500 tracking-wider">
            {isRtl ? 'أمن المعلومات والمحتوى - كروبسا' : 'CROPSA MARKETING INTERNAL NETWORK'}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-400">{isRtl ? 'شبكة كروبسا الداخلية آمنة' : 'Secure internal network'}</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Highly Aesthetic, Polished Login Form Container */}
      <div className="w-full lg:w-[45%] xl:w-[40%] bg-zinc-50 flex flex-col justify-between p-8 md:p-12 xl:p-16 relative">
        
        {/* Subtle Decorative Ambient Orb */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-100/30 rounded-full blur-[80px] pointer-events-none" />

        {/* Language Switcher and Tiny Logo (for mobile view) */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex lg:hidden items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Leaf size={14} className="text-white transform -rotate-12" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-wider leading-none text-gray-900">CROPSA</span>
              <span className="text-[8px] font-black tracking-wider text-green-700 leading-none">{isRtl ? 'التسويق الداخلي' : 'Internal Marketing'}</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 bg-white border border-gray-200/80 rounded-full text-xs font-black text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all cursor-pointer",
              isRtl ? "mr-auto" : "ml-auto"
            )}
          >
            <Globe size={13} className="text-emerald-600" />
            <span>{lang === 'en' ? 'العربية' : 'English'}</span>
          </button>
        </div>

        {/* Form area wrapped in subtle animation */}
        <div className="my-auto max-w-sm w-full mx-auto space-y-8 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-[10px] font-black uppercase tracking-wider mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
              {isRtl ? 'بوابة الموظفين والمسوقين' : 'Marketers & Staff Hub'}
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
              {isRtl ? 'تسجيل الدخول' : 'Sign In'}
            </h2>
            <p className="text-xs font-bold text-gray-400 leading-tight">
              {isRtl 
                ? 'بوابة التسويق الداخلي - يرجى إدخال الحساب الوظيفي المعتمد' 
                : 'Internal Marketing Portal - Please enter authorized credentials'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50/80 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-xs font-bold shadow-sm">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.email}</label>
              <div className="relative">
                <Mail className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400", isRtl ? "right-4" : "left-4")} size={18} />
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isRtl ? "مثال: admin@cropsa.com" : "admin@cropsa.com"}
                  className={cn(
                    "w-full py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-semibold text-sm text-gray-800 shadow-sm focus:border-emerald-600",
                    isRtl ? "pr-12 pl-4" : "pl-12 pr-4"
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.password}</label>
              <div className="relative">
                <Lock className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400", isRtl ? "right-4" : "left-4")} size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    "w-full py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-semibold text-sm text-gray-800 shadow-sm focus:border-emerald-600",
                    isRtl ? "pr-12 pl-12" : "pl-12 pr-12"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1.5 cursor-pointer transition-colors",
                    isRtl ? "left-3" : "right-3"
                  )}
                  title={showPassword ? (isRtl ? 'إخفاء كلمة المرور' : 'Hide password') : (isRtl ? 'إظهار كلمة المرور' : 'Show password')}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Quick checkbox remember state */}
            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" defaultChecked />
                <span className="text-gray-400 group-hover:text-gray-900 transition-colors">{isRtl ? 'تذكر بياناتي' : 'Remember me'}</span>
              </label>
              <span className="text-emerald-700 hover:text-emerald-800 transition-colors uppercase cursor-pointer">{isRtl ? 'تغيير الخادم؟' : 'Internal network'}</span>
            </div>

            {/* Premium action submit button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-green-100 cursor-pointer hover:shadow-2xl hover:shadow-green-200 active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>{isRtl ? 'جاري التحقق...' : 'Verifying account...'}</span>
                </>
              ) : (
                <>
                  <span>{isRtl ? 'دخول آمن' : 'Secured Access'}</span>
                  <ArrowRight size={18} className={cn("transition-transform group-hover:translate-x-1", isRtl ? "rotate-180" : "")} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer credits block */}
        <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-8">
          {isRtl ? 'كروبسا زراعة رقمية ٢٠٢٦ • جميع الحقوق محفوظة' : 'Cropsa digital systems LLC • 2026'}
        </p>
      </div>

    </div>
  );
};
