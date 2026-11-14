import React, { useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  X, 
  Printer, 
  Download, 
  User as UserIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  ShieldCheck, 
  Calendar as CalendarIcon 
} from 'lucide-react';
import { translations } from '../translations';
import { Language, ContentItem, User } from '../types';
import { cn } from '../lib/utils';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  content: ContentItem[];
  users: User[];
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  lang,
  content,
  users
}) => {
  const isRtl = lang === 'ar';
  const t = translations[lang];

  // Overdue / Late Items alerts
  const overdueItems = useMemo(() => {
    const today = new Date();
    return content.filter(item => {
      if (item.status === 'Published') return false;
      const dueDate = new Date(item.dueDate);
      return dueDate < today;
    });
  }, [content]);

  // Aggregate user statistics
  const userReport = useMemo(() => {
    if (!users || users.length === 0) return [];
    
    return users.map(user => {
      const hasOpened = !!user.lastLogin;
      
      // Calculate comments made by this user
      let commentsCount = 0;
      content.forEach(item => {
        if (item.comments) {
          item.comments.forEach(c => {
            if (c.user === user.name || c.user?.toLowerCase() === user.email.toLowerCase()) {
              commentsCount++;
            }
          });
        }
      });

      // Calculate content items assigned to this user
      const assignedCount = content.filter(item => 
        item.assignedTo && item.assignedTo.includes(user.name)
      ).length;

      // Calculate tasks completed under their assigned contents
      const completedTasksCount = content.reduce((acc, item) => {
        if (item.assignedTo && item.assignedTo.includes(user.name) && item.tasks) {
          return acc + item.tasks.filter(tk => tk.completed).length;
        }
        return acc;
      }, 0);

      // Counts uploads made
      const uploadsCount = content.reduce((acc, item) => {
        if (item.assignedTo && item.assignedTo.includes(user.name)) {
          const attachmentsLen = item.attachments?.length || 0;
          const resultsLen = item.results?.length || 0;
          return acc + attachmentsLen + resultsLen;
        }
        return acc;
      }, 0);

      return {
        ...user,
        hasOpened,
        commentsCount,
        assignedCount,
        completedTasksCount,
        uploadsCount
      };
    });
  }, [users, content]);

  // Content breakdowns for report
  const publishedItems = useMemo(() => content.filter(c => c.status === 'Published'), [content]);
  const upcomingItems = useMemo(() => content.filter(c => c.status === 'Scheduled'), [content]);
  const preparationItems = useMemo(() => content.filter(c => ['In Progress', 'Ready', 'Idea', 'Review', 'Pending'].includes(c.status)), [content]);

  const [isGenerating, setIsGenerating] = useState(false);

  const getArabicStatus = (status: string) => {
    switch (status) {
      case 'Published': return 'نزل بالفعل';
      case 'Scheduled': return 'هينزل (مجدول)';
      case 'In Progress': return 'قيد التجهيز';
      case 'Ready': return 'جاهز للنشر';
      case 'Idea': return 'فكرة مقترحة';
      case 'Review': return 'قيد المراجعة';
      case 'Pending': return 'قيد الانتظار';
      default: return status;
    }
  };

  const getArabicType = (type: string) => {
    switch (type) {
      case 'Hybrid': return 'هجين';
      case 'Video': return 'فيديو';
      case 'Image': return 'تصميم';
      case 'Article': return 'مقال زراعي';
      default: return type;
    }
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('cropsa-printable-report');
    if (!element) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // higher definition
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll('style').forEach(style => {
            if (style.textContent) {
              // Replace all oklch() color functions with safe hex values in the cloned stylesheets so html2canvas doesn't throw errors
              style.textContent = style.textContent.replace(/oklch\([^)]+\)/g, '#71717a');
            }
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; 
      const pageHeight = 297; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Cropsa-CEO-Executive-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      // fallback
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadTextReport = () => {
    let report = `====================================================\n`;
    report += isRtl 
      ? `     تقرير المدير التنفيذي الشامل - منصة إدارة المحتوى\n`
      : `     Executive Director Comprehensive Report - Content Portal\n`;
    report += `====================================================\n\n`;
    
    const formattedDate = new Date().toLocaleString(isRtl ? 'ar-EG' : 'en-US');
    report += isRtl ? `تاريخ إصدار التقرير: ${formattedDate}\n` : `Report Generated: ${formattedDate}\n`;
    report += isRtl ? `الجهة المصدرة: الإدارة المعتمدة - وكالة كروبسا الرقمية\n` : `Issuer: Executive Office - Cropsa Agency\n`;
    report += `----------------------------------------------------\n\n`;

    report += isRtl ? `[1] ملخص حالة المحتوى والأجندة:\n` : `[1] Content & Pipeline Summary:\n`;
    report += isRtl ? `- إجمالي المحتويات بالمنصة: ${content.length}\n` : `- Total Content Items: ${content.length}\n`;
    report += isRtl ? `- نزل بالفعل (Published): ${publishedItems.length}\n` : `- Already Published: ${publishedItems.length}\n`;
    report += isRtl ? `- هينزل قريباً (Scheduled): ${upcomingItems.length}\n` : `- Scheduled Upcoming: ${upcomingItems.length}\n`;
    report += isRtl ? `- قيد التجهيز والتحضير (In Prep): ${preparationItems.length}\n` : `- In Preparation: ${preparationItems.length}\n`;
    report += isRtl ? `- منشورات متأخرة عن موعدها المستهدف: ${overdueItems.length}\n\n` : `- Overdue Delayed Drafts: ${overdueItems.length}\n\n`;

    report += `----------------------------------------------------\n`;
    report += isRtl ? `[2] تقرير نشاط وحضور الموظفين بالتفصيل:\n\n` : `[2] Detailed Employee Attendance & Activity:\n\n`;

    userReport.forEach((user, idx) => {
      report += `${idx + 1}. ${user.name} (${user.role})\n`;
      report += `   - ${isRtl ? 'البريد الإلكتروني' : 'Email'}: ${user.email}\n`;
      
      const loginStr = user.hasOpened 
        ? (isRtl ? `نشط بالتطبيق (آخر نشاط: ${new Date(user.lastLogin!).toLocaleString('ar-EG')})` : `Active in portal (Last Activity: ${new Date(user.lastLogin!).toLocaleString('en-US')})`)
        : (isRtl ? `❌ غائب (لم يفتح المنصة مطلقاً)` : `❌ Absent (Has NOT logged into the portal)`);
      
      report += `   - ${isRtl ? 'حالة الحضور والفتح' : 'Portal Logins'}: ${loginStr}\n`;
      report += isRtl 
        ? `   - إحصائيات النشاط: المنشورات المعين عليها: ${user.assignedCount} | التعليقات: ${user.commentsCount} | المهام المنجزة: ${user.completedTasksCount} | المرفقات المرفوعة: ${user.uploadsCount}\n`
        : `   - Activity Metrics: Assigned Posts: ${user.assignedCount} | Comments Written: ${user.commentsCount} | Done Tasks: ${user.completedTasksCount} | Uploaded files: ${user.uploadsCount}\n`;
      report += `   ------------------------------------------------\n`;
    });

    if (overdueItems.length > 0) {
      report += `\n----------------------------------------------------\n`;
      report += isRtl ? `[3] تنبيهات التأخير للمدير التنفيذي:\n\n` : `[3] Overdue Items Alerts:\n\n`;
      overdueItems.forEach((item, idx) => {
        report += `${idx + 1}. ${item.title} (${item.type})\n`;
        report += `   - ${isRtl ? 'موعد الاستحقاق' : 'Target Date'}: ${item.dueDate} | ${isRtl ? 'الأولوية' : 'Priority'}: ${item.priority}\n`;
      });
    }

    report += `\n====================================================\n`;
    report += isRtl ? `نهاية التقرير - معتمد رسمياً من النظام الإلكتروني لوكالة كروبسا\n` : `End of official report generated by Cropsa Platform.\n`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cropsa-CEO-Executive-Report-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md overflow-y-auto p-4 md:p-8 no-scrollbar print:p-0 print:m-0 print:bg-white print:static print:overflow-visible">
      
      {/* Dynamic Native Print Injector Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #cropsa-printable-report, #cropsa-printable-report * {
            visibility: visible !important;
          }
          #cropsa-printable-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 30px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
        }

        /* html2canvas color Compatibility Layer - Replaces oklch gradients and styles with HEX / RGBA fallbacks */
        #cropsa-printable-report {
          background-color: #ffffff !important;
          color: #181c24 !important;
        }
        #cropsa-printable-report .text-zinc-950 { color: #020202 !important; }
        #cropsa-printable-report .text-zinc-900 { color: #18181b !important; }
        #cropsa-printable-report .text-zinc-800 { color: #27272a !important; }
        #cropsa-printable-report .text-zinc-500 { color: #71717a !important; }
        #cropsa-printable-report .text-zinc-400 { color: #a1a1aa !important; }
        #cropsa-printable-report .text-zinc-405 { color: #a1a1aa !important; }
        #cropsa-printable-report .text-green-600 { color: #16a34a !important; }
        #cropsa-printable-report .text-green-700 { color: #15803d !important; }
        #cropsa-printable-report .text-emerald-600 { color: #059669 !important; }
        #cropsa-printable-report .text-emerald-700 { color: #047857 !important; }
        #cropsa-printable-report .text-emerald-800 { color: #065f46 !important; }
        #cropsa-printable-report .text-blue-700 { color: #1d4ed8 !important; }
        #cropsa-printable-report .text-blue-800 { color: #1e40af !important; }
        #cropsa-printable-report .text-amber-700 { color: #b55309 !important; }
        #cropsa-printable-report .text-amber-800 { color: #92400e !important; }
        #cropsa-printable-report .text-rose-500 { color: #e11d48 !important; }
        #cropsa-printable-report .text-rose-600 { color: #e11d48 !important; }
        #cropsa-printable-report .text-rose-700 { color: #be123c !important; }
        #cropsa-printable-report .text-rose-800 { color: #9f1239 !important; }
        #cropsa-printable-report .text-rose-950 { color: #4c0519 !important; }
        #cropsa-printable-report .text-pink-700 { color: #be185d !important; }
        
        #cropsa-printable-report .bg-white { background-color: #ffffff !important; }
        #cropsa-printable-report .bg-zinc-50 { background-color: #f9fafb !important; }
        #cropsa-printable-report .bg-zinc-50\\/50 { background-color: rgba(249, 250, 251, 0.5) !important; }
        #cropsa-printable-report .bg-zinc-100 { background-color: #f3f4f6 !important; }
        #cropsa-printable-report .bg-green-50 { background-color: #f0fdf4 !important; }
        #cropsa-printable-report .bg-green-100 { background-color: #dcfce7 !important; }
        #cropsa-printable-report .bg-green-500 { background-color: #22c55e !important; }
        #cropsa-printable-report .bg-emerald-500 { background-color: #10b981 !important; }
        #cropsa-printable-report .bg-emerald-50\\/55 { background-color: rgba(236, 253, 245, 0.55) !important; }
        #cropsa-printable-report .bg-blue-500 { background-color: #3b82f6 !important; }
        #cropsa-printable-report .bg-blue-50\\/55 { background-color: rgba(239, 246, 255, 0.55) !important; }
        #cropsa-printable-report .bg-amber-500 { background-color: #f59e0b !important; }
        #cropsa-printable-report .bg-amber-50 { background-color: #fffbeb !important; }
        #cropsa-printable-report .bg-amber-50\\/55 { background-color: rgba(254, 243, 199, 0.55) !important; }
        #cropsa-printable-report .bg-rose-50 { background-color: #fff1f2 !important; }
        #cropsa-printable-report .bg-rose-100 { background-color: #ffe4e6 !important; }
        #cropsa-printable-report .bg-pink-50 { background-color: #fdf2f8 !important; }

        #cropsa-printable-report .border-zinc-100 { border-color: #f3f4f6 !important; }
        #cropsa-printable-report .border-zinc-200 { border-color: #e5e7eb !important; }
        #cropsa-printable-report .border-zinc-150 { border-color: #e5e7eb !important; }
        #cropsa-printable-report .border-emerald-100\\/50 { border-color: rgba(167, 243, 208, 0.5) !important; }
        #cropsa-printable-report .border-blue-100\\/50 { border-color: rgba(191, 219, 254, 0.5) !important; }
        #cropsa-printable-report .border-amber-100\\/50 { border-color: rgba(253, 230, 138, 0.5) !important; }
        #cropsa-printable-report .border-zinc-200\\/80 { border-color: rgba(229, 231, 235, 0.8) !important; }
        #cropsa-printable-report .border-green-600 { border-color: #16a34a !important; }
        #cropsa-printable-report .border-zinc-400 { border-color: #9ca3af !important; }
        #cropsa-printable-report .border-rose-200 { border-color: #fecdd3 !important; }
        #cropsa-printable-report .divide-zinc-150 > * + * { border-color: #e5e7eb !important; }
      `}</style>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-5xl overflow-hidden flex flex-col h-[90vh] shadow-2xl relative print:hidden">
        
        {/* Controls Frame */}
        <div className="p-6 border-b border-zinc-800/80 bg-zinc-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 text-green-500 rounded-xl">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">
                {isRtl ? 'تقرير المدير التنفيذي للأداء العام' : 'Executive Director Performance Report'}
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
                {isRtl ? 'تحليل شامل لحضور ونشاط الموظفين مع حالة المحتوى والأجندة' : 'Complete telemetry covering staff activity feeds and production calendars'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
               onClick={handleDownloadPDF}
               disabled={isGenerating}
               className={cn(
                 "px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-green-950",
                 isGenerating && "opacity-75 cursor-not-allowed animate-pulse"
               )}
            >
              <Download size={14} />
              <span>{isGenerating ? (isRtl ? 'جاري تصدير الـ PDF...' : 'Generating PDF...') : (isRtl ? 'تحميل التقرير كـ PDF' : 'Download Executive PDF')}</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-305 rounded-xl text-xs font-black transition-all flex items-center gap-2 border border-zinc-750"
            >
              <Printer size={14} />
              <span>{isRtl ? 'طباعة التقرير المستندي' : 'Print Hardcopy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Live A4 Print Preview Sheet Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-950/40 custom-scrollbar flex justify-center">
          
          <div 
            id="cropsa-printable-report"
            className="bg-white text-zinc-900 w-full max-w-[210mm] min-h-[297mm] p-10 md:p-14 rounded-3xl shadow-xl flex flex-col justify-between border border-zinc-200 select-text"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div>
              {/* Report Letterhead */}
              <div className="border-b-4 border-green-600 pb-6 mb-8 flex justify-between items-start">
                <div className="space-y-1.5 flex-1">
                  <span className="text-[10px] font-black tracking-widest text-green-600 uppercase">
                    {isRtl ? 'تقرير إداري معتمد وسري للغاية' : 'RESTRICTED EXECUTIVE AUDIT DOCUMENT'}
                  </span>
                  <h1 className="text-2xl font-black text-zinc-950 tracking-tight">
                    {isRtl ? 'تقرير تقييم الأداء والمحتوى العام للمدير التنفيذي' : 'Executive Director Content & Performance Audit'}
                  </h1>
                  <p className="text-xs text-zinc-500 font-bold max-w-lg">
                    {isRtl 
                      ? 'مستند تحليلي رسمي مخرّج آلياً يرصد بدقة مواعيد فتح الموظفين للنظام ومستوى تفاعلهم، بالإضافة لمراقبة خطوط إنتاج المحتوى الزراعي اليومي.'
                      : 'Structured supervisory review outlining staff logins, completion rates, and production health.'
                    }
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-green-700 tracking-tight flex items-center justify-end gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
                    Cropsa Agency
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono font-black uppercase">
                    {isRtl ? 'تاريخ الإصدار:' : 'Audit Date:'} {new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                  </div>
                  <div className="text-[9px] text-zinc-400 font-mono">
                    {isRtl ? 'توقيت ميكانيكي:' : 'Clock:'} {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Grid 4 Overview Metas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-450 font-black uppercase tracking-wider">{isRtl ? 'إجمالي المحتوى' : 'Total Items'}</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-zinc-950">{content.length}</span>
                    <span className="text-[10px] text-zinc-400 font-black">{isRtl ? 'منشورًا' : 'posts'}</span>
                  </div>
                </div>
                <div className="bg-emerald-50/55 p-4 rounded-2xl border border-emerald-100/50 flex flex-col justify-between">
                  <span className="text-[10px] text-emerald-800 font-black uppercase tracking-wider">{isRtl ? 'نزل بالفعل (Published)' : 'Published'}</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-emerald-700">{publishedItems.length}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">{isRtl ? 'نزل' : 'live'}</span>
                  </div>
                </div>
                <div className="bg-blue-50/55 p-4 rounded-2xl border border-blue-100/50 flex flex-col justify-between">
                  <span className="text-[10px] text-blue-800 font-black uppercase tracking-wider">{isRtl ? 'هينزل قريباً (Scheduled)' : 'Scheduled'}</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-blue-700">{upcomingItems.length}</span>
                    <span className="text-[10px] text-blue-600 font-bold">{isRtl ? 'مجدول' : 'slated'}</span>
                  </div>
                </div>
                <div className="bg-amber-50/55 p-4 rounded-2xl border border-amber-100/50 flex flex-col justify-between">
                  <span className="text-[10px] text-amber-800 font-black uppercase tracking-wider">{isRtl ? 'قيد التجهيز (In Prep)' : 'In Prep'}</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-amber-700">{preparationItems.length}</span>
                    <span className="text-[10px] text-amber-600 font-bold">{isRtl ? 'بيجهز' : 'prepping'}</span>
                  </div>
                </div>
              </div>

              {/* Employee Attendance Section */}
              <div className="space-y-4 mb-8">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <UserIcon size={14} className="text-green-600" />
                  {isRtl ? 'أولاً: تقرير حضور وتفاعل الموظفين وحساباتهم' : '1. Staff Portal Attendance & Activity Roll'}
                </h3>

                <div className="border border-zinc-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs bg-white">
                    <thead>
                      <tr className={cn("bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-extrabold uppercase", isRtl && "text-right")}>
                        <th className="px-5 py-3">{isRtl ? 'الموظف / الدور' : 'Staff / Role'}</th>
                        <th className="px-5 py-3">{isRtl ? 'حالة الفتح والدخول' : 'Access Telemetry'}</th>
                        <th className="px-5 py-3 text-center">{isRtl ? 'المعين' : 'Assigned'}</th>
                        <th className="px-5 py-3 text-center">{isRtl ? 'التعليقات' : 'Comments'}</th>
                        <th className="px-5 py-3 text-center">{isRtl ? 'المهام' : 'Tasks Done'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150">
                      {userReport.map((user) => (
                        <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center">
                                {user.avatar}
                              </div>
                              <div>
                                <p className="font-bold text-zinc-900 leading-tight">{user.name}</p>
                                <p className="text-[10px] text-zinc-405 font-medium">{user.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {user.hasOpened ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-emerald-700 font-black flex items-center gap-1">
                                  <ShieldCheck size={11} className="text-emerald-600 shrink-0" />
                                  {isRtl ? 'متصل / فتح التطبيق ✅' : 'Active / Portal Accessed ✅'}
                                </span>
                                <span className="text-[9px] text-zinc-400 font-mono font-medium">
                                  {new Date(user.lastLogin!).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-rose-600 font-extrabold flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded-md w-max">
                                <AlertTriangle size={11} className="text-rose-500 shrink-0" />
                                {isRtl ? '❌ غائب - لم يفتح المنصة نهائياً' : '❌ Absent - Never Logged In'}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold text-zinc-800">{user.assignedCount}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-zinc-800">{user.commentsCount}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-zinc-800">
                            <span className={cn("px-1.5 py-0.5 rounded text-[10px]", user.completedTasksCount > 0 ? "bg-green-50 text-green-700 font-bold" : "text-zinc-400 font-normal")}>
                              {user.completedTasksCount}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Content Pipeline Status Section */}
              <div className="space-y-4 mb-8">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 animate-none">
                  <Clock size={14} className="text-green-600" />
                  {isRtl ? 'ثانياً: خط إنتاج وحالة المحتوى اليومي (الأجندة والجدولة)' : '2. Production Pipeline & Content Agenda Logs'}
                </h3>

                <div className="space-y-4">
                  {/* Phase 1: Published */}
                  <div className="bg-zinc-50/50 border border-zinc-200/80 rounded-2xl p-4">
                    <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-wider mb-2 pb-1 border-b border-zinc-150 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {isRtl ? 'تم نشره بالفعل بالكامل (نزل بالفعل)' : 'Live Published Assets'}
                      <span className="text-[10px] font-mono font-bold text-zinc-400 ml-auto">({publishedItems.length} {isRtl ? 'منشورًا' : 'items'})</span>
                    </h4>
                    {publishedItems.length === 0 ? (
                      <p className="text-[10px] text-zinc-400 italic font-bold">{isRtl ? 'لا توجد منشورات منشورة حالياً.' : 'No published assets recorded yet.'}</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {publishedItems.slice(0, 8).map(item => (
                          <div key={item.id} className="bg-white px-3 py-2 rounded-lg border border-zinc-100 flex items-center justify-between">
                            <span className="font-bold text-zinc-900 truncate max-w-[120px]">{item.title}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[9px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-black">
                                {isRtl ? getArabicType(item.type) : item.type}
                              </span>
                              <span className="text-[9px] text-emerald-600 font-bold font-mono">
                                {item.publishDate ? item.publishDate.split('-').slice(1).join('/') : '-'}
                              </span>
                            </div>
                          </div>
                        ))}
                        {publishedItems.length > 8 && (
                          <div className="col-span-2 text-[10px] text-zinc-400 font-bold text-center mt-1">
                            + {publishedItems.length - 8} {isRtl ? 'منشورات منشورة إضافية مسجلة بالتكامل' : 'more items listed'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Phase 2: Upcoming Scheduled */}
                  <div className="bg-zinc-50/50 border border-zinc-200/80 rounded-2xl p-4">
                    <h4 className="text-[11px] font-black text-blue-800 uppercase tracking-wider mb-2 pb-1 border-b border-zinc-150 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      {isRtl ? 'مجدول وسيتم نشره قريباً حسب تاريخ النشر (هينزل)' : 'Scheduled Upcoming Campaigns'}
                      <span className="text-[10px] font-mono font-bold text-zinc-400 ml-auto">({upcomingItems.length} {isRtl ? 'منشورًا' : 'items'})</span>
                    </h4>
                    {upcomingItems.length === 0 ? (
                      <p className="text-[10px] text-zinc-400 italic font-bold">{isRtl ? 'لا توجد منشورات مجدولة حالياً.' : 'No upcoming schedules identified.'}</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {upcomingItems.map(item => (
                          <div key={item.id} className="bg-white px-3 py-2 rounded-lg border border-zinc-100 flex items-center justify-between">
                            <span className="font-bold text-zinc-900 truncate max-w-[120px]">{item.title}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[9px] text-pink-700 bg-pink-50 px-1 rounded">
                                {item.platforms.join(', ')}
                              </span>
                              <span className="text-[9px] text-blue-700 font-black font-mono">
                                {item.publishDate || item.dueDate}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Phase 3: Preparation Items */}
                  <div className="bg-zinc-50/50 border border-zinc-200/80 rounded-2xl p-4">
                    <h4 className="text-[11px] font-black text-amber-800 uppercase tracking-wider mb-2 pb-1 border-b border-zinc-150 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      {isRtl ? 'قيد الإعداد والتحضير والكتابة والمراجعة (بيجهز)' : 'Work in progress / Draft Design'}
                      <span className="text-[10px] font-mono font-bold text-zinc-400 ml-auto">({preparationItems.length} {isRtl ? 'منشورًا' : 'items'})</span>
                    </h4>
                    {preparationItems.length === 0 ? (
                      <p className="text-[10px] text-zinc-400 italic font-bold">{isRtl ? 'لا توجد مسودات تسويقية قيد التحضير.' : 'No active drafts prepped.'}</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {preparationItems.slice(0, 10).map(item => (
                          <div key={item.id} className="bg-white px-3 py-2 rounded-lg border border-zinc-100 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-900 truncate max-w-[110px]">{item.title}</span>
                              <span className="text-[8px] text-zinc-400 font-black">{isRtl ? 'المكلف:' : 'By:'} {item.assignedTo?.join(', ') || '-'}</span>
                            </div>
                            <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-black">
                              {isRtl ? getArabicStatus(item.status) : item.status}
                            </span>
                          </div>
                        ))}
                        {preparationItems.length > 10 && (
                          <div className="col-span-2 text-[10px] text-zinc-400 font-bold text-center mt-1">
                            + {preparationItems.length - 10} {isRtl ? 'مسودة محتوى إضافية يتم العمل عليها' : 'more drafts prepped'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Overdue Warnings If Any */}
              {overdueItems.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl mb-8">
                  <h4 className="text-[11px] font-black text-rose-800 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-rose-600 shrink-0" />
                    {isRtl ? 'رابعاً: المنشورات المتأخرة عن مواعيد التسليم المستهدفة (تحذير هام)' : '4. Critical Overdue Target Warnings'}
                  </h4>
                  <ul className="text-[10px] space-y-1 text-rose-950 font-bold">
                    {overdueItems.map(item => (
                      <li key={item.id} className="flex items-center justify-between">
                        <span className="font-black">• {item.title}</span>
                        <span className="font-mono text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded font-black">{isRtl ? 'مستحق منذ:' : 'Overdue date:'} {item.dueDate}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Official Stamps and Signatures Sign-Off */}
            <div className="border-t border-zinc-200 pt-6 mt-10 grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">{isRtl ? 'حالة التقرير وتأمينه' : 'Verification Stamps'}</span>
                <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 uppercase">
                  <ShieldCheck size={11} className="text-emerald-600" />
                  {isRtl ? 'مستند رقمي آمن ومعتمد' : 'Digitally Secured Audit'}
                </p>
                <p className="text-[8px] text-zinc-400 font-mono">ID: SEC-CEO-{Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
              </div>
              <div className="text-right space-y-5">
                <div>
                  <p className="font-black text-zinc-900 leading-none">{isRtl ? 'المدير التنفيذي للوكالة' : 'Executive Director Seal'}</p>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Cropsa Content Management Inc.</p>
                </div>
                <div className="inline-block border-b border-zinc-400 w-36 h-0.5 mt-2"></div>
                <p className="text-[9px] text-zinc-400 font-bold">{isRtl ? 'التوقيع والختم الإداري' : 'Official Signature / Stamp'}</p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
