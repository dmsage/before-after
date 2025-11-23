import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ProgressImage, ExportData, ImageMetadata } from '@/types';

interface WeightTrackerDB extends DBSchema {
  images: {
    key: string;
    value: ProgressImage;
    indexes: { 'by-date': string; 'by-upload': number };
  };
}

const DB_NAME = 'weight-tracker-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<WeightTrackerDB>> | null = null;

function getDB(): Promise<IDBPDatabase<WeightTrackerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<WeightTrackerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const imageStore = db.createObjectStore('images', { keyPath: 'id' });
        imageStore.createIndex('by-date', 'date');
        imageStore.createIndex('by-upload', 'uploadTimestamp');
      },
    });
  }
  return dbPromise;
}

export async function saveImage(image: ProgressImage): Promise<void> {
  const db = await getDB();
  await db.put('images', image);
}

export async function getImage(id: string): Promise<ProgressImage | undefined> {
  const db = await getDB();
  return db.get('images', id);
}

export async function getAllImages(): Promise<ProgressImage[]> {
  const db = await getDB();
  return db.getAll('images');
}

export async function getImagesByDateRange(
  startDate: string,
  endDate: string
): Promise<ProgressImage[]> {
  const db = await getDB();
  const range = IDBKeyRange.bound(startDate, endDate);
  return db.getAllFromIndex('images', 'by-date', range);
}

export async function deleteImage(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('images', id);
}

export async function deleteAllImages(): Promise<void> {
  const db = await getDB();
  await db.clear('images');
}

export async function getImageCount(): Promise<number> {
  const db = await getDB();
  return db.count('images');
}

export async function getImageMetadata(): Promise<ImageMetadata[]> {
  const images = await getAllImages();
  return images.map(({ id, date, uploadTimestamp, fileName, fileSize }) => ({
    id,
    date,
    uploadTimestamp,
    fileName,
    fileSize,
  }));
}

export async function exportData(): Promise<ExportData> {
  const images = await getAllImages();
  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    images,
  };
}

export async function importData(data: ExportData): Promise<number> {
  if (!data.version || !data.images || !Array.isArray(data.images)) {
    throw new Error('Invalid export file format');
  }

  const db = await getDB();
  const tx = db.transaction('images', 'readwrite');

  let importedCount = 0;
  for (const image of data.images) {
    if (image.id && image.imageData && image.date) {
      await tx.store.put(image);
      importedCount++;
    }
  }

  await tx.done;
  return importedCount;
}

export async function getClosestImageToDate(
  targetDate: string,
  excludeId?: string
): Promise<ProgressImage | null> {
  const images = await getAllImages();
  const targetTime = new Date(targetDate).getTime();

  let closest: ProgressImage | null = null;
  let smallestDiff = Infinity;

  for (const image of images) {
    if (excludeId && image.id === excludeId) continue;

    const imageTime = new Date(image.date).getTime();
    const diff = Math.abs(imageTime - targetTime);

    if (diff < smallestDiff) {
      smallestDiff = diff;
      closest = image;
    }
  }

  return closest;
}

export async function findImageByDateOffset(
  baseDate: string,
  daysOffset: number,
  excludeId?: string
): Promise<ProgressImage | null> {
  const targetDate = new Date(baseDate);
  targetDate.setDate(targetDate.getDate() - daysOffset);
  const targetDateStr = targetDate.toISOString().split('T')[0];

  return getClosestImageToDate(targetDateStr, excludeId);
}
