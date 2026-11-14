import { initializeApp, getApps } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize storage safely
let storage: any = null;
try {
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  if (firebaseConfig.storageBucket) {
    storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);
  }
} catch (err) {
  console.warn('Firebase Storage initialization warning:', err);
}

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface UploadResult {
  url: string;
  name: string;
  size: string;
  type: 'Image' | 'Video' | 'Document' | 'Link';
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function detectFileType(file: File): 'Image' | 'Video' | 'Document' {
  if (file.type.startsWith('image/')) return 'Image';
  if (file.type.startsWith('video/')) return 'Video';
  return 'Document';
}

/**
 * Upload a file to Firebase Storage if available, with Data URL fallback for local / offline mode.
 */
export async function uploadMediaFile(
  file: File, 
  folder = 'materials',
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  const fileType = detectFileType(file);
  const formattedSize = formatBytes(file.size);
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${Date.now()}_${cleanName}`;

  if (storage) {
    try {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise<UploadResult>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(Math.round(progress));
          },
          (error) => {
            console.warn('Firebase storage upload failed, falling back to local object preview:', error);
            // Fallback to local DataURL
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                url: reader.result as string,
                name: file.name,
                size: formattedSize,
                type: fileType,
              });
            };
            reader.onerror = () => reject(error);
            reader.readAsDataURL(file);
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              url: downloadUrl,
              name: file.name,
              size: formattedSize,
              type: fileType,
            });
          }
        );
      });
    } catch (err) {
      console.warn('Direct upload error, falling back to DataURL:', err);
    }
  }

  // Fallback to Data URL for instant browser preview
  return new Promise<UploadResult>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (onProgress) onProgress(100);
      resolve({
        url: reader.result as string,
        name: file.name,
        size: formattedSize,
        type: fileType,
      });
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}
