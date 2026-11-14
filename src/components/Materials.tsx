import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Link as LinkIcon, 
  Plus, 
  Search, 
  Download,
  Trash2,
  Edit2,
  X,
  Link2,
  Folder as FolderIcon,
  FolderOpen,
  ArrowLeft,
  FolderPlus,
  Eye,
  Upload,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../translations';
import { Language, MaterialItem } from '../types';
import { cn } from '../lib/utils';
import { uploadMediaFile } from '../lib/storage';
import { showToast } from './Toast';

interface MaterialsProps {
  lang: Language;
  items: MaterialItem[];
  onUpdateItems: (items: MaterialItem[]) => void;
}

const TYPE_ICONS: Record<string, any> = {
  'Image': { icon: ImageIcon, color: 'bg-blue-50 text-blue-600' },
  'Video': { icon: Video, color: 'bg-purple-50 text-purple-600' },
  'Document': { icon: FileText, color: 'bg-orange-50 text-orange-600' },
  'Link': { icon: LinkIcon, color: 'bg-teal-50 text-teal-600' },
};

interface MaterialFolder {
  id: string;
  name: string;
  addedDate: string;
}

export const Materials: React.FC<MaterialsProps> = ({ lang, items, onUpdateItems }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MaterialItem | null>(null);

  // Folders state
  const [folders, setFolders] = useState<MaterialFolder[]>([
    { id: 'fol-1', name: isRtl ? 'حملة حصاد القمح' : 'Wheat Harvest Campaign', addedDate: '2026-04-01' },
    { id: 'fol-2', name: isRtl ? 'تصاميم السوشيال ميديا' : 'Social Media Designs', addedDate: '2026-03-28' },
  ]);

  // Create folder modal state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Add/Edit material modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState<Partial<MaterialItem>>({
    name: '',
    type: 'Image',
    url: '',
    size: '',
    folderId: ''
  });

  const activeFolderName = folders.find(f => f.id === currentFolderId)?.name;

  // Filter items match search query + type filter + folder level
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || item.type === typeFilter;
    const matchesFolder = currentFolderId ? item.folderId === currentFolderId : !item.folderId;
    return matchesSearch && matchesType && matchesFolder;
  });

  const handleOpenModal = (item?: MaterialItem) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({ 
        name: '', 
        type: 'Image', 
        url: '', 
        size: '', 
        folderId: currentFolderId || '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingItem) {
      onUpdateItems(items.map(i => i.id === editingItem.id ? { ...i, ...formData } as MaterialItem : i));
    } else {
      const newItem: MaterialItem = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        addedDate: new Date().toISOString().split('T')[0],
        folderId: formData.folderId || undefined
      } as MaterialItem;
      onUpdateItems([...items, newItem]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(isRtl ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      onUpdateItems(items.filter(i => i.id !== id));
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: MaterialFolder = {
      id: `fol-${Math.random().toString(36).substr(2, 9)}`,
      name: newFolderName.trim(),
      addedDate: new Date().toISOString().split('T')[0]
    };
    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setIsFolderModalOpen(false);
  };

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    if (confirm(isRtl 
      ? `هل أنت متأكد من حذف المجلد "${folderName}"؟ (ملاحظة: لن يتم حذف الملفات داخله بل ستنتقل للمستندات العامة)` 
      : `Are you sure you want to delete folder "${folderName}"? (Files inside will be moved to root)`)) {
      setFolders(folders.filter(f => f.id !== folderId));
      onUpdateItems(items.map(i => i.folderId === folderId ? { ...i, folderId: undefined } : i));
      if (currentFolderId === folderId) {
        setCurrentFolderId(null);
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadMediaFile(file, 'materials', (progress) => {
        setUploadProgress(progress);
      });

      setFormData(prev => ({
        ...prev,
        name: result.name,
        type: result.type,
        size: result.size,
        url: result.url
      }));

      showToast(
        isRtl ? `تم رفع الملف (${result.name}) بنجاح!` : `File (${result.name}) uploaded!`,
        'success'
      );
    } catch (err: any) {
      console.error('File upload error:', err);
      showToast(isRtl ? 'فشل رفع الملف. يرجى المحاولة ثانية.' : 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Drives & Folders Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className={isRtl ? "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" : "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"} size={16} />
            <input 
              type="text" 
              placeholder={t.search} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={isRtl ? "pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm w-64 outline-none focus:ring-4 focus:ring-green-100 transition-all font-semibold shadow-sm" : "pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm w-64 outline-none focus:ring-4 focus:ring-green-100 transition-all font-semibold shadow-sm"}
            />
          </div>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded-2xl p-2.5 outline-none font-bold shadow-sm"
          >
            <option value="All">{isRtl ? 'كل أنواع الملفات' : 'All Types'}</option>
            <option value="Image">{isRtl ? 'صور وماتريال' : 'Images'}</option>
            <option value="Video">{isRtl ? 'فيديوهات' : 'Videos'}</option>
            <option value="Document">{isRtl ? 'ملفات ومستندات' : 'Documents'}</option>
            <option value="Link">{isRtl ? 'روابط' : 'Links'}</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsFolderModalOpen(true)}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            <FolderPlus size={18} />
            <span>{isRtl ? 'مجلد جديد' : 'New Folder'}</span>
          </button>

          <button 
            onClick={() => handleOpenModal()}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-green-100"
          >
            <Plus size={18} />
            <span>{isRtl ? 'إضافة ملف/رابط' : 'Add Material'}</span>
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation when inside folders */}
      {currentFolderId && (
        <div className="flex items-center gap-3 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
          <button 
            onClick={() => setCurrentFolderId(null)} 
            className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900 flex items-center gap-1 text-xs font-bold"
          >
            <ArrowLeft size={16} className={isRtl ? "rotate-180" : ""} />
            {isRtl ? 'الرئيسية' : 'Root'}
          </button>
          <span className="text-gray-300">/</span>
          <div className="flex items-center gap-2 text-sm font-black text-gray-800">
            <FolderOpen size={18} className="text-amber-500" />
            <span>{activeFolderName}</span>
          </div>
        </div>
      )}

      {/* Folders Grid Section (Shown at root level !currentFolderId) */}
      {!currentFolderId && (
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <FolderIcon size={14} className="text-amber-500" /> {isRtl ? 'المجلدات النشطة' : 'Active Folders'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {folders.map(folder => {
              const fileCount = items.filter(f => f.folderId === folder.id).length;
              return (
                <div 
                  key={folder.id}
                  className="bg-white border border-gray-100 p-5 rounded-3xl hover:border-amber-400 transition-all shadow-sm group relative flex items-center justify-between cursor-pointer"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl group-hover:bg-amber-100 transition-colors">
                      <FolderIcon size={22} fill="currentColor" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800 group-hover:text-amber-900 transition-colors line-clamp-1">{folder.name}</p>
                      <p className="text-[10px] font-bold text-gray-400">{fileCount} {isRtl ? 'ملفات' : 'files'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id, folder.name);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
            {folders.length === 0 && (
              <p className="col-span-full text-center text-xs font-bold text-gray-400 py-6 italic border border-dashed border-gray-200 rounded-3xl bg-white">
                {isRtl ? 'لم تقم بإنشاء أي مجلد بعد' : 'No folder created yet'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Files List / Links Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
          {isRtl ? 'الملفات والمرفقات' : 'Files & Attachments'}
        </h3>
        <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className={cn("bg-gray-50 text-xs font-black text-gray-500 uppercase tracking-wider", isRtl && "text-right")}>
                <th className="px-6 py-4">{t.materialName}</th>
                <th className="px-6 py-4">{t.type}</th>
                <th className="px-6 py-4">{t.addedDate}</th>
                <th className="px-6 py-4">{t.size}</th>
                <th className="px-6 py-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => {
                const { icon: Icon, color } = TYPE_ICONS[item.type] || { icon: FileText, color: 'bg-gray-50 text-gray-600' };
                const isMedia = item.type === 'Image' || item.type === 'Video';
                
                return (
                  <tr key={item.id} className={cn("hover:bg-gray-50/50 transition-colors group", isRtl && "text-right")}>
                    <td className="px-6 py-4">
                      {isMedia ? (
                        <div 
                          onClick={() => setPreviewItem(item)}
                          className="flex items-center gap-3 cursor-pointer group/item text-gray-800 hover:text-green-600 transition-colors"
                          title={isRtl ? "اضغط للمعاينة السريعة" : "Click to preview"}
                        >
                          <div className={cn("p-2 rounded-lg shrink-0 group-hover/item:scale-110 transition-transform", color)}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-sm group-hover/item:underline">{item.name}</p>
                            <span className="text-[10px] text-green-600 font-bold inline-flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <Eye size={10} /> {isRtl ? 'معاينة سريعة' : 'Quick Preview'}
                            </span>
                          </div>
                        </div>
                      ) : item.type === 'Link' ? (
                        <a 
                          href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 group/item text-teal-600 hover:text-teal-800 hover:underline transition-colors cursor-pointer"
                          title={isRtl ? "اضغط لفتح الرابط في نافذة جديدة" : "Click to open link in a new tab"}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={cn("p-2 rounded-lg shrink-0 group-hover/item:scale-110 transition-transform", color)}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-sm flex items-center gap-1.5">
                              {item.name}
                              <Link2 size={13} className="shrink-0 opacity-70" />
                            </p>
                            <span className="text-[10px] text-teal-650 font-bold block truncate max-w-xs">
                              {item.url}
                            </span>
                          </div>
                        </a>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg shrink-0", color)}>
                            <Icon size={18} />
                          </div>
                          <p className="font-bold text-sm text-gray-800">{item.name}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{item.type}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-400 font-mono">{item.addedDate}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500">{item.size || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isMedia && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewItem(item);
                            }}
                            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-650"
                            title={isRtl ? "معاينة الملف" : "Preview file"}
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {item.type === 'Link' ? (
                          <a 
                            href={item.url.startsWith('http') ? item.url : `https://${item.url}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-2 hover:bg-teal-50 rounded-lg transition-colors text-teal-600"
                            title={isRtl ? "زيارة الرابط" : "Visit link"}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link2 size={16} />
                          </a>
                        ) : (
                          <a 
                            href={item.url} 
                            download 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600"
                            title={isRtl ? "تحميل الملف" : "Download file"}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download size={16} />
                          </a>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(item);
                          }}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-xs font-bold text-gray-400 italic">
                    {isRtl ? 'لا توجد مستندات أو روابط بعد' : 'No documents or links here yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900">{isRtl ? 'إنشاء مجلد جديد' : 'Create New Folder'}</h3>
              <button onClick={() => setIsFolderModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">{isRtl ? 'اسم المجلد' : 'Folder Name'}</label>
                <input 
                  type="text" 
                  value={newFolderName}
                  placeholder={isRtl ? 'اكتب اسم المجلد...' : 'Enter folder name...'}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-amber-100 transition-all font-semibold"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateFolder();
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setIsFolderModalOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                onClick={handleCreateFolder}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-xs hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
              >
                {isRtl ? 'إنشاء مجلد' : 'Create Folder'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add / Edit Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] w-full max-w-md p-8 space-y-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">{editingItem ? (isRtl ? 'تعديل الملف' : 'Edit Material') : (isRtl ? 'إضافة ملف جديد' : 'Add Material')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider">{isRtl ? 'اسم الملف' : 'Name'}</label>
                <input 
                  type="text" 
                  value={formData.name}
                  placeholder={isRtl ? 'صورة الحصاد، دليل الأسمدة...' : 'Wheat image, campaign file...'}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl outline-none focus:ring-4 focus:ring-green-100 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider">{isRtl ? 'النوع' : 'Type'}</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl outline-none focus:ring-4 focus:ring-green-100 transition-all font-bold"
                  >
                    <option value="Image">Image</option>
                    <option value="Video">Video</option>
                    <option value="Document">Document</option>
                    <option value="Link">Link</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider">{isRtl ? 'المجلد المستهدف' : 'Target Folder'}</label>
                  <select 
                    value={formData.folderId || ''}
                    onChange={(e) => setFormData({...formData, folderId: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl outline-none focus:ring-4 focus:ring-green-100 transition-all font-bold"
                  >
                    <option value="">{isRtl ? 'المستندات العامة (بدون مجلد)' : 'Root (No Folder)'}</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.type === 'Link' ? (
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider">{isRtl ? 'الرابط المباشر' : 'Direct URL'}</label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      value={formData.url}
                      placeholder="https://..."
                      onChange={(e) => setFormData({...formData, url: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl outline-none focus:ring-4 focus:ring-green-100 transition-all font-semibold"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider">{isRtl ? 'رفع ملف حقيقي' : 'Upload File'}</label>
                  <div 
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={cn(
                      "w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all",
                      isUploading ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50 hover:border-green-400"
                    )}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="animate-spin text-green-600" size={24} />
                        <p className="text-xs font-bold text-gray-700">{isRtl ? 'جاري رفع الملف...' : 'Uploading file...'} {uploadProgress}%</p>
                      </>
                    ) : (
                      <>
                        <Upload className="text-gray-400" size={24} />
                        <p className="text-xs font-bold text-gray-500">{isRtl ? 'اضغط لاختيار ملف من جهازك' : 'Click to select file'}</p>
                      </>
                    )}
                    {formData.name && <p className="text-[11px] text-green-600 font-bold">{formData.name} ({formData.size})</p>}
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-3 bg-green-600 text-white rounded-2xl font-bold text-sm hover:bg-green-700 transition-all shadow-xl shadow-green-100"
              >
                {t.save}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-950 text-white rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl relative border border-zinc-900"
          >
            {/* Header / Info bar */}
            <div className={`flex items-center justify-between p-6 bg-zinc-950 border-b border-zinc-900 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <span className="text-[10px] font-black uppercase text-green-400 tracking-wider bg-green-950/60 px-2 py-0.5 rounded border border-green-900 font-mono">
                  {previewItem.type === 'Image' ? (isRtl ? 'معاينة صورة' : 'Image Preview') : (isRtl ? 'معاينة فيديو' : 'Video Preview')}
                </span>
                <h3 className="text-base font-black text-white mt-1">{previewItem.name}</h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {isRtl ? `الحجم: ${previewItem.size || '-'} • تمت الإضافة: ${previewItem.addedDate}` : `Size: ${previewItem.size || '-'} • Added: ${previewItem.addedDate}`}
                </p>
              </div>
              <button 
                onClick={() => setPreviewItem(null)} 
                className="p-2 bg-zinc-900 hover:bg-red-600 rounded-xl transition-all text-zinc-400 hover:text-white cursor-pointer active:scale-95"
                title={isRtl ? "إغلاق" : "Close"}
              >
                <X size={20} />
              </button>
            </div>

            {/* Media Content */}
            <div className="p-8 flex items-center justify-center min-h-[300px] max-h-[60vh] overflow-y-auto bg-zinc-950/40">
              {previewItem.type === 'Image' ? (
                <img 
                  src={previewItem.url && previewItem.url !== '#' ? previewItem.url : 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=80'} 
                  alt={previewItem.name} 
                  className="max-w-full max-h-[50vh] object-contain rounded-2xl shadow-xl border border-zinc-900"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <video 
                  src={previewItem.url && previewItem.url !== '#' ? previewItem.url : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'} 
                  controls 
                  autoPlay
                  className="w-full max-h-[50vh] rounded-2xl shadow-xl border border-zinc-900 bg-black"
                />
              )}
            </div>

            {/* Footer controls */}
            <div className={`flex justify-end gap-3 p-5 bg-zinc-950 border-t border-zinc-900 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <button 
                onClick={() => setPreviewItem(null)}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {isRtl ? 'إغلاق المعاينة' : 'Dismiss'}
              </button>
              {previewItem.url && previewItem.url !== '#' && (
                <a 
                  href={previewItem.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-green-950"
                >
                  <Download size={14} />
                  <span>{isRtl ? 'تحميل الملف' : 'Download File'}</span>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
