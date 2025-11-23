const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 500 * 1024; // 500KB target
const MAX_DIMENSION = 1920; // Max width or height

export function validateImageType(file: File): boolean {
  // Check by MIME type
  if (ACCEPTED_TYPES.includes(file.type)) {
    return true;
  }
  // Also check by file extension for HEIC files (some browsers don't set MIME type)
  const extension = file.name.toLowerCase().split('.').pop();
  return extension === 'heic' || extension === 'heif';
}

export function getAcceptedTypes(): string {
  return ACCEPTED_TYPES.join(',') + ',.heic,.heif';
}

export function isHeicFile(file: File): boolean {
  const extension = file.name.toLowerCase().split('.').pop();
  return file.type === 'image/heic' || file.type === 'image/heif' || extension === 'heic' || extension === 'heif';
}

export async function convertHeicToJpeg(file: File): Promise<Blob> {
  // Dynamically import heic2any to avoid SSR issues
  const heic2any = (await import('heic2any')).default;

  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.9,
  });

  // heic2any can return a single blob or array of blobs
  if (Array.isArray(result)) {
    return result[0];
  }
  return result;
}

export async function compressImage(
  file: File,
  maxSize: number = MAX_FILE_SIZE
): Promise<{ data: string; mimeType: string; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down if necessary
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = (height / width) * MAX_DIMENSION;
            width = MAX_DIMENSION;
          } else {
            width = (width / height) * MAX_DIMENSION;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels to meet size target
        let quality = 0.9;
        let result = canvas.toDataURL('image/jpeg', quality);

        while (result.length > maxSize * 1.37 && quality > 0.1) {
          // 1.37 accounts for base64 overhead
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }

        // Extract base64 size
        const base64Length = result.split(',')[1]?.length || 0;
        const sizeInBytes = Math.round((base64Length * 3) / 4);

        resolve({
          data: result,
          mimeType: 'image/jpeg',
          size: sizeInBytes,
        });
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}
