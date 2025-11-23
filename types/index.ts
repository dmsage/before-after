export interface ProgressImage {
  id: string;
  imageData: string; // Base64 encoded image
  date: string; // ISO date string (YYYY-MM-DD)
  uploadTimestamp: number; // Unix timestamp
  mimeType: string;
  fileName: string;
  fileSize: number; // Size in bytes after compression
}

export interface ImageMetadata {
  id: string;
  date: string;
  uploadTimestamp: number;
  fileName: string;
  fileSize: number;
}

export interface ComparisonPair {
  image1: ProgressImage | null;
  image2: ProgressImage | null;
}

export interface ExportData {
  version: string;
  exportDate: string;
  images: ProgressImage[];
}

export type SortOrder = 'newest' | 'oldest';

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export interface QuickCompareOption {
  label: string;
  days: number;
}
