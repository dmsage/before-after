export interface BodyMeasurements {
  chest?: number; // Bust or chest
  waist?: number; // Narrowest point
  belly?: number; // Around the navel
  hips?: number; // Widest point
  thigh?: number; // Thickest point
  calf?: number;
  upperArm?: number; // Around the bicep
  shoulders?: number; // Widest part
}

export interface CropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
  aspectRatio: number | null;
}

export interface ProgressImage {
  id: string;
  imageData: string; // Base64 encoded image (cropped)
  date: string; // ISO date string (YYYY-MM-DD)
  uploadTimestamp: number; // Unix timestamp
  mimeType: string;
  fileName: string;
  fileSize: number; // Size in bytes after compression
  measurements?: BodyMeasurements;
  originalImageData?: string; // Original image for re-cropping
  cropSettings?: CropSettings;
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
