export type ContentStatus = 'Idea' | 'In Progress' | 'Ready' | 'Approved' | 'Scheduled' | 'Published' | 'Delayed' | 'Pending' | 'Review';
export type Platform = 'Facebook' | 'Instagram' | 'LinkedIn' | 'TikTok' | 'WhatsApp' | 'Other';
export type ContentType = 'Post' | 'Reel' | 'Story' | 'Video' | 'Image' | 'Carousel' | 'Hybrid';
export type Priority = 'High' | 'Normal' | 'Low';
export type ApprovalStage = 'Pending' | 'Approved' | 'Rejected';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dependsOn?: string;
}

export interface Comment {
  id: string;
  user: string;
  text: string;
  date: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  date: string;
}

export interface CustomKPI {
  id: string;
  name: string;
  target: string;
  current: string;
  platform: Platform | 'All';
  metric: 'posts' | 'engagement' | 'reach' | 'custom';
  progress: number;
}

export interface DashboardWidget {
  id: string;
  type: 'stats' | 'chart' | 'goals' | 'platforms' | 'kpis' | 'recent';
  title: string;
  visible: boolean;
  order: number;
}

export interface KanbanStage {
  id: string;
  name: string;
  nameAr?: string;
  status: ContentStatus;
  color: string;
  order?: number;
}

export interface ContentItem {
  id: string;
  week?: string;
  title: string;
  platforms: Platform[];
  type: ContentType;
  caption: string;
  details?: string;
  description?: string;
  mediaUrl?: string;
  status: ContentStatus;
  stageId?: string;
  assignedTo: string[];
  createdBy: string;
  dueDate: string;
  publishDate?: string;
  approvalStatus: ApprovalStage;
  priority: Priority;
  objective?: string;
  notes?: string;
  paid?: boolean;
  tasks: Task[];
  comments?: Comment[];
  attachments?: Attachment[];
  labels?: string[];
  results?: Attachment[];
  preparationDate?: string;
  isExternal?: boolean;
  externalUrl?: string;
  tuv?: string;
  scheduledInPublishing?: boolean;
  position?: number;
}

export interface AgriEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  recommendation: 'Facebook' | 'LinkedIn' | 'Both';
  category: 'National' | 'Agricultural' | 'Religious';
  alertAheadDays?: number;
  preparationDate?: string;
}

export interface MaterialItem {
  id: string;
  name: string;
  type: 'Image' | 'Video' | 'Document' | 'Link';
  url: string;
  addedDate: string;
  size?: string;
  folderId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Content Manager' | 'Content Creator' | 'Designer';
  avatar?: string;
  permissions: string[];
  lastLogin?: string;
}

export interface EmailRule {
  id: string;
  trigger: string;
  subject: string;
  body: string;
  active: boolean;
  recipients?: string[];
  frequency?: string;
}

export interface WeatherData {
  governorate: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  risk: string;
  advice: string;
  adviceAr?: string;
  forecast: { day: string; temp: number; condition: string }[];
}

export interface AnalyticsMetric {
  id: string;
  name: string;
  platform: Platform;
  value: number;
  timeframe: 'Daily' | 'Weekly' | 'Monthly' | 'Custom';
  dateRange?: { start: string; end: string };
}

export interface MarketingIdea {
  id: string;
  title: string;
  description: string;
  labels: string[];
  platforms: Platform[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'link' | 'none';
  preferredDate?: string;
  preferredSeason?: string;
  status: 'active' | 'approved' | 'archived';
  createdBy: string;
  createdAt: string;
  promotedToContentId?: string;
  promotedWeek?: string;
  promotedAt?: string;
  votes?: number;
}

export type Language = 'en' | 'ar';
