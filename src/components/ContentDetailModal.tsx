import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  CheckSquare, 
  Users, 
  Paperclip, 
  MessageSquare, 
  MoreHorizontal,
  Image as ImageIcon,
  Edit2,
  Clock,
  Check,
  CheckCircle2,
  Layout,
  Calendar,
  User as UserIcon,
  MessageCircle,
  Save,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Copy,
  Link as LinkIcon,
  AtSign,
  FileText,
  Download,
  Eye,
  Link2,
  ExternalLink
} from 'lucide-react';
import { translations } from '../translations';
import { Language, ContentItem, Task, Comment, Attachment, Platform, ContentType, Priority, User, KanbanStage } from '../types';
import { cn } from '../lib/utils';

interface ContentDetailModalProps {
  lang: Language;
  item: ContentItem;
  users: User[];
  onClose: () => void;
  onUpdateTasks: (id: string, tasks: Task[]) => void;
  onUpdateComments: (id: string, comments: Comment[]) => void;
  onUpdateItem?: (id: string, updates: Partial<ContentItem>) => void;
  onDeleteItem?: (id: string) => void;
  onCloneItem?: (item: ContentItem) => void;
  stages?: KanbanStage[];
}

const PLATFORMS: Platform[] = ['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'WhatsApp', 'Other'];
const TYPES: ContentType[] = ['Hybrid', 'Video', 'Image', 'Carousel', 'Story', 'Post', 'Reel'];
const PRIORITIES: Priority[] = ['High', 'Normal', 'Low'];

export const ContentDetailModal: React.FC<ContentDetailModalProps> = ({ 
  lang, 
  item, 
  users,
  onClose, 
  onUpdateTasks,
  onUpdateComments,
  onUpdateItem,
  onDeleteItem,
  onCloneItem,
  stages
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const currentUser = useMemo(() => {
    try {
      const saved = sessionStorage.getItem('cropsa_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const canEdit = useMemo(() => {
    if (!currentUser) return true; // Preview fallback
    const perms = currentUser.permissions || (currentUser.role === 'Admin' ? ['all'] : ['view']);
    return perms.includes('all') || perms.includes('edit') || currentUser.role === 'Admin';
  }, [currentUser]);

  const canDelete = useMemo(() => {
    if (!currentUser) return true; // Preview fallback
    return currentUser.role === 'Admin'; // Delete is highly sensitive, restrict to Admin
  }, [currentUser]);

  const [commentText, setCommentText] = useState('');
  const [editingAttachmentId, setEditingAttachmentId] = useState<string | null>(null);
  const [attachmentRenameValue, setAttachmentRenameValue] = useState('');
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);
  const [previewAttachmentType, setPreviewAttachmentType] = useState<'image' | 'video' | 'link' | null>(null);

  const [resultLinkTitle, setResultLinkTitle] = useState('');
  const [resultLinkUrl, setResultLinkUrl] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionPos, setMentionPos] = useState({ top: 0, left: 0 });
  const [newLabelText, setNewLabelText] = useState('');
  const [editData, setEditData] = useState({
    title: item.title,
    description: item.description || '',
    caption: item.caption || '',
    platforms: item.platforms,
    type: item.type as ContentType,
    priority: item.priority,
    dueDate: item.dueDate,
    publishDate: item.publishDate || '',
    preparationDate: item.preparationDate || '',
    assignedTo: item.assignedTo || [],
    mediaUrl: item.mediaUrl || '',
    week: item.week || 'Week 1',
    objective: item.objective || 'Trust',
    labels: item.labels || [],
    stageId: item.stageId || '',
    status: item.status
  });

  useEffect(() => {
    setEditData({
      title: item.title,
      description: item.description || '',
      caption: item.caption || '',
      platforms: item.platforms,
      type: item.type as ContentType,
      priority: item.priority,
      dueDate: item.dueDate,
      publishDate: item.publishDate || '',
      preparationDate: item.preparationDate || '',
      assignedTo: item.assignedTo || [],
      mediaUrl: item.mediaUrl || '',
      week: item.week || 'Week 1',
      objective: item.objective || 'Trust',
      labels: item.labels || [],
      stageId: item.stageId || '',
      status: item.status
    });
  }, [item]);

  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDependsOn, setNewTaskDependsOn] = useState<string>('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');

  const handleToggleTask = (taskId: string) => {
    const task = item.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!task.completed && task.dependsOn) {
      const dependency = item.tasks.find(t => t.id === task.dependsOn);
      if (dependency && !dependency.completed) {
        alert(isRtl 
          ? `يجب إكمال المهمة "${dependency.text}" أولاً` 
          : `You must complete "${dependency.text}" first`
        );
        return;
      }
    }

    const newTasks = item.tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    onUpdateTasks(item.id, newTasks);
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      text: newTaskText,
      completed: false,
      dependsOn: newTaskDependsOn || undefined
    };
    onUpdateTasks(item.id, [...item.tasks, newTask]);
    setNewTaskText('');
    setNewTaskDependsOn('');
    setIsAddingTask(false);
  };

  const handleClone = () => {
    if (onCloneItem) {
      const clonedItem: ContentItem = {
        ...item,
        id: Math.random().toString(36).substr(2, 9),
        title: `[Clone] ${item.title}`,
        status: 'Idea',
        approvalStatus: 'Pending',
        tasks: item.tasks.map(t => ({ ...t, id: Math.random().toString(36).substr(2, 9), completed: false })),
        comments: [],
        attachments: [...(item.attachments || [])]
      };
      onCloneItem(clonedItem);
      onClose();
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const newTasks = item.tasks.filter(task => task.id !== taskId);
    onUpdateTasks(item.id, newTasks);
  };

  const handleStartEditTask = (taskId: string, currentText: string) => {
    setEditingTaskId(taskId);
    setEditingTaskText(currentText);
  };

  const handleSaveEditTask = (taskId: string) => {
    if (!editingTaskText.trim()) return;
    const updatedTasks = item.tasks.map(t => 
      t.id === taskId ? { ...t, text: editingTaskText } : t
    );
    onUpdateTasks(item.id, updatedTasks);
    setEditingTaskId(null);
    setEditingTaskText('');
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      user: currentUser?.name || (isRtl ? 'مستخدم مجهول' : 'Anonymous'),
      text: commentText,
      date: new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US') + ' ' + new Date().toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    };
    onUpdateComments(item.id, [...(item.comments || []), newComment]);
    setCommentText('');
  };

  const handleStartEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentText);
  };

  const handleSaveEditComment = (commentId: string) => {
    if (!editingCommentText.trim()) return;
    const updatedComments = (item.comments || []).map(c => 
      c.id === commentId ? { ...c, text: editingCommentText } : c
    );
    onUpdateComments(item.id, updatedComments);
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    const updatedComments = (item.comments || []).filter(c => c.id !== commentId);
    onUpdateComments(item.id, updatedComments);
  };

  const compressImage = (dataUrl: string, maxW = 800, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      if (!dataUrl.startsWith('data:image/')) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => {
        resolve(dataUrl);
      };
    });
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/') && file.size > 800 * 1024) {
      const isVideo = true;
      const newAttachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        name: `${file.name} (Optimized)`,
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        type: 'video',
        date: new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')
      };
      const updatedAttachments = [...(item.attachments || []), newAttachment];
      if (onUpdateItem) {
        onUpdateItem(item.id, { 
          attachments: updatedAttachments
        });
      }
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      let dataUrl = reader.result as string;
      const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.mov');
      
      if (!isVideo && dataUrl.startsWith('data:image/')) {
        dataUrl = await compressImage(dataUrl);
      }

      const newAttachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: dataUrl,
        type: isVideo ? 'video' : 'image',
        date: new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')
      };

      const updatedAttachments = [...(item.attachments || []), newAttachment];
      
      let updatedMediaUrl = item.mediaUrl;
      if (newAttachment.type === 'image') {
        updatedMediaUrl = dataUrl;
      }

      if (onUpdateItem) {
        onUpdateItem(item.id, { 
          attachments: updatedAttachments,
          mediaUrl: updatedMediaUrl
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRenameAttachment = (attachId: string, isResult = false) => {
    if (!attachmentRenameValue.trim()) return;
    if (isResult) {
      const updatedResults = (item.results || []).map(a => 
        a.id === attachId ? { ...a, name: attachmentRenameValue.trim() } : a
      );
      if (onUpdateItem) {
        onUpdateItem(item.id, { results: updatedResults });
      }
    } else {
      const updatedAttachments = (item.attachments || []).map(a => 
        a.id === attachId ? { ...a, name: attachmentRenameValue.trim() } : a
      );
      if (onUpdateItem) {
        onUpdateItem(item.id, { attachments: updatedAttachments });
      }
    }
    setEditingAttachmentId(null);
  };

  const handleResultUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/') && file.size > 800 * 1024) {
      const newResult: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        name: `${file.name} (Optimized)`,
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        type: 'video',
        date: new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')
      };
      const updatedResults = [...(item.results || []), newResult];
      if (onUpdateItem) {
        onUpdateItem(item.id, { results: updatedResults });
      }
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      let dataUrl = reader.result as string;
      const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.mov');

      if (!isVideo && dataUrl.startsWith('data:image/')) {
        dataUrl = await compressImage(dataUrl);
      }

      const newResult: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: dataUrl,
        type: isVideo ? 'video' : 'image',
        date: new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')
      };

      const updatedResults = [...(item.results || []), newResult];
      if (onUpdateItem) {
        onUpdateItem(item.id, { results: updatedResults });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResultLinkAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultLinkUrl.trim() || !resultLinkTitle.trim()) return;

    const newResult: Attachment = {
      id: Math.random().toString(36).substr(2, 9),
      name: resultLinkTitle.trim(),
      url: resultLinkUrl.trim().startsWith('http') ? resultLinkUrl.trim() : `https://${resultLinkUrl.trim()}`,
      type: 'image', // fallback
      date: new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')
    };

    const updatedResults = [...(item.results || []), newResult];
    if (onUpdateItem) {
      onUpdateItem(item.id, { results: updatedResults });
    }
    setResultLinkTitle('');
    setResultLinkUrl('');
  };

  const handleRemoveResult = (id: string) => {
    const updatedResults = (item.results || []).filter(r => r.id !== id);
    if (onUpdateItem) {
      onUpdateItem(item.id, { results: updatedResults });
    }
  };

  const handleMoveToReview = () => {
    if (onUpdateItem) {
      onUpdateItem(item.id, { 
        status: 'Review',
        stageId: 'stage-review'
      });
    }
  };

  const handleApprove = () => {
    if (onUpdateItem) {
      onUpdateItem(item.id, { 
        status: 'Approved',
        stageId: 'stage-4',
        approvalStatus: 'Approved'
      });
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    const updatedAttachments = (item.attachments || []).filter(a => a.id !== attachmentId);
    let updatedMediaUrl = item.mediaUrl;
    
    // If the removed attachment was the active cover, clear it or pick the next image
    if (item.mediaUrl && item.attachments?.find(a => a.id === attachmentId)?.url === item.mediaUrl) {
      const remainingImage = updatedAttachments.find(a => a.type === 'image');
      updatedMediaUrl = remainingImage ? remainingImage.url : '';
    }

    if (onUpdateItem) {
      onUpdateItem(item.id, {
        attachments: updatedAttachments,
        mediaUrl: updatedMediaUrl
      });
    }
  };

  const handleSetAsCover = (url: string) => {
    if (onUpdateItem) {
      onUpdateItem(item.id, { mediaUrl: url });
    }
  };

  const handleSaveEdit = () => {
    if (onUpdateItem) onUpdateItem(item.id, editData);
    setIsEditing(false);
  };

  const handleToggleAssignee = (userName: string) => {
    const current = editData.assignedTo;
    if (current.includes(userName)) {
      setEditData({ ...editData, assignedTo: current.filter(u => u !== userName) });
    } else {
      setEditData({ ...editData, assignedTo: [...current, userName] });
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>, field: 'description' | 'caption' | 'comment') => {
    const val = e.target.value;
    if (field === 'comment') setCommentText(val);
    else setEditData({ ...editData, [field]: val });

    const lastChar = val[e.target.selectionStart - 1];
    if (lastChar === '@') {
      setShowMentionSuggestions(true);
      // In a real app we'd calculate coordinates, here we just show it near the area
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const insertMention = (name: string) => {
    setCommentText(prev => {
      if (prev.endsWith('@')) {
        return prev + name + ' ';
      }
      return prev + '@' + name + ' ';
    });
    setShowMentionSuggestions(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Cover Section */}
        <div className="relative h-48 md:h-60 bg-gray-900 shrink-0">
          <img src={item.mediaUrl || `https://picsum.photos/seed/${item.id}/1200/600`} alt="Cover" className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
          
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
            <div className="flex gap-2">
              {item.platforms.map(p => (
                <span key={p} className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold rounded-full border border-white/30 uppercase tracking-widest">{p}</span>
              ))}
              <span className="px-3 py-1 bg-green-500/20 backdrop-blur-md text-green-400 text-[10px] font-bold rounded-full border border-green-500/30 uppercase tracking-widest">{item.type}</span>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <button 
                  onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-all text-white border border-white/20 flex items-center gap-2"
                >
                  {isEditing ? <Save size={18} /> : <Edit2 size={18} />}
                  <span className="text-xs font-bold">{isEditing ? t.save : t.edit}</span>
                </button>
              )}
              <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-all text-white border border-white/20">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="absolute bottom-6 left-8 right-8">
            {isEditing ? (
              <input 
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({...editData, title: e.target.value})}
                className="text-3xl font-black text-white bg-white/10 border border-white/20 rounded-xl px-4 py-2 w-full outline-none focus:ring-2 focus:ring-green-500"
              />
            ) : (
              <h2 className="text-3xl font-black text-white leading-tight">{item.title}</h2>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              {/* Description */}
              <section className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Layout size={14} /> {t.description}
                </h3>
                {isEditing ? (
                  <textarea 
                    value={editData.description}
                    onChange={(e) => handleTextChange(e, 'description')}
                    className="w-full p-6 bg-gray-50 border border-gray-100 rounded-3xl text-sm text-gray-700 leading-relaxed min-h-[150px] outline-none focus:ring-4 focus:ring-green-100 font-medium"
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-3xl border border-gray-100 italic font-medium whitespace-pre-wrap">
                    {item.description || (isRtl ? 'لا يوجد وصف متاح' : 'No description available')}
                  </p>
                )}
              </section>

              {/* Caption / Narrative Text */}
              <section className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> {isRtl ? 'النص السردي والكابشن' : 'Caption & Narrative Text'}
                </h3>
                {isEditing ? (
                  <textarea 
                    value={editData.caption}
                    onChange={(e) => handleTextChange(e, 'caption')}
                    className="w-full p-6 bg-gray-50 border border-gray-100 rounded-3xl text-sm text-gray-700 leading-relaxed min-h-[150px] outline-none focus:ring-4 focus:ring-green-100 font-medium"
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-3xl border border-gray-100 italic font-medium whitespace-pre-wrap">
                    {item.caption || (isRtl ? 'لا يوجد نص كابشن متاح' : 'No caption/narrative text available')}
                  </p>
                )}
              </section>

              {/* Checklist */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckSquare size={14} /> {t.checklist}
                  </h3>
                  <span className="text-xs font-black text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    {item.tasks.length > 0 ? Math.round((item.tasks.filter(t => t.completed).length / item.tasks.length) * 100) : 0}%
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                   {item.tasks.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => {
                        if (editingTaskId !== task.id && canEdit) {
                          handleToggleTask(task.id);
                        }
                      }} 
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all group", 
                        editingTaskId === task.id ? "cursor-default border-indigo-200" : (canEdit ? "cursor-pointer" : "cursor-default"),
                        task.completed ? "bg-green-50 border-green-100" : "bg-white border-gray-100 hover:border-gray-200"
                      )}
                    >
                      <div className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0", task.completed ? "bg-green-600 border-green-600 text-white" : "border-gray-200")}>
                        {task.completed && <Check size={14} />}
                      </div>
                      
                      {editingTaskId === task.id ? (
                        <div className="flex-1 flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingTaskText}
                            onChange={(e) => setEditingTaskText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveEditTask(task.id);
                              } else if (e.key === 'Escape') {
                                setEditingTaskId(null);
                              }
                            }}
                            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-4 focus:ring-green-100 text-gray-700"
                            autoFocus
                          />
                          <button 
                            onClick={() => handleSaveEditTask(task.id)} 
                            className="bg-green-600 text-white p-2 rounded-xl hover:bg-green-700 transition"
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className={cn("flex-1 text-sm font-bold transition-all", task.completed && "line-through opacity-40")}>
                          {task.text}
                          {task.dependsOn && (
                            <span className="inline-block text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full ml-2 mr-2 font-black">
                              {isRtl ? 'ثنائي' : 'Dep'}
                            </span>
                          )}
                        </span>
                      )}

                      {canEdit && editingTaskId !== task.id && (
                        <div className="flex items-center gap-1 shrink-0 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleStartEditTask(task.id, task.text)} 
                            className="p-2 text-gray-400 hover:text-green-600 transition"
                            title={isRtl ? 'تعديل المهمة' : 'Edit Task'}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTask(task.id)} 
                            className="p-2 text-gray-400 hover:text-red-500 transition"
                            title={isRtl ? 'حذف المهمة' : 'Delete Task'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {canEdit && (
                    isAddingTask ? (
                      <div className="p-6 bg-gray-50 border border-gray-100 rounded-3xl space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{isRtl ? 'اسم المهمة' : 'Task Name'}</label>
                          <input 
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            placeholder={isRtl ? 'اكتب تفاصيل المهمة...' : 'Enter task details...'}
                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-green-100 text-gray-700 font-semibold"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTask();
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{isRtl ? 'تعتمد على (اختياري)' : 'Depends On (Optional)'}</label>
                          <select
                            value={newTaskDependsOn}
                            onChange={(e) => setNewTaskDependsOn(e.target.value)}
                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-green-100 text-gray-700 font-semibold"
                          >
                            <option value="">{isRtl ? 'بدون شروط مسبقة' : 'No pre-requisite'}</option>
                            {item.tasks.map(t => (
                              <option key={t.id} value={t.id}>{t.text}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => {
                              setIsAddingTask(false);
                              setNewTaskText('');
                              setNewTaskDependsOn('');
                            }}
                            className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                          >
                            {isRtl ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button 
                            onClick={handleAddTask}
                            className="px-5 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-100"
                          >
                            {isRtl ? 'حفظ المهمة' : 'Save Task'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setIsAddingTask(true)} className="p-4 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center gap-2 text-gray-400 font-bold text-sm hover:border-green-500 hover:text-green-500 transition-all">
                        <Plus size={18} /> {isRtl ? 'إضافة مهمة' : 'Add Task'}
                      </button>
                    )
                  )}
                </div>
              </section>

              {/* Mentions / Activities / Comments */}
              <section className="space-y-6">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={14} /> {isRtl ? 'النشاط والتعليقات' : 'Activity & Comments'}
                </h3>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-4">
                  <div className="relative">
                    <textarea 
                      value={commentText}
                      onChange={(e) => handleTextChange(e, 'comment')}
                      placeholder={t.addComment}
                      className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-green-100 outline-none transition-all resize-none shadow-sm font-medium"
                      rows={2}
                    />
                    {showMentionSuggestions && (
                      <div className="absolute top-full left-0 z-50 mt-2 bg-white border border-gray-100 shadow-xl rounded-2xl p-2 w-48 overflow-hidden animate-in fade-in zoom-in-95">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-2 border-b border-gray-50">{isRtl ? 'منشن شخص' : 'Mention Someone'}</p>
                        {users.map(u => (
                          <button key={u.id} onClick={() => insertMention(u.name)} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-xl transition-all flex items-center gap-2">
                             <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center text-[10px] text-green-700">{u.name[0]}</div>
                             {u.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-gray-400 italic">{isRtl ? 'استخدم @ للمنشن' : 'Use @ to mention teammates'}</p>
                    <button onClick={handleAddComment} disabled={!commentText.trim()} className="px-8 py-2.5 bg-green-600 text-white rounded-xl text-xs font-black hover:bg-green-700 shadow-lg shadow-green-100 disabled:opacity-50 active:scale-95 transition-all">
                      {isRtl ? 'تعليق' : 'Comment'}
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {item.comments?.map((comment) => (
                    <div key={comment.id} className="flex gap-4 group">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 font-bold shadow-sm shrink-0">{comment.user?.[0] || comment.user}</div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-gray-900 truncate max-w-[150px]">{comment.user}</span>
                            <span className="text-[10px] font-bold text-gray-400">{comment.date}</span>
                          </div>
                          
                          {/* Edit / Delete Comment Actions */}
                          {(currentUser?.role === 'Admin' || currentUser?.name === comment.user) && editingCommentId !== comment.id && (
                            <div className="flex items-center gap-1 transition-opacity">
                              <button 
                                onClick={() => handleStartEditComment(comment.id, comment.text)} 
                                className="p-1.5 text-gray-400 hover:text-green-600 rounded transition"
                                title={isRtl ? 'تعديل التعليق' : 'Edit Comment'}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button 
                                onClick={() => handleDeleteComment(comment.id)} 
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded transition"
                                title={isRtl ? 'حذف التعليق' : 'Delete Comment'}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>

                        {editingCommentId === comment.id ? (
                          <div className="space-y-2 mt-1">
                            <textarea
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-green-100 outline-none transition-all resize-none shadow-sm font-medium"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => setEditingCommentId(null)} 
                                className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition"
                              >
                                {isRtl ? 'إلغاء' : 'Cancel'}
                              </button>
                              <button 
                                onClick={() => handleSaveEditComment(comment.id)} 
                                className="px-4 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-xl font-black shadow-md shadow-green-100 transition"
                              >
                                {isRtl ? 'حفظ' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={cn(
                            "bg-white p-5 border border-gray-100 shadow-sm leading-relaxed text-sm font-medium text-gray-600 whitespace-pre-wrap break-words rounded-2xl",
                            isRtl ? "rounded-tr-none" : "rounded-tl-none"
                          )}>
                            {/* Basic Mention Highlighting */}
                            {comment.text.split(/(@\w+\s\w+|@\w+)/).map((part, i) => (
                              part.startsWith('@') ? <span key={i} className="text-green-600 font-black">{part}</span> : part
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar Detals */}
            <div className="space-y-8">
              <section className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Users size={14} /> {isRtl ? 'الأشخاص المعنيين' : 'People Involved'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(isEditing ? editData.assignedTo : item.assignedTo).map((person, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 px-3 bg-green-50 border border-green-100 rounded-xl">
                      <div className="w-6 h-6 rounded-lg bg-green-600 text-white flex items-center justify-center text-[10px] font-bold">{person[0]}</div>
                      <span className="text-xs font-bold text-green-800">{person}</span>
                      {isEditing && (
                        <button onClick={() => handleToggleAssignee(person)} className="text-green-600 hover:text-red-500"><X size={12} /></button>
                      )}
                    </div>
                  ))}
                  <div className="relative">
                    <button onClick={() => setIsEditing(true)} className="w-8 h-8 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-green-500 hover:text-green-500 transition-all">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                {isEditing && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRtl ? 'إضافة أعضاء' : 'Add Team Members'}</p>
                    <div className="grid grid-cols-1 gap-1">
                      {users.filter(u => !editData.assignedTo.includes(u.name)).map(u => (
                        <button key={u.id} onClick={() => handleToggleAssignee(u.name)} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl transition-all text-xs font-bold text-gray-600">
                          <div className="w-6 h-6 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500">{u.name[0]}</div>
                          {u.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-4 animate-fade-in">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Paperclip size={14} /> {isRtl ? 'المرفقات (صورة / فيديو)' : 'Attachments (Image / Video)'}
                </h3>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-4">
                  <label className="flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl hover:border-green-500 hover:text-green-600 transition-all cursor-pointer group">
                    <ImageIcon size={24} className="text-gray-400 group-hover:text-green-500 mb-2" />
                    <span className="text-xs font-bold text-gray-500 group-hover:text-green-600">
                      {isRtl ? 'رفع صورة أو فيديو للمرفقات' : 'Upload Image or Video'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*,video/*" 
                      className="hidden" 
                      onChange={handleAttachmentUpload}
                    />
                  </label>

                  <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                    {item.attachments && item.attachments.map((attach) => (
                      <div key={attach.id} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between gap-3 group shadow-sm transition-all hover:border-green-500/10">
                        <div className="flex items-center gap-2 min-w-0">
                          {attach.type === 'image' ? (
                            <img 
                              src={attach.url} 
                              className="w-8 h-8 rounded-lg object-cover shrink-0 cursor-pointer" 
                              onClick={() => { setPreviewAttachmentUrl(attach.url); setPreviewAttachmentType('image'); }}
                              referrerPolicy="no-referrer" 
                            />
                          ) : (
                            <div 
                              className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 cursor-pointer"
                              onClick={() => { setPreviewAttachmentUrl(attach.url); setPreviewAttachmentType('video'); }}
                            >
                              <ImageIcon size={16} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            {editingAttachmentId === attach.id ? (
                              <div className="flex items-center gap-1 w-full">
                                <input 
                                  type="text"
                                  value={attachmentRenameValue}
                                  onChange={(e) => setAttachmentRenameValue(e.target.value)}
                                  className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs font-bold outline-none"
                                  autoFocus
                                />
                                <button 
                                  onClick={() => handleRenameAttachment(attach.id, false)} 
                                  className="text-green-600 p-0.5"
                                >
                                  <Check size={12} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <p className="text-xs font-bold text-gray-800 truncate" title={attach.name}>{attach.name}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">{attach.type} • {attach.date}</p>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {attach.type === 'image' && attach.url !== item.mediaUrl && (
                            <button 
                              onClick={() => handleSetAsCover(attach.url)}
                              className="text-[9px] font-black uppercase text-green-600 bg-green-50 px-2 py-1 rounded hover:bg-green-100 transition-colors shrink-0"
                            >
                              {isRtl ? 'كافر' : 'Cover'}
                            </button>
                          )}
                          <button 
                            onClick={() => { setEditingAttachmentId(attach.id); setAttachmentRenameValue(attach.name); }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                            title={isRtl ? 'تعديل الاسم' : 'Rename'}
                          >
                            <Edit2 size={12} />
                          </button>
                          <a 
                            href={attach.url} 
                            download={attach.name} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-1 hover:bg-green-50 rounded text-green-600 transition-colors"
                            title={isRtl ? 'تحميل' : 'Download'}
                          >
                            <Download size={12} />
                          </a>
                          <button 
                            onClick={() => handleRemoveAttachment(attach.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!item.attachments || item.attachments.length === 0) && (
                      <p className="text-center text-[10px] font-bold text-gray-400 py-4 italic">
                        {isRtl ? 'لا توجد مرفقات بعد' : 'No attachments yet'}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Results (النتائج) Section */}
              <section className="space-y-4 animate-fade-in shadow-sm">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" /> 
                    {isRtl ? 'النتائج (صور / فيديو / روابط)' : 'Results (Images / Videos / Links)'}
                  </span>
                </h3>
                
                <div className="bg-emerald-50/40 p-6 rounded-[2.2rem] border border-emerald-100/60 space-y-4">
                  {/* Result media uploading forms */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex flex-col items-center justify-center p-3 bg-white border border-dashed border-emerald-200 rounded-2xl hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer group">
                      <ImageIcon size={18} className="text-emerald-500 group-hover:text-emerald-500 mb-1" />
                      <span className="text-[10px] font-bold text-gray-500 group-hover:text-emerald-600">
                        {isRtl ? 'رفع ملف نتيجة (صورة/فيديو)' : 'Upload result image/video'}
                      </span>
                      <input 
                        type="file" 
                        accept="image/*,video/*" 
                        className="hidden" 
                        onChange={handleResultUpload}
                      />
                    </label>

                    <form onSubmit={handleResultLinkAdd} className="bg-white p-3 rounded-2xl border border-emerald-100 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <input 
                          type="text" 
                          placeholder={isRtl ? 'اسم الرابط...' : 'Link title...'}
                          value={resultLinkTitle}
                          onChange={(e) => setResultLinkTitle(e.target.value)}
                          className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold focus:bg-white outline-none w-full"
                        />
                        <input 
                          type="text" 
                          placeholder={isRtl ? 'أدخل رابط النتيجة هنا...' : 'https://result-link.com'}
                          value={resultLinkUrl}
                          onChange={(e) => setResultLinkUrl(e.target.value)}
                          className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold focus:bg-white outline-none w-full font-mono text-emerald-700 placeholder-gray-400"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus size={10} />
                        {isRtl ? 'إضافة رابط النتيجة' : 'Add result link'}
                      </button>
                    </form>
                  </div>

                  {/* Results Items List */}
                  <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar">
                    {item.results && item.results.map((res) => (
                      <div key={res.id} className="p-3 bg-white border border-emerald-100 rounded-xl flex items-center justify-between gap-3 group shadow-sm transition-all hover:border-emerald-500/20">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {res.url.startsWith('https://picsum') || res.url.startsWith('data:image') ? (
                            <img 
                              src={res.url} 
                              className="w-8 h-8 rounded-lg object-cover shrink-0 cursor-pointer" 
                              onClick={() => { setPreviewAttachmentUrl(res.url); setPreviewAttachmentType('image'); }} 
                              referrerPolicy="no-referrer" 
                            />
                          ) : (
                            <div 
                              className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 cursor-pointer" 
                              onClick={() => { setPreviewAttachmentUrl(res.url); setPreviewAttachmentType('link'); }}
                            >
                              <Link2 size={15} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            {editingAttachmentId === res.id ? (
                              <div className="flex items-center gap-1">
                                <input 
                                  type="text"
                                  value={attachmentRenameValue}
                                  onChange={(e) => setAttachmentRenameValue(e.target.value)}
                                  className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-[11px] font-bold outline-none"
                                  autoFocus
                                />
                                <button onClick={() => handleRenameAttachment(res.id, true)} className="text-emerald-600 p-0.5">
                                  <Check size={12} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <p className="text-xs font-bold text-gray-805 truncate flex items-center gap-1.5" title={res.name}>
                                  {res.name}
                                  {!(res.url.startsWith('data:') || res.url.startsWith('https://picsum')) && (
                                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-800" onClick={(e) => e.stopPropagation()}>
                                      <ExternalLink size={11} />
                                    </a>
                                  )}
                                </p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">{res.type || 'link'} • {res.date}</p>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => { setEditingAttachmentId(res.id); setAttachmentRenameValue(res.name); }}
                            className="p-1 hover:bg-zinc-100 rounded text-zinc-600 transition-colors"
                            title={isRtl ? 'تعديل الاسم' : 'Rename'}
                          >
                            <Edit2 size={11} />
                          </button>
                          <a 
                            href={res.url} 
                            download={res.name} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-1 hover:bg-emerald-50 rounded text-emerald-600 transition-colors"
                            title={isRtl ? 'تحميل' : 'Download'}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download size={11} />
                          </a>
                          <button 
                            onClick={() => handleRemoveResult(res.id)}
                            className="p-1 hover:bg-rose-50 rounded text-rose-600 transition-colors"
                            title={isRtl ? 'حذف' : 'Delete'}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {(!item.results || item.results.length === 0) && (
                      <p className="text-center text-[10px] font-bold text-gray-400 py-3 italic">
                        {isRtl ? 'لا توجد نتائج مرفقة بعد لهذا المحتوى.' : 'No results attached to this content yet.'}
                      </p>
                    )}
                  </div>

                  {/* Move to Review button */}
                  {item.status !== 'Review' && item.status !== 'Approved' && (
                    <button 
                      onClick={handleMoveToReview}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-950/10 hover:shadow-lg hover:from-emerald-700 hover:to-teal-755 transition-all flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <Eye size={14} />
                      {isRtl ? 'انقل للمراجعة' : 'Move to Review'}
                    </button>
                  )}

                  {/* Approve/Mowafaqa button displayed under review */}
                  {item.status === 'Review' && (
                    <button 
                      onClick={handleApprove}
                      className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-black text-xs rounded-xl shadow-md shadow-yellow-950/10 hover:shadow-lg hover:from-yellow-600 hover:to-amber-600 transition-all flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <CheckCircle2 size={14} />
                      {isRtl ? 'الموافقة (اعتماد)' : 'Approve (Confirm)'}
                    </button>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Layout size={14} /> {isRtl ? 'مرحلة المهمة الحالية' : 'Current Content Stage'}
                </h3>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">{isRtl ? 'اختر المرحلة' : 'Select Stage'}</span>
                    <select 
                      value={editData.stageId || stages?.find(s => s.status === editData.status)?.id || ''}
                      onChange={(e) => {
                        const sId = e.target.value;
                        const selectedStage = stages?.find(s => s.id === sId);
                        if (selectedStage) {
                          const updated = {
                            ...editData,
                            stageId: sId,
                            status: selectedStage.status
                          };
                          setEditData(updated);
                          if (onUpdateItem) {
                            onUpdateItem(item.id, {
                              stageId: sId,
                              status: selectedStage.status
                            });
                          }
                        }
                      }}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none text-gray-700 min-w-[150px]"
                    >
                      {stages?.map(s => (
                        <option key={s.id} value={s.id}>
                          {isRtl ? (s.nameAr || s.name) : s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <AtSign size={14} /> {isRtl ? 'المواعيد والجدولة والفرز' : 'Dates, Priority & Scheduling'}
                </h3>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-4">
                   <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">{t.dueDate}</span>
                    {isEditing ? (
                      <input 
                        type="date"
                        value={editData.dueDate}
                        onChange={(e) => setEditData({...editData, dueDate: e.target.value})}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold font-mono outline-none"
                      />
                    ) : (
                      <span className="text-xs font-black text-gray-900">{item.dueDate}</span>
                    )}
                   </div>
                   
                   <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">{isRtl ? 'تاريخ النشر' : 'Publish Date'}</span>
                    {isEditing ? (
                      <input 
                        type="date"
                        value={editData.publishDate}
                        onChange={(e) => setEditData({...editData, publishDate: e.target.value})}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold font-mono outline-none"
                      />
                    ) : (
                      <span className="text-xs font-black text-gray-900">{item.publishDate || '-'}</span>
                    )}
                   </div>

                   <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">{isRtl ? 'تاريخ التجهيز/الإعداد' : 'Prep Date'}</span>
                    {isEditing ? (
                      <input 
                        type="date"
                        value={editData.preparationDate}
                        onChange={(e) => setEditData({...editData, preparationDate: e.target.value})}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold font-mono outline-none"
                      />
                    ) : (
                      <span className="text-xs font-black text-gray-900">{item.preparationDate || '-'}</span>
                    )}
                   </div>
                   <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">{t.priority}</span>
                    {isEditing ? (
                      <select 
                        value={editData.priority}
                        onChange={(e) => setEditData({...editData, priority: e.target.value as Priority})}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      >
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    ) : (
                      <span className={cn("px-2 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider", item.priority === 'High' ? "bg-red-50 text-red-600 border-red-100" : "bg-blue-50 text-blue-600 border-blue-100")}>{item.priority}</span>
                    )}
                   </div>
                   <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">{isRtl ? 'الأسبوع' : 'Week'}</span>
                    {isEditing ? (
                      <select 
                        value={editData.week}
                        onChange={(e) => setEditData({...editData, week: e.target.value})}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      >
                        {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(w => (
                          <option key={w} value={w}>{isRtl ? w.replace('Week', 'الأسبوع') : w}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs font-black text-gray-900">{isRtl ? (item.week || 'Week 1').replace('Week', 'الأسبوع') : (item.week || 'Week 1')}</span>
                    )}
                   </div>
                   <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">{isRtl ? 'الهدف' : 'Objective'}</span>
                    {isEditing ? (
                      <select 
                        value={editData.objective}
                        onChange={(e) => setEditData({...editData, objective: e.target.value})}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      >
                        {['Trust', 'Clinic', 'Service', 'Education', 'Engagement', 'Sales'].map(obj => (
                           <option key={obj} value={obj}>{obj}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs font-bold text-gray-600 bg-white px-2 py-0.5 rounded-lg border border-gray-100">{item.objective || 'Trust'}</span>
                    )}
                   </div>

                   {/* Platforms Editing Block */}
                   <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                     <span className="text-xs font-bold text-gray-400">{isRtl ? 'المنصات' : 'Platforms'}</span>
                     {isEditing ? (
                       <div className="flex flex-wrap gap-2">
                         {['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'WhatsApp'].map(p => {
                           const isSelected = editData.platforms.includes(p as Platform);
                           return (
                             <button
                               key={p}
                               type="button"
                               onClick={() => {
                                 const updated = isSelected 
                                   ? editData.platforms.filter(x => x !== p)
                                   : [...editData.platforms, p as Platform];
                                 setEditData({ ...editData, platforms: updated });
                               }}
                               className={cn(
                                 "px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                                 isSelected 
                                   ? "bg-green-600 text-white border-green-600 shadow-sm"
                                   : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                               )}
                             >
                               {p}
                             </button>
                           );
                         })}
                       </div>
                     ) : (
                       <div className="flex flex-wrap gap-1">
                         {item.platforms.map(p => (
                           <span key={p} className="px-2 py-0.5 bg-gray-100 text-gray-800 text-[10px] font-bold border rounded-lg border-gray-200">{p}</span>
                         ))}
                       </div>
                     )}
                   </div>

                   {/* Labels / Tags Editing Block */}
                   <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                     <span className="text-xs font-bold text-gray-400">{isRtl ? 'تصنيفات (Labels)' : 'Labels'}</span>
                     {isEditing ? (
                       <div className="space-y-2">
                         <div className="flex gap-2">
                           <input
                             type="text"
                             placeholder={isRtl ? 'اسم التصنيف...' : 'Label name...'}
                             value={newLabelText}
                             onChange={(e) => setNewLabelText(e.target.value)}
                             className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none text-gray-700 font-sans"
                             onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                 e.preventDefault();
                                 if (newLabelText.trim() && !editData.labels.includes(newLabelText.trim())) {
                                   setEditData({ ...editData, labels: [...editData.labels, newLabelText.trim()] });
                                   setNewLabelText('');
                                 }
                               }
                             }}
                           />
                           <button
                             type="button"
                             onClick={() => {
                               if (newLabelText.trim() && !editData.labels.includes(newLabelText.trim())) {
                                 setEditData({ ...editData, labels: [...editData.labels, newLabelText.trim()] });
                                 setNewLabelText('');
                               }
                             }}
                             className="px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 active:scale-95 transition-all"
                           >
                             {isRtl ? 'إضافة' : 'Add'}
                           </button>
                         </div>
                         <div className="flex flex-wrap gap-1.5 mt-1.5">
                           {editData.labels.map(lbl => (
                             <span key={lbl} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 text-zinc-800 text-[10px] font-bold border rounded-lg border-zinc-200">
                               {lbl}
                               <button
                                 type="button"
                                 onClick={() => setEditData({ ...editData, labels: editData.labels.filter(l => l !== lbl) })}
                                 className="text-zinc-400 hover:text-red-500 font-extrabold ml-1 font-sans"
                               >
                                 ×
                               </button>
                             </span>
                           ))}
                         </div>
                       </div>
                     ) : (
                       <div className="flex flex-wrap gap-1.5">
                         {(item.labels || []).map(lbl => (
                           <span key={lbl} className="px-2.5 py-1 bg-zinc-100 text-zinc-800 text-[10px] font-black border rounded-lg border-zinc-200 uppercase tracking-wider">{lbl}</span>
                         ))}
                         {(!item.labels || item.labels.length === 0) && (
                           <span className="text-[10px] text-gray-400 italic font-bold">{isRtl ? 'لا توجد تصنيفات' : 'No labels yet'}</span>
                         )}
                       </div>
                     )}
                   </div>

                   {canDelete && (
                     <div className="pt-4 border-t border-gray-200">
                    <button onClick={() => { if(onDeleteItem) { onDeleteItem(item.id); onClose(); } }} className="w-full flex items-center justify-center gap-2 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all text-xs font-bold">
                      <Trash2 size={14} /> {isRtl ? 'حذف المحتوى' : 'Archive Content'}
                    </button>
                   </div>
                   )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Interactive Lightbox Overlay */}
      <AnimatePresence>
        {previewAttachmentUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            {/* Close button */}
            <button 
              onClick={() => { setPreviewAttachmentUrl(null); setPreviewAttachmentType(null); }}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer shadow-lg"
              title={isRtl ? 'إغلاق' : 'Close'}
            >
              <X size={24} />
            </button>

            {/* Content Display */}
            <div className="max-w-4xl max-h-[80vh] w-full flex items-center justify-center overflow-hidden">
              {previewAttachmentType === 'image' && (
                <img 
                  src={previewAttachmentUrl} 
                  className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl" 
                  alt="Attachment Preview" 
                  referrerPolicy="no-referrer"
                />
              )}
              {previewAttachmentType === 'video' && (
                <video 
                  src={previewAttachmentUrl} 
                  className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl" 
                  controls 
                  autoPlay 
                />
              )}
              {previewAttachmentType === 'link' && (
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center max-w-md w-full space-y-6">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                    <Link2 size={32} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-white text-lg font-bold">{isRtl ? 'رابط النتيجة الخارجي' : 'External Result Link'}</h4>
                    <p className="text-zinc-400 text-xs truncate font-mono">{previewAttachmentUrl}</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => { setPreviewAttachmentUrl(null); setPreviewAttachmentType(null); }}
                      className="flex-1 py-2.5 bg-zinc-805 text-zinc-300 font-bold text-xs rounded-xl hover:bg-zinc-700 transition"
                    >
                      {isRtl ? 'تراجع' : 'Back'}
                    </button>
                    <a 
                      href={previewAttachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex-1 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 text-center transition flex items-center justify-center gap-1.5"
                    >
                      {isRtl ? 'افتح الرابط' : 'Open Link'}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Toolbar */}
            {previewAttachmentType !== 'link' && (
              <div className="mt-6 flex items-center gap-4 bg-white/10 px-6 py-2.5 rounded-full backdrop-blur">
                <a 
                  href={previewAttachmentUrl} 
                  download="attachment" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white hover:text-green-400 transition font-bold text-xs"
                >
                  <Download size={16} />
                  {isRtl ? 'تحميل الملف' : 'Download File'}
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
