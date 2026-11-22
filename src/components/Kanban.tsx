import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  MoreVertical, 
  Clock, 
  CheckSquare,
  Facebook,
  Instagram,
  Linkedin,
  Video,
  MessageCircle,
  Hash,
  Edit2,
  Trash2,
  X,
  Check,
  Settings2,
  Layers,
  LayoutGrid,
  CalendarClock
} from 'lucide-react';
import { KanbanAgenda } from './KanbanAgenda';
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragOverEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { translations } from '../translations';
import { ContentItem, Language, ContentStatus, Platform, Priority, Task, KanbanStage, User } from '../types';
import { cn } from '../lib/utils';

interface KanbanProps {
  lang: Language;
  content: ContentItem[];
  stages: KanbanStage[];
  users?: User[];
  onUpdateStages: (stages: KanbanStage[]) => void;
  onUpdateStatus: (id: string, status: ContentStatus, stageId?: string, newOrderIds?: string[]) => void;
  onUpdateTasks: (id: string, tasks: Task[]) => void;
  onOpenDetail: (id: string) => void;
  onNewContent?: () => void;
}

const PLATFORM_ICONS: Record<Platform, any> = {
  'Facebook': Facebook,
  'Instagram': Instagram,
  'LinkedIn': Linkedin,
  'TikTok': Video,
  'WhatsApp': MessageCircle,
  'Other': Hash,
};

interface SortableCardProps {
  item: ContentItem;
  onOpenDetail: (id: string) => void;
  isRtl: boolean;
  t: any;
  showResults?: boolean;
}

const SortableCard: React.FC<SortableCardProps> = ({ item, onOpenDetail, isRtl, t, showResults }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'High': return 'bg-red-500';
      case 'Normal': return 'bg-blue-500';
      case 'Low': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const renderTextWithLinks = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const parts = text.split(urlRegex);
    return (
      <>
        {parts.map((part, idx) => {
          if (urlRegex.test(part)) {
            const href = part.startsWith('http') ? part : `https://${part}`;
            return (
              <a 
                key={idx} 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-green-600 hover:text-green-850 underline hover:no-underline font-extrabold transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </a>
            );
          }
          return part;
        })}
      </>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpenDetail(item.id)}
      className={cn(
        "bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group cursor-grab active:cursor-grabbing relative overflow-hidden mb-4"
      )}
    >
      {/* Priority Indicator */}
      <div className={cn("absolute top-0 w-1 h-full", isRtl ? "right-0" : "left-0", getPriorityColor(item.priority))} />

      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
            {item.type}
          </span>
          {item.paid && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
              PAID
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {item.platforms.map(p => {
            const Icon = PLATFORM_ICONS[p as Platform] || Hash;
            return <Icon key={p} size={12} className="text-gray-400" />;
          })}
        </div>
      </div>

      {/* Labels */}
      {item.labels && item.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.labels.map(lbl => (
            <span key={lbl} className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 uppercase tracking-wider">
              {lbl}
            </span>
          ))}
        </div>
      )}

      <h4 className="font-bold text-sm mb-2 group-hover:text-green-700 transition-colors line-clamp-1">{item.title}</h4>
      <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed" onClick={(e) => e.stopPropagation()}>{renderTextWithLinks(item.description || item.caption || '')}</p>

      {/* Tasks Preview */}
      {item.tasks.length > 0 && (
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 mb-1">
            <span className="flex items-center gap-1">
              <CheckSquare size={10} />
              {t.tasks}
            </span>
            <span>{item.tasks.filter(t => t.completed).length}/{item.tasks.length}</span>
          </div>
          <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-green-500 h-full transition-all duration-500" 
              style={{ width: `${(item.tasks.filter(t => t.completed).length / item.tasks.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center -space-x-2">
          {item.assignedTo.map((person, idx) => (
            <div 
              key={idx}
              title={person}
              className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-700 border-2 border-white shadow-sm hover:translate-y-[-2px] transition-transform"
            >
              {person[0]}
            </div>
          ))}
          {item.assignedTo.length === 0 && (
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 border-2 border-white">
              ?
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5 text-[10px] text-gray-400 font-bold">
          <div className="flex items-center gap-1">
            <Clock size={12} className="shrink-0" />
            <span>{item.dueDate ? item.dueDate.split('-').slice(1).join('/') : '-'}</span>
          </div>
          {item.publishDate && (
            <span className="text-[9px] text-emerald-600 font-black">
              {isRtl ? 'نشر: ' : 'Pub: '}{item.publishDate.split('-').slice(1).join('/')}
            </span>
          )}
        </div>
      </div>

      {showResults && item.results && item.results.length > 0 && (
        <div className="mt-4 pt-3 border-t border-dashed border-gray-100 space-y-2" onClick={(e) => e.stopPropagation()}>
          <div className="text-[10px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            {isRtl ? 'النتائج والمرفقات' : 'Results & Materials'}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {item.results.map((res) => {
              const isImage = res.type === 'Image' || res.type === 'image' || res.url?.startsWith('data:image/');
              const isVideo = res.type === 'Video' || res.type === 'video' || res.url?.startsWith('data:video/');
              return (
                <div 
                  key={res.id} 
                  className="p-2 bg-gray-50/70 border border-gray-100 rounded-xl flex flex-col gap-2 hover:bg-white hover:border-gray-200 transition-all text-xs"
                >
                  {isImage && (
                    <a 
                      href={res.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="block rounded-lg overflow-hidden border border-gray-100 aspect-video relative group/img cursor-zoom-in"
                    >
                      <img src={res.url} alt={res.name} className="w-full h-full object-cover group-hover/img:scale-105 transition-all duration-300" referrerPolicy="no-referrer" />
                    </a>
                  )}
                  {isVideo && (
                    <video src={res.url} controls className="w-full rounded-lg border border-gray-100 aspect-video" />
                  )}
                  <a 
                    href={res.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="font-bold text-gray-700 hover:text-green-700 truncate underline decoration-dotted capitalize transition-colors"
                    title={res.name}
                  >
                    {res.name}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface KanbanColumnProps {
  stage: KanbanStage;
  filteredContent: ContentItem[];
  editingStage: string | null;
  setEditingStage: (id: string | null) => void;
  newStageName: string;
  setNewStageName: (name: string) => void;
  handleRenameStage: (id: string, newName: string) => void;
  handleDeleteStage: (id: string) => void;
  onOpenDetail: (id: string) => void;
  isRtl: boolean;
  t: any;
}

const KanbanColumn: React.FC<KanbanColumnProps & { onNewContent?: () => void }> = ({ 
  stage, 
  filteredContent, 
  editingStage, 
  setEditingStage, 
  newStageName, 
  setNewStageName, 
  handleRenameStage, 
  handleDeleteStage, 
  onOpenDetail, 
  isRtl, 
  t,
  onNewContent
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const stageTitle = isRtl ? (stage.nameAr || stage.name) : stage.name;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      id={`column-${stage.id}`}
      className="h-full w-80 flex flex-col bg-gray-100/50 rounded-[2rem] p-5 shrink-0 border border-gray-200/50 select-none pb-4"
    >
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3 flex-1 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
          {editingStage === stage.id ? (
            <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
              <input 
                autoFocus
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameStage(stage.id, newStageName)}
                className="bg-white border border-green-500 rounded-lg px-2 py-1 text-sm font-bold w-full outline-none"
              />
              <button onClick={() => handleRenameStage(stage.id, newStageName)} className="p-1 text-green-600"><Check size={16} /></button>
              <button onClick={() => setEditingStage(null)} className="p-1 text-red-600"><X size={16} /></button>
            </div>
          ) : (
            <>
              <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider truncate">{stageTitle}</h3>
              <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {filteredContent.filter(c => c.stageId === stage.id || (!c.stageId && c.status === stage.status)).length}
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => {
              setEditingStage(stage.id);
              setNewStageName(stageTitle);
            }}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => handleDeleteStage(stage.id)}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <SortableContext 
          id={stage.id}
          items={filteredContent.filter(c => c.stageId === stage.id || (!c.stageId && c.status === stage.status)).map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {filteredContent
            .filter(c => c.stageId === stage.id || (!c.stageId && c.status === stage.status))
            .map((item) => (
              <SortableCard 
                key={item.id} 
                item={item} 
                onOpenDetail={onOpenDetail} 
                isRtl={isRtl} 
                t={t} 
                showResults={stage.status === 'Review' || stage.id === 'stage-review' || stage.name.toLowerCase() === 'review' || (stage.nameAr && stage.nameAr.includes('مراجعة'))}
              />
            ))}
        </SortableContext>
        
        <button 
          onClick={onNewContent}
          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:border-green-500 hover:text-green-500 transition-all mt-2"
        >
          <Plus size={16} />
          {isRtl ? 'إضافة محتوى' : 'Add Content'}
        </button>
      </div>
    </div>
  );
};

export const Kanban: React.FC<KanbanProps> = ({ 
  lang, 
  content, 
  stages, 
  users = [],
  onUpdateStages, 
  onUpdateStatus, 
  onUpdateTasks, 
  onOpenDetail, 
  onNewContent 
}) => {
  const t = translations[lang];
  const [viewMode, setViewMode] = useState<'board' | 'agenda'>('board');
  const [activePlatform, setActivePlatform] = useState<Platform | 'All'>('All');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [newStageName, setNewStageName] = useState('');
  const [activeStageId, setActiveStageId] = useState<string>(stages[0]?.id || '');
  const isRtl = lang === 'ar';

  const [localContent, setLocalContent] = useState<ContentItem[]>(content);

  // Compute overdue count for badge on Agenda button
  const overdueCount = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return localContent.filter(c => {
      if (!c.dueDate) return false;
      const clean = c.dueDate.split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return !isNaN(d.getTime()) && d.getTime() < today.getTime();
      }
      const d = new Date(c.dueDate);
      return !isNaN(d.getTime()) && d.getTime() < today.getTime();
    }).length;
  }, [localContent]);

  // Keep localContent up to date with fresh content prop when not actively dragging
  useEffect(() => {
    if (!activeId) {
      setLocalContent(content);
    }
  }, [content, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredContent = activePlatform === 'All' 
    ? localContent 
    : localContent.filter(c => c.platforms.includes(activePlatform as Platform));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isDraggingStage = stages.some(s => s.id === activeId);
    if (isDraggingStage) return;

    setLocalContent((prev) => {
      const activeIdx = prev.findIndex(c => c.id === activeId);
      if (activeIdx === -1) return prev;

      const activeItem = prev[activeIdx];
      const overStage = stages.find(s => s.id === overId);
      const overItem = prev.find(c => c.id === overId);

      let targetStageId = activeItem.stageId;
      let targetStatus = activeItem.status;

      if (overStage) {
        targetStageId = overStage.id;
        targetStatus = overStage.status;
      } else if (overItem) {
        const itemStage = stages.find(s => s.id === overItem.stageId || s.status === overItem.status);
        if (itemStage) {
          targetStageId = itemStage.id;
          targetStatus = itemStage.status;
        }
      }

      // If moving to a different stage
      if (activeItem.stageId !== targetStageId || activeItem.status !== targetStatus) {
        const updated = prev.filter(c => c.id !== activeId);
        const updatedActive = {
          ...activeItem,
          stageId: targetStageId,
          status: targetStatus
        };

        if (overItem) {
          const overIdx = updated.findIndex(c => c.id === overId);
          if (overIdx !== -1) {
            updated.splice(overIdx, 0, updatedActive);
          } else {
            updated.push(updatedActive);
          }
        } else {
          updated.push(updatedActive);
        }
        return updated;
      } else if (overItem) {
        // Dragging inside the SAME stage - reorder in place
        const overIdx = prev.findIndex(c => c.id === overId);
        if (activeIdx !== -1 && overIdx !== -1 && activeIdx !== overIdx) {
          return arrayMove(prev, activeIdx, overIdx);
        }
      }

      return prev;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      setLocalContent(content);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // If dragging a stage
    const activeStageIndex = stages.findIndex(s => s.id === activeId);
    if (activeStageIndex !== -1) {
      const overStageIndex = stages.findIndex(s => s.id === overId);
      if (overStageIndex !== -1 && activeStageIndex !== overStageIndex) {
        onUpdateStages(arrayMove(stages, activeStageIndex, overStageIndex));
      }
      return;
    }

    // Apply exact drop reorder target to prevent state jumping
    const activeItem = localContent.find(c => c.id === activeId);
    if (!activeItem) return;

    const itemStage = stages.find(s => s.id === activeItem.stageId || s.status === activeItem.status);
    if (itemStage) {
      const targetStageItems = localContent.filter(c => c.stageId === itemStage.id || (!c.stageId && c.status === itemStage.status));
      const updatedOrderIds = targetStageItems.map(c => c.id);
      onUpdateStatus(activeId, itemStage.status, itemStage.id, updatedOrderIds);
    }
  };

  const handleAddStage = () => {
    const id = `stage-${Date.now()}`;
    const name = isRtl ? 'مرحلة جديدة' : 'New Stage';
    onUpdateStages([...stages, { id, name, status: 'Idea', color: '#CBD5E1' }]);
  };

  const handleRenameStage = (id: string, newName: string) => {
    if (!newName.trim()) return;
    onUpdateStages(stages.map(s => {
      if (s.id === id) {
        return isRtl ? { ...s, nameAr: newName, name: newName } : { ...s, name: newName };
      }
      return s;
    }));
    setEditingStage(null);
  };

  const handleDeleteStage = (id: string) => {
    if (stages.length <= 1) return;
    const stage = stages.find(s => s.id === id);
    const stageName = isRtl ? (stage?.nameAr || stage?.name) : stage?.name;
    if (window.confirm(isRtl ? `هل أنت متأكد من حذف مرحلة "${stageName}"؟` : `Are you sure you want to delete stage "${stageName}"?`)) {
      onUpdateStages(stages.filter(s => s.id !== id));
    }
  };

  const activeItem = activeId ? localContent.find(c => c.id === activeId) : null;

  return (
    <div className="h-full flex flex-col space-y-6 overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Platform Tabs & View Switcher & Stage Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          {/* View Mode Toggle: Board vs Agenda */}
          <div className="flex bg-gray-200/80 p-1 rounded-2xl items-center gap-1 shadow-inner">
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer",
                viewMode === 'board'
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <LayoutGrid size={16} />
              <span>{isRtl ? 'الأعمدة' : 'Board'}</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer relative",
                viewMode === 'agenda'
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <CalendarClock size={16} />
              <span>{isRtl ? 'أجندة' : 'Agenda'}</span>
              {overdueCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse shadow-sm">
                  {overdueCount}
                </span>
              )}
            </button>
          </div>

          {/* Platform Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-2xl flex-wrap gap-1">
            {(['All', 'Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'WhatsApp'] as (Platform | 'All')[]).map((p) => {
              const Icon = p === 'All' ? Layers : PLATFORM_ICONS[p as Platform];
              const nameToDisplay = p === 'All' ? (isRtl ? 'عام' : 'General') : p;
              return (
                <button
                  key={p}
                  onClick={() => setActivePlatform(p)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer",
                    activePlatform === p 
                      ? "bg-white text-green-700 shadow-sm" 
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{nameToDisplay}</span>
                </button>
              );
            })}
          </div>
        </div>

        {viewMode === 'board' && (
          <button 
            onClick={handleAddStage}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs md:text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm self-start lg:self-auto cursor-pointer"
          >
            <Plus size={18} />
            {isRtl ? 'إضافة مرحلة' : 'Add Stage'}
          </button>
        )}
      </div>

      {viewMode === 'agenda' ? (
        <KanbanAgenda
          lang={lang}
          content={filteredContent}
          stages={stages}
          users={users}
          onOpenDetail={onOpenDetail}
          onNewContent={onNewContent}
        />
      ) : (
        <>
          {/* Mobile Stage Tabs */}
          <div className="flex lg:hidden bg-gray-100 p-1 rounded-2xl overflow-x-auto no-scrollbar shrink-0">
            {stages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => {
                  setActiveStageId(stage.id);
                  const el = document.getElementById(`column-${stage.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
                  activeStageId === stage.id 
                    ? "bg-white text-green-700 shadow-sm" 
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                {isRtl ? (stage.nameAr || stage.name) : stage.name}
                <span className="bg-gray-200 text-gray-500 text-[8px] px-1.5 rounded-full ml-1">
                  {filteredContent.filter(c => c.stageId === stage.id || (!c.stageId && c.status === stage.status)).length}
                </span>
              </button>
            ))}
          </div>

          {/* Kanban Board */}
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar w-full">
              <SortableContext items={stages.map(s => s.id)} strategy={horizontalListSortingStrategy}>
                <div className={cn("flex gap-6 h-full min-w-max pb-2", isRtl && "flex-row-reverse")}>
                  {stages.map((stage) => (
                    <KanbanColumn 
                      key={stage.id}
                      stage={stage}
                      filteredContent={filteredContent}
                      editingStage={editingStage}
                      setEditingStage={setEditingStage}
                      newStageName={newStageName}
                      setNewStageName={setNewStageName}
                      handleRenameStage={handleRenameStage}
                      handleDeleteStage={handleDeleteStage}
                      onOpenDetail={onOpenDetail}
                      isRtl={isRtl}
                      t={t}
                      onNewContent={onNewContent}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>

            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}>
              {activeItem ? (
                <div className="bg-white p-4 rounded-2xl border-2 border-green-500 shadow-xl w-80 rotate-3 opacity-90">
                  <h4 className="font-bold text-sm mb-2">{activeItem.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2">{activeItem.description || activeItem.caption}</p>
                </div>
              ) : activeId && stages.find(s => s.id === activeId) ? (
                <div className="w-80 h-32 bg-gray-200 rounded-[2rem] border-2 border-dashed border-gray-300 opacity-50 flex items-center justify-center">
                   <span className="font-bold text-gray-400">{stages.find(s => s.id === activeId)?.name}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}
    </div>
  );
};
