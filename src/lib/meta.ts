import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface MetaConfig {
  pageId: string;
  pageName?: string;
  pagePicture?: string;
  accessToken: string;
  igUserId?: string;
  igUsername?: string;
  lastSyncedAt?: string;
  status: 'connected' | 'disconnected' | 'error';
  followersCount?: number;
}

export interface MetaTestResult {
  success: boolean;
  pageId?: string;
  pageName?: string;
  pictureUrl?: string;
  followersCount?: number;
  instagramAccount?: {
    id: string;
    username: string;
    followersCount?: number;
  };
  error?: string;
}

export interface MetaSyncResult {
  success: boolean;
  metricsCount: number;
  syncedWeeklyMetrics: any[];
  error?: string;
  summary?: {
    totalImpressions: number;
    totalEngagedUsers: number;
    followersCount: number;
    postCount: number;
  };
}

const STORAGE_KEY = 'cropsa_meta_config';

/**
 * Load Meta configuration from Firestore with fallback to LocalStorage
 */
export async function loadMetaConfig(): Promise<MetaConfig | null> {
  try {
    // Try Firestore integrations collection
    const integrationRef = doc(db, 'integrations', 'meta');
    const snap = await getDoc(integrationRef);
    if (snap.exists()) {
      const data = snap.data() as MetaConfig;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }

    // Try settings collection fallback
    const settingRef = doc(db, 'settings', 'meta_integration');
    const settingSnap = await getDoc(settingRef);
    if (settingSnap.exists()) {
      const data = settingSnap.data() as MetaConfig;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Failed to load Meta config from Firestore, falling back to local storage:', err);
  }

  // Fallback to local storage
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      return JSON.parse(local);
    }
  } catch (err) {
    console.error('Error parsing local Meta config:', err);
  }

  return null;
}

/**
 * Save Meta configuration to Firestore and LocalStorage
 */
export async function saveMetaConfig(config: MetaConfig): Promise<void> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

  try {
    const integrationRef = doc(db, 'integrations', 'meta');
    await setDoc(integrationRef, {
      ...config,
      provider: 'meta',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore integration save failed, trying settings doc:', err);
    try {
      const settingRef = doc(db, 'settings', 'meta_integration');
      await setDoc(settingRef, {
        ...config,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (nestedErr) {
      console.warn('Failed to persist Meta config to Firestore:', nestedErr);
    }
  }
}

/**
 * Test Meta Graph API connection for a given Page ID and Access Token
 */
export async function testMetaConnection(pageId: string, accessToken: string): Promise<MetaTestResult> {
  const cleanPageId = pageId.trim();
  const cleanToken = accessToken.trim();

  if (!cleanPageId || !cleanToken) {
    return {
      success: false,
      error: 'يرجى إدخال معرف الصفحة (Page ID) ومفتاح الوصول (Page Access Token).'
    };
  }

  try {
    // Attempt via backend proxy first
    const res = await fetch('/api/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test',
        pageId: cleanPageId,
        accessToken: cleanToken
      })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        pageId: data.id || cleanPageId,
        pageName: data.name,
        pictureUrl: data.picture?.data?.url,
        followersCount: data.followers_count || data.fan_count || 0,
        instagramAccount: data.instagram_business_account ? {
          id: data.instagram_business_account.id,
          username: data.instagram_business_account.username || data.instagram_business_account.name,
          followersCount: data.instagram_business_account.followers_count
        } : undefined
      };
    }

    const errJson = await res.json().catch(() => null);
    const msg = errJson?.error?.message || errJson?.error || `فشل الاتصال: رمز الخطأ ${res.status}`;
    return { success: false, error: msg };
  } catch (clientErr: any) {
    // If backend proxy fails, try direct fetch
    try {
      const directUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(cleanPageId)}?fields=id,name,fan_count,followers_count,picture{url},instagram_business_account{id,username,followers_count}&access_token=${encodeURIComponent(cleanToken)}`;
      const directRes = await fetch(directUrl);
      const data = await directRes.json();

      if (data.error) {
        return {
          success: false,
          error: data.error.message || 'فشل التحقق من صحة مفتاح الوصول من Meta.'
        };
      }

      return {
        success: true,
        pageId: data.id || cleanPageId,
        pageName: data.name,
        pictureUrl: data.picture?.data?.url,
        followersCount: data.followers_count || data.fan_count || 0,
        instagramAccount: data.instagram_business_account ? {
          id: data.instagram_business_account.id,
          username: data.instagram_business_account.username,
          followersCount: data.instagram_business_account.followers_count
        } : undefined
      };
    } catch (fbErr: any) {
      return {
        success: false,
        error: clientErr.message || fbErr.message || 'تعذر الاتصال بـ Meta Graph API. تأكد من صحة المفتاح واتصالك بالإنترنت.'
      };
    }
  }
}

/**
 * Fetch live insights and format them into weekly metrics compatible with Analytics.tsx
 */
export async function fetchMetaInsights(
  pageId: string, 
  accessToken: string, 
  igUserId?: string
): Promise<MetaSyncResult> {
  const cleanPageId = pageId.trim();
  const cleanToken = accessToken.trim();

  try {
    const res = await fetch('/api/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync_insights',
        pageId: cleanPageId,
        accessToken: cleanToken,
        igUserId: igUserId?.trim()
      })
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }

    const errJson = await res.json().catch(() => null);
    throw new Error(errJson?.error?.message || errJson?.error || `فشل جلب الإحصائيات (رمز ${res.status})`);
  } catch (error: any) {
    console.error('Error in fetchMetaInsights:', error);
    return {
      success: false,
      metricsCount: 0,
      syncedWeeklyMetrics: [],
      error: error.message || 'حدث خطأ أثناء مزامنة إحصائيات Meta Graph API'
    };
  }
}
