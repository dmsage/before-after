'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
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
  IconButton,
} from '@mui/material';
import { CloudUpload, Check, Crop, Close } from '@mui/icons-material';
import { validateImageType, getAcceptedTypes, generateImageId, formatFileSize, compressImage, isHeicFile, convertHeicToJpeg } from '@/lib/imageUtils';
import { compressCroppedImage, blobToDataURL, CropArea } from '@/lib/cropUtils';
import { saveImage } from '@/lib/storage';
import { getTodayDate } from '@/lib/dateUtils';
import { ProgressImage, BodyMeasurements, CropSettings } from '@/types';
import MeasurementsInput from './MeasurementsInput';
import ImageCropper from './ImageCropper';

interface UploadFormProps {
  onUploadSuccess?: () => void;
}

interface PendingFile {
  file: File;
  preview: string;
}

export default function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropSettings, setCropSettings] = useState<CropSettings | null>(null);
  const [date, setDate] = useState(getTodayDate());
  const [measurements, setMeasurements] = useState<BodyMeasurements>({});
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: File[]) => {
    setError(null);
    setSuccess(false);
    setUploadCount(0);

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    for (const file of files) {
      if (validateImageType(file)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    }

    if (invalidFiles.length > 0) {
      setError(`Invalid file type(s): ${invalidFiles.join(', ')}. Accepted: JPG, PNG, WebP, HEIC`);
    }

    if (validFiles.length === 0) return;

    setIsConverting(true);
    const newPendingFiles: PendingFile[] = [];

    for (const file of validFiles) {
      let processedFile = file;

      // Convert HEIC to JPEG if needed
      if (isHeicFile(file)) {
        try {
          const jpegBlob = await convertHeicToJpeg(file);
          processedFile = new File(
            [jpegBlob],
            file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
            { type: 'image/jpeg' }
          );
        } catch (err) {
          setError(`Failed to convert ${file.name}. Skipping.`);
          continue;
        }
      }

      // Read file as data URL for preview
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(processedFile);
      });

      newPendingFiles.push({ file: processedFile, preview });
    }

    setIsConverting(false);
    setPendingFiles((prev) => [...prev, ...newPendingFiles]);

    // Reset cropping state when adding new files
    setCroppedImage(null);
    setCroppedPreview(null);
    setCropSettings(null);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenCropper = () => {
    if (pendingFiles.length === 1) {
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
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    setError(null);
    setUploadCount(0);

    try {
      // Filter out empty measurements
      const filteredMeasurements = Object.fromEntries(
        Object.entries(measurements).filter(([, v]) => v !== undefined && v !== null)
      ) as BodyMeasurements;

      let successCount = 0;

      for (let i = 0; i < pendingFiles.length; i++) {
        const { file, preview } = pendingFiles[i];

        let data: string;
        let size: number;
        let mimeType: string;

        // For single file with crop, use cropped image
        if (pendingFiles.length === 1 && croppedImage) {
          const result = await compressCroppedImage(croppedImage);
          data = result.data;
          size = result.size;
          mimeType = 'image/jpeg';
        } else {
          // Use original image without cropping
          const result = await compressImage(file);
          data = result.data;
          size = result.size;
          mimeType = result.mimeType;
        }

        const image: ProgressImage = {
          id: generateImageId(),
          imageData: data,
          date,
          uploadTimestamp: Date.now() + i, // Ensure unique timestamps
          mimeType,
          fileName: file.name,
          fileSize: size,
          // Only apply measurements to first image if multiple
          ...(i === 0 && Object.keys(filteredMeasurements).length > 0 && { measurements: filteredMeasurements }),
          ...(pendingFiles.length === 1 && croppedImage && {
            originalImageData: preview,
            cropSettings: cropSettings || undefined,
          }),
        };

        await saveImage(image);
        successCount++;
        setUploadCount(successCount);
      }

      setSuccess(true);
      setPendingFiles([]);
      setCroppedImage(null);
      setCroppedPreview(null);
      setCropSettings(null);
      setMeasurements({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setPendingFiles([]);
    setCroppedImage(null);
    setCroppedPreview(null);
    setCropSettings(null);
    setMeasurements({});
    setError(null);
    setSuccess(false);
    setUploadCount(0);
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
              {uploadCount === 1 ? 'Photo uploaded successfully!' : `${uploadCount} photos uploaded successfully!`}
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

          <Box
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            sx={{
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'divider',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              bgcolor: isDragging ? 'action.hover' : 'transparent',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept={getAcceptedTypes()}
              onChange={handleFileSelect}
              ref={fileInputRef}
              style={{ display: 'none' }}
              id="image-upload"
              multiple
            />
            {isConverting ? (
              <>
                <CircularProgress size={48} sx={{ mb: 1 }} />
                <Typography variant="body1" color="primary.main">
                  Processing images...
                </Typography>
              </>
            ) : (
              <>
                <CloudUpload sx={{ fontSize: 48, color: isDragging ? 'primary.main' : 'text.secondary', mb: 1 }} />
                <Typography variant="body1" color={isDragging ? 'primary.main' : 'text.secondary'}>
                  {isDragging ? 'Drop images here' : 'Drag & drop images here'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  or click to select (JPG, PNG, WebP, HEIC)
                </Typography>
              </>
            )}
          </Box>

          {pendingFiles.length > 0 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {pendingFiles.length === 1
                    ? croppedPreview ? 'Cropped Preview:' : 'Preview:'
                    : `${pendingFiles.length} photos selected:`}
                </Typography>
                {pendingFiles.length === 1 && (
                  <Button
                    size="small"
                    startIcon={<Crop />}
                    onClick={handleOpenCropper}
                    variant="outlined"
                  >
                    {croppedPreview ? 'Re-crop' : 'Crop'}
                  </Button>
                )}
              </Stack>
              {pendingFiles.length === 1 ? (
                <Box>
                  <Box
                    component="img"
                    src={croppedPreview || pendingFiles[0].preview}
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
                  <Typography variant="caption" color="text.secondary">
                    {pendingFiles[0].file.name} ({formatFileSize(pendingFiles[0].file.size)})
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 1,
                  }}
                >
                  {pendingFiles.map((pf, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: 1,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box
                        component="img"
                        src={pf.preview}
                        alt={`Preview ${index + 1}`}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeFile(index)}
                        sx={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.7)',
                          },
                          padding: 0.5,
                        }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          px: 0.5,
                          py: 0.25,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {pf.file.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={pendingFiles.length === 0 || isUploading}
              startIcon={isUploading ? <CircularProgress size={20} /> : <Check />}
              fullWidth
            >
              {isUploading
                ? `Uploading${uploadCount > 0 ? ` (${uploadCount}/${pendingFiles.length})` : '...'}`
                : pendingFiles.length <= 1
                  ? 'Save Photo'
                  : `Save ${pendingFiles.length} Photos`}
            </Button>
            {pendingFiles.length > 0 && (
              <Button variant="outlined" onClick={handleReset}>
                Clear
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>

      {showCropper && pendingFiles.length === 1 && (
        <ImageCropper
          imageSrc={pendingFiles[0].preview}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </Card>
  );
}
