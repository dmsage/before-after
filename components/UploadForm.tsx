'use client';

import { useState, useRef, ChangeEvent } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import { CloudUpload, Check, Crop } from '@mui/icons-material';
import { validateImageType, getAcceptedTypes, generateImageId, formatFileSize, compressImage } from '@/lib/imageUtils';
import { compressCroppedImage, blobToDataURL, CropArea } from '@/lib/cropUtils';
import { saveImage } from '@/lib/storage';
import { getTodayDate } from '@/lib/dateUtils';
import { ProgressImage, BodyMeasurements, CropSettings } from '@/types';
import MeasurementsInput from './MeasurementsInput';
import ImageCropper from './ImageCropper';

interface UploadFormProps {
  onUploadSuccess?: () => void;
}

export default function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropSettings, setCropSettings] = useState<CropSettings | null>(null);
  const [date, setDate] = useState(getTodayDate());
  const [measurements, setMeasurements] = useState<BodyMeasurements>({});
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{ original: number; compressed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setSuccess(false);
    setCompressionInfo(null);

    if (!file) return;

    if (!validateImageType(file)) {
      setError('Please select a valid image file (JPG, PNG, or WebP)');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setOriginalImage(imageData);
      // Don't auto-open cropper - just show preview
      setCroppedImage(null);
      setCroppedPreview(null);
      setCropSettings(null);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCropper = () => {
    if (originalImage) {
      setShowCropper(true);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob, cropArea: CropArea) => {
    setCroppedImage(croppedBlob);
    const preview = await blobToDataURL(croppedBlob);
    setCroppedPreview(preview);
    setCropSettings({
      x: cropArea.x,
      y: cropArea.y,
      width: cropArea.width,
      height: cropArea.height,
      zoom: 1,
      aspectRatio: null,
    });
    setShowCropper(false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      let data: string;
      let size: number;
      let mimeType: string;

      if (croppedImage) {
        // Use cropped image
        const result = await compressCroppedImage(croppedImage);
        data = result.data;
        size = result.size;
        mimeType = 'image/jpeg';
      } else {
        // Use original image without cropping
        const result = await compressImage(selectedFile);
        data = result.data;
        size = result.size;
        mimeType = result.mimeType;
      }

      // Filter out empty measurements
      const filteredMeasurements = Object.fromEntries(
        Object.entries(measurements).filter(([, v]) => v !== undefined && v !== null)
      ) as BodyMeasurements;

      const image: ProgressImage = {
        id: generateImageId(),
        imageData: data,
        date,
        uploadTimestamp: Date.now(),
        mimeType,
        fileName: selectedFile.name,
        fileSize: size,
        ...(Object.keys(filteredMeasurements).length > 0 && { measurements: filteredMeasurements }),
        ...(croppedImage && {
          originalImageData: originalImage || undefined,
          cropSettings: cropSettings || undefined,
        }),
      };

      await saveImage(image);

      setCompressionInfo({
        original: selectedFile.size,
        compressed: size,
      });

      setSuccess(true);
      setSelectedFile(null);
      setOriginalImage(null);
      setCroppedImage(null);
      setCroppedPreview(null);
      setCropSettings(null);
      setMeasurements({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setOriginalImage(null);
    setCroppedImage(null);
    setCroppedPreview(null);
    setCropSettings(null);
    setMeasurements({});
    setError(null);
    setSuccess(false);
    setCompressionInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h6">Upload Progress Photo</Typography>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" onClose={() => setSuccess(false)}>
              Photo uploaded successfully!
              {compressionInfo && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Compressed from {formatFileSize(compressionInfo.original)} to {formatFileSize(compressionInfo.compressed)}
                </Typography>
              )}
            </Alert>
          )}

          <TextField
            type="date"
            label="Photo Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />

          <MeasurementsInput value={measurements} onChange={setMeasurements} />

          <Box>
            <input
              type="file"
              accept={getAcceptedTypes()}
              onChange={handleFileSelect}
              ref={fileInputRef}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload">
              <Button
                component="span"
                variant="outlined"
                startIcon={<CloudUpload />}
                fullWidth
              >
                Select Image
              </Button>
            </label>
          </Box>

          {originalImage && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {croppedPreview ? 'Cropped Preview:' : 'Preview:'}
                </Typography>
                <Button
                  size="small"
                  startIcon={<Crop />}
                  onClick={handleOpenCropper}
                  variant="outlined"
                >
                  {croppedPreview ? 'Re-crop' : 'Crop'}
                </Button>
              </Stack>
              <Box
                component="img"
                src={croppedPreview || originalImage}
                alt="Preview"
                sx={{
                  width: '100%',
                  maxHeight: 400,
                  objectFit: 'contain',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
              {selectedFile && (
                <Typography variant="caption" color="text.secondary">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </Typography>
              )}
            </Box>
          )}

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              startIcon={isUploading ? <CircularProgress size={20} /> : <Check />}
              fullWidth
            >
              {isUploading ? 'Uploading...' : 'Save Photo'}
            </Button>
            {originalImage && (
              <Button variant="outlined" onClick={handleReset}>
                Clear
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>

      {showCropper && originalImage && (
        <ImageCropper
          imageSrc={originalImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </Card>
  );
}
